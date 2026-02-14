import { auth } from "@hyuu/auth";

export async function getCurrentSession(headers: Headers) {
  return auth.api.getSession({ headers });
}
