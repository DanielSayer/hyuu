import { ZodError } from "zod";
import { UpstreamRequestError } from "../../domain/errors/upstream-request-error";
import type {
  IntervalsActivityDetail,
  IntervalsActivityEvent,
  IntervalsActivityMap,
} from "../../domain/models/activity";
import {
  intervalsActivityDetailSchema,
  intervalsActivityEventsPayloadSchema,
  intervalsActivityMapSchema,
} from "../schemas/intervals-activity-schemas";

export function mapIntervalsActivityEvents(
  payload: unknown,
): IntervalsActivityEvent[] {
  try {
    const parsed = intervalsActivityEventsPayloadSchema.parse(payload);
    return Array.isArray(parsed) ? parsed : parsed.events;
  } catch (error) {
    throw withPayloadValidationError(error, "activity events");
  }
}

export function mapIntervalsActivityDetail(
  payload: unknown,
): IntervalsActivityDetail {
  try {
    return intervalsActivityDetailSchema.parse(payload);
  } catch (error) {
    throw withPayloadValidationError(error, "activity detail");
  }
}

export function mapIntervalsActivityMap(
  payload: unknown,
): IntervalsActivityMap {
  try {
    return intervalsActivityMapSchema.parse(payload);
  } catch (error) {
    throw withPayloadValidationError(error, "activity map");
  }
}

function withPayloadValidationError(error: unknown, scope: string) {
  if (error instanceof ZodError) {
    return new UpstreamRequestError(
      `Intervals ${scope} payload validation failed: ${error.message}`,
    );
  }
  return error;
}
