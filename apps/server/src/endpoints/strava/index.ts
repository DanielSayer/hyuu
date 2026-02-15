import { getCurrentSession } from "@/utils/current-session";
import { formatStravaName } from "@/utils/formatters";
import { STRAVA_ENDPOINTS } from "@/utils/strava-endpoints";
import { db } from "@hyuu/db";
import {
  stravaActivity,
  stravaActivityLap,
  stravaActivityZone,
  stravaConnection,
  stravaSyncLog,
} from "@hyuu/db/schema/strava";
import { env } from "@hyuu/env/server";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import z from "zod";
import {
  stravaActivitySummaryListSchema,
  stravaActivityZonesSchema,
  stravaDetailedActivitySchema,
} from "./schemas/strava-activity-schemas";
import {
  stravaAthleteSchema,
  stravaTokenResponseSchema,
} from "./schemas/strava-oauth-schemas";

const app = new Hono();
const SYNC_COOLDOWN_MS = 5 * 60 * 1000; // 5 mins
const LOOKBACK_BUFFER_MS = 24 * 60 * 60 * 1000; // 24 hours
const INITIAL_LOOKBACK_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

app.get("/authorize", async (c) => {
  const session = await getCurrentSession(c.req.raw.headers);

  if (!session) {
    return c.redirect(`${env.CORS_ORIGIN}/login`);
  }

  const redirectUri = `${env.BETTER_AUTH_URL}/api/strava/callback`;

  const params = new URLSearchParams({
    client_id: env.STRAVA_CLIENT_ID,
    response_type: "code",
    redirect_uri: redirectUri,
    scope: "activity:read_all",
    approval_prompt: "auto",
  });

  return c.redirect(`${STRAVA_ENDPOINTS.OAUTH.AUTHORIZE}?${params.toString()}`);
});

app.get("/callback", async (c) => {
  const url = new URL(c.req.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error || !code) {
    return c.text("Strava authorization failed.", 400);
  }

  const session = await getCurrentSession(c.req.raw.headers);

  if (!session) {
    return c.redirect(`${env.CORS_ORIGIN}/login`);
  }

  const tokenRes = await fetch(STRAVA_ENDPOINTS.OAUTH.TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: env.STRAVA_CLIENT_ID,
      client_secret: env.STRAVA_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    const payload = await parseStravaErrorPayload(
      tokenRes,
      "oauth.token.exchange",
    );
    console.error("Strava token exchange failed", payload);
    return c.text("Failed to connect Strava.", 500);
  }

  const data = await parseStravaResponse(
    tokenRes,
    stravaTokenResponseSchema,
    "oauth.token.exchange",
  );

  const userId = session.user.id;
  const stravaAthleteId = String(data.athlete?.id ?? "");
  const accessToken = data.access_token;
  const refreshToken = data.refresh_token;
  const tokenExpiresAt = new Date(data.expires_at * 1000);
  const athleteName = formatStravaName(
    data.athlete?.firstname,
    data.athlete?.lastname,
  );

  await db
    .insert(stravaConnection)
    .values({
      userId,
      stravaAthleteId,
      athleteName,
      authCode: code,
      accessToken,
      refreshToken,
      tokenExpiresAt,
    })
    .onConflictDoUpdate({
      target: stravaConnection.userId,
      set: {
        stravaAthleteId,
        athleteName,
        authCode: code,
        accessToken,
        refreshToken,
        tokenExpiresAt,
        updatedAt: new Date(),
      },
    });

  return c.redirect(`${env.CORS_ORIGIN}/settings/connections`);
});

app.get("/connection", async (c) => {
  const session = await getCurrentSession(c.req.raw.headers);

  if (!session) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const connection = await db.query.stravaConnection.findFirst({
    where: (table, { eq }) => eq(table.userId, session.user.id),
    columns: {
      athleteName: true,
      createdAt: true,
    },
  });

  if (!connection) {
    return c.json({ connected: false });
  }

  return c.json({
    connected: true,
    connection: {
      athleteName: connection.athleteName,
      connectedAt: connection.createdAt.toISOString(),
    },
  });
});

