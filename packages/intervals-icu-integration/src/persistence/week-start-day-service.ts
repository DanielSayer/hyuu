import { db } from "@hyuu/db";
import { userSettings } from "@hyuu/db/schema/auth";

export async function getOrCreateUserWeekStartDay(userId: string): Promise<0 | 1> {
  const settings = await db.query.userSettings.findFirst({
    where: (table, operators) => operators.eq(table.userId, userId),
    columns: {
      weekStartDay: true,
    },
  });
  if (settings) {
    return settings.weekStartDay === 0 ? 0 : 1;
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
