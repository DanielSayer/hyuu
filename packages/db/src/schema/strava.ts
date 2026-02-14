import { relations } from "drizzle-orm";
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { user } from "./auth";

export const stravaConnection = pgTable("strava_connection", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  stravaAthleteId: text("strava_athlete_id").notNull(),
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

export const stravaConnectionRelations = relations(stravaConnection, ({ one }) => ({
  user: one(user, {
    fields: [stravaConnection.userId],
    references: [user.id],
  }),
}));

