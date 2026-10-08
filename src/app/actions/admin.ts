"use server";

import { revalidatePath } from "next/cache";
import type { AppSettings } from "@/data/app-settings";
import type { ContentSettings, UserContent } from "@/data/settings";
import type { DbUser, EditableUserSettings, UserStatus } from "@/data/users";
import { deleteAvatarFile, saveAvatarFile, validatePhotoFile } from "@/lib/avatar-storage";
import { setMaintenanceEstimatedReturn, setMaintenanceMode } from "@/lib/app-settings-service";
import { getCurrentUser } from "@/lib/auth";
import { text } from "@/lib/settings-validation";
import {
  clearUserPhoto,
  createUser,
  deleteUser,
  removeUserSecurityQuestion,
  resetAllContent,
  resetContentSection,
  saveContentSettings,
  setUserAccessCode,
  setUserPassword,
  setUserPhoto,
  setUserSecurityQuestion,
  setUserStatus,
  updateUserProfile,
  updateUserSettings,
} from "@/lib/users-service";
import { validateContent, type FieldErrors } from "@/lib/settings-validation";
import {
  validateAccessCodeReset,
  validateCreateUser,
  validatePasswordReset,
  validateSecurityQuestion,
  validateUserProfile,
  validateUserSettings,
  type CreateUserInput,
  type UserProfileInput,
} from "@/lib/user-validation";

// Admin mutations. Every action re-verifies — against the database — that the caller is a signed-in, active
// administrator; role and user ids from the client are never trusted. Financial data has no mutation here.

export interface SaveResult {
  ok: boolean;
  error?: string;
  fieldErrors?: FieldErrors;
  id?: string;
}

const DENIED: SaveResult = { ok: false, error: "You don’t have permission to do that." };
const FAILED: SaveResult = { ok: false, error: "Unable to save changes." };

async function requireAdminUser(): Promise<DbUser | null> {
  const user = await getCurrentUser();
  return user?.role === "admin" ? user : null;
}

function refreshViews() {
  revalidatePath("/dashboard", "layout");
  revalidatePath("/admin", "layout");
}

const idOk = (id: unknown): id is string => typeof id === "string" && id.length > 0 && id.length <= 64;

export interface ContentSaveResult extends SaveResult {
  settings?: ContentSettings;
}

export async function updateContentSettings(input: UserContent): Promise<ContentSaveResult> {
  if (!(await requireAdminUser())) return DENIED;
  const result = validateContent(input);
  if (!result.ok) return { ok: false, fieldErrors: result.errors };
  let settings: ContentSettings;
  try {
    settings = await saveContentSettings(result.value);
  } catch {
    return FAILED;
  }
  refreshViews();
  return { ok: true, settings };
}

const CONTENT_SECTIONS = ["login", "navigation", "dashboard", "transactions", "account", "support", "messages", "notices", "maintenance"] as const;
type ContentSection = (typeof CONTENT_SECTIONS)[number];

export async function resetContentSectionAction(section: ContentSection): Promise<ContentSaveResult> {
  if (!(await requireAdminUser())) return DENIED;
  if (!CONTENT_SECTIONS.includes(section)) return FAILED;
  try {
    const settings = await resetContentSection(section);
    refreshViews();
    return { ok: true, settings };
  } catch {
    return FAILED;
  }
}

export async function resetAllContentAction(): Promise<ContentSaveResult> {
  if (!(await requireAdminUser())) return DENIED;
  try {
    const settings = await resetAllContent();
    refreshViews();
    return { ok: true, settings };
  } catch {
    return FAILED;
  }
}

// ---------- site availability (maintenance mode) — not part of the CMS ----------

export interface AppSettingsResult extends SaveResult {
  settings?: AppSettings;
}

export async function setMaintenanceModeAction(enabled: boolean): Promise<AppSettingsResult> {
  const admin = await requireAdminUser();
  if (!admin) return DENIED;
  try {
    const settings = await setMaintenanceMode(enabled, admin.displayName);
    refreshViews();
    return { ok: true, settings };
  } catch {
    return FAILED;
  }
}

const ESTIMATED_RETURN_MAX = 80;

export async function setMaintenanceEstimatedReturnAction(estimatedReturn: string): Promise<AppSettingsResult> {
  if (!(await requireAdminUser())) return DENIED;
  const errors: FieldErrors = {};
  const value = text(errors, "estimatedReturn", estimatedReturn, "Estimated return", ESTIMATED_RETURN_MAX, { required: false });
  if (Object.keys(errors).length) return { ok: false, fieldErrors: errors };
  try {
    const settings = await setMaintenanceEstimatedReturn(value);
    refreshViews();
    return { ok: true, settings };
  } catch {
    return FAILED;
  }
}

export async function createUserAction(input: CreateUserInput): Promise<SaveResult> {
  if (!(await requireAdminUser())) return DENIED;
  const result = validateCreateUser(input);
  if (!result.ok) return { ok: false, fieldErrors: result.errors };
  try {
    const created = await createUser(result.value);
    if (!created.ok) return { ok: false, error: created.error, fieldErrors: created.fieldErrors };
    refreshViews();
    return { ok: true, id: created.value.id };
  } catch {
    return { ok: false, error: "Unable to create the user." };
  }
}

