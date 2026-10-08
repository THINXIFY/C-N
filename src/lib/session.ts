// Edge-safe signed tokens (HMAC-SHA256 via Web Crypto). Used by proxy.ts and server code.
// Every token carries a `typ`, so a "pending" (password-passed) token can never be replayed as a session.
export type Role = "user" | "admin";

export interface Session {
  typ: "session";
  /** Database user id. The user record is re-checked on every request. */
  uid: string;
  role: Role;
  /** Session version at sign-in; resetting credentials or changing the role invalidates older sessions. */
  sv: number;
  exp: number; // epoch ms
}

export interface PendingLogin {
  typ: "pending";
  uid: string;
  role: Role;
  remember: boolean;
  exp: number;
}

export const SESSION_COOKIE = "lf_session";
export const PENDING_COOKIE = "lf_pending";
const enc = new TextEncoder();

function b64url(bytes: Uint8Array): string {
  let s = "";
  bytes.forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function fromB64url(str: string): Uint8Array<ArrayBuffer> {
  const s = atob(str.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(s, (c) => c.charCodeAt(0));
}

async function key(): Promise<CryptoKey> {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set");
  return crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
    "verify",
  ]);
}

async function sign(payload: object): Promise<string> {
  const body = b64url(enc.encode(JSON.stringify(payload)));
  const sig = await crypto.subtle.sign("HMAC", await key(), enc.encode(body));
  return `${body}.${b64url(new Uint8Array(sig))}`;
}

async function verify<T extends { typ: string; exp: number }>(token: string | undefined, typ: T["typ"]): Promise<T | null> {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  try {
    const ok = await crypto.subtle.verify("HMAC", await key(), fromB64url(sig), enc.encode(body));
    if (!ok) return null;
    const data = JSON.parse(new TextDecoder().decode(fromB64url(body))) as T;
    if (data.typ !== typ || data.exp < Date.now()) return null;
    return data;
  } catch {
    return null;
  }
}

export const signSession = (s: Omit<Session, "typ">) => sign({ ...s, typ: "session" });
export const signPending = (p: Omit<PendingLogin, "typ">) => sign({ ...p, typ: "pending" });

export async function verifySession(token: string | undefined): Promise<Session | null> {
  const s = await verify<Session>(token, "session");
  return s && (s.role === "user" || s.role === "admin") ? s : null;
}

export async function verifyPending(token: string | undefined): Promise<PendingLogin | null> {
  const p = await verify<PendingLogin>(token, "pending");
  return p && (p.role === "user" || p.role === "admin") ? p : null;
}
