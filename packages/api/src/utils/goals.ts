import { TRPCError } from "@trpc/server";

import type { GoalType } from "../schemas/goals";

export function toWeekStartDay(value: number | null | undefined): 0 | 1 {
  return value === 0 ? 0 : 1;
}

export function validateGoalTargetValue(goalType: GoalType, targetValue: number) {
  if (!Number.isFinite(targetValue) || targetValue <= 0) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "targetValue must be a positive number.",
    });
  }
  if (goalType === "frequency" && !Number.isInteger(targetValue)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "frequency targets must be whole numbers.",
    });
  }
  if (goalType === "frequency" && (targetValue < 1 || targetValue > 31)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "frequency target must be between 1 and 31 runs.",
    });
  }
  return targetValue;
}

export function isGoalCompleted(
  goalType: GoalType,
  currentValue: number,
  targetValue: number,
) {
  if (goalType === "pace") {
    return currentValue > 0 && currentValue <= targetValue;
  }
  return currentValue >= targetValue;
}

export function getGoalProgressRatio(
  goalType: GoalType,
  currentValue: number,
  targetValue: number,
) {
  if (targetValue <= 0) {
    return 0;
  }
  if (goalType === "pace") {
    if (currentValue <= 0) {
      return 0;
    }
    return targetValue / currentValue;
  }
  return currentValue / targetValue;
}

export function addWeeks(date: Date, weeks: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + weeks * 7);
  return next;
}
