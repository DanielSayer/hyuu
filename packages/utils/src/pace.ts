function formatSpeedToMinsPerKm(speedMs: number | null): string {
  if (!speedMs || speedMs === 0) return "—";
  const secsPerKm = 1000 / speedMs;
  const mins = Math.floor(secsPerKm / 60);
  const secs = Math.round(secsPerKm % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatSpeedToKmPerHour(
  speedMs: number | null,
  { showUnit }: { showUnit?: boolean } = { showUnit: true },
): string {
  if (!speedMs || speedMs === 0) return "—";
  return `${(speedMs * 3.6).toFixed(2)}${showUnit ? " km/h" : ""}`;
}

function formatSecondsToMinsPerKm(totalSeconds: number | null): string {
  if (!totalSeconds) return "—";
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.round(totalSeconds % 60);
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, "0")}/km`;
}

export {
  formatSpeedToMinsPerKm,
  formatSpeedToKmPerHour,
  formatSecondsToMinsPerKm,
};
