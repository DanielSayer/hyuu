import { getCurrentSession } from "@/utils/current-session";
import { formatIntervalsAthleteName, toErrorMessage } from "@/utils/formatters";
import {
  createIntervalsServices,
  mapIntervalsErrorToStatusCode,
} from "@hyuu/intervals-icu-integration";
import { Hono } from "hono";
import type { StatusCode } from "hono/utils/http-status";

const app = new Hono();
const intervalsServices = createIntervalsServices();

app.get("/connections", async (c) => {
  const session = await getCurrentSession(c.req.raw.headers);

  if (!session) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const status = await intervalsServices.getConnectionStatus({
    userId: session.user.id,
  });
  return c.json(status);
});

app.post("/connections", async (c) => {
  const session = await getCurrentSession(c.req.raw.headers);

  if (!session) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const athleteId = c.req.query("athleteId") ?? "0";

  try {
    const result = await intervalsServices.connectAthleteAndBootstrapActivities(
      {
        userId: session.user.id,
        athleteId,
      },
    );

    return c.json({
      ok: true,
      athleteId: result.athlete.id,
      connected: true,
      connection: {
        athleteName: formatIntervalsAthleteName(result.athlete),
        connectedAt: result.connectedAt.toISOString(),
      },
      activitiesFetched: result.eventCount,
      activitiesSaved: result.savedActivityCount,
    });
  } catch (error) {
    c.status(mapIntervalsErrorToStatusCode(error) as StatusCode);
    return c.json({ message: toErrorMessage(error) });
  }
});

app.post("/connections/test", async (c) => {
  const session = await getCurrentSession(c.req.raw.headers);

  if (!session) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  try {
    const result = await intervalsServices.testConnection({
      userId: session.user.id,
    });

    return c.json({
      ok: true,
      testedAt: result.testedAt.toISOString(),
      athlete: {
        id: result.athlete.id,
        name: formatIntervalsAthleteName(result.athlete),
      },
    });
  } catch (error) {
    c.status(mapIntervalsErrorToStatusCode(error) as StatusCode);
    return c.json({ message: toErrorMessage(error) });
  }
});

app.post("/connect", async (c) => {
  const session = await getCurrentSession(c.req.raw.headers);

  if (!session) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const athleteId = c.req.query("athleteId") ?? "0";

  try {
    const result = await intervalsServices.connectAthlete({
      userId: session.user.id,
      athleteId,
    });

    return c.json({
      ok: true,
      athleteId: result.athlete.id,
    });
  } catch (error) {
    c.status(mapIntervalsErrorToStatusCode(error) as StatusCode);
    return c.json({ message: toErrorMessage(error) });
  }
});

app.post("/sync", async (c) => {
  const session = await getCurrentSession(c.req.raw.headers);

  if (!session) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  try {
    const result = await intervalsServices.syncActivitiesIncremental({
      userId: session.user.id,
      oldestOverride: c.req.query("oldest"),
      newestOverride: c.req.query("newest"),
    });

    return c.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    c.status(mapIntervalsErrorToStatusCode(error) as StatusCode);
    return c.json({ message: toErrorMessage(error) });
  }
});

export default app;
