import { ArrowDownLeft, ArrowUpRight, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatDate, formatDateCompact, formatMoney } from "@/lib/format";
import type { TransactionsContent } from "@/data/settings";
import type { TransactionRecord } from "@/data/records";

export function TransactionIcon({ type, className }: { type: TransactionRecord["type"]; className?: string }) {
  const credit = type === "credit";
  return (
    <span
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]",
        credit ? "bg-brand-soft text-brand-dark" : "bg-debit-soft text-debit",
        className,
      )}
    >
      {credit ? <ArrowDownLeft className="h-[17px] w-[17px]" /> : <ArrowUpRight className="h-[17px] w-[17px]" />}
    </span>
  );
}

export function TypeBadge({ type, content }: { type: TransactionRecord["type"]; content?: Pick<TransactionsContent, "creditLabel" | "debitLabel"> }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        type === "credit" ? "bg-brand-soft text-brand-dark" : "bg-debit-soft text-debit",
      )}
    >
      {type === "credit" ? (content?.creditLabel ?? "Credit") : (content?.debitLabel ?? "Debit")}
    </span>
  );
}

export function Amount({ tx, currency, className }: { tx: TransactionRecord; currency: string; className?: string }) {
  return (
    <span className={cn("tabular font-semibold", tx.type === "credit" ? "text-credit" : "text-debit", className)}>
      {formatMoney(tx.amount, currency, tx.type)}
    </span>
  );
}

interface TableProps {
  transactions: TransactionRecord[];
  currency: string;
  onSelect: (tx: TransactionRecord) => void;
  content?: TransactionsContent;
}

/** Table from md up; compact tappable cards below. Presentational only — filtering lives in the parent. */
export function TransactionTable({ transactions, currency, onSelect, content }: TableProps) {
  const c = {
    date: content?.tableDate ?? "Date",
    description: content?.tableDescription ?? "Description",
    reference: content?.tableReference ?? "Reference",
    type: content?.tableType ?? "Type",
    amount: content?.tableAmount ?? "Amount",
  };
  return (
    <>
      {/* Desktop / tablet table */}
      <table className="hidden w-full table-fixed border-collapse md:table">
        <caption className="sr-only">Recorded transactions</caption>
        <colgroup>
          <col className="w-[104px] lg:w-[128px]" />
          <col />
          <col className="w-[21%] lg:w-[28%]" />
          <col className="w-[76px] lg:w-[84px]" />
          <col className="w-[136px] lg:w-[148px]" />
        </colgroup>
        <thead>
          <tr className="border-b border-line text-left text-xs font-medium uppercase tracking-wide text-muted">
            <th scope="col" className="px-4 py-3.5 font-medium lg:px-5">{c.date}</th>
            <th scope="col" className="px-3 py-3.5 font-medium">{c.description}</th>
            <th scope="col" className="px-3 py-3.5 font-medium">{c.reference}</th>
            <th scope="col" className="px-3 py-3.5 font-medium">{c.type}</th>
            <th scope="col" className="px-4 py-3.5 text-right font-medium lg:px-5">{c.amount}</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => (
            <tr
              key={tx.id}
              onClick={() => onSelect(tx)}
              className="group cursor-pointer border-b border-line/70 transition-colors duration-150 ease-out last:border-0 hover:bg-canvas focus-within:bg-canvas"
            >
              <td className="whitespace-nowrap px-4 py-4 text-sm text-muted lg:px-5">{formatDate(tx.date)}</td>
              <td className="px-3 py-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(tx);
                  }}
                  aria-label={`View details for ${tx.description}`}
                  className="flex w-full items-center gap-3 rounded-md text-left"
                >
                  <TransactionIcon type={tx.type} className="hidden lg:flex" />
                  <span dir="ltr" className="min-w-0 break-words text-sm font-medium">
                    {tx.description}
                  </span>
                </button>
              </td>
              <td className="px-3 py-4">
                <span className="break-all font-mono text-xs text-muted">{tx.reference}</span>
              </td>
              <td className="px-3 py-4">
                <TypeBadge type={tx.type} content={content} />
              </td>
              <td className="whitespace-nowrap px-4 py-4 text-right text-sm lg:px-5">
                <span className="inline-flex items-center justify-end gap-1.5">
                  <Amount tx={tx} currency={currency} />
                  <ChevronRight aria-hidden="true" className="h-4 w-4 shrink-0 -translate-x-1 text-muted opacity-0 transition-[opacity,transform] duration-150 ease-out group-hover:translate-x-0 group-hover:opacity-100 group-focus-within:translate-x-0 group-focus-within:opacity-100 motion-reduce:transition-none" />
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Mobile cards */}
      <ul className="space-y-2 p-2 md:hidden">
        {transactions.map((tx) => (
          <li key={tx.id}>
            <button
              onClick={() => onSelect(tx)}
              aria-label={`View details for ${tx.description}`}
              className="flex min-h-[76px] w-full items-center gap-3 rounded-xl border border-line/80 bg-white px-3.5 py-3 text-left transition-[background-color,transform] duration-150 ease-out active:scale-[0.99] active:bg-canvas motion-reduce:active:scale-100"
            >
              <TransactionIcon type={tx.type} />
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-start justify-between gap-x-3 gap-y-0.5">
                  <span dir="ltr" className="min-w-[7.5rem] flex-1 break-words text-sm font-medium leading-snug">
                    {tx.description}
                  </span>
                  <Amount tx={tx} currency={currency} className="shrink-0 text-sm" />
                </span>
                <span className="mt-1 flex items-center justify-between gap-3 text-xs text-muted">
                  <span>{formatDateCompact(tx.date)}, {tx.date.slice(0, 4)}</span>
                  <TypeBadge type={tx.type} content={content} />
                </span>
                <span className="mt-1 block break-all font-mono text-[11px] text-muted/90">{tx.reference}</span>
              </span>
              <ChevronRight className="hidden h-4 w-4 shrink-0 text-muted/50 min-[360px]:block" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
