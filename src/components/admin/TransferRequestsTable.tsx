"use client";

import { Landmark } from "lucide-react";
import { useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import type { TransferRequest } from "@/data/transfer-requests";
import { cn } from "@/lib/cn";
import { formatDateTime, formatMoney } from "@/lib/format";

function ResultBadge({ status }: { status: TransferRequest["status"] }) {
  const accepted = status === "submitted";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        accepted ? "bg-brand-soft text-brand-dark" : "bg-debit-soft text-debit",
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", accepted ? "bg-brand" : "bg-debit")} aria-hidden="true" />
      {accepted ? "Accepted" : "Unavailable"}
    </span>
  );
}

export function TransferRequestsTable({ requests, userNames }: { requests: TransferRequest[]; userNames: Record<string, string> }) {
  const [selected, setSelected] = useState<TransferRequest | null>(null);

  if (requests.length === 0) {
    return (
      <div className="rounded-2xl border border-line bg-white">
        <EmptyState icon={Landmark} title="No transfer requests yet" description="Submitted transfer-request forms will appear here." />
      </div>
    );
  }

  return (
    <>
      <p className="mb-3 px-1 text-sm text-muted">
        <span className="font-medium text-ink">{requests.length}</span> {requests.length === 1 ? "request" : "requests"}
      </p>
      <div className="rounded-2xl border border-line bg-white">
        <table className="hidden w-full table-fixed border-collapse md:table">
          <caption className="sr-only">Transfer requests</caption>
          <colgroup>
            <col className="w-[13%]" />
            <col className="w-[14%]" />
            <col className="w-[11%]" />
            <col className="w-[17%]" />
            <col className="w-[15%]" />
            <col className="w-[12%]" />
            <col className="w-[18%]" />
          </colgroup>
          <thead>
            <tr className="border-b border-line text-left text-xs font-medium uppercase tracking-wide text-muted">
              <th scope="col" className="px-5 py-3.5 font-medium">Date</th>
              <th scope="col" className="px-3 py-3.5 font-medium">User</th>
              <th scope="col" className="px-3 py-3.5 font-medium">Amount</th>
              <th scope="col" className="px-3 py-3.5 font-medium">Recipient</th>
              <th scope="col" className="px-3 py-3.5 font-medium">Bank</th>
              <th scope="col" className="px-3 py-3.5 font-medium">Reference</th>
              <th scope="col" className="px-3 py-3.5 font-medium">Result</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((r) => (
              <tr key={r.id} className="cursor-pointer border-b border-line/70 transition-colors duration-150 last:border-0 hover:bg-canvas" onClick={() => setSelected(r)}>
                <td className="px-5 py-3.5 text-sm text-muted">{formatDateTime(r.createdAt)}</td>
                <td className="px-3 py-3.5"><span className="block truncate text-sm font-medium">{userNames[r.userId] ?? "Unknown user"}</span></td>
                <td className="px-3 py-3.5 text-sm font-medium tabular">{formatMoney(r.amount, r.currency)}</td>
                <td className="px-3 py-3.5"><span className="block truncate text-sm">{r.recipientName}</span></td>
                <td className="px-3 py-3.5"><span className="block truncate text-sm text-muted">{r.bankName}</span></td>
                <td className="px-3 py-3.5"><span className="block truncate text-sm text-muted">{r.reference || "—"}</span></td>
                <td className="px-3 py-3.5"><ResultBadge status={r.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>

        <ul className="space-y-2 p-2 md:hidden">
          {requests.map((r) => (
            <li key={r.id} className="cursor-pointer rounded-xl border border-line/80 bg-white p-3.5" onClick={() => setSelected(r)}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <span className="block break-words text-sm font-medium leading-snug">{r.recipientName}</span>
                  <span className="block truncate text-xs text-muted">{userNames[r.userId] ?? "Unknown user"} · {r.bankName}</span>
                </div>
                <span className="shrink-0 text-sm font-medium tabular">{formatMoney(r.amount, r.currency)}</span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <ResultBadge status={r.status} />
                <span className="ml-auto text-xs text-muted">{formatDateTime(r.createdAt)}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-0 sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Transfer request details"
          onClick={() => setSelected(null)}
        >
          <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-6 sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-semibold">{selected.recipientName}</h2>
              <ResultBadge status={selected.status} />
            </div>
            <dl className="mt-4 divide-y divide-line">
              <Row label="Submitted" value={formatDateTime(selected.createdAt)} />
              <Row label="User" value={userNames[selected.userId] ?? "Unknown user"} />
              <Row label="Amount" value={formatMoney(selected.amount, selected.currency)} />
              <Row label="Transfer type" value={selected.transferType === "domestic" ? "Domestic Canadian Wire" : "International Wire"} />
              <Row label="Recipient address" value={`${selected.recipientAddress}, ${selected.recipientCity}${selected.recipientProvince ? ", " + selected.recipientProvince : ""} ${selected.recipientPostalCode}, ${selected.recipientCountry}`} />
              <Row label="Bank" value={selected.bankName} />
              {selected.branchName && <Row label="Branch" value={selected.branchName} />}
              <Row label="Bank address" value={`${selected.bankAddress}, ${selected.bankCity}${selected.bankProvince ? ", " + selected.bankProvince : ""}${selected.bankPostalCode ? " " + selected.bankPostalCode : ""}`} />
              {selected.institutionNumber && <Row label="Institution number" value={selected.institutionNumber} />}
              {selected.transitNumber && <Row label="Transit number" value={selected.transitNumber} />}
              <Row label="Account number" value={selected.accountNumberMasked} />
              {selected.swiftBic && <Row label="SWIFT / BIC" value={selected.swiftBic} />}
              {selected.iban && <Row label="IBAN" value={selected.iban} />}
              {selected.routingSortCode && <Row label="Routing / sort code" value={selected.routingSortCode} />}
              {selected.intermediaryBank && <Row label="Intermediary bank" value={selected.intermediaryBank} />}
              <Row label="Fee responsibility" value={selected.feeResponsibility[0].toUpperCase() + selected.feeResponsibility.slice(1)} />
              {selected.reference && <Row label="Reference" value={selected.reference} />}
              {selected.purpose && <Row label="Purpose" value={selected.purpose} />}
            </dl>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="mt-5 flex h-11 w-full items-center justify-center rounded-[10px] border border-line text-sm font-medium text-ink transition-colors hover:bg-canvas"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-0.5 py-2.5 sm:grid-cols-[150px_1fr] sm:gap-4">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="min-w-0 break-words text-sm font-medium">{value}</dd>
    </div>
  );
}
