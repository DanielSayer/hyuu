import z from "zod";

const toNumberOrNull = z.number().nullable().optional();

export const intervalsSportSettingSchema = z
  .object({
    id: z.number().int(),
    athlete_id: z.string().min(1),
    types: z.array(z.string()).default([]),
    ftp: toNumberOrNull,
    lthr: toNumberOrNull,
    max_hr: toNumberOrNull,
    power_zones: z.array(z.number()).nullable().optional(),
    hr_zones: z.array(z.number()).nullable().optional(),
    pace_units: z.string().nullable().optional(),
    pace_load_type: z.string().nullable().optional(),
    other: z.boolean().nullable().optional(),
    created: z.string().nullable().optional(),
    updated: z.string().nullable().optional(),
  })
  .loose();

export const intervalsAthleteSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().nullable().optional(),
    firstname: z.string().nullable().optional(),
    lastname: z.string().nullable().optional(),
    email: z.email().nullable().optional(),
    sex: z.string().nullable().optional(),
    city: z.string().nullable().optional(),
    state: z.string().nullable().optional(),
    country: z.string().nullable().optional(),
    timezone: z.string().nullable().optional(),
    locale: z.string().nullable().optional(),
    measurement_preference: z.string().nullable().optional(),
    status: z.string().nullable().optional(),
    visibility: z.string().nullable().optional(),
    weight: toNumberOrNull,
    icu_weight: toNumberOrNull,
    icu_last_seen: z.string().nullable().optional(),
    icu_activated: z.string().nullable().optional(),
    strava_id: z.number().nullable().optional(),
    strava_authorized: z.boolean().nullable().optional(),
    sportSettings: z.array(intervalsSportSettingSchema).default([]),
  })
  .loose();
