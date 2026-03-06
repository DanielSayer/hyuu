import type { Context } from "hono";
import { getCurrentSession } from "@/utils/current-session";

export type CurrentSession = NonNullable<
  Awaited<ReturnType<typeof getCurrentSession>>
>;

export async function requireSession(
  c: Context,
): Promise<CurrentSession | Response> {
  const session = await getCurrentSession(c.req.raw.headers);
  if (!session) {
    return c.json({ message: "Unauthorized" }, 401);
  }
  return session;
}
