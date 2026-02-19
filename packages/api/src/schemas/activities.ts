import z from "zod";

export const heartRateZonesBpmSchema = z.array(z.number().int());
export const heartRateZoneDurationsSecondsSchema = z.array(z.number().int());
export const intervalSummarySchema = z.array(z.string());

const mapLatLngSchema = z.array(z.number());

const mapRouteSchema = z
  .object({
    athlete_id: z.string().nullable().optional(),
    route_id: z.number().int().nullable().optional(),
    name: z.string().nullable().optional(),
    rename_activities: z.boolean().nullable().optional(),
    commute: z.boolean().nullable().optional(),
    tags: z.array(z.string()).default([]),
    description: z.string().nullable().optional(),
    replaced_by_route_id: z.number().int().nullable().optional(),
    latlngs: z.array(mapLatLngSchema).default([]),
  })
  .loose();

const mapWeatherTimeSchema = z
  .object({
    start_secs: z.number().int().nullable().optional(),
    end_secs: z.number().int().nullable().optional(),
    index: z.number().int().nullable().optional(),
    temp: z.number().nullable().optional(),
    feels_like: z.number().nullable().optional(),
    humidity: z.number().int().nullable().optional(),
    wind_speed: z.number().nullable().optional(),
    wind_deg: z.number().int().nullable().optional(),
    wind_gust: z.number().nullable().optional(),
    rain: z.number().nullable().optional(),
    showers: z.number().nullable().optional(),
    snow: z.number().nullable().optional(),
    clouds: z.number().int().nullable().optional(),
    pressure: z.number().nullable().optional(),
    weather_code: z.number().int().nullable().optional(),
  })
  .loose();

const mapWeatherPointSchema = z
  .object({
    latitude: z.number().nullable().optional(),
    longitude: z.number().nullable().optional(),
    times: z.array(mapWeatherTimeSchema).default([]),
  })
  .loose();

const mapClosestPointSchema = z
  .object({
    start_secs: z.number().int().nullable().optional(),
    p1_index: z.number().int().nullable().optional(),
    p2_index: z.number().int().nullable().optional(),
    p3_index: z.number().int().nullable().optional(),
  })
  .loose();

const mapWeatherSchema = z
  .object({
    points: z.array(mapWeatherPointSchema).default([]),
    closest_points: z.array(mapClosestPointSchema).default([]),
  })
  .loose();

export const activityMapDataSchema = z
  .object({
    bounds: z.array(z.array(z.number())).default([]),
    latlngs: z.array(mapLatLngSchema).default([]),
    route: mapRouteSchema.nullable().optional(),
    weather: mapWeatherSchema.nullable().optional(),
  })
  .loose();
