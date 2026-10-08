import "server-only";
import { randomUUID } from "node:crypto";
import { defaultUserContent, mergeUserContent, type ContentSettings, type UserContent } from "@/data/settings";
import { defaultUserSettings, type DbUser, type EditableUserSettings, type UserRole, type UserSettings, type UserStatus, type UserSummary } from "@/data/users";
import { mutateDb, readDb, type Database } from "./db";
import { hashSecret, normalizeAccessCode, normalizeSecurityAnswer } from "./secret-hash";
import type { CreateUserInput, UserProfileInput } from "./user-validation";

// User account operations. Business rules (unique usernames, protecting the last admin, no self-lockout)
// live here so every caller gets them. Hashes never leave this module except through the explicit `*ForAuth` readers.

export type ServiceResult<T = undefined> =
  | { ok: true; value: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

const fail = (error: string, fieldErrors?: Record<string, string>): ServiceResult<never> => ({ ok: false, error, fieldErrors });
const done = <T,>(value: T): ServiceResult<T> => ({ ok: true, value });

export function toSummary(u: DbUser): UserSummary {
  return {
    id: u.id,
    username: u.username,
    displayName: u.displayName,
    businessName: u.businessName,
    email: u.email,
    role: u.role,
    status: u.status,
    hasAccessCode: !!u.accessCodeHash,
    securityQuestion: u.securityQuestion ?? null,
    hasSecurityQuestion: !!(u.securityQuestion && u.securityAnswerHash),
    securityAnswerUpdatedAt: u.securityAnswerUpdatedAt ?? null,
    profilePhotoPath: u.profilePhotoPath ?? null,
    profilePhotoUpdatedAt: u.profilePhotoUpdatedAt ?? null,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
    lastLoginAt: u.lastLoginAt,
  };
}

const sameName = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();
const activeAdmins = (db: Database, excludeId?: string) =>
  db.users.filter((u) => u.role === "admin" && u.status === "active" && u.id !== excludeId).length;

// ---------- reads (safe summaries) ----------

export async function listUsers(): Promise<UserSummary[]> {
  return (await readDb()).users.map(toSummary).sort((a, b) => a.displayName.localeCompare(b.displayName));
}

export async function getUser(id: string): Promise<UserSummary | null> {
  const u = (await readDb()).users.find((x) => x.id === id);
  return u ? toSummary(u) : null;
}

export async function getUserSettings(userId: string): Promise<UserSettings> {
  const db = await readDb();
  const found = db.userSettings.find((s) => s.userId === userId);
  if (found) return found;
  const now = new Date().toISOString();
  return { ...defaultUserSettings, id: "", userId, createdAt: now, updatedAt: now };
}

export async function getFinancialOwnerId(): Promise<string | null> {
  return (await readDb()).financialOwnerId;
}

export interface UserStats {
  total: number;
  active: number;
  inactive: number;
  admins: number;
  recentlyCreated: UserSummary[];
  recentLogins: UserSummary[];
}

export async function getUserStats(): Promise<UserStats> {
  const users = (await readDb()).users;
  const summaries = users.map(toSummary);
  return {
    total: users.length,
    active: users.filter((u) => u.status === "active").length,
    inactive: users.filter((u) => u.status === "inactive").length,
    admins: users.filter((u) => u.role === "admin").length,
    recentlyCreated: [...summaries].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5),
    recentLogins: summaries.filter((u) => u.lastLoginAt).sort((a, b) => (b.lastLoginAt ?? "").localeCompare(a.lastLoginAt ?? "")).slice(0, 5),
  };
}

// ---------- auth readers (return hashes; used only by lib/auth + login actions) ----------

export async function findUserForAuth(username: string): Promise<DbUser | null> {
  const needle = username.trim().toLowerCase();
  return (await readDb()).users.find((u) => u.username.toLowerCase() === needle) ?? null;
}

export async function getUserForAuth(id: string): Promise<DbUser | null> {
  return (await readDb()).users.find((u) => u.id === id) ?? null;
}

export async function recordLogin(id: string): Promise<void> {
  await mutateDb((db) => {
    const u = db.users.find((x) => x.id === id);
    if (u) u.lastLoginAt = new Date().toISOString();
  });
}

// ---------- mutations ----------

