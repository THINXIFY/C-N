"use client";

import { RotateCcw } from "lucide-react";
import { useState, useTransition, type FormEvent } from "react";
import { resetAllContentAction, resetContentSectionAction, updateContentSettings, type ContentSaveResult } from "@/app/actions/admin";
import { Button } from "@/components/ui/Button";
import { buttonClass } from "@/components/ui/button-styles";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/cn";
import { defaultUserContent, type ContentSettings, type UserContent } from "@/data/settings";
import {
  ACCOUNT_FIELDS,
  DASHBOARD_FIELDS,
  LOGIN_FIELDS,
  MAINTENANCE_FIELDS,
  MESSAGES_FIELDS,
  NAVIGATION_FIELDS,
  NOTICES_FIELDS,
  SUPPORT_FIELDS,
  TRANSACTIONS_FIELDS,
  TRANSFER_FIELDS,
  limits,
  validateContent,
  type FieldErrors,
  type FieldSpec,
} from "@/lib/settings-validation";
import type { ReplacementHistoryEntry } from "@/data/global-replace";
import { AdminSection } from "./AdminSection";
import { SaveBar, TextAreaField, TextField } from "./fields";
import { GlobalReplaceCard } from "./GlobalReplaceCard";

type SectionKey = keyof UserContent;

const TABS: Array<{ key: SectionKey; label: string; description: string; specs: FieldSpec[] }> = [
  { key: "login", label: "Login", description: "Everything shown on the sign-in screen before a user is authenticated.", specs: LOGIN_FIELDS },
  { key: "navigation", label: "Navigation", description: "Sidebar, topbar and mobile menu labels. Links, icons and order are fixed.", specs: NAVIGATION_FIELDS },
  { key: "dashboard", label: "Dashboard", description: "The overview page: greeting, summary cards, quick actions.", specs: DASHBOARD_FIELDS },
  { key: "transactions", label: "Transactions", description: "Search, filters, table headers and the transaction-detail drawer.", specs: TRANSACTIONS_FIELDS },
  { key: "account", label: "Account", description: "Section titles and field labels on the account page.", specs: ACCOUNT_FIELDS },
  { key: "support", label: "Support", description: "Help topics and the contact-administrator card.", specs: SUPPORT_FIELDS },
  { key: "messages", label: "Messages", description: "Toast notifications shown after sign-in and sign-out.", specs: MESSAGES_FIELDS },
  {
    key: "notices",
    label: "Disclaimers & Notices",
    description: "Safety and positioning notices. Reword and retone freely, but each must keep saying this is a private, internally-maintained record — not an official, bank-verified statement.",
    specs: NOTICES_FIELDS,
  },
  {
    key: "maintenance",
    label: "Maintenance",
    description: "Wording shown on the public /maintenance page. Whether maintenance mode is actually on is controlled separately, in Settings → User-Side Availability.",
    specs: MAINTENANCE_FIELDS,
  },
  {
    key: "transfer",
    label: "Transfer",
    description: "Wording shown on /dashboard/transfer, including the accepted/failure result messages. Whether transfers are enabled and which result users see is controlled separately, in Settings → Transfer Request Settings.",
    specs: TRANSFER_FIELDS,
  },
];

function FieldGroup({
  section,
  specs,
  values,
  errors,
  onChange,
}: {
  section: SectionKey;
  specs: FieldSpec[];
  values: Record<string, string>;
  errors: FieldErrors;
  onChange: (key: string, value: string) => void;
}) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {specs.map((spec) => {
        const Field = spec.multiline ? TextAreaField : TextField;
        return (
          <div key={spec.key} className={spec.multiline ? "sm:col-span-2" : undefined}>
            <Field
              label={spec.label}
              value={values[spec.key] ?? ""}
              onChange={(v) => onChange(spec.key, v)}
              helper={spec.helper || undefined}
              error={errors[`${section}.${spec.key}`]}
              max={spec.max}
            />
          </div>
        );
      })}
    </div>
  );
}

function NoticeField({
  spec,
  value,
  defaultValue,
  error,
  onChange,
}: {
  spec: FieldSpec;
  value: string;
  defaultValue: string;
  error?: string;
  onChange: (v: string) => void;
}) {
  return (
    <fieldset className="space-y-3 rounded-xl border border-line p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <legend className="text-sm font-semibold">{spec.label}</legend>
        <button
          type="button"
          onClick={() => onChange(defaultValue)}
          disabled={value === defaultValue}
          className="text-xs font-medium text-brand-dark hover:underline disabled:cursor-not-allowed disabled:text-muted disabled:no-underline"
        >
          Reset to Default
        </button>
      </div>
      <p className="text-[13px] leading-snug text-muted">Location: {spec.helper}</p>
      <TextAreaField label="Text" value={value} onChange={onChange} error={error} max={spec.max} rows={2} />
      <div className="rounded-lg bg-canvas px-3 py-2">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted">Preview</p>
        <p className="mt-0.5 text-xs italic text-ink/70">{value || "(empty — core notices can’t be saved blank)"}</p>
      </div>
      {value !== defaultValue && <p className="text-[12px] text-muted">Default: “{defaultValue}”</p>}
    </fieldset>
  );
}

