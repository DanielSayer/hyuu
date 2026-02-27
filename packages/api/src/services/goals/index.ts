import { and, eq } from "drizzle-orm";
import { db, goal } from "@hyuu/db";
import { TRPCError } from "@trpc/server";

import { goalTypeSchema } from "../../schemas/goals";
import type {
  CreateGoalInput,
  UpdateGoalInput,
  ArchiveGoalInput,
} from "./types";
import { validateGoalTargetValue } from "../../utils/goals";
import { loadGoalsWithProgress } from "./progress";
import {
  assertCanEnableStreak,
  endGoalStreak,
  upsertGoalStreak,
} from "./streaks";

export async function listGoals(userId: string) {
  const data = await loadGoalsWithProgress({
    userId,
    now: new Date(),
  });
  return {
    weekStart: data.weekStart,
    weekStartDay: data.weekStartDay,
    goals: data.goals,
    history: data.history,
  };
}

export async function createGoal({
  userId,
  input,
}: {
  userId: string;
  input: CreateGoalInput;
}) {
  const targetValue = validateGoalTargetValue(
    input.goalType,
    input.targetValue,
  );
  const shouldTrackStreak = input.trackStreak === true;
  if (
    shouldTrackStreak &&
    (input.goalType !== "frequency" || input.cadence !== "weekly")
  ) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Streak is only supported for weekly frequency goals.",
    });
  }
  const now = new Date();
  const existing = await db.query.goal.findFirst({
    where: (table, operators) =>
      operators.and(
        operators.eq(table.userId, userId),
        operators.eq(table.goalType, input.goalType),
        operators.eq(table.cadence, input.cadence),
      ),
    columns: { id: true },
  });
  let goalId: number;

  if (existing) {
    goalId = existing.id;
    await db
      .update(goal)
      .set({
        targetValue,
        abandonedAt: null,
        updatedAt: now,
      })
      .where(and(eq(goal.id, existing.id), eq(goal.userId, userId)));
  } else {
    const [createdGoal] = await db
      .insert(goal)
      .values({
        userId,
        goalType: input.goalType,
        cadence: input.cadence,
        targetValue,
        createdAt: now,
        updatedAt: now,
      })
      .returning({ id: goal.id });
    if (!createdGoal) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create goal.",
      });
    }
    goalId = createdGoal.id;
  }

  if (shouldTrackStreak) {
    await assertCanEnableStreak({
      userId,
      goalId,
    });
    await upsertGoalStreak({
      userId,
      goalId,
    });
  }

  return loadGoalsWithProgress({
    userId,
    now,
  });
}

export async function updateGoal({
  userId,
  input,
}: {
  userId: string;
  input: UpdateGoalInput;
}) {
  const existing = await db.query.goal.findFirst({
    where: (table, operators) =>
      operators.and(
        operators.eq(table.id, input.id),
        operators.eq(table.userId, userId),
      ),
    columns: { id: true, goalType: true },
  });
  if (!existing) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Goal not found.",
    });
  }
  const parsedGoalType = goalTypeSchema.safeParse(existing.goalType);
  if (!parsedGoalType.success) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Goal type is invalid.",
    });
  }
  const targetValue = validateGoalTargetValue(
    parsedGoalType.data,
    input.targetValue,
  );
  await db
    .update(goal)
    .set({
      targetValue,
      updatedAt: new Date(),
    })
    .where(and(eq(goal.id, input.id), eq(goal.userId, userId)));

  return loadGoalsWithProgress({
    userId,
    now: new Date(),
  });
}

export async function archiveGoal({
  userId,
  input,
}: {
  userId: string;
  input: ArchiveGoalInput;
}) {
  const [archived] = await db
    .update(goal)
    .set({
      abandonedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(and(eq(goal.id, input.id), eq(goal.userId, userId)))
    .returning({ id: goal.id });
  if (!archived) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Goal not found.",
    });
  }
  await endGoalStreak({ goalId: input.id });
  return {
    success: true,
  };
}
