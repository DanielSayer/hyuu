import { ZodError } from "zod";
import {
  intervalsActivityDetailSchema,
  intervalsActivityEventsPayloadSchema,
  intervalsActivityIntervalsSchema,
} from "../schemas/intervals-activity-schemas";
import { UpstreamRequestError } from "../../domain/errors/upstream-request-error";
import type {
  IntervalsActivityDetail,
  IntervalsActivityEvent,
  IntervalsActivityIntervals,
} from "../../domain/models/activity";

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

export function mapIntervalsActivityIntervals(
  payload: unknown,
): IntervalsActivityIntervals {
  try {
    return intervalsActivityIntervalsSchema.parse(payload);
  } catch (error) {
    throw withPayloadValidationError(error, "activity intervals");
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
