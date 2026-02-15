import { getCurrentSession } from "@/utils/current-session";
import { db } from "@hyuu/db";
import {
  intervalsActivity,
  intervalsActivityInterval,
  intervalsAthleteProfile,
  intervalsSyncLog,
} from "@hyuu/db/schema/intervals";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import z from "zod";
import { INTERVALS_ENDPOINTS } from "../../utils/intervals-endpoints";
import { IntervalsRequestError } from "./intervals-request-error";
import { fetchIntervalsEndpoint } from "./middleware";
import {
  intervalsActivityDetailSchema,
  intervalsActivityEventsPayloadSchema,
  intervalsActivityIntervalsSchema,
} from "./schemas/intervals-activity-schemas";
import { intervalsAthleteSchema } from "./schemas/intervals-athlete-schemas";
import { toDateOnlyString } from "@/utils/formatters";

const app = new Hono();

const INITIAL_LOOKBACK_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

app.get("/connections", async (c) => {
  const session = await getCurrentSession(c.req.raw.headers);

  if (!session) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const profile = await db.query.intervalsAthleteProfile.findFirst({
    where: (table, { eq }) => eq(table.userId, session.user.id),
    orderBy: (table, { desc }) => [desc(table.updatedAt)],
    columns: {
      name: true,
      firstName: true,
      lastName: true,
      createdAt: true,
    },
  });

  if (!profile) {
    return c.json({ connected: false });
  }

  return c.json({
    connected: true,
    connection: {
      athleteName: formatIntervalsAthleteName(profile),
      connectedAt: profile.createdAt.toISOString(),
    },
  });
});

