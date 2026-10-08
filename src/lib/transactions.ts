// Pure, client-safe helpers for sorting, filtering and summarising transaction records.
import type { TransactionRecord } from "@/data/records";

export type SortKey = "newest" | "oldest" | "highest" | "lowest";
export type TypeFilter = "all" | "credit" | "debit";
export type AmountFilter = "all" | "under100" | "100to199" | "200plus";

export interface TxFilters {
  query: string;
  type: TypeFilter;
  year: string; // "all" or a four-digit year
  amount: AmountFilter;
  sort: SortKey;
}

export const defaultFilters: TxFilters = { query: "", type: "all", year: "all", amount: "all", sort: "newest" };

export const sortLabels: Record<SortKey, string> = {
  newest: "Newest first",
  oldest: "Oldest first",
  highest: "Highest amount",
  lowest: "Lowest amount",
};

export const amountLabels: Record<AmountFilter, string> = {
  all: "All amounts",
  under100: "Under $100,000",
  "100to199": "$100,000–$199,999",
  "200plus": "$200,000+",
};

/** True when any narrowing filter (not sort) differs from the default. */
export function hasActiveFilters(f: TxFilters): boolean {
  return f.query.trim() !== "" || f.type !== "all" || f.year !== "all" || f.amount !== "all";
}

function inAmountRange(amount: number, range: AmountFilter): boolean {
  switch (range) {
    case "under100":
      return amount < 100_000;
    case "100to199":
      return amount >= 100_000 && amount < 200_000;
    case "200plus":
      return amount >= 200_000;
    default:
      return true;
  }
}

export function sortTransactions(txs: TransactionRecord[], sort: SortKey): TransactionRecord[] {
  // Array.prototype.sort is stable, so equal keys keep their source order.
  const copy = [...txs];
  switch (sort) {
    case "oldest":
      return copy.sort((a, b) => a.date.localeCompare(b.date));
    case "highest":
      return copy.sort((a, b) => b.amount - a.amount);
    case "lowest":
      return copy.sort((a, b) => a.amount - b.amount);
    default:
      return copy.sort((a, b) => b.date.localeCompare(a.date));
  }
}

export function applyFilters(txs: TransactionRecord[], f: TxFilters): TransactionRecord[] {
  const q = f.query.trim().toLowerCase();
  const filtered = txs.filter(
    (t) =>
      (f.type === "all" || t.type === f.type) &&
      (f.year === "all" || t.date.startsWith(f.year)) &&
      inAmountRange(t.amount, f.amount) &&
      (!q || t.description.toLowerCase().includes(q) || t.reference.toLowerCase().includes(q)),
  );
  return sortTransactions(filtered, f.sort);
}

export function availableYears(txs: TransactionRecord[]): string[] {
  return [...new Set(txs.map((t) => t.date.slice(0, 4)))].sort((a, b) => b.localeCompare(a));
}

export interface TransactionSummary {
  totalCredits: number;
  totalDebits: number;
  count: number;
  creditCount: number;
  debitCount: number;
  latestDate: string | null;
}

export function summarize(txs: TransactionRecord[]): TransactionSummary {
  let totalCredits = 0;
  let totalDebits = 0;
  let creditCount = 0;
  let debitCount = 0;
  let latestDate: string | null = null;
  for (const t of txs) {
    if (t.type === "credit") {
      totalCredits += t.amount;
      creditCount++;
    } else {
      totalDebits += t.amount;
      debitCount++;
    }
    if (!latestDate || t.date > latestDate) latestDate = t.date;
  }
  return { totalCredits, totalDebits, count: txs.length, creditCount, debitCount, latestDate };
}
