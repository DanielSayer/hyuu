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
  const athlete = await gateway.fetchAthleteProfile(athleteId);
  await repository.upsertAthleteProfile({
    userId,
    athlete,
    now,
  });

  return { athlete };
}
