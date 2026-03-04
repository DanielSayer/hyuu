import { MapPin, Repeat, Timer, type LucideIcon } from "lucide-react";

type GoalType = "distance" | "frequency" | "pace";
type GoalCadence = "weekly" | "monthly";
type GoalStatus = "on-track" | "at-risk" | "behind" | "completed";

interface Goal {
  id: number;
  goalType: GoalType;
  cadence: GoalCadence;
  targetValue: number;
  currentValue: number;
  trackStreak: boolean;
  currentStreak: number;
  bestStreak: number;
  status: GoalStatus;
  resetsAt: string;
}

interface GoalProgressApi {
  id: number;
  goalType: GoalType;
  cadence: GoalCadence;
  targetValue: number;
  currentValue: number;
  progressRatio: number;
  completedAt: Date | string | null;
  streak: {
    currentWeeks: number;
  } | null;
}

interface GoalsMappingInput {
  goals: GoalProgressApi[];
  weekStart?: Date | string;
  monthStart?: Date | string;
}

interface GoalPeriodStarts {
  weekStart: Date | string;
  monthStart: Date | string;
}

const goalTypeConfig: Record<
  GoalType,
  { label: string; unit: string; icon: LucideIcon }
> = {
  distance: { label: "Distance", unit: "km", icon: MapPin },
  frequency: { label: "Frequency", unit: "runs", icon: Repeat },
  pace: { label: "Pace", unit: "min/km", icon: Timer },
};

function getGoalProgressPercent(goal: Goal): number {
  if (goal.goalType === "pace") {
    if (goal.currentValue <= goal.targetValue) return 100;
    const start = goal.targetValue + 1;
    const progress =
      ((start - goal.currentValue) / (start - goal.targetValue)) * 100;
    return Math.max(0, Math.min(100, progress));
  }

  return Math.min(100, (goal.currentValue / goal.targetValue) * 100);
}

function formatGoalValue(value: number, goalType: GoalType): string {
  if (goalType === "pace") {
    const mins = Math.floor(value);
    const secs = Math.round((value - mins) * 100);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  if (goalType === "distance") {
    return value % 1 === 0 ? value.toString() : value.toFixed(1);
  }

  return value.toString();
}

function getDaysUntilGoalReset(resetsAt: string): number {
  const now = new Date();
  const reset = new Date(resetsAt);
  const diff = Math.ceil(
    (reset.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );
  return Math.max(0, diff);
}

function clampRatio(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function toDate(value: Date | string): Date {
  return value instanceof Date ? new Date(value.getTime()) : new Date(value);
}

function getCurrentWeekStartUtc(now: Date): Date {
  const day = now.getUTCDay();
  const daysSinceMonday = day === 0 ? 6 : day - 1;
  const weekStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  weekStart.setUTCDate(weekStart.getUTCDate() - daysSinceMonday);
  return weekStart;
}

function getCurrentMonthStartUtc(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

function getPeriodProgressRatio(
  cadence: GoalCadence,
  periodStarts: GoalPeriodStarts,
  now: Date,
): number {
  const periodStart = toDate(
    cadence === "weekly" ? periodStarts.weekStart : periodStarts.monthStart,
  );
  const periodEnd = new Date(periodStart.getTime());

  if (cadence === "weekly") {
    periodEnd.setUTCDate(periodEnd.getUTCDate() + 7);
  } else {
    periodEnd.setUTCMonth(periodEnd.getUTCMonth() + 1);
  }

  const elapsedMs = now.getTime() - periodStart.getTime();
  const totalMs = periodEnd.getTime() - periodStart.getTime();
  if (totalMs <= 0) return 1;
  if (elapsedMs <= 0) return 0;
  return clampRatio(elapsedMs / totalMs);
}

function getGoalStatus(
  goal: GoalProgressApi,
  periodStarts: GoalPeriodStarts,
  now: Date,
): GoalStatus {
  if (goal.completedAt) return "completed";

  const ratio = clampRatio(goal.progressRatio);
  const periodProgressRatio = getPeriodProgressRatio(goal.cadence, periodStarts, now);
  const progressRelativeToTime =
    periodProgressRatio > 0 ? ratio / periodProgressRatio : ratio;

  if (progressRelativeToTime < 0.4) return "behind";
  if (progressRelativeToTime < 0.8) return "at-risk";
  return "on-track";
}

function computeGoalResetsAt(
  goal: GoalProgressApi,
  periodStarts: GoalPeriodStarts,
): string {
  if (goal.cadence === "weekly") {
    const date = toDate(periodStarts.weekStart);
    date.setUTCDate(date.getUTCDate() + 7);
    return date.toISOString();
  }

  const nextMonth = toDate(periodStarts.monthStart);
  nextMonth.setUTCMonth(nextMonth.getUTCMonth() + 1);
  return nextMonth.toISOString();
}

function mapGoals(input: GoalsMappingInput | undefined): Goal[] {
  if (!input) return [];

  const now = new Date();
  const periodStarts: GoalPeriodStarts = {
    weekStart: input.weekStart ?? getCurrentWeekStartUtc(now),
    monthStart: input.monthStart ?? getCurrentMonthStartUtc(now),
  };

  return input.goals.map((goal) => {
    const currentStreak = goal.streak?.currentWeeks ?? 0;
    return {
      id: goal.id,
      goalType: goal.goalType,
      cadence: goal.cadence,
      targetValue: goal.targetValue,
      currentValue: goal.currentValue,
      trackStreak: goal.streak !== null,
      currentStreak,
      bestStreak: currentStreak,
      status: getGoalStatus(goal, periodStarts, now),
      resetsAt: computeGoalResetsAt(goal, periodStarts),
    };
  });
}

export {
  goalTypeConfig,
  formatGoalValue,
  getDaysUntilGoalReset,
  getGoalProgressPercent,
  mapGoals,
};
export type {
  Goal,
  GoalCadence,
  GoalProgressApi,
  GoalStatus,
  GoalType,
  GoalsMappingInput,
};
