import { relations } from "drizzle-orm";
import {
  doublePrecision,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { user } from "./auth";

export const runningPlanExperienceLevel = pgEnum(
  "running_plan_experience_level",
  ["new", "returning", "intermediate", "advanced"],
);

export const runningPlanMotivation = pgEnum("running_plan_motivation", [
  "fitness",
  "consistency",
  "weight_loss",
  "stress_relief",
  "performance",
  "race",
]);

export const runningPlanEffortPreference = pgEnum(
  "running_plan_effort_preference",
  ["conservative", "balanced", "ambitious"],
);

export const runningPlanDraftType = pgEnum("running_plan_draft_type", [
  "create_scaffold",
  "update_scaffold",
]);

export const runningPlanDraftStatus = pgEnum("running_plan_draft_status", [
  "draft",
  "finalized",
  "archived",
]);

export const runningPlanGoalType = pgEnum("running_plan_goal_type", [
  "general_fitness",
  "consistency",
  "distance",
  "race",
]);

export const runningPlanScaffoldStatus = pgEnum("running_plan_scaffold_status", [
  "draft",
  "active",
  "paused",
  "completed",
  "archived",
]);

export const runningPlanCycleStatus = pgEnum("running_plan_cycle_status", [
  "pending",
  "active",
  "completed",
  "superseded",
  "cancelled",
]);

export const runningPlanDifficulty = pgEnum("running_plan_difficulty", [
  "too_easy",
  "right",
  "too_hard",
]);

export const runningPlanFatigueLevel = pgEnum("running_plan_fatigue_level", [
  "low",
  "moderate",
  "high",
]);

export const runningPlanProfile = pgTable(
  "running_plan_profile",
  {
    userId: text("user_id")
      .primaryKey()
      .references(() => user.id, { onDelete: "cascade" }),
    experienceLevel: runningPlanExperienceLevel("experience_level"),
    primaryMotivation: runningPlanMotivation("primary_motivation"),
    typicalWeeklyRuns: integer("typical_weekly_runs"),
    typicalWeeklyDistanceKm: doublePrecision("typical_weekly_distance_km"),
    longestRecentRunKm: doublePrecision("longest_recent_run_km"),
    preferredLongRunDay: integer("preferred_long_run_day"),
    preferredRunDays: jsonb("preferred_run_days"),
    blockedDays: jsonb("blocked_days"),
    weekStartDay: integer("week_start_day"),
    surfacePreferences: jsonb("surface_preferences"),
    injuryNotes: text("injury_notes"),
    timeConstraintsNotes: text("time_constraints_notes"),
    planEffortPreference: runningPlanEffortPreference("plan_effort_preference"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("running_plan_profile_week_start_idx").on(table.weekStartDay)],
);

export const runningPlanDraft = pgTable(
  "running_plan_draft",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    draftType: runningPlanDraftType("draft_type").notNull(),
    status: runningPlanDraftStatus("status").default("draft").notNull(),
    wizardVersion: integer("wizard_version").default(1).notNull(),
    currentStep: text("current_step").notNull(),
    draftData: jsonb("draft_data").notNull(),
    completedSteps: jsonb("completed_steps").notNull(),
    lastTouchedAt: timestamp("last_touched_at").defaultNow().notNull(),
    finalizedAt: timestamp("finalized_at"),
    archivedAt: timestamp("archived_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("running_plan_draft_user_status_idx").on(table.userId, table.status),
    index("running_plan_draft_user_updated_idx").on(table.userId, table.updatedAt),
  ],
);

export const runningPlanScaffold = pgTable(
  "running_plan_scaffold",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    status: runningPlanScaffoldStatus("status").default("draft").notNull(),
    goalType: runningPlanGoalType("goal_type").notNull(),
    goalDetails: jsonb("goal_details").notNull(),
    startDate: timestamp("start_date").notNull(),
    targetEndDate: timestamp("target_end_date"),
    planningHorizonWeeks: integer("planning_horizon_weeks"),
    defaultRunsPerWeek: integer("default_runs_per_week"),
    preferredRunDays: jsonb("preferred_run_days").notNull(),
    blockedDays: jsonb("blocked_days").notNull(),
    longRunDay: integer("long_run_day"),
    crossTrainingDays: jsonb("cross_training_days"),
    constraints: jsonb("constraints").notNull(),
    profileSnapshot: jsonb("profile_snapshot").notNull(),
    createdFromDraftId: integer("created_from_draft_id").references(
      () => runningPlanDraft.id,
      { onDelete: "set null" },
    ),
    currentCycleNumber: integer("current_cycle_number").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("running_plan_scaffold_user_status_idx").on(table.userId, table.status),
    index("running_plan_scaffold_user_created_idx").on(
      table.userId,
      table.createdAt,
    ),
  ],
);

export const runningPlanCycle = pgTable(
  "running_plan_cycle",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    scaffoldId: integer("scaffold_id")
      .notNull()
      .references(() => runningPlanScaffold.id, { onDelete: "cascade" }),
    cycleNumber: integer("cycle_number").notNull(),
    startDate: timestamp("start_date").notNull(),
    endDate: timestamp("end_date").notNull(),
    status: runningPlanCycleStatus("status").default("pending").notNull(),
    generationInput: jsonb("generation_input"),
    generationMetadata: jsonb("generation_metadata"),
    adjustmentNotes: jsonb("adjustment_notes"),
    generatedAt: timestamp("generated_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("running_plan_cycle_scaffold_number_unique").on(
      table.scaffoldId,
      table.cycleNumber,
    ),
    index("running_plan_cycle_user_scaffold_idx").on(table.userId, table.scaffoldId),
    index("running_plan_cycle_user_start_idx").on(table.userId, table.startDate),
  ],
);

