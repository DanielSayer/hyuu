import { trpcServer } from "@hono/trpc-server";
import { createContext } from "@hyuu/api/context";
import { appRouter } from "@hyuu/api/routers/index";
import { auth } from "@hyuu/auth";
import { env } from "@hyuu/env/server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

import stravaApp from "./endpoints/strava";

export const app = new Hono();

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

app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
    createContext: (_opts, context) => {
      return createContext({ context });
    },
  }),
);

app.route("/api/strava", stravaApp);

app.get("/", (c) => {
  return c.text("OK");
});

export default app;
