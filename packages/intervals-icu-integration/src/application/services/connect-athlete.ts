import type { IntervalsGateway } from "../../acl/intervals-gateway";
import type { IntervalsRepository } from "../../persistence/intervals-repository";

export async function connectAthlete({
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
  const syncRow = await repository.createSyncLogStarted({
    userId,
    intervalsAthleteId: athleteId,
    startedAt: now,
  });

  try {
    const athlete = await gateway.fetchAthleteProfile(athleteId);
    await repository.upsertAthleteProfile({
      userId,
      athlete,
      now,
    });

    if (syncRow) {
      await repository.completeSyncLogSuccess({
        syncLogId: syncRow.id,
        intervalsAthleteId: athlete.id,
        completedAt: new Date(),
        fetchedActivityCount: 0,
      });
    }

    return { athlete };
  } catch (error) {
    if (syncRow) {
      await repository.completeSyncLogFailed({
        syncLogId: syncRow.id,
        completedAt: new Date(),
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      });
    }
    throw error;
  }
}
