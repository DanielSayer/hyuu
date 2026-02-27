import { db } from "@hyuu/db";

import { startOfIsoWeekUtc, startOfMonthUtc } from "../../utils";
import { loadGoalsWithProgress } from "../goals/progress";

export async function getDashboard(userId: string) {
  const now = new Date();
  const currentWeekStart = startOfIsoWeekUtc(now);
  const oldestWeekStart = new Date(currentWeekStart);
  oldestWeekStart.setUTCDate(oldestWeekStart.getUTCDate() - 7 * 12);
  const currentMonthStart = startOfMonthUtc(now);
  const yearStart = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));

  const goalsDataPromise = loadGoalsWithProgress({
    userId,
    now,
  });
  const [weeklyRows, monthlyRows, prRows, latestSuccessfulSync, goalsData] =
    await Promise.all([
      db.query.runRollupWeekly.findMany({
        where: (table, operators) =>
          operators.and(
            operators.eq(table.userId, userId),
            operators.gte(table.weekStartLocal, oldestWeekStart),
            operators.lte(table.weekStartLocal, currentWeekStart),
          ),
        orderBy: (table, operators) => [operators.asc(table.weekStartLocal)],
        columns: {
          weekStartLocal: true,
          totalDistanceM: true,
          avgPaceSecPerKm: true,
        },
      }),
      db.query.runRollupMonthly.findMany({
        where: (table, operators) =>
          operators.and(
            operators.eq(table.userId, userId),
            operators.gte(table.monthStartLocal, yearStart),
            operators.lte(table.monthStartLocal, currentMonthStart),
          ),
        orderBy: (table, operators) => [operators.asc(table.monthStartLocal)],
        columns: {
          monthStartLocal: true,
          totalDistanceM: true,
          totalElapsedS: true,
        },
      }),
      db.query.runPr.findMany({
        where: (table, operators) => operators.eq(table.userId, userId),
        columns: {
          prType: true,
          valueSeconds: true,
          valueDistanceM: true,
          activityStartDate: true,
        },
      }),
      db.query.intervalsSyncLog.findFirst({
        where: (table, operators) =>
          operators.and(
            operators.eq(table.userId, userId),
            operators.eq(table.status, "success"),
            operators.isNotNull(table.completedAt),
          ),
        orderBy: (table, operators) => [operators.desc(table.completedAt)],
        columns: {
          completedAt: true,
        },
      }),
      goalsDataPromise,
    ]);

  const monthlyByStart = new Map(
    monthlyRows.map((row) => [row.monthStartLocal.toISOString(), row]),
  );
  const currentMonth = monthlyByStart.get(currentMonthStart.toISOString());
  const yearlyTotals = monthlyRows.reduce(
    (acc, row) => ({
      totalDistanceM: acc.totalDistanceM + (row.totalDistanceM ?? 0),
      totalElapsedS: acc.totalElapsedS + (row.totalElapsedS ?? 0),
    }),
    { totalDistanceM: 0, totalElapsedS: 0 },
  );

  const prByType = new Map(prRows.map((row) => [row.prType, row]));

  const weeklyMileage = weeklyRows.map((row) => {
    const distanceMeters = row.totalDistanceM ?? 0;
    return {
      weekStart: row.weekStartLocal,
      distanceMeters,
    };
  });

  const paceTrend = weeklyRows.map((row) => ({
    weekStart: row.weekStartLocal,
    paceSecPerKm: row.avgPaceSecPerKm,
  }));

  return {
    lastSyncedAt: latestSuccessfulSync?.completedAt ?? null,
    kpis: {
      distanceThisYear: yearlyTotals.totalDistanceM,
      timeRunThisYear: yearlyTotals.totalElapsedS,
      distanceThisMonth: currentMonth?.totalDistanceM ?? 0,
      timeRunThisMonth: currentMonth?.totalElapsedS ?? 0,
    },
    personalRecords: {
      fastest1km: prByType.get("fastest_1km")?.valueSeconds ?? 0,
      fastest5k: prByType.get("fastest_5k")?.valueSeconds ?? 0,
      fastest10k: prByType.get("fastest_10k")?.valueSeconds ?? 0,
      fastestHalf: prByType.get("fastest_half")?.valueSeconds ?? 0,
      fastestFull: prByType.get("fastest_full")?.valueSeconds ?? 0,
      longestRunEver: prByType.get("longest_run")?.valueDistanceM ?? 0,
    },
    trends: {
      weeklyMileage,
      averagePace: paceTrend,
    },
    goals: goalsData.goals,
  };
}

