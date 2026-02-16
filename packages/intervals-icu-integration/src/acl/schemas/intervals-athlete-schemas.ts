import z from "zod";

const toNumberOrNull = z.number().nullable().optional();

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
  })
  .loose();
