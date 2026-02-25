import { relations } from "drizzle-orm";
import {
  boolean,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { user } from "./auth";

export const intervalsAthleteProfile = pgTable(
  "intervals_athlete_profile",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    intervalsAthleteId: text("intervals_athlete_id").notNull(),
    name: text("name"),
    firstName: text("first_name"),
    lastName: text("last_name"),
    email: text("email"),
    sex: text("sex"),
    city: text("city"),
    state: text("state"),
    country: text("country"),
    timezone: text("timezone"),
    locale: text("locale"),
    measurementPreference: text("measurement_preference"),
    status: text("status"),
    visibility: text("visibility"),
    weightKg: integer("weight_kg"),
    icuWeightKg: integer("icu_weight_kg"),
    icuLastSeenAt: timestamp("icu_last_seen_at"),
    icuActivatedAt: timestamp("icu_activated_at"),
    stravaId: text("strava_id"),
    stravaAuthorized: boolean("strava_authorized"),
    rawData: jsonb("raw_data").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("intervals_athlete_profile_user_athlete_unique").on(
      table.userId,
      table.intervalsAthleteId,
    ),
    index("intervals_athlete_profile_user_idx").on(table.userId),
  ],
);

export const intervalsSyncLog = pgTable(
  "intervals_sync_log",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    intervalsAthleteId: text("intervals_athlete_id"),
    status: text("status").notNull(),
    startedAt: timestamp("started_at").defaultNow().notNull(),
    completedAt: timestamp("completed_at"),
    fetchedActivityCount: integer("fetched_activity_count")
      .default(0)
      .notNull(),
    errorMessage: text("error_message"),
  },
  (table) => [
    index("intervals_sync_log_user_idx").on(table.userId, table.startedAt),
    index("intervals_sync_log_user_status_idx").on(table.userId, table.status),
  ],
);

export const intervalsActivity = pgTable(
  "intervals_activity",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    intervalsAthleteId: text("intervals_athlete_id").notNull(),
    intervalsActivityId: text("intervals_activity_id").notNull(),
    type: text("type"),
    name: text("name"),
    source: text("source"),
    externalId: text("external_id"),
    startDate: timestamp("start_date"),
    startDateLocal: timestamp("start_date_local"),
    analyzedAt: timestamp("analyzed_at"),
    syncedAt: timestamp("synced_at"),
    distance: doublePrecision("distance"),
    movingTime: integer("moving_time"),
    elapsedTime: integer("elapsed_time"),
    totalElevationGain: doublePrecision("total_elevation_gain"),
    totalElevationLoss: doublePrecision("total_elevation_loss"),
    averageSpeed: doublePrecision("average_speed"),
    maxSpeed: doublePrecision("max_speed"),
    averageHeartrate: doublePrecision("average_heartrate"),
    maxHeartrate: doublePrecision("max_heartrate"),
    averageCadence: doublePrecision("average_cadence"),
    averageStride: doublePrecision("average_stride"),
    calories: doublePrecision("calories"),
    deviceName: text("device_name"),
    trainingLoad: integer("training_load"),
    hrLoad: integer("hr_load"),
    intensity: doublePrecision("intensity"),
    lthr: integer("lthr"),
    athleteMaxHr: integer("athlete_max_hr"),
    heartRateZonesBpm: jsonb("heart_rate_zones_bpm"),
    heartRateZoneDurationsSeconds: jsonb("heart_rate_zone_durations_seconds"),
    oneKmSplitTimesSeconds: jsonb("one_km_split_times_seconds"),
    intervalSummary: jsonb("interval_summary"),
    mapData: jsonb("map_data"),
    rawData: jsonb("raw_data").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("intervals_activity_user_activity_unique").on(
      table.userId,
      table.intervalsActivityId,
    ),
    index("intervals_activity_user_idx").on(table.userId),
    index("intervals_activity_user_start_idx").on(
      table.userId,
      table.startDate,
    ),
    index("intervals_activity_user_type_start_idx").on(
      table.userId,
      table.type,
      table.startDate,
    ),
    index("intervals_activity_athlete_start_idx").on(
      table.intervalsAthleteId,
      table.startDate,
    ),
  ],
);

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

