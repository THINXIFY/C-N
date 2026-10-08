"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Search, SearchX, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { SelectField } from "@/components/ui/SelectField";
import { cn } from "@/lib/cn";
import type { TransactionsContent } from "@/data/settings";
import {
  amountLabels as defaultAmountLabels,
  applyFilters,
  availableYears,
  defaultFilters,
  hasActiveFilters,
  sortLabels as defaultSortLabels,
  type AmountFilter,
  type SortKey,
  type TxFilters,
  type TypeFilter,
} from "@/lib/transactions";
import type { TransactionRecord } from "@/data/records";
import { TransactionDetailSheet } from "./TransactionDetailSheet";
import { TransactionTable } from "./TransactionRow";

export function TransactionsExplorer({
  transactions,
  currency,
  content,
  noticeText,
}: {
  transactions: TransactionRecord[];
  currency: string;
  content?: TransactionsContent;
  noticeText?: string;
}) {
  const [filters, setFilters] = useState<TxFilters>(defaultFilters);
  const [selected, setSelected] = useState<TransactionRecord | null>(null);

  const years = useMemo(() => availableYears(transactions), [transactions]);
  const rows = useMemo(() => applyFilters(transactions, filters), [transactions, filters]);
  // Pagination seam: slice `rows` here (page * pageSize) when it becomes necessary.
  const visible = rows;
  const active = hasActiveFilters(filters);

  const set = <K extends keyof TxFilters>(key: K, value: TxFilters[K]) => setFilters((f) => ({ ...f, [key]: value }));
  const clearAll = () => setFilters((f) => ({ ...defaultFilters, sort: f.sort }));

  const c = {
    searchPlaceholder: content?.searchPlaceholder ?? "Search transactions",
    filterTypeLabel: content?.filterTypeLabel ?? "Type",
    typeAllLabel: content?.typeAllLabel ?? "All",
    typeCreditsLabel: content?.typeCreditsLabel ?? "Credits",
    typeDebitsLabel: content?.typeDebitsLabel ?? "Debits",
    filterDateLabel: content?.filterDateLabel ?? "Date",
    dateAllTimeLabel: content?.dateAllTimeLabel ?? "All time",
    filterAmountLabel: content?.filterAmountLabel ?? "Amount",
    filterSortLabel: content?.filterSortLabel ?? "Sort by",
    clearFiltersText: content?.clearFiltersText ?? "Clear filters",
    emptyTitle: content?.emptyTitle ?? "No matching transactions",
    emptyDescription: content?.emptyDescription ?? "We couldn’t find any records matching your current filters.",
  };
  const amountLabels: Record<AmountFilter, string> = content
    ? { all: content.amountAllLabel, under100: content.amountUnder100Label, "100to199": content.amount100to199Label, "200plus": content.amount200plusLabel }
    : defaultAmountLabels;
  const sortLabels: Record<SortKey, string> = content
    ? { newest: content.sortNewestLabel, oldest: content.sortOldestLabel, highest: content.sortHighestLabel, lowest: content.sortLowestLabel }
    : defaultSortLabels;
  const typeTabs: Array<{ value: TypeFilter; label: string }> = [
    { value: "all", label: c.typeAllLabel },
    { value: "credit", label: c.typeCreditsLabel },
    { value: "debit", label: c.typeDebitsLabel },
  ];
  const resultCountText = (content?.resultCountTemplate ?? "Showing {shown} of {total} records")
    .replace("{shown}", String(visible.length))
    .replace("{total}", String(transactions.length));

  return (
    <>
      <div className="mb-4 rounded-2xl border border-line bg-white p-4 sm:p-5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted" aria-hidden="true" />
          <input
            type="text"
            value={filters.query}
            onChange={(e) => set("query", e.target.value)}
            aria-label="Search transactions by description or reference"
            placeholder={c.searchPlaceholder}
            className="h-12 w-full rounded-xl border border-line bg-white pl-11 pr-11 text-[15px] placeholder:text-muted/70 transition-[border-color,box-shadow] duration-150 focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15"
          />
          {filters.query && (
            <button
              onClick={() => set("query", "")}
              aria-label="Clear search"
              className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-muted hover:bg-canvas hover:text-ink"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 lg:grid-cols-[auto_1fr_1fr_1fr] lg:items-end">
          <div className="min-[360px]:col-span-2 lg:col-span-1">
            <span id="type-label" className="mb-1.5 block text-xs font-medium text-muted">{c.filterTypeLabel}</span>
            <div role="radiogroup" aria-labelledby="type-label" className="flex h-12 rounded-[10px] border border-line bg-canvas p-0.5 sm:h-11 sm:p-1">
              {typeTabs.map((t) => (
                <button
                  key={t.value}
                  role="radio"
                  aria-checked={filters.type === t.value}
                  onClick={() => set("type", t.value)}
                  className={cn(
                    "flex-1 rounded-[7px] px-4 text-sm font-medium transition-colors duration-150",
                    filters.type === t.value ? "bg-white text-ink shadow-[0_1px_2px_rgba(23,32,28,.08)]" : "text-muted hover:text-ink",
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <SelectField label={c.filterDateLabel} value={filters.year} onChange={(v) => set("year", v)}>
            <option value="all">{c.dateAllTimeLabel}</option>
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </SelectField>
          <SelectField label={c.filterAmountLabel} value={filters.amount} onChange={(v: AmountFilter) => set("amount", v)}>
            {(Object.keys(amountLabels) as AmountFilter[]).map((k) => (
              <option key={k} value={k}>{amountLabels[k]}</option>
            ))}
          </SelectField>
          <SelectField label={c.filterSortLabel} className="min-[360px]:col-span-2 lg:col-span-1" value={filters.sort} onChange={(v: SortKey) => set("sort", v)}>
            {(Object.keys(sortLabels) as SortKey[]).map((k) => (
              <option key={k} value={k}>{sortLabels[k]}</option>
            ))}
          </SelectField>
        </div>
      </div>

      <div className="mb-3 flex min-h-9 items-center justify-between gap-3 px-1">
        <p className="text-sm text-muted" aria-live="polite" data-testid="result-count">
          {resultCountText}
        </p>
        <AnimatePresence initial={false}>
          {active && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <button
                onClick={clearAll}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-brand-dark hover:bg-brand-soft"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" /> {c.clearFiltersText}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-white">
        {visible.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title={c.emptyTitle}
            description={c.emptyDescription}
            action={
              <Button variant="secondary" onClick={clearAll}>
                {c.clearFiltersText}
              </Button>
            }
          />
        ) : (
          <motion.div
            key={visible.map((t) => t.id).join("|")}
            initial={{ opacity: 0.35 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.18 }}
          >
            <TransactionTable transactions={visible} currency={currency} onSelect={setSelected} content={content} />
          </motion.div>
        )}
      </div>

      <TransactionDetailSheet tx={selected} currency={currency} onClose={() => setSelected(null)} content={content} noticeText={noticeText} />
    </>
  );
}