app.post("/connections", async (c) => {
  const session = await getCurrentSession(c.req.raw.headers);

  if (!session) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const athleteId = c.req.query("athleteId") ?? "0";

  try {
    const athletePayload = await fetchIntervalsEndpoint({
      operation: `athlete.${athleteId}`,
      url: INTERVALS_ENDPOINTS.ATHLETE.PROFILE(athleteId),
    });
    const athlete = intervalsAthleteSchema.parse(athletePayload);
    await upsertIntervalsAthleteData({
      userId: session.user.id,
      athlete,
    });

    return c.json({
      ok: true,
      athleteId: athlete.id,
      connected: true,
      connection: {
        athleteName: formatIntervalsAthleteName(athlete),
        connectedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? `Intervals athlete payload validation failed: ${error.message}`
        : error instanceof Error
          ? error.message
          : "Failed to connect Intervals athlete.";
    const statusCode =
      error instanceof IntervalsRequestError
        ? error.statusCode === 401
          ? 401
          : 502
        : error instanceof z.ZodError
          ? 502
          : 500;

    return c.json({ message }, statusCode);
  }
});

app.post("/connections/test", async (c) => {
  const session = await getCurrentSession(c.req.raw.headers);

  if (!session) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const profile = await db.query.intervalsAthleteProfile.findFirst({
    where: (table, { eq }) => eq(table.userId, session.user.id),
    orderBy: (table, { desc }) => [desc(table.updatedAt)],
    columns: {
      intervalsAthleteId: true,
      name: true,
      firstName: true,
      lastName: true,
    },
  });

  if (!profile?.intervalsAthleteId) {
    return c.json({ message: "Intervals is not connected." }, 404);
  }

  try {
    const athletePayload = await fetchIntervalsEndpoint({
      operation: `athlete.${profile.intervalsAthleteId}.test`,
      url: INTERVALS_ENDPOINTS.ATHLETE.PROFILE(profile.intervalsAthleteId),
    });
    const athlete = intervalsAthleteSchema.parse(athletePayload);

    await upsertIntervalsAthleteData({
      userId: session.user.id,
      athlete,
    });

    return c.json({
      ok: true,
      testedAt: new Date().toISOString(),
      athlete: {
        id: athlete.id,
        name: formatIntervalsAthleteName(athlete),
      },
    });
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? `Intervals athlete payload validation failed: ${error.message}`
        : error instanceof Error
          ? error.message
          : "Failed to test Intervals connection.";
    const statusCode =
      error instanceof IntervalsRequestError
        ? error.statusCode === 401
          ? 401
          : 502
        : error instanceof z.ZodError
          ? 502
          : 500;

    return c.json({ message }, statusCode);
  }
});

app.post("/connect", async (c) => {
  const session = await getCurrentSession(c.req.raw.headers);

  if (!session) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const athleteId = c.req.query("athleteId") ?? "0";

  try {
    const athletePayload = await fetchIntervalsEndpoint({
      operation: `athlete.${athleteId}`,
      url: INTERVALS_ENDPOINTS.ATHLETE.PROFILE(athleteId),
    });
    const athlete = intervalsAthleteSchema.parse(athletePayload);
    await upsertIntervalsAthleteData({
      userId: session.user.id,
      athlete,
    });

    return c.json({
      ok: true,
      athleteId: athlete.id,
    });
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? `Intervals athlete payload validation failed: ${error.message}`
        : error instanceof Error
          ? error.message
          : "Failed to connect Intervals athlete.";
    const statusCode =
      error instanceof IntervalsRequestError
        ? error.statusCode === 401
          ? 401
          : 502
        : error instanceof z.ZodError
          ? 502
          : 500;

    return c.json({ message }, statusCode);
  }
});

app.post("/sync", async (c) => {
  const session = await getCurrentSession(c.req.raw.headers);

  if (!session) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const profile = await db.query.intervalsAthleteProfile.findFirst({
    where: (table, { eq }) => eq(table.userId, session.user.id),
    orderBy: (table, { desc }) => [desc(table.updatedAt)],
    columns: {
      intervalsAthleteId: true,
    },
  });

  if (!profile?.intervalsAthleteId) {
    return c.json(
      {
        message:
          "Intervals athlete is not connected. Call /api/intervals/connect first.",
      },
      404,
    );
  }

  const athleteId = profile.intervalsAthleteId;
  const newest = normalizeIntervalsDateParam({
    value: c.req.query("newest"),
    defaultDate: new Date(),
  });
  const oldest = normalizeIntervalsDateParam({
    value: c.req.query("oldest"),
    defaultDate: new Date(Date.now() - INITIAL_LOOKBACK_MS),
  });

  if (!newest || !oldest) {
    return c.json(
      {
        message: 'Invalid "oldest" or "newest" date. Use "yyyy-MM-dd" format.',
      },
      400,
    );
  }

  const [syncRow] = await db
    .insert(intervalsSyncLog)
    .values({
      userId: session.user.id,
      intervalsAthleteId: athleteId,
      status: "started",
      startedAt: new Date(),
    })
    .returning({ id: intervalsSyncLog.id });

  if (!syncRow) {
    return c.json(
      {
        message: "Failed to initialize Intervals sync log.",
      },
      500,
    );
  }

  try {
    const rawEvents = await fetchIntervalsEndpoint({
      operation: `athlete.${athleteId}.events`,
      url: INTERVALS_ENDPOINTS.ATHLETE.ACTIVITIES(athleteId, {
        oldest,
        newest,
      }),
    });

    const parsedEventsPayload =
      intervalsActivityEventsPayloadSchema.parse(rawEvents);
    const events = Array.isArray(parsedEventsPayload)
      ? parsedEventsPayload
      : parsedEventsPayload.events;
    const activityIds = [...new Set(events.map((event) => event.id))];
    const activities: Array<{
      activityId: string;
      detail: z.infer<typeof intervalsActivityDetailSchema>;
      intervals: z.infer<typeof intervalsActivityIntervalsSchema>;
    }> = [];

    for (const activityId of activityIds) {
      const rawDetail = await fetchIntervalsEndpoint({
        operation: `activity.${activityId}.detail`,
        url: INTERVALS_ENDPOINTS.ACTIVITY.DETAIL(activityId, {
          intervals: true,
        }),
      });
      const rawIntervals = await fetchIntervalsEndpoint({
        operation: `activity.${activityId}.intervals`,
        url: INTERVALS_ENDPOINTS.ACTIVITY.INTERVALS(activityId),
      });
      const detail = intervalsActivityDetailSchema.parse(rawDetail);
      const intervals = intervalsActivityIntervalsSchema.parse(rawIntervals);

      activities.push({
        activityId,
        detail,
        intervals,
      });
    }

    const savedActivityCount = await upsertIntervalsActivities({
      userId: session.user.id,
      athleteId,
      activities,
    });

    await db
      .update(intervalsSyncLog)
      .set({
        status: "success",
        intervalsAthleteId: athleteId,
        completedAt: new Date(),
        fetchedActivityCount: activityIds.length,
      })
      .where(eq(intervalsSyncLog.id, syncRow.id));

    const responseBody = {
      ok: true,
      athleteId,
      oldest,
      newest,
      eventCount: activityIds.length,
      savedActivityCount,
    };
    return c.json(responseBody);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to sync Intervals data.";

    await db
      .update(intervalsSyncLog)
      .set({
        status: "failed",
        completedAt: new Date(),
        errorMessage: message,
      })
      .where(eq(intervalsSyncLog.id, syncRow.id));

    const statusCode =
      error instanceof IntervalsRequestError
        ? error.statusCode === 401
          ? 401
          : 502
        : 500;
    c.status(statusCode);
    return c.json({ message });
  }
});

async function upsertIntervalsAthleteData({
  userId,
  athlete,
}: {
  userId: string;
  athlete: z.infer<typeof intervalsAthleteSchema>;
}) {
  const now = new Date();

  return db.transaction(async (tx) => {
    const existingProfile = await tx.query.intervalsAthleteProfile.findFirst({
      where: (table, { and, eq }) =>
        and(eq(table.userId, userId), eq(table.intervalsAthleteId, athlete.id)),
      columns: { id: true },
    });

    const profileValues = {
      userId,
      intervalsAthleteId: athlete.id,
      name: athlete.name ?? null,
      firstName: athlete.firstname ?? null,
      lastName: athlete.lastname ?? null,
      email: athlete.email ?? null,
      sex: athlete.sex ?? null,
      city: athlete.city ?? null,
      state: athlete.state ?? null,
      country: athlete.country ?? null,
      timezone: athlete.timezone ?? null,
      locale: athlete.locale ?? null,
      measurementPreference: athlete.measurement_preference ?? null,
      status: athlete.status ?? null,
      visibility: athlete.visibility ?? null,
      weightKg: toIntOrNull(athlete.weight),
      icuWeightKg: toIntOrNull(athlete.icu_weight),
      icuLastSeenAt: toDateOrNull(athlete.icu_last_seen),
      icuActivatedAt: toDateOrNull(athlete.icu_activated),
      stravaId:
        typeof athlete.strava_id === "number"
          ? String(athlete.strava_id)
          : null,
      stravaAuthorized: athlete.strava_authorized ?? null,
      rawData: athlete,
      updatedAt: now,
    };

    let profileId: number;
    if (!existingProfile) {
      const [created] = await tx
        .insert(intervalsAthleteProfile)
        .values({
          ...profileValues,
          createdAt: now,
        })
        .returning({ id: intervalsAthleteProfile.id });
      if (!created) {
        throw new Error("Failed to insert Intervals athlete profile.");
      }
      profileId = created.id;
    } else {
      const [updated] = await tx
        .update(intervalsAthleteProfile)
        .set(profileValues)
        .where(eq(intervalsAthleteProfile.id, existingProfile.id))
        .returning({ id: intervalsAthleteProfile.id });
      if (!updated) {
        throw new Error("Failed to update Intervals athlete profile.");
      }
      profileId = updated.id;
    }

    return {
      profileId,
    };
  });
}

function toDateOrNull(value: string | null | undefined) {
  if (typeof value !== "string" || value.length === 0) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toIntOrNull(value: number | null | undefined) {
  return typeof value === "number" ? Math.trunc(value) : null;
}

function toNumberOrNull(value: number | null | undefined) {
  return typeof value === "number" ? value : null;
}

function toIntArrayOrNull(value: number[] | null | undefined) {
  if (!Array.isArray(value)) {
    return null;
  }
  return value.map((entry) => Math.trunc(entry));
}

function normalizeIntervalsDateParam({
  value,
  defaultDate,
}: {
  value: string | undefined;
  defaultDate: Date;
}) {
  if (!value) {
    return toDateOnlyString(defaultDate);
  }

  const dateOnly = /^\d{4}-\d{2}-\d{2}$/;
  if (dateOnly.test(value)) {
    return value;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return toDateOnlyString(parsed);
}

function formatIntervalsAthleteName({
  name,
  firstName,
  lastName,
  firstname,
  lastname,
}: {
  name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  firstname?: string | null;
  lastname?: string | null;
}) {
  if (name && name.trim().length > 0) {
    return name.trim();
  }

  const assembled =
    [firstName ?? firstname, lastName ?? lastname].filter(Boolean).join(" ") ??
    "";
  return assembled.trim() || "Intervals athlete";
}

async function upsertIntervalsActivities({
  userId,
  athleteId,
  activities,
}: {
  userId: string;
  athleteId: string;
  activities: Array<{
    activityId: string;
    detail: z.infer<typeof intervalsActivityDetailSchema>;
    intervals: z.infer<typeof intervalsActivityIntervalsSchema>;
  }>;
}) {
  return db.transaction(async (tx) => {
    let savedCount = 0;

    for (const activity of activities) {
      const now = new Date();
      const existing = await tx.query.intervalsActivity.findFirst({
        where: (table, { and, eq }) =>
          and(
            eq(table.userId, userId),
            eq(table.intervalsActivityId, activity.activityId),
          ),
        columns: { id: true },
      });

      const activityValues = {
        userId,
        intervalsAthleteId: athleteId,
        intervalsActivityId: activity.activityId,
        type: activity.detail.type ?? null,
        name: activity.detail.name ?? null,
        source: activity.detail.source ?? null,
        externalId: activity.detail.external_id ?? null,
        startDate: toDateOrNull(activity.detail.start_date),
        startDateLocal: toDateOrNull(activity.detail.start_date_local),
        analyzedAt: toDateOrNull(activity.detail.analyzed),
        syncedAt: toDateOrNull(activity.detail.icu_sync_date),
        distance: toNumberOrNull(activity.detail.distance),
        movingTime: toIntOrNull(activity.detail.moving_time),
        elapsedTime: toIntOrNull(activity.detail.elapsed_time),
        totalElevationGain: toNumberOrNull(
          activity.detail.total_elevation_gain,
        ),
        totalElevationLoss: toNumberOrNull(
          activity.detail.total_elevation_loss,
        ),
        averageSpeed: toNumberOrNull(activity.detail.average_speed),
        maxSpeed: toNumberOrNull(activity.detail.max_speed),
        averageHeartrate: toNumberOrNull(activity.detail.average_heartrate),
        maxHeartrate: toNumberOrNull(activity.detail.max_heartrate),
        averageCadence: toNumberOrNull(activity.detail.average_cadence),
        averageStride: toNumberOrNull(activity.detail.average_stride),
        calories: toNumberOrNull(activity.detail.calories),
        trainingLoad: toIntOrNull(activity.detail.icu_training_load),
        hrLoad: toIntOrNull(activity.detail.hr_load),
        intensity: toNumberOrNull(activity.detail.icu_intensity),
        lthr: toIntOrNull(activity.detail.lthr),
        athleteMaxHr: toIntOrNull(activity.detail.athlete_max_hr),
        heartRateZonesBpm: toIntArrayOrNull(activity.detail.icu_hr_zones),
        heartRateZoneDurationsSeconds: toIntArrayOrNull(
          activity.detail.icu_hr_zone_times,
        ),
        intervalSummary: activity.detail.interval_summary ?? null,
        rawData: activity.detail,
        updatedAt: now,
      };

      let activityRowId: number;
      if (!existing) {
        const [created] = await tx
          .insert(intervalsActivity)
          .values({
            ...activityValues,
            createdAt: now,
          })
          .returning({ id: intervalsActivity.id });
        if (!created) {
          throw new Error("Failed to insert Intervals activity.");
        }
        activityRowId = created.id;
      } else {
        const [updated] = await tx
          .update(intervalsActivity)
          .set(activityValues)
          .where(eq(intervalsActivity.id, existing.id))
          .returning({ id: intervalsActivity.id });
        if (!updated) {
          throw new Error("Failed to update Intervals activity.");
        }
        activityRowId = updated.id;
      }

      await tx
        .delete(intervalsActivityInterval)
        .where(eq(intervalsActivityInterval.activityId, activityRowId));
      if (activity.intervals.icu_intervals.length > 0) {
        await tx.insert(intervalsActivityInterval).values(
          activity.intervals.icu_intervals.map((interval) => ({
            activityId: activityRowId,
            intervalId: String(interval.id),
            intervalType: interval.type ?? null,
            groupId: interval.group_id ?? null,
            zone: toIntOrNull(interval.zone),
            intensity: toNumberOrNull(interval.intensity),
            distance: toNumberOrNull(interval.distance),
            movingTime: toIntOrNull(interval.moving_time),
            elapsedTime: toIntOrNull(interval.elapsed_time),
            startTime: toIntOrNull(interval.start_time),
            endTime: toIntOrNull(interval.end_time),
            averageSpeed: toNumberOrNull(interval.average_speed),
            maxSpeed: toNumberOrNull(interval.max_speed),
            averageHeartrate: toNumberOrNull(interval.average_heartrate),
            maxHeartrate: toNumberOrNull(interval.max_heartrate),
            averageCadence: toNumberOrNull(interval.average_cadence),
            averageStride: toNumberOrNull(interval.average_stride),
            totalElevationGain: toNumberOrNull(interval.total_elevation_gain),
            rawData: interval,
            updatedAt: now,
          })),
        );
      }

      savedCount += 1;
    }

    return savedCount;
  });
}

export default app;
