import { ConnectionNotFoundError } from "../../domain/errors/connection-not-found-error";
import type { IntervalsGateway } from "../../acl/intervals-gateway";
import type { IntervalsRepository } from "../../persistence/intervals-repository";

export async function testConnection({
  userId,
  repository,
  gateway,
  now = new Date(),
}: {
  userId: string;
  repository: IntervalsRepository;
  gateway: IntervalsGateway;
  now?: Date;
}) {
  const connectedAthleteId = await repository.getConnectedAthleteId(userId);
  if (!connectedAthleteId) {
    throw new ConnectionNotFoundError("Intervals is not connected.");
  }

  const athlete = await gateway.fetchAthleteProfile(connectedAthleteId);
  await repository.upsertAthleteProfile({
    userId,
    athlete,
    now,
  });

  return { athlete, testedAt: now };
}
