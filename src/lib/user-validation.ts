// Pure validation for user management. Shared by the forms (instant feedback) and the server actions (authoritative).
import { STATUS_OPTIONS } from "@/data/settings";
import type { EditableUserSettings, UserRole, UserStatus } from "@/data/users";
import { clean, text, type FieldErrors, type Validated } from "./settings-validation";

export const userLimits = {
  displayName: 80,
  businessName: 120,
  email: 120,
  usernameMin: 3,
  usernameMax: 40,
  passwordMin: 8,
  passwordMax: 128,
  codeMin: 4,
  codeMax: 64,
  securityQuestionMax: 120,
  securityAnswerMin: 2,
  securityAnswerMax: 128,
  greeting: 80,
  subtitle: 160,
  recordType: 80,
} as const;

const USERNAME_RE = /^[A-Za-z0-9._-]+$/;
const EMAIL_RE = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;

export interface UserProfileInput {
  displayName: string;
  businessName: string;
  email: string;
  username: string;
  role: UserRole;
  status: UserStatus;
}

function validateIdentity(errors: FieldErrors, input: Partial<UserProfileInput>) {
  const displayName = text(errors, "displayName", input.displayName, "Display name", userLimits.displayName);
  const businessName = text(errors, "businessName", input.businessName, "Business / organization", userLimits.businessName);
  const email = text(errors, "email", input.email, "Email", userLimits.email, { required: false });
  if (email && !errors.email && !EMAIL_RE.test(email)) errors.email = "Enter a valid email address.";

  const username = clean(input.username);
  if (!username) errors.username = "Username is required.";
  else if (username.length < userLimits.usernameMin || username.length > userLimits.usernameMax)
    errors.username = `Username must be ${userLimits.usernameMin}–${userLimits.usernameMax} characters.`;
  else if (!USERNAME_RE.test(username)) errors.username = "Use letters, numbers, dots, dashes and underscores only.";

  const role = input.role;
  if (role !== "user" && role !== "admin") errors.role = "Choose a role.";
  const status = input.status;
  if (status !== "active" && status !== "inactive") errors.status = "Choose a status.";

  return { displayName, businessName, email, username, role: role as UserRole, status: status as UserStatus };
}

export function validateSecret(
  errors: FieldErrors,
  keys: { value: string; confirm: string },
  raw: { value?: string; confirm?: string },
  label: string,
  min: number,
  max: number,
  required = true,
) {
  const value = typeof raw.value === "string" ? raw.value : "";
  const confirm = typeof raw.confirm === "string" ? raw.confirm : "";
  if (!value && !required) return "";
  if (!value) errors[keys.value] = `${label} is required.`;
  else if (value.trim().length < min) errors[keys.value] = `${label} must be at least ${min} characters.`;
  else if (value.length > max) errors[keys.value] = `${label} must be ${max} characters or fewer.`;
  else if (confirm !== value) errors[keys.confirm] = `${label}s don’t match.`;
  return value;
}

export interface CreateUserInput extends UserProfileInput {
  password: string;
  confirmPassword: string;
  accessCode: string;
  confirmAccessCode: string;
  securityQuestion: string;
  securityAnswer: string;
}

export function validateCreateUser(input: Partial<CreateUserInput>): Validated<CreateUserInput> {
  const errors: FieldErrors = {};
  const id = validateIdentity(errors, input);
  const password = validateSecret(errors, { value: "password", confirm: "confirmPassword" }, { value: input.password, confirm: input.confirmPassword }, "Password", userLimits.passwordMin, userLimits.passwordMax);
  // Administrators sign in with username + password only; the access code is required for the user role.
  const accessCode = validateSecret(errors, { value: "accessCode", confirm: "confirmAccessCode" }, { value: input.accessCode, confirm: input.confirmAccessCode }, "Access code", userLimits.codeMin, userLimits.codeMax, id.role !== "admin");
  // Optional: a user may be created with no security question at all.
  const sq = validateSecurityQuestion({ securityQuestion: input.securityQuestion, securityAnswer: input.securityAnswer }, { required: false });
  if (!sq.ok) Object.assign(errors, sq.errors);
  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    value: {
      ...id,
      password,
      confirmPassword: password,
      accessCode,
      confirmAccessCode: accessCode,
      securityQuestion: sq.ok ? (sq.value.securityQuestion ?? "") : "",
      securityAnswer: sq.ok ? (sq.value.securityAnswer ?? "") : "",
    },
  };
}

