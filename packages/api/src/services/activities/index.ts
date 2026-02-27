import { db } from "@hyuu/db";
import { TRPCError } from "@trpc/server";

import { formatDistanceToKm } from "@hyuu/utils/distance";
import { formatSecondsToHms } from "@hyuu/utils/time";
import {
  activityMapDataSchema,
  activityStreamAnomaliesSchema,
  activityStreamData2Schema,
  activityStreamDataSchema,
  heartRateZoneDurationsSecondsSchema,
  heartRateZonesBpmSchema,
  intervalSummarySchema,
  oneKmSplitTimesSecondsSchema,
} from "../../schemas/activities";
import { formatPace, getIsoWeekNumber, parseNullableJsonb } from "../../utils";

export async function getRecentActivities(userId: string) {
  const rows = await db.query.intervalsActivity.findMany({
    where: (table, operators) =>
      operators.and(
        operators.eq(table.userId, userId),
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
}

export async function getActivitiesMap({
  userId,
  startDate,
  endDate,
}: {
  userId: string;
  startDate: Date;
  endDate: Date;
}) {
  if (startDate.getTime() > endDate.getTime()) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "startDate must be before or equal to endDate",
    });
  }

  const rows = await db.query.intervalsActivity.findMany({
    where: (table, operators) =>
      operators.and(
        operators.eq(table.userId, userId),
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
}

export async function getTrainingPlan({
  userId,
  startDate,
  endDate,
}: {
  userId: string;
  startDate: Date;
  endDate: Date;
}) {
  if (startDate.getTime() > endDate.getTime()) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "startDate must be before or equal to endDate",
    });
  }

  const rows = await db.query.intervalsActivity.findMany({
    where: (table, operators) =>
      operators.and(
        operators.eq(table.userId, userId),
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
    .filter((row): row is typeof row & { startDate: Date } => !!row.startDate)
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
}

export async function getActivityById({
  userId,
  id,
}: {
  userId: string;
  id: number;
}) {
  const row = await db.query.intervalsActivity.findFirst({
    where: (table, operators) =>
      operators.and(
        operators.eq(table.userId, userId),
        operators.eq(table.id, id),
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
        parseNullableJsonb(stream.anomalies, activityStreamAnomaliesSchema) ??
        [],
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
}
