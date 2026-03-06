import { z } from "zod";

const MAX_NOTES_LENGTH = 2_000;
const MAX_SHORT_TEXT_LENGTH = 200;

function uniqueNumberArraySchema(min = 0, max = 6) {
  return z
    .array(z.number().int().min(min).max(max))
    .max(max - min + 1)
    .superRefine((values, ctx) => {
      if (new Set(values).size !== values.length) {
        ctx.addIssue({
          code: "custom",
          message: "Array entries must be unique.",
        });
      }
    });
}

function uniqueStringArraySchema(options: readonly string[], max = options.length) {
  return z
    .array(z.enum(options))
    .max(max)
    .superRefine((values, ctx) => {
      if (new Set(values).size !== values.length) {
        ctx.addIssue({
          code: "custom",
          message: "Array entries must be unique.",
        });
      }
    });
}

export const runningPlanExperienceLevelSchema = z.enum([
  "new",
  "returning",
  "intermediate",
  "advanced",
]);

export const runningPlanMotivationSchema = z.enum([
  "fitness",
  "consistency",
  "weight_loss",
  "stress_relief",
  "performance",
  "race",
]);

export const runningPlanEffortPreferenceSchema = z.enum([
  "conservative",
  "balanced",
  "ambitious",
]);

export const runningPlanDraftTypeSchema = z.enum([
  "create_scaffold",
  "update_scaffold",
]);

export const runningPlanDraftStatusSchema = z.enum([
  "draft",
  "finalized",
  "archived",
]);

export const runningPlanGoalTypeSchema = z.enum([
  "general_fitness",
  "consistency",
  "distance",
  "race",
]);

export const runningPlanScaffoldStatusSchema = z.enum([
  "draft",
  "active",
  "paused",
  "completed",
  "archived",
]);

export const runningPlanCycleStatusSchema = z.enum([
  "pending",
  "active",
  "completed",
  "superseded",
  "cancelled",
]);

export const runningPlanDifficultySchema = z.enum([
  "too_easy",
  "right",
  "too_hard",
]);

export const runningPlanFatigueLevelSchema = z.enum([
  "low",
  "moderate",
  "high",
]);

export const runningPlanSurfacePreferenceSchema = z.enum([
  "road",
  "trail",
  "track",
  "treadmill",
  "mixed",
]);

export const runningPlanScheduleFlexibilitySchema = z.enum([
  "fixed",
  "moderate",
  "flexible",
]);

export const weekDaySchema = z.number().int().min(0).max(6);
export const weekDaysSchema = uniqueNumberArraySchema();

export const runningPlanSurfacePreferencesSchema = uniqueStringArraySchema(
  runningPlanSurfacePreferenceSchema.options,
);

export const runningPlanProfileInputSchema = z
  .object({
    experienceLevel: runningPlanExperienceLevelSchema.optional(),
    primaryMotivation: runningPlanMotivationSchema.optional(),
    typicalWeeklyRuns: z.number().int().min(0).max(14).optional(),
    typicalWeeklyDistanceKm: z.number().min(0).max(500).optional(),
    longestRecentRunKm: z.number().min(0).max(200).optional(),
    preferredLongRunDay: weekDaySchema.optional(),
    preferredRunDays: weekDaysSchema.optional(),
    blockedDays: weekDaysSchema.optional(),
    weekStartDay: z.number().int().min(0).max(1).optional(),
    surfacePreferences: runningPlanSurfacePreferencesSchema.optional(),
    injuryNotes: z.string().max(MAX_NOTES_LENGTH).optional(),
    timeConstraintsNotes: z.string().max(MAX_NOTES_LENGTH).optional(),
    planEffortPreference: runningPlanEffortPreferenceSchema.optional(),
  })
  .strict();

export const generalFitnessGoalDetailsSchema = z
  .object({
    desiredOutcome: z.string().max(MAX_SHORT_TEXT_LENGTH).optional(),
    notes: z.string().max(MAX_NOTES_LENGTH).optional(),
  })
  .strict();

export const consistencyGoalDetailsSchema = z
  .object({
    targetRunsPerWeek: z.number().int().min(1).max(14).optional(),
    notes: z.string().max(MAX_NOTES_LENGTH).optional(),
  })
  .strict();

