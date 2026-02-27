const RUN_ACTIVITY_TYPES = new Set([
  "run",
  "trailrun",
  "treadmillrun",
  "virtualrun",
]);

export function normalizeActivityType(type: string) {
  return type.replaceAll(/[\s_-]/g, "").toLowerCase();
}

export function isRunActivityType(type: string | null | undefined) {
  if (typeof type !== "string" || type.length === 0) {
    return false;
  }
  return RUN_ACTIVITY_TYPES.has(normalizeActivityType(type));
}
