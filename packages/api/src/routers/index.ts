import { db } from "@hyuu/db";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { formatDistanceToKm } from "@hyuu/utils/distance";
import { formatSecondsToHms } from "@hyuu/utils/time";
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
  formatPace,
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
  recentActivities: protectedProcedure.query(async ({ ctx }) => {
    const rows = await db.query.intervalsActivity.findMany({
      where: (table, operators) =>
        operators.and(
          operators.eq(table.userId, ctx.session.user.id),
          operators.isNotNull(table.startDate),
        ),
      orderBy: (table, operators) => [
        operators.desc(table.startDate),
        operators.desc(table.id),
      ],
      limit: 5,
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

    return rows.map((item) => ({
      id: item.id,
      name: item.name ?? "Untitled activity",
      distance: item.distance ?? 0,
      startDate: item.startDate,
      elapsedTime: item.elapsedTime,
      averageHeartrate: item.averageHeartrate,
      routePreview: parseNullableJsonb(item.mapData, activityMapDataSchema),
    }));
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
    oldestWeekStart.setUTCDate(oldestWeekStart.getUTCDate() - 7 * 12);
    const currentMonthStart = startOfMonthUtc(now);
    const yearStart = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));

    const [weeklyRows, monthlyRows, prRows, latestSuccessfulSync] =
      await Promise.all([
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
      db.query.intervalsSyncLog.findFirst({
        where: (table, operators) =>
          operators.and(
            operators.eq(table.userId, ctx.session.user.id),
            operators.eq(table.status, "success"),
            operators.isNotNull(table.completedAt),
          ),
        orderBy: (table, operators) => [operators.desc(table.completedAt)],
        columns: {
          completedAt: true,
        },
      }),
    ]);

    const monthlyByStart = new Map(
      monthlyRows.map((row) => [row.monthStartLocal.toISOString(), row]),
    );
    const currentMonth = monthlyByStart.get(currentMonthStart.toISOString());
    const yearlyTotals = monthlyRows.reduce(
      (acc, row) => ({
        totalDistanceM: acc.totalDistanceM + (row.totalDistanceM ?? 0),
        totalElapsedS: acc.totalElapsedS + (row.totalElapsedS ?? 0),
      }),
      { totalDistanceM: 0, totalElapsedS: 0 },
    );

    const prByType = new Map(prRows.map((row) => [row.prType, row]));

    const weeklyMileage = weeklyRows.map((row) => {
      const distanceMeters = row.totalDistanceM ?? 0;
      return {
        weekStart: row.weekStartLocal,
        distanceMeters,
      };
    });

    const paceTrend = weeklyRows.map((row) => ({
      weekStart: row.weekStartLocal,
      paceSecPerKm: row.avgPaceSecPerKm,
    }));

    return {
      lastSyncedAt: latestSuccessfulSync?.completedAt ?? null,
      kpis: {
        distanceThisYear: yearlyTotals.totalDistanceM,
        timeRunThisYear: yearlyTotals.totalElapsedS,
        distanceThisMonth: currentMonth?.totalDistanceM ?? 0,
        timeRunThisMonth: currentMonth?.totalElapsedS ?? 0,
      },
      personalRecords: {
        fastest1km: prByType.get("fastest_1km")?.valueSeconds ?? 0,
        fastest5k: prByType.get("fastest_5k")?.valueSeconds ?? 0,
        fastest10k: prByType.get("fastest_10k")?.valueSeconds ?? 0,
        fastestHalf: prByType.get("fastest_half")?.valueSeconds ?? 0,
        fastestFull: prByType.get("fastest_full")?.valueSeconds ?? 0,
        longestRunEver: prByType.get("longest_run")?.valueDistanceM ?? 0,
      },
      trends: {
        weeklyMileage,
        averagePace: paceTrend,
      },
    };
  }),
  analytics: protectedProcedure
    .input(
      z
        .object({
          year: z.number().int().min(1970).max(3000).optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const now = new Date();
      const selectedYear = input?.year ?? now.getUTCFullYear();
      const yearStart = new Date(Date.UTC(selectedYear, 0, 1));
      const yearEnd = new Date(Date.UTC(selectedYear + 1, 0, 1));
      const currentMonthStart = new Date(Date.UTC(selectedYear, now.getUTCMonth(), 1));
      const currentWeekStart = startOfIsoWeekUtc(now);
      const oldestWeekStart = new Date(currentWeekStart);
      oldestWeekStart.setUTCDate(oldestWeekStart.getUTCDate() - 7 * 12);

      const [monthlyRows, weeklyRows, prRows] = await Promise.all([
        db.query.dashboardRunRollupMonthly.findMany({
          where: (table, operators) =>
            operators.and(
              operators.eq(table.userId, ctx.session.user.id),
              operators.gte(table.monthStartLocal, yearStart),
              operators.lt(table.monthStartLocal, yearEnd),
            ),
          orderBy: (table, operators) => [operators.asc(table.monthStartLocal)],
          columns: {
            monthStartLocal: true,
            totalDistanceM: true,
            totalElapsedS: true,
            avgPaceSecPerKm: true,
            runCount: true,
          },
        }),
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
      ]);

      const monthlyByIso = new Map(
        monthlyRows.map((row) => [row.monthStartLocal.toISOString(), row]),
      );
      const monthly = Array.from({ length: 12 }, (_, monthOffset) => {
        const monthStart = new Date(Date.UTC(selectedYear, monthOffset, 1));
        const row = monthlyByIso.get(monthStart.toISOString());
        return {
          monthStart,
          distanceM: row?.totalDistanceM ?? 0,
          elapsedS: row?.totalElapsedS ?? 0,
          avgPaceSecPerKm: row?.avgPaceSecPerKm ?? null,
          runCount: row?.runCount ?? 0,
        };
      });

      const yearlyTotals = monthly.reduce(
        (acc, row) => ({
          distanceM: acc.distanceM + row.distanceM,
          elapsedS: acc.elapsedS + row.elapsedS,
          runCount: acc.runCount + row.runCount,
        }),
        { distanceM: 0, elapsedS: 0, runCount: 0 },
      );
      const currentMonth = monthly.find(
        (row) => row.monthStart.toISOString() === currentMonthStart.toISOString(),
      );

      const weekly = weeklyRows.map((row) => ({
        weekStart: row.weekStartLocal,
        distanceM: row.totalDistanceM ?? 0,
        avgPaceSecPerKm: row.avgPaceSecPerKm,
      }));

      const prByType = new Map(prRows.map((row) => [row.prType, row]));

      return {
        year: selectedYear,
        kpis: {
          distanceThisYear: yearlyTotals.distanceM,
          timeRunThisYear: yearlyTotals.elapsedS,
          runsThisYear: yearlyTotals.runCount,
          distanceThisMonth: currentMonth?.distanceM ?? 0,
          timeRunThisMonth: currentMonth?.elapsedS ?? 0,
          runsThisMonth: currentMonth?.runCount ?? 0,
          avgMonthlyDistance:
            monthly.length > 0 ? yearlyTotals.distanceM / monthly.length : 0,
        },
        monthly,
        weekly,
        personalRecords: {
          fastest1km: prByType.get("fastest_1km") ?? null,
          fastest5k: prByType.get("fastest_5k") ?? null,
          fastest10k: prByType.get("fastest_10k") ?? null,
          fastestHalf: prByType.get("fastest_half") ?? null,
          fastestFull: prByType.get("fastest_full") ?? null,
          longestRunEver: prByType.get("longest_run") ?? null,
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
            duration: formatSecondsToHms(elapsedSeconds),
            distance: formatDistanceToKm(distanceMeters),
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
            runDist: formatDistanceToKm(totals.distanceMeters),
            runTime: formatSecondsToHms(totals.elapsedSeconds),
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
