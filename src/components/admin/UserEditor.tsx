"use client";

import { Lock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { removeUserSecurityQuestionAction, updateUserAction } from "@/app/actions/admin";
import { Button } from "@/components/ui/Button";
import { buttonClass } from "@/components/ui/button-styles";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { STATUS_OPTIONS } from "@/data/settings";
import type { EditableUserSettings, UserRole, UserStatus, UserSummary } from "@/data/users";
import type { FieldErrors } from "@/lib/settings-validation";
import { formatDateTime, formatLastLogin } from "@/lib/format";
import { userLimits, validateUserProfile, validateUserSettings, type UserProfileInput } from "@/lib/user-validation";
import { AdminSection } from "./AdminSection";
import { CredentialDialog, type CredentialKind } from "./CredentialDialog";
import { DeleteUserDialog } from "./DeleteUserDialog";
import { SaveBar, SelectInput, TextField, ToggleField } from "./fields";
import { ProfilePhotoManager } from "./ProfilePhotoManager";
import { SecurityQuestionDialog } from "./SecurityQuestionDialog";

interface Props {
  user: UserSummary;
  settings: EditableUserSettings;
  isSelf: boolean;
  /** Read-only financial summary text if this account owns the record, otherwise null. */
  financial: { balance: string; count: number } | null;
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-1 break-words text-sm font-medium">{children}</dd>
    </div>
  );
}

