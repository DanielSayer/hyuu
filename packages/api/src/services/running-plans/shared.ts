import { TRPCError } from "@trpc/server";

import {
  db,
  runningPlanCycle,
  runningPlanCycleReview,
  runningPlanDraft,
  runningPlanEvent,
  runningPlanProfile,
  runningPlanScaffold,
  userSettings,
} from "@hyuu/db";
import type { z } from "zod";

import {
  runningPlanCompletedStepsSchema,
  runningPlanConstraintsSchema,
  runningPlanDraftDataSchema,
  runningPlanGenerationInputSchema,
  runningPlanGenerationMetadataSchema,
  runningPlanDerivedMetricsSchema,
  runningPlanEventPayloadSchema,
  runningPlanAdjustmentNotesSchema,
  runningPlanPainFlagsSchema,
  runningPlanProfileInputSchema,
  runningPlanProfileSnapshotSchema,
  runningPlanScaffoldInputSchema,
  runningPlanScaffoldPatchSchema,
  runningPlanSurfacePreferencesSchema,
  weekDaysSchema,
} from "../../schemas/running-plans";

const draftStepKeyMap = {
  "runner-profile": "runnerProfile",
  "goal-intent": "goalIntent",
  schedule: "schedule",
  "fitness-baseline": "fitnessBaseline",
  constraints: "constraints",
  "review-preferences": "reviewPreferences",
} as const;

type DraftStep = keyof typeof draftStepKeyMap;

const goalDetailsSchemaByType = {
  general_fitness: runningPlanScaffoldInputSchema.options[0].shape.goalDetails,
  consistency: runningPlanScaffoldInputSchema.options[1].shape.goalDetails,
  distance: runningPlanScaffoldInputSchema.options[2].shape.goalDetails,
  race: runningPlanScaffoldInputSchema.options[3].shape.goalDetails,
} as const;

export function parseRequiredJsonb<T>(
  value: unknown,
  schema: z.ZodType<T>,
  fieldName: string,
): T {
  const parsed = schema.safeParse(value);
  if (parsed.success) {
    return parsed.data;
  }
  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: `Stored running plan ${fieldName} is invalid.`,
  });
}

export function parseOptionalJsonb<T>(
  value: unknown,
  schema: z.ZodType<T>,
  fieldName: string,
): T | null {
  if (value === null || value === undefined) {
    return null;
  }
  return parseRequiredJsonb(value, schema, fieldName);
}

