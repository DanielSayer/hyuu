import { dashboardGoalProgressWeekly, db } from "@hyuu/db";
import { and, eq } from "drizzle-orm";

import { isRunActivityType, startOfWeekUtc } from "../utils";

type GoalMetricKey = "distance" | "time" | "activity_count" | "streak";

function toGoalMetricKey(value: string): GoalMetricKey | null {
  if (
    value === "distance" ||
    value === "time" ||
    value === "activity_count" ||
    value === "streak"
  ) {
    return value;
  }
  return null;
}

async function recomputeWeeklyGoalProgressForWeek({
  userId,
  weekStart,
}: {
  userId: string;
  weekStart: Date;
}) {
  const goals = await db.query.dashboardGoal.findMany({
    where: (table, operators) =>
      operators.and(
        operators.eq(table.userId, userId),
        operators.eq(table.isActive, true),
      ),
    columns: {
      id: true,
      goalType: true,
      targetValue: true,
    },
  });

  await db
    .delete(dashboardGoalProgressWeekly)
    .where(
      and(
        eq(dashboardGoalProgressWeekly.userId, userId),
        eq(dashboardGoalProgressWeekly.weekStartLocal, weekStart),
      ),
    );

  if (goals.length === 0) {
    return;
  }

  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 7);
  const activityRows = await db.query.intervalsActivity.findMany({
    where: (table, operators) =>
      operators.and(
        operators.eq(table.userId, userId),
        operators.isNotNull(table.startDate),
        operators.gte(table.startDate, weekStart),
        operators.lt(table.startDate, weekEnd),
      ),
    columns: {
      type: true,
      distance: true,
      elapsedTime: true,
      startDate: true,
    },
  });

  let totalDistanceM = 0;
  let totalElapsedS = 0;
  let runCount = 0;
  const activeDayKeys = new Set<string>();
  for (const row of activityRows) {
    if (!isRunActivityType(row.type)) {
      continue;
    }
    runCount += 1;
    totalDistanceM += row.distance ?? 0;
    totalElapsedS += row.elapsedTime ?? 0;
    if (row.startDate) {
      activeDayKeys.add(row.startDate.toISOString().slice(0, 10));
    }
  }

  const metrics: Record<GoalMetricKey, number> = {
    distance: totalDistanceM,
    time: totalElapsedS,
    activity_count: runCount,
    streak: activeDayKeys.size,
  };

  const now = new Date();
  const values = goals.flatMap((goal) => {
    const metricKey = toGoalMetricKey(goal.goalType);
    if (!metricKey) {
      return [];
    }
    const currentValue = metrics[metricKey];
    return [
      {
        goalId: goal.id,
        userId,
        weekStartLocal: weekStart,
        currentValue,
        isComplete: currentValue >= goal.targetValue,
        createdAt: now,
        updatedAt: now,
      },
    ];
  });
  if (values.length === 0) {
    return;
  }

  await db.insert(dashboardGoalProgressWeekly).values(values);
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
  for (const weekStartIso of weekStarts) {
    await recomputeWeeklyGoalProgressForWeek({
      userId,
      weekStart: new Date(weekStartIso),
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
  const dates = activityRows.flatMap((row) => (row.startDate ? [row.startDate] : []));
  if (dates.length === 0) {
    await db
      .delete(dashboardGoalProgressWeekly)
      .where(eq(dashboardGoalProgressWeekly.userId, userId));
    return;
  }
  await recomputeWeeklyGoalProgressForDates({
    userId,
    affectedDates: dates,
    weekStartDay,
  });
}