export async function createUser(input: CreateUserInput): Promise<ServiceResult<{ id: string }>> {
  const passwordHash = await hashSecret(input.password);
  const accessCodeHash = input.accessCode ? await hashSecret(normalizeAccessCode(input.accessCode)) : null;
  const hasSecurityQA = !!(input.securityQuestion && input.securityAnswer);
  const securityAnswerHash = hasSecurityQA ? await hashSecret(normalizeSecurityAnswer(input.securityAnswer)) : null;
  return mutateDb<ServiceResult<{ id: string }>>((db) => {
    if (db.users.some((u) => sameName(u.username, input.username))) return fail("That username is already taken.", { username: "That username is already taken." });
    const now = new Date().toISOString();
    const id = randomUUID();
    db.users.push({
      id,
      username: input.username,
      passwordHash,
      accessCodeHash,
      securityQuestion: hasSecurityQA ? input.securityQuestion : null,
      securityAnswerHash,
      securityAnswerUpdatedAt: hasSecurityQA ? now : null,
      displayName: input.displayName,
      businessName: input.businessName,
      email: input.email || null,
      role: input.role,
      status: input.status,
      sessionVersion: 1,
      profilePhotoPath: null,
      profilePhotoMime: null,
      profilePhotoUpdatedAt: null,
      createdAt: now,
      updatedAt: now,
      lastLoginAt: null,
    });
    db.userSettings.push({ ...defaultUserSettings, id: randomUUID(), userId: id, createdAt: now, updatedAt: now });
    return done({ id });
  });
}

export async function updateUserProfile(id: string, input: UserProfileInput, actingAdminId: string): Promise<ServiceResult> {
  return mutateDb<ServiceResult>((db) => {
    const u = db.users.find((x) => x.id === id);
    if (!u) return fail("User not found.");
    if (db.users.some((x) => x.id !== id && sameName(x.username, input.username))) return fail("That username is already taken.", { username: "That username is already taken." });

    const demoting = u.role === "admin" && input.role !== "admin";
    const deactivating = u.status === "active" && input.status === "inactive";
    if (id === actingAdminId && (demoting || deactivating)) return fail("You can’t remove your own administrator access or deactivate your own account.");
    if (u.role === "admin" && u.status === "active" && (demoting || deactivating) && activeAdmins(db, id) === 0) return fail("At least one active administrator is required.");
    if (input.role === "user" && demoting && !u.accessCodeHash) return fail("Set an access code for this account before changing it to the user role.", { role: "Set an access code first (Reset Access Code)." });

    const roleChanged = u.role !== input.role;
    Object.assign(u, {
      displayName: input.displayName,
      businessName: input.businessName,
      email: input.email || null,
      username: input.username,
      role: input.role,
      status: input.status,
      updatedAt: new Date().toISOString(),
    });
    if (roleChanged) u.sessionVersion += 1; // role changes take effect immediately: old sessions stop working
    return done(undefined);
  });
}

export async function updateUserSettings(userId: string, input: EditableUserSettings): Promise<ServiceResult> {
  return mutateDb<ServiceResult>((db) => {
    if (!db.users.some((u) => u.id === userId)) return fail("User not found.");
    const now = new Date().toISOString();
    const existing = db.userSettings.find((s) => s.userId === userId);
    if (existing) Object.assign(existing, input, { updatedAt: now });
    else db.userSettings.push({ ...input, id: randomUUID(), userId, createdAt: now, updatedAt: now });
    return done(undefined);
  });
}

export async function setUserStatus(id: string, status: UserStatus, actingAdminId: string): Promise<ServiceResult> {
  return mutateDb<ServiceResult>((db) => {
    const u = db.users.find((x) => x.id === id);
    if (!u) return fail("User not found.");
    if (status === "inactive") {
      if (id === actingAdminId) return fail("You can’t deactivate your own account.");
      if (u.role === "admin" && u.status === "active" && activeAdmins(db, id) === 0) return fail("At least one active administrator is required.");
    }
    u.status = status;
    u.updatedAt = new Date().toISOString();
    return done(undefined);
  });
}

export async function setUserPassword(id: string, password: string): Promise<ServiceResult> {
  const passwordHash = await hashSecret(password);
  return mutateDb<ServiceResult>((db) => {
    const u = db.users.find((x) => x.id === id);
    if (!u) return fail("User not found.");
    u.passwordHash = passwordHash;
    u.sessionVersion += 1; // signs out existing sessions
    u.updatedAt = new Date().toISOString();
    return done(undefined);
  });
}

export async function setUserAccessCode(id: string, code: string): Promise<ServiceResult> {
  const accessCodeHash = await hashSecret(normalizeAccessCode(code));
  return mutateDb<ServiceResult>((db) => {
    const u = db.users.find((x) => x.id === id);
    if (!u) return fail("User not found.");
    u.accessCodeHash = accessCodeHash;
    u.sessionVersion += 1;
    u.updatedAt = new Date().toISOString();
    return done(undefined);
  });
}

