import {
  ConnectionNotFoundError,
  NoPreviousSyncError,
} from "../../domain/errors/connection-not-found-error";
import {
  SyncInitializationError,
  SyncRateLimitError,
  UpstreamRequestError,
} from "../../domain/errors/upstream-request-error";
import { toErrorMessage } from "../../domain/errors/intervals-domain-error";
import type { IntervalsGateway } from "../../acl/intervals-gateway";
import type { IntervalsRepository } from "../../persistence/intervals-repository";
import { buildIncrementalSyncWindow } from "../policies/sync-window-policy";
import { fetchAndUpsertActivities } from "./fetch-and-upsert-activities";

const SYNC_RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;

export async function syncActivitiesIncremental({
  userId,
  repository,
  gateway,
  oldestOverride,
  newestOverride,
  now = new Date(),
}: {
  userId: string;
  repository: IntervalsRepository;
  gateway: IntervalsGateway;
  oldestOverride?: string;
  newestOverride?: string;
  now?: Date;
}) {
  const connectedAthleteId = await repository.getConnectedAthleteId(userId);
  if (!connectedAthleteId) {
    throw new ConnectionNotFoundError(
      "Intervals athlete is not connected. Call /api/intervals/connect first.",
    );
  }

  // const latestSyncAttempt = await repository.getLatestSyncAttempt(userId);
  // if (latestSyncAttempt) {
  //   const elapsedMs = now.getTime() - latestSyncAttempt.startedAt.getTime();
  //   if (elapsedMs < SYNC_RATE_LIMIT_WINDOW_MS) {
  //     const remainingMs = SYNC_RATE_LIMIT_WINDOW_MS - elapsedMs;
  //     throw new SyncRateLimitError(buildRateLimitMessage(remainingMs));
  //   }
  // }

  const lastSuccessfulSync = await repository.getLastSuccessfulSync(userId);
  if (!lastSuccessfulSync?.completedAt) {
    throw new NoPreviousSyncError();
  }

  const window = buildIncrementalSyncWindow({
    now,
    lastSuccessfulSyncAt: lastSuccessfulSync.completedAt,
    oldestOverride,
    newestOverride,
  });

  const syncRow = await repository.createSyncLogStarted({
    userId,
    intervalsAthleteId: connectedAthleteId,
    startedAt: now,
  });

  if (!syncRow) {
    throw new SyncInitializationError();
  }

  try {
    const { eventCount, savedActivityCount } = await fetchAndUpsertActivities({
      userId,
      athleteId: connectedAthleteId,
      window,
      gateway,
      repository,
    });

    await repository.completeSyncLogSuccess({
      syncLogId: syncRow.id,
      intervalsAthleteId: connectedAthleteId,
      completedAt: new Date(),
      fetchedActivityCount: eventCount,
    });

    return {
      athleteId: connectedAthleteId,
      oldest: window.oldest,
      newest: window.newest,
      eventCount,
      savedActivityCount,
    };
  } catch (error) {
    const errorMessage = toErrorMessage(error);
    await repository.completeSyncLogFailed({
      syncLogId: syncRow.id,
      completedAt: new Date(),
      errorMessage,
    });
    throw wrapUnknownSyncError(error);
  }
}

function wrapUnknownSyncError(error: unknown) {
  if (error instanceof Error) {
    return error;
  }
  return new UpstreamRequestError("Failed to sync Intervals data.");
}

function buildRateLimitMessage(remainingMs: number) {
  const remainingMinutes = Math.ceil(remainingMs / 60_000);
  return `Sync can only be triggered once every 5 minutes. Please try again in ${remainingMinutes} minute${remainingMinutes === 1 ? "" : "s"}.`;
}
