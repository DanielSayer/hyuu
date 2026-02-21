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
    icu_intervals: z.array(intervalsActivityIntervalSchema).default([]),
    icu_hr_zones: z.array(z.number().int()).nullable().optional(),
    icu_hr_zone_times: z.array(z.number().int()).nullable().optional(),
    interval_summary: z.array(z.string()).nullable().optional(),
  })
  .loose();

const intervalsMapLatLngSchema = z.array(z.number());

const intervalsMapRouteSchema = z
  .object({
    athlete_id: z.string().nullable().optional(),
    route_id: z.number().int().nullable().optional(),
    name: z.string().nullable().optional(),
    rename_activities: z.boolean().nullable().optional(),
    commute: z.boolean().nullable().optional(),
    tags: z.array(z.string()).default([]),
    description: z.string().nullable().optional(),
    replaced_by_route_id: z.number().int().nullable().optional(),
    latlngs: z.array(intervalsMapLatLngSchema).default([]),
  })
  .loose();

const intervalsMapWeatherTimeSchema = z
  .object({
    start_secs: toIntOrNull,
    end_secs: toIntOrNull,
    index: toIntOrNull,
    temp: toNumberOrNull,
    feels_like: toNumberOrNull,
    humidity: toIntOrNull,
    wind_speed: toNumberOrNull,
    wind_deg: toIntOrNull,
    wind_gust: toNumberOrNull,
    rain: toNumberOrNull,
    showers: toNumberOrNull,
    snow: toNumberOrNull,
    clouds: toIntOrNull,
    pressure: toNumberOrNull,
    weather_code: toIntOrNull,
  })
  .loose();

const intervalsMapWeatherPointSchema = z
  .object({
    latitude: toNumberOrNull,
    longitude: toNumberOrNull,
    times: z.array(intervalsMapWeatherTimeSchema).default([]),
  })
  .loose();

const intervalsMapClosestPointSchema = z
  .object({
    start_secs: toIntOrNull,
    p1_index: toIntOrNull,
    p2_index: toIntOrNull,
    p3_index: toIntOrNull,
  })
  .loose();

const intervalsMapWeatherSchema = z
  .object({
    points: z.array(intervalsMapWeatherPointSchema).default([]),
    closest_points: z.array(intervalsMapClosestPointSchema).default([]),
  })
  .loose();

export const intervalsActivityMapSchema = z
  .object({
    bounds: z.array(z.array(z.number())).default([]),
    latlngs: z.array(intervalsMapLatLngSchema).default([]),
    route: intervalsMapRouteSchema.nullable().optional(),
    weather: intervalsMapWeatherSchema.nullable().optional(),
  })
  .loose();
