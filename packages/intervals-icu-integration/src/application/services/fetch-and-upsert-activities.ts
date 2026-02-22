import type { IntervalsGateway } from "../../acl/intervals-gateway";
import type { IntervalsRepository } from "../../persistence/intervals-repository";
import type { SyncWindow } from "../../domain/models/sync-log";
import { computeBestEffortsFromDistanceStream } from "../../utils";

const PREFERRED_STREAM_TYPES = [
  "cadence",
  "heartrate",
  "distance",
  "velocity_smooth",
  "fixed_altitude",
];

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
    const [detail, map] = await Promise.all([
      gateway.fetchActivityDetail(activityId),
      gateway.fetchActivityMap(activityId),
    ]);
    const availableStreamTypes = new Set(detail.stream_types);
    const requestedStreamTypes = PREFERRED_STREAM_TYPES.filter((streamType) =>
      availableStreamTypes.has(streamType),
    );
    const streams =
      requestedStreamTypes.length > 0
        ? await gateway.fetchActivityStreams(activityId, requestedStreamTypes)
        : [];
    const bestEfforts = computeBestEffortsFromDistanceStream(streams);
    activities.push({ activityId, detail, map, streams, bestEfforts });
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
