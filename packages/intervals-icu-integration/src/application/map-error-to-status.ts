import { IntervalsDomainError } from "../domain/errors/intervals-domain-error";

export function mapIntervalsErrorToStatusCode(error: unknown) {
  if (error instanceof IntervalsDomainError) {
    return error.statusCode;
  }
  return 500;
}
