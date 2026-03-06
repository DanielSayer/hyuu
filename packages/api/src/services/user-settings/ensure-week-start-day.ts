import { db, userSettings } from "@hyuu/db";
import { toWeekStartDay } from "../../utils/goals";

export async function ensureUserWeekStartDay(userId: string): Promise<0 | 1> {
  const settings = await db.query.userSettings.findFirst({
    where: (table, operators) => operators.eq(table.userId, userId),
    columns: { weekStartDay: true },
  });
  if (settings) {
    return toWeekStartDay(settings.weekStartDay);
  }
  await db
    .insert(userSettings)
    .values({
      userId,
      weekStartDay: 1,
    })
    .onConflictDoNothing();
  return 1;
}
