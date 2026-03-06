import { formatIntervalsAthleteName } from "@/utils/formatters";
import { createIntervalsServices } from "@hyuu/intervals-icu-integration";
import { Hono } from "hono";
import { withSessionAndIntervalsErrorHandling } from "./with-intervals-error-handling";

const app = new Hono();
const intervalsServices = createIntervalsServices();

app.get("/connections", withSessionAndIntervalsErrorHandling(async (c, session) => {
  const status = await intervalsServices.getConnectionStatus({
    userId: session.user.id,
  });
  return c.json(status);
}));

app.post("/connections", withSessionAndIntervalsErrorHandling(async (c, session) => {
  const athleteId = c.req.query("athleteId") ?? "0";
  const result = await intervalsServices.connectAthleteAndBootstrapActivities({
    userId: session.user.id,
    athleteId,
  });

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
}));

app.post("/connections/test", withSessionAndIntervalsErrorHandling(async (c, session) => {
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
}));

app.post("/connect", withSessionAndIntervalsErrorHandling(async (c, session) => {
  const athleteId = c.req.query("athleteId") ?? "0";
  const result = await intervalsServices.connectAthlete({
    userId: session.user.id,
    athleteId,
  });

  return c.json({
    ok: true,
    athleteId: result.athlete.id,
  });
}));

app.post("/sync", withSessionAndIntervalsErrorHandling(async (c, session) => {
  const result = await intervalsServices.syncActivitiesIncremental({
    userId: session.user.id,
    oldestOverride: c.req.query("oldest"),
    newestOverride: c.req.query("newest"),
  });

  return c.json({
    ok: true,
    ...result,
  });
}));

export default app;
