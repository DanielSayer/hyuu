import type { IntervalsGateway } from "../../acl/intervals-gateway";
import type { IntervalsRepository } from "../../persistence/intervals-repository";
import type { SyncWindow } from "../../domain/models/sync-log";

export async function fetchAndUpsertActivities({
  userId,
  athleteId,
  window,
  gateway,
  repository,
}: {
  userId: string;
  athleteId: string;
  window: SyncWindow;
  gateway: IntervalsGateway;
  repository: IntervalsRepository;
}) {
  const events = await gateway.fetchActivityEvents(athleteId, window);
  const activityIds = dedupeActivityIds(events);

  const activities = [];
  for (const activityId of activityIds) {
    const [detail, intervals] = await Promise.all([
      gateway.fetchActivityDetail(activityId),
      gateway.fetchActivityIntervals(activityId),
    ]);
    activities.push({ activityId, detail, intervals });
  }

  const savedActivityCount = await repository.upsertActivities({
    userId,
    intervalsAthleteId: athleteId,
    activities,
  });

  return {
    eventCount: activityIds.length,
    savedActivityCount,
  };
}

function dedupeActivityIds(events: Array<{ id: string }>) {
  return [...new Set(events.map((event) => event.id))];
}
