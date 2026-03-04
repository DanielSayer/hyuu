import { TRPCError } from "@trpc/server";

import type { GoalType } from "../schemas/goals";

const METERS_PER_KM = 1000;
const SECONDS_PER_MINUTE = 60;

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
  if (goalType === "pace") {
    const minutes = Math.trunc(targetValue);
    const seconds = Math.round((targetValue - minutes) * 100);
    if (minutes < 0 || seconds < 0 || seconds >= 60) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "pace target must use min.ss format (seconds 00-59).",
      });
    }
  }
  return targetValue;
}

export function toGoalMetricBaseValue(goalType: GoalType, value: number) {
  if (goalType === "distance") {
    return value * METERS_PER_KM;
  }
  if (goalType === "pace") {
    return paceMinPerKmToSecondsPerKm(value);
  }
  return value;
}

export function toGoalDisplayValue(goalType: GoalType, value: number) {
  if (goalType === "distance") {
    return value / METERS_PER_KM;
  }
  if (goalType === "pace") {
    return paceSecondsPerKmToMinPerKm(value);
  }
  return value;
}

export function isGoalCompleted(
  goalType: GoalType,
  currentValue: number,
  targetValue: number,
) {
  const targetBaseValue = toGoalMetricBaseValue(goalType, targetValue);
  if (goalType === "pace") {
    return currentValue > 0 && currentValue <= targetBaseValue;
  }
  return currentValue >= targetBaseValue;
}

export function getGoalProgressRatio(
  goalType: GoalType,
  currentValue: number,
  targetValue: number,
) {
  const targetBaseValue = toGoalMetricBaseValue(goalType, targetValue);
  if (targetBaseValue <= 0) {
    return 0;
  }
  if (goalType === "pace") {
    if (currentValue <= 0) {
      return 0;
    }
    return targetBaseValue / currentValue;
  }
  return currentValue / targetBaseValue;
}

export function addWeeks(date: Date, weeks: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + weeks * 7);
  return next;
}

function paceMinPerKmToSecondsPerKm(paceMinPerKm: number) {
  const minutes = Math.trunc(paceMinPerKm);
  const seconds = Math.round((paceMinPerKm - minutes) * 100);
  return minutes * SECONDS_PER_MINUTE + seconds;
}

function paceSecondsPerKmToMinPerKm(paceSecondsPerKm: number) {
  if (paceSecondsPerKm <= 0) {
    return 0;
  }
  let minutes = Math.floor(paceSecondsPerKm / SECONDS_PER_MINUTE);
  let seconds = Math.round(paceSecondsPerKm - minutes * SECONDS_PER_MINUTE);
  if (seconds === SECONDS_PER_MINUTE) {
    minutes += 1;
    seconds = 0;
  }
  return minutes + seconds / 100;
}
