import { ZodError } from "zod";
import { intervalsAthleteSchema } from "../schemas/intervals-athlete-schemas";
import { UpstreamRequestError } from "../../domain/errors/upstream-request-error";
import type { IntervalsAthlete } from "../../domain/models/athlete";

export function mapIntervalsAthletePayload(payload: unknown): IntervalsAthlete {
  try {
    return intervalsAthleteSchema.parse(payload);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new UpstreamRequestError(
        `Intervals athlete payload validation failed: ${error.message}`,
      );
    }
    throw error;
  }
}