export async function getAnalytics({
  userId,
  year,
}: {
  userId: string;
  year?: number;
}) {
  const now = new Date();
  const selectedYear = year ?? now.getUTCFullYear();
  const yearStart = new Date(Date.UTC(selectedYear, 0, 1));
  const yearEnd = new Date(Date.UTC(selectedYear + 1, 0, 1));
  const currentMonthStart = new Date(
    Date.UTC(selectedYear, now.getUTCMonth(), 1),
  );
  const currentWeekStart = startOfIsoWeekUtc(now);
  const oldestWeekStart = new Date(currentWeekStart);
  oldestWeekStart.setUTCDate(oldestWeekStart.getUTCDate() - 7 * 12);

  const [monthlyRows, weeklyRows, prRows] = await Promise.all([
    db.query.runRollupMonthly.findMany({
      where: (table, operators) =>
        operators.and(
          operators.eq(table.userId, userId),
          operators.gte(table.monthStartLocal, yearStart),
          operators.lt(table.monthStartLocal, yearEnd),
        ),
      orderBy: (table, operators) => [operators.asc(table.monthStartLocal)],
      columns: {
        monthStartLocal: true,
        totalDistanceM: true,
        totalElapsedS: true,
        avgPaceSecPerKm: true,
        runCount: true,
      },
    }),
    db.query.runRollupWeekly.findMany({
      where: (table, operators) =>
        operators.and(
          operators.eq(table.userId, userId),
          operators.gte(table.weekStartLocal, oldestWeekStart),
          operators.lte(table.weekStartLocal, currentWeekStart),
        ),
      orderBy: (table, operators) => [operators.asc(table.weekStartLocal)],
      columns: {
        weekStartLocal: true,
        totalDistanceM: true,
        avgPaceSecPerKm: true,
      },
    }),
    db.query.runPr.findMany({
      where: (table, operators) => operators.eq(table.userId, userId),
      columns: {
        prType: true,
        valueSeconds: true,
        valueDistanceM: true,
        activityStartDate: true,
      },
    }),
  ]);

  const monthlyByIso = new Map(
    monthlyRows.map((row) => [row.monthStartLocal.toISOString(), row]),
  );
  const monthly = Array.from({ length: 12 }, (_, monthOffset) => {
    const monthStart = new Date(Date.UTC(selectedYear, monthOffset, 1));
    const row = monthlyByIso.get(monthStart.toISOString());
    return {
      monthStart,
      distanceM: row?.totalDistanceM ?? 0,
      elapsedS: row?.totalElapsedS ?? 0,
      avgPaceSecPerKm: row?.avgPaceSecPerKm ?? null,
      runCount: row?.runCount ?? 0,
    };
  });

  const yearlyTotals = monthly.reduce(
    (acc, row) => ({
      distanceM: acc.distanceM + row.distanceM,
      elapsedS: acc.elapsedS + row.elapsedS,
      runCount: acc.runCount + row.runCount,
    }),
    { distanceM: 0, elapsedS: 0, runCount: 0 },
  );
  const currentMonth = monthly.find(
    (row) => row.monthStart.toISOString() === currentMonthStart.toISOString(),
  );

  const weekly = weeklyRows.map((row) => ({
    weekStart: row.weekStartLocal,
    distanceM: row.totalDistanceM ?? 0,
    avgPaceSecPerKm: row.avgPaceSecPerKm,
  }));

  const prByType = new Map(prRows.map((row) => [row.prType, row]));

  return {
    year: selectedYear,
    kpis: {
      distanceThisYear: yearlyTotals.distanceM,
      timeRunThisYear: yearlyTotals.elapsedS,
      runsThisYear: yearlyTotals.runCount,
      distanceThisMonth: currentMonth?.distanceM ?? 0,
      timeRunThisMonth: currentMonth?.elapsedS ?? 0,
      runsThisMonth: currentMonth?.runCount ?? 0,
      avgMonthlyDistance:
        monthly.length > 0 ? yearlyTotals.distanceM / monthly.length : 0,
    },
    monthly,
    weekly,
    personalRecords: {
      fastest1km: prByType.get("fastest_1km") ?? null,
      fastest5k: prByType.get("fastest_5k") ?? null,
      fastest10k: prByType.get("fastest_10k") ?? null,
      fastestHalf: prByType.get("fastest_half") ?? null,
      fastestFull: prByType.get("fastest_full") ?? null,
      longestRunEver: prByType.get("longest_run") ?? null,
    },
  };
}
