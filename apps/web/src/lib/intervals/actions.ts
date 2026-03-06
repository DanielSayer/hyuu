import {
  requestIntervals,
  requestIntervalsJson,
  requestIntervalsNoContent,
} from "./intervals-client";

export type IntervalsSyncResponse = {
  ok: boolean;
  athleteId?: string;
  oldest?: string;
  newest?: string;
  eventCount?: number;
  savedActivityCount?: number;
};

export type IntervalsConnectionResponse =
  | { connected: false }
  | {
      connected: true;
      connection: {
        athleteName: string;
        connectedAt: string;
      };
    };

export type IntervalsTestConnectionResponse = {
  ok: boolean;
  testedAt: string;
  athlete: {
    id: string;
    name: string;
  };
};

export async function getIntervalsConnection() {
  const response = await requestIntervals("/api/intervals/connections");

  if (!response.ok) {
    throw new Error("Failed to load Intervals connection.");
  }

  return (await response.json()) as IntervalsConnectionResponse;
}

export async function connectIntervalsConnection() {
  await requestIntervalsNoContent({
    path: "/api/intervals/connections",
    method: "POST",
    fallbackMessage: "Failed to connect Intervals.",
  });
}

export async function testIntervalsConnection() {
  return requestIntervalsJson<IntervalsTestConnectionResponse>({
    path: "/api/intervals/connections/test",
    method: "POST",
    fallbackMessage: "Failed to test Intervals connection.",
  });
}

export async function syncIntervalsActivities() {
  return requestIntervalsJson<IntervalsSyncResponse>({
    path: "/api/intervals/sync",
    method: "POST",
    fallbackMessage: "Failed to sync Intervals activities.",
  });
}
