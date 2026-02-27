import { db } from "@hyuu/db";
import { userSettings } from "@hyuu/db/schema/auth";
import {
  dashboardRunPr,
  dashboardRunRollupMonthly,
  dashboardRunRollupWeekly,
  intervalsActivity,
  intervalsActivityBestEffort,
  intervalsActivityInterval,
  intervalsActivityStream,
  intervalsAthleteProfile,
  intervalsSyncLog,
} from "@hyuu/db/schema/intervals";
import { and, eq, inArray, isNotNull } from "drizzle-orm";
import type { IntervalsRepository } from "./intervals-repository";
import {
  recomputeWeeklyGoalProgressForDates,
  recomputeWeeklyGoalProgressForUser,
} from "./recompute-weekly-goal-progress";
import {
  mapActivityToActivityValues,
  mapActivityToBestEffortRows,
  mapActivityToIntervalRows,
  mapActivityToStreamRows,
} from "./mappers/activity-row-mapper";
import { mapAthleteToProfileValues } from "./mappers/athlete-row-mapper";
import {
  computePaceSecPerKm,
  isRunActivityType,
  startOfIsoWeekUtc,
  startOfMonthUtc,
} from "../utils";

const DASHBOARD_PR_TARGETS = [
  { prType: "fastest_1km", targetDistanceMeters: 1000 },
  { prType: "fastest_5k", targetDistanceMeters: 5000 },
  { prType: "fastest_10k", targetDistanceMeters: 10000 },
  { prType: "fastest_half", targetDistanceMeters: 21097.5 },
  { prType: "fastest_full", targetDistanceMeters: 42195 },
] as const;

