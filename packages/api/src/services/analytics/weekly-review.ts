import { db, userSettings, weeklyReviewDelivery } from "@hyuu/db";

import {
  computePaceSecPerKm,
  isRunActivityType,
  startOfWeekUtc,
  toLocalDateOrNull,
  toLocalDateTimeString,
} from "../../utils";
import { goalTypeSchema } from "../../schemas/goals";
import {
  weeklyReviewResultSchema,
  type WeeklyReviewResult,
} from "../../schemas/weekly-review";
import { getGoalProgressRatio, toGoalDisplayValue, toWeekStartDay } from "../../utils/goals";

async function ensureUserWeekStartDay(userId: string): Promise<0 | 1> {
  const settings = await db.query.userSettings.findFirst({
    where: (table, operators) => operators.eq(table.userId, userId),
    columns: { weekStartDay: true },
  });
  if (settings) {
    return toWeekStartDay(settings.weekStartDay);
  }
  await db
    .insert(userSettings)
    .values({
      userId,
      weekStartDay: 1,
    })
    .onConflictDoNothing();
  return 1;
}

function toUtcDayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function toPaceOrNull(value: number | null | undefined): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return null;
  }
  return value;
}

export async function getWeeklyReviewOnOpen(
  userId: string,
): Promise<WeeklyReviewResult> {
  const now = new Date();
  const weekStartDay = await ensureUserWeekStartDay(userId);
  const currentWeekStart = startOfWeekUtc(now, weekStartDay);

  const delivery = await db.query.weeklyReviewDelivery.findFirst({
    where: (table, operators) => operators.eq(table.userId, userId),
    columns: {
      lastDeliveredWeekStartLocal: true,
    },
  });

  if (
    delivery &&
    delivery.lastDeliveredWeekStartLocal.getTime() >= currentWeekStart.getTime()
  ) {
    return weeklyReviewResultSchema.parse({
      shouldShow: false,
      weekStartDay,
      period: null,
      totals: null,
      comparisonVsPriorWeek: null,
      goals: [],
      highlights: null,
    });
  }

  const reviewWeekStart = new Date(currentWeekStart);
  reviewWeekStart.setUTCDate(reviewWeekStart.getUTCDate() - 7);
  const reviewWeekEnd = new Date(currentWeekStart);
  const priorWeekStart = new Date(reviewWeekStart);
  priorWeekStart.setUTCDate(priorWeekStart.getUTCDate() - 7);

  const [
    reviewWeekRollup,
    priorWeekRollup,
    reviewWeekGoalProgressRows,
    reviewWeekActivities,
  ] = await Promise.all([
    db.query.runRollupWeekly.findFirst({
      where: (table, operators) =>
        operators.and(
          operators.eq(table.userId, userId),
          operators.eq(table.weekStartLocal, reviewWeekStart),
        ),
      columns: {
        totalDistanceM: true,
        runCount: true,
        totalElapsedS: true,
        avgPaceSecPerKm: true,
      },
    }),
    db.query.runRollupWeekly.findFirst({
      where: (table, operators) =>
        operators.and(
          operators.eq(table.userId, userId),
          operators.eq(table.weekStartLocal, priorWeekStart),
        ),
      columns: {
        totalDistanceM: true,
        runCount: true,
        totalElapsedS: true,
        avgPaceSecPerKm: true,
      },
    }),
    db.query.goalProgress.findMany({
      where: (table, operators) =>
        operators.and(
          operators.eq(table.userId, userId),
          operators.eq(table.cadence, "weekly"),
          operators.eq(table.periodStartLocal, reviewWeekStart),
        ),
      columns: {
        goalId: true,
        currentValue: true,
        completedAt: true,
      },
      with: {
        goal: {
          columns: {
            goalType: true,
            targetValue: true,
          },
        },
      },
    }),
    db.query.intervalsActivity.findMany({
      where: (table, operators) =>
        operators.and(
          operators.eq(table.userId, userId),
          operators.isNotNull(table.startDateLocal),
          operators.gte(
            table.startDateLocal,
            toLocalDateTimeString(reviewWeekStart),
          ),
          operators.lt(table.startDateLocal, toLocalDateTimeString(reviewWeekEnd)),
        ),
      columns: {
        type: true,
        distance: true,
        elapsedTime: true,
        startDateLocal: true,
      },
    }),
  ]);

  const totals = {
    distanceM: reviewWeekRollup?.totalDistanceM ?? 0,
    runCount: reviewWeekRollup?.runCount ?? 0,
    elapsedS: reviewWeekRollup?.totalElapsedS ?? 0,
    avgPaceSecPerKm: toPaceOrNull(reviewWeekRollup?.avgPaceSecPerKm),
  };
  const priorTotals = {
    distanceM: priorWeekRollup?.totalDistanceM ?? 0,
    runCount: priorWeekRollup?.runCount ?? 0,
    avgPaceSecPerKm: toPaceOrNull(priorWeekRollup?.avgPaceSecPerKm),
  };

  const dailyDistanceByDay = new Map<string, number>();
  let longestRunM = 0;
  let fastestRunPaceSecPerKm: number | null = null;

  for (const row of reviewWeekActivities) {
    if (!isRunActivityType(row.type)) {
      continue;
    }
    const distanceM = row.distance ?? 0;
    const elapsedS = row.elapsedTime ?? 0;
    const localStart = toLocalDateOrNull(row.startDateLocal);
    if (!localStart || distanceM <= 0) {
      continue;
    }
    const dayKey = toUtcDayKey(localStart);
    dailyDistanceByDay.set(dayKey, (dailyDistanceByDay.get(dayKey) ?? 0) + distanceM);
    if (distanceM > longestRunM) {
      longestRunM = distanceM;
    }
    const pace = computePaceSecPerKm({
      elapsedSeconds: elapsedS,
      distanceMeters: distanceM,
    });
    if (pace !== null && (fastestRunPaceSecPerKm === null || pace < fastestRunPaceSecPerKm)) {
      fastestRunPaceSecPerKm = pace;
    }
  }

  let bestDistanceDayM = 0;
  for (const value of dailyDistanceByDay.values()) {
    if (value > bestDistanceDayM) {
      bestDistanceDayM = value;
    }
  }

  const goals = reviewWeekGoalProgressRows.flatMap((row) => {
    const parsedGoalType = goalTypeSchema.safeParse(row.goal.goalType);
    if (!parsedGoalType.success) {
      return [];
    }
    const goalType = parsedGoalType.data;
    const completionRatio = getGoalProgressRatio(
      goalType,
      row.currentValue,
      row.goal.targetValue,
    );
    return [
      {
        goalId: row.goalId,
        goalType,
        targetValue: row.goal.targetValue,
        currentValue: toGoalDisplayValue(goalType, row.currentValue),
        completed: row.completedAt !== null,
        completionRatio: Number.isFinite(completionRatio)
          ? Math.max(0, completionRatio)
          : 0,
      },
    ];
  });

  await db
    .insert(weeklyReviewDelivery)
    .values({
      userId,
      lastDeliveredWeekStartLocal: currentWeekStart,
      lastDeliveredAt: now,
    })
    .onConflictDoUpdate({
      target: weeklyReviewDelivery.userId,
      set: {
        lastDeliveredWeekStartLocal: currentWeekStart,
        lastDeliveredAt: now,
        updatedAt: now,
      },
    });

  const highlights = {
    bestDistanceDayM: bestDistanceDayM > 0 ? bestDistanceDayM : undefined,
    longestRunM: longestRunM > 0 ? longestRunM : undefined,
    fastestRunPaceSecPerKm: fastestRunPaceSecPerKm ?? undefined,
  };
  const hasHighlights = Object.values(highlights).some((value) => value !== undefined);

  return weeklyReviewResultSchema.parse({
    shouldShow: true,
    weekStartDay,
    period: {
      reviewWeekStart,
      reviewWeekEnd,
    },
    totals,
    comparisonVsPriorWeek: {
      distanceMDelta: totals.distanceM - priorTotals.distanceM,
      runCountDelta: totals.runCount - priorTotals.runCount,
      paceSecPerKmDelta:
        totals.avgPaceSecPerKm !== null && priorTotals.avgPaceSecPerKm !== null
          ? totals.avgPaceSecPerKm - priorTotals.avgPaceSecPerKm
          : null,
    },
    goals,
    highlights: hasHighlights ? highlights : null,
  });
}
