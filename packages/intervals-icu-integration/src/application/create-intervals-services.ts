import { createHttpIntervalsGateway } from "../acl/intervals-gateway";
import { createDrizzleIntervalsRepository } from "../persistence/drizzle-intervals-repository";
import { connectAthlete } from "./services/connect-athlete";
import { connectAthleteAndBootstrapActivities } from "./services/connect-athlete-and-bootstrap-activities";
import { backfillDashboardRollups } from "./services/backfill-dashboard-rollups";
import { getConnectionStatus } from "./services/get-connection-status";
import { syncActivitiesIncremental } from "./services/sync-activities-incremental";
import { testConnection } from "./services/test-connection";
import type { IntervalsGateway } from "../acl/intervals-gateway";
import type { IntervalsRepository } from "../persistence/intervals-repository";

export function createIntervalsServices({
  gateway = createHttpIntervalsGateway(),
  repository = createDrizzleIntervalsRepository(),
}: {
  gateway?: IntervalsGateway;
  repository?: IntervalsRepository;
} = {}) {
  return {
    connectAthlete: (args: { userId: string; athleteId: string; now?: Date }) =>
      connectAthlete({
        ...args,
        gateway,
        repository,
      }),
    connectAthleteAndBootstrapActivities: (args: {
      userId: string;
      athleteId: string;
      now?: Date;
    }) =>
      connectAthleteAndBootstrapActivities({
        ...args,
        gateway,
        repository,
      }),
    syncActivitiesIncremental: (args: {
      userId: string;
      oldestOverride?: string;
      newestOverride?: string;
      now?: Date;
    }) =>
      syncActivitiesIncremental({
        ...args,
        gateway,
        repository,
      }),
    testConnection: (args: { userId: string; now?: Date }) =>
      testConnection({
        ...args,
        gateway,
        repository,
      }),
    getConnectionStatus: (args: { userId: string }) =>
      getConnectionStatus({
        ...args,
        repository,
      }),
    backfillDashboardRollups: () =>
      backfillDashboardRollups({
        repository,
      }),
  };
}
