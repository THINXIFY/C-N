"use client";

import { Check, CheckCircle2, Clock, Copy } from "lucide-react";
import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { submitTransferRequestAction } from "@/app/actions/transfer";
import { AdminSection } from "@/components/admin/AdminSection";
import { SelectInput, TextAreaField, TextField } from "@/components/admin/fields";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import type { TransferContent } from "@/data/settings";
import { TRANSFER_CURRENCIES } from "@/data/transfer-requests";
import { formatDateTime, formatMoney } from "@/lib/format";
import { SWIFT_BIC_MAX, validateTransferRequest, type TransferFieldErrors, type TransferFormInput } from "@/lib/transfer-validation";

const CURRENCY_OPTIONS = TRANSFER_CURRENCIES.map((c) => ({ value: c, label: c }));
const TYPE_OPTIONS = [
  { value: "domestic", label: "Domestic Canadian Wire" },
  { value: "international", label: "International Wire" },
];
const FEE_OPTIONS = [
  { value: "sender", label: "Sender" },
  { value: "recipient", label: "Recipient" },
  { value: "shared", label: "Shared" },
];

const emptyForm: TransferFormInput = {
  amount: "",
  currency: "CAD",
  transferType: "domestic",
  reference: "",
  purpose: "",
  recipientName: "",
  recipientAddress: "",
  recipientCity: "",
  recipientProvince: "",
  recipientPostalCode: "",
  recipientCountry: "",
  bankName: "",
  branchName: "",
  bankAddress: "",
  bankCity: "",
  bankProvince: "",
  bankPostalCode: "",
  institutionNumber: "",
  transitNumber: "",
  accountNumber: "",
  swiftBic: "",
  iban: "",
  routingSortCode: "",
  intermediaryBank: "",
  feeResponsibility: "shared",
};

/** Display-only masking for the review step — the server independently masks before ever persisting anything;
 *  this never sends the raw number anywhere beyond the one submit call. */
const maskForDisplay = (raw: string) => `•••• ${raw.slice(-4)}`;

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 py-3 sm:grid-cols-[180px_1fr] sm:gap-4">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="min-w-0 break-words text-sm font-medium">{value}</dd>
    </div>
  );
}

/** The PSID is an internal request reference only — never a bank confirmation, settlement ID or proof of
 *  payment (there is no payment integration behind this form). Shown prominently with its own copy affordance. */
function PsidRow({ psid }: { psid: string }) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(psid);
      toast("PSID copied");
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1600);
    } catch {
      toast("Couldn’t copy — select the reference and copy manually");
    }
  }

  return (
    <div className="grid gap-1 py-3 sm:grid-cols-[180px_1fr] sm:gap-4">
      <dt className="text-sm text-muted">PSID</dt>
      <dd className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="break-all font-mono text-[15px] font-semibold">{psid}</span>
          <button
            type="button"
            onClick={onCopy}
            aria-label={copied ? "PSID copied" : `Copy PSID: ${psid}`}
            className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-[8px] border border-line px-2.5 text-xs font-medium text-ink transition-[background-color,border-color] duration-150 hover:border-[#cfd8d3] hover:bg-canvas"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-brand" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <p className="mt-1 text-xs text-muted">Keep this reference for your records.</p>
      </dd>
    </div>
  );
}