export const distanceGoalDetailsSchema = z
  .object({
    targetDistanceKm: z.number().positive().max(1_000),
    targetDate: z.iso.datetime().optional(),
    notes: z.string().max(MAX_NOTES_LENGTH).optional(),
  })
  .strict();

export const raceGoalDetailsSchema = z
  .object({
    raceName: z.string().max(MAX_SHORT_TEXT_LENGTH).optional(),
    targetDistanceKm: z.number().positive().max(1_000),
    eventDate: z.iso.datetime(),
    targetTimeMinutes: z.number().positive().max(10_000).optional(),
    targetPaceMinPerKm: z.number().positive().max(60).optional(),
    notes: z.string().max(MAX_NOTES_LENGTH).optional(),
  })
  .strict();

export const runningPlanGoalIntentSchema = z.discriminatedUnion("goalType", [
  z
    .object({
      goalType: z.literal("general_fitness"),
      goalDetails: generalFitnessGoalDetailsSchema,
    })
    .strict(),
  z
    .object({
      goalType: z.literal("consistency"),
      goalDetails: consistencyGoalDetailsSchema,
    })
    .strict(),
  z
    .object({
      goalType: z.literal("distance"),
      goalDetails: distanceGoalDetailsSchema,
    })
    .strict(),
  z
    .object({
      goalType: z.literal("race"),
      goalDetails: raceGoalDetailsSchema,
    })
    .strict(),
]);

export const runningPlanFitnessBaselineSchema = z
  .object({
    currentWeeklyRuns: z.number().int().min(0).max(14).optional(),
    currentWeeklyDistanceKm: z.number().min(0).max(500).optional(),
    longestRecentRunKm: z.number().min(0).max(200).optional(),
    hasTrustedSyncedHistory: z.boolean().optional(),
    notes: z.string().max(MAX_NOTES_LENGTH).optional(),
  })
  .strict();

export const runningPlanConstraintsSchema = z
  .object({
    surfacePreferences: runningPlanSurfacePreferencesSchema.optional(),
    injuryNotes: z.string().max(MAX_NOTES_LENGTH).optional(),
    timeConstraintsNotes: z.string().max(MAX_NOTES_LENGTH).optional(),
    weekdayTimeBudgetMinutes: z.number().int().min(0).max(1_440).optional(),
    weekendTimeBudgetMinutes: z.number().int().min(0).max(1_440).optional(),
    willingForSpeedwork: z.boolean().optional(),
    willingForHills: z.boolean().optional(),
    willingForCrossTraining: z.boolean().optional(),
    notes: z.string().max(MAX_NOTES_LENGTH).optional(),
  })
  .strict();

export const runningPlanReviewPreferencesSchema = z
  .object({
    planEffortPreference: runningPlanEffortPreferenceSchema.optional(),
    scheduleFlexibility: runningPlanScheduleFlexibilitySchema.optional(),
    wantsWeeklyAdjustments: z.boolean().optional(),
    notes: z.string().max(MAX_NOTES_LENGTH).optional(),
  })
  .strict();

export const runningPlanScheduleSchema = z
  .object({
    startDate: z.iso.datetime(),
    targetEndDate: z.iso.datetime().optional(),
    planningHorizonWeeks: z.number().int().min(1).max(104).optional(),
    defaultRunsPerWeek: z.number().int().min(1).max(14).optional(),
    preferredRunDays: weekDaysSchema.optional(),
    blockedDays: weekDaysSchema.optional(),
    longRunDay: weekDaySchema.optional(),
    crossTrainingDays: weekDaysSchema.optional(),
  })
  .strict();

export const runningPlanDraftStepSchema = z.enum([
  "runner-profile",
  "goal-intent",
  "schedule",
  "fitness-baseline",
  "constraints",
  "review-preferences",
]);

export const runningPlanDraftDataSchema = z
  .object({
    targetScaffoldId: z.number().int().positive().optional(),
    runnerProfile: runningPlanProfileInputSchema.optional(),
    goalIntent: runningPlanGoalIntentSchema.optional(),
    schedule: runningPlanScheduleSchema.optional(),
    fitnessBaseline: runningPlanFitnessBaselineSchema.optional(),
    constraints: runningPlanConstraintsSchema.optional(),
    reviewPreferences: runningPlanReviewPreferencesSchema.optional(),
  })
  .strict();

