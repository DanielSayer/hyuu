import { IntervalsDomainError } from "./intervals-domain-error";

export class ConnectionNotFoundError extends IntervalsDomainError {
  constructor(message = "Intervals athlete is not connected.") {
    super(message, "CONNECTION_NOT_FOUND", 404);
    this.name = "ConnectionNotFoundError";
  }
}

export class NoPreviousSyncError extends IntervalsDomainError {
  constructor(
    message = "No previous successful sync found. Reconnect Intervals to initialize sync history.",
  ) {
    super(message, "NO_PREVIOUS_SYNC", 409);
    this.name = "NoPreviousSyncError";
  }
}
