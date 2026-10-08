import Link from "next/link";
import type { Presentation } from "@/lib/records-service";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="py-3">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium">{children}</dd>
    </div>
  );
}

export function AccountSummary({
  account,
  heading = "Record information",
  detailsLinkText = "Details",
  holderLabel = "Account holder",
  businessLabel = "Business",
  typeLabel = "Record type",
  statusLabel = "Record status",
}: {
  account: Pick<Presentation, "holderName" | "businessName" | "recordType" | "status">;
  heading?: string;
  detailsLinkText?: string;
  holderLabel?: string;
  businessLabel?: string;
  typeLabel?: string;
  statusLabel?: string;
}) {
  return (
    <section aria-labelledby="acct-h" className="rounded-2xl border border-line bg-white p-5">
      <div className="flex items-center justify-between">
        <h2 id="acct-h" className="text-[15px] font-semibold">{heading}</h2>
        <Link href="/dashboard/account" className="-my-2.5 inline-flex min-h-11 items-center px-1 text-sm font-medium text-brand-dark hover:underline">{detailsLinkText}</Link>
      </div>
      <dl className="mt-2 divide-y divide-line">
        <Field label={holderLabel}>{account.holderName}</Field>
        <Field label={businessLabel}>{account.businessName}</Field>
        <Field label={typeLabel}>{account.recordType}</Field>
        <Field label={statusLabel}>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" /> {account.status}
          </span>
        </Field>
      </dl>
    </section>
  );
}
