import { db, runPr } from "@hyuu/db";
import {
  intervalsActivity,
  intervalsActivityBestEffort,
} from "@hyuu/db/schema/intervals";
import { and, eq, inArray, isNotNull } from "drizzle-orm";
import { isRunActivityType } from "../utils";

const DASHBOARD_PR_TARGETS = [
  { prType: "fastest_1km", targetDistanceMeters: 1000 },
  { prType: "fastest_5k", targetDistanceMeters: 5000 },
  { prType: "fastest_10k", targetDistanceMeters: 10000 },
  { prType: "fastest_half", targetDistanceMeters: 21097.5 },
  { prType: "fastest_full", targetDistanceMeters: 42195 },
] as const;

export async function recomputeRunPrsForUser(userId: string) {
  const now = new Date();
  const prRows: Array<{
    userId: string;
    prType: string;
    activityId: number | null;
    valueSeconds: number | null;
    valueDistanceM: number | null;
    activityStartDate: Date | null;
    updatedAt: Date;
  }> = [];

  const longestRunCandidates = await db.query.intervalsActivity.findMany({
    where: (table, operators) =>
      operators.and(
        operators.eq(table.userId, userId),
        operators.isNotNull(table.startDate),
      ),
    columns: {
      id: true,
      type: true,
      startDate: true,
      distance: true,
    },
  });

  let longestRun:
    | {
        activityId: number;
        distance: number;
        startDate: Date;
      }
    | undefined;

  for (const candidate of longestRunCandidates) {
    if (!isRunActivityType(candidate.type) || !candidate.startDate) {
      continue;
    }
    const distance = candidate.distance ?? 0;
    if (!longestRun || distance > longestRun.distance) {
      longestRun = {
        activityId: candidate.id,
        distance,
        startDate: candidate.startDate,
      };
    }
  }

  if (longestRun) {
    prRows.push({
      userId,
      prType: "longest_run",
      activityId: longestRun.activityId,
      valueSeconds: null,
      valueDistanceM: longestRun.distance,
      activityStartDate: longestRun.startDate,
      updatedAt: now,
    });
  }

  const bestEffortRows = await db
    .select({
      activityId: intervalsActivity.id,
      activityType: intervalsActivity.type,
      activityStartDate: intervalsActivity.startDate,
      targetDistanceMeters: intervalsActivityBestEffort.targetDistanceMeters,
      durationSeconds: intervalsActivityBestEffort.durationSeconds,
    })
    .from(intervalsActivityBestEffort)
    .innerJoin(
      intervalsActivity,
      eq(intervalsActivity.id, intervalsActivityBestEffort.activityId),
    )
    .where(
      and(
        eq(intervalsActivity.userId, userId),
        isNotNull(intervalsActivity.startDate),
        inArray(
          intervalsActivityBestEffort.targetDistanceMeters,
          DASHBOARD_PR_TARGETS.map((entry) => entry.targetDistanceMeters),
        ),
      ),
    );

  for (const target of DASHBOARD_PR_TARGETS) {
    const bestForTarget = bestEffortRows
      .filter(
        (row) =>
          isRunActivityType(row.activityType) &&
          row.targetDistanceMeters === target.targetDistanceMeters,
      )
      .reduce<
        | {
            activityId: number;
            activityStartDate: Date;
            durationSeconds: number;
          }
        | undefined
      >((best, row) => {
        if (!row.activityStartDate) {
          return best;
        }
        if (!best || row.durationSeconds < best.durationSeconds) {
          return {
            activityId: row.activityId,
            activityStartDate: row.activityStartDate,
            durationSeconds: row.durationSeconds,
          };
        }
        return best;
      }, undefined);

    if (!bestForTarget) {
      continue;
    }

    prRows.push({
      userId,
      prType: target.prType,
      activityId: bestForTarget.activityId,
      valueSeconds: bestForTarget.durationSeconds,
      valueDistanceM: null,
      activityStartDate: bestForTarget.activityStartDate,
      updatedAt: now,
    });
  }

  await db.delete(runPr).where(eq(runPr.userId, userId));
  if (prRows.length > 0) {
    await db.insert(runPr).values(prRows);
  }
}
