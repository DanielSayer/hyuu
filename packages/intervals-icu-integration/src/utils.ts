import { z } from "zod";
import type {
  IntervalsActivityStream,
  IntervalsComputedBestEffort,
  IntervalsComputedOneKmSplitTime,
} from "./domain/models/activity";

function toDateOrNull(value: string | null | undefined) {
  if (typeof value !== "string" || value.length === 0) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toLocalDateOrNull(value: string | null | undefined) {
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
  const date = new Date(
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

function toNumberArrayOrNull(value: number[] | null | undefined) {
  if (!Array.isArray(value)) {
    return null;
  }
  return value.map((entry) => Number(entry));
}

function toDateOnlyString(date: Date) {
  return date.toISOString().slice(0, 10);
}

function toLocalDateTimeString(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(
    date.getUTCDate(),
  )}T${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(
    date.getUTCSeconds(),
  )}`;
}

const RUN_ACTIVITY_TYPES = new Set([
  "run",
  "trailrun",
  "treadmillrun",
  "virtualrun",
]);

function normalizeActivityType(type: string) {
  return type.replaceAll(/[\s_-]/g, "").toLowerCase();
}

function isRunActivityType(type: string | null | undefined) {
  if (typeof type !== "string" || type.length === 0) {
    return false;
  }
  return RUN_ACTIVITY_TYPES.has(normalizeActivityType(type));
}

function computePaceSecPerKm({
  elapsedSeconds,
  distanceMeters,
}: {
  elapsedSeconds: number;
  distanceMeters: number;
}) {
  if (elapsedSeconds <= 0 || distanceMeters <= 0) {
    return null;
  }
  return elapsedSeconds / (distanceMeters / 1000);
}

function startOfWeekUtc(date: Date, weekStartDay: 0 | 1) {
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

function startOfIsoWeekUtc(date: Date) {
  return startOfWeekUtc(date, 1);
}

function startOfMonthUtc(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

const distanceStreamDataSchema = z.array(z.number().finite());

const BEST_EFFORT_TARGET_DISTANCES_METERS = [
  400,
  1000,
  1609.344,
  5000,
  10000,
  21097.5,
  42195,
] as const;

function computeBestEffortForTargetDistance({
  targetDistanceMeters,
  distanceMetersBySecond,
}: {
  targetDistanceMeters: number;
  distanceMetersBySecond: number[];
}): IntervalsComputedBestEffort | null {
  if (distanceMetersBySecond.length < 2) {
    return null;
  }

  let bestEffort: IntervalsComputedBestEffort | null = null;
  let endIndex = 1;
  const totalSamples = distanceMetersBySecond.length;

  for (let startIndex = 0; startIndex < totalSamples; startIndex += 1) {
    if (endIndex <= startIndex) {
      endIndex = startIndex + 1;
    }

    const startDistance = distanceMetersBySecond[startIndex];
    if (startDistance === undefined) {
      continue;
    }

    while (endIndex < totalSamples) {
      const endDistance = distanceMetersBySecond[endIndex];
      if (endDistance === undefined) {
        break;
      }
      if (endDistance - startDistance >= targetDistanceMeters) {
        break;
      }
      endIndex += 1;
    }

    if (endIndex >= totalSamples) {
      break;
    }

    const durationSeconds = endIndex - startIndex;
    if (!bestEffort || durationSeconds < bestEffort.durationSeconds) {
      bestEffort = {
        targetDistanceMeters,
        durationSeconds,
        startIndex,
        endIndex,
      };
    }
  }

  return bestEffort;
}

function extractDistanceMetersBySecond(streams: IntervalsActivityStream[]) {
  const distanceStream = streams.find((stream) => stream.type === "distance");
  if (!distanceStream) {
    return null;
  }

  const parsedDistance = distanceStreamDataSchema.safeParse(distanceStream.data);
  if (!parsedDistance.success || parsedDistance.data.length === 0) {
    return null;
  }

  // Small decrements can exist in source stream; clamp to monotonic cumulative distance.
  const clampedDistance = parsedDistance.data.slice();
  for (let index = 1; index < clampedDistance.length; index += 1) {
    clampedDistance[index] = Math.max(
      clampedDistance[index - 1] ?? 0,
      clampedDistance[index] ?? 0,
    );
  }
  return clampedDistance;
}

function computeBestEffortsFromDistanceStream(
  streams: IntervalsActivityStream[],
): IntervalsComputedBestEffort[] {
  const distanceMetersBySecond = extractDistanceMetersBySecond(streams);
  if (!distanceMetersBySecond) {
    return [];
  }

  return BEST_EFFORT_TARGET_DISTANCES_METERS.flatMap((targetDistanceMeters) => {
    const bestEffort = computeBestEffortForTargetDistance({
      targetDistanceMeters,
      distanceMetersBySecond,
    });
    return bestEffort ? [bestEffort] : [];
  });
}

function computeOneKmSplitTimesFromDistanceStream(
  streams: IntervalsActivityStream[],
): IntervalsComputedOneKmSplitTime[] {
  const distanceMetersBySecond = extractDistanceMetersBySecond(streams);
  if (!distanceMetersBySecond || distanceMetersBySecond.length < 2) {
    return [];
  }

  const totalSamples = distanceMetersBySecond.length;
  const lastSampleIndex = totalSamples - 1;
  const totalDistanceMeters = distanceMetersBySecond[lastSampleIndex] ?? 0;
  const splitTimes: IntervalsComputedOneKmSplitTime[] = [];
  let splitStartIndex = 0;
  let nextSplitTargetDistance = 1000;
  let nextSplitNumber = 1;

  while (splitStartIndex < lastSampleIndex) {
    let endIndex = splitStartIndex + 1;
    while (endIndex < totalSamples) {
      const endDistance = distanceMetersBySecond[endIndex];
      if (endDistance === undefined) {
        break;
      }
      if (endDistance >= nextSplitTargetDistance) {
        break;
      }
      endIndex += 1;
    }

    if (endIndex >= totalSamples) {
      break;
    }

    splitTimes.push({
      splitNumber: nextSplitNumber,
      splitDistanceMeters: 1000,
      durationSeconds: endIndex - splitStartIndex,
    });

    splitStartIndex = endIndex;
    nextSplitTargetDistance += 1000;
    nextSplitNumber += 1;
  }

  const completedDistanceMeters = (nextSplitNumber - 1) * 1000;
  const remainderDistanceMeters = totalDistanceMeters - completedDistanceMeters;
  if (remainderDistanceMeters > 0 && splitStartIndex < lastSampleIndex) {
    splitTimes.push({
      splitNumber: nextSplitNumber,
      splitDistanceMeters: remainderDistanceMeters,
      durationSeconds: lastSampleIndex - splitStartIndex,
    });
  }

  return splitTimes;
}

export {
  BEST_EFFORT_TARGET_DISTANCES_METERS,
  computePaceSecPerKm,
  computeBestEffortsFromDistanceStream,
  computeOneKmSplitTimesFromDistanceStream,
  isRunActivityType,
  startOfWeekUtc,
  startOfIsoWeekUtc,
  startOfMonthUtc,
  toDateOrNull,
  toLocalDateOrNull,
  toIntOrNull,
  toNumberOrNull,
  toIntArrayOrNull,
  toNumberArrayOrNull,
  toDateOnlyString,
  toLocalDateTimeString,
};
