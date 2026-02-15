import { env } from "@hyuu/env/web";

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
  const response = await fetch(
    `${env.VITE_SERVER_URL}/api/intervals/connections`,
    {
      credentials: "include",
    },
  );

  if (!response.ok) {
    throw new Error("Failed to load Intervals connection.");
  }

  return (await response.json()) as IntervalsConnectionResponse;
}

export async function connectIntervalsConnection() {
  const response = await fetch(
    `${env.VITE_SERVER_URL}/api/intervals/connections`,
    {
      method: "POST",
      credentials: "include",
    },
  );

  if (!response.ok) {
    const fallbackMessage = "Failed to connect Intervals.";
    let message = fallbackMessage;

    try {
      const json = (await response.json()) as { message?: unknown };
      if (typeof json.message === "string") {
        message = json.message;
      }
    } catch {
      // keep fallback message
    }

    throw new Error(message);
  }
}

export async function testIntervalsConnection() {
  const response = await fetch(
    `${env.VITE_SERVER_URL}/api/intervals/connections/test`,
    {
      method: "POST",
      credentials: "include",
    },
  );

  if (!response.ok) {
    const fallbackMessage = "Failed to test Intervals connection.";
    let message = fallbackMessage;

    try {
      const json = (await response.json()) as { message?: unknown };
      if (typeof json.message === "string") {
        message = json.message;
      }
    } catch {
      // keep fallback message
    }

    throw new Error(message);
  }

  return (await response.json()) as IntervalsTestConnectionResponse;
}

export async function syncIntervalsActivities() {
  const response = await fetch(`${env.VITE_SERVER_URL}/api/intervals/sync`, {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    const fallbackMessage = "Failed to sync Intervals activities.";
    let message = fallbackMessage;

    try {
      const json = (await response.json()) as { message?: unknown };
      if (typeof json.message === "string") {
        message = json.message;
      }
    } catch {
      // keep fallback message
    }

    throw new Error(message);
  }

  return (await response.json()) as IntervalsSyncResponse;
}
