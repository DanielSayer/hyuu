import { db, runRollupMonthly, runRollupWeekly } from "@hyuu/db";
import { and, eq } from "drizzle-orm";
import {
  computePaceSecPerKm,
  isRunActivityType,
  startOfIsoWeekUtc,
  startOfMonthUtc,
  toLocalDateOrNull,
  toLocalDateTimeString,
} from "../utils";

type ActivityForRollup = {
  type: string | null;
  distance: number | null;
  elapsedTime: number | null;
  movingTime: number | null;
};

function buildRollupStats(rows: ActivityForRollup[]) {
  let runCount = 0;
  let totalDistanceM = 0;
  let totalElapsedS = 0;
  let totalMovingS = 0;

  for (const row of rows) {
    if (!isRunActivityType(row.type)) {
      continue;
    }
    runCount += 1;
    totalDistanceM += row.distance ?? 0;
    totalElapsedS += row.elapsedTime ?? 0;
    totalMovingS += row.movingTime ?? 0;
  }

  if (runCount === 0) {
    return null;
  }

  return {
    runCount,
    totalDistanceM,
    totalElapsedS,
    totalMovingS,
    avgPaceSecPerKm:
      computePaceSecPerKm({
        elapsedSeconds: totalElapsedS,
        distanceMeters: totalDistanceM,
      }) ?? 0,
  };
}

async function recomputeWeeklyBucket({
  userId,
  weekStart,
  weekEnd,
}: {
  userId: string;
  weekStart: Date;
  weekEnd: Date;
}) {
  const rows = await db.query.intervalsActivity.findMany({
    where: (table, operators) =>
      operators.and(
        operators.eq(table.userId, userId),
        operators.isNotNull(table.startDateLocal),
        operators.gte(table.startDateLocal, toLocalDateTimeString(weekStart)),
        operators.lt(table.startDateLocal, toLocalDateTimeString(weekEnd)),
      ),
    columns: {
      type: true,
      distance: true,
      elapsedTime: true,
      movingTime: true,
    },
  });

  const stats = buildRollupStats(rows);

  await db
    .delete(runRollupWeekly)
    .where(
      and(
        eq(runRollupWeekly.userId, userId),
        eq(runRollupWeekly.weekStartLocal, weekStart),
      ),
    );

  if (!stats) {
    return;
  }

  await db.insert(runRollupWeekly).values({
    userId,
    weekStartLocal: weekStart,
    runCount: stats.runCount,
    totalDistanceM: stats.totalDistanceM,
    totalElapsedS: stats.totalElapsedS,
    totalMovingS: stats.totalMovingS,
    avgPaceSecPerKm: stats.avgPaceSecPerKm,
  });
}

async function recomputeMonthlyBucket({
  userId,
  monthStart,
  monthEnd,
}: {
  userId: string;
  monthStart: Date;
  monthEnd: Date;
}) {
  const rows = await db.query.intervalsActivity.findMany({
    where: (table, operators) =>
      operators.and(
        operators.eq(table.userId, userId),
        operators.isNotNull(table.startDateLocal),
        operators.gte(table.startDateLocal, toLocalDateTimeString(monthStart)),
        operators.lt(table.startDateLocal, toLocalDateTimeString(monthEnd)),
      ),
    columns: {
      type: true,
      distance: true,
      elapsedTime: true,
      movingTime: true,
    },
  });

  const stats = buildRollupStats(rows);

  await db
    .delete(runRollupMonthly)
    .where(
      and(
        eq(runRollupMonthly.userId, userId),
        eq(runRollupMonthly.monthStartLocal, monthStart),
      ),
    );

  if (!stats) {
    return;
  }

  await db.insert(runRollupMonthly).values({
    userId,
    monthStartLocal: monthStart,
    runCount: stats.runCount,
    totalDistanceM: stats.totalDistanceM,
    totalElapsedS: stats.totalElapsedS,
    totalMovingS: stats.totalMovingS,
    avgPaceSecPerKm: stats.avgPaceSecPerKm,
  });
}