/** Sets or replaces the Step 2 security question + answer together (covers both "save" and "edit/change
 *  answer" — the answer is always re-entered, never pre-filled). Invalidates existing sessions immediately,
 *  same as a password/access-code reset, since this changes how the account is verified. */
export async function setUserSecurityQuestion(id: string, question: string, answer: string): Promise<ServiceResult> {
  const securityAnswerHash = await hashSecret(normalizeSecurityAnswer(answer));
  return mutateDb<ServiceResult>((db) => {
    const u = db.users.find((x) => x.id === id);
    if (!u) return fail("User not found.");
    const now = new Date().toISOString();
    u.securityQuestion = question;
    u.securityAnswerHash = securityAnswerHash;
    u.securityAnswerUpdatedAt = now;
    u.sessionVersion += 1;
    u.updatedAt = now;
    return done(undefined);
  });
}

/** Removes the security question entirely; Step 2 falls back to the private access code. */
export async function removeUserSecurityQuestion(id: string): Promise<ServiceResult> {
  return mutateDb<ServiceResult>((db) => {
    const u = db.users.find((x) => x.id === id);
    if (!u) return fail("User not found.");
    u.securityQuestion = null;
    u.securityAnswerHash = null;
    u.securityAnswerUpdatedAt = null;
    u.sessionVersion += 1;
    u.updatedAt = new Date().toISOString();
    return done(undefined);
  });
}

export async function deleteUser(id: string, actingAdminId: string): Promise<ServiceResult<{ removedPhoto: string | null }>> {
  return mutateDb<ServiceResult<{ removedPhoto: string | null }>>((db) => {
    const u = db.users.find((x) => x.id === id);
    if (!u) return fail("User not found.");
    if (id === actingAdminId) return fail("You can’t delete your own account while signed in.");
    if (u.role === "admin" && u.status === "active" && activeAdmins(db, id) === 0) return fail("At least one active administrator is required.");
    db.users = db.users.filter((x) => x.id !== id);
    db.userSettings = db.userSettings.filter((s) => s.userId !== id);
    return done({ removedPhoto: u.profilePhotoPath ?? null });
  });
}

/** Sets the profile photo (storing only the server-generated filename, never the original). Replaces any previous photo record; the caller is responsible for deleting the old file. */
export async function setUserPhoto(id: string, filename: string, mime: string): Promise<ServiceResult<{ previousPhoto: string | null }>> {
  return mutateDb<ServiceResult<{ previousPhoto: string | null }>>((db) => {
    const u = db.users.find((x) => x.id === id);
    if (!u) return fail("User not found.");
    const previousPhoto = u.profilePhotoPath ?? null;
    u.profilePhotoPath = filename;
    u.profilePhotoMime = mime;
    u.profilePhotoUpdatedAt = new Date().toISOString();
    u.updatedAt = u.profilePhotoUpdatedAt;
    return done({ previousPhoto });
  });
}

export async function clearUserPhoto(id: string): Promise<ServiceResult<{ previousPhoto: string | null }>> {
  return mutateDb<ServiceResult<{ previousPhoto: string | null }>>((db) => {
    const u = db.users.find((x) => x.id === id);
    if (!u) return fail("User not found.");
    const previousPhoto = u.profilePhotoPath ?? null;
    u.profilePhotoPath = null;
    u.profilePhotoMime = null;
    u.profilePhotoUpdatedAt = null;
    u.updatedAt = new Date().toISOString();
    return done({ previousPhoto });
  });
}

// ---------- global user-facing content settings ----------

export async function getContentSettings(): Promise<ContentSettings> {
  return mergeUserContent((await readDb()).contentSettings);
}

export async function saveContentSettings(next: UserContent): Promise<ContentSettings> {
  return mutateDb((db) => {
    db.contentSettings = { ...next, updatedAt: new Date().toISOString() };
    return db.contentSettings;
  });
}

/** Resets exactly one top-level section (e.g. "login") to the approved defaults; every other section is untouched. */
export async function resetContentSection<K extends keyof UserContent>(section: K): Promise<ContentSettings> {
  return mutateDb((db) => {
    const merged = mergeUserContent(db.contentSettings);
    merged[section] = structuredClone(defaultUserContent[section]) as ContentSettings[K];
    merged.updatedAt = new Date().toISOString();
    db.contentSettings = merged;
    return merged;
  });
}

export async function resetAllContent(): Promise<ContentSettings> {
  return mutateDb((db) => {
    db.contentSettings = { ...structuredClone(defaultUserContent), updatedAt: new Date().toISOString() };
    return db.contentSettings;
  });
}

export type { UserRole };