export const intervalsActivityInterval = pgTable(
  "intervals_activity_interval",
  {
    id: serial("id").primaryKey(),
    activityId: integer("activity_id")
      .notNull()
      .references(() => intervalsActivity.id, { onDelete: "cascade" }),
    intervalId: text("interval_id").notNull(),
    intervalType: text("interval_type"),
    groupId: text("group_id"),
    zone: integer("zone"),
    intensity: doublePrecision("intensity"),
    distance: doublePrecision("distance"),
    movingTime: integer("moving_time"),
    elapsedTime: integer("elapsed_time"),
    startTime: integer("start_time"),
    endTime: integer("end_time"),
    averageSpeed: doublePrecision("average_speed"),
    maxSpeed: doublePrecision("max_speed"),
    averageHeartrate: doublePrecision("average_heartrate"),
    maxHeartrate: doublePrecision("max_heartrate"),
    averageCadence: doublePrecision("average_cadence"),
    averageStride: doublePrecision("average_stride"),
    totalElevationGain: doublePrecision("total_elevation_gain"),
    rawData: jsonb("raw_data").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("intervals_activity_interval_unique").on(
      table.activityId,
      table.intervalId,
    ),
    index("intervals_activity_interval_activity_idx").on(table.activityId),
  ],
);

export const intervalsActivityStream = pgTable(
  "intervals_activity_stream",
  {
    id: serial("id").primaryKey(),
    activityId: integer("activity_id")
      .notNull()
      .references(() => intervalsActivity.id, { onDelete: "cascade" }),
    streamType: text("stream_type").notNull(),
    name: text("name"),
    data: jsonb("data").notNull(),
    data2: jsonb("data2"),
    valueTypeIsArray: boolean("value_type_is_array"),
    anomalies: jsonb("anomalies"),
    custom: boolean("custom"),
    allNull: boolean("all_null"),
    rawData: jsonb("raw_data").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("intervals_activity_stream_unique").on(
      table.activityId,
      table.streamType,
    ),
    index("intervals_activity_stream_activity_idx").on(table.activityId),
  ],
);

export const intervalsActivityBestEffort = pgTable(
  "intervals_activity_best_effort",
  {
    id: serial("id").primaryKey(),
    activityId: integer("activity_id")
      .notNull()
      .references(() => intervalsActivity.id, { onDelete: "cascade" }),
    targetDistanceMeters: doublePrecision("target_distance_meters").notNull(),
    durationSeconds: integer("duration_seconds").notNull(),
    startIndex: integer("start_index").notNull(),
    endIndex: integer("end_index").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("intervals_activity_best_effort_unique").on(
      table.activityId,
      table.targetDistanceMeters,
    ),
    index("intervals_activity_best_effort_activity_idx").on(table.activityId),
  ],
);

export const intervalsAthleteProfileRelations = relations(
  intervalsAthleteProfile,
  ({ one }) => ({
    user: one(user, {
      fields: [intervalsAthleteProfile.userId],
      references: [user.id],
    }),
  }),
);

export const intervalsSyncLogRelations = relations(
  intervalsSyncLog,
  ({ one }) => ({
    user: one(user, {
      fields: [intervalsSyncLog.userId],
      references: [user.id],
    }),
  }),
);

export const intervalsActivityRelations = relations(
  intervalsActivity,
  ({ one, many }) => ({
    user: one(user, {
      fields: [intervalsActivity.userId],
      references: [user.id],
    }),
    intervals: many(intervalsActivityInterval),
    streams: many(intervalsActivityStream),
    bestEfforts: many(intervalsActivityBestEffort),
  }),
);

export const intervalsActivityIntervalRelations = relations(
  intervalsActivityInterval,
  ({ one }) => ({
    activity: one(intervalsActivity, {
      fields: [intervalsActivityInterval.activityId],
      references: [intervalsActivity.id],
    }),
  }),
);

export const intervalsActivityStreamRelations = relations(
  intervalsActivityStream,
  ({ one }) => ({
    activity: one(intervalsActivity, {
      fields: [intervalsActivityStream.activityId],
      references: [intervalsActivity.id],
    }),
  }),
);

export const intervalsActivityBestEffortRelations = relations(
  intervalsActivityBestEffort,
  ({ one }) => ({
    activity: one(intervalsActivity, {
      fields: [intervalsActivityBestEffort.activityId],
      references: [intervalsActivity.id],
    }),
  }),
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
