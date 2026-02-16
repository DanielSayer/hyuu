import type { IntervalsActivityAggregate } from "../../domain/models/activity";

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
    startDateLocal: toDateOrNull(activity.detail.start_date_local),
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
    averageCadence: toNumberOrNull(activity.detail.average_cadence),
    averageStride: toNumberOrNull(activity.detail.average_stride),
    calories: toNumberOrNull(activity.detail.calories),
    trainingLoad: toIntOrNull(activity.detail.icu_training_load),
    hrLoad: toIntOrNull(activity.detail.hr_load),
    intensity: toNumberOrNull(activity.detail.icu_intensity),
    lthr: toIntOrNull(activity.detail.lthr),
    athleteMaxHr: toIntOrNull(activity.detail.athlete_max_hr),
    heartRateZonesBpm: toIntArrayOrNull(activity.detail.icu_hr_zones),
    heartRateZoneDurationsSeconds: toIntArrayOrNull(
      activity.detail.icu_hr_zone_times,
    ),
    intervalSummary: activity.detail.interval_summary ?? null,
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
  return activity.intervals.icu_intervals.map((interval) => ({
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
    averageCadence: toNumberOrNull(interval.average_cadence),
    averageStride: toNumberOrNull(interval.average_stride),
    totalElevationGain: toNumberOrNull(interval.total_elevation_gain),
    rawData: interval,
    updatedAt: now,
  }));
}

function toDateOrNull(value: string | null | undefined) {
  if (typeof value !== "string" || value.length === 0) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toIntOrNull(value: number | null | undefined) {
  return typeof value === "number" ? Math.trunc(value) : null;
}

function toNumberOrNull(value: number | null | undefined) {
  return typeof value === "number" ? value : null;
}

function toIntArrayOrNull(value: number[] | null | undefined) {
  if (!Array.isArray(value)) {
    return null;
  }
  return value.map((entry) => Math.trunc(entry));
}
