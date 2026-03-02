export type GoalType = "distance" | "frequency" | "pace";
export type GoalCadence = "weekly" | "monthly";

export interface GoalFormState {
  goalType: GoalType | null;
  cadence: GoalCadence | null;
  targetValue: string;
  trackStreak: boolean;
}
