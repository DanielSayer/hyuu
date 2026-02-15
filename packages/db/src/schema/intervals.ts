import { relations } from "drizzle-orm";
import {
  boolean,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
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

export const intervalsAthleteSportSetting = pgTable(
  "intervals_athlete_sport_setting",
  {
    id: serial("id").primaryKey(),
    profileId: integer("profile_id")
      .notNull()
      .references(() => intervalsAthleteProfile.id, { onDelete: "cascade" }),
    settingId: integer("setting_id").notNull(),
    types: jsonb("types").notNull(),
    ftp: integer("ftp"),
    lthr: integer("lthr"),
    maxHr: integer("max_hr"),
    powerZones: jsonb("power_zones"),
    hrZones: jsonb("hr_zones"),
    paceUnits: text("pace_units"),
    paceLoadType: text("pace_load_type"),
    other: boolean("other"),
    createdOnIntervalsAt: timestamp("created_on_intervals_at"),
    updatedOnIntervalsAt: timestamp("updated_on_intervals_at"),
    rawData: jsonb("raw_data").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("intervals_athlete_sport_setting_profile_setting_unique").on(
      table.profileId,
      table.settingId,
    ),
    index("intervals_athlete_sport_setting_profile_idx").on(table.profileId),
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
    fetchedActivityCount: integer("fetched_activity_count").default(0).notNull(),
    parsedSportSettingsCount: integer("parsed_sport_settings_count")
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
    trainingLoad: integer("training_load"),
    hrLoad: integer("hr_load"),
    intensity: doublePrecision("intensity"),
    lthr: integer("lthr"),
    athleteMaxHr: integer("athlete_max_hr"),
    intervalSummary: jsonb("interval_summary"),
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
    index("intervals_activity_athlete_start_idx").on(
      table.intervalsAthleteId,
      table.startDate,
    ),
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

export const intervalsActivityHrHistogram = pgTable(
  "intervals_activity_hr_histogram",
  {
    activityId: integer("activity_id")
      .notNull()
      .references(() => intervalsActivity.id, { onDelete: "cascade" }),
    bucketMin: integer("bucket_min").notNull(),
    bucketMax: integer("bucket_max").notNull(),
    seconds: integer("seconds").notNull(),
    rawData: jsonb("raw_data").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    primaryKey({
      name: "intervals_activity_hr_histogram_pk",
      columns: [table.activityId, table.bucketMin, table.bucketMax],
    }),
    index("intervals_activity_hr_histogram_activity_idx").on(table.activityId),
  ],
);

export const intervalsAthleteProfileRelations = relations(
  intervalsAthleteProfile,
  ({ one, many }) => ({
    user: one(user, {
      fields: [intervalsAthleteProfile.userId],
      references: [user.id],
    }),
    sportSettings: many(intervalsAthleteSportSetting),
  }),
);

export const intervalsAthleteSportSettingRelations = relations(
  intervalsAthleteSportSetting,
  ({ one }) => ({
    profile: one(intervalsAthleteProfile, {
      fields: [intervalsAthleteSportSetting.profileId],
      references: [intervalsAthleteProfile.id],
    }),
  }),
);

export const intervalsSyncLogRelations = relations(intervalsSyncLog, ({ one }) => ({
  user: one(user, {
    fields: [intervalsSyncLog.userId],
    references: [user.id],
  }),
}));

export const intervalsActivityRelations = relations(
  intervalsActivity,
  ({ one, many }) => ({
    user: one(user, {
      fields: [intervalsActivity.userId],
      references: [user.id],
    }),
    intervals: many(intervalsActivityInterval),
    hrHistogram: many(intervalsActivityHrHistogram),
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

export const intervalsActivityHrHistogramRelations = relations(
  intervalsActivityHrHistogram,
  ({ one }) => ({
    activity: one(intervalsActivity, {
      fields: [intervalsActivityHrHistogram.activityId],
      references: [intervalsActivity.id],
    }),
  }),
);
