import { relations } from "drizzle-orm";
import {
  doublePrecision,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { intervalsActivity } from "./intervals";

export const dashboardRunPr = pgTable(
  "dashboard_run_pr",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    prType: text("pr_type").notNull(),
    activityId: integer("activity_id").references(() => intervalsActivity.id, {
      onDelete: "set null",
    }),
    valueSeconds: integer("value_seconds"),
    valueDistanceM: doublePrecision("value_distance_m"),
    activityStartDate: timestamp("activity_start_date"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("dashboard_run_pr_user_type_unique").on(
      table.userId,
      table.prType,
    ),
    index("dashboard_run_pr_user_idx").on(table.userId),
  ],
);

export const dashboardRunPrRelations = relations(dashboardRunPr, ({ one }) => ({
  user: one(user, {
    fields: [dashboardRunPr.userId],
    references: [user.id],
  }),
  activity: one(intervalsActivity, {
    fields: [dashboardRunPr.activityId],
    references: [intervalsActivity.id],
  }),
}));
