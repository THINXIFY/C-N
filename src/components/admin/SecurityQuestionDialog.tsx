"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition, type FormEvent } from "react";
import { setUserSecurityQuestionAction } from "@/app/actions/admin";
import { PasswordField } from "@/components/auth/PasswordField";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import type { FieldErrors } from "@/lib/settings-validation";
import { userLimits, validateSecurityQuestion } from "@/lib/user-validation";

/** Sets or replaces the Step 2 security question + answer. Always asks for both together — the answer is
 *  write-only and is never pre-filled, so "changing just the question" would otherwise silently leave a stale
 *  answer hash paired with new wording. */
export function SecurityQuestionDialog({
  open,
  user,
  onClose,
}: {
  open: boolean;
  user: { id: string; displayName: string; username: string; securityQuestion: string | null } | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [question, setQuestion] = useState(user?.securityQuestion ?? "");
  const [answer, setAnswer] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pending, startTransition] = useTransition();

  // The dialog stays mounted between opens (only `open`/`user` change), so useState's initial value alone
  // would go stale after the first open. Re-sync from the current user whenever the dialog opens.
  useEffect(() => {
    if (!open) return;
    queueMicrotask(() => {
      setQuestion(user?.securityQuestion ?? "");
      setAnswer("");
      setErrors({});
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally keyed on open+id, not the whole user object
  }, [open, user?.id]);

  function close() {
    setAnswer("");
    setErrors({});
    onClose();
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    const local = validateSecurityQuestion({ securityQuestion: question, securityAnswer: answer }, { required: true });
    if (!local.ok) return setErrors(local.errors);
    setErrors({});
    startTransition(async () => {
      const res = await setUserSecurityQuestionAction(user.id, {
        securityQuestion: local.value.securityQuestion!,
        securityAnswer: local.value.securityAnswer!,
      });
      if (!res.ok) {
        if (res.fieldErrors) setErrors(res.fieldErrors);
        toast(res.error ?? "Unable to save changes.");
        return;
      }
      toast("Security question configured");
      close();
      router.refresh();
    });
  }

  return (
    <Modal
      open={open && !!user}
      onClose={close}
      title={user?.securityQuestion ? "Edit security question" : "Set security question"}
      description={user ? `${user.displayName} · @${user.username}` : undefined}
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <div>
          <label htmlFor="secq-question" className="mb-1.5 block text-sm font-medium">Security Question</label>
          <input
            id="secq-question"
            value={question}
            onChange={(e) => {
              setQuestion(e.target.value);
              if (errors.securityQuestion) setErrors((er) => ({ ...er, securityQuestion: "" }));
            }}
            placeholder="e.g. Mother's Maiden Name"
            maxLength={userLimits.securityQuestionMax}
            aria-invalid={errors.securityQuestion ? true : undefined}
            className="h-12 w-full rounded-xl border border-line bg-white px-3.5 text-[15px] text-ink placeholder:text-muted/70 transition-[border-color,box-shadow] duration-150 focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15 aria-[invalid=true]:border-debit aria-[invalid=true]:focus:ring-debit/15"
          />
          {errors.securityQuestion && <p className="mt-1.5 text-[13px] text-debit">{errors.securityQuestion}</p>}
        </div>
        <div>
          <label htmlFor="secq-answer" className="mb-1.5 block text-sm font-medium">Security Answer</label>
          <PasswordField
            id="secq-answer"
            noun="security answer"
            autoComplete="off"
            value={answer}
            onChange={(e) => {
              setAnswer(e.target.value);
              if (errors.securityAnswer) setErrors((er) => ({ ...er, securityAnswer: "" }));
            }}
            placeholder="Enter a new answer"
            aria-invalid={errors.securityAnswer ? true : undefined}
          />
          {errors.securityAnswer && <p className="mt-1.5 text-[13px] text-debit">{errors.securityAnswer}</p>}
        </div>
        <p className="text-[13px] leading-snug text-muted">
          The answer will be securely stored and cannot be viewed after saving. Saving signs this user out everywhere, so the change takes effect immediately.
        </p>
        <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={close} disabled={pending}>Cancel</Button>
          <Button type="submit" loading={pending}>{pending ? "Saving…" : "Save Security Question"}</Button>
        </div>
      </form>
    </Modal>
  );
}
