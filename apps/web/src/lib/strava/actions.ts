import { env } from "@hyuu/env/web";
import {
  stravaConnectionResponseSchema,
  stravaDisconnectResponseSchema,
  stravaTestResponseSchema,
} from "./strava-response-schemas";

export async function getStravaConnection() {
  const response = await fetch(`${env.VITE_SERVER_URL}/api/strava/connection`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to load Strava connection.");
  }

  return stravaConnectionResponseSchema.parse(await response.json());
}

export async function testStravaConnection() {
  const response = await fetch(`${env.VITE_SERVER_URL}/api/strava/test`, {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    const fallbackMessage = "Failed to test Strava connection.";
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

  return stravaTestResponseSchema.parse(await response.json());
}

export async function disconnectStrava() {
  const response = await fetch(`${env.VITE_SERVER_URL}/api/strava/disconnect`, {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to disconnect Strava.");
  }

  return stravaDisconnectResponseSchema.parse(await response.json());
}