export function mapRunningPlanProfile(
  row: typeof runningPlanProfile.$inferSelect | null,
) {
  if (!row) {
    return null;
  }
  return {
    userId: row.userId,
    experienceLevel: row.experienceLevel ?? undefined,
    primaryMotivation: row.primaryMotivation ?? undefined,
    typicalWeeklyRuns: row.typicalWeeklyRuns ?? undefined,
    typicalWeeklyDistanceKm: row.typicalWeeklyDistanceKm ?? undefined,
    longestRecentRunKm: row.longestRecentRunKm ?? undefined,
    preferredLongRunDay: row.preferredLongRunDay ?? undefined,
    preferredRunDays:
      parseOptionalJsonb(
        row.preferredRunDays,
        weekDaysSchema,
        "profile.preferredRunDays",
      ) ?? undefined,
    blockedDays:
      parseOptionalJsonb(row.blockedDays, weekDaysSchema, "profile.blockedDays") ??
      undefined,
    weekStartDay: row.weekStartDay ?? undefined,
    surfacePreferences:
      parseOptionalJsonb(
        row.surfacePreferences,
        runningPlanSurfacePreferencesSchema,
        "profile.surfacePreferences",
      ) ?? undefined,
    injuryNotes: row.injuryNotes ?? undefined,
    timeConstraintsNotes: row.timeConstraintsNotes ?? undefined,
    planEffortPreference: row.planEffortPreference ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function mapRunningPlanDraft(row: typeof runningPlanDraft.$inferSelect) {
  return {
    id: row.id,
    userId: row.userId,
    draftType: row.draftType,
    status: row.status,
    wizardVersion: row.wizardVersion,
    currentStep: row.currentStep,
    draftData: parseRequiredJsonb(
      row.draftData,
      runningPlanDraftDataSchema,
      "draft.draftData",
    ),
    completedSteps: parseRequiredJsonb(
      row.completedSteps,
      runningPlanCompletedStepsSchema,
      "draft.completedSteps",
    ),
    lastTouchedAt: row.lastTouchedAt,
    finalizedAt: row.finalizedAt,
    archivedAt: row.archivedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function mapRunningPlanScaffold(
  row: typeof runningPlanScaffold.$inferSelect,
) {
  return {
    id: row.id,
    userId: row.userId,
    status: row.status,
    goalType: row.goalType,
    goalDetails: parseRequiredJsonb(
      row.goalDetails,
      goalDetailsSchemaByType[row.goalType],
      "scaffold.goalDetails",
    ),
    startDate: row.startDate,
    targetEndDate: row.targetEndDate,
    planningHorizonWeeks: row.planningHorizonWeeks,
    defaultRunsPerWeek: row.defaultRunsPerWeek,
    preferredRunDays: parseRequiredJsonb(
      row.preferredRunDays,
      weekDaysSchema,
      "scaffold.preferredRunDays",
    ),
    blockedDays: parseRequiredJsonb(
      row.blockedDays,
      weekDaysSchema,
      "scaffold.blockedDays",
    ),
    longRunDay: row.longRunDay,
    crossTrainingDays:
      parseOptionalJsonb(
        row.crossTrainingDays,
        weekDaysSchema,
        "scaffold.crossTrainingDays",
      ) ?? [],
    constraints: parseRequiredJsonb(
      row.constraints,
      runningPlanConstraintsSchema,
      "scaffold.constraints",
    ),
    profileSnapshot: parseRequiredJsonb(
      row.profileSnapshot,
      runningPlanProfileSnapshotSchema,
      "scaffold.profileSnapshot",
    ),
    createdFromDraftId: row.createdFromDraftId,
    currentCycleNumber: row.currentCycleNumber,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function mapRunningPlanCycle(row: typeof runningPlanCycle.$inferSelect) {
  return {
    id: row.id,
    userId: row.userId,
    scaffoldId: row.scaffoldId,
    cycleNumber: row.cycleNumber,
    startDate: row.startDate,
    endDate: row.endDate,
    status: row.status,
    generationInput: parseOptionalJsonb(
      row.generationInput,
      runningPlanGenerationInputSchema,
      "cycle.generationInput",
    ),
    generationMetadata: parseOptionalJsonb(
      row.generationMetadata,
      runningPlanGenerationMetadataSchema,
      "cycle.generationMetadata",
    ),
    adjustmentNotes: parseOptionalJsonb(
      row.adjustmentNotes,
      runningPlanAdjustmentNotesSchema,
      "cycle.adjustmentNotes",
    ),
    generatedAt: row.generatedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function mapRunningPlanCycleReview(
  row: typeof runningPlanCycleReview.$inferSelect,
) {
  return {
    id: row.id,
    userId: row.userId,
    cycleId: row.cycleId,
    completionScore: row.completionScore,
    feltDifficulty: row.feltDifficulty,
    fatigueLevel: row.fatigueLevel,
    painFlags: parseOptionalJsonb(
      row.painFlags,
      runningPlanPainFlagsSchema,
      "cycleReview.painFlags",
    ),
    missedRunsCount: row.missedRunsCount,
    notes: row.notes,
    derivedMetrics: parseOptionalJsonb(
      row.derivedMetrics,
      runningPlanDerivedMetricsSchema,
      "cycleReview.derivedMetrics",
    ),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function mergeDraftData(
  draftData: unknown,
  step: DraftStep,
  stepData: unknown,
  targetScaffoldId?: number,
) {
  const parsedDraftData = parseOptionalJsonb(
    draftData,
    runningPlanDraftDataSchema,
    "draft.draftData",
  ) ?? {};
  const nextData = {
    ...parsedDraftData,
    [draftStepKeyMap[step]]: stepData,
    ...(targetScaffoldId ? { targetScaffoldId } : {}),
  };
  return runningPlanDraftDataSchema.parse(nextData);
}

export function mergeCompletedSteps(completedSteps: unknown, step: DraftStep) {
  const current =
    parseOptionalJsonb(
      completedSteps,
      runningPlanCompletedStepsSchema,
      "draft.completedSteps",
    ) ?? [];
  return runningPlanCompletedStepsSchema.parse(
    current.includes(step) ? current : [...current, step],
  );
}

export function buildProfileSnapshot({
  profile,
  draftData,
}: {
  profile: ReturnType<typeof mapRunningPlanProfile>;
  draftData: z.infer<typeof runningPlanDraftDataSchema>;
}) {
  const runnerProfile = draftData.runnerProfile ?? {};
  const constraints = draftData.constraints ?? {};

  return runningPlanProfileSnapshotSchema.parse({
    ...profile,
    ...runnerProfile,
    surfacePreferences:
      constraints.surfacePreferences ??
      runnerProfile.surfacePreferences ??
      profile?.surfacePreferences,
    injuryNotes:
      constraints.injuryNotes ?? runnerProfile.injuryNotes ?? profile?.injuryNotes,
    timeConstraintsNotes:
      constraints.timeConstraintsNotes ??
      runnerProfile.timeConstraintsNotes ??
      profile?.timeConstraintsNotes,
    fitnessBaseline: draftData.fitnessBaseline,
    reviewPreferences: draftData.reviewPreferences,
  });
}

export function buildScaffoldInputFromDraft({
  draftData,
  profile,
}: {
  draftData: z.infer<typeof runningPlanDraftDataSchema>;
  profile: ReturnType<typeof mapRunningPlanProfile>;
}) {
  const goalIntent = draftData.goalIntent;
  const schedule = draftData.schedule;
  if (!goalIntent || !schedule) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Draft must include goal intent and schedule.",
    });
  }

  const preferredRunDays =
    schedule.preferredRunDays ??
    draftData.runnerProfile?.preferredRunDays ??
    profile?.preferredRunDays ??
    [];
  const blockedDays =
    schedule.blockedDays ??
    draftData.runnerProfile?.blockedDays ??
    profile?.blockedDays ??
    [];

  const mergedConstraints = runningPlanConstraintsSchema.parse({
    ...draftData.constraints,
    surfacePreferences:
      draftData.constraints?.surfacePreferences ??
      draftData.runnerProfile?.surfacePreferences ??
      profile?.surfacePreferences,
    injuryNotes:
      draftData.constraints?.injuryNotes ??
      draftData.runnerProfile?.injuryNotes ??
      profile?.injuryNotes,
    timeConstraintsNotes:
      draftData.constraints?.timeConstraintsNotes ??
      draftData.runnerProfile?.timeConstraintsNotes ??
      profile?.timeConstraintsNotes,
  });

  return runningPlanScaffoldInputSchema.parse({
    ...goalIntent,
    startDate: schedule.startDate,
    targetEndDate: schedule.targetEndDate,
    planningHorizonWeeks: schedule.planningHorizonWeeks,
    defaultRunsPerWeek: schedule.defaultRunsPerWeek,
    preferredRunDays,
    blockedDays,
    longRunDay:
      schedule.longRunDay ??
      draftData.runnerProfile?.preferredLongRunDay ??
      profile?.preferredLongRunDay,
    crossTrainingDays: schedule.crossTrainingDays ?? [],
    constraints: mergedConstraints,
    profileSnapshot: buildProfileSnapshot({
      profile,
      draftData,
    }),
  });
}

export function serializeProfileForDb(
  input: z.infer<typeof runningPlanProfileInputSchema>,
) {
  const parsed = runningPlanProfileInputSchema.parse(input);
  return {
    experienceLevel: parsed.experienceLevel ?? null,
    primaryMotivation: parsed.primaryMotivation ?? null,
    typicalWeeklyRuns: parsed.typicalWeeklyRuns ?? null,
    typicalWeeklyDistanceKm: parsed.typicalWeeklyDistanceKm ?? null,
    longestRecentRunKm: parsed.longestRecentRunKm ?? null,
    preferredLongRunDay: parsed.preferredLongRunDay ?? null,
    preferredRunDays: parsed.preferredRunDays ?? null,
    blockedDays: parsed.blockedDays ?? null,
    weekStartDay: parsed.weekStartDay ?? null,
    surfacePreferences: parsed.surfacePreferences ?? null,
    injuryNotes: parsed.injuryNotes ?? null,
    timeConstraintsNotes: parsed.timeConstraintsNotes ?? null,
    planEffortPreference: parsed.planEffortPreference ?? null,
  };
}

export function serializeScaffoldPatchForDb(
  patch: z.infer<typeof runningPlanScaffoldPatchSchema>,
) {
  const parsed = runningPlanScaffoldPatchSchema.parse(patch);
  return {
    ...(parsed.status !== undefined ? { status: parsed.status } : {}),
    ...(parsed.targetEndDate !== undefined
      ? {
          targetEndDate: parsed.targetEndDate
            ? new Date(parsed.targetEndDate)
            : null,
        }
      : {}),
    ...(parsed.planningHorizonWeeks !== undefined
      ? { planningHorizonWeeks: parsed.planningHorizonWeeks }
      : {}),
    ...(parsed.defaultRunsPerWeek !== undefined
      ? { defaultRunsPerWeek: parsed.defaultRunsPerWeek }
      : {}),
    ...(parsed.preferredRunDays !== undefined
      ? { preferredRunDays: parsed.preferredRunDays }
      : {}),
    ...(parsed.blockedDays !== undefined ? { blockedDays: parsed.blockedDays } : {}),
    ...(parsed.longRunDay !== undefined ? { longRunDay: parsed.longRunDay } : {}),
    ...(parsed.crossTrainingDays !== undefined
      ? { crossTrainingDays: parsed.crossTrainingDays }
      : {}),
    ...(parsed.constraints !== undefined ? { constraints: parsed.constraints } : {}),
  };
}

export async function syncWeekStartDay(userId: string, weekStartDay?: number) {
  if (weekStartDay === undefined) {
    return;
  }
  await db
    .insert(userSettings)
    .values({
      userId,
      weekStartDay,
    })
    .onConflictDoUpdate({
      target: userSettings.userId,
      set: {
        weekStartDay,
        updatedAt: new Date(),
      },
    });
}

export async function logRunningPlanEvent({
  userId,
  draftId,
  scaffoldId,
  cycleId,
  cycleReviewId,
  eventType,
  payload,
}: {
  userId: string;
  draftId?: number | null;
  scaffoldId?: number | null;
  cycleId?: number | null;
  cycleReviewId?: number | null;
  eventType: string;
  payload?: Record<string, unknown>;
}) {
  await db.insert(runningPlanEvent).values({
    userId,
    draftId: draftId ?? null,
    scaffoldId: scaffoldId ?? null,
    cycleId: cycleId ?? null,
    cycleReviewId: cycleReviewId ?? null,
    eventType,
    payload: payload ? runningPlanEventPayloadSchema.parse(payload) : null,
  });
}
