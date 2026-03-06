import { and, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

import {
  db,
  runningPlanCycleReview,
  runningPlanDraft,
  runningPlanProfile,
  runningPlanScaffold,
} from "@hyuu/db";

import { computePaceSecPerKm, isRunActivityType } from "../../utils";
import type {
  CreateRunningPlanScaffoldFromDraftInput,
  GetRunningPlanCycleInput,
  GetRunningPlanScaffoldInput,
  ListRunningPlanCyclesInput,
  ListRunningPlanScaffoldsInput,
  RunningPlanCycleReviewInput,
  RunningPlanProfileInput,
  RunningPlanScaffoldPatch,
  SaveRunningPlanDraftStepInput,
} from "./types";
import { getRunningPlanPrefill } from "./prefill";
import {
  buildScaffoldInputFromDraft,
  logRunningPlanEvent,
  mapRunningPlanCycle,
  mapRunningPlanCycleReview,
  mapRunningPlanDraft,
  mapRunningPlanProfile,
  mapRunningPlanScaffold,
  mergeCompletedSteps,
  mergeDraftData,
  serializeProfileForDb,
  serializeScaffoldPatchForDb,
  syncWeekStartDay,
} from "./shared";

async function getOwnedScaffoldRow(userId: string, scaffoldId: number) {
  const row = await db.query.runningPlanScaffold.findFirst({
    where: (table, operators) =>
      operators.and(
        operators.eq(table.id, scaffoldId),
        operators.eq(table.userId, userId),
      ),
  });
  if (!row) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Running plan scaffold not found.",
    });
  }
  return row;
}

async function getOwnedCycleRow(userId: string, cycleId: number) {
  const row = await db.query.runningPlanCycle.findFirst({
    where: (table, operators) =>
      operators.and(
        operators.eq(table.id, cycleId),
        operators.eq(table.userId, userId),
      ),
  });
  if (!row) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Running plan cycle not found.",
    });
  }
  return row;
}

async function getReviewByCycleId(cycleId: number) {
  const row = await db.query.runningPlanCycleReview.findFirst({
    where: (table, operators) => operators.eq(table.cycleId, cycleId),
  });
  return row ? mapRunningPlanCycleReview(row) : null;
}

async function getActiveDraftRow(userId: string) {
  return db.query.runningPlanDraft.findFirst({
    where: (table, operators) =>
      operators.and(
        operators.eq(table.userId, userId),
        operators.eq(table.status, "draft"),
      ),
    orderBy: (table, operators) => [operators.desc(table.updatedAt)],
  });
}

export async function getRunningPlanProfile(userId: string) {
  const [profileRow, prefill] = await Promise.all([
    db.query.runningPlanProfile.findFirst({
      where: (table, operators) => operators.eq(table.userId, userId),
    }),
    getRunningPlanPrefill(userId),
  ]);

  return {
    profile: mapRunningPlanProfile(profileRow ?? null),
    prefill,
  };
}

export async function upsertRunningPlanProfile({
  userId,
  input,
}: {
  userId: string;
  input: RunningPlanProfileInput;
}) {
  const values = serializeProfileForDb(input);
  const now = new Date();

  await db
    .insert(runningPlanProfile)
    .values({
      userId,
      ...values,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: runningPlanProfile.userId,
      set: {
        ...values,
        updatedAt: now,
      },
    });

  await syncWeekStartDay(userId, input.weekStartDay);
  return getRunningPlanProfile(userId);
}

export async function getRunningPlanDraft(userId: string) {
  const [draftRow, prefill] = await Promise.all([
    getActiveDraftRow(userId),
    getRunningPlanPrefill(userId),
  ]);

  return {
    draft: draftRow ? mapRunningPlanDraft(draftRow) : null,
    prefill,
  };
}

