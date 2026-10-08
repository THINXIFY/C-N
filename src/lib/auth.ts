import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { DbUser } from "@/data/users";
import { SESSION_COOKIE, verifySession, type Role } from "./session";
import { getUserForAuth } from "./users-service";

/**
 * The signed-in user, validated against the database on every call: the account must still exist, be active,
 * hold the same role and the same session version. Deleting, deactivating, demoting or resetting credentials
 * therefore takes effect immediately, even though the cookie itself is stateless.
 *
 * The result contains credential hashes — never pass it to a client component; pass plain fields instead.
 */
export async function getCurrentUser(): Promise<DbUser | null> {
  const session = await verifySession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session) return null;
  const user = await getUserForAuth(session.uid);
  if (!user || user.status !== "active" || user.role !== session.role || user.sessionVersion !== session.sv) return null;
  return user;
}

export const homeFor = (role: Role) => (role === "admin" ? "/admin" : "/dashboard");

/** Gate for pages/layouts: sends signed-out visitors to the right login and wrong-role users to their own area. */
export async function requireRole(role: Role): Promise<DbUser> {
  const user = await getCurrentUser();
  if (!user) redirect(role === "admin" ? "/admin/login" : "/login");
  if (user.role !== role) redirect(homeFor(user.role));
  return user;
}
