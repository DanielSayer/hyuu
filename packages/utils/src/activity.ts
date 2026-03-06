const RUN_ACTIVITY_TYPES = new Set([
  "run",
  "trailrun",
  "treadmillrun",
  "virtualrun",
]);

function normalizeActivityType(type: string): string {
  return type.replaceAll(/[\s_-]/g, "").toLowerCase();
}

function isRunActivityType(type: string | null | undefined): boolean {
  if (typeof type !== "string" || type.length === 0) {
    return false;
  }
  return RUN_ACTIVITY_TYPES.has(normalizeActivityType(type));
}

function computePaceSecPerKm({
  elapsedSeconds,
  distanceMeters,
}: {
  elapsedSeconds: number;
  distanceMeters: number;
}): number | null {
  if (elapsedSeconds <= 0 || distanceMeters <= 0) {
    return null;
  }
  return elapsedSeconds / (distanceMeters / 1000);
}

export {
  computePaceSecPerKm,
  isRunActivityType,
  normalizeActivityType,
};
