import type { Context } from "hono";
import type { StatusCode } from "hono/utils/http-status";
import { mapIntervalsErrorToStatusCode } from "@hyuu/intervals-icu-integration";
import { toErrorMessage } from "@/utils/formatters";
import type { CurrentSession } from "./with-session";
import { requireSession } from "./with-session";

type SessionHandler = (c: Context, session: CurrentSession) => Promise<Response>;

export function withSessionAndIntervalsErrorHandling(handler: SessionHandler) {
  return async (c: Context): Promise<Response> => {
    const session = await requireSession(c);
    if (session instanceof Response) {
      return session;
    }

    try {
      return await handler(c, session);
    } catch (error) {
      c.status(mapIntervalsErrorToStatusCode(error) as StatusCode);
      return c.json({ message: toErrorMessage(error) });
    }
  };
}