/**
 * Validates the Step 2 security-question pair. With `required: false` (the create-user form, where this is
 * optional), leaving both fields blank is valid and resolves to `null`/`null`; filling only one is still an
 * error. With `required: true` (the admin edit dialog, which always re-asserts both together), both must be
 * non-empty. The answer is trimmed here; case-insensitive comparison happens at verification time.
 */
export function validateSecurityQuestion(
  input: { securityQuestion?: string; securityAnswer?: string },
  opts: { required?: boolean } = {},
): Validated<{ securityQuestion: string | null; securityAnswer: string | null }> {
  const errors: FieldErrors = {};
  const question = clean(input.securityQuestion);
  const answer = typeof input.securityAnswer === "string" ? input.securityAnswer.trim() : "";

  if (!question && !answer && !opts.required) return { ok: true, value: { securityQuestion: null, securityAnswer: null } };

  if (!question) errors.securityQuestion = "Security question is required.";
  else if (question.length > userLimits.securityQuestionMax) errors.securityQuestion = `Security question must be ${userLimits.securityQuestionMax} characters or fewer.`;
  else if (/[<>]/.test(question)) errors.securityQuestion = "Security question can’t contain < or >.";

  if (!answer) errors.securityAnswer = "Security answer is required.";
  else if (answer.length < userLimits.securityAnswerMin) errors.securityAnswer = `Security answer must be at least ${userLimits.securityAnswerMin} characters.`;
  else if (answer.length > userLimits.securityAnswerMax) errors.securityAnswer = `Security answer must be ${userLimits.securityAnswerMax} characters or fewer.`;

  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, value: { securityQuestion: question, securityAnswer: answer } };
}

export function validateUserProfile(input: Partial<UserProfileInput>): Validated<UserProfileInput> {
  const errors: FieldErrors = {};
  const id = validateIdentity(errors, input);
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, value: id };
}

export function validateUserSettings(input: Partial<EditableUserSettings>): Validated<EditableUserSettings> {
  const errors: FieldErrors = {};
  const dashboardGreeting = text(errors, "dashboardGreeting", input.dashboardGreeting, "Greeting", userLimits.greeting, { required: false });
  const dashboardSubtitle = text(errors, "dashboardSubtitle", input.dashboardSubtitle, "Subtitle", userLimits.subtitle, { required: false });
  const recordType = text(errors, "recordType", input.recordType, "Record type", userLimits.recordType);
  const recordStatus = clean(input.recordStatus);
  if (!(STATUS_OPTIONS as readonly string[]).includes(recordStatus)) errors.recordStatus = "Choose a valid record status.";
  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    value: {
      dashboardGreeting,
      dashboardSubtitle,
      recordStatus,
      recordType,
      balanceHiddenDefault: input.balanceHiddenDefault === true,
      showRecordInfo: input.showRecordInfo !== false,
      showQuickActions: input.showQuickActions !== false,
    },
  };
}

export function validatePasswordReset(input: { password?: string; confirmPassword?: string }): Validated<{ password: string }> {
  const errors: FieldErrors = {};
  const password = validateSecret(errors, { value: "password", confirm: "confirmPassword" }, { value: input.password, confirm: input.confirmPassword }, "Password", userLimits.passwordMin, userLimits.passwordMax);
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, value: { password } };
}

export function validateAccessCodeReset(input: { accessCode?: string; confirmAccessCode?: string }): Validated<{ accessCode: string }> {
  const errors: FieldErrors = {};
  const accessCode = validateSecret(errors, { value: "accessCode", confirm: "confirmAccessCode" }, { value: input.accessCode, confirm: input.confirmAccessCode }, "Access code", userLimits.codeMin, userLimits.codeMax);
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, value: { accessCode } };
}