export const runningPlanCompletedStepsSchema = z
  .array(runningPlanDraftStepSchema)
  .superRefine((values, ctx) => {
    if (new Set(values).size !== values.length) {
      ctx.addIssue({
        code: "custom",
        message: "completedSteps must be unique.",
      });
    }
  });

export const runningPlanProfileSnapshotSchema = z
  .object({
    experienceLevel: runningPlanExperienceLevelSchema.optional(),
    primaryMotivation: runningPlanMotivationSchema.optional(),
    typicalWeeklyRuns: z.number().int().min(0).max(14).optional(),
    typicalWeeklyDistanceKm: z.number().min(0).max(500).optional(),
    longestRecentRunKm: z.number().min(0).max(200).optional(),
    preferredLongRunDay: weekDaySchema.optional(),
    preferredRunDays: weekDaysSchema.optional(),
    blockedDays: weekDaysSchema.optional(),
    weekStartDay: z.number().int().min(0).max(1).optional(),
    surfacePreferences: runningPlanSurfacePreferencesSchema.optional(),
    injuryNotes: z.string().max(MAX_NOTES_LENGTH).optional(),
    timeConstraintsNotes: z.string().max(MAX_NOTES_LENGTH).optional(),
    planEffortPreference: runningPlanEffortPreferenceSchema.optional(),
    fitnessBaseline: runningPlanFitnessBaselineSchema.optional(),
    reviewPreferences: runningPlanReviewPreferencesSchema.optional(),
  })
  .strict();

const scaffoldBaseShape = {
  startDate: z.iso.datetime(),
  targetEndDate: z.iso.datetime().optional(),
  planningHorizonWeeks: z.number().int().min(1).max(104).optional(),
  defaultRunsPerWeek: z.number().int().min(1).max(14).optional(),
  preferredRunDays: weekDaysSchema,
  blockedDays: weekDaysSchema,
  longRunDay: weekDaySchema.optional(),
  crossTrainingDays: weekDaysSchema.optional(),
  constraints: runningPlanConstraintsSchema,
  profileSnapshot: runningPlanProfileSnapshotSchema,
};

export const runningPlanScaffoldInputSchema = z.discriminatedUnion("goalType", [
  z
    .object({
      ...scaffoldBaseShape,
      goalType: z.literal("general_fitness"),
      goalDetails: generalFitnessGoalDetailsSchema,
    })
    .strict(),
  z
    .object({
      ...scaffoldBaseShape,
      goalType: z.literal("consistency"),
      goalDetails: consistencyGoalDetailsSchema,
    })
    .strict(),
  z
    .object({
      ...scaffoldBaseShape,
      goalType: z.literal("distance"),
      goalDetails: distanceGoalDetailsSchema,
    })
    .strict(),
  z
    .object({
      ...scaffoldBaseShape,
      goalType: z.literal("race"),
      goalDetails: raceGoalDetailsSchema,
    })
    .strict(),
]);

export const runningPlanScaffoldPatchSchema = z
  .object({
    status: runningPlanScaffoldStatusSchema.optional(),
    targetEndDate: z.iso.datetime().nullable().optional(),
    planningHorizonWeeks: z.number().int().min(1).max(104).nullable().optional(),
    defaultRunsPerWeek: z.number().int().min(1).max(14).nullable().optional(),
    preferredRunDays: weekDaysSchema.optional(),
    blockedDays: weekDaysSchema.optional(),
    longRunDay: weekDaySchema.nullable().optional(),
    crossTrainingDays: weekDaysSchema.optional(),
    constraints: runningPlanConstraintsSchema.optional(),
  })
  .strict();

export const runningPlanGenerationInputSchema = z
  .object({
    requestedWindowWeeks: z.number().int().min(1).max(2),
    source: z.enum(["manual", "system"]),
    notes: z.string().max(MAX_NOTES_LENGTH).optional(),
  })
  .strict();

export const runningPlanGenerationMetadataSchema = z
  .object({
    sourceVersion: z.number().int().positive().optional(),
    trigger: z.enum(["initial", "refresh", "adjustment"]).optional(),
    notes: z.string().max(MAX_NOTES_LENGTH).optional(),
  })
  .strict();

export const runningPlanAdjustmentNotesSchema = z
  .object({
    summary: z.string().max(MAX_NOTES_LENGTH).optional(),
    requestedChanges: z.array(z.string().max(MAX_SHORT_TEXT_LENGTH)).optional(),
    deloadRequested: z.boolean().optional(),
  })
  .strict();

