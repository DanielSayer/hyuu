import type z from "zod";

export function parseNullableJsonb<T>(
  value: unknown,
  schema: z.ZodType<T>,
): T | null {
  if (value === null || value === undefined) {
    return null;
  }

  const parsed = schema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export function toFiniteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function formatPace(
  totalSeconds: number,
  distanceMeters: number,
): string {
  if (totalSeconds <= 0 || distanceMeters <= 0) {
    return "N/A";
  }

  const secondsPerKm = totalSeconds / (distanceMeters / 1000);
  let minutes = Math.floor(secondsPerKm / 60);
  let seconds = Math.round(secondsPerKm % 60);

  if (seconds === 60) {
    minutes += 1;
    seconds = 0;
  }

  return `${minutes}:${String(seconds).padStart(2, "0")}/km`;
}

export function getIsoWeekNumber(date: Date): number {
  const target = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  const dayNumber = (target.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNumber + 3);

  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
  const firstThursdayDayNumber = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(
    firstThursday.getUTCDate() - firstThursdayDayNumber + 3,
  );

  return (
    1 + Math.round((target.getTime() - firstThursday.getTime()) / 604_800_000)
  );
}
