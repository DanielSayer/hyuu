import { relations } from "drizzle-orm";
import {
  boolean,
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

export const dashboardGoal = pgTable(
  "dashboard_goal",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    goalType: text("goal_type").notNull(),
    targetValue: doublePrecision("target_value").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("dashboard_goal_user_type_unique").on(
      table.userId,
      table.goalType,
    ),
    index("dashboard_goal_user_active_idx").on(table.userId, table.isActive),
  ],
);

export const dashboardGoalProgressWeekly = pgTable(
  "dashboard_goal_progress_weekly",
  {
    id: serial("id").primaryKey(),
    goalId: integer("goal_id")
      .notNull()
      .references(() => dashboardGoal.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    weekStartLocal: timestamp("week_start_local").notNull(),
    currentValue: doublePrecision("current_value").default(0).notNull(),
    isComplete: boolean("is_complete").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("dashboard_goal_progress_weekly_goal_week_unique").on(
      table.goalId,
      table.weekStartLocal,
    ),
    index("dashboard_goal_progress_weekly_user_week_idx").on(
      table.userId,
      table.weekStartLocal,
    ),
  ],
);

export const dashboardGoalRelations = relations(
  dashboardGoal,
  ({ one, many }) => ({
    user: one(user, {
      fields: [dashboardGoal.userId],
      references: [user.id],
    }),
    weeklyProgress: many(dashboardGoalProgressWeekly),
  }),
);

export const dashboardGoalProgressWeeklyRelations = relations(
  dashboardGoalProgressWeekly,
  ({ one }) => ({
    user: one(user, {
      fields: [dashboardGoalProgressWeekly.userId],
      references: [user.id],
    }),
    goal: one(dashboardGoal, {
      fields: [dashboardGoalProgressWeekly.goalId],
      references: [dashboardGoal.id],
    }),
  }),
);
