"use client";

import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { clearCustomCssAction, saveCustomCssAction, setCustomCssEnabledAction } from "@/app/actions/admin";
import { Button } from "@/components/ui/Button";
import { buttonClass } from "@/components/ui/button-styles";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import {
  CUSTOM_CSS_MAX_BYTES,
  CUSTOM_CSS_SCOPES,
  CUSTOM_CSS_SCOPE_LABELS,
  CUSTOM_CSS_SCOPE_PREVIEW_URL,
  type CustomCssScope,
  type CustomCssSettings,
} from "@/data/custom-css";
import { cn } from "@/lib/cn";
import { formatDateTime } from "@/lib/format";
import { SaveBar } from "./fields";

export function CustomCssCard({ initial }: { initial: CustomCssSettings }) {
  const router = useRouter();
  const { toast } = useToast();
  const [saved, setSaved] = useState(initial);
  const [css, setCss] = useState(initial.css);
  const [scopes, setScopes] = useState<CustomCssScope[]>(initial.scopes);
  const [enabled, setEnabled] = useState(initial.enabled);
  const [updatedAt, setUpdatedAt] = useState(initial.updatedAt);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [clearing, setClearing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [togglePending, startToggleTransition] = useTransition();
  const [clearPending, startClearTransition] = useTransition();

  const dirty = css !== saved.css || JSON.stringify(scopes) !== JSON.stringify(saved.scopes);
  const byteSize = new TextEncoder().encode(css).length;

  function toggleScope(scope: CustomCssScope) {
    setScopes((cur) => (cur.includes(scope) ? cur.filter((s) => s !== scope) : [...cur, scope]));
  }

  function onSave(e: FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await saveCustomCssAction(css, scopes);
      if (!res.ok || !res.settings) {
        setError(res.error ?? "Unable to save changes.");
        return;
      }
      setSaved(res.settings);
      setCss(res.settings.css);
      setScopes(res.settings.scopes);
      setUpdatedAt(res.settings.updatedAt);
      setWarnings(res.warnings ?? []);
      toast("Custom CSS saved");
      router.refresh();
    });
  }

  function onToggleEnabled() {
    const next = !enabled;
    startToggleTransition(async () => {
      const res = await setCustomCssEnabledAction(next);
      if (!res.ok || !res.settings) {
        toast(res.error ?? "Unable to save changes.");
        return;
      }
      setEnabled(res.settings.enabled);
      toast(next ? "Custom CSS enabled" : "Custom CSS disabled");
      router.refresh();
    });
  }

  function onClear() {
    startClearTransition(async () => {
      const res = await clearCustomCssAction();
      if (!res.ok || !res.settings) {
        toast(res.error ?? "Unable to save changes.");
        return;
      }
      setSaved(res.settings);
      setCss(res.settings.css);
      setUpdatedAt(res.settings.updatedAt);
      setWarnings([]);
      toast("Custom CSS cleared");
      setClearing(false);
      router.refresh();
    });
  }

  const previewUrl = CUSTOM_CSS_SCOPE_PREVIEW_URL[scopes[0] ?? "all-user-pages"];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span
          className={cn(
            "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium",
            enabled ? "bg-brand-soft text-brand-dark" : "bg-canvas text-muted",
          )}
        >
          <span className={cn("h-2 w-2 rounded-full", enabled ? "bg-brand" : "bg-[#b7bfbb]")} aria-hidden="true" />
          {enabled ? "Custom CSS Enabled" : "Custom CSS Disabled"}
        </span>
        <Link
          href={previewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-11 items-center gap-1.5 rounded-[10px] border border-line px-4 text-sm font-medium text-ink transition-colors hover:bg-canvas"
        >
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" /> Open User Preview
        </Link>
      </div>

      <div className="flex min-h-11 items-start justify-between gap-6 border-t border-line py-4">
        <div className="min-w-0">
          <p className="text-sm font-medium">Enable Custom CSS</p>
          <p className="mt-0.5 text-[13px] leading-snug text-muted">
            {enabled ? "Saved CSS is applied to the selected pages." : "Saved CSS is kept but not applied. Easiest way to recover from bad styling."}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label="Enable Custom CSS"
          disabled={togglePending}
          onClick={onToggleEnabled}
          className="-my-2 -mr-2 flex h-11 w-14 shrink-0 items-center justify-center rounded-xl disabled:opacity-60"
        >
          <span className={cn("relative block h-6 w-11 rounded-full transition-colors duration-200 ease-out", enabled ? "bg-brand" : "bg-[#cfd8d3]")}>
            <span
              className={cn(
                "absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ease-out motion-reduce:transition-none",
                enabled && "translate-x-5",
              )}
            />
          </span>
        </button>
      </div>

      <form onSubmit={onSave} noValidate className="space-y-5">
        <div className="border-t border-line pt-4">
          <p className="mb-2 text-sm font-medium">Applies to</p>
          <div className="flex flex-wrap gap-2">
            {CUSTOM_CSS_SCOPES.map((scope) => (
              <label
                key={scope}
                className={cn(
                  "flex h-10 cursor-pointer items-center gap-2 rounded-full border px-3.5 text-sm font-medium transition-colors",
                  scopes.includes(scope) ? "border-brand/30 bg-brand-soft text-brand-dark" : "border-line bg-white text-muted hover:text-ink",
                )}
              >
                <input type="checkbox" checked={scopes.includes(scope)} onChange={() => toggleScope(scope)} className="sr-only" />
                {CUSTOM_CSS_SCOPE_LABELS[scope]}
              </label>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-baseline justify-between gap-3">
            <label htmlFor="custom-css-editor" className="text-sm font-medium">CSS Rules</label>
            <span className={cn("tabular text-xs", byteSize > CUSTOM_CSS_MAX_BYTES ? "text-debit" : "text-muted")}>
              {(byteSize / 1024).toFixed(1)} KB / {CUSTOM_CSS_MAX_BYTES / 1024} KB
            </span>
          </div>
          <textarea
            id="custom-css-editor"
            value={css}
            onChange={(e) => setCss(e.target.value)}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            rows={14}
            placeholder={`.dashboard-shell {\n  background: #f5f7f6;\n}\n\n[data-page="transactions"] h1 {\n  font-size: 32px;\n}`}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "custom-css-error" : undefined}
            className={cn(
              "w-full resize-y rounded-xl border bg-[#0f1a14] px-4 py-3.5 font-mono text-[13px] leading-relaxed text-[#d6e9db] placeholder:text-[#5c7265] transition-[border-color,box-shadow] duration-150 focus:outline-none focus:ring-4 focus:ring-brand/15",
              error ? "border-debit" : "border-line focus:border-brand",
            )}
          />
          {error && <p id="custom-css-error" role="alert" className="mt-1.5 text-[13px] text-debit">{error}</p>}
          <p className="mt-1.5 text-[13px] leading-snug text-muted">
            Plain CSS only — no &lt;script&gt;, &lt;style&gt; or HTML tags. Use <code className="rounded bg-canvas px-1 py-0.5 text-xs">.user-shell</code>,{" "}
            <code className="rounded bg-canvas px-1 py-0.5 text-xs">.login-shell</code>, <code className="rounded bg-canvas px-1 py-0.5 text-xs">.dashboard-shell</code> or{" "}
            <code className="rounded bg-canvas px-1 py-0.5 text-xs">[data-page=&quot;…&quot;]</code> as stable hooks.
          </p>
        </div>

        {warnings.length > 0 && (
          <div className="rounded-xl border border-[#f0c987] bg-[#fdf3dd] p-4 text-sm text-[#8a6116]">
            <p className="font-medium">Saved — but review this before relying on it:</p>
            <ul className="mt-1.5 list-inside list-disc space-y-1">
              {warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>
        )}

        {updatedAt && <p className="text-xs text-muted">Last saved {formatDateTime(updatedAt)}</p>}

        <SaveBar
          dirty={dirty}
          saving={pending}
          saveLabel="Save CSS"
          onReset={() => {
            setCss(saved.css);
            setScopes(saved.scopes);
            setError(null);
          }}
        />
      </form>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-debit/20 bg-debit-soft/40 p-4">
        <div>
          <p className="text-sm font-medium">Clear Custom CSS</p>
          <p className="mt-0.5 text-sm text-muted">Permanently empties the saved CSS. Scope selections are kept.</p>
        </div>
        <Button type="button" variant="secondary" onClick={() => setClearing(true)} className="gap-1.5">
          Clear CSS
        </Button>
      </div>

      <Modal
        open={clearing}
        onClose={() => !clearPending && setClearing(false)}
        title="Clear Custom CSS?"
        description="This permanently removes the saved CSS. This can’t be undone."
      >
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={() => setClearing(false)} disabled={clearPending}>Cancel</Button>
          <button onClick={onClear} disabled={clearPending} className={buttonClass("danger")}>
            {clearPending ? "Clearing…" : "Clear CSS"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
