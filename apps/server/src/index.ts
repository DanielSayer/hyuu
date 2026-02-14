import { trpcServer } from "@hono/trpc-server";
import { createContext } from "@hyuu/api/context";
import { appRouter } from "@hyuu/api/routers/index";
import { auth } from "@hyuu/auth";
import { db } from "@hyuu/db";
import { stravaConnection } from "@hyuu/db/schema/strava";
import { env } from "@hyuu/env/server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

const app = new Hono();

app.use(logger());
app.use(
  "/*",
  cors({
    origin: env.CORS_ORIGIN,
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

app.get("/api/strava/authorize", async (c) => {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

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

  return c.redirect(
    `https://www.strava.com/oauth/authorize?${params.toString()}`,
  );
});

app.get("/api/strava/callback", async (c) => {
  const url = new URL(c.req.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error || !code) {
    return c.text("Strava authorization failed.", 400);
  }

  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session) {
    return c.redirect(`${env.CORS_ORIGIN}/login`);
  }

  const tokenRes = await fetch("https://www.strava.com/oauth/token", {
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

  const data = (await tokenRes.json()) as {
    access_token: string;
    refresh_token: string;
    expires_at: number;
    athlete?: {
      id?: number;
    };
  };

  const userId = session.user.id;
  const stravaAthleteId = String(data.athlete?.id ?? "");
  const accessToken = data.access_token;
  const refreshToken = data.refresh_token;
  const tokenExpiresAt = new Date(data.expires_at * 1000);

  await db
    .insert(stravaConnection)
    .values({
      userId,
      stravaAthleteId,
      authCode: code,
      accessToken,
      refreshToken,
      tokenExpiresAt,
    })
    .onConflictDoUpdate({
      target: stravaConnection.userId,
      set: {
        stravaAthleteId,
        authCode: code,
        accessToken,
        refreshToken,
        tokenExpiresAt,
        updatedAt: new Date(),
      },
    });

  return c.redirect(`${env.CORS_ORIGIN}/dashboard?strava=connected`);
});

app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
    createContext: (_opts, context) => {
      return createContext({ context });
    },
  }),
);

app.get("/", (c) => {
  return c.text("OK");
});

export default app;
