import type { IntervalsGateway } from "../../acl/intervals-gateway";
import type { IntervalsRepository } from "../../persistence/intervals-repository";
import { runSyncWithLifecycle } from "./_shared/sync-log-lifecycle";

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
  return runSyncWithLifecycle({
    repository,
    userId,
    intervalsAthleteId: athleteId,
    startedAt: now,
    run: async () => {
      const athlete = await gateway.fetchAthleteProfile(athleteId);
      await repository.upsertAthleteProfile({
        userId,
        athlete,
        now,
      });

      return {
        result: { athlete },
        fetchedActivityCount: 0,
        successIntervalsAthleteId: athlete.id,
      };
    },
  });
}
