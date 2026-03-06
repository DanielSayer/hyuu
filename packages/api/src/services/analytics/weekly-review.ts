import { db } from "@hyuu/db";
import { startOfWeekUtc, toLocalDateTimeString } from "../../utils";
import {
  weeklyReviewResultSchema,
  type WeeklyReviewResult,
} from "../../schemas/weekly-review";
import { ensureUserWeekStartDay } from "../user-settings/ensure-week-start-day";
import {
  computeWeeklyHighlights,
  mapWeeklyReviewGoals,
  toPaceOrNull,
} from "./weekly-review-calculator";
import { markWeeklyReviewDelivered } from "./weekly-review-delivery-service";

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

  const goals = mapWeeklyReviewGoals(reviewWeekGoalProgressRows);
  const highlights = computeWeeklyHighlights(reviewWeekActivities);
  await markWeeklyReviewDelivered({
    userId,
    currentWeekStart,
    deliveredAt: now,
  });

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
    highlights,
  });
}
