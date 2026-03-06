import type { IntervalsRepository } from "../../../persistence/intervals-repository";

type RunSyncWithLifecycleParams<TResult> = {
  repository: IntervalsRepository;
  userId: string;
  intervalsAthleteId: string;
  startedAt: Date;
  requireSyncLog?: boolean;
  onMissingSyncLogError?: Error;
  getErrorMessage?: (error: unknown) => string;
  run: () => Promise<{
    result: TResult;
    fetchedActivityCount: number;
    successIntervalsAthleteId?: string;
  }>;
};

export async function runSyncWithLifecycle<TResult>({
  repository,
  userId,
  intervalsAthleteId,
  startedAt,
  requireSyncLog = false,
  onMissingSyncLogError,
  getErrorMessage = defaultErrorMessage,
  run,
}: RunSyncWithLifecycleParams<TResult>): Promise<TResult> {
  const syncRow = await repository.createSyncLogStarted({
    userId,
    intervalsAthleteId,
    startedAt,
  });

  if (requireSyncLog && !syncRow) {
    throw onMissingSyncLogError ?? new Error("Failed to initialize sync log.");
  }

  try {
    const { result, fetchedActivityCount, successIntervalsAthleteId } = await run();
    if (syncRow) {
      await repository.completeSyncLogSuccess({
        syncLogId: syncRow.id,
        intervalsAthleteId: successIntervalsAthleteId ?? intervalsAthleteId,
        completedAt: new Date(),
        fetchedActivityCount,
      });
    }
    return result;
  } catch (error) {
    if (syncRow) {
      await repository.completeSyncLogFailed({
        syncLogId: syncRow.id,
        completedAt: new Date(),
        errorMessage: getErrorMessage(error),
      });
    }
    throw error;
  }
}

function defaultErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}
