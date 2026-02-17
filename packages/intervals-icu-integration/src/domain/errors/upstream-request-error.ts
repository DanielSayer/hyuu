import { IntervalsDomainError } from "./intervals-domain-error";

export class UpstreamRequestError extends IntervalsDomainError {
  constructor(message: string) {
    super(message, "UPSTREAM_REQUEST_ERROR", 502);
    this.name = "UpstreamRequestError";
  }
}

export class InvalidDateRangeError extends IntervalsDomainError {
  constructor(
    message = 'Invalid "oldest" or "newest" date. Use "yyyy-MM-dd" format.',
  ) {
    super(message, "INVALID_DATE_RANGE", 400);
    this.name = "InvalidDateRangeError";
  }
}

export class SyncInitializationError extends IntervalsDomainError {
  constructor(message = "Failed to initialize Intervals sync log.") {
    super(message, "SYNC_INITIALIZATION_ERROR", 500);
    this.name = "SyncInitializationError";
  }
}

export class SyncRateLimitError extends IntervalsDomainError {
  constructor(message = "Please wait before syncing Intervals again.") {
    super(message, "SYNC_RATE_LIMITED", 429);
    this.name = "SyncRateLimitError";
  }
}
