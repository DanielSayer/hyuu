export type TrainingPlanGoalType =
  | "general_fitness"
  | "consistency"
  | "distance"
  | "race";

export type TrainingPlanExperienceLevel =
  | "new"
  | "returning"
  | "intermediate"
  | "advanced";

export type TrainingPlanMotivation =
  | "fitness"
  | "consistency"
  | "weight_loss"
  | "stress_relief"
  | "performance"
  | "race";

export type TrainingPlanEffortPreference =
  | "conservative"
  | "balanced"
  | "ambitious";

export type RunningPlanDraftStep =
  | "runner-profile"
  | "goal-intent"
  | "schedule"
  | "fitness-baseline"
  | "constraints"
  | "review-preferences";

export interface TrainingPlanFormState {
  goalType: TrainingPlanGoalType | null;
  targetDistanceKm: string;
  targetDate: string;
  raceName: string;
  eventDate: string;
  targetTimeMinutes: string;
  startDate: string;
  planningHorizonWeeks: string;
  defaultRunsPerWeek: string;
  preferredRunDays: number[];
  blockedDays: number[];
  longRunDay: string;
  experienceLevel: TrainingPlanExperienceLevel | null;
  primaryMotivation: TrainingPlanMotivation | null;
  typicalWeeklyRuns: string;
  typicalWeeklyDistanceKm: string;
  longestRecentRunKm: string;
  planEffortPreference: TrainingPlanEffortPreference | null;
  willingForSpeedwork: boolean;
  willingForHills: boolean;
  willingForCrossTraining: boolean;
}

export interface RunningPlanDraftData {
  runnerProfile?: {
    experienceLevel?: TrainingPlanExperienceLevel;
    primaryMotivation?: TrainingPlanMotivation;
    typicalWeeklyRuns?: number;
    typicalWeeklyDistanceKm?: number;
    longestRecentRunKm?: number;
    preferredLongRunDay?: number;
    preferredRunDays?: number[];
    blockedDays?: number[];
    planEffortPreference?: TrainingPlanEffortPreference;
  };
  goalIntent?:
    | {
        goalType: "general_fitness";
        goalDetails: {
          desiredOutcome?: string;
        };
      }
    | {
        goalType: "consistency";
        goalDetails: {
          targetRunsPerWeek?: number;
        };
      }
    | {
        goalType: "distance";
        goalDetails: {
          targetDistanceKm: number;
          targetDate?: string;
        };
      }
    | {
        goalType: "race";
        goalDetails: {
          raceName?: string;
          targetDistanceKm: number;
          eventDate: string;
          targetTimeMinutes?: number;
        };
      };
  schedule?: {
    startDate: string;
    targetEndDate?: string;
    planningHorizonWeeks?: number;
    defaultRunsPerWeek?: number;
    preferredRunDays?: number[];
    blockedDays?: number[];
    longRunDay?: number;
    crossTrainingDays?: number[];
  };
  fitnessBaseline?: {
    currentWeeklyRuns?: number;
    currentWeeklyDistanceKm?: number;
    longestRecentRunKm?: number;
    hasTrustedSyncedHistory?: boolean;
  };
  constraints?: {
    willingForSpeedwork?: boolean;
    willingForHills?: boolean;
    willingForCrossTraining?: boolean;
  };
  reviewPreferences?: {
    planEffortPreference?: TrainingPlanEffortPreference;
  };
}

export interface RunningPlanDraft {
  id: number;
  currentStep: RunningPlanDraftStep;
  draftData: RunningPlanDraftData;
}

export interface RunningPlanProfile {
  experienceLevel?: TrainingPlanExperienceLevel;
  primaryMotivation?: TrainingPlanMotivation;
  typicalWeeklyRuns?: number;
  typicalWeeklyDistanceKm?: number;
  longestRecentRunKm?: number;
  preferredLongRunDay?: number;
  preferredRunDays?: number[];
  blockedDays?: number[];
  planEffortPreference?: TrainingPlanEffortPreference;
}

export interface RunningPlanPrefill {
  source: {
    hasTrustedSyncedHistory: boolean;
  };
  profile: {
    typicalWeeklyRuns?: number;
    typicalWeeklyDistanceKm?: number;
    longestRecentRunKm?: number;
    preferredRunDays?: number[];
    preferredLongRunDay?: number;
  };
  fitnessBaseline: {
    currentWeeklyRuns?: number;
    currentWeeklyDistanceKm?: number;
    longestRecentRunKm?: number;
    hasTrustedSyncedHistory?: boolean;
  };
  schedule: {
    preferredRunDays?: number[];
    blockedDays?: number[];
    longRunDay?: number;
  };
}

export interface RunningPlanScaffoldSummary {
  id: number;
  status: "draft" | "active" | "paused" | "completed" | "archived";
  goalType: TrainingPlanGoalType;
  goalDetails:
    | {
        desiredOutcome?: string;
      }
    | {
        targetRunsPerWeek?: number;
      }
    | {
        targetDistanceKm: number;
        targetDate?: string;
      }
    | {
        raceName?: string;
        targetDistanceKm: number;
        eventDate: string;
        targetTimeMinutes?: number;
      };
  startDate: string | Date;
  targetEndDate: string | Date | null;
  planningHorizonWeeks: number | null;
  defaultRunsPerWeek: number | null;
  preferredRunDays: number[];
  blockedDays: number[];
  longRunDay: number | null;
  createdAt: string | Date;
}