export async function saveRunningPlanDraftStep({
  userId,
  input,
}: {
  userId: string;
  input: SaveRunningPlanDraftStepInput;
}) {
  const now = new Date();
  let selectedDraft = input.draftId
    ? await db.query.runningPlanDraft.findFirst({
        where: (table, operators) =>
          operators.and(
            operators.eq(table.id, input.draftId!),
            operators.eq(table.userId, userId),
          ),
      })
    : await db.query.runningPlanDraft.findFirst({
        where: (table, operators) =>
          operators.and(
            operators.eq(table.userId, userId),
            operators.eq(table.status, "draft"),
            operators.eq(table.draftType, input.draftType),
          ),
        orderBy: (table, operators) => [operators.desc(table.updatedAt)],
      });

  if (!selectedDraft && !input.draftId) {
    await db
      .update(runningPlanDraft)
      .set({
        status: "archived",
        archivedAt: now,
        updatedAt: now,
      })
      .where(and(eq(runningPlanDraft.userId, userId), eq(runningPlanDraft.status, "draft")));
  }

  const nextDraftData = mergeDraftData(
    selectedDraft?.draftData ?? null,
    input.step,
    input.stepData,
    input.targetScaffoldId,
  );
  const nextCompletedSteps = mergeCompletedSteps(
    selectedDraft?.completedSteps ?? null,
    input.step,
  );

  if (selectedDraft) {
    await db
      .update(runningPlanDraft)
      .set({
        draftType: input.draftType,
        currentStep: input.currentStep ?? input.step,
        draftData: nextDraftData,
        completedSteps: nextCompletedSteps,
        wizardVersion: input.wizardVersion ?? selectedDraft.wizardVersion,
        lastTouchedAt: now,
        updatedAt: now,
      })
      .where(and(eq(runningPlanDraft.id, selectedDraft.id), eq(runningPlanDraft.userId, userId)));

    await logRunningPlanEvent({
      userId,
      draftId: selectedDraft.id,
      eventType: "step_saved",
      payload: {
        step: input.step,
        draftType: input.draftType,
      },
    });
  } else {
    const [createdDraft] = await db
      .insert(runningPlanDraft)
      .values({
        userId,
        draftType: input.draftType,
        status: "draft",
        currentStep: input.currentStep ?? input.step,
        draftData: nextDraftData,
        completedSteps: nextCompletedSteps,
        wizardVersion: input.wizardVersion ?? 1,
        lastTouchedAt: now,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    if (!createdDraft) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create running plan draft.",
      });
    }
    selectedDraft = createdDraft;
    await logRunningPlanEvent({
      userId,
      draftId: createdDraft.id,
      eventType: "draft_created",
      payload: {
        step: input.step,
        draftType: input.draftType,
      },
    });
  }

  const [draftRow, prefill] = await Promise.all([
    db.query.runningPlanDraft.findFirst({
      where: (table, operators) =>
        operators.and(
          operators.eq(table.id, selectedDraft.id),
          operators.eq(table.userId, userId),
        ),
    }),
    getRunningPlanPrefill(userId),
  ]);

  return {
    draft: draftRow ? mapRunningPlanDraft(draftRow) : null,
    prefill,
  };
}

