import "server-only";
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

// Salted scrypt hashing for passwords and access codes (Node built-in, no extra dependency).
// Stored format: scrypt$N$r$p$<salt b64>$<hash b64>
const N = 16384;
const R = 8;
const P = 1;
const KEYLEN = 32;

function derive(secret: string, salt: Buffer, n: number, r: number, p: number, keylen: number): Promise<Buffer> {
  return new Promise((resolve, reject) =>
    scrypt(secret, salt, keylen, { N: n, r, p }, (err, key) => (err ? reject(err) : resolve(key))),
  );
}

export async function hashSecret(secret: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await derive(secret, salt, N, R, P, KEYLEN);
  return `scrypt$${N}$${R}$${P}$${salt.toString("base64")}$${key.toString("base64")}`;
}

export async function verifySecret(secret: string, stored: string | null | undefined): Promise<boolean> {
  if (!stored) return false;
  const [scheme, n, r, p, saltB64, hashB64] = stored.split("$");
  if (scheme !== "scrypt" || !saltB64 || !hashB64) return false;
  try {
    const expected = Buffer.from(hashB64, "base64");
    const actual = await derive(secret, Buffer.from(saltB64, "base64"), Number(n), Number(r), Number(p), expected.length);
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

let dummy: Promise<string> | null = null;
/** Spend the same time as a real check when the username doesn't exist, so timing doesn't reveal it. */
export async function burnVerification(secret: string): Promise<void> {
  dummy ??= hashSecret("ledgerline-timing-equalizer");
  await verifySecret(secret, await dummy);
}

/** Access codes are compared case-insensitively and ignoring surrounding spaces. */
export const normalizeAccessCode = (code: string) => code.trim().toLowerCase();
