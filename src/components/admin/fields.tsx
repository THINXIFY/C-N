"use client";

import { ChevronDown, Lock } from "lucide-react";
import { useId, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

const control =
  "w-full rounded-xl border border-line bg-white px-3.5 text-[15px] text-ink placeholder:text-muted/70 transition-[border-color,box-shadow] duration-200 ease-out hover:border-[#cfd8d3] focus:border-brand focus:outline-none focus:ring-[3px] focus:ring-brand/15 aria-[invalid=true]:border-debit aria-[invalid=true]:focus:ring-debit/15";

function FieldShell({
  id,
  label,
  helper,
  error,
  count,
  max,
  children,
  optional,
}: {
  id: string;
  label: string;
  helper?: string;
  error?: string;
  count?: number;
  max?: number;
  optional?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
          {optional && <span className="ml-1.5 text-xs font-normal text-muted">Optional</span>}
        </label>
        {max !== undefined && count !== undefined && (
          <span className={cn("tabular text-xs", count > max ? "text-debit" : "text-muted")}>
            {count}/{max}
          </span>
        )}
      </div>
      {children}
      {error ? (
        <p id={`${id}-msg`} role="alert" className="soft-in mt-1.5 text-[13px] text-debit">{error}</p>
      ) : (
        helper && <p id={`${id}-msg`} className="mt-1.5 text-[13px] leading-snug text-muted">{helper}</p>
      )}
    </div>
  );
}

interface TextProps {
  disabled?: boolean;
  type?: string;
  autoComplete?: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  helper?: string;
  error?: string;
  max?: number;
  placeholder?: string;
  optional?: boolean;
}

export function TextField({ label, value, onChange, helper, error, max, placeholder, optional, disabled, type, autoComplete }: TextProps) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} helper={helper} error={error} count={value.length} max={max} optional={optional}>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type={type}
        autoComplete={autoComplete}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || helper ? `${id}-msg` : undefined}
        className={cn(control, "h-12 disabled:cursor-not-allowed disabled:bg-canvas disabled:text-muted")}
      />
    </FieldShell>
  );
}

export function TextAreaField({ label, value, onChange, helper, error, max, placeholder, rows = 3 }: TextProps & { rows?: number }) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} helper={helper} error={error} count={value.length} max={max}>
      <textarea
        id={id}
        value={value}
        rows={rows}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || helper ? `${id}-msg` : undefined}
        className={cn(control, "resize-y py-3 leading-relaxed")}
      />
    </FieldShell>
  );
}

export function SelectInput({
  label,
  value,
  onChange,
  options,
  helper,
  error,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: ReadonlyArray<string | { value: string; label: string }>;
  helper?: string;
  error?: string;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} helper={helper} error={error}>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={error ? true : undefined}
          disabled={disabled}
          className={cn(control, "h-12 appearance-none pr-10 disabled:cursor-not-allowed disabled:bg-canvas disabled:text-muted")}
        >
          {options.map((o) => {
            const opt = typeof o === "string" ? { value: o, label: o } : o;
            return <option key={opt.value} value={opt.value}>{opt.label}</option>;
          })}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
      </div>
    </FieldShell>
  );
}

export function ToggleField({
  label,
  helper,
  checked,
  onChange,
}: {
  label: string;
  helper?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  const id = useId();
  return (
    <div className="flex min-h-11 items-start justify-between gap-6 py-3">
      <div className="min-w-0">
        <label htmlFor={id} className="text-sm font-medium">{label}</label>
        {helper && <p className="mt-0.5 text-[13px] leading-snug text-muted">{helper}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className="-my-2 -mr-2 flex h-11 w-14 shrink-0 items-center justify-center rounded-xl"
      >
        <span className={cn("relative block h-6 w-11 rounded-full transition-colors duration-200 ease-out", checked ? "bg-brand" : "bg-[#cfd8d3]")}>
          <span
            className={cn(
              "absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ease-out motion-reduce:transition-none",
              checked && "translate-x-5",
            )}
          />
        </span>
      </button>
    </div>
  );
}

export function ReadOnlyField({ label, value, helper }: { label: string; value: string; helper?: string }) {
  return (
    <div>
      <p className="mb-1.5 flex items-center gap-1.5 text-sm font-medium">
        {label} <Lock className="h-3.5 w-3.5 text-muted" aria-label="Read only" />
      </p>
      <div className="tabular flex h-12 items-center rounded-xl border border-line bg-canvas px-3.5 text-[15px] font-medium text-ink/80">
        {value}
      </div>
      {helper && <p className="mt-1.5 text-[13px] leading-snug text-muted">{helper}</p>}
    </div>
  );
}

export function SaveBar({
  dirty,
  saving,
  onReset,
  saveLabel,
}: {
  dirty: boolean;
  saving: boolean;
  onReset: () => void;
  saveLabel: string;
}) {
  return (
    <div className="sticky bottom-0 z-10 -mx-4 mt-6 flex flex-col-reverse items-stretch gap-3 border-t border-line bg-canvas/95 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 backdrop-blur sm:mx-0 sm:flex-row sm:items-center sm:justify-between sm:rounded-2xl sm:border sm:bg-white sm:px-5">
      <p className="text-sm text-muted" aria-live="polite">
        {dirty ? (
          <span className="inline-flex items-center gap-2 text-ink">
            <span className="h-2 w-2 rounded-full bg-amber-500" /> Unsaved changes
          </span>
        ) : (
          "All changes saved"
        )}
      </p>
      <div className="flex gap-3">
        <Button type="button" variant="secondary" onClick={onReset} disabled={!dirty || saving} className="flex-1 sm:flex-none">
          Reset
        </Button>
        <Button type="submit" loading={saving} disabled={!dirty} className="flex-1 sm:flex-none">
          {saving ? "Saving…" : saveLabel}
        </Button>
      </div>
    </div>
  );
}