export function UserEditor({ user, settings, isSelf, financial }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const toProfile = (u: UserSummary): UserProfileInput => ({
    displayName: u.displayName,
    businessName: u.businessName,
    email: u.email ?? "",
    username: u.username,
    role: u.role,
    status: u.status,
  });
  const [saved, setSaved] = useState({ profile: toProfile(user), settings });
  const [profile, setProfile] = useState(saved.profile);
  const [prefs, setPrefs] = useState(saved.settings);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pending, startTransition] = useTransition();
  const [cred, setCred] = useState<CredentialKind | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [secOpen, setSecOpen] = useState(false);
  const [removingSec, setRemovingSec] = useState(false);
  const [removeSecPending, startRemoveSecTransition] = useTransition();

  function removeSecurityQuestion() {
    startRemoveSecTransition(async () => {
      const res = await removeUserSecurityQuestionAction(user.id);
      if (!res.ok) {
        toast(res.error ?? "Unable to save changes.");
        return;
      }
      toast("Security question removed");
      setRemovingSec(false);
      router.refresh();
    });
  }

  const dirty = JSON.stringify({ profile, settings: prefs }) !== JSON.stringify(saved);
  const clearErr = (k: string) => errors[k] && setErrors((e) => ({ ...e, [k]: "" }));
  const setP = <K extends keyof UserProfileInput>(k: K) => (v: UserProfileInput[K]) => {
    setProfile((p) => ({ ...p, [k]: v }));
    clearErr(k);
  };
  const setS = <K extends keyof EditableUserSettings>(k: K) => (v: EditableUserSettings[K]) => {
    setPrefs((p) => ({ ...p, [k]: v }));
    clearErr(k);
  };

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const p = validateUserProfile(profile);
    const s = validateUserSettings(prefs);
    if (!p.ok || !s.ok) {
      setErrors({ ...(p.ok ? {} : p.errors), ...(s.ok ? {} : s.errors) });
      toast("Please fix the highlighted fields");
      return;
    }
    setErrors({});
    startTransition(async () => {
      const res = await updateUserAction(user.id, profile, prefs);
      if (!res.ok) {
        if (res.fieldErrors) setErrors(res.fieldErrors);
        toast(res.error ?? "Unable to save changes.");
        return;
      }
      setSaved({ profile, settings: prefs });
      toast("User updated");
      router.refresh();
    });
  }

  return (
    <>
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <AdminSection title="Profile" description="Identity and organization shown on this user’s dashboard.">
          <div className="grid gap-5 md:grid-cols-2">
            <TextField label="Display Name" value={profile.displayName} onChange={setP("displayName")} error={errors.displayName} max={userLimits.displayName} />
            <TextField label="Business / Organization" value={profile.businessName} onChange={setP("businessName")} error={errors.businessName} max={userLimits.businessName} />
            <TextField label="Email" optional type="email" autoComplete="off" value={profile.email} onChange={setP("email")} error={errors.email} max={userLimits.email} />
          </div>
        </AdminSection>

        <AdminSection title="Access" description="Username, role and whether this account can sign in.">
          <div className="grid gap-5 md:grid-cols-3">
            <TextField label="Username" autoComplete="off" value={profile.username} onChange={setP("username")} error={errors.username} max={userLimits.usernameMax} />
            <SelectInput
              label="Role"
              value={profile.role}
              onChange={(v) => setP("role")(v as UserRole)}
              error={errors.role}
              disabled={isSelf}
              helper={isSelf ? "You can’t change your own role." : undefined}
              options={[{ value: "user", label: "User" }, { value: "admin", label: "Admin" }]}
            />
            <SelectInput
              label="Status"
              value={profile.status}
              onChange={(v) => setP("status")(v as UserStatus)}
              error={errors.status}
              disabled={isSelf}
              helper={isSelf ? "You can’t deactivate yourself." : undefined}
              options={[{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }]}
            />
          </div>
        </AdminSection>

        <AdminSection title="Dashboard Settings" description="Presentation options for this user only.">
          <div className="grid gap-5 md:grid-cols-2">
            <TextField label="Greeting" optional value={prefs.dashboardGreeting} onChange={setS("dashboardGreeting")} error={errors.dashboardGreeting} max={userLimits.greeting} helper="Leave blank to greet automatically by time of day." />
            <TextField label="Subtitle" optional value={prefs.dashboardSubtitle} onChange={setS("dashboardSubtitle")} error={errors.dashboardSubtitle} max={userLimits.subtitle} helper="Leave blank for the default subtitle." />
            <SelectInput label="Record Status" value={prefs.recordStatus} onChange={setS("recordStatus")} options={STATUS_OPTIONS} error={errors.recordStatus} />
            <TextField label="Record Type" value={prefs.recordType} onChange={setS("recordType")} error={errors.recordType} max={userLimits.recordType} />
          </div>
          <div className="mt-4 divide-y divide-line border-t border-line">
            <ToggleField label="Balance hidden by default" helper="The user can still reveal it with the eye button." checked={prefs.balanceHiddenDefault} onChange={setS("balanceHiddenDefault")} />
            <ToggleField label="Show record information" checked={prefs.showRecordInfo} onChange={setS("showRecordInfo")} />
            <ToggleField label="Show quick actions" checked={prefs.showQuickActions} onChange={setS("showQuickActions")} />
          </div>
        </AdminSection>

        <SaveBar dirty={dirty} saving={pending} saveLabel="Save Changes" onReset={() => { setProfile(saved.profile); setPrefs(saved.settings); setErrors({}); }} />
      </form>

      <div className="mt-5 space-y-5">
        <AdminSection title="Profile Photo">
          <ProfilePhotoManager userId={user.id} displayName={user.displayName} photoPath={user.profilePhotoPath} />
        </AdminSection>

        <AdminSection title="Password & Access Code" description="Current values can’t be viewed — only replaced. Resetting signs the user out everywhere.">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted">
              Access code: <span className="font-medium text-ink">{user.hasAccessCode ? "set" : "not set"}</span>
              {user.role === "admin" && " · not used for administrator sign-in"}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button type="button" variant="secondary" onClick={() => setCred("password")}>Reset Password</Button>
              <Button type="button" variant="secondary" onClick={() => setCred("code")}>Reset Access Code</Button>
            </div>
          </div>
        </AdminSection>

        <AdminSection
          title="Security Verification"
          description="An optional Step 2 question + answer challenge for this user. The answer can’t be viewed after saving — only replaced."
        >
          {user.securityQuestion ? (
            <div className="space-y-4">
              <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-3">
                <div className="min-w-0">
                  <dt className="text-xs text-muted">Question</dt>
                  <dd className="mt-1 break-words text-sm font-medium">{user.securityQuestion}</dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-xs text-muted">Answer</dt>
                  <dd className="mt-1 text-sm font-medium">Configured</dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-xs text-muted">Last updated</dt>
                  <dd className="mt-1 text-sm font-medium">{user.securityAnswerUpdatedAt ? formatDateTime(user.securityAnswerUpdatedAt) : "—"}</dd>
                </div>
              </dl>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button type="button" variant="secondary" onClick={() => setSecOpen(true)}>Edit</Button>
                <button
                  type="button"
                  onClick={() => setRemovingSec(true)}
                  className="inline-flex h-11 items-center justify-center rounded-[10px] border border-debit/30 bg-white px-5 text-sm font-medium text-debit transition-colors hover:bg-debit-soft sm:w-auto"
                >
                  Remove Security Question
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted">No security question configured. Step 2 uses the private access code for this user.</p>
              <Button type="button" variant="secondary" onClick={() => setSecOpen(true)}>Save Security Question</Button>
            </div>
          )}
        </AdminSection>

        <AdminSection
          title="Financial Record — Read Only"
          description="Financial record values cannot be changed from the administration panel."
          badge={
            <span className="inline-flex items-center gap-1.5 rounded-full bg-canvas px-2.5 py-1 text-xs font-medium text-muted">
              <Lock className="h-3 w-3" aria-hidden="true" /> Read only
            </span>
          }
        >
          {financial ? (
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
              <p className="text-muted">
                This account owns the recorded financial record: <span className="tabular font-medium text-ink">{financial.balance}</span> recorded balance · {financial.count} transactions.
              </p>
              <Link href="/admin/transactions" className="-my-2 inline-flex min-h-11 items-center font-medium text-brand-dark hover:underline">Browse transactions</Link>
            </div>
          ) : (
            <p className="text-sm text-muted">No financial record is linked to this account.</p>
          )}
        </AdminSection>

        <AdminSection title="Login Activity & System">
          <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
            <Info label="Last login">{formatLastLogin(user.lastLoginAt)}</Info>
            <Info label="Created">{formatDateTime(user.createdAt)}</Info>
            <Info label="Last updated">{formatDateTime(user.updatedAt)}</Info>
            <Info label="User ID"><span className="break-all font-mono text-xs">{user.id}</span></Info>
          </dl>
        </AdminSection>

        <section aria-labelledby="danger-h" className="rounded-2xl border border-debit/25 bg-white px-5 py-5 sm:px-6">
          <h2 id="danger-h" className="text-[15px] font-semibold text-debit">Delete user</h2>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted">
              {isSelf ? "You can’t delete your own account while signed in." : "Permanently remove this account and its presentation settings."}
            </p>
            <button
              type="button"
              disabled={isSelf}
              onClick={() => setDeleting(true)}
              className="inline-flex h-11 items-center justify-center rounded-[10px] border border-debit/30 bg-white px-5 text-sm font-medium text-debit transition-colors hover:bg-debit-soft disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white"
            >
              Delete User…
            </button>
          </div>
        </section>
      </div>

      <CredentialDialog kind={cred} user={cred ? user : null} onClose={() => setCred(null)} />
      <DeleteUserDialog user={deleting ? user : null} onClose={() => setDeleting(false)} onDeleted={() => router.replace("/admin/users")} />
      <SecurityQuestionDialog open={secOpen} user={secOpen ? user : null} onClose={() => setSecOpen(false)} />

      <Modal
        open={removingSec}
        onClose={() => !removeSecPending && setRemovingSec(false)}
        title="Remove security question?"
        description="This user will no longer be asked this question during verification."
      >
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={() => setRemovingSec(false)} disabled={removeSecPending}>Cancel</Button>
          <button onClick={removeSecurityQuestion} disabled={removeSecPending} className={buttonClass("danger")}>
            {removeSecPending ? "Removing…" : "Remove"}
          </button>
        </div>
      </Modal>
    </>
  );
}
