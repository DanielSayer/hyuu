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

export function formatPaceFromSecondsPerKm(
  secondsPerKm: number | null,
): string {
  if (secondsPerKm === null || secondsPerKm <= 0) {
    return "N/A";
  }

  let minutes = Math.floor(secondsPerKm / 60);
  let seconds = Math.round(secondsPerKm % 60);

  if (seconds === 60) {
    minutes += 1;
    seconds = 0;
  }

  return `${minutes}:${String(seconds).padStart(2, "0")}/km`;
}

export function startOfMonthUtc(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

export function startOfWeekUtc(date: Date, weekStartDay: 0 | 1): Date {
  const start = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  const day = start.getUTCDay();
  const offsetToWeekStart =
    weekStartDay === 1
      ? day === 0
        ? -6
        : 1 - day
      : -day;
  start.setUTCDate(start.getUTCDate() + offsetToWeekStart);
  start.setUTCHours(0, 0, 0, 0);
  return start;
}

export function startOfIsoWeekUtc(date: Date): Date {
  return startOfWeekUtc(date, 1);
}

export function toLocalDateTimeString(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(
    date.getUTCDate(),
  )}T${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(
    date.getUTCSeconds(),
  )}`;
}

export function toLocalDateOrNull(
  value: string | null | undefined,
): Date | null {
  if (typeof value !== "string" || value.length === 0) {
    return null;
  }

  const zonedDate = new Date(value);
  if (!Number.isNaN(zonedDate.getTime()) && /[zZ]|[+-]\d{2}:\d{2}$/.test(value)) {
    return zonedDate;
  }

  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?$/,
  );
  if (!match) {
    return null;
  }

  const [, year, month, day, hour, minute, second, millis] = match;
  const parsed = new Date(
    Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second),
      Number(millis ?? "0"),
    ),
  );
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

const RUN_ACTIVITY_TYPES = new Set([
  "run",
  "trailrun",
  "treadmillrun",
  "virtualrun",
]);

function normalizeActivityType(type: string): string {
  return type.replaceAll(/[\s_-]/g, "").toLowerCase();
}

export function isRunActivityType(type: string | null | undefined): boolean {
  if (typeof type !== "string" || type.length === 0) {
    return false;
  }
  return RUN_ACTIVITY_TYPES.has(normalizeActivityType(type));
}

export function computePaceSecPerKm({
  elapsedSeconds,
  distanceMeters,
}: {
  elapsedSeconds: number;
  distanceMeters: number;
}): number | null {
  if (elapsedSeconds <= 0 || distanceMeters <= 0) {
    return null;
  }
  return elapsedSeconds / (distanceMeters / 1000);
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
