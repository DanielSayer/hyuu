import { env } from "@hyuu/env/server";
import { createIntervalsRequestError } from "./intervals-request-error";

export async function fetchIntervalsEndpoint({
  operation,
  url,
}: {
  operation: string;
  url: string;
}) {
  const response = await fetch(url, {
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

  console.log(`[intervals] third-party ${operation}`, payload);
  return payload;
}

function getBasicAuthHeader() {
  const token = Buffer.from(
    `${env.INTERVALS_ICU_USERNAME}:${env.INTERVALS_ICU_API_KEY}`,
  ).toString("base64");
  return `Basic ${token}`;
}
