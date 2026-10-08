// User account model (the "users" and "user_settings" tables).
// DbUser holds hashes and never leaves the server; UserSummary is the safe shape passed to components.

export type UserRole = "user" | "admin";
export type UserStatus = "active" | "inactive";

export interface DbUser {
  id: string;
  username: string;
  passwordHash: string;
  /** Null until set. Required for the user role's second login step; unused by administrators. */
  accessCodeHash: string | null;
  /** Optional per-user Step 2 challenge. When both are set, Step 2 verifies this instead of the access code.
   *  The question text is not sensitive (shown to the user); the answer is never stored in plaintext.
   *  Optional for records predating this field. */
  securityQuestion?: string | null;
  securityAnswerHash?: string | null;
  securityAnswerUpdatedAt?: string | null;
  displayName: string;
  businessName: string;
  email: string | null;
  role: UserRole;
  status: UserStatus;
  /** Bumped on password/access-code reset so existing sessions stop working. */
  sessionVersion: number;
  /** Filename only (not a path) under .data/uploads/users/, served via /avatars/[file]. Optional for records predating this field. */
  profilePhotoPath?: string | null;
  profilePhotoMime?: string | null;
  profilePhotoUpdatedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
}

export interface UserSettings {
  id: string;
  userId: string;
  /** Blank = automatic greeting by time of day. */
  dashboardGreeting: string;
  /** Blank = default subtitle. */
  dashboardSubtitle: string;
  recordStatus: string;
  recordType: string;
  balanceHiddenDefault: boolean;
  showRecordInfo: boolean;
  showQuickActions: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Hash-free view of a user, safe for server components and the browser. */
export interface UserSummary {
  id: string;
  username: string;
  displayName: string;
  businessName: string;
  email: string | null;
  role: UserRole;
  status: UserStatus;
  hasAccessCode: boolean;
  /** The configured question's text — not sensitive, safe to show in the admin UI. Null when none is set. */
  securityQuestion: string | null;
  hasSecurityQuestion: boolean;
  securityAnswerUpdatedAt: string | null;
  profilePhotoPath: string | null;
  profilePhotoUpdatedAt: string | null;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
}

export const DEFAULT_SUBTITLE = "Here’s your latest account overview.";

export interface EditableUserSettings {
  dashboardGreeting: string;
  dashboardSubtitle: string;
  recordStatus: string;
  recordType: string;
  balanceHiddenDefault: boolean;
  showRecordInfo: boolean;
  showQuickActions: boolean;
}

export const defaultUserSettings: EditableUserSettings = {
  dashboardGreeting: "",
  dashboardSubtitle: "",
  recordStatus: "Active / Recorded",
  recordType: "Private Financial Record",
  balanceHiddenDefault: false,
  showRecordInfo: true,
  showQuickActions: true,
};
