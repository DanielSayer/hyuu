import z from "zod";

const stravaMapSchema = z
  .object({
    id: z.string().nullable().optional(),
    summary_polyline: z.string().nullable().optional(),
    resource_state: z.number().int().nullable().optional(),
  })
  .nullable()
  .optional();

export const stravaActivitySummarySchema = z
  .object({
    id: z.number().int().positive(),
    updated_at: z.string().min(1),
  })
  .loose();

export const stravaActivitySummaryListSchema = z.array(
  stravaActivitySummarySchema,
);

export const stravaActivityLapSchema = z
  .object({
    id: z.number().int().positive(),
    resource_state: z.number().int().optional(),
    name: z.string().nullable().optional(),
    activity: z.unknown().optional(),
    athlete: z.unknown().optional(),
    elapsed_time: z.number().nullable().optional(),
    moving_time: z.number().nullable().optional(),
    start_date: z.string().nullable().optional(),
    start_date_local: z.string().nullable().optional(),
    distance: z.number().nullable().optional(),
    average_speed: z.number().nullable().optional(),
    max_speed: z.number().nullable().optional(),
    lap_index: z.number().int().nullable().optional(),
    split: z.number().int().nullable().optional(),
    average_cadence: z.number().nullable().optional(),
    average_watts: z.number().nullable().optional(),
    average_heartrate: z.number().nullable().optional(),
    max_heartrate: z.number().nullable().optional(),
    total_elevation_gain: z.number().nullable().optional(),
  })
  .loose();

export const stravaDetailedActivitySchema = z
  .object({
    id: z.number().int().positive(),
    name: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    sport_type: z.string().min(1),
    start_date: z.string().min(1),
    start_date_local: z.string().min(1),
    timezone: z.string().nullable().optional(),
    utc_offset: z.number().nullable().optional(),
    distance: z.number().nullable().optional(),
    moving_time: z.number().nullable().optional(),
    elapsed_time: z.number().nullable().optional(),
    total_elevation_gain: z.number().nullable().optional(),
    average_speed: z.number().nullable().optional(),
    max_speed: z.number().nullable().optional(),
    average_heartrate: z.number().nullable().optional(),
    max_heartrate: z.number().nullable().optional(),
    average_cadence: z.number().nullable().optional(),
    average_watts: z.number().nullable().optional(),
    weighted_average_watts: z.number().nullable().optional(),
    kilojoules: z.number().nullable().optional(),
    calories: z.number().nullable().optional(),
    trainer: z.boolean().nullable().optional(),
    commute: z.boolean().nullable().optional(),
    manual: z.boolean().nullable().optional(),
    private: z.boolean().nullable().optional(),
    flagged: z.boolean().nullable().optional(),
    achievement_count: z.number().int().nullable().optional(),
    kudos_count: z.number().int().nullable().optional(),
    comment_count: z.number().int().nullable().optional(),
    athlete_count: z.number().int().nullable().optional(),
    photo_count: z.number().int().nullable().optional(),
    pr_count: z.number().int().nullable().optional(),
    total_photo_count: z.number().int().nullable().optional(),
    has_kudoed: z.boolean().nullable().optional(),
    start_latlng: z.tuple([z.number(), z.number()]).nullable().optional(),
    end_latlng: z.tuple([z.number(), z.number()]).nullable().optional(),
    map: stravaMapSchema,
    created_at: z.string().min(1),
    updated_at: z.string().min(1),
    laps: z.array(stravaActivityLapSchema).optional().default([]),
  })
  .loose();

const stravaZoneDistributionBucketSchema = z
  .object({
    min: z.number().nullable().optional(),
    max: z.number().nullable().optional(),
    time: z.number().int().nullable().optional(),
  })
  .loose();

export const stravaActivityZoneSchema = z
  .object({
    type: z.string().min(1),
    score: z.number().int().nullable().optional(),
    sensor_based: z.boolean().nullable().optional(),
    points: z.number().int().nullable().optional(),
    custom_zones: z.boolean().nullable().optional(),
    max: z.number().nullable().optional(),
    distribution_buckets: z
      .array(stravaZoneDistributionBucketSchema)
      .nullable()
      .optional(),
  })
  .loose();

export const stravaActivityZonesSchema = z.array(stravaActivityZoneSchema);
