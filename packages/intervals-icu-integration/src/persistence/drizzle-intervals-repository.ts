import { db } from "@hyuu/db";
import {
  intervalsActivity,
  intervalsActivityBestEffort,
  intervalsActivityInterval,
  intervalsActivityStream,
  intervalsAthleteProfile,
  intervalsSyncLog,
} from "@hyuu/db/schema/intervals";
import { eq } from "drizzle-orm";
import { toLocalDateOrNull } from "../utils";
import type { IntervalsRepository } from "./intervals-repository";
import {
  mapActivityToActivityValues,
  mapActivityToBestEffortRows,
  mapActivityToIntervalRows,
  mapActivityToStreamRows,
} from "./mappers/activity-row-mapper";
import { mapAthleteToProfileValues } from "./mappers/athlete-row-mapper";
import {
  recomputeWeeklyGoalProgressForDates,
  recomputeWeeklyGoalProgressForUser,
} from "./recompute-weekly-goal-progress";
import { recomputeRunPrsForUser } from "./recompute-run-prs-service";
import {
  recomputeAllRunRollupsForUser,
  recomputeRunRollupsForAffectedDates,
} from "./recompute-run-rollups-service";
import { getOrCreateUserWeekStartDay } from "./week-start-day-service";

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
            columns: { id: true, startDate: true, startDateLocal: true },
          });

          let trackedExistingDate = false;
          if (existing?.startDateLocal) {
            const existingStartDateLocal = toLocalDateOrNull(
              existing.startDateLocal,
            );
            if (existingStartDateLocal) {
              affectedDateEpochs.add(existingStartDateLocal.getTime());
              trackedExistingDate = true;
            }
          }
          if (!trackedExistingDate && existing?.startDate) {
            affectedDateEpochs.add(existing.startDate.getTime());
          }

          const activityValues = mapActivityToActivityValues({
            userId,
            intervalsAthleteId,
            activity,
            now,
          });

          const startDateLocal = toLocalDateOrNull(activityValues.startDateLocal);
          if (startDateLocal) {
            affectedDateEpochs.add(startDateLocal.getTime());
          } else if (activityValues.startDate) {
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
      await recomputeRunRollupsForAffectedDates({ userId, affectedDates });
      await recomputeRunPrsForUser(userId);
      const weekStartDay = await getOrCreateUserWeekStartDay(userId);
      await recomputeWeeklyGoalProgressForDates({
        userId,
        affectedDates,
        weekStartDay,
      });
    },
    async recomputeDashboardRunRollupsForUser(userId) {
      await recomputeAllRunRollupsForUser(userId);
      await recomputeRunPrsForUser(userId);
      const weekStartDay = await getOrCreateUserWeekStartDay(userId);
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
