class IntervalsRequestError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "IntervalsRequestError";
    this.statusCode = statusCode;
  }
}

async function createIntervalsRequestError(
  response: Response,
  operation: string,
) {
  const payload = await parseIntervalsErrorPayload(response, operation);
  const payloadText =
    typeof payload === "string" ? payload : JSON.stringify(payload);

  if (response.status === 401 || response.status === 403) {
    return new IntervalsRequestError(
      "Intervals API authentication failed. Check username and API key.",
      401,
    );
  }

  return new IntervalsRequestError(
    `Intervals request failed (${operation}): ${response.status} ${payloadText}`,
    502,
  );
}

async function parseIntervalsErrorPayload(
  response: Response,
  operation: string,
) {
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    payload = await response.text();
  }
  console.error(`[intervals] third-party ${operation} error payload`, payload);
  return payload;
}

export { createIntervalsRequestError, IntervalsRequestError };