export const runningPlanPainFlagsSchema = z
  .object({
    niggle: z.boolean().optional(),
    sharpPain: z.boolean().optional(),
    illness: z.boolean().optional(),
    sleepIssues: z.boolean().optional(),
    lifeStress: z.boolean().optional(),
  })
  .strict();

export const runningPlanDerivedMetricsSchema = z
  .object({
    runCount: z.number().int().min(0),
    totalDistanceM: z.number().min(0),
    totalElapsedS: z.number().int().min(0),
    longestRunM: z.number().min(0),
    averagePaceSecPerKm: z.number().min(0).nullable(),
  })
  .strict();

export const runningPlanCycleReviewInputSchema = z
  .object({
    cycleId: z.number().int().positive(),
    completionScore: z.number().int().min(0).max(100).optional(),
    feltDifficulty: runningPlanDifficultySchema.optional(),
    fatigueLevel: runningPlanFatigueLevelSchema.optional(),
    painFlags: runningPlanPainFlagsSchema.optional(),
    missedRunsCount: z.number().int().min(0).max(14).optional(),
    notes: z.string().max(MAX_NOTES_LENGTH).optional(),
  })
  .strict();

const saveDraftStepBaseSchema = z
  .object({
    draftId: z.number().int().positive().optional(),
    draftType: runningPlanDraftTypeSchema,
    wizardVersion: z.number().int().min(1).max(100).optional(),
    currentStep: runningPlanDraftStepSchema.optional(),
    targetScaffoldId: z.number().int().positive().optional(),
  })
  .strict();

export const saveRunningPlanDraftStepInputSchema = z.discriminatedUnion("step", [
  saveDraftStepBaseSchema.extend({
    step: z.literal("runner-profile"),
    stepData: runningPlanProfileInputSchema,
  }),
  saveDraftStepBaseSchema.extend({
    step: z.literal("goal-intent"),
    stepData: runningPlanGoalIntentSchema,
  }),
  saveDraftStepBaseSchema.extend({
    step: z.literal("schedule"),
    stepData: runningPlanScheduleSchema,
  }),
  saveDraftStepBaseSchema.extend({
    step: z.literal("fitness-baseline"),
    stepData: runningPlanFitnessBaselineSchema,
  }),
  saveDraftStepBaseSchema.extend({
    step: z.literal("constraints"),
    stepData: runningPlanConstraintsSchema,
  }),
  saveDraftStepBaseSchema.extend({
    step: z.literal("review-preferences"),
    stepData: runningPlanReviewPreferencesSchema,
  }),
]);

export const createRunningPlanScaffoldFromDraftInputSchema = z
  .object({
    draftId: z.number().int().positive().optional(),
    activate: z.boolean().optional(),
  })
  .strict();

export const getRunningPlanScaffoldInputSchema = z
  .object({
    id: z.number().int().positive(),
  })
  .strict();

export const updateRunningPlanScaffoldInputSchema = z
  .object({
    id: z.number().int().positive(),
    data: runningPlanScaffoldPatchSchema,
  })
  .strict();

export const listRunningPlanScaffoldsInputSchema = z
  .object({
    status: runningPlanScaffoldStatusSchema.optional(),
    limit: z.number().int().min(1).max(50).optional(),
  })
  .strict();

export const listRunningPlanCyclesInputSchema = z
  .object({
    scaffoldId: z.number().int().positive(),
  })
  .strict();

export const getRunningPlanCycleInputSchema = z
  .object({
    id: z.number().int().positive(),
  })
  .strict();

export const runningPlanEventPayloadSchema = z.record(z.string(), z.unknown());

export type RunningPlanProfileInput = z.infer<typeof runningPlanProfileInputSchema>;
export type RunningPlanDraftData = z.infer<typeof runningPlanDraftDataSchema>;
export type RunningPlanScaffoldInput = z.infer<
  typeof runningPlanScaffoldInputSchema
>;
export type RunningPlanScaffoldPatch = z.infer<
  typeof runningPlanScaffoldPatchSchema
>;
export type RunningPlanCycleReviewInput = z.infer<
  typeof runningPlanCycleReviewInputSchema
>;
export type SaveRunningPlanDraftStepInput = z.infer<
  typeof saveRunningPlanDraftStepInputSchema
>;
