import { relations } from "drizzle-orm";
import {
  doublePrecision,
  index,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { user } from "./auth";

export const goalType = pgEnum("goal_type", ["distance", "frequency", "pace"]);
export const goalCadence = pgEnum("goal_cadence", ["weekly", "monthly"]);

export const goal = pgTable(
  "goal",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    goalType: goalType("goal_type").notNull(),
    cadence: goalCadence("cadence").notNull(),
    targetValue: doublePrecision("target_value").notNull(),
    abandonedAt: timestamp("abandoned_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("goal_user_type_cadence_unique").on(
      table.userId,
      table.goalType,
      table.cadence,
    ),
    index("goal_user_abandoned_idx").on(table.userId, table.abandonedAt),
  ],
);

export const goalProgress = pgTable(
  "goal_progress",
  {
    id: serial("id").primaryKey(),
    goalId: integer("goal_id")
      .notNull()
      .references(() => goal.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    cadence: goalCadence("cadence").notNull(),
    periodStartLocal: timestamp("period_start_local").notNull(),
    currentValue: doublePrecision("current_value").default(0).notNull(),
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("goal_progress_goal_period_unique").on(
      table.goalId,
      table.cadence,
      table.periodStartLocal,
    ),
    index("goal_progress_user_period_idx").on(
      table.userId,
      table.cadence,
      table.periodStartLocal,
    ),
  ],
);

export const goalStreak = pgTable(
  "goal_streak",
  {
    id: serial("id").primaryKey(),
    goalId: integer("goal_id")
      .notNull()
      .references(() => goal.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    endedAt: timestamp("ended_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("goal_streak_goal_unique").on(table.goalId),
    index("goal_streak_user_ended_idx").on(table.userId, table.endedAt),
  ],
);

export const goalRelations = relations(goal, ({ one, many }) => ({
  user: one(user, {
    fields: [goal.userId],
    references: [user.id],
  }),
  progress: many(goalProgress),
  streaks: many(goalStreak),
}));

export const goalProgressRelations = relations(goalProgress, ({ one }) => ({
  user: one(user, {
    fields: [goalProgress.userId],
    references: [user.id],
  }),
  goal: one(goal, {
    fields: [goalProgress.goalId],
    references: [goal.id],
  }),
}));

export const goalStreakRelations = relations(goalStreak, ({ one }) => ({
  user: one(user, {
    fields: [goalStreak.userId],
    references: [user.id],
  }),
  goal: one(goal, {
    fields: [goalStreak.goalId],
    references: [goal.id],
  }),
}));
