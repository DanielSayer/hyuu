import { IntervalsDomainError } from "./intervals-domain-error";

export class UpstreamAuthError extends IntervalsDomainError {
  constructor(
    message = "Intervals API authentication failed. Check username and API key.",
  ) {
    super(message, "UPSTREAM_AUTH_ERROR", 401);
    this.name = "UpstreamAuthError";
  }
}