export function createDrizzleIntervalsRepository(): IntervalsRepository {
  return {
    async getLatestConnectionProfile(userId) {
      const profile = await db.query.intervalsAthleteProfile.findFirst({
        where: (table, operators) => operators.eq(table.userId, userId),
        orderBy: (table, operators) => [operators.desc(table.updatedAt)],
        columns: {
          intervalsAthleteId: true,
          name: true,
          firstName: true,
          lastName: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      return profile ?? null;
    },
    async getConnectedAthleteId(userId) {
      const profile = await db.query.intervalsAthleteProfile.findFirst({
        where: (table, operators) => operators.eq(table.userId, userId),
        orderBy: (table, operators) => [operators.desc(table.updatedAt)],
        columns: {
          intervalsAthleteId: true,
        },
      });
      return profile?.intervalsAthleteId ?? null;
    },
    async getLastSuccessfulSync(userId) {
      const lastSuccessfulSync = await db.query.intervalsSyncLog.findFirst({
        where: (table, operators) =>
          operators.and(
            operators.eq(table.userId, userId),
            operators.eq(table.status, "success"),
          ),
        orderBy: (table, operators) => [operators.desc(table.completedAt)],
        columns: {
          completedAt: true,
          startedAt: true,
        },
      });
      return lastSuccessfulSync ?? null;
    },
    async getLatestSyncAttempt(userId) {
      const latestSyncAttempt = await db.query.intervalsSyncLog.findFirst({
        where: (table, operators) => operators.eq(table.userId, userId),
        orderBy: (table, operators) => [operators.desc(table.startedAt)],
        columns: {
          startedAt: true,
        },
      });
      return latestSyncAttempt ?? null;
    },
    async createSyncLogStarted({ userId, intervalsAthleteId, startedAt }) {
      const [syncRow] = await db
        .insert(intervalsSyncLog)
        .values({
          userId,
          intervalsAthleteId,
          status: "started",
          startedAt,
        })
        .returning({ id: intervalsSyncLog.id });
      return syncRow ?? null;
    },
    async completeSyncLogSuccess({
      syncLogId,
      intervalsAthleteId,
      completedAt,
      fetchedActivityCount,
    }) {
      await db
        .update(intervalsSyncLog)
        .set({
          status: "success",
          intervalsAthleteId,
          completedAt,
          fetchedActivityCount,
        })
        .where(eq(intervalsSyncLog.id, syncLogId));
    },
    async completeSyncLogFailed({ syncLogId, completedAt, errorMessage }) {
      await db
        .update(intervalsSyncLog)
        .set({
          status: "failed",
          completedAt,
          errorMessage,
        })
        .where(eq(intervalsSyncLog.id, syncLogId));
    },
    async upsertAthleteProfile({ userId, athlete, now }) {
      return db.transaction(async (tx) => {
        const existingProfile =
          await tx.query.intervalsAthleteProfile.findFirst({
            where: (table, operators) =>
              operators.and(
                operators.eq(table.userId, userId),
                operators.eq(table.intervalsAthleteId, athlete.id),
              ),
            columns: { id: true },
          });

        const profileValues = mapAthleteToProfileValues({
          userId,
          athlete,
          now,
        });

        if (!existingProfile) {
          const [created] = await tx
            .insert(intervalsAthleteProfile)
            .values({
              ...profileValues,
              createdAt: now,
            })
            .returning({ id: intervalsAthleteProfile.id });
          if (!created) {
            throw new Error("Failed to insert Intervals athlete profile.");
          }
          return { profileId: created.id };
        }

        const [updated] = await tx
          .update(intervalsAthleteProfile)
          .set(profileValues)
          .where(eq(intervalsAthleteProfile.id, existingProfile.id))
          .returning({ id: intervalsAthleteProfile.id });
        if (!updated) {
          throw new Error("Failed to update Intervals athlete profile.");
        }
        return { profileId: updated.id };
      });
    },
    async upsertActivities({ userId, intervalsAthleteId, activities }) {
      return db.transaction(async (tx) => {
        let savedCount = 0;
        const affectedDateEpochs = new Set<number>();

        for (const activity of activities) {
          const now = new Date();
          const existing = await tx.query.intervalsActivity.findFirst({
            where: (table, operators) =>
              operators.and(
                operators.eq(table.userId, userId),
                operators.eq(table.intervalsActivityId, activity.activityId),
              ),
            columns: { id: true, startDate: true },
          });

          if (existing?.startDate) {
            affectedDateEpochs.add(existing.startDate.getTime());
          }

          const activityValues = mapActivityToActivityValues({
            userId,
            intervalsAthleteId,
            activity,
            now,
          });

          if (activityValues.startDate) {
            affectedDateEpochs.add(activityValues.startDate.getTime());
          }

          let activityRowId: number;
          if (!existing) {
            const [created] = await tx
              .insert(intervalsActivity)
              .values({
                ...activityValues,
                createdAt: now,
              })
              .returning({ id: intervalsActivity.id });
            if (!created) {
              throw new Error("Failed to insert Intervals activity.");
            }
            activityRowId = created.id;
          } else {
            const [updated] = await tx
              .update(intervalsActivity)
              .set(activityValues)
              .where(eq(intervalsActivity.id, existing.id))
              .returning({ id: intervalsActivity.id });
            if (!updated) {
              throw new Error("Failed to update Intervals activity.");
            }
            activityRowId = updated.id;
          }

          await tx
            .delete(intervalsActivityInterval)
            .where(eq(intervalsActivityInterval.activityId, activityRowId));
          await tx
            .delete(intervalsActivityStream)
            .where(eq(intervalsActivityStream.activityId, activityRowId));
          await tx
            .delete(intervalsActivityBestEffort)
            .where(eq(intervalsActivityBestEffort.activityId, activityRowId));

          const intervalRows = mapActivityToIntervalRows({
            activityId: activityRowId,
            activity,
            now,
          });

          if (intervalRows.length > 0) {
            await tx.insert(intervalsActivityInterval).values(intervalRows);
          }

          const streamRows = mapActivityToStreamRows({
            activityId: activityRowId,
            activity,
            now,
          });

          if (streamRows.length > 0) {
            await tx.insert(intervalsActivityStream).values(streamRows);
          }

          const bestEffortRows = mapActivityToBestEffortRows({
            activityId: activityRowId,
            activity,
            now,
          });

          if (bestEffortRows.length > 0) {
            await tx.insert(intervalsActivityBestEffort).values(bestEffortRows);
          }

          savedCount += 1;
        }

        return {
          savedActivityCount: savedCount,
          affectedDates: [...affectedDateEpochs]
            .sort((a, b) => a - b)
            .map((epochMs) => new Date(epochMs)),
        };
      });
    },
    async recomputeDashboardRunRollups({ userId, affectedDates }) {
      if (affectedDates.length === 0) {
        return;
      }

      const weekStarts = new Set(
        affectedDates.map((date) => startOfIsoWeekUtc(date).toISOString()),
      );
      const monthStarts = new Set(
        affectedDates.map((date) => startOfMonthUtc(date).toISOString()),
      );

      for (const weekStartIso of weekStarts) {
        const weekStart = new Date(weekStartIso);
        const weekEnd = new Date(weekStart);
        weekEnd.setUTCDate(weekEnd.getUTCDate() + 7);
        await recomputeWeeklyBucket({ userId, weekStart, weekEnd });
      }

      for (const monthStartIso of monthStarts) {
        const monthStart = new Date(monthStartIso);
        const monthEnd = new Date(monthStart);
        monthEnd.setUTCMonth(monthEnd.getUTCMonth() + 1);
        await recomputeMonthlyBucket({ userId, monthStart, monthEnd });
      }

      await recomputeRunPrs(userId);
      const weekStartDay = await getUserWeekStartDay(userId);
      await recomputeWeeklyGoalProgressForDates({
        userId,
        affectedDates,
        weekStartDay,
      });
    },
    async recomputeDashboardRunRollupsForUser(userId) {
      await recomputeAllRunRollups(userId);
      await recomputeRunPrs(userId);
      const weekStartDay = await getUserWeekStartDay(userId);
      await recomputeWeeklyGoalProgressForUser({
        userId,
        weekStartDay,
      });
    },
    async listConnectedUserIds() {
      const rows = await db.query.intervalsAthleteProfile.findMany({
        columns: {
          userId: true,
        },
      });
      return [...new Set(rows.map((row) => row.userId))];
    },
  };
}

async function getUserWeekStartDay(userId: string): Promise<0 | 1> {
  const settings = await db.query.userSettings.findFirst({
    where: (table, operators) => operators.eq(table.userId, userId),
    columns: {
      weekStartDay: true,
    },
  });
  if (settings) {
    return settings.weekStartDay === 0 ? 0 : 1;
  }

  await db.insert(userSettings).values({
    userId,
    weekStartDay: 1,
  }).onConflictDoNothing();
  return 1;
}

type ActivityForRollup = {
  type: string | null;
  distance: number | null;
  elapsedTime: number | null;
  movingTime: number | null;
};

function buildRollupStats(rows: ActivityForRollup[]) {
  let runCount = 0;
  let totalDistanceM = 0;
  let totalElapsedS = 0;
  let totalMovingS = 0;

  for (const row of rows) {
    if (!isRunActivityType(row.type)) {
      continue;
    }
    runCount += 1;
    totalDistanceM += row.distance ?? 0;
    totalElapsedS += row.elapsedTime ?? 0;
    totalMovingS += row.movingTime ?? 0;
  }

  if (runCount === 0) {
    return null;
  }

  return {
    runCount,
    totalDistanceM,
    totalElapsedS,
    totalMovingS,
    avgPaceSecPerKm:
      computePaceSecPerKm({
        elapsedSeconds: totalElapsedS,
        distanceMeters: totalDistanceM,
      }) ?? 0,
  };
}

async function recomputeWeeklyBucket({
  userId,
  weekStart,
  weekEnd,
}: {
  userId: string;
  weekStart: Date;
  weekEnd: Date;
}) {
  const rows = await db.query.intervalsActivity.findMany({
    where: (table, operators) =>
      operators.and(
        operators.eq(table.userId, userId),
        operators.gte(table.startDate, weekStart),
        operators.lt(table.startDate, weekEnd),
      ),
    columns: {
      type: true,
      distance: true,
      elapsedTime: true,
      movingTime: true,
    },
  });

  const stats = buildRollupStats(rows);

  await db
    .delete(dashboardRunRollupWeekly)
    .where(
      and(
        eq(dashboardRunRollupWeekly.userId, userId),
        eq(dashboardRunRollupWeekly.weekStartLocal, weekStart),
      ),
    );

  if (!stats) {
    return;
  }

  await db.insert(dashboardRunRollupWeekly).values({
    userId,
    weekStartLocal: weekStart,
    runCount: stats.runCount,
    totalDistanceM: stats.totalDistanceM,
    totalElapsedS: stats.totalElapsedS,
    totalMovingS: stats.totalMovingS,
    avgPaceSecPerKm: stats.avgPaceSecPerKm,
  });
}

async function recomputeMonthlyBucket({
  userId,
  monthStart,
  monthEnd,
}: {
  userId: string;
  monthStart: Date;
  monthEnd: Date;
}) {
  const rows = await db.query.intervalsActivity.findMany({
    where: (table, operators) =>
      operators.and(
        operators.eq(table.userId, userId),
        operators.gte(table.startDate, monthStart),
        operators.lt(table.startDate, monthEnd),
      ),
    columns: {
      type: true,
      distance: true,
      elapsedTime: true,
      movingTime: true,
    },
  });

  const stats = buildRollupStats(rows);

  await db
    .delete(dashboardRunRollupMonthly)
    .where(
      and(
        eq(dashboardRunRollupMonthly.userId, userId),
        eq(dashboardRunRollupMonthly.monthStartLocal, monthStart),
      ),
    );

  if (!stats) {
    return;
  }

  await db.insert(dashboardRunRollupMonthly).values({
    userId,
    monthStartLocal: monthStart,
    runCount: stats.runCount,
    totalDistanceM: stats.totalDistanceM,
    totalElapsedS: stats.totalElapsedS,
    totalMovingS: stats.totalMovingS,
    avgPaceSecPerKm: stats.avgPaceSecPerKm,
  });
}

async function recomputeAllRunRollups(userId: string) {
  const rows = await db.query.intervalsActivity.findMany({
    where: (table, operators) =>
      operators.and(
        operators.eq(table.userId, userId),
        operators.isNotNull(table.startDate),
      ),
    columns: {
      type: true,
      distance: true,
      elapsedTime: true,
      movingTime: true,
      startDate: true,
    },
  });

  const weeklyRows = new Map<string, ActivityForRollup[]>();
  const monthlyRows = new Map<string, ActivityForRollup[]>();

  for (const row of rows) {
    if (!row.startDate) {
      continue;
    }
    const weekStart = startOfIsoWeekUtc(row.startDate);
    const monthStart = startOfMonthUtc(row.startDate);
    const weekKey = weekStart.toISOString();
    const monthKey = monthStart.toISOString();

    const rollupRow = {
      type: row.type,
      distance: row.distance,
      elapsedTime: row.elapsedTime,
      movingTime: row.movingTime,
    } satisfies ActivityForRollup;

    const weekBucket = weeklyRows.get(weekKey);
    if (weekBucket) {
      weekBucket.push(rollupRow);
    } else {
      weeklyRows.set(weekKey, [rollupRow]);
    }

    const monthBucket = monthlyRows.get(monthKey);
    if (monthBucket) {
      monthBucket.push(rollupRow);
    } else {
      monthlyRows.set(monthKey, [rollupRow]);
    }
  }

  await db.delete(dashboardRunRollupWeekly).where(eq(dashboardRunRollupWeekly.userId, userId));
  await db.delete(dashboardRunRollupMonthly).where(eq(dashboardRunRollupMonthly.userId, userId));

  const weeklyValues = [...weeklyRows.entries()].flatMap(([weekStartIso, bucketRows]) => {
    const stats = buildRollupStats(bucketRows);
    if (!stats) {
      return [];
    }
    return [
      {
        userId,
        weekStartLocal: new Date(weekStartIso),
        runCount: stats.runCount,
        totalDistanceM: stats.totalDistanceM,
        totalElapsedS: stats.totalElapsedS,
        totalMovingS: stats.totalMovingS,
        avgPaceSecPerKm: stats.avgPaceSecPerKm,
      },
    ];
  });

  if (weeklyValues.length > 0) {
    await db.insert(dashboardRunRollupWeekly).values(weeklyValues);
  }

  const monthlyValues = [...monthlyRows.entries()].flatMap(
    ([monthStartIso, bucketRows]) => {
      const stats = buildRollupStats(bucketRows);
      if (!stats) {
        return [];
      }
      return [
        {
          userId,
          monthStartLocal: new Date(monthStartIso),
          runCount: stats.runCount,
          totalDistanceM: stats.totalDistanceM,
          totalElapsedS: stats.totalElapsedS,
          totalMovingS: stats.totalMovingS,
          avgPaceSecPerKm: stats.avgPaceSecPerKm,
        },
      ];
    },
  );

  if (monthlyValues.length > 0) {
    await db.insert(dashboardRunRollupMonthly).values(monthlyValues);
  }
}

async function recomputeRunPrs(userId: string) {
  const now = new Date();
  const prRows: Array<{
    userId: string;
    prType: string;
    activityId: number | null;
    valueSeconds: number | null;
    valueDistanceM: number | null;
    activityStartDate: Date | null;
    updatedAt: Date;
  }> = [];

  const longestRunCandidates = await db.query.intervalsActivity.findMany({
    where: (table, operators) =>
      operators.and(
        operators.eq(table.userId, userId),
        operators.isNotNull(table.startDate),
      ),
    columns: {
      id: true,
      type: true,
      startDate: true,
      distance: true,
    },
  });

  let longestRun:
    | {
        activityId: number;
        distance: number;
        startDate: Date;
      }
    | undefined;

  for (const candidate of longestRunCandidates) {
    if (!isRunActivityType(candidate.type) || !candidate.startDate) {
      continue;
    }
    const distance = candidate.distance ?? 0;
    if (!longestRun || distance > longestRun.distance) {
      longestRun = {
        activityId: candidate.id,
        distance,
        startDate: candidate.startDate,
      };
    }
  }

  if (longestRun) {
    prRows.push({
      userId,
      prType: "longest_run",
      activityId: longestRun.activityId,
      valueSeconds: null,
      valueDistanceM: longestRun.distance,
      activityStartDate: longestRun.startDate,
      updatedAt: now,
    });
  }

  const bestEffortRows = await db
    .select({
      activityId: intervalsActivity.id,
      activityType: intervalsActivity.type,
      activityStartDate: intervalsActivity.startDate,
      targetDistanceMeters: intervalsActivityBestEffort.targetDistanceMeters,
      durationSeconds: intervalsActivityBestEffort.durationSeconds,
    })
    .from(intervalsActivityBestEffort)
    .innerJoin(
      intervalsActivity,
      eq(intervalsActivity.id, intervalsActivityBestEffort.activityId),
    )
    .where(
      and(
        eq(intervalsActivity.userId, userId),
        isNotNull(intervalsActivity.startDate),
        inArray(
          intervalsActivityBestEffort.targetDistanceMeters,
          DASHBOARD_PR_TARGETS.map((entry) => entry.targetDistanceMeters),
        ),
      ),
    );

  for (const target of DASHBOARD_PR_TARGETS) {
    const bestForTarget = bestEffortRows
      .filter(
        (row) =>
          isRunActivityType(row.activityType) &&
          row.targetDistanceMeters === target.targetDistanceMeters,
      )
      .reduce<
        | {
            activityId: number;
            activityStartDate: Date;
            durationSeconds: number;
          }
        | undefined
      >((best, row) => {
        if (!row.activityStartDate) {
          return best;
        }
        if (!best || row.durationSeconds < best.durationSeconds) {
          return {
            activityId: row.activityId,
            activityStartDate: row.activityStartDate,
            durationSeconds: row.durationSeconds,
          };
        }
        return best;
      }, undefined);

    if (!bestForTarget) {
      continue;
    }

    prRows.push({
      userId,
      prType: target.prType,
      activityId: bestForTarget.activityId,
      valueSeconds: bestForTarget.durationSeconds,
      valueDistanceM: null,
      activityStartDate: bestForTarget.activityStartDate,
      updatedAt: now,
    });
  }

  await db.delete(dashboardRunPr).where(eq(dashboardRunPr.userId, userId));
  if (prRows.length > 0) {
    await db.insert(dashboardRunPr).values(prRows);
  }
}
