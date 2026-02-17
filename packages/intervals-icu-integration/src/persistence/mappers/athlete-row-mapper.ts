import type { IntervalsAthlete } from "../../domain/models/athlete";
import { toDateOrNull, toIntOrNull } from "../../utils";

export function mapAthleteToProfileValues({
  userId,
  athlete,
  now,
}: {
  userId: string;
  athlete: IntervalsAthlete;
  now: Date;
}) {
  return {
    userId,
    intervalsAthleteId: athlete.id,
    name: athlete.name ?? null,
    firstName: athlete.firstname ?? null,
    lastName: athlete.lastname ?? null,
    email: athlete.email ?? null,
    sex: athlete.sex ?? null,
    city: athlete.city ?? null,
    state: athlete.state ?? null,
    country: athlete.country ?? null,
    timezone: athlete.timezone ?? null,
    locale: athlete.locale ?? null,
    measurementPreference: athlete.measurement_preference ?? null,
    status: athlete.status ?? null,
    visibility: athlete.visibility ?? null,
    weightKg: toIntOrNull(athlete.weight),
    icuWeightKg: toIntOrNull(athlete.icu_weight),
    icuLastSeenAt: toDateOrNull(athlete.icu_last_seen),
    icuActivatedAt: toDateOrNull(athlete.icu_activated),
    stravaId:
      typeof athlete.strava_id === "number" ? String(athlete.strava_id) : null,
    stravaAuthorized: athlete.strava_authorized ?? null,
    rawData: athlete,
    updatedAt: now,
  };
}