export async function createRunningPlanScaffoldFromDraft({
  userId,
  input,
}: {
  userId: string;
  input: CreateRunningPlanScaffoldFromDraftInput;
}) {
  const now = new Date();
  const draftRow = input.draftId
    ? await db.query.runningPlanDraft.findFirst({
        where: (table, operators) =>
          operators.and(
            operators.eq(table.id, input.draftId!),
            operators.eq(table.userId, userId),
            operators.eq(table.status, "draft"),
          ),
      })
    : await getActiveDraftRow(userId);

  if (!draftRow) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Running plan draft not found.",
    });
  }

  const [profileRow, mappedDraft] = await Promise.all([
    db.query.runningPlanProfile.findFirst({
      where: (table, operators) => operators.eq(table.userId, userId),
    }),
    Promise.resolve(mapRunningPlanDraft(draftRow)),
  ]);

  const mappedProfile = mapRunningPlanProfile(profileRow ?? null);
  const scaffoldInput = buildScaffoldInputFromDraft({
    draftData: mappedDraft.draftData,
    profile: mappedProfile,
  });

  if (draftRow.draftType === "update_scaffold") {
    const scaffoldId = mappedDraft.draftData.targetScaffoldId;
    if (!scaffoldId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Update draft must target an existing scaffold.",
      });
    }
    await getOwnedScaffoldRow(userId, scaffoldId);
    await db
      .update(runningPlanScaffold)
      .set({
        goalType: scaffoldInput.goalType,
        goalDetails: scaffoldInput.goalDetails,
        startDate: new Date(scaffoldInput.startDate),
        targetEndDate: scaffoldInput.targetEndDate
          ? new Date(scaffoldInput.targetEndDate)
          : null,
        planningHorizonWeeks: scaffoldInput.planningHorizonWeeks ?? null,
        defaultRunsPerWeek: scaffoldInput.defaultRunsPerWeek ?? null,
        preferredRunDays: scaffoldInput.preferredRunDays,
        blockedDays: scaffoldInput.blockedDays,
        longRunDay: scaffoldInput.longRunDay ?? null,
        crossTrainingDays: scaffoldInput.crossTrainingDays ?? null,
        constraints: scaffoldInput.constraints,
        profileSnapshot: scaffoldInput.profileSnapshot,
        status: input.activate === false ? "draft" : "active",
        updatedAt: now,
      })
      .where(and(eq(runningPlanScaffold.id, scaffoldId), eq(runningPlanScaffold.userId, userId)));

    await db
      .update(runningPlanDraft)
      .set({
        status: "finalized",
        finalizedAt: now,
        updatedAt: now,
      })
      .where(and(eq(runningPlanDraft.id, draftRow.id), eq(runningPlanDraft.userId, userId)));

    await Promise.all([
      logRunningPlanEvent({
        userId,
        draftId: draftRow.id,
        scaffoldId,
        eventType: "draft_finalized",
      }),
      logRunningPlanEvent({
        userId,
        draftId: draftRow.id,
        scaffoldId,
        eventType: "scaffold_updated",
        payload: {
          source: "draft",
        },
      }),
    ]);

    const updatedScaffold = await getOwnedScaffoldRow(userId, scaffoldId);
    return mapRunningPlanScaffold(updatedScaffold);
  }

  const [createdScaffold] = await db
    .insert(runningPlanScaffold)
    .values({
      userId,
      status: input.activate === false ? "draft" : "active",
      goalType: scaffoldInput.goalType,
      goalDetails: scaffoldInput.goalDetails,
      startDate: new Date(scaffoldInput.startDate),
      targetEndDate: scaffoldInput.targetEndDate
        ? new Date(scaffoldInput.targetEndDate)
        : null,
      planningHorizonWeeks: scaffoldInput.planningHorizonWeeks ?? null,
      defaultRunsPerWeek: scaffoldInput.defaultRunsPerWeek ?? null,
      preferredRunDays: scaffoldInput.preferredRunDays,
      blockedDays: scaffoldInput.blockedDays,
      longRunDay: scaffoldInput.longRunDay ?? null,
      crossTrainingDays: scaffoldInput.crossTrainingDays ?? null,
      constraints: scaffoldInput.constraints,
      profileSnapshot: scaffoldInput.profileSnapshot,
      createdFromDraftId: draftRow.id,
      currentCycleNumber: 0,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  if (!createdScaffold) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to create running plan scaffold.",
    });
  }

  await db
    .update(runningPlanDraft)
    .set({
      status: "finalized",
      finalizedAt: now,
      updatedAt: now,
    })
    .where(and(eq(runningPlanDraft.id, draftRow.id), eq(runningPlanDraft.userId, userId)));

  await Promise.all([
    logRunningPlanEvent({
      userId,
      draftId: draftRow.id,
      scaffoldId: createdScaffold.id,
      eventType: "draft_finalized",
    }),
    logRunningPlanEvent({
      userId,
      draftId: draftRow.id,
      scaffoldId: createdScaffold.id,
      eventType: "scaffold_created",
      payload: {
        source: "draft",
      },
    }),
  ]);

  return mapRunningPlanScaffold(createdScaffold);
}

export async function getRunningPlanScaffold({
  userId,
  input,
}: {
  userId: string;
  input: GetRunningPlanScaffoldInput;
}) {
  const row = await getOwnedScaffoldRow(userId, input.id);
  return mapRunningPlanScaffold(row);
}

export async function updateRunningPlanScaffold({
  userId,
  input,
}: {
  userId: string;
  input: { id: number; data: RunningPlanScaffoldPatch };
}) {
  await getOwnedScaffoldRow(userId, input.id);
  const values = serializeScaffoldPatchForDb(input.data);

  await db
    .update(runningPlanScaffold)
    .set({
      ...values,
      updatedAt: new Date(),
    })
    .where(and(eq(runningPlanScaffold.id, input.id), eq(runningPlanScaffold.userId, userId)));

  const updatedScaffold = await getOwnedScaffoldRow(userId, input.id);
  await logRunningPlanEvent({
    userId,
    scaffoldId: input.id,
    eventType: "scaffold_updated",
    payload: {
      source: "manual",
    },
  });
  return mapRunningPlanScaffold(updatedScaffold);
}

export async function listRunningPlanScaffolds({
  userId,
  input,
}: {
  userId: string;
  input: ListRunningPlanScaffoldsInput;
}) {
  const rows = await db.query.runningPlanScaffold.findMany({
    where: (table, operators) =>
      input.status
        ? operators.and(
            operators.eq(table.userId, userId),
            operators.eq(table.status, input.status),
          )
        : operators.eq(table.userId, userId),
    orderBy: (table, operators) => [operators.desc(table.createdAt)],
    limit: input.limit ?? 20,
  });

  return rows.map(mapRunningPlanScaffold);
}

