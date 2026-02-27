import { goalProgress, db } from "@hyuu/db";
import { and, eq } from "drizzle-orm";

import { isRunActivityType, startOfMonthUtc, startOfWeekUtc } from "../utils";

type GoalMetricKey = "distance" | "frequency" | "pace";
type GoalCadence = "weekly" | "monthly";

function toGoalMetricKey(value: string): GoalMetricKey | null {
  if (value === "distance" || value === "frequency" || value === "pace") {
    return value;
  }
  return null;
}

function isGoalCompleted(
  goalType: GoalMetricKey,
  currentValue: number,
  targetValue: number,
) {
  if (goalType === "pace") {
    return currentValue > 0 && currentValue <= targetValue;
  }
  return currentValue >= targetValue;
}

async function recomputeGoalProgressForPeriod({
  userId,
  cadence,
  periodStart,
}: {
  userId: string;
  cadence: GoalCadence;
  periodStart: Date;
}) {
  const goals = await db.query.goal.findMany({
    where: (table, operators) =>
      operators.and(
        operators.eq(table.userId, userId),
        operators.isNull(table.abandonedAt),
        operators.eq(table.cadence, cadence),
      ),
    columns: {
      id: true,
      goalType: true,
      targetValue: true,
    },
  });

  await db
    .delete(goalProgress)
    .where(
      and(
        eq(goalProgress.userId, userId),
        eq(goalProgress.cadence, cadence),
        eq(goalProgress.periodStartLocal, periodStart),
      ),
    );

  if (goals.length === 0) {
    return;
  }

  const periodEnd = new Date(periodStart);
  if (cadence === "weekly") {
    periodEnd.setUTCDate(periodEnd.getUTCDate() + 7);
  } else {
    periodEnd.setUTCMonth(periodEnd.getUTCMonth() + 1);
  }

  const activityRows = await db.query.intervalsActivity.findMany({
    where: (table, operators) =>
      operators.and(
        operators.eq(table.userId, userId),
        operators.isNotNull(table.startDate),
        operators.gte(table.startDate, periodStart),
        operators.lt(table.startDate, periodEnd),
      ),
    columns: {
      type: true,
      distance: true,
      elapsedTime: true,
    },
  });

  let totalDistanceM = 0;
  let totalElapsedS = 0;
  let runCount = 0;

  for (const row of activityRows) {
    if (!isRunActivityType(row.type)) {
      continue;
    }
    runCount += 1;
    totalDistanceM += row.distance ?? 0;
    totalElapsedS += row.elapsedTime ?? 0;
  }

  const metrics: Record<GoalMetricKey, number> = {
    distance: totalDistanceM,
    frequency: runCount,
    pace:
      totalDistanceM > 0 && totalElapsedS > 0
        ? totalElapsedS / (totalDistanceM / 1000)
        : 0,
  };

  const now = new Date();
  const values = goals.flatMap((goalRow) => {
    const metricKey = toGoalMetricKey(goalRow.goalType);
    if (!metricKey) {
      return [];
    }
    const currentValue = metrics[metricKey];
    const completedAt = isGoalCompleted(
      metricKey,
      currentValue,
      goalRow.targetValue,
    )
      ? now
      : null;
    return [
      {
        goalId: goalRow.id,
        userId,
        cadence,
        periodStartLocal: periodStart,
        currentValue,
        completedAt,
        createdAt: now,
        updatedAt: now,
      },
    ];
  });
  if (values.length === 0) {
    return;
  }

  await db.insert(goalProgress).values(values);
}

export async function recomputeWeeklyGoalProgressForDates({
  userId,
  affectedDates,
  weekStartDay,
}: {
  userId: string;
  affectedDates: Date[];
  weekStartDay: 0 | 1;
}) {
  const weekStarts = new Set(
    affectedDates.map((date) =>
      startOfWeekUtc(date, weekStartDay).toISOString(),
    ),
  );
  const monthStarts = new Set(
    affectedDates.map((date) => startOfMonthUtc(date).toISOString()),
  );

  for (const weekStartIso of weekStarts) {
    await recomputeGoalProgressForPeriod({
      userId,
      cadence: "weekly",
      periodStart: new Date(weekStartIso),
    });
  }
  for (const monthStartIso of monthStarts) {
    await recomputeGoalProgressForPeriod({
      userId,
      cadence: "monthly",
      periodStart: new Date(monthStartIso),
    });
  }
}

export async function recomputeWeeklyGoalProgressForUser({
  userId,
  weekStartDay,
}: {
  userId: string;
  weekStartDay: 0 | 1;
}) {
  const activityRows = await db.query.intervalsActivity.findMany({
    where: (table, operators) =>
      operators.and(
        operators.eq(table.userId, userId),
        operators.isNotNull(table.startDate),
      ),
    columns: {
      startDate: true,
    },
  });
  const dates = activityRows.flatMap((row) =>
    row.startDate ? [row.startDate] : [],
  );
  if (dates.length === 0) {
    await db.delete(goalProgress).where(eq(goalProgress.userId, userId));
    return;
  }
  await recomputeWeeklyGoalProgressForDates({
    userId,
    affectedDates: dates,
    weekStartDay,
  });
}