function ResetSectionButton({ onClick }: { onClick: () => void }) {
  return (
    <Button type="button" variant="secondary" onClick={onClick} className="gap-1.5">
      <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> Reset to Defaults
    </Button>
  );
}

export function ContentEditor({
  initial,
  initialReplaceHistory,
  initialCanUndoReplace,
}: {
  initial: ContentSettings;
  initialReplaceHistory: ReplacementHistoryEntry[];
  initialCanUndoReplace: boolean;
}) {
  const { toast } = useToast();
  const [saved, setSaved] = useState<UserContent>(initial);
  const [form, setForm] = useState<UserContent>(initial);
  const [updatedAt, setUpdatedAt] = useState<string | null>(initial.updatedAt);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [activeTab, setActiveTab] = useState<SectionKey | "advanced" | "globalReplace">("login");
  const [resetTarget, setResetTarget] = useState<SectionKey | null>(null);
  const [resetAllOpen, setResetAllOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [resetPending, startResetTransition] = useTransition();

  const dirty = JSON.stringify(form) !== JSON.stringify(saved);
  const clearErr = (k: string) => errors[k] && setErrors((e) => ({ ...e, [k]: "" }));

  function sectionChange<S extends SectionKey>(section: S) {
    return (key: string, value: string) => {
      setForm((f) => ({ ...f, [section]: { ...f[section], [key]: value } as UserContent[S] }));
      clearErr(`${section}.${key}`);
    };
  }

  function setTopic(i: number, key: "title" | "body", value: string) {
    setForm((f) => ({
      ...f,
      support: { ...f.support, topics: f.support.topics.map((t, n) => (n === i ? { ...t, [key]: value } : t)) },
    }));
    clearErr(`support.topics.${i}.${key}`);
  }

  function applySettings(settings: ContentSettings, scope: "all" | SectionKey) {
    if (scope === "all") {
      setForm(settings);
      setSaved(settings);
    } else {
      setForm((f) => ({ ...f, [scope]: settings[scope] }));
      setSaved((s) => ({ ...s, [scope]: settings[scope] }));
    }
    setUpdatedAt(settings.updatedAt);
  }

  function handleResult(res: ContentSaveResult, scope: "all" | SectionKey, successMessage: string) {
    if (!res.ok || !res.settings) {
      if (res.fieldErrors) setErrors(res.fieldErrors);
      toast(res.error ?? "Unable to save changes.");
      return;
    }
    applySettings(res.settings, scope);
    toast(successMessage);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const local = validateContent(form);
    if (!local.ok) {
      setErrors(local.errors);
      toast("Please fix the highlighted fields");
      return;
    }
    setErrors({});
    const successMessage = activeTab === "notices" ? "Disclaimer content updated" : "Content updated";
    startTransition(async () => {
      const res = await updateContentSettings(local.value);
      handleResult(res, "all", successMessage);
    });
  }

  function confirmResetSection() {
    const section = resetTarget;
    if (!section) return;
    startResetTransition(async () => {
      const res = await resetContentSectionAction(section);
      handleResult(res, section, `${TABS.find((t) => t.key === section)?.label ?? "Section"} reset to defaults`);
      setResetTarget(null);
    });
  }

  function confirmResetAll() {
    startResetTransition(async () => {
      const res = await resetAllContentAction();
      handleResult(res, "all", "All content reset to defaults");
      setResetAllOpen(false);
    });
  }

  const activeDef = TABS.find((t) => t.key === activeTab);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-1.5 rounded-xl border border-line bg-white p-1.5">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setActiveTab(t.key)}
            className={cn(
              "flex h-11 items-center rounded-lg px-3.5 text-sm font-medium transition-colors duration-150",
              activeTab === t.key ? "bg-brand-soft text-brand-dark" : "text-muted hover:bg-canvas hover:text-ink",
            )}
          >
            {t.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setActiveTab("advanced")}
          className={cn(
            "flex h-11 items-center rounded-lg px-3.5 text-sm font-medium transition-colors duration-150",
            activeTab === "advanced" ? "bg-brand-soft text-brand-dark" : "text-muted hover:bg-canvas hover:text-ink",
          )}
        >
          Advanced
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("globalReplace")}
          className={cn(
            "flex h-11 items-center rounded-lg px-3.5 text-sm font-medium transition-colors duration-150",
            activeTab === "globalReplace" ? "bg-brand-soft text-brand-dark" : "text-muted hover:bg-canvas hover:text-ink",
          )}
        >
          Global Replace
        </button>
      </div>

      {activeTab === "globalReplace" ? (
        <GlobalReplaceCard initialHistory={initialReplaceHistory} initialCanUndo={initialCanUndoReplace} />
      ) : (
      <form onSubmit={onSubmit} noValidate className="space-y-5">
      {activeDef && activeDef.key !== "support" && activeDef.key !== "notices" && (
        <AdminSection title={activeDef.label} description={activeDef.description} badge={<ResetSectionButton onClick={() => setResetTarget(activeDef.key)} />}>
          <FieldGroup
            section={activeDef.key}
            specs={activeDef.specs}
            values={form[activeDef.key] as unknown as Record<string, string>}
            errors={errors}
            onChange={sectionChange(activeDef.key)}
          />
        </AdminSection>
      )}

      {activeTab === "notices" && (
        <AdminSection
          title="Disclaimers & Notices"
          description="Reword and retone freely — each notice must keep saying this is a private, internally-maintained record, never an official bank-verified statement."
          badge={<ResetSectionButton onClick={() => setResetTarget("notices")} />}
        >
          <div className="space-y-4">
            {NOTICES_FIELDS.map((spec) => (
              <NoticeField
                key={spec.key}
                spec={spec}
                value={(form.notices as unknown as Record<string, string>)[spec.key] ?? ""}
                defaultValue={(defaultUserContent.notices as unknown as Record<string, string>)[spec.key]}
                error={errors[`notices.${spec.key}`]}
                onChange={(v) => sectionChange("notices")(spec.key, v)}
              />
            ))}
            <p className="text-xs leading-relaxed text-muted">
              Support-page notices (such as the footer note on /dashboard/support) are managed under the Support tab.
            </p>
          </div>
        </AdminSection>
      )}

      {activeTab === "support" && (
        <AdminSection title="Support" description="Help topics and the contact-administrator card." badge={<ResetSectionButton onClick={() => setResetTarget("support")} />}>
          <div className="space-y-6">
            <FieldGroup section="support" specs={SUPPORT_FIELDS} values={form.support as unknown as Record<string, string>} errors={errors} onChange={sectionChange("support")} />
            <div className="grid gap-4 lg:grid-cols-3">
              {form.support.topics.map((t, i) => (
                <fieldset key={i} className="space-y-4 rounded-xl border border-line p-4">
                  <legend className="px-1 text-xs font-medium uppercase tracking-wide text-muted">Help topic {i + 1}</legend>
                  <TextField label="Title" value={t.title} onChange={(v) => setTopic(i, "title", v)} error={errors[`support.topics.${i}.title`]} max={limits.topicTitle} />
                  <TextAreaField label="Text" rows={4} value={t.body} onChange={(v) => setTopic(i, "body", v)} error={errors[`support.topics.${i}.body`]} max={limits.topicBody} />
                </fieldset>
              ))}
            </div>
          </div>
        </AdminSection>
      )}

      {activeTab === "advanced" && (
        <AdminSection title="Advanced" description="Bulk reset and what this system intentionally doesn’t cover.">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line p-4">
              <div>
                <p className="text-sm font-medium">Last saved</p>
                <p className="mt-0.5 text-sm text-muted">{updatedAt ? new Date(updatedAt).toLocaleString() : "Never — showing defaults"}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-debit/20 bg-debit-soft/40 p-4">
              <div>
                <p className="text-sm font-medium">Reset all content</p>
                <p className="mt-0.5 text-sm text-muted">Restores every section above to its default wording.</p>
              </div>
              <Button type="button" variant="secondary" onClick={() => setResetAllOpen(true)} className="gap-1.5">
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> Reset All
              </Button>
            </div>
            <p className="text-xs leading-relaxed text-muted">
              Financial transaction values and recorded balances, usernames, passwords, access codes, session and role logic, internal
              record IDs, system timestamps and validation/security behavior are never editable here. The notices under “Disclaimers
              &amp; Notices” can be reworded, but each must keep its core meaning — a private, internally-maintained record, never an
              official bank-verified statement — so there is no way to blank or disable one. Admin-side pages keep their own fixed
              wording.
            </p>
          </div>
        </AdminSection>
      )}

      <SaveBar
        dirty={dirty}
        saving={pending}
        saveLabel="Save Changes"
        onReset={() => {
          setForm(saved);
          setErrors({});
        }}
      />

      <Modal
        open={!!resetTarget}
        onClose={() => !resetPending && setResetTarget(null)}
        title={`Reset ${resetTarget ? TABS.find((t) => t.key === resetTarget)?.label : ""} to defaults?`}
        description="This restores the default wording for this section for every user. Unsaved changes in this tab will be discarded. This can’t be undone."
      >
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={() => setResetTarget(null)} disabled={resetPending}>Cancel</Button>
          <button onClick={confirmResetSection} disabled={resetPending} className={buttonClass("danger")}>
            {resetPending ? "Resetting…" : "Reset Section"}
          </button>
        </div>
      </Modal>

      <Modal
        open={resetAllOpen}
        onClose={() => !resetPending && setResetAllOpen(false)}
        title="Reset all content to defaults?"
        description="This restores the default wording across every section — login, navigation, dashboard, transactions, account, support, messages, disclaimers & notices and maintenance — for every user. Unsaved changes will be discarded. This can’t be undone."
      >
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={() => setResetAllOpen(false)} disabled={resetPending}>Cancel</Button>
          <button onClick={confirmResetAll} disabled={resetPending} className={buttonClass("danger")}>
            {resetPending ? "Resetting…" : "Reset All"}
          </button>
        </div>
      </Modal>
      </form>
      )}
    </div>
  );
}
