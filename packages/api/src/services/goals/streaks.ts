import { eq } from "drizzle-orm";
import { db, goalStreak } from "@hyuu/db";
import { TRPCError } from "@trpc/server";

import { addWeeks } from "../../utils/goals";

export async function loadActiveWeeklyFrequencyStreakGoalId(userId: string) {
  const streak = await db.query.goalStreak.findFirst({
    where: (table, operators) =>
      operators.and(
        operators.eq(table.userId, userId),
        operators.isNull(table.endedAt),
      ),
    columns: {
      goalId: true,
    },
    with: {
      goal: {
        columns: {
          id: true,
          goalType: true,
          cadence: true,
          abandonedAt: true,
        },
      },
    },
  });
  if (!streak?.goal) {
    return null;
  }
  if (streak.goal.abandonedAt) {
    return null;
  }
  if (
    streak.goal.goalType !== "frequency" ||
    streak.goal.cadence !== "weekly"
  ) {
    return null;
  }
  return streak.goalId;
}

export async function assertCanEnableStreak({
  userId,
  goalId,
}: {
  userId: string;
  goalId: number;
}) {
  const existing = await db.query.goalStreak.findFirst({
    where: (table, operators) =>
      operators.and(
        operators.eq(table.userId, userId),
        operators.isNull(table.endedAt),
      ),
    columns: {
      goalId: true,
    },
  });
  if (existing && existing.goalId !== goalId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Only one active weekly frequency streak is allowed.",
    });
  }
}

export async function upsertGoalStreak({
  userId,
  goalId,
}: {
  userId: string;
  goalId: number;
}) {
  const existing = await db.query.goalStreak.findFirst({
    where: (table, operators) => operators.eq(table.goalId, goalId),
    columns: {
      id: true,
      endedAt: true,
    },
  });
  if (!existing) {
    await db.insert(goalStreak).values({
      goalId,
      userId,
    });
    return;
  }
  if (existing.endedAt === null) {
    return;
  }
  await db
    .update(goalStreak)
    .set({
      endedAt: null,
      updatedAt: new Date(),
    })
    .where(eq(goalStreak.id, existing.id));
}

export async function endGoalStreak({ goalId }: { goalId: number }) {
  const existing = await db.query.goalStreak.findFirst({
    where: (table, operators) =>
      operators.and(
        operators.eq(table.goalId, goalId),
        operators.isNull(table.endedAt),
      ),
    columns: {
      id: true,
    },
  });
  if (!existing) {
    return;
  }
  await db
    .update(goalStreak)
    .set({
      endedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(goalStreak.id, existing.id));
}

export async function computeCurrentWeeklyStreakWeeks({
  goalId,
  currentWeekStart,
  includeCurrentWeek,
}: {
  goalId: number;
  currentWeekStart: Date;
  includeCurrentWeek: boolean;
}) {
  const rows = await db.query.goalProgress.findMany({
    where: (table, operators) =>
      operators.and(
        operators.eq(table.goalId, goalId),
        operators.eq(table.cadence, "weekly"),
        operators.lte(table.periodStartLocal, currentWeekStart),
      ),
    orderBy: (table, operators) => [operators.desc(table.periodStartLocal)],
    limit: 156,
    columns: {
      periodStartLocal: true,
      completedAt: true,
    },
  });
  const byWeek = new Map(
    rows.map((row) => [
      row.periodStartLocal.toISOString(),
      row.completedAt !== null,
    ]),
  );
  const currentWeekKey = currentWeekStart.toISOString();
  let scanWeek =
    byWeek.get(currentWeekKey) || includeCurrentWeek
      ? currentWeekStart
      : addWeeks(currentWeekStart, -1);
  let streakWeeks = 0;
  while (streakWeeks < 156) {
    const key = scanWeek.toISOString();
    const completed = byWeek.get(key);
    if (!completed) {
      break;
    }
    streakWeeks += 1;
    scanWeek = addWeeks(scanWeek, -1);
  }
  return streakWeeks;
}
