import { db as defaultDb } from "@hyuu/db";
import {
  intervalsActivity,
  intervalsActivityInterval,
  intervalsAthleteProfile,
  intervalsSyncLog,
} from "@hyuu/db/schema/intervals";
import { mapActivityToActivityValues, mapActivityToIntervalRows } from "./mappers/activity-row-mapper";
import { mapAthleteToProfileValues } from "./mappers/athlete-row-mapper";
import type { IntervalsRepository } from "./intervals-repository";

export function createDrizzleIntervalsRepository(
  db: any = defaultDb,
): IntervalsRepository {
  return {
    async getLatestConnectionProfile(userId) {
      const profile = await db.query.intervalsAthleteProfile.findFirst({
        where: (table: any, operators: any) => operators.eq(table.userId, userId),
        orderBy: (table: any, operators: any) => [operators.desc(table.updatedAt)],
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
        where: (table: any, operators: any) => operators.eq(table.userId, userId),
        orderBy: (table: any, operators: any) => [operators.desc(table.updatedAt)],
        columns: {
          intervalsAthleteId: true,
        },
      });
      return profile?.intervalsAthleteId ?? null;
    },
    async getLastSuccessfulSync(userId) {
      const lastSuccessfulSync = await db.query.intervalsSyncLog.findFirst({
        where: (table: any, operators: any) =>
          operators.and(
            operators.eq(table.userId, userId),
            operators.eq(table.status, "success"),
          ),
        orderBy: (table: any, operators: any) => [operators.desc(table.completedAt)],
        columns: {
          completedAt: true,
          startedAt: true,
        },
      });
      return lastSuccessfulSync ?? null;
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
        .where((table: any, operators: any) => operators.eq(table.id, syncLogId));
    },
    async completeSyncLogFailed({ syncLogId, completedAt, errorMessage }) {
      await db
        .update(intervalsSyncLog)
        .set({
          status: "failed",
          completedAt,
          errorMessage,
        })
        .where((table: any, operators: any) => operators.eq(table.id, syncLogId));
    },
    async upsertAthleteProfile({ userId, athlete, now }) {
      return db.transaction(async (tx: any) => {
        const existingProfile = await tx.query.intervalsAthleteProfile.findFirst({
          where: (table: any, operators: any) =>
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
          .where((table: any, operators: any) =>
            operators.eq(table.id, existingProfile.id),
          )
          .returning({ id: intervalsAthleteProfile.id });
        if (!updated) {
          throw new Error("Failed to update Intervals athlete profile.");
        }
        return { profileId: updated.id };
      });
    },
    async upsertActivities({ userId, intervalsAthleteId, activities }) {
      return db.transaction(async (tx: any) => {
        let savedCount = 0;

        for (const activity of activities) {
          const now = new Date();
          const existing = await tx.query.intervalsActivity.findFirst({
            where: (table: any, operators: any) =>
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
              .where((table: any, operators: any) =>
                operators.eq(table.id, existing.id),
              )
              .returning({ id: intervalsActivity.id });
            if (!updated) {
              throw new Error("Failed to update Intervals activity.");
            }
            activityRowId = updated.id;
          }

          await tx
            .delete(intervalsActivityInterval)
            .where((table: any, operators: any) =>
              operators.eq(table.activityId, activityRowId),
            );

          const intervalRows = mapActivityToIntervalRows({
            activityId: activityRowId,
            activity,
            now,
          });

          if (intervalRows.length > 0) {
            await tx.insert(intervalsActivityInterval).values(intervalRows);
          }

          savedCount += 1;
        }

        return savedCount;
      });
    },
  };
}
