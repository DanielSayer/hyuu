import { InvalidDateRangeError } from "../../domain/errors/upstream-request-error";
import type { SyncWindow } from "../../domain/models/sync-log";

const INITIAL_LOOKBACK_MS = 14 * 24 * 60 * 60 * 1000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export function buildInitialSyncWindow(now: Date): SyncWindow {
  const newest = toDateOnlyString(now);
  const oldest = toDateOnlyString(new Date(now.getTime() - INITIAL_LOOKBACK_MS));
  return { oldest, newest };
}

export function buildIncrementalSyncWindow({
  now,
  lastSuccessfulSyncAt,
  oldestOverride,
  newestOverride,
}: {
  now: Date;
  lastSuccessfulSyncAt: Date;
  oldestOverride?: string;
  newestOverride?: string;
}): SyncWindow {
  const newest = normalizeIntervalsDateParam({
    value: newestOverride,
    defaultDate: now,
  });
  const oldest = normalizeIntervalsDateParam({
    value: oldestOverride,
    defaultDate: new Date(lastSuccessfulSyncAt.getTime() - ONE_DAY_MS),
  });

  if (!newest || !oldest) {
    throw new InvalidDateRangeError();
  }

  return { oldest, newest };
}

function normalizeIntervalsDateParam({
  value,
  defaultDate,
}: {
  value: string | undefined;
  defaultDate: Date;
}) {
  if (!value) {
    return toDateOnlyString(defaultDate);
  }

  const dateOnly = /^\d{4}-\d{2}-\d{2}$/;
  if (dateOnly.test(value)) {
    return value;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return toDateOnlyString(parsed);
}

function toDateOnlyString(date: Date) {
  return date.toISOString().slice(0, 10);
}