app.post("/test", async (c) => {
  const session = await getCurrentSession(c.req.raw.headers);

  if (!session) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const connection = await db.query.stravaConnection.findFirst({
    where: (table, { eq }) => eq(table.userId, session.user.id),
    columns: {
      userId: true,
      accessToken: true,
      refreshToken: true,
      tokenExpiresAt: true,
    },
  });

  if (!connection) {
    return c.json({ message: "Strava is not connected." }, 404);
  }

  let accessToken = connection.accessToken;
  let tokenExpiresAt = connection.tokenExpiresAt;

  if (tokenExpiresAt.getTime() <= Date.now() + 60_000) {
    const refreshed = await refreshStravaToken({
      userId: connection.userId,
      refreshToken: connection.refreshToken,
    });
    accessToken = refreshed.accessToken;
    tokenExpiresAt = refreshed.tokenExpiresAt;
  }

  const athleteRes = await fetch(STRAVA_ENDPOINTS.ATHLETE, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!athleteRes.ok) {
    const text = await parseStravaErrorPayload(athleteRes, "athlete.profile");
    return c.json(
      {
        ok: false,
        message: `Strava test failed: ${athleteRes.status} ${text}`,
      },
      502,
    );
  }

  const athlete = await parseStravaResponse(
    athleteRes,
    stravaAthleteSchema,
    "athlete.profile",
  );

  return c.json({
    ok: true,
    testedAt: new Date().toISOString(),
    tokenExpiresAt: tokenExpiresAt.toISOString(),
    athlete: {
      id: athlete.id,
      username: athlete.username ?? null,
      name: formatStravaName(athlete.firstname, athlete.lastname),
    },
  });
});

app.post("/disconnect", async (c) => {
  const session = await getCurrentSession(c.req.raw.headers);

  if (!session) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  await db
    .delete(stravaConnection)
    .where(eq(stravaConnection.userId, session.user.id));

  return c.json({ disconnected: true });
});

app.get("/sync/status", async (c) => {
  const session = await getCurrentSession(c.req.raw.headers);

  if (!session) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const connection = await db.query.stravaConnection.findFirst({
    where: (table, { eq }) => eq(table.userId, session.user.id),
    columns: {
      userId: true,
    },
  });

  if (!connection) {
    return c.json({
      connected: false,
      canSync: false,
      cooldownRemainingSeconds: 0,
      cooldownEndsAt: null,
      lastSuccessfulSyncAt: null,
    });
  }

  const lastSuccessfulSync = await db.query.stravaSyncLog.findFirst({
    where: (table, { and, eq }) =>
      and(eq(table.userId, session.user.id), eq(table.status, "success")),
    orderBy: (table, { desc }) => [desc(table.completedAt), desc(table.id)],
    columns: {
      completedAt: true,
    },
  });

  const cooldown = getCooldownState(lastSuccessfulSync?.completedAt ?? null);

  return c.json({
    connected: true,
    canSync: cooldown.remainingSeconds === 0,
    cooldownRemainingSeconds: cooldown.remainingSeconds,
    cooldownEndsAt: cooldown.cooldownEndsAt?.toISOString() ?? null,
    lastSuccessfulSyncAt:
      lastSuccessfulSync?.completedAt?.toISOString() ?? null,
  });
});