export async function recomputeRunRollupsForAffectedDates({
  userId,
  affectedDates,
}: {
  userId: string;
  affectedDates: Date[];
}) {
  if (affectedDates.length === 0) {
    return;
  }

  const weekStarts = new Set(
    affectedDates.map((date) => toLocalDateTimeString(startOfIsoWeekUtc(date))),
  );
  const monthStarts = new Set(
    affectedDates.map((date) => toLocalDateTimeString(startOfMonthUtc(date))),
  );

  for (const weekStartIso of weekStarts) {
    const weekStart = toLocalDateOrNull(weekStartIso);
    if (!weekStart) {
      continue;
    }
    const weekEnd = new Date(weekStart);
    weekEnd.setUTCDate(weekEnd.getUTCDate() + 7);
    await recomputeWeeklyBucket({ userId, weekStart, weekEnd });
  }

  for (const monthStartIso of monthStarts) {
    const monthStart = toLocalDateOrNull(monthStartIso);
    if (!monthStart) {
      continue;
    }
    const monthEnd = new Date(monthStart);
    monthEnd.setUTCMonth(monthEnd.getUTCMonth() + 1);
    await recomputeMonthlyBucket({ userId, monthStart, monthEnd });
  }
}

export async function recomputeAllRunRollupsForUser(userId: string) {
  const rows = await db.query.intervalsActivity.findMany({
    where: (table, operators) =>
      operators.and(
        operators.eq(table.userId, userId),
        operators.isNotNull(table.startDateLocal),
      ),
    columns: {
      type: true,
      distance: true,
      elapsedTime: true,
      movingTime: true,
      startDateLocal: true,
    },
  });

  const weeklyRows = new Map<string, ActivityForRollup[]>();
  const monthlyRows = new Map<string, ActivityForRollup[]>();

  for (const row of rows) {
    if (!row.startDateLocal) {
      continue;
    }
    const localStartDate = toLocalDateOrNull(row.startDateLocal);
    if (!localStartDate) {
      continue;
    }
    const weekStart = startOfIsoWeekUtc(localStartDate);
    const monthStart = startOfMonthUtc(localStartDate);
    const weekKey = weekStart.toISOString();
    const monthKey = monthStart.toISOString();

    const rollupRow = {
      type: row.type,
      distance: row.distance,
      elapsedTime: row.elapsedTime,
      movingTime: row.movingTime,
    } satisfies ActivityForRollup;

    const weekBucket = weeklyRows.get(weekKey);
    if (weekBucket) {
      weekBucket.push(rollupRow);
    } else {
      weeklyRows.set(weekKey, [rollupRow]);
    }

    const monthBucket = monthlyRows.get(monthKey);
    if (monthBucket) {
      monthBucket.push(rollupRow);
    } else {
      monthlyRows.set(monthKey, [rollupRow]);
    }
  }

  await db.delete(runRollupWeekly).where(eq(runRollupWeekly.userId, userId));
  await db.delete(runRollupMonthly).where(eq(runRollupMonthly.userId, userId));

  const weeklyValues = [...weeklyRows.entries()].flatMap(
    ([weekStartIso, bucketRows]) => {
      const stats = buildRollupStats(bucketRows);
      if (!stats) {
        return [];
      }
      return [
        {
          userId,
          weekStartLocal: new Date(weekStartIso),
          runCount: stats.runCount,
          totalDistanceM: stats.totalDistanceM,
          totalElapsedS: stats.totalElapsedS,
          totalMovingS: stats.totalMovingS,
          avgPaceSecPerKm: stats.avgPaceSecPerKm,
        },
      ];
    },
  );

  if (weeklyValues.length > 0) {
    await db.insert(runRollupWeekly).values(weeklyValues);
  }

  const monthlyValues = [...monthlyRows.entries()].flatMap(
    ([monthStartIso, bucketRows]) => {
      const stats = buildRollupStats(bucketRows);
      if (!stats) {
        return [];
      }
      return [
        {
          userId,
          monthStartLocal: new Date(monthStartIso),
          runCount: stats.runCount,
          totalDistanceM: stats.totalDistanceM,
          totalElapsedS: stats.totalElapsedS,
          totalMovingS: stats.totalMovingS,
          avgPaceSecPerKm: stats.avgPaceSecPerKm,
        },
      ];
    },
  );

  if (monthlyValues.length > 0) {
    await db.insert(runRollupMonthly).values(monthlyValues);
  }
}
