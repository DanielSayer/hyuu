import { db } from "@hyuu/db";

import { computePaceSecPerKm, isRunActivityType, toLocalDateOrNull } from "../../utils";
import { ensureUserWeekStartDay } from "../user-settings/ensure-week-start-day";

const PREFILL_LOOKBACK_WEEKS = 8;

function average(values: number[]) {
  if (values.length === 0) {
    return null;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function roundToSingleDecimal(value: number | null) {
  if (value === null) {
    return null;
  }
  return Math.round(value * 10) / 10;
}

function getActivityDay(row: {
  startDate: Date | null;
  startDateLocal: string | null;
}) {
  const localDate = toLocalDateOrNull(row.startDateLocal);
  const value = localDate ?? row.startDate;
  return value ? value.getUTCDay() : null;
}

export async function getRunningPlanPrefill(userId: string) {
  const now = new Date();
  const lookbackStart = new Date(now);
  lookbackStart.setUTCDate(lookbackStart.getUTCDate() - PREFILL_LOOKBACK_WEEKS * 7);

  const [weekStartDay, athleteProfile, weeklyRows, activityRows] = await Promise.all([
    ensureUserWeekStartDay(userId),
    db.query.intervalsAthleteProfile.findFirst({
      where: (table, operators) => operators.eq(table.userId, userId),
      orderBy: (table, operators) => [operators.desc(table.updatedAt)],
      columns: {
        timezone: true,
        measurementPreference: true,
      },
    }),
    db.query.runRollupWeekly.findMany({
      where: (table, operators) =>
        operators.and(
          operators.eq(table.userId, userId),
          operators.gte(table.weekStartLocal, lookbackStart),
        ),
      orderBy: (table, operators) => [operators.desc(table.weekStartLocal)],
      columns: {
        runCount: true,
        totalDistanceM: true,
      },
      limit: PREFILL_LOOKBACK_WEEKS,
    }),
    db.query.intervalsActivity.findMany({
      where: (table, operators) =>
        operators.and(
          operators.eq(table.userId, userId),
          operators.isNotNull(table.startDate),
          operators.gte(table.startDate, lookbackStart),
        ),
      orderBy: (table, operators) => [operators.desc(table.startDate)],
      columns: {
        type: true,
        distance: true,
        elapsedTime: true,
        startDate: true,
        startDateLocal: true,
      },
      limit: 200,
    }),
  ]);

  const runActivities = activityRows.filter((row) => isRunActivityType(row.type));
  const runDayCounts = new Map<number, number>();
  const runDayDistance = new Map<number, number>();
  let longestRecentRunM = 0;
  let totalDistanceM = 0;
  let totalElapsedS = 0;

  for (const row of runActivities) {
    const day = getActivityDay(row);
    const distance = row.distance ?? 0;
    if (distance > longestRecentRunM) {
      longestRecentRunM = distance;
    }
    totalDistanceM += distance;
    totalElapsedS += row.elapsedTime ?? 0;
    if (day === null) {
      continue;
    }
    runDayCounts.set(day, (runDayCounts.get(day) ?? 0) + 1);
    runDayDistance.set(day, (runDayDistance.get(day) ?? 0) + distance);
  }

  const averageWeeklyRuns = average(weeklyRows.map((row) => row.runCount));
  const averageWeeklyDistanceKm = average(
    weeklyRows.map((row) => (row.totalDistanceM ?? 0) / 1000),
  );
  const preferredRunDays = Array.from(runDayCounts.entries())
    .sort((a, b) => {
      if (b[1] !== a[1]) {
        return b[1] - a[1];
      }
      return a[0] - b[0];
    })
    .slice(
      0,
      Math.max(
        0,
        Math.min(4, Math.round(averageWeeklyRuns ?? runDayCounts.size ?? 0)),
      ),
    )
    .map(([day]) => day);

  const longRunDayEntry = Array.from(runDayDistance.entries()).sort(
    (a, b) => b[1] - a[1],
  )[0];
  const averagePaceSecPerKm =
    computePaceSecPerKm({
      elapsedSeconds: totalElapsedS,
      distanceMeters: totalDistanceM,
    }) ?? null;

  return {
    source: {
      hasTrustedSyncedHistory: weeklyRows.length > 0 || runActivities.length > 0,
      timezone: athleteProfile?.timezone ?? null,
      measurementPreference: athleteProfile?.measurementPreference ?? null,
    },
    profile: {
      weekStartDay,
      typicalWeeklyRuns: averageWeeklyRuns === null ? undefined : Math.round(averageWeeklyRuns),
      typicalWeeklyDistanceKm: roundToSingleDecimal(averageWeeklyDistanceKm) ?? undefined,
      longestRecentRunKm:
        longestRecentRunM > 0 ? roundToSingleDecimal(longestRecentRunM / 1000) : undefined,
      preferredRunDays,
      preferredLongRunDay: longRunDayEntry?.[0],
    },
    fitnessBaseline: {
      currentWeeklyRuns: averageWeeklyRuns === null ? undefined : Math.round(averageWeeklyRuns),
      currentWeeklyDistanceKm: roundToSingleDecimal(averageWeeklyDistanceKm) ?? undefined,
      longestRecentRunKm:
        longestRecentRunM > 0 ? roundToSingleDecimal(longestRecentRunM / 1000) : undefined,
      hasTrustedSyncedHistory: weeklyRows.length > 0 || runActivities.length > 0,
      averagePaceSecPerKm,
    },
    schedule: {
      preferredRunDays,
      blockedDays: [],
      longRunDay: longRunDayEntry?.[0],
    },
  };
}
