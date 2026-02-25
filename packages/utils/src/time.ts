function formatSecondsToHms(
  totalSeconds: number | null,
  { showUnit, showSeconds }: { showUnit?: boolean; showSeconds?: boolean } = {
    showUnit: false,
    showSeconds: true,
  },
): string {
  if (!totalSeconds) return "—";
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.round(totalSeconds % 60);
  if (hours > 0) {
    if (showUnit) {
      return `${hours} hr ${minutes.toString().padStart(2, "0")} min ${showSeconds ? seconds.toString().padStart(2, "0") : ""}${showSeconds ? " s" : ""}`;
    }

    return `${hours}:${minutes.toString().padStart(2, "0")}:${showSeconds ? seconds.toString().padStart(2, "0") : ""}`;
  }

  if (minutes > 0) {
    if (showUnit) {
      return `${minutes} min ${showSeconds ? seconds.toString().padStart(2, "0") : ""}${showSeconds ? " s" : ""}`;
    }

    return `${minutes}:${showSeconds ? seconds.toString().padStart(2, "0") : ""}`;
  }

  if (showUnit) {
    return `${showSeconds ? seconds.toString().padStart(2, "0") : ""}${showSeconds ? " s" : ""}`;
  }

  return `0:${showSeconds ? seconds.toString().padStart(2, "0") : ""}`;
}

export { formatSecondsToHms };
