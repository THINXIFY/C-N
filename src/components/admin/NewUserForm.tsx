"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { createUserAction, uploadUserPhotoAction } from "@/app/actions/admin";
import { PasswordField } from "@/components/auth/PasswordField";
import { Button } from "@/components/ui/Button";
import { buttonClass } from "@/components/ui/button-styles";
import { useToast } from "@/components/ui/Toast";
import type { UserRole, UserStatus } from "@/data/users";
import type { FieldErrors } from "@/lib/settings-validation";
import { userLimits, validateCreateUser, type CreateUserInput } from "@/lib/user-validation";
import { AdminSection } from "./AdminSection";
import { SelectInput, TextField } from "./fields";
import { PhotoPickerField } from "./PhotoPickerField";

const empty: CreateUserInput = {
  displayName: "",
  businessName: "",
  email: "",
  username: "",
  role: "user",
  status: "active",
  password: "",
  confirmPassword: "",
  accessCode: "",
  confirmAccessCode: "",
  securityQuestion: "",
  securityAnswer: "",
};

function SecretField({ id, label, value, onChange, error, noun }: { id: string; label: string; value: string; onChange: (v: string) => void; error?: string; noun: string }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">{label}</label>
      <PasswordField id={id} noun={noun} autoComplete="new-password" value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={error ? true : undefined} />
      {error && <p className="mt-1.5 text-[13px] text-debit">{error}</p>}
    </div>
  );
}

export function NewUserForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [form, setForm] = useState(empty);
  const [photo, setPhoto] = useState<File | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pending, startTransition] = useTransition();

  const set = <K extends keyof CreateUserInput>(k: K) => (v: CreateUserInput[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: "" }));
  };
  const isAdmin = form.role === "admin";

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const local = validateCreateUser(form);
    if (!local.ok) {
      setErrors(local.errors);
      toast("Please fix the highlighted fields");
      return;
    }
    setErrors({});
    startTransition(async () => {
      const res = await createUserAction(form);
      if (!res.ok) {
        if (res.fieldErrors) setErrors(res.fieldErrors);
        toast(res.error ?? "Unable to create the user.");
        return;
      }
      if (photo && res.id) {
        const fd = new FormData();
        fd.set("photo", photo);
        const photoRes = await uploadUserPhotoAction(res.id, fd);
        if (!photoRes.ok) toast(`User created, but the photo couldn’t be saved: ${photoRes.error ?? "unknown error"}`);
        else toast("User created");
      } else {
        toast("User created");
      }
      router.push(`/admin/users/${res.id}`);
    });
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <AdminSection title="Profile" description="Who this account belongs to.">
        <div className="grid gap-5 md:grid-cols-2">
          <TextField label="Display Name" value={form.displayName} onChange={set("displayName")} error={errors.displayName} max={userLimits.displayName} />
          <TextField label="Business / Organization" value={form.businessName} onChange={set("businessName")} error={errors.businessName} max={userLimits.businessName} />
          <TextField label="Email" optional type="email" autoComplete="off" value={form.email} onChange={set("email")} error={errors.email} max={userLimits.email} />
        </div>
        <div className="mt-5">
          <PhotoPickerField onChange={setPhoto} />
        </div>
      </AdminSection>

      <AdminSection title="Access" description="How this person signs in.">
        <div className="grid gap-5 md:grid-cols-2">
          <TextField label="Username" autoComplete="off" value={form.username} onChange={set("username")} error={errors.username} max={userLimits.usernameMax} helper="Letters, numbers, dots, dashes and underscores. Must be unique." />
          <div className="hidden md:block" />
          <SecretField id="nu-pass" label="Password" noun="password" value={form.password} onChange={set("password")} error={errors.password} />
          <SecretField id="nu-pass2" label="Confirm Password" noun="confirm password" value={form.confirmPassword} onChange={set("confirmPassword")} error={errors.confirmPassword} />
          <SecretField id="nu-code" label={isAdmin ? "Access Code (optional)" : "Access Code"} noun="access code" value={form.accessCode} onChange={set("accessCode")} error={errors.accessCode} />
          <SecretField id="nu-code2" label="Confirm Access Code" noun="confirm access code" value={form.confirmAccessCode} onChange={set("confirmAccessCode")} error={errors.confirmAccessCode} />
        </div>
        <p className="mt-3 text-[13px] leading-snug text-muted">
          Passwords and access codes are stored as one-way hashes and can’t be viewed later — only reset.
          {isAdmin ? " Administrators sign in with username and password only." : " Users enter the access code as a second sign-in step."}
        </p>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <SelectInput label="Role" value={form.role} onChange={(v) => set("role")(v as UserRole)} error={errors.role} options={[{ value: "user", label: "User — dashboard access" }, { value: "admin", label: "Admin — administration panel" }]} />
          <SelectInput label="Status" value={form.status} onChange={(v) => set("status")(v as UserStatus)} error={errors.status} options={[{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }]} />
        </div>
      </AdminSection>

      <AdminSection title="Security Verification" description="Optional. An alternative Step 2 challenge — leave both fields blank to use the private access code instead.">
        <div className="grid gap-5 md:grid-cols-2">
          <TextField
            label="Security Question"
            optional
            value={form.securityQuestion}
            onChange={set("securityQuestion")}
            error={errors.securityQuestion}
            max={userLimits.securityQuestionMax}
            placeholder="e.g. Mother's Maiden Name"
          />
          <SecretField id="nu-secanswer" label="Security Answer" noun="security answer" value={form.securityAnswer} onChange={set("securityAnswer")} error={errors.securityAnswer} />
        </div>
      </AdminSection>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link href="/admin/users" className={buttonClass("secondary")}>Cancel</Link>
        <Button type="submit" loading={pending}>{pending ? "Creating…" : "Create User"}</Button>
      </div>
    </form>
  );
}
