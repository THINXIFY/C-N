import { NoFinancialRecord } from "@/components/dashboard/NoFinancialRecord";
import { TransactionsExplorer } from "@/components/dashboard/TransactionsExplorer";
import { PageHeader } from "@/components/layout/PageHeader";
import { Reveal } from "@/components/ui/Reveal";
import { requireRole } from "@/lib/auth";
import { getContent, getFinancialForUser } from "@/lib/records-service";

export default async function TransactionsPage() {
  const user = await requireRole("user");
  const [fin, { transactions: tx, dashboard: d, notices }] = await Promise.all([getFinancialForUser(user.id), getContent()]);
  return (
    <Reveal>
      <PageHeader title={tx.title} subtitle={tx.subtitle} />
      {fin ? (
        <TransactionsExplorer transactions={fin.transactions} currency={fin.currency} content={tx} noticeText={notices.transactionDetailHelperText} />
      ) : (
        <NoFinancialRecord compact title={d.noRecordTitle} descriptionCompact={d.noRecordDescriptionCompact} />
      )}
    </Reveal>
  );
}
