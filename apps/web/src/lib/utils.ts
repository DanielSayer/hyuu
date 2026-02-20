import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

export function formatDateTime(isoDate: string | null | undefined) {
  if (!isoDate) {
    return "Unknown date";
  }

  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return dateTimeFormatter.format(date);
}

export function formatPace(speedMs: number): string {
  if (!speedMs || speedMs === 0) return "—";
  const secsPerKm = 1000 / speedMs;
  const mins = Math.floor(secsPerKm / 60);
  const secs = Math.round(secsPerKm % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function formatTime(seconds: number): string {
  if (!seconds) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.round(seconds % 60);
  if (h > 0)
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function formatDistance(meters: number): string {
  return (meters / 1000).toFixed(2);
}

export function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
