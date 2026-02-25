function formatDistanceToKm(
  meters: number | null,
  { showUnit }: { showUnit?: boolean } = { showUnit: true },
): string {
  if (!meters || meters === 0) return "—";
  return `${(meters / 1000).toFixed(2)}${showUnit ? " km" : ""}`;
}

export { formatDistanceToKm };
