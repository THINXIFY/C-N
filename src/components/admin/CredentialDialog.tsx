"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { resetAccessCodeAction, resetPasswordAction } from "@/app/actions/admin";
import { PasswordField } from "@/components/auth/PasswordField";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import type { FieldErrors } from "@/lib/settings-validation";
import { validateAccessCodeReset, validatePasswordReset } from "@/lib/user-validation";

export type CredentialKind = "password" | "code";

const copy = {
  password: {
    title: "Reset password",
    noun: "password",
    label: "New Password",
    confirmLabel: "Confirm Password",
    toast: "Password updated",
    helper: "At least 8 characters. The current password can’t be shown. The user is signed out everywhere.",
    cta: "Update Password",
  },
  code: {
    title: "Reset access code",
    noun: "access code",
    label: "New Access Code",
    confirmLabel: "Confirm Access Code",
    toast: "Access code updated",
    helper: "At least 4 characters. The current code can’t be shown. The user is signed out everywhere.",
    cta: "Update Access Code",
  },
} as const;

export function CredentialDialog({
  kind,
  user,
  onClose,
}: {
  kind: CredentialKind | null;
  user: { id: string; displayName: string; username: string } | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [value, setValue] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pending, startTransition] = useTransition();
  const c = kind ? copy[kind] : copy.password;
  const vKey = kind === "code" ? "accessCode" : "password";
  const cKey = kind === "code" ? "confirmAccessCode" : "confirmPassword";

  function close() {
    setValue("");
    setConfirm("");
    setErrors({});
    onClose();
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user || !kind) return;
    const local =
      kind === "code"
        ? validateAccessCodeReset({ accessCode: value, confirmAccessCode: confirm })
        : validatePasswordReset({ password: value, confirmPassword: confirm });
    if (!local.ok) return setErrors(local.errors);
    setErrors({});
    startTransition(async () => {
      const res =
        kind === "code"
          ? await resetAccessCodeAction(user.id, { accessCode: value, confirmAccessCode: confirm })
          : await resetPasswordAction(user.id, { password: value, confirmPassword: confirm });
      if (!res.ok) {
        if (res.fieldErrors) setErrors(res.fieldErrors);
        toast(res.error ?? "Unable to save changes.");
        return;
      }
      toast(c.toast);
      close();
      router.refresh();
    });
  }

  return (
    <Modal open={!!kind && !!user} onClose={close} title={c.title} description={user ? `${user.displayName} · @${user.username}` : undefined}>
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <div>
          <label htmlFor="cred-new" className="mb-1.5 block text-sm font-medium">{c.label}</label>
          <PasswordField id="cred-new" noun={c.noun} autoComplete="new-password" value={value} onChange={(e) => setValue(e.target.value)} aria-invalid={errors[vKey] ? true : undefined} />
          {errors[vKey] && <p className="mt-1.5 text-[13px] text-debit">{errors[vKey]}</p>}
        </div>
        <div>
          <label htmlFor="cred-confirm" className="mb-1.5 block text-sm font-medium">{c.confirmLabel}</label>
          <PasswordField id="cred-confirm" noun={`confirm ${c.noun}`} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} aria-invalid={errors[cKey] ? true : undefined} />
          {errors[cKey] && <p className="mt-1.5 text-[13px] text-debit">{errors[cKey]}</p>}
        </div>
        <p className="text-[13px] leading-snug text-muted">{c.helper}</p>
        <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={close} disabled={pending}>Cancel</Button>
          <Button type="submit" loading={pending}>{pending ? "Saving…" : c.cta}</Button>
        </div>
      </form>
    </Modal>
  );
}
