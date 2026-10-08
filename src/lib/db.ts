import "server-only";
import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { accountSeed } from "@/data/records";
import { defaultAppSettings, type AppSettings } from "@/data/app-settings";
import { defaultCustomCssSettings, type CustomCssSettings } from "@/data/custom-css";
import { defaultGlobalReplaceState, type GlobalReplaceState } from "@/data/global-replace";
import { defaultContentSettings, type ContentSettings } from "@/data/settings";
import type { TransferRequest } from "@/data/transfer-requests";
import { defaultUserSettings, type DbUser, type UserSettings } from "@/data/users";
import { hashSecret, normalizeAccessCode } from "./secret-hash";

// Tiny persistent store: tables `users`, `user_settings`, `content_settings`, `app_settings`, `custom_css` in
// one JSON file (hashes only, never plaintext credentials). Reads are cheap; writes are serialized and
// atomic. To move to Supabase/Postgres, reimplement `readDb` / `mutateDb` (and nothing else changes).
export interface Database {
  version: 1;
  users: DbUser[];
  userSettings: UserSettings[];
  contentSettings: ContentSettings;
  /** Global operational settings (currently just maintenance mode) — not part of the CMS. Optional so older
   *  db.json files (predating this field) parse without error; readers fall back to defaults. */
  appSettings?: AppSettings;
  /** Admin-authored CSS for user-facing pages only — never admin pages. Optional for the same reason as
   *  appSettings above. */
  customCss?: CustomCssSettings;
  /** History + one-step undo snapshot for the admin "Global Text Replacement" tool. Optional for the same
   *  reason as appSettings above. */
  globalReplace?: GlobalReplaceState;
  /** Submitted transfer-request FORMS only — no payment integration, never affects financial data. Optional
   *  for the same reason as appSettings above. */
  transferRequests?: TransferRequest[];
  /** The user whose profile owns the (read-only) financial record. */
  financialOwnerId: string | null;
}

const DIR = path.join(process.cwd(), ".data");
const FILE = path.join(DIR, "db.json");

let queue: Promise<unknown> = Promise.resolve();
let seeding: Promise<Database> | null = null;

async function readFile(): Promise<Database | null> {
  try {
    return JSON.parse(await fs.readFile(FILE, "utf8")) as Database;
  } catch {
    return null;
  }
}

async function writeFile(db: Database): Promise<void> {
  await fs.mkdir(DIR, { recursive: true });
  const tmp = `${FILE}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(db, null, 2), "utf8");
  await fs.rename(tmp, FILE);
}

/**
 * First-run migration. Credentials are taken from the environment, hashed here on the server, and only the
 * hashes are stored. After this, USER_* / ADMIN_* env credentials are no longer used for login.
 */
async function seed(): Promise<Database> {
  const now = new Date().toISOString();
  const db: Database = {
    version: 1,
    users: [],
    userSettings: [],
    contentSettings: structuredClone(defaultContentSettings),
    appSettings: structuredClone(defaultAppSettings),
    customCss: structuredClone(defaultCustomCssSettings),
    globalReplace: structuredClone(defaultGlobalReplaceState),
    transferRequests: [],
    financialOwnerId: null,
  };

  const base = { sessionVersion: 1, createdAt: now, updatedAt: now, lastLoginAt: null, email: null };

  const { USER_USERNAME, USER_PASSWORD, USER_ACCESS_CODE, ADMIN_USERNAME, ADMIN_PASSWORD } = process.env;

  if (USER_USERNAME && USER_PASSWORD) {
    const id = randomUUID();
    db.users.push({
      ...base,
      id,
      username: USER_USERNAME.trim(),
      passwordHash: await hashSecret(USER_PASSWORD),
      accessCodeHash: USER_ACCESS_CODE ? await hashSecret(normalizeAccessCode(USER_ACCESS_CODE)) : null,
      displayName: accountSeed.holderName,
      businessName: accountSeed.businessName,
      role: "user",
      status: "active",
    });
    db.userSettings.push({
      ...defaultUserSettings,
      id: randomUUID(),
      userId: id,
      recordStatus: accountSeed.status,
      recordType: accountSeed.recordType,
      createdAt: now,
      updatedAt: now,
    });
    db.financialOwnerId = id;
  }

  if (ADMIN_USERNAME && ADMIN_PASSWORD) {
    const id = randomUUID();
    db.users.push({
      ...base,
      id,
      username: ADMIN_USERNAME.trim(),
      passwordHash: await hashSecret(ADMIN_PASSWORD),
      accessCodeHash: null,
      displayName: "Administrator",
      businessName: "Dashboard",
      role: "admin",
      status: "active",
    });
    db.userSettings.push({ ...defaultUserSettings, id: randomUUID(), userId: id, createdAt: now, updatedAt: now });
  }

  await writeFile(db);
  return db;
}

export async function readDb(): Promise<Database> {
  const existing = await readFile();
  if (existing) return existing;
  seeding ??= seed().finally(() => (seeding = null));
  return seeding;
}

/** Serialized read-modify-write. The callback may mutate the draft and return a result. */
export function mutateDb<T>(fn: (db: Database) => T | Promise<T>): Promise<T> {
  const run = queue.then(async () => {
    const db = await readDb();
    const result = await fn(db);
    await writeFile(db);
    return result;
  });
  queue = run.catch(() => undefined);
  return run;
}
