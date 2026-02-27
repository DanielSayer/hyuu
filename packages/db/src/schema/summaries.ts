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

export const dashboardRunRollupWeekly = pgTable(
  "dashboard_run_rollup_weekly",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    weekStartLocal: timestamp("week_start_local").notNull(),
    runCount: integer("run_count").default(0).notNull(),
    totalDistanceM: doublePrecision("total_distance_m").default(0).notNull(),
    totalElapsedS: integer("total_elapsed_s").default(0).notNull(),
    totalMovingS: integer("total_moving_s").default(0).notNull(),
    avgPaceSecPerKm: doublePrecision("avg_pace_sec_per_km").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("dashboard_run_rollup_weekly_user_week_unique").on(
      table.userId,
      table.weekStartLocal,
    ),
    index("dashboard_run_rollup_weekly_user_week_idx").on(
      table.userId,
      table.weekStartLocal,
    ),
  ],
);

export const dashboardRunRollupMonthly = pgTable(
  "dashboard_run_rollup_monthly",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    monthStartLocal: timestamp("month_start_local").notNull(),
    runCount: integer("run_count").default(0).notNull(),
    totalDistanceM: doublePrecision("total_distance_m").default(0).notNull(),
    totalElapsedS: integer("total_elapsed_s").default(0).notNull(),
    totalMovingS: integer("total_moving_s").default(0).notNull(),
    avgPaceSecPerKm: doublePrecision("avg_pace_sec_per_km"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("dashboard_run_rollup_monthly_user_month_unique").on(
      table.userId,
      table.monthStartLocal,
    ),
    index("dashboard_run_rollup_monthly_user_month_idx").on(
      table.userId,
      table.monthStartLocal,
    ),
  ],
);

export const dashboardRunRollupWeeklyRelations = relations(
  dashboardRunRollupWeekly,
  ({ one }) => ({
    user: one(user, {
      fields: [dashboardRunRollupWeekly.userId],
      references: [user.id],
    }),
  }),
);

export const dashboardRunRollupMonthlyRelations = relations(
  dashboardRunRollupMonthly,
  ({ one }) => ({
    user: one(user, {
      fields: [dashboardRunRollupMonthly.userId],
      references: [user.id],
    }),
  }),
);
