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

export const stravaConnection = pgTable("strava_connection", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  stravaAthleteId: text("strava_athlete_id").notNull(),
  athleteName: text("athlete_name"),
  authCode: text("auth_code").notNull(),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token").notNull(),
  tokenExpiresAt: timestamp("token_expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const stravaActivity = pgTable(
  "strava_activity",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    stravaId: text("strava_id").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    sportType: text("sport_type").notNull(),
    startDate: timestamp("start_date").notNull(),
    startDateLocal: timestamp("start_date_local").notNull(),
    timezone: text("timezone"),
    utcOffset: integer("utc_offset"),
    distance: doublePrecision("distance"),
    movingTime: integer("moving_time"),
    elapsedTime: integer("elapsed_time"),
    totalElevationGain: doublePrecision("total_elevation_gain"),
    averageSpeed: doublePrecision("average_speed"),
    maxSpeed: doublePrecision("max_speed"),
    averageHeartrate: doublePrecision("average_heartrate"),
    maxHeartrate: doublePrecision("max_heartrate"),
    averageCadence: doublePrecision("average_cadence"),
    averageWatts: doublePrecision("average_watts"),
    weightedAverageWatts: integer("weighted_average_watts"),
    kilojoules: doublePrecision("kilojoules"),
    calories: doublePrecision("calories"),
    trainer: boolean("trainer"),
    commute: boolean("commute"),
    manual: boolean("manual"),
    private: boolean("private"),
    flagged: boolean("flagged"),
    achievementCount: integer("achievement_count"),
    kudosCount: integer("kudos_count"),
    commentCount: integer("comment_count"),
    athleteCount: integer("athlete_count"),
    photoCount: integer("photo_count"),
    prCount: integer("pr_count"),
    totalPhotoCount: integer("total_photo_count"),
    hasKudoed: boolean("has_kudoed"),
    mapPolyline: text("map_polyline"),
    mapResourceState: integer("map_resource_state"),
    startLatitude: doublePrecision("start_latitude"),
    startLongitude: doublePrecision("start_longitude"),
    endLatitude: doublePrecision("end_latitude"),
    endLongitude: doublePrecision("end_longitude"),
    stravaCreatedAt: timestamp("strava_created_at").notNull(),
    stravaUpdatedAt: timestamp("strava_updated_at").notNull(),
    rawData: jsonb("raw_data").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("strava_activity_user_strava_unique").on(
      table.userId,
      table.stravaId,
    ),
    index("strava_activity_user_idx").on(table.userId),
    index("strava_activity_user_updated_idx").on(
      table.userId,
      table.stravaUpdatedAt,
    ),
  ],
);

export const stravaActivityLap = pgTable(
  "strava_activity_lap",
  {
    id: serial("id").primaryKey(),
    activityId: integer("activity_id")
      .notNull()
      .references(() => stravaActivity.id, { onDelete: "cascade" }),
    lapIndex: integer("lap_index").notNull(),
    stravaLapId: text("strava_lap_id").notNull(),
    name: text("name"),
    distance: doublePrecision("distance"),
    elapsedTime: integer("elapsed_time"),
    movingTime: integer("moving_time"),
    startDate: timestamp("start_date"),
    startDateLocal: timestamp("start_date_local"),
    totalElevationGain: doublePrecision("total_elevation_gain"),
    averageSpeed: doublePrecision("average_speed"),
    maxSpeed: doublePrecision("max_speed"),
    averageHeartrate: doublePrecision("average_heartrate"),
    maxHeartrate: doublePrecision("max_heartrate"),
    averageCadence: doublePrecision("average_cadence"),
    averageWatts: doublePrecision("average_watts"),
    split: integer("split"),
    rawData: jsonb("raw_data").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("strava_activity_lap_unique_idx").on(
      table.activityId,
      table.lapIndex,
    ),
    index("strava_activity_lap_activity_idx").on(table.activityId),
  ],
);

export const stravaActivityZone = pgTable(
  "strava_activity_zone",
  {
    activityId: integer("activity_id")
      .notNull()
      .references(() => stravaActivity.id, { onDelete: "cascade" }),
    zoneType: text("zone_type").notNull(),
    sensorBased: boolean("sensor_based"),
    points: integer("points"),
    distributionBuckets: jsonb("distribution_buckets").notNull(),
    rawData: jsonb("raw_data").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    primaryKey({
      name: "strava_activity_zone_pk",
      columns: [table.activityId, table.zoneType],
    }),
    index("strava_activity_zone_activity_idx").on(table.activityId),
  ],
);

export const stravaSyncLog = pgTable(
  "strava_sync_log",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    status: text("status").notNull(),
    startedAt: timestamp("started_at").defaultNow().notNull(),
    completedAt: timestamp("completed_at"),
    afterTimestamp: timestamp("after_timestamp"),
    fetchedCount: integer("fetched_count").default(0).notNull(),
    createdCount: integer("created_count").default(0).notNull(),
    updatedCount: integer("updated_count").default(0).notNull(),
    errorMessage: text("error_message"),
  },
  (table) => [
    index("strava_sync_log_user_idx").on(table.userId, table.startedAt),
    index("strava_sync_log_user_status_idx").on(table.userId, table.status),
  ],
);

export const stravaConnectionRelations = relations(
  stravaConnection,
  ({ one }) => ({
    user: one(user, {
      fields: [stravaConnection.userId],
      references: [user.id],
    }),
  }),
);

export const stravaActivityRelations = relations(
  stravaActivity,
  ({ one, many }) => ({
    user: one(user, {
      fields: [stravaActivity.userId],
      references: [user.id],
    }),
    laps: many(stravaActivityLap),
    zones: many(stravaActivityZone),
  }),
);

export const stravaActivityLapRelations = relations(
  stravaActivityLap,
  ({ one }) => ({
    activity: one(stravaActivity, {
      fields: [stravaActivityLap.activityId],
      references: [stravaActivity.id],
    }),
  }),
);

export const stravaActivityZoneRelations = relations(
  stravaActivityZone,
  ({ one }) => ({
    activity: one(stravaActivity, {
      fields: [stravaActivityZone.activityId],
      references: [stravaActivity.id],
    }),
  }),
);

export const stravaSyncLogRelations = relations(stravaSyncLog, ({ one }) => ({
  user: one(user, {
    fields: [stravaSyncLog.userId],
    references: [user.id],
  }),
}));