export const runningPlanCycleReview = pgTable(
  "running_plan_cycle_review",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    cycleId: integer("cycle_id")
      .notNull()
      .references(() => runningPlanCycle.id, { onDelete: "cascade" }),
    completionScore: integer("completion_score"),
    feltDifficulty: runningPlanDifficulty("felt_difficulty"),
    fatigueLevel: runningPlanFatigueLevel("fatigue_level"),
    painFlags: jsonb("pain_flags"),
    missedRunsCount: integer("missed_runs_count"),
    notes: text("notes"),
    derivedMetrics: jsonb("derived_metrics"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("running_plan_cycle_review_cycle_unique").on(table.cycleId),
    index("running_plan_cycle_review_user_idx").on(table.userId),
  ],
);

export const runningPlanEvent = pgTable(
  "running_plan_event",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    draftId: integer("draft_id").references(() => runningPlanDraft.id, {
      onDelete: "set null",
    }),
    scaffoldId: integer("scaffold_id").references(() => runningPlanScaffold.id, {
      onDelete: "set null",
    }),
    cycleId: integer("cycle_id").references(() => runningPlanCycle.id, {
      onDelete: "set null",
    }),
    cycleReviewId: integer("cycle_review_id").references(
      () => runningPlanCycleReview.id,
      { onDelete: "set null" },
    ),
    eventType: text("event_type").notNull(),
    payload: jsonb("payload"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("running_plan_event_user_created_idx").on(table.userId, table.createdAt),
    index("running_plan_event_scaffold_idx").on(table.scaffoldId),
    index("running_plan_event_cycle_idx").on(table.cycleId),
  ],
);

export const runningPlanProfileRelations = relations(
  runningPlanProfile,
  ({ one }) => ({
    user: one(user, {
      fields: [runningPlanProfile.userId],
      references: [user.id],
    }),
  }),
);

export const runningPlanDraftRelations = relations(
  runningPlanDraft,
  ({ one, many }) => ({
    user: one(user, {
      fields: [runningPlanDraft.userId],
      references: [user.id],
    }),
    scaffolds: many(runningPlanScaffold),
    events: many(runningPlanEvent),
  }),
);

export const runningPlanScaffoldRelations = relations(
  runningPlanScaffold,
  ({ one, many }) => ({
    user: one(user, {
      fields: [runningPlanScaffold.userId],
      references: [user.id],
    }),
    createdFromDraft: one(runningPlanDraft, {
      fields: [runningPlanScaffold.createdFromDraftId],
      references: [runningPlanDraft.id],
    }),
    cycles: many(runningPlanCycle),
    events: many(runningPlanEvent),
  }),
);

export const runningPlanCycleRelations = relations(
  runningPlanCycle,
  ({ one, many }) => ({
    user: one(user, {
      fields: [runningPlanCycle.userId],
      references: [user.id],
    }),
    scaffold: one(runningPlanScaffold, {
      fields: [runningPlanCycle.scaffoldId],
      references: [runningPlanScaffold.id],
    }),
    review: one(runningPlanCycleReview, {
      fields: [runningPlanCycle.id],
      references: [runningPlanCycleReview.cycleId],
    }),
    events: many(runningPlanEvent),
  }),
);

export const runningPlanCycleReviewRelations = relations(
  runningPlanCycleReview,
  ({ one, many }) => ({
    user: one(user, {
      fields: [runningPlanCycleReview.userId],
      references: [user.id],
    }),
    cycle: one(runningPlanCycle, {
      fields: [runningPlanCycleReview.cycleId],
      references: [runningPlanCycle.id],
    }),
    events: many(runningPlanEvent),
  }),
);

export const runningPlanEventRelations = relations(
  runningPlanEvent,
  ({ one }) => ({
    user: one(user, {
      fields: [runningPlanEvent.userId],
      references: [user.id],
    }),
    draft: one(runningPlanDraft, {
      fields: [runningPlanEvent.draftId],
      references: [runningPlanDraft.id],
    }),
    scaffold: one(runningPlanScaffold, {
      fields: [runningPlanEvent.scaffoldId],
      references: [runningPlanScaffold.id],
    }),
    cycle: one(runningPlanCycle, {
      fields: [runningPlanEvent.cycleId],
      references: [runningPlanCycle.id],
    }),
    cycleReview: one(runningPlanCycleReview, {
      fields: [runningPlanEvent.cycleReviewId],
      references: [runningPlanCycleReview.id],
    }),
  }),
);