export function TransferForm({ content }: { content: TransferContent }) {
  const [form, setForm] = useState<TransferFormInput>(emptyForm);
  const [errors, setErrors] = useState<TransferFieldErrors>({});
  const [phase, setPhase] = useState<"form" | "review" | "result">("form");
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [resultStatus, setResultStatus] = useState<"submitted" | "unavailable" | null>(null);
  const [resultMeta, setResultMeta] = useState<{ psid: string; createdAt: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function set<K extends keyof TransferFormInput>(key: K, value: TransferFormInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: "" }));
  }

  function onReview() {
    const result = validateTransferRequest(form);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    setConfirmChecked(false);
    setSubmitError(null);
    setPhase("review");
  }

  function onSubmit() {
    setSubmitError(null);
    startTransition(async () => {
      const res = await submitTransferRequestAction(form);
      if (!res.ok) {
        if (res.fieldErrors) {
          setErrors(res.fieldErrors);
          setPhase("form");
        }
        setSubmitError(res.error ?? "Unable to submit your request.");
        return;
      }
      setResultStatus(res.status ?? "submitted");
      setResultMeta(res.psid && res.createdAt ? { psid: res.psid, createdAt: res.createdAt } : null);
      setPhase("result");
    });
  }

  function onStartOver() {
    setForm(emptyForm);
    setErrors({});
    setConfirmChecked(false);
    setSubmitError(null);
    setResultStatus(null);
    setResultMeta(null);
    setPhase("form");
  }

  const isDomestic = form.transferType === "domestic";
  const isInternational = form.transferType === "international";

  if (phase === "result" && resultStatus === "submitted") {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-line bg-white p-6 sm:p-8">
        <div className="text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft text-brand-dark">
            <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
          </span>
          <h2 className="mt-5 text-xl font-semibold sm:text-2xl">{content.acceptedTitle}</h2>
          <p className="mx-auto mt-2 max-w-sm text-[15px] leading-relaxed text-muted">{content.acceptedMessage}</p>
        </div>

        <div className="mt-6 rounded-xl border border-line bg-canvas/60 p-4 sm:p-5">
          <dl className="divide-y divide-line/80">
            <ReviewRow label="Amount" value={formatMoney(Number(form.amount), form.currency)} />
            <ReviewRow label="Recipient" value={form.recipientName} />
            <ReviewRow label="Bank" value={form.bankName} />
            {form.reference && <ReviewRow label="Reference" value={form.reference} />}
            {resultMeta && <ReviewRow label="Submitted" value={formatDateTime(resultMeta.createdAt)} />}
            {resultMeta && <PsidRow psid={resultMeta.psid} />}
          </dl>
        </div>

        <p className="mt-5 text-center text-[13px] leading-relaxed text-muted">
          Your request is now recorded for processing. You can review the details below or return to your dashboard.
        </p>

        <div className="mt-6 flex justify-center">
          <Link href="/dashboard">
            <Button type="button">{content.backToDashboardLabel}</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (phase === "result" && resultStatus === "unavailable") {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-line bg-white p-6 sm:p-8">
        <div className="text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fdf3dd] text-[#8a6116]">
            <Clock className="h-7 w-7" aria-hidden="true" />
          </span>
          <h2 className="mt-5 text-xl font-semibold sm:text-2xl">{content.failureTitle}</h2>
          <p className="mx-auto mt-2 max-w-sm text-[15px] leading-relaxed text-muted">{content.failureMessage}</p>
        </div>

        <div className="mt-6 rounded-xl border border-[#f0c987] bg-[#fdf3dd] p-4 text-center">
          <p className="text-[13px] font-medium leading-relaxed text-[#8a6116]">
            Your account balance has not been changed and no transfer has been completed.
          </p>
        </div>

        {content.failureHelperText && <p className="mt-4 text-center text-[13px] leading-relaxed text-muted">{content.failureHelperText}</p>}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
          <Link href="/dashboard/support">
            <Button type="button" variant="ghost">
              Contact Support
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button type="button" variant="secondary">
              {content.backToDashboardLabel}
            </Button>
          </Link>
          <Button type="button" onClick={onStartOver}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (phase === "review") {
    return (
      <AdminSection title={content.reviewTitle} description="Please review the details below before submitting.">
        <dl className="divide-y divide-line">
          <ReviewRow label={content.amountLabel} value={formatMoney(Number(form.amount), form.currency)} />
          <ReviewRow label={content.transferTypeLabel} value={isDomestic ? "Domestic Canadian Wire" : "International Wire"} />
          <ReviewRow label="Recipient" value={form.recipientName} />
          <ReviewRow label="Bank" value={form.bankName} />
          <ReviewRow label="Account number" value={maskForDisplay(form.accountNumber)} />
          {isDomestic && <ReviewRow label="Institution number" value={form.institutionNumber} />}
          {isDomestic && <ReviewRow label="Transit number" value={form.transitNumber} />}
          {form.swiftBic && <ReviewRow label="SWIFT / BIC" value={form.swiftBic} />}
          {form.reference && <ReviewRow label="Reference" value={form.reference} />}
        </dl>

        {submitError && (
          <p role="alert" className="mt-4 text-[13px] text-debit">
            {submitError}
          </p>
        )}

        <label className="mt-5 flex items-start gap-2.5 text-sm text-ink">
          <input
            type="checkbox"
            checked={confirmChecked}
            onChange={(e) => setConfirmChecked(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-brand"
          />
          {content.confirmCheckboxLabel}
        </label>

        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={() => setPhase("form")} disabled={pending}>
            Back
          </Button>
          <Button type="button" onClick={onSubmit} loading={pending} disabled={!confirmChecked || pending}>
            {content.submitButtonLabel}
          </Button>
        </div>
      </AdminSection>
    );
  }

  return (
    <div className="space-y-5">
      <AdminSection title="Transfer Details">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField label={content.amountLabel} value={form.amount} onChange={(v) => set("amount", v)} inputMode="decimal" placeholder="0.00" error={errors.amount} />
          <SelectInput label={content.currencyLabel} value={form.currency} onChange={(v) => set("currency", v)} options={CURRENCY_OPTIONS} error={errors.currency} />
          <SelectInput label={content.transferTypeLabel} value={form.transferType} onChange={(v) => set("transferType", v)} options={TYPE_OPTIONS} error={errors.transferType} />
          <TextField label="Reference / Payment Description" value={form.reference} onChange={(v) => set("reference", v)} optional max={200} error={errors.reference} />
          <div className="sm:col-span-2">
            <TextAreaField label="Purpose of Transfer" value={form.purpose} onChange={(v) => set("purpose", v)} max={500} rows={2} error={errors.purpose} />
          </div>
        </div>
      </AdminSection>

      <AdminSection title={content.recipientSectionTitle}>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <TextField label="Recipient / Beneficiary Full Name" value={form.recipientName} onChange={(v) => set("recipientName", v)} max={150} error={errors.recipientName} />
          </div>
          <div className="sm:col-span-2">
            <TextField label="Recipient Address" value={form.recipientAddress} onChange={(v) => set("recipientAddress", v)} max={250} error={errors.recipientAddress} />
          </div>
          <TextField label="City" value={form.recipientCity} onChange={(v) => set("recipientCity", v)} max={100} error={errors.recipientCity} />
          <TextField
            label="Province / State"
            value={form.recipientProvince}
            onChange={(v) => set("recipientProvince", v)}
            max={100}
            optional={!isDomestic}
            error={errors.recipientProvince}
          />
          <TextField label="Postal / ZIP Code" value={form.recipientPostalCode} onChange={(v) => set("recipientPostalCode", v)} max={20} error={errors.recipientPostalCode} />
          <TextField label="Country" value={form.recipientCountry} onChange={(v) => set("recipientCountry", v)} max={100} error={errors.recipientCountry} />
        </div>
      </AdminSection>

      <AdminSection title={content.bankSectionTitle}>
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField label="Bank Name" value={form.bankName} onChange={(v) => set("bankName", v)} max={150} error={errors.bankName} />
          <TextField label="Branch Name" value={form.branchName} onChange={(v) => set("branchName", v)} max={150} optional error={errors.branchName} />
          <div className="sm:col-span-2">
            <TextField label="Bank / Branch Address" value={form.bankAddress} onChange={(v) => set("bankAddress", v)} max={250} error={errors.bankAddress} />
          </div>
          <TextField label="City" value={form.bankCity} onChange={(v) => set("bankCity", v)} max={100} error={errors.bankCity} />
          <TextField label="Province" value={form.bankProvince} onChange={(v) => set("bankProvince", v)} max={100} optional={!isDomestic} error={errors.bankProvince} />
          <TextField label="Postal Code" value={form.bankPostalCode} onChange={(v) => set("bankPostalCode", v)} max={20} optional={!isDomestic} error={errors.bankPostalCode} />
          <TextField
            label="Institution Number"
            value={form.institutionNumber}
            onChange={(v) => set("institutionNumber", v.replace(/\D/g, "").slice(0, 3))}
            helper="3-digit Canadian financial institution number"
            inputMode="numeric"
            optional={!isDomestic}
            error={errors.institutionNumber}
          />
          <TextField
            label="Transit Number"
            value={form.transitNumber}
            onChange={(v) => set("transitNumber", v.replace(/\D/g, "").slice(0, 5))}
            helper="5-digit branch transit number"
            inputMode="numeric"
            optional={!isDomestic}
            error={errors.transitNumber}
          />
          <TextField
            label="Account Number"
            value={form.accountNumber}
            onChange={(v) => set("accountNumber", v.replace(/\D/g, "").slice(0, 20))}
            inputMode="numeric"
            error={errors.accountNumber}
          />
          <TextField
            label="SWIFT / BIC Code"
            value={form.swiftBic}
            onChange={(v) => set("swiftBic", v)}
            max={SWIFT_BIC_MAX}
            optional
            helper="Enter the recipient bank's SWIFT / BIC code if applicable."
            error={errors.swiftBic}
          />
          {isInternational && (
            <>
              <TextField label="IBAN" value={form.iban} onChange={(v) => set("iban", v)} max={34} optional error={errors.iban} />
              <TextField label="Routing / Sort Code" value={form.routingSortCode} onChange={(v) => set("routingSortCode", v)} max={20} optional error={errors.routingSortCode} />
              <div className="sm:col-span-2">
                <TextField label="Intermediary Bank" value={form.intermediaryBank} onChange={(v) => set("intermediaryBank", v)} max={200} optional error={errors.intermediaryBank} />
              </div>
            </>
          )}
        </div>
      </AdminSection>

      <AdminSection title="Fee Instructions" description="Who should pay transfer fees?">
        <SelectInput label="Fee responsibility" value={form.feeResponsibility} onChange={(v) => set("feeResponsibility", v)} options={FEE_OPTIONS} error={errors.feeResponsibility} />
      </AdminSection>

      <div className="flex justify-end">
        <Button type="button" onClick={onReview}>
          Review Transfer
        </Button>
      </div>
    </div>
  );
}
