"use server";

import { cookies } from "next/headers";
import type { DbUser } from "@/data/users";
import { homeFor } from "@/lib/auth";
import { burnVerification, normalizeAccessCode, normalizeSecurityAnswer, verifySecret } from "@/lib/secret-hash";
import {
  PENDING_COOKIE,
  SESSION_COOKIE,
  signPending,
  signSession,
  verifyPending,
  type Role,
} from "@/lib/session";
import { findUserForAuth, getUserForAuth, recordLogin } from "@/lib/users-service";

export interface LoginResult {
  ok: boolean;
  error?: string;
  /** "code" → credentials passed, the access-code step is next. */
  step?: "code";
  redirectTo?: string;
  /** Set only when this account has a configured Step 2 security question — the question text itself (never
   *  the answer). Null/absent means Step 2 uses the private access code instead. Comes from the user's own
   *  stored configuration, never from the content-management system. */
  securityQuestion?: string | null;
}

const PENDING_TTL_MS = 5 * 60 * 1000;
const INACTIVE = "This account is currently inactive.";

async function startSession(user: DbUser, remember: boolean) {
  const maxAge = remember ? 60 * 60 * 24 * 14 : 60 * 60 * 8;
  const token = await signSession({ uid: user.id, role: user.role, sv: user.sessionVersion, exp: Date.now() + maxAge * 1000 });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    ...(remember ? { maxAge } : {}),
  });
  await recordLogin(user.id);
}

/** Step 1 (all roles): username + password. Admins get a session; users move on to the access-code step. */
export async function loginAction(role: Role, formData: FormData): Promise<LoginResult> {
  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");
  const remember = formData.get("remember") === "on";

  if (!username.trim() || !password) return { ok: false, error: "Enter your username and password." };

  const user = await findUserForAuth(username);
  const passwordOk = user ? await verifySecret(password, user.passwordHash) : (await burnVerification(password), false);

  // Wrong username, wrong password, or an account that belongs to the other sign-in page: one generic message.
  if (!user || !passwordOk || user.role !== role) {
    await new Promise((r) => setTimeout(r, 400));
    return { ok: false, error: "Incorrect username or password." };
  }
  // Only revealed after the password is right, so it can't be used to discover usernames.
  if (user.status !== "active") return { ok: false, error: INACTIVE };

  if (role === "admin") {
    await startSession(user, remember);
    return { ok: true, redirectTo: homeFor("admin") };
  }

  // User: no session yet — only a short-lived, signed "password passed" marker.
  const pending = await signPending({ uid: user.id, role: "user", remember, exp: Date.now() + PENDING_TTL_MS });
  (await cookies()).set(PENDING_COOKIE, pending, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: PENDING_TTL_MS / 1000,
  });
  const securityQuestion = user.securityQuestion && user.securityAnswerHash ? user.securityQuestion : null;
  return { ok: true, step: "code", securityQuestion };
}

/**
 * Step 2 (user): either the per-user security question (when configured) or the private access code.
 * Same form field, same action, same session-creation point either way — only the verification target and
 * wording differ. The session is created only here, after step 1 has passed.
 */
export async function verifyAccessCodeAction(formData: FormData): Promise<LoginResult> {
  const code = String(formData.get("code") ?? "");

  const jar = await cookies();
  const pending = await verifyPending(jar.get(PENDING_COOKIE)?.value);
  const user = pending && pending.role === "user" ? await getUserForAuth(pending.uid) : null;
  if (!pending || !user || user.role !== "user") {
    jar.delete(PENDING_COOKIE);
    return { ok: false, error: "Your sign-in expired. Please start again." };
  }

  const usesSecurityQuestion = !!(user.securityQuestion && user.securityAnswerHash);
  if (!code.trim()) return { ok: false, error: usesSecurityQuestion ? "Enter your answer." : "Enter your private access code." };

  if (user.status !== "active") {
    jar.delete(PENDING_COOKIE);
    return { ok: false, error: INACTIVE };
  }

  // Fails closed if neither a security answer nor an access code has been set for this account.
  const verified = usesSecurityQuestion
    ? await verifySecret(normalizeSecurityAnswer(code), user.securityAnswerHash)
    : await verifySecret(normalizeAccessCode(code), user.accessCodeHash);
  if (!verified) {
    await new Promise((r) => setTimeout(r, 400));
    return { ok: false, error: usesSecurityQuestion ? "Incorrect answer." : "Incorrect access code." };
  }

  jar.delete(PENDING_COOKIE);
  await startSession(user, pending.remember);
  return { ok: true, redirectTo: homeFor("user") };
}

export async function cancelPendingAction(): Promise<void> {
  (await cookies()).delete(PENDING_COOKIE);
}

export async function logoutAction(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  jar.delete(PENDING_COOKIE);
}
