import type { IntervalsRepository } from "../../persistence/intervals-repository";

export async function backfillDashboardRollups({
  repository,
}: {
  repository: IntervalsRepository;
}) {
  const userIds = await repository.listConnectedUserIds();
  for (const userId of userIds) {
    await repository.recomputeDashboardRunRollupsForUser(userId);
  }
  return {
    userCount: userIds.length,
  };
}
