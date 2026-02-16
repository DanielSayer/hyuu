import type { IntervalsRepository } from "../../persistence/intervals-repository";

export async function getConnectionStatus({
  userId,
  repository,
}: {
  userId: string;
  repository: IntervalsRepository;
}) {
  const profile = await repository.getLatestConnectionProfile(userId);

  if (!profile) {
    return { connected: false as const };
  }

  return {
    connected: true as const,
    connection: {
      athleteName: formatIntervalsAthleteName(profile),
      connectedAt: profile.createdAt.toISOString(),
    },
  };
}

function formatIntervalsAthleteName({
  name,
  firstName,
  lastName,
}: {
  name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
}) {
  if (name && name.trim().length > 0) {
    return name.trim();
  }

  const assembled = [firstName, lastName].filter(Boolean).join(" ");
  return assembled.trim() || "Intervals athlete";
}
