import { db } from "@hyuu/db";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { protectedProcedure, publicProcedure, router } from "../index";
import {
  activityMapDataSchema,
  activityStreamAnomaliesSchema,
  activityStreamData2Schema,
  activityStreamDataSchema,
  heartRateZoneDurationsSecondsSchema,
  heartRateZonesBpmSchema,
  intervalSummarySchema,
  oneKmSplitTimesSecondsSchema,
} from "../schemas/activities";
import {
  formatDistance,
  formatDuration,
  formatPace,
  formatPaceFromSecondsPerKm,
  getIsoWeekNumber,
  parseNullableJsonb,
  startOfIsoWeekUtc,
  startOfMonthUtc,
} from "../utils";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return "OK";
  }),
  privateData: protectedProcedure.query(({ ctx }) => {
    return {
      message: "This is private",
      user: ctx.session.user,
    };
  }),
  activities: protectedProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(100).default(20),
        cursor: z
          .object({
            id: z.number().int().positive(),
            startDate: z.iso.datetime(),
          })
          .optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const cursorStartDate = input.cursor
        ? new Date(input.cursor.startDate)
        : undefined;

      const rows = await db.query.intervalsActivity.findMany({
        where: (table, operators) =>
          operators.and(
            operators.eq(table.userId, ctx.session.user.id),
            operators.isNotNull(table.startDate),
            input.cursor && cursorStartDate
              ? operators.or(
                  operators.lt(table.startDate, cursorStartDate),
                  operators.and(
                    operators.eq(table.startDate, cursorStartDate),
                    operators.lt(table.id, input.cursor.id),
                  ),
                )
              : undefined,
          ),
        orderBy: (table, operators) => [
          operators.desc(table.startDate),
          operators.desc(table.id),
        ],
        limit: input.limit + 1,
        columns: {
          id: true,
          name: true,
          distance: true,
          startDate: true,
          elapsedTime: true,
          averageHeartrate: true,
          mapData: true,
        },
      });

      const hasNextPage = rows.length > input.limit;
      const items = hasNextPage ? rows.slice(0, input.limit) : rows;
      const lastItem = items.at(-1);
      const nextCursor =
        hasNextPage && lastItem?.startDate
          ? {
              id: lastItem.id,
              startDate: lastItem.startDate.toISOString(),
            }
          : undefined;

      return {
        items: items.map((item) => ({
          id: item.id,
          name: item.name ?? "Untitled activity",
          distance: item.distance ?? 0,
          startDate: item.startDate,
          elapsedTime: item.elapsedTime,
          averageHeartrate: item.averageHeartrate,
          routePreview: parseNullableJsonb(item.mapData, activityMapDataSchema),
        })),
        nextCursor,
      };
    }),
  activitiesMap: protectedProcedure
    .input(
      z.object({
        startDate: z.iso.datetime(),
        endDate: z.iso.datetime(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const startDate = new Date(input.startDate);
      const endDate = new Date(input.endDate);

      if (startDate.getTime() > endDate.getTime()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "startDate must be before or equal to endDate",
        });
      }

      const rows = await db.query.intervalsActivity.findMany({
        where: (table, operators) =>
          operators.and(
            operators.eq(table.userId, ctx.session.user.id),
            operators.isNotNull(table.startDate),
            operators.gte(table.startDate, startDate),
            operators.lte(table.startDate, endDate),
          ),
        orderBy: (table, operators) => [
          operators.asc(table.startDate),
          operators.asc(table.id),
        ],
        columns: {
          id: true,
          name: true,
          startDate: true,
          distance: true,
          elapsedTime: true,
          averageHeartrate: true,
          mapData: true,
        },
      });

      return rows.map((row) => ({
        id: row.id,
        name: row.name ?? "Untitled activity",
        startDate: row.startDate,
        distance: row.distance ?? 0,
        elapsedTime: row.elapsedTime,
        averageHeartrate: row.averageHeartrate,
        routePreview: parseNullableJsonb(row.mapData, activityMapDataSchema),
      }));
    }),
  dashboard: protectedProcedure.query(async ({ ctx }) => {
    const now = new Date();
    const currentWeekStart = startOfIsoWeekUtc(now);
    const oldestWeekStart = new Date(currentWeekStart);
    oldestWeekStart.setUTCDate(oldestWeekStart.getUTCDate() - 7 * 11);
    const currentMonthStart = startOfMonthUtc(now);
    const yearStart = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));

    const [weeklyRows, monthlyRows, prRows, recentRows] = await Promise.all([
      db.query.dashboardRunRollupWeekly.findMany({
        where: (table, operators) =>
          operators.and(
            operators.eq(table.userId, ctx.session.user.id),
            operators.gte(table.weekStartLocal, oldestWeekStart),
            operators.lte(table.weekStartLocal, currentWeekStart),
          ),
        orderBy: (table, operators) => [operators.asc(table.weekStartLocal)],
        columns: {
          weekStartLocal: true,
          totalDistanceM: true,
          avgPaceSecPerKm: true,
        },
      }),
      db.query.dashboardRunRollupMonthly.findMany({
        where: (table, operators) =>
          operators.and(
            operators.eq(table.userId, ctx.session.user.id),
            operators.gte(table.monthStartLocal, yearStart),
            operators.lte(table.monthStartLocal, currentMonthStart),
          ),
        orderBy: (table, operators) => [operators.asc(table.monthStartLocal)],
        columns: {
          monthStartLocal: true,
          totalDistanceM: true,
          totalElapsedS: true,
        },
      }),
      db.query.dashboardRunPr.findMany({
        where: (table, operators) =>
          operators.eq(table.userId, ctx.session.user.id),
        columns: {
          prType: true,
          valueSeconds: true,
          valueDistanceM: true,
          activityStartDate: true,
        },
      }),
      db.query.intervalsActivity.findMany({
        where: (table, operators) =>
          operators.and(
            operators.eq(table.userId, ctx.session.user.id),
            operators.isNotNull(table.startDate),
          ),
        orderBy: (table, operators) => [
          operators.desc(table.startDate),
          operators.desc(table.id),
        ],
        limit: 40,
        columns: {
          id: true,
          name: true,
          type: true,
          startDate: true,
          distance: true,
          elapsedTime: true,
        },
      }),
    ]);

    const monthlyByStart = new Map(
      monthlyRows.map((row) => [row.monthStartLocal.toISOString(), row]),
    );
    const currentMonth = monthlyByStart.get(currentMonthStart.toISOString());
    let yearDistanceM = 0;
    for (const row of monthlyRows) {
      yearDistanceM += row.totalDistanceM ?? 0;
    }

    const currentWeek = weeklyRows.find(
      (row) =>
        row.weekStartLocal.toISOString() === currentWeekStart.toISOString(),
    );

    const prByType = new Map(prRows.map((row) => [row.prType, row]));
    const recentRuns = recentRows
      .filter((row) => isRunActivityType(row.type))
      .slice(0, 5)
      .map((row) => {
        const elapsedSeconds = row.elapsedTime ?? 0;
        const distanceMeters = row.distance ?? 0;
        return {
          id: row.id,
          date: row.startDate,
          name: row.name ?? "Untitled activity",
          distanceMeters,
          distance: formatDistance(distanceMeters),
          pace: formatPace(elapsedSeconds, distanceMeters),
          elapsedSeconds,
          elapsed: formatDuration(elapsedSeconds),
        };
      });

    const weeklyMileage = weeklyRows.map((row) => {
      const distanceMeters = row.totalDistanceM ?? 0;
      return {
        weekStart: row.weekStartLocal,
        distanceMeters,
        distanceMiles: Number((distanceMeters / 1609.344).toFixed(2)),
      };
    });

    const paceTrend = weeklyRows.map((row) => ({
      weekStart: row.weekStartLocal,
      paceSecPerKm: row.avgPaceSecPerKm,
      pace: formatPaceFromSecondsPerKm(row.avgPaceSecPerKm),
    }));

    return {
      kpis: {
        totalMilesThisMonth: formatDistance(currentMonth?.totalDistanceM ?? 0),
        totalMilesThisYear: formatDistance(yearDistanceM),
        averagePaceThisWeek: formatPaceFromSecondsPerKm(
          currentWeek?.avgPaceSecPerKm ?? null,
        ),
        totalTimeRunThisMonth: formatDuration(currentMonth?.totalElapsedS ?? 0),
      },
      personalRecords: {
        fastest1km: formatDuration(
          prByType.get("fastest_1km")?.valueSeconds ?? 0,
        ),
        fastest5k: formatDuration(
          prByType.get("fastest_5k")?.valueSeconds ?? 0,
        ),
        fastest10k: formatDuration(
          prByType.get("fastest_10k")?.valueSeconds ?? 0,
        ),
        fastestHalf: formatDuration(
          prByType.get("fastest_half")?.valueSeconds ?? 0,
        ),
        fastestFull: formatDuration(
          prByType.get("fastest_full")?.valueSeconds ?? 0,
        ),
        longestRunEver: formatDistance(
          prByType.get("longest_run")?.valueDistanceM ?? 0,
        ),
      },
      recentRuns,
      trends: {
        weeklyMileage,
        averagePace: paceTrend,
      },
    };
  }),
  trainingPlan: protectedProcedure
    .input(
      z.object({
        startDate: z.iso.datetime(),
        endDate: z.iso.datetime(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const startDate = new Date(input.startDate);
      const endDate = new Date(input.endDate);

      if (startDate.getTime() > endDate.getTime()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "startDate must be before or equal to endDate",
        });
      }

      const rows = await db.query.intervalsActivity.findMany({
        where: (table, operators) =>
          operators.and(
            operators.eq(table.userId, ctx.session.user.id),
            operators.isNotNull(table.startDate),
            operators.gte(table.startDate, startDate),
            operators.lte(table.startDate, endDate),
          ),
        columns: {
          id: true,
          name: true,
          startDate: true,
          elapsedTime: true,
          distance: true,
          averageHeartrate: true,
          trainingLoad: true,
          totalElevationGain: true,
        },
      });

      const weekTotals = new Map<
        number,
        { elevation: number; distanceMeters: number; elapsedSeconds: number }
      >();

      const workouts = rows
        .filter(
          (row): row is typeof row & { startDate: Date } => !!row.startDate,
        )
        .map((row) => {
          const elapsedSeconds = row.elapsedTime ?? 0;
          const distanceMeters = row.distance ?? 0;
          const elevationMeters = row.totalElevationGain ?? 0;
          const week = getIsoWeekNumber(row.startDate);
          const current = weekTotals.get(week) ?? {
            elevation: 0,
            distanceMeters: 0,
            elapsedSeconds: 0,
          };

          weekTotals.set(week, {
            elevation: current.elevation + elevationMeters,
            distanceMeters: current.distanceMeters + distanceMeters,
            elapsedSeconds: current.elapsedSeconds + elapsedSeconds,
          });

          return {
            id: row.id,
            date: row.startDate,
            duration: formatDuration(elapsedSeconds),
            distance: formatDistance(distanceMeters),
            bpm: Math.round(row.averageHeartrate ?? 0),
            pace: formatPace(elapsedSeconds, distanceMeters),
            load: row.trainingLoad ?? 0,
            title: row.name ?? "Untitled activity",
          };
        });

      const weekSummaries = Object.fromEntries(
        Array.from(weekTotals.entries()).map(([week, totals]) => [
          week,
          {
            elevation: Math.round(totals.elevation),
            runDist: formatDistance(totals.distanceMeters),
            runTime: formatDuration(totals.elapsedSeconds),
          },
        ]),
      );

      return {
        workouts,
        weekSummaries,
      };
    }),
  activity: protectedProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const row = await db.query.intervalsActivity.findFirst({
        where: (table, operators) =>
          operators.and(
            operators.eq(table.userId, ctx.session.user.id),
            operators.eq(table.id, input.id),
          ),
        columns: {
          id: true,
          userId: true,
          intervalsAthleteId: true,
          intervalsActivityId: true,
          type: true,
          name: true,
          source: true,
          externalId: true,
          startDate: true,
          startDateLocal: true,
          analyzedAt: true,
          syncedAt: true,
          distance: true,
          movingTime: true,
          elapsedTime: true,
          totalElevationGain: true,
          totalElevationLoss: true,
          averageSpeed: true,
          maxSpeed: true,
          averageHeartrate: true,
          maxHeartrate: true,
          averageCadence: true,
          averageStride: true,
          calories: true,
          deviceName: true,
          trainingLoad: true,
          hrLoad: true,
          intensity: true,
          lthr: true,
          athleteMaxHr: true,
          heartRateZonesBpm: true,
          heartRateZoneDurationsSeconds: true,
          oneKmSplitTimesSeconds: true,
          intervalSummary: true,
          mapData: true,
          createdAt: true,
          updatedAt: true,
        },
        with: {
          intervals: {
            columns: {
              id: true,
              activityId: true,
              intervalId: true,
              intervalType: true,
              groupId: true,
              zone: true,
              intensity: true,
              distance: true,
              movingTime: true,
              elapsedTime: true,
              startTime: true,
              endTime: true,
              averageSpeed: true,
              maxSpeed: true,
              averageHeartrate: true,
              maxHeartrate: true,
              averageCadence: true,
              averageStride: true,
              totalElevationGain: true,
              createdAt: true,
              updatedAt: true,
            },
            orderBy: (table, operators) => [
              operators.asc(table.startTime),
              operators.asc(table.id),
            ],
          },
          streams: {
            columns: {
              id: true,
              activityId: true,
              streamType: true,
              name: true,
              data: true,
              data2: true,
              valueTypeIsArray: true,
              anomalies: true,
              custom: true,
              allNull: true,
              createdAt: true,
              updatedAt: true,
            },
            orderBy: (table, operators) => [
              operators.asc(table.streamType),
              operators.asc(table.id),
            ],
          },
          bestEfforts: {
            columns: {
              id: true,
              activityId: true,
              targetDistanceMeters: true,
              durationSeconds: true,
            },
          },
        },
      });

      if (!row) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Activity not found",
        });
      }

      return {
        ...row,
        streams: row.streams.map((stream) => ({
          ...stream,
          data: parseNullableJsonb(stream.data, activityStreamDataSchema) ?? [],
          data2: parseNullableJsonb(stream.data2, activityStreamData2Schema),
          anomalies:
            parseNullableJsonb(
              stream.anomalies,
              activityStreamAnomaliesSchema,
            ) ?? [],
        })),
        heartRateZonesBpm: parseNullableJsonb(
          row.heartRateZonesBpm,
          heartRateZonesBpmSchema,
        ),
        heartRateZoneDurationsSeconds: parseNullableJsonb(
          row.heartRateZoneDurationsSeconds,
          heartRateZoneDurationsSecondsSchema,
        ),
        oneKmSplitTimesSeconds: parseNullableJsonb(
          row.oneKmSplitTimesSeconds,
          oneKmSplitTimesSecondsSchema,
        ),
        intervalSummary: parseNullableJsonb(
          row.intervalSummary,
          intervalSummarySchema,
        ),
        mapData: parseNullableJsonb(row.mapData, activityMapDataSchema),
      };
    }),
});
export type AppRouter = typeof appRouter;

const RUN_ACTIVITY_TYPES = new Set([
  "run",
  "trailrun",
  "treadmillrun",
  "virtualrun",
]);

function isRunActivityType(type: string | null) {
  if (!type) {
    return false;
  }
  const normalized = type.replaceAll(/[\s_-]/g, "").toLowerCase();
  return RUN_ACTIVITY_TYPES.has(normalized);
}