export async function listRunningPlanCycles({
  userId,
  input,
}: {
  userId: string;
  input: ListRunningPlanCyclesInput;
}) {
  await getOwnedScaffoldRow(userId, input.scaffoldId);
  const rows = await db.query.runningPlanCycle.findMany({
    where: (table, operators) =>
      operators.and(
        operators.eq(table.userId, userId),
        operators.eq(table.scaffoldId, input.scaffoldId),
      ),
    orderBy: (table, operators) => [operators.asc(table.cycleNumber)],
  });

  const cycles = await Promise.all(
    rows.map(async (row) => ({
      ...mapRunningPlanCycle(row),
      review: await getReviewByCycleId(row.id),
    })),
  );

  return cycles;
}

export async function getRunningPlanCycle({
  userId,
  input,
}: {
  userId: string;
  input: GetRunningPlanCycleInput;
}) {
  const row = await getOwnedCycleRow(userId, input.id);
  return {
    ...mapRunningPlanCycle(row),
    review: await getReviewByCycleId(row.id),
  };
}

async function deriveCycleMetrics({
  userId,
  startDate,
  endDate,
}: {
  userId: string;
  startDate: Date;
  endDate: Date;
}) {
  const rows = await db.query.intervalsActivity.findMany({
    where: (table, operators) =>
      operators.and(
        operators.eq(table.userId, userId),
        operators.isNotNull(table.startDate),
        operators.gte(table.startDate, startDate),
        operators.lte(table.startDate, endDate),
      ),
    columns: {
      type: true,
      distance: true,
      elapsedTime: true,
    },
  });

  let runCount = 0;
  let totalDistanceM = 0;
  let totalElapsedS = 0;
  let longestRunM = 0;

  for (const row of rows) {
    if (!isRunActivityType(row.type)) {
      continue;
    }
    const distance = row.distance ?? 0;
    runCount += 1;
    totalDistanceM += distance;
    totalElapsedS += row.elapsedTime ?? 0;
    if (distance > longestRunM) {
      longestRunM = distance;
    }
  }

  return {
    runCount,
    totalDistanceM,
    totalElapsedS,
    longestRunM,
    averagePaceSecPerKm:
      computePaceSecPerKm({
        elapsedSeconds: totalElapsedS,
        distanceMeters: totalDistanceM,
      }) ?? null,
  };
}

export async function saveRunningPlanCycleReview({
  userId,
  input,
}: {
  userId: string;
  input: RunningPlanCycleReviewInput;
}) {
  const now = new Date();
  const cycleRow = await getOwnedCycleRow(userId, input.cycleId);
  const derivedMetrics = await deriveCycleMetrics({
    userId,
    startDate: cycleRow.startDate,
    endDate: cycleRow.endDate,
  });

  const existingReview = await db.query.runningPlanCycleReview.findFirst({
    where: (table, operators) =>
      operators.and(
        operators.eq(table.cycleId, input.cycleId),
        operators.eq(table.userId, userId),
      ),
  });

  if (existingReview) {
    await db
      .update(runningPlanCycleReview)
      .set({
        completionScore: input.completionScore ?? null,
        feltDifficulty: input.feltDifficulty ?? null,
        fatigueLevel: input.fatigueLevel ?? null,
        painFlags: input.painFlags ?? null,
        missedRunsCount: input.missedRunsCount ?? null,
        notes: input.notes ?? null,
        derivedMetrics,
        updatedAt: now,
      })
      .where(
        and(
          eq(runningPlanCycleReview.id, existingReview.id),
          eq(runningPlanCycleReview.userId, userId),
        ),
      );
  } else {
    await db.insert(runningPlanCycleReview).values({
      userId,
      cycleId: input.cycleId,
      completionScore: input.completionScore ?? null,
      feltDifficulty: input.feltDifficulty ?? null,
      fatigueLevel: input.fatigueLevel ?? null,
      painFlags: input.painFlags ?? null,
      missedRunsCount: input.missedRunsCount ?? null,
      notes: input.notes ?? null,
      derivedMetrics,
      createdAt: now,
      updatedAt: now,
    });
  }

  await logRunningPlanEvent({
    userId,
    scaffoldId: cycleRow.scaffoldId,
    cycleId: cycleRow.id,
    eventType: "cycle_review_saved",
    payload: {
      hasNotes: Boolean(input.notes),
      completionScore: input.completionScore ?? null,
    },
  });

  return getRunningPlanCycle({
    userId,
    input: {
      id: input.cycleId,
    },
  });
}
