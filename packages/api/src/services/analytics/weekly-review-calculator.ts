import { computePaceSecPerKm, isRunActivityType, toLocalDateOrNull } from "../../utils";
import { goalTypeSchema } from "../../schemas/goals";
import { getGoalProgressRatio, toGoalDisplayValue } from "../../utils/goals";

type ReviewWeekActivityRow = {
  type: string | null;
  distance: number | null;
  elapsedTime: number | null;
  startDateLocal: string | null;
};

type ReviewWeekGoalProgressRow = {
  goalId: number;
  currentValue: number;
  completedAt: Date | null;
  goal: {
    goalType: string;
    targetValue: number;
  };
};

function toUtcDayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function toPaceOrNull(value: number | null | undefined): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return null;
  }
  return value;
}

export function computeWeeklyHighlights(
  reviewWeekActivities: ReviewWeekActivityRow[],
) {
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

  const highlights = {
    bestDistanceDayM: bestDistanceDayM > 0 ? bestDistanceDayM : undefined,
    longestRunM: longestRunM > 0 ? longestRunM : undefined,
    fastestRunPaceSecPerKm: fastestRunPaceSecPerKm ?? undefined,
  };
  const hasHighlights = Object.values(highlights).some((value) => value !== undefined);

  return hasHighlights ? highlights : null;
}

export function mapWeeklyReviewGoals(rows: ReviewWeekGoalProgressRow[]) {
  return rows.flatMap((row) => {
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
}
