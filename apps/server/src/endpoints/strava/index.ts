import { getCurrentSession } from "@/utils/current-session";
import { formatStravaName } from "@/utils/formatters";
import { STRAVA_ENDPOINTS } from "@/utils/strava-endpoints";
import { db } from "@hyuu/db";
import { stravaConnection } from "@hyuu/db/schema/strava";
import { env } from "@hyuu/env/server";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import {
  stravaAthleteSchema,
  stravaTokenResponseSchema,
} from "./strava-oauth-schemas";

const app = new Hono();

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
    const text = await tokenRes.text();
    console.error("Strava token exchange failed", text);
    return c.text("Failed to connect Strava.", 500);
  }

  const data = stravaTokenResponseSchema.parse(await tokenRes.json());

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
    const text = await athleteRes.text();
    return c.json(
      {
        ok: false,
        message: `Strava test failed: ${athleteRes.status} ${text}`,
      },
      502,
    );
  }

  const athlete = stravaAthleteSchema.parse(await athleteRes.json());

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
    const text = await tokenRes.text();
    throw new Error(`Failed to refresh Strava token: ${text}`);
  }

  const parsed = stravaTokenResponseSchema.parse(await tokenRes.json());
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

export default app;
