import { Lock } from "lucide-react";
import { TransactionsExplorer } from "@/components/dashboard/TransactionsExplorer";
import { PageHeader } from "@/components/layout/PageHeader";
import { Reveal } from "@/components/ui/Reveal";
import { requireRole } from "@/lib/auth";
import { getFinancialSnapshot } from "@/lib/records-service";

export default async function AdminTransactionsPage() {
  await requireRole("admin");
  const fin = await getFinancialSnapshot();
  return (
    <Reveal>
      <PageHeader title="Transaction Records" subtitle="Browse the recorded history shown in the private dashboard." />
      <p className="mb-5 flex items-start gap-2.5 rounded-xl border border-line bg-white px-4 py-3 text-sm text-muted">
        <Lock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <span>
          <span className="font-medium text-ink">Financial Record — Read Only.</span> Financial record values cannot be changed from the
          administration panel.
        </span>
      </p>
      <TransactionsExplorer transactions={fin.transactions} currency={fin.currency} />
    </Reveal>
  );
}
