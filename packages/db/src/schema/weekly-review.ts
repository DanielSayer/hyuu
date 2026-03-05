import { relations } from "drizzle-orm";
import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const weeklyReviewDelivery = pgTable(
  "weekly_review_delivery",
  {
    userId: text("user_id")
      .primaryKey()
      .references(() => user.id, { onDelete: "cascade" }),
    lastDeliveredWeekStartLocal: timestamp(
      "last_delivered_week_start_local",
    ).notNull(),
    lastDeliveredAt: timestamp("last_delivered_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("weekly_review_delivery_week_idx").on(
      table.lastDeliveredWeekStartLocal,
    ),
  ],
);

export const weeklyReviewDeliveryRelations = relations(
  weeklyReviewDelivery,
  ({ one }) => ({
    user: one(user, {
      fields: [weeklyReviewDelivery.userId],
      references: [user.id],
    }),
  }),
);
