import type { IntervalsActivityAggregate } from "../../domain/models/activity";
import { z } from "zod";
import {
  toDateOrNull,
  toIntArrayOrNull,
  toIntOrNull,
  toNumberOrNull,
} from "../../utils";

// Interval cadence is in steps / 30 seconds, so we need to multiply by 2 to get steps / minute.
function transformCadence(cadence: number | null | undefined) {
  return cadence ? cadence * 2 : null;
}

const bestEffortRawDataSchema = z.object({
  targetDistanceMeters: z.number(),
  durationSeconds: z.number().int().nonnegative(),
  startIndex: z.number().int().nonnegative(),
  endIndex: z.number().int().nonnegative(),
});

const oneKmSplitTimesSecondsSchema = z.array(
  z.object({
    splitNumber: z.number().int().positive(),
    splitDistanceMeters: z.number().positive(),
    durationSeconds: z.number().int().nonnegative(),
  }),
);

export function mapActivityToActivityValues({
  userId,
  intervalsAthleteId,
  activity,
  now,
}: {
  userId: string;
  intervalsAthleteId: string;
  activity: IntervalsActivityAggregate;
  now: Date;
}) {
  return {
    userId,
    intervalsAthleteId,
    intervalsActivityId: activity.activityId,
    type: activity.detail.type ?? null,
    name: activity.detail.name ?? null,
    source: activity.detail.source ?? null,
    externalId: activity.detail.external_id ?? null,
    startDate: toDateOrNull(activity.detail.start_date),
    startDateLocal:
      typeof activity.detail.start_date_local === "string" &&
      activity.detail.start_date_local.length > 0
        ? activity.detail.start_date_local
        : null,
    analyzedAt: toDateOrNull(activity.detail.analyzed),
    syncedAt: toDateOrNull(activity.detail.icu_sync_date),
    distance: toNumberOrNull(activity.detail.distance),
    movingTime: toIntOrNull(activity.detail.moving_time),
    elapsedTime: toIntOrNull(activity.detail.elapsed_time),
    totalElevationGain: toNumberOrNull(activity.detail.total_elevation_gain),
    totalElevationLoss: toNumberOrNull(activity.detail.total_elevation_loss),
    averageSpeed: toNumberOrNull(activity.detail.average_speed),
    maxSpeed: toNumberOrNull(activity.detail.max_speed),
    averageHeartrate: toNumberOrNull(activity.detail.average_heartrate),
    maxHeartrate: toNumberOrNull(activity.detail.max_heartrate),
    averageCadence: transformCadence(activity.detail.average_cadence),
    averageStride: toNumberOrNull(activity.detail.average_stride),
    calories: toNumberOrNull(activity.detail.calories),
    deviceName: activity.detail.device_name ?? null,
    trainingLoad: toIntOrNull(activity.detail.icu_training_load),
    hrLoad: toIntOrNull(activity.detail.hr_load),
    intensity: toNumberOrNull(activity.detail.icu_intensity),
    lthr: toIntOrNull(activity.detail.lthr),
    athleteMaxHr: toIntOrNull(activity.detail.athlete_max_hr),
    heartRateZonesBpm: toIntArrayOrNull(activity.detail.icu_hr_zones),
    heartRateZoneDurationsSeconds: toIntArrayOrNull(
      activity.detail.icu_hr_zone_times,
    ),
    oneKmSplitTimesSeconds: oneKmSplitTimesSecondsSchema.parse(
      activity.oneKmSplitTimesSeconds,
    ),
    intervalSummary: activity.detail.interval_summary ?? null,
    mapData: activity.map ?? null,
    rawData: activity.detail,
    updatedAt: now,
  };
}

export function mapActivityToIntervalRows({
  activityId,
  activity,
  now,
}: {
  activityId: number;
  activity: IntervalsActivityAggregate;
  now: Date;
}) {
  return activity.detail.icu_intervals.map((interval) => ({
    activityId,
    intervalId: String(interval.id),
    intervalType: interval.type ?? null,
    groupId: interval.group_id ?? null,
    zone: toIntOrNull(interval.zone),
    intensity: toNumberOrNull(interval.intensity),
    distance: toNumberOrNull(interval.distance),
    movingTime: toIntOrNull(interval.moving_time),
    elapsedTime: toIntOrNull(interval.elapsed_time),
    startTime: toIntOrNull(interval.start_time),
    endTime: toIntOrNull(interval.end_time),
    averageSpeed: toNumberOrNull(interval.average_speed),
    maxSpeed: toNumberOrNull(interval.max_speed),
    averageHeartrate: toNumberOrNull(interval.average_heartrate),
    maxHeartrate: toNumberOrNull(interval.max_heartrate),
    averageCadence: transformCadence(interval.average_cadence),
    averageStride: toNumberOrNull(interval.average_stride),
    totalElevationGain: toNumberOrNull(interval.total_elevation_gain),
    rawData: interval,
    updatedAt: now,
  }));
}

export function mapActivityToStreamRows({
  activityId,
  activity,
  now,
}: {
  activityId: number;
  activity: IntervalsActivityAggregate;
  now: Date;
}) {
  return activity.streams.map((stream) => ({
    activityId,
    streamType: stream.type,
    name: stream.name ?? null,
    data: stream.data,
    data2: stream.data2 ?? null,
    valueTypeIsArray: stream.valueTypeIsArray ?? null,
    anomalies: stream.anomalies ?? [],
    custom: stream.custom ?? null,
    allNull: stream.allNull ?? null,
    rawData: stream,
    updatedAt: now,
  }));
}

export function mapActivityToBestEffortRows({
  activityId,
  activity,
  now,
}: {
  activityId: number;
  activity: IntervalsActivityAggregate;
  now: Date;
}) {
  return activity.bestEfforts.map((bestEffort) => {
    const parsedBestEffort = bestEffortRawDataSchema.parse(bestEffort);
    return {
      activityId,
      targetDistanceMeters: parsedBestEffort.targetDistanceMeters,
      durationSeconds: parsedBestEffort.durationSeconds,
      startIndex: parsedBestEffort.startIndex,
      endIndex: parsedBestEffort.endIndex,
      updatedAt: now,
    };
  });
}
