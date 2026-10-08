"use client";

import { Check, Copy, ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { useToast } from "@/components/ui/Toast";
import { formatDateLong, formatMoney } from "@/lib/format";
import type { TransactionsContent } from "@/data/settings";
import type { TransactionRecord } from "@/data/records";
import { Amount, TransactionIcon, TypeBadge } from "./TransactionRow";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[84px_1fr] items-start gap-4 py-3.5 sm:grid-cols-[96px_1fr]">
      <dt className="pt-px text-sm text-muted">{label}</dt>
      <dd className="min-w-0 text-sm font-medium">{children}</dd>
    </div>
  );
}

export function TransactionDetailSheet({
  tx,
  currency,
  onClose,
  content,
  noticeText = "Internal record · Not bank-verified",
}: {
  tx: TransactionRecord | null;
  currency: string;
  onClose: () => void;
  content?: TransactionsContent;
  /** Admin-editable (notices.transactionDetailHelperText). */
  noticeText?: string;
}) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  const c = {
    detailTitle: content?.detailTitle ?? "Transaction details",
    descriptionLabel: content?.detailDescriptionLabel ?? "Description",
    amountLabel: content?.detailAmountLabel ?? "Amount",
    typeLabel: content?.detailTypeLabel ?? "Type",
    dateLabel: content?.detailDateLabel ?? "Date",
    referenceLabel: content?.detailReferenceLabel ?? "Reference",
    statusLabel: content?.detailStatusLabel ?? "Status",
    copyButton: content?.copyReferenceButton ?? "Copy Reference",
    copiedText: content?.copiedText ?? "Copied",
    copiedToast: content?.referenceCopiedToast ?? "Reference copied",
    copyFailedToast: content?.copyFailedToast ?? "Couldn’t copy — select the reference and copy manually",
  };

  async function copyReference() {
    if (!tx) return;
    try {
      await navigator.clipboard.writeText(tx.reference);
      toast(c.copiedToast);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1600);
    } catch {
      toast(c.copyFailedToast);
    }
  }

  return (
    <Sheet open={!!tx} onClose={onClose} title={c.detailTitle}>
      {tx && (
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-5 sm:px-6 sm:py-6">
          <div className="flex items-center gap-3.5">
            <TransactionIcon type={tx.type} className="h-12 w-12 shrink-0 rounded-xl" />
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">{c.descriptionLabel}</p>
              <p dir="ltr" className="break-words text-[17px] font-semibold leading-snug">{tx.description}</p>
            </div>
          </div>

          <div className="mt-5 rounded-xl bg-canvas px-5 py-4 sm:mt-6">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">{c.amountLabel}</p>
            <Amount tx={tx} currency={currency} className="mt-1 block text-[28px] leading-tight tracking-tight sm:text-[30px]" />
            <span className="sr-only">{formatMoney(tx.amount, currency)}</span>
          </div>

          <dl className="mt-3 divide-y divide-line">
            <Field label={c.typeLabel}><TypeBadge type={tx.type} content={content} /></Field>
            <Field label={c.dateLabel}>{formatDateLong(tx.date)}</Field>
            <Field label={c.referenceLabel}>
              <span className="flex flex-col items-start gap-2.5">
                <span className="break-all font-mono text-[13px]">{tx.reference}</span>
                <button
                  onClick={copyReference}
                  aria-label={copied ? c.copiedToast : `${c.copyButton}: ${tx.reference}`}
                  className="inline-flex h-11 shrink-0 items-center gap-2 rounded-[10px] border border-line px-3.5 text-sm font-medium text-ink transition-[background-color,border-color,transform] duration-150 hover:border-[#cfd8d3] hover:bg-canvas active:scale-[0.985] sm:h-9 sm:px-3 sm:text-xs"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-brand motion-safe:animate-[label-in_.18s_ease-out] sm:h-3.5 sm:w-3.5" aria-hidden="true" />
                  ) : (
                    <Copy className="h-4 w-4 sm:h-3.5 sm:w-3.5" aria-hidden="true" />
                  )}
                  {copied ? c.copiedText : c.copyButton}
                </button>
              </span>
            </Field>
            <Field label={c.statusLabel}>
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-brand" aria-hidden="true" /> {tx.status}
              </span>
            </Field>
          </dl>
          <p className="mt-4 text-[12px] leading-snug text-muted">{noticeText}</p>
        </div>
      )}
    </Sheet>
  );
}
