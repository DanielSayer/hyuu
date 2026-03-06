import { db } from "@hyuu/db";

import { goalCadenceSchema, goalTypeSchema } from "../../schemas/goals";
import { startOfMonthUtc, startOfWeekUtc } from "../../utils";
import {
  getGoalProgressRatio,
  isGoalCompleted,
  toGoalDisplayValue,
} from "../../utils/goals";
import { ensureUserWeekStartDay } from "../user-settings/ensure-week-start-day";
import { computePeriodGoalMetrics } from "./goal-metrics-service";
import {
  computeCurrentWeeklyStreakWeeks,
  loadActiveWeeklyFrequencyStreakGoalId,
} from "./streaks";

export async function loadGoalsWithProgress({
  userId,
  now,
}: {
  userId: string;
  now: Date;
}) {
  const weekStartDay = await ensureUserWeekStartDay(userId);
  const weekStart = startOfWeekUtc(now, weekStartDay);
  const monthStart = startOfMonthUtc(now);
  const activeStreakGoalId =
    await loadActiveWeeklyFrequencyStreakGoalId(userId);
  const activeGoals = await db.query.goal.findMany({
    where: (table, operators) =>
      operators.and(
        operators.eq(table.userId, userId),
        operators.isNull(table.abandonedAt),
      ),
    orderBy: (table, operators) => [operators.asc(table.id)],
    columns: {
      id: true,
      goalType: true,
      cadence: true,
      targetValue: true,
    },
  });
  if (activeGoals.length === 0) {
    const archivedGoals = await db.query.goal.findMany({
      where: (table, operators) =>
        operators.and(
          operators.eq(table.userId, userId),
          operators.isNotNull(table.abandonedAt),
        ),
      orderBy: (table, operators) => [operators.desc(table.abandonedAt)],
      limit: 50,
      columns: {
        id: true,
        goalType: true,
        cadence: true,
        targetValue: true,
        abandonedAt: true,
      },
    });
    return {
      goals: [],
      history: archivedGoals.map((row) => ({
        kind: "archived" as const,
        goalId: row.id,
        goalType: row.goalType,
        cadence: row.cadence,
        targetValue: row.targetValue,
        abandonedAt: row.abandonedAt,
      })),
      weekStart,
      monthStart,
      weekStartDay,
    };
  }

  const progressRows = await db.query.goalProgress.findMany({
    where: (table, operators) =>
      operators.and(
        operators.eq(table.userId, userId),
        operators.or(
          operators.and(
            operators.eq(table.cadence, "weekly"),
            operators.eq(table.periodStartLocal, weekStart),
          ),
          operators.and(
            operators.eq(table.cadence, "monthly"),
            operators.eq(table.periodStartLocal, monthStart),
          ),
        ),
      ),
    columns: {
      goalId: true,
      cadence: true,
      currentValue: true,
      completedAt: true,
    },
  });
  const progressByGoalPeriod = new Map(
    progressRows.map((row) => [
      `${row.goalId}:${row.cadence}`,
      {
        currentValue: row.currentValue,
        completedAt: row.completedAt,
      },
    ]),
  );
  const missingGoals = activeGoals.filter(
    (activeGoal) =>
      !progressByGoalPeriod.has(`${activeGoal.id}:${activeGoal.cadence}`),
  );
  const missingMetrics = missingGoals.length;

  const weeklyMetrics =
    missingMetrics > 0
      ? await computePeriodGoalMetrics({
          userId,
          periodStart: weekStart,
          cadence: "weekly",
        })
      : null;
  const monthlyMetrics =
    missingMetrics > 0
      ? await computePeriodGoalMetrics({
          userId,
          periodStart: monthStart,
          cadence: "monthly",
        })
      : null;

  const goals = await Promise.all(
    activeGoals.flatMap((goal) => {
      const parsedGoalType = goalTypeSchema.safeParse(goal.goalType);
      const parsedCadence = goalCadenceSchema.safeParse(goal.cadence);
      if (!parsedGoalType.success || !parsedCadence.success) {
        return [];
      }

      const goalType = parsedGoalType.data;
      const cadence = parsedCadence.data;
      const progressRow = progressByGoalPeriod.get(`${goal.id}:${cadence}`);
      const fallbackMetrics =
        cadence === "weekly" ? weeklyMetrics : monthlyMetrics;
      const currentValue =
        progressRow?.currentValue ??
        (fallbackMetrics ? fallbackMetrics[goalType] : 0);
      const currentDisplayValue = toGoalDisplayValue(goalType, currentValue);
      const targetValue = goal.targetValue;
      const completedAt =
        progressRow?.completedAt ??
        (isGoalCompleted(goalType, currentValue, targetValue) ? now : null);
      const progressRatio = getGoalProgressRatio(
        goalType,
        currentValue,
        targetValue,
      );
      const isStreakGoal =
        activeStreakGoalId !== null &&
        goal.id === activeStreakGoalId &&
        goalType === "frequency" &&
        cadence === "weekly";
      return [
        (async () => ({
          id: goal.id,
          goalType,
          cadence,
          targetValue,
          currentValue: currentDisplayValue,
          progressRatio,
          completedAt,
          isStreakGoal,
          streak: isStreakGoal
            ? {
                currentWeeks: await computeCurrentWeeklyStreakWeeks({
                  goalId: goal.id,
                  currentWeekStart: weekStart,
                  includeCurrentWeek: completedAt !== null,
                }),
                periodRuns: currentValue,
                periodTargetRuns: targetValue,
              }
            : null,
        }))(),
      ];
    }),
  );

  goals.sort((a, b) => {
    if (a.isStreakGoal !== b.isStreakGoal) {
      return a.isStreakGoal ? -1 : 1;
    }
    if (a.progressRatio !== b.progressRatio) {
      return a.progressRatio - b.progressRatio;
    }
    return a.id - b.id;
  });

  const historyProgressRows = await db.query.goalProgress.findMany({
    where: (table, operators) => operators.eq(table.userId, userId),
    orderBy: (table, operators) => [operators.desc(table.periodStartLocal)],
    limit: 200,
    columns: {
      goalId: true,
      cadence: true,
      periodStartLocal: true,
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
  });
  const failedHistory = historyProgressRows
    .filter((row) => {
      if (row.completedAt !== null) {
        return false;
      }
      const periodBoundary = row.cadence === "weekly" ? weekStart : monthStart;
      return row.periodStartLocal < periodBoundary;
    })
    .map((row) => ({
      kind: "failed" as const,
      goalId: row.goalId,
      goalType: row.goal.goalType,
      cadence: row.cadence,
      periodStartLocal: row.periodStartLocal,
      targetValue: row.goal.targetValue,
      currentValue: toGoalDisplayValue(row.goal.goalType, row.currentValue),
      completedAt: row.completedAt,
    }));
  const archivedGoals = await db.query.goal.findMany({
    where: (table, operators) =>
      operators.and(
        operators.eq(table.userId, userId),
        operators.isNotNull(table.abandonedAt),
      ),
    orderBy: (table, operators) => [operators.desc(table.abandonedAt)],
    limit: 50,
    columns: {
      id: true,
      goalType: true,
      cadence: true,
      targetValue: true,
      abandonedAt: true,
    },
  });
  const archivedHistory = archivedGoals.map((row) => ({
    kind: "archived" as const,
    goalId: row.id,
    goalType: row.goalType,
    cadence: row.cadence,
    targetValue: row.targetValue,
    abandonedAt: row.abandonedAt,
  }));

  return {
    goals,
    history: [...failedHistory, ...archivedHistory],
    weekStart,
    monthStart,
    weekStartDay,
  };
}
