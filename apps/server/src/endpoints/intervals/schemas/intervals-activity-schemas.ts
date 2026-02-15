import z from "zod";

const toNumberOrNull = z.number().nullable().optional();
const toIntOrNull = z.number().int().nullable().optional();

export const intervalsActivityEventSchema = z
  .object({
    id: z.string().min(1),
  })
  .loose();

export const intervalsActivityEventsPayloadSchema = z.union([
  z.array(intervalsActivityEventSchema),
  z.object({ events: z.array(intervalsActivityEventSchema) }).loose(),
]);

export const intervalsActivityDetailSchema = z
  .object({
    id: z.string().min(1),
    icu_athlete_id: z.string().nullable().optional(),
    type: z.string().nullable().optional(),
    name: z.string().nullable().optional(),
    source: z.string().nullable().optional(),
    external_id: z.string().nullable().optional(),
    start_date: z.string().nullable().optional(),
    start_date_local: z.string().nullable().optional(),
    analyzed: z.string().nullable().optional(),
    icu_sync_date: z.string().nullable().optional(),
    distance: toNumberOrNull,
    moving_time: toIntOrNull,
    elapsed_time: toIntOrNull,
    total_elevation_gain: toNumberOrNull,
    total_elevation_loss: toNumberOrNull,
    average_speed: toNumberOrNull,
    max_speed: toNumberOrNull,
    average_heartrate: toNumberOrNull,
    max_heartrate: toNumberOrNull,
    average_cadence: toNumberOrNull,
    average_stride: toNumberOrNull,
    calories: toNumberOrNull,
    icu_training_load: toIntOrNull,
    hr_load: toIntOrNull,
    icu_intensity: toNumberOrNull,
    lthr: toIntOrNull,
    athlete_max_hr: toIntOrNull,
    icu_hr_zones: z.array(z.number().int()).nullable().optional(),
    icu_hr_zone_times: z.array(z.number().int()).nullable().optional(),
    interval_summary: z.array(z.string()).nullable().optional(),
  })
  .loose();

export const intervalsActivityIntervalSchema = z
  .object({
    id: z.union([z.string(), z.number().int()]),
    type: z.string().nullable().optional(),
    group_id: z.string().nullable().optional(),
    zone: toIntOrNull,
    intensity: toNumberOrNull,
    distance: toNumberOrNull,
    moving_time: toIntOrNull,
    elapsed_time: toIntOrNull,
    start_time: toIntOrNull,
    end_time: toIntOrNull,
    average_speed: toNumberOrNull,
    max_speed: toNumberOrNull,
    average_heartrate: toNumberOrNull,
    max_heartrate: toNumberOrNull,
    average_cadence: toNumberOrNull,
    average_stride: toNumberOrNull,
    total_elevation_gain: toNumberOrNull,
  })
  .loose();

export const intervalsActivityIntervalsSchema = z
  .object({
    id: z.string().min(1),
    analyzed: z.string().nullable().optional(),
    icu_intervals: z.array(intervalsActivityIntervalSchema).default([]),
  })
  .loose();
