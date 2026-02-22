import { z } from "zod";
import type {
  IntervalsActivityStream,
  IntervalsComputedBestEffort,
} from "./domain/models/activity";

function toDateOrNull(value: string | null | undefined) {
  if (typeof value !== "string" || value.length === 0) {
    return null;
  }
  const date = new Date(value);
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

export {
  BEST_EFFORT_TARGET_DISTANCES_METERS,
  computeBestEffortsFromDistanceStream,
  toDateOrNull,
  toIntOrNull,
  toNumberOrNull,
  toIntArrayOrNull,
  toNumberArrayOrNull,
  toDateOnlyString,
};