export async function updateUserAction(id: string, profile: UserProfileInput, settings: EditableUserSettings): Promise<SaveResult> {
  const admin = await requireAdminUser();
  if (!admin) return DENIED;
  if (!idOk(id)) return FAILED;
  const p = validateUserProfile(profile);
  const s = validateUserSettings(settings);
  if (!p.ok || !s.ok) return { ok: false, fieldErrors: { ...(p.ok ? {} : p.errors), ...(s.ok ? {} : s.errors) } };
  try {
    const saved = await updateUserProfile(id, p.value, admin.id);
    if (!saved.ok) return { ok: false, error: saved.error, fieldErrors: saved.fieldErrors };
    const savedSettings = await updateUserSettings(id, s.value);
    if (!savedSettings.ok) return { ok: false, error: savedSettings.error };
  } catch {
    return FAILED;
  }
  refreshViews();
  return { ok: true };
}

export async function setUserStatusAction(id: string, status: UserStatus): Promise<SaveResult> {
  const admin = await requireAdminUser();
  if (!admin) return DENIED;
  if (!idOk(id) || (status !== "active" && status !== "inactive")) return FAILED;
  try {
    const r = await setUserStatus(id, status, admin.id);
    if (!r.ok) return { ok: false, error: r.error };
  } catch {
    return FAILED;
  }
  refreshViews();
  return { ok: true };
}

export async function resetPasswordAction(id: string, input: { password: string; confirmPassword: string }): Promise<SaveResult> {
  if (!(await requireAdminUser())) return DENIED;
  if (!idOk(id)) return FAILED;
  const v = validatePasswordReset(input);
  if (!v.ok) return { ok: false, fieldErrors: v.errors };
  try {
    const r = await setUserPassword(id, v.value.password);
    if (!r.ok) return { ok: false, error: r.error };
  } catch {
    return FAILED;
  }
  refreshViews();
  return { ok: true };
}

export async function resetAccessCodeAction(id: string, input: { accessCode: string; confirmAccessCode: string }): Promise<SaveResult> {
  if (!(await requireAdminUser())) return DENIED;
  if (!idOk(id)) return FAILED;
  const v = validateAccessCodeReset(input);
  if (!v.ok) return { ok: false, fieldErrors: v.errors };
  try {
    const r = await setUserAccessCode(id, v.value.accessCode);
    if (!r.ok) return { ok: false, error: r.error };
  } catch {
    return FAILED;
  }
  refreshViews();
  return { ok: true };
}

/** Sets/replaces a user's Step 2 security question + answer. Both are always re-submitted together — the
 *  answer is write-only and is never read back, so there's no "change just the question" path that could
 *  leave a stale hash for different wording. */
export async function setUserSecurityQuestionAction(id: string, input: { securityQuestion: string; securityAnswer: string }): Promise<SaveResult> {
  if (!(await requireAdminUser())) return DENIED;
  if (!idOk(id)) return FAILED;
  const v = validateSecurityQuestion(input, { required: true });
  if (!v.ok) return { ok: false, fieldErrors: v.errors };
  try {
    // required: true guarantees both are non-null strings here.
    const r = await setUserSecurityQuestion(id, v.value.securityQuestion!, v.value.securityAnswer!);
    if (!r.ok) return { ok: false, error: r.error };
  } catch {
    return FAILED;
  }
  refreshViews();
  return { ok: true };
}

export async function removeUserSecurityQuestionAction(id: string): Promise<SaveResult> {
  if (!(await requireAdminUser())) return DENIED;
  if (!idOk(id)) return FAILED;
  try {
    const r = await removeUserSecurityQuestion(id);
    if (!r.ok) return { ok: false, error: r.error };
  } catch {
    return FAILED;
  }
  refreshViews();
  return { ok: true };
}

export async function deleteUserAction(id: string): Promise<SaveResult> {
  const admin = await requireAdminUser();
  if (!admin) return DENIED;
  if (!idOk(id)) return FAILED;
  try {
    const r = await deleteUser(id, admin.id);
    if (!r.ok) return { ok: false, error: r.error };
    await deleteAvatarFile(r.value.removedPhoto);
  } catch {
    return { ok: false, error: "Unable to delete the user." };
  }
  refreshViews();
  return { ok: true };
}

export async function uploadUserPhotoAction(id: string, formData: FormData): Promise<SaveResult> {
  if (!(await requireAdminUser())) return DENIED;
  if (!idOk(id)) return FAILED;
  const file = formData.get("photo");
  if (!(file instanceof File)) return { ok: false, error: "Choose an image to upload." };

  const validated = await validatePhotoFile(file);
  if (!validated.ok) return { ok: false, error: validated.error };

  try {
    const filename = await saveAvatarFile(id, validated.bytes, validated.type);
    const r = await setUserPhoto(id, filename, validated.type.mime);
    if (!r.ok) {
      await deleteAvatarFile(filename); // the user record write failed (e.g. deleted mid-upload) — don't leave an orphan file
      return { ok: false, error: r.error };
    }
    await deleteAvatarFile(r.value.previousPhoto); // replacing a photo: drop the old file now that the new one is saved
  } catch {
    return { ok: false, error: "Profile photo upload failed. Please try again." };
  }
  refreshViews();
  return { ok: true };
}

export async function removeUserPhotoAction(id: string): Promise<SaveResult> {
  if (!(await requireAdminUser())) return DENIED;
  if (!idOk(id)) return FAILED;
  try {
    const r = await clearUserPhoto(id);
    if (!r.ok) return { ok: false, error: r.error };
    await deleteAvatarFile(r.value.previousPhoto);
  } catch {
    return { ok: false, error: "Unable to remove the profile photo." };
  }
  refreshViews();
  return { ok: true };
}
