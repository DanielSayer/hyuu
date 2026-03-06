import { db, weeklyReviewDelivery } from "@hyuu/db";

export async function markWeeklyReviewDelivered({
  userId,
  currentWeekStart,
  deliveredAt,
}: {
  userId: string;
  currentWeekStart: Date;
  deliveredAt: Date;
}): Promise<void> {
  await db
    .insert(weeklyReviewDelivery)
    .values({
      userId,
      lastDeliveredWeekStartLocal: currentWeekStart,
      lastDeliveredAt: deliveredAt,
    })
    .onConflictDoUpdate({
      target: weeklyReviewDelivery.userId,
      set: {
        lastDeliveredWeekStartLocal: currentWeekStart,
        lastDeliveredAt: deliveredAt,
        updatedAt: deliveredAt,
      },
    });
}