app.post("/sync", async (c) => {
  const session = await getCurrentSession(c.req.raw.headers);

  if (!session) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const connection = await db.query.stravaConnection.findFirst({
    where: (table, { eq }) => eq(table.userId, session.user.id),
    columns: {
      userId: true,
      accessToken: true,
      refreshToken: true,
      tokenExpiresAt: true,
    },
  });

  if (!connection) {
    return c.json({ message: "Strava is not connected." }, 404);
  }

  const lastSuccessfulSync = await db.query.stravaSyncLog.findFirst({
    where: (table, { and, eq }) =>
      and(eq(table.userId, session.user.id), eq(table.status, "success")),
    orderBy: (table, { desc }) => [desc(table.completedAt), desc(table.id)],
    columns: {
      completedAt: true,
    },
  });

  const cooldown = getCooldownState(lastSuccessfulSync?.completedAt ?? null);
  if (cooldown.remainingSeconds > 0) {
    return c.json(
      {
        message: "Sync is on cooldown. Please try again shortly.",
        cooldownRemainingSeconds: cooldown.remainingSeconds,
        cooldownEndsAt: cooldown.cooldownEndsAt?.toISOString() ?? null,
      },
      429,
    );
  }

  let accessToken = connection.accessToken;
  let tokenExpiresAt = connection.tokenExpiresAt;

  if (tokenExpiresAt.getTime() <= Date.now() + 60_000) {
    const refreshed = await refreshStravaToken({
      userId: connection.userId,
      refreshToken: connection.refreshToken,
    });
    accessToken = refreshed.accessToken;
    tokenExpiresAt = refreshed.tokenExpiresAt;
  }

  const afterTimestamp = lastSuccessfulSync?.completedAt
    ? new Date(lastSuccessfulSync.completedAt.getTime() - LOOKBACK_BUFFER_MS)
    : new Date(Date.now() - INITIAL_LOOKBACK_MS);

  const [syncRow] = await db
    .insert(stravaSyncLog)
    .values({
      userId: session.user.id,
      status: "started",
      startedAt: new Date(),
      afterTimestamp,
    })
    .returning({ id: stravaSyncLog.id });

  if (!syncRow) {
    return c.json({ message: "Failed to initialize sync log." }, 500);
  }

  const syncId = syncRow.id;
  let fetchedCount = 0;
  let createdCount = 0;
  let updatedCount = 0;

  try {
    const syncedActivities = await fetchAllActivityData({
      accessToken,
      afterTimestamp,
    });

    fetchedCount = syncedActivities.length;

    for (const activityData of syncedActivities) {
      const writeResult = await upsertActivity(session.user.id, activityData);
      if (writeResult === "created") {
        createdCount += 1;
      }
      if (writeResult === "updated") {
        updatedCount += 1;
      }
    }

    const completedAt = new Date();

    await db
      .update(stravaSyncLog)
      .set({
        status: "success",
        completedAt,
        fetchedCount,
        createdCount,
        updatedCount,
      })
      .where(eq(stravaSyncLog.id, syncId));

    const successCooldown = getCooldownState(completedAt);

    return c.json({
      ok: true,
      fetchedCount,
      createdCount,
      updatedCount,
      tokenExpiresAt: tokenExpiresAt.toISOString(),
      afterTimestamp: afterTimestamp.toISOString(),
      completedAt: completedAt.toISOString(),
      cooldownRemainingSeconds: successCooldown.remainingSeconds,
      cooldownEndsAt: successCooldown.cooldownEndsAt?.toISOString() ?? null,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to sync activities.";

    await db
      .update(stravaSyncLog)
      .set({
        status: "failed",
        completedAt: new Date(),
        fetchedCount,
        createdCount,
        updatedCount,
        errorMessage: message,
      })
      .where(eq(stravaSyncLog.id, syncId));

    const statusCode =
      error instanceof StravaRequestError ? error.statusCode : 500;

    c.status(statusCode === 429 ? 429 : statusCode === 502 ? 502 : 500);
    return c.json({
      message,
      fetchedCount,
      createdCount,
      updatedCount,
    });
  }
});

async function refreshStravaToken(connection: {
  userId: string;
  refreshToken: string;
}) {
  const tokenRes = await fetch(STRAVA_ENDPOINTS.OAUTH.TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: env.STRAVA_CLIENT_ID,
      client_secret: env.STRAVA_CLIENT_SECRET,
      refresh_token: connection.refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!tokenRes.ok) {
    const text = await parseStravaErrorPayload(tokenRes, "oauth.token.refresh");
    throw new Error(`Failed to refresh Strava token: ${text}`);
  }

  const parsed = await parseStravaResponse(
    tokenRes,
    stravaTokenResponseSchema,
    "oauth.token.refresh",
  );
  const tokenExpiresAt = new Date(parsed.expires_at * 1000);

  await db
    .update(stravaConnection)
    .set({
      accessToken: parsed.access_token,
      refreshToken: parsed.refresh_token,
      tokenExpiresAt,
      ...(parsed.athlete ? { stravaAthleteId: String(parsed.athlete.id) } : {}),
      updatedAt: new Date(),
    })
    .where(eq(stravaConnection.userId, connection.userId));

  return {
    accessToken: parsed.access_token,
    tokenExpiresAt,
  };
}

function getCooldownState(lastSuccessfulSyncAt: Date | null) {
  if (!lastSuccessfulSyncAt) {
    return {
      remainingSeconds: 0,
      cooldownEndsAt: null as Date | null,
    };
  }

  const cooldownEndsAt = new Date(
    lastSuccessfulSyncAt.getTime() + SYNC_COOLDOWN_MS,
  );
  const remainingMs = cooldownEndsAt.getTime() - Date.now();
  const remainingSeconds = remainingMs > 0 ? Math.ceil(remainingMs / 1000) : 0;

  return {
    remainingSeconds,
    cooldownEndsAt,
  };
}

type SyncedActivityData = {
  summary: z.infer<typeof stravaActivitySummaryListSchema>[number];
  activity: z.infer<typeof stravaDetailedActivitySchema>;
  zones: z.infer<typeof stravaActivityZonesSchema>;
};

async function fetchAllActivityData({
  accessToken,
  afterTimestamp,
}: {
  accessToken: string;
  afterTimestamp: Date;
}): Promise<SyncedActivityData[]> {
  const after = Math.floor(afterTimestamp.getTime() / 1000);
  const perPage = 200;
  const allActivities: SyncedActivityData[] = [];

  for (let page = 1; ; page += 1) {
    const params = new URLSearchParams({
      after: String(after),
      page: String(page),
      per_page: String(perPage),
    });

    const listRes = await fetch(
      `${STRAVA_ENDPOINTS.ACTIVITIES.LIST}?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    if (!listRes.ok) {
      throw await createStravaRequestError(
        listRes,
        `activities.list.page.${page}`,
      );
    }

    const summaries = await parseStravaResponse(
      listRes,
      stravaActivitySummaryListSchema,
      `activities.list.page.${page}`,
    );

    if (summaries.length === 0) {
      break;
    }

    for (const summary of summaries) {
      const activity = await fetchActivityDetail(accessToken, summary.id);
      const zones = await fetchActivityZones(accessToken, summary.id);
      allActivities.push({ summary, activity, zones });
    }

    if (summaries.length < perPage) {
      break;
    }
  }

  return allActivities;
}

async function fetchActivityDetail(accessToken: string, activityId: number) {
  const params = new URLSearchParams({
    include_all_efforts: "false",
  });
  const detailRes = await fetch(
    `${STRAVA_ENDPOINTS.ACTIVITIES.DETAIL(activityId)}?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!detailRes.ok) {
    throw await createStravaRequestError(
      detailRes,
      `activities.detail.${activityId}`,
    );
  }

  return parseStravaResponse(
    detailRes,
    stravaDetailedActivitySchema,
    `activities.detail.${activityId}`,
  );
}

async function fetchActivityZones(accessToken: string, activityId: number) {
  const zonesRes = await fetch(STRAVA_ENDPOINTS.ACTIVITIES.ZONES(activityId), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (zonesRes.status === 404) {
    await parseStravaErrorPayload(zonesRes, `activities.zones.${activityId}`);
    return [];
  }

  if (!zonesRes.ok) {
    throw await createStravaRequestError(
      zonesRes,
      `activities.zones.${activityId}`,
    );
  }

  return parseStravaResponse(
    zonesRes,
    stravaActivityZonesSchema,
    `activities.zones.${activityId}`,
  );
}

async function upsertActivity(userId: string, synced: SyncedActivityData) {
  const activity = synced.activity;
  const activityUpdatedAt = new Date(
    activity.updated_at ?? synced.summary.updated_at ?? activity.start_date,
  );
  const activityCreatedAt = new Date(activity.created_at ?? activity.start_date);

  const existingActivity = await db.query.stravaActivity.findFirst({
    where: (table, { and, eq }) =>
      and(eq(table.userId, userId), eq(table.stravaId, String(activity.id))),
    columns: {
      id: true,
      stravaUpdatedAt: true,
    },
  });

  if (
    existingActivity &&
    existingActivity.stravaUpdatedAt.getTime() >= activityUpdatedAt.getTime()
  ) {
    return "unchanged" as const;
  }

  await db.transaction(async (tx) => {
    const activityValues = {
      userId,
      stravaId: String(activity.id),
      name: activity.name ?? "Untitled activity",
      description: activity.description ?? null,
      sportType: activity.sport_type,
      startDate: new Date(activity.start_date),
      startDateLocal: new Date(activity.start_date_local),
      timezone: activity.timezone ?? null,
      utcOffset: toIntOrNull(activity.utc_offset),
      distance: toNumberOrNull(activity.distance),
      movingTime: toIntOrNull(activity.moving_time),
      elapsedTime: toIntOrNull(activity.elapsed_time),
      totalElevationGain: toNumberOrNull(activity.total_elevation_gain),
      averageSpeed: toNumberOrNull(activity.average_speed),
      maxSpeed: toNumberOrNull(activity.max_speed),
      averageHeartrate: toNumberOrNull(activity.average_heartrate),
      maxHeartrate: toNumberOrNull(activity.max_heartrate),
      averageCadence: toNumberOrNull(activity.average_cadence),
      averageWatts: toNumberOrNull(activity.average_watts),
      weightedAverageWatts: toIntOrNull(activity.weighted_average_watts),
      kilojoules: toNumberOrNull(activity.kilojoules),
      calories: toNumberOrNull(activity.calories),
      trainer: activity.trainer ?? null,
      commute: activity.commute ?? null,
      manual: activity.manual ?? null,
      private: activity.private ?? null,
      flagged: activity.flagged ?? null,
      achievementCount: toIntOrNull(activity.achievement_count),
      kudosCount: toIntOrNull(activity.kudos_count),
      commentCount: toIntOrNull(activity.comment_count),
      athleteCount: toIntOrNull(activity.athlete_count),
      photoCount: toIntOrNull(activity.photo_count),
      prCount: toIntOrNull(activity.pr_count),
      totalPhotoCount: toIntOrNull(activity.total_photo_count),
      hasKudoed: activity.has_kudoed ?? null,
      mapPolyline: activity.map?.summary_polyline ?? null,
      mapResourceState: toIntOrNull(activity.map?.resource_state),
      startLatitude: activity.start_latlng?.[0] ?? null,
      startLongitude: activity.start_latlng?.[1] ?? null,
      endLatitude: activity.end_latlng?.[0] ?? null,
      endLongitude: activity.end_latlng?.[1] ?? null,
      stravaCreatedAt: activityCreatedAt,
      stravaUpdatedAt: activityUpdatedAt,
      rawData: activity,
      updatedAt: new Date(),
    };

    let activityId: number;

    if (!existingActivity) {
      const [created] = await tx
        .insert(stravaActivity)
        .values({
          ...activityValues,
          createdAt: new Date(),
        })
        .returning({ id: stravaActivity.id });
      if (!created) {
        throw new Error("Failed to insert activity row.");
      }
      activityId = created.id;
    } else {
      const [updated] = await tx
        .update(stravaActivity)
        .set(activityValues)
        .where(eq(stravaActivity.id, existingActivity.id))
        .returning({ id: stravaActivity.id });
      if (!updated) {
        throw new Error("Failed to update activity row.");
      }
      activityId = updated.id;
    }

    await tx
      .delete(stravaActivityLap)
      .where(eq(stravaActivityLap.activityId, activityId));

    if (activity.laps.length > 0) {
      await tx.insert(stravaActivityLap).values(
        activity.laps.map((lap, index) => ({
          activityId,
          lapIndex: lap.lap_index ?? index,
          stravaLapId: String(lap.id),
          name: lap.name ?? null,
          distance: toNumberOrNull(lap.distance),
          elapsedTime: toIntOrNull(lap.elapsed_time),
          movingTime: toIntOrNull(lap.moving_time),
          startDate: lap.start_date ? new Date(lap.start_date) : null,
          startDateLocal: lap.start_date_local
            ? new Date(lap.start_date_local)
            : null,
          totalElevationGain: toNumberOrNull(lap.total_elevation_gain),
          averageSpeed: toNumberOrNull(lap.average_speed),
          maxSpeed: toNumberOrNull(lap.max_speed),
          averageHeartrate: toNumberOrNull(lap.average_heartrate),
          maxHeartrate: toNumberOrNull(lap.max_heartrate),
          averageCadence: toNumberOrNull(lap.average_cadence),
          averageWatts: toNumberOrNull(lap.average_watts),
          split: toIntOrNull(lap.split),
          rawData: lap,
          updatedAt: new Date(),
        })),
      );
    }

    await tx
      .delete(stravaActivityZone)
      .where(eq(stravaActivityZone.activityId, activityId));

    if (synced.zones.length > 0) {
      await tx.insert(stravaActivityZone).values(
        synced.zones.map((zone) => ({
          activityId,
          zoneType: zone.type,
          sensorBased: zone.sensor_based ?? null,
          points: toIntOrNull(zone.points ?? zone.score),
          distributionBuckets: zone.distribution_buckets ?? [],
          rawData: zone,
          updatedAt: new Date(),
        })),
      );
    }
  });

  return existingActivity ? ("updated" as const) : ("created" as const);
}

function toNumberOrNull(value: number | null | undefined) {
  return typeof value === "number" ? value : null;
}

function toIntOrNull(value: number | null | undefined) {
  return typeof value === "number" ? Math.trunc(value) : null;
}

async function parseStravaResponse<TSchema extends z.ZodTypeAny>(
  response: Response,
  schema: TSchema,
  operation: string,
) {
  const payload = await response.json();
  console.log(`[strava] third-party ${operation}`, payload);
  return schema.parse(payload);
}

async function parseStravaErrorPayload(response: Response, operation: string) {
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    payload = await response.text();
  }
  console.error(`[strava] third-party ${operation} error payload`, payload);
  return z.unknown().parse(payload);
}

class StravaRequestError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "StravaRequestError";
    this.statusCode = statusCode;
  }
}

async function createStravaRequestError(response: Response, operation: string) {
  const payload = await parseStravaErrorPayload(response, operation);
  if (response.status === 429) {
    return new StravaRequestError(
      "Strava API rate limit reached. Please retry in about 15 minutes.",
      429,
    );
  }

  const payloadText =
    typeof payload === "string" ? payload : JSON.stringify(payload);
  return new StravaRequestError(
    `Strava request failed (${operation}): ${response.status} ${payloadText}`,
    502,
  );
}

export default app;
