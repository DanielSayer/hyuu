import { db } from "@hyuu/db";
import type { GoalCadence } from "../../schemas/goals";
import { isRunActivityType } from "../../utils/activities";

export async function computePeriodGoalMetrics({
  userId,
  periodStart,
  cadence,
}: {
  userId: string;
  periodStart: Date;
  cadence: GoalCadence;
}) {
  const periodEnd = new Date(periodStart);
  if (cadence === "weekly") {
    periodEnd.setUTCDate(periodEnd.getUTCDate() + 7);
  } else {
    periodEnd.setUTCMonth(periodEnd.getUTCMonth() + 1);
  }

  const rows = await db.query.intervalsActivity.findMany({
    where: (table, operators) =>
      operators.and(
        operators.eq(table.userId, userId),
        operators.isNotNull(table.startDate),
        operators.gte(table.startDate, periodStart),
        operators.lt(table.startDate, periodEnd),
      ),
    columns: {
      type: true,
      distance: true,
      elapsedTime: true,
      startDate: true,
    },
  });

  let distanceMeters = 0;
  let elapsedSeconds = 0;
  let runCount = 0;

  for (const row of rows) {
    if (!isRunActivityType(row.type)) {
      continue;
    }
    runCount += 1;
    distanceMeters += row.distance ?? 0;
    elapsedSeconds += row.elapsedTime ?? 0;
  }

  return {
    distance: distanceMeters,
    frequency: runCount,
    pace:
      distanceMeters > 0 && elapsedSeconds > 0
        ? elapsedSeconds / (distanceMeters / 1000)
        : 0,
  };
}
