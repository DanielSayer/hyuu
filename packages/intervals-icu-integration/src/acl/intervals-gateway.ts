import { env } from "@hyuu/env/server";
import { UpstreamAuthError } from "../domain/errors/upstream-auth-error";
import { UpstreamRequestError } from "../domain/errors/upstream-request-error";
import { INTERVALS_ENDPOINTS } from "./intervals-endpoints";
import {
  createIntervalsRequestError,
  IntervalsRequestError,
} from "./errors/intervals-request-error";
import { mapIntervalsAthletePayload } from "./mappers/athlete-mapper";
import {
  mapIntervalsActivityDetail,
  mapIntervalsActivityEvents,
  mapIntervalsActivityMap,
  mapIntervalsActivityStreams,
} from "./mappers/activity-mapper";
import type { IntervalsAthlete } from "../domain/models/athlete";
import type {
  IntervalsActivityDetail,
  IntervalsActivityEvent,
  IntervalsActivityMap,
  IntervalsActivityStream,
} from "../domain/models/activity";
import type { SyncWindow } from "../domain/models/sync-log";

export interface IntervalsGateway {
  fetchAthleteProfile(athleteId: string): Promise<IntervalsAthlete>;
  fetchActivityEvents(
    athleteId: string,
    window: SyncWindow,
  ): Promise<IntervalsActivityEvent[]>;
  fetchActivityDetail(activityId: string): Promise<IntervalsActivityDetail>;
  fetchActivityMap(activityId: string): Promise<IntervalsActivityMap>;
  fetchActivityStreams(
    activityId: string,
    types: string[],
  ): Promise<IntervalsActivityStream[]>;
}

export type CreateHttpIntervalsGatewayInput = {
  fetchImpl?: typeof fetch;
};

export function createHttpIntervalsGateway(
  input: CreateHttpIntervalsGatewayInput = {},
): IntervalsGateway {
  const fetchImpl = input.fetchImpl ?? fetch;

  return {
    async fetchAthleteProfile(athleteId) {
      const payload = await fetchIntervalsEndpoint(fetchImpl, {
        operation: `athlete.${athleteId}`,
        url: INTERVALS_ENDPOINTS.ATHLETE.PROFILE(athleteId),
      });
      return mapIntervalsAthletePayload(payload);
    },
    async fetchActivityEvents(athleteId, window) {
      const payload = await fetchIntervalsEndpoint(fetchImpl, {
        operation: `athlete.${athleteId}.events`,
        url: INTERVALS_ENDPOINTS.ATHLETE.ACTIVITIES(athleteId, window),
      });
      return mapIntervalsActivityEvents(payload);
    },
    async fetchActivityDetail(activityId) {
      const payload = await fetchIntervalsEndpoint(fetchImpl, {
        operation: `activity.${activityId}.detail`,
        url: INTERVALS_ENDPOINTS.ACTIVITY.DETAIL(activityId),
      });
      return mapIntervalsActivityDetail(payload);
    },
    async fetchActivityMap(activityId) {
      const payload = await fetchIntervalsEndpoint(fetchImpl, {
        operation: `activity.${activityId}.map`,
        url: INTERVALS_ENDPOINTS.ACTIVITY.MAP(activityId),
      });

      return mapIntervalsActivityMap(payload);
    },
    async fetchActivityStreams(activityId, types) {
      const payload = await fetchIntervalsEndpoint(fetchImpl, {
        operation: `activity.${activityId}.streams`,
        url: INTERVALS_ENDPOINTS.ACTIVITY.STREAMS(activityId, {
          types,
        }),
      });
      return mapIntervalsActivityStreams(payload);
    },
  };
}

async function fetchIntervalsEndpoint(
  fetchImpl: typeof fetch,
  {
    operation,
    url,
  }: {
    operation: string;
    url: string;
  },
) {
  try {
    const response = await fetchImpl(url, {
      headers: {
        Authorization: getBasicAuthHeader(),
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw await createIntervalsRequestError(response, operation);
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      payload = await response.text();
    }

    console.log(`[intervals] third-party ${operation}: [URL] ${url}`);
    return payload;
  } catch (error) {
    throw mapUpstreamError(error);
  }
}

function getBasicAuthHeader() {
  const token = Buffer.from(
    `${env.INTERVALS_ICU_USERNAME}:${env.INTERVALS_ICU_API_KEY}`,
  ).toString("base64");
  return `Basic ${token}`;
}

function mapUpstreamError(error: unknown) {
  if (error instanceof IntervalsRequestError) {
    if (error.statusCode === 401) {
      return new UpstreamAuthError(error.message);
    }
    return new UpstreamRequestError(error.message);
  }

  if (error instanceof Error) {
    return error;
  }

  return new UpstreamRequestError("Intervals request failed.");
}
