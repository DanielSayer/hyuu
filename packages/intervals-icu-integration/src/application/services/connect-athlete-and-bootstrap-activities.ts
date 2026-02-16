import type { IntervalsGateway } from "../../acl/intervals-gateway";
import type { IntervalsRepository } from "../../persistence/intervals-repository";
import { buildInitialSyncWindow } from "../policies/sync-window-policy";
import { connectAthlete } from "./connect-athlete";
import { fetchAndUpsertActivities } from "./fetch-and-upsert-activities";

export async function connectAthleteAndBootstrapActivities({
  userId,
  athleteId,
  gateway,
  repository,
  now = new Date(),
}: {
  userId: string;
  athleteId: string;
  gateway: IntervalsGateway;
  repository: IntervalsRepository;
  now?: Date;
}) {
  const { athlete } = await connectAthlete({
    userId,
    athleteId,
    gateway,
    repository,
    now,
  });

  const window = buildInitialSyncWindow(now);
  const syncResult = await fetchAndUpsertActivities({
    userId,
    athleteId: athlete.id,
    window,
    gateway,
    repository,
  });

  return {
    athlete,
    connectedAt: now,
    ...window,
    ...syncResult,
  };
}
