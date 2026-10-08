"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, ArrowLeft, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { cancelPendingAction, loginAction, verifyAccessCodeAction, type LoginResult } from "@/app/actions/auth";
import { Button } from "@/components/ui/Button";
import { flashToast } from "@/components/ui/Toast";
import type { LoginContent } from "@/data/settings";
import type { Role } from "@/lib/session";
import { PasswordField } from "./PasswordField";

type Step = "credentials" | "code";

const EASE = [0.22, 0.61, 0.36, 1] as const;

const inputCls =
  "h-[50px] w-full rounded-xl border border-line bg-white pl-11 pr-4 text-[15px] text-ink placeholder:text-muted/70 transition-[border-color,box-shadow] duration-200 ease-out hover:border-[#cfd8d3] focus:border-brand focus:outline-none focus:ring-[3px] focus:ring-brand/15 aria-[invalid=true]:border-debit aria-[invalid=true]:focus:ring-debit/15";

// Step 1 slides out to the left and step 2 in from the right (reversed when going back).
const stepVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 14 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir * -14 }),
};

function StepIndicator({ step }: { step: Step }) {
  const n = step === "credentials" ? 1 : 2;
  return (
    <div className="mb-6 flex items-center gap-3" role="group" aria-label={`Step ${n} of 2`}>
      <div className="flex gap-1.5" aria-hidden="true">
        <span className="h-1 w-7 rounded-full bg-brand" />
        <span className={`h-1 w-7 rounded-full transition-colors duration-300 ease-out ${n === 2 ? "bg-brand" : "bg-line"}`} />
      </div>
      <p className="text-xs font-medium text-muted">
        Step {n} of 2 <span className="mx-1 text-line">·</span>
        <span className="text-ink/80">{n === 1 ? "Sign In" : "Security Verification"}</span>
      </p>
    </div>
  );
}

interface Props {
  role: Role;
  title: string;
  subtitle: string;
  /** User-side only: admin-editable field labels/buttons. The admin login page never passes this, so its wording never changes. */
  content?: LoginContent;
  signedInToast?: string;
}

export function LoginForm({ role, title, subtitle, content, signedInToast = "Signed in successfully" }: Props) {
  const router = useRouter();
  const twoStep = role === "user";
  const [step, setStep] = useState<Step>("credentials");
  const [dir, setDir] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  const heading =
    step === "code"
      ? { title: content?.securityTitle ?? "Security Verification", subtitle: content?.securitySubtitle ?? "Enter your private access code to continue." }
      : { title, subtitle };

  function finish(res: LoginResult) {
    setDone(true);
    flashToast(signedInToast);
    router.replace(res.redirectTo ?? "/dashboard");
  }

  function goTo(next: Step) {
    setDir(next === "code" ? 1 : -1);
    setError(null);
    setStep(next);
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);

    if (step === "credentials") {
      if (!String(data.get("username") ?? "").trim() || !data.get("password")) {
        setError("Enter your username and password.");
        return;
      }
      setError(null);
      startTransition(async () => {
        const res = await loginAction(role, data);
        if (!res.ok) return setError(res.error ?? "Unable to sign in.");
        if (res.step === "code") return goTo("code");
        finish(res);
      });
      return;
    }

    if (!String(data.get("code") ?? "").trim()) {
      setError("Enter your private access code.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await verifyAccessCodeAction(data);
      if (!res.ok) {
        setError(res.error ?? "Unable to verify.");
        if (res.error?.includes("expired")) goTo("credentials");
        return;
      }
      finish(res);
    });
  }

  async function back() {
    await cancelPendingAction();
    goTo("credentials");
  }

  const invalid = error ? true : undefined;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: EASE }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.16, ease: EASE }}
          >
            <h2 className="text-2xl font-semibold tracking-tight sm:text-[28px]">{heading.title}</h2>
            <p className="mt-2 text-[15px] text-muted">{heading.subtitle}</p>
          </motion.div>
        </AnimatePresence>
      </motion.div>

      <motion.div
        className="mt-7 sm:mt-8 lg:rounded-2xl lg:border lg:border-line lg:bg-white lg:p-8 lg:shadow-[0_1px_2px_rgba(23,32,28,.04)]"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.08, ease: EASE }}
      >
        {twoStep && <StepIndicator step={step} />}

        <AnimatePresence mode="wait" initial={false} custom={dir}>
          <motion.form
            key={step}
            custom={dir}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.2, ease: EASE }}
            onSubmit={onSubmit}
            noValidate
            className="space-y-5"
          >
            <AnimatePresence initial={false}>
              {error && (
                <motion.div
                  role="alert"
                  initial={{ opacity: 0, height: 0, y: -4 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2, ease: EASE }}
                  className="overflow-hidden"
                >
                  <div className="flex items-center gap-2.5 rounded-xl border border-debit/20 bg-debit-soft px-4 py-3 text-sm text-debit">
                    <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {error}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {step === "credentials" ? (
              <>
                <div>
                  <label htmlFor="username" className="mb-2 block text-sm font-medium">
                    {content?.usernameLabel ?? "Username"}
                  </label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted" aria-hidden="true" />
                    <input
                      id="username"
                      name="username"
                      autoComplete="username"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      autoFocus
                      placeholder={content?.usernamePlaceholder ?? "Enter your username"}
                      aria-invalid={invalid}
                      className={inputCls}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="mb-2 block text-sm font-medium">
                    {content?.passwordLabel ?? "Password"}
                  </label>
                  <PasswordField
                    id="password"
                    name="password"
                    autoComplete="current-password"
                    placeholder={content?.passwordPlaceholder ?? "Enter your password"}
                    aria-invalid={invalid}
                  />
                </div>

                <label className="-my-1 flex min-h-11 cursor-pointer items-center gap-3 text-sm text-muted select-none">
                  <input type="checkbox" name="remember" className="h-[18px] w-[18px] rounded border-line accent-brand" />
                  {content?.rememberMeLabel ?? "Remember me on this device"}
                </label>

                <Button type="submit" loading={pending || done} className="h-[50px] w-full text-[15px]">
                  {done ? "Opening dashboard…" : pending ? "Signing in…" : (content?.continueButton ?? (twoStep ? "Continue" : "Sign in"))}
                </Button>
              </>
            ) : (
              <>
                <div>
                  <label htmlFor="code" className="mb-2 block text-sm font-medium">
                    {content?.accessCodeLabel ?? "Private access code"}
                  </label>
                  <PasswordField
                    id="code"
                    name="code"
                    noun="access code"
                    autoComplete="off"
                    autoFocus
                    placeholder={content?.accessCodePlaceholder ?? "Enter your access code"}
                    aria-invalid={invalid}
                  />
                </div>

                <Button type="submit" loading={pending || done} className="h-[50px] w-full text-[15px]">
                  {done ? "Opening dashboard…" : pending ? "Verifying…" : (content?.verifyButton ?? "Verify & Sign In")}
                </Button>
                <button
                  type="button"
                  onClick={back}
                  disabled={pending || done}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-[10px] text-sm font-medium text-muted transition-colors duration-150 hover:bg-canvas hover:text-ink active:bg-canvas disabled:opacity-60"
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" /> {content?.backButton ?? "Back"}
                </button>
              </>
            )}
          </motion.form>
        </AnimatePresence>
      </motion.div>
    </>
  );
}
