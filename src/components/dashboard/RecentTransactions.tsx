"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { TransactionsContent } from "@/data/settings";
import type { TransactionRecord } from "@/data/records";
import { TransactionDetailSheet } from "./TransactionDetailSheet";
import { TransactionTable } from "./TransactionRow";

export function RecentTransactions({
  transactions,
  currency,
  heading = "Recent Transactions",
  viewAllText = "View all",
  content,
  noticeText,
}: {
  transactions: TransactionRecord[];
  currency: string;
  heading?: string;
  viewAllText?: string;
  content?: TransactionsContent;
  noticeText?: string;
}) {
  const [selected, setSelected] = useState<TransactionRecord | null>(null);
  return (
    <section aria-labelledby="recent-h">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 id="recent-h" className="text-lg font-semibold">{heading}</h2>
        <Link
          href="/dashboard/transactions"
          className="group -my-2 inline-flex min-h-11 items-center gap-1.5 whitespace-nowrap px-1 text-sm font-medium text-brand-dark hover:underline"
        >
          {viewAllText}
          <ArrowRight className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" />
        </Link>
      </div>
      <div className="overflow-hidden rounded-2xl border border-line bg-white">
        <TransactionTable transactions={transactions} currency={currency} onSelect={setSelected} content={content} />
      </div>
      <TransactionDetailSheet tx={selected} currency={currency} onClose={() => setSelected(null)} content={content} noticeText={noticeText} />
    </section>
  );
}
