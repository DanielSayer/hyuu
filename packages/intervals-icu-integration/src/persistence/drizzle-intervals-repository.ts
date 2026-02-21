import { db } from "@hyuu/db";
import {
  intervalsActivity,
  intervalsActivityInterval,
  intervalsActivityStream,
  intervalsAthleteProfile,
  intervalsSyncLog,
} from "@hyuu/db/schema/intervals";
import { eq } from "drizzle-orm";
import type { IntervalsRepository } from "./intervals-repository";
import {
  mapActivityToActivityValues,
  mapActivityToIntervalRows,
  mapActivityToStreamRows,
} from "./mappers/activity-row-mapper";
import { mapAthleteToProfileValues } from "./mappers/athlete-row-mapper";

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

        for (const activity of activities) {
          const now = new Date();
          const existing = await tx.query.intervalsActivity.findFirst({
            where: (table, operators) =>
              operators.and(
                operators.eq(table.userId, userId),
                operators.eq(table.intervalsActivityId, activity.activityId),
              ),
            columns: { id: true },
          });

          const activityValues = mapActivityToActivityValues({
            userId,
            intervalsAthleteId,
            activity,
            now,
          });

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

          savedCount += 1;
        }

        return savedCount;
      });
    },
  };
}
