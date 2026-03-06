import { env } from "@hyuu/env/web";

type IntervalsRequestParams = {
  path: string;
  method?: "GET" | "POST";
  fallbackMessage: string;
};

async function parseErrorMessage(
  response: Response,
  fallbackMessage: string,
): Promise<string> {
  try {
    const json = (await response.json()) as { message?: unknown };
    if (typeof json.message === "string") {
      return json.message;
    }
  } catch {
    // Keep fallback.
  }
  return fallbackMessage;
}

export async function requestIntervals(path: string): Promise<Response> {
  const response = await fetch(`${env.VITE_SERVER_URL}${path}`, {
    credentials: "include",
  });
  return response;
}

export async function requestIntervalsJson<T>({
  path,
  method = "GET",
  fallbackMessage,
}: IntervalsRequestParams): Promise<T> {
  const response = await fetch(`${env.VITE_SERVER_URL}${path}`, {
    method,
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, fallbackMessage));
  }

  return (await response.json()) as T;
}

export async function requestIntervalsNoContent({
  path,
  method = "POST",
  fallbackMessage,
}: IntervalsRequestParams): Promise<void> {
  const response = await fetch(`${env.VITE_SERVER_URL}${path}`, {
    method,
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, fallbackMessage));
  }
}
