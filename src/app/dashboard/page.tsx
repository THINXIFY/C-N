import { ArrowDownLeft, ArrowUpRight, CalendarClock, ListOrdered } from "lucide-react";
import { AccountSummary } from "@/components/dashboard/AccountSummary";
import { BalanceCard } from "@/components/dashboard/BalanceCard";
import { NoFinancialRecord } from "@/components/dashboard/NoFinancialRecord";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { SummaryCard } from "@/components/dashboard/SummaryCard";
import { PageHeader } from "@/components/layout/PageHeader";
import { CustomCssInjector } from "@/components/shared/CustomCssInjector";
import { Reveal } from "@/components/ui/Reveal";
import { requireRole } from "@/lib/auth";
import { formatDate, formatMoney, greeting } from "@/lib/format";
import { getAccount, getContent, getFinancialForUser } from "@/lib/records-service";

export default async function OverviewPage() {
  const user = await requireRole("user");
  const [account, { dashboard: d, transactions: tx, notices }, fin] = await Promise.all([getAccount(user), getContent(), getFinancialForUser(user.id)]);
  const first = account.holderName.split(" ")[0];
  const side = (
    <>
      {account.showRecordInfo && (
        <AccountSummary
          account={account}
          heading={d.recordInfoHeading}
          detailsLinkText={d.detailsLinkText}
          holderLabel={d.recordInfoHolderLabel}
          businessLabel={d.recordInfoBusinessLabel}
          typeLabel={d.recordInfoTypeLabel}
          statusLabel={d.recordInfoStatusLabel}
        />
      )}
      {account.showQuickActions && <QuickActions heading={d.quickActionsHeading} content={d} />}
    </>
  );

  return (
    <div data-page="dashboard" className="dashboard-shell">
      <CustomCssInjector scope="dashboard" />
      <Reveal>
        <PageHeader title={account.greeting || `${greeting(new Date(), d)}, ${first}`} subtitle={account.subtitle} />
      </Reveal>

      {!fin ? (
        <div className="grid gap-5 min-[1100px]:grid-cols-[minmax(0,1fr)_320px]">
          <Reveal index={1}>
            <NoFinancialRecord title={d.noRecordTitle} description={d.noRecordDescription} descriptionCompact={d.noRecordDescriptionCompact} />
          </Reveal>
          <Reveal index={2} className="space-y-5">
            {side}
          </Reveal>
        </div>
      ) : (
        <div className="space-y-5">
          <Reveal index={1}>
            <BalanceCard
              holderName={account.holderName}
              businessName={account.businessName}
              balance={fin.balance}
              currency={fin.currency}
              latestDate={fin.summary.latestDate}
              hiddenByDefault={account.balanceHiddenDefault}
              balanceLabel={d.balanceLabel}
              helperText={notices.balanceCardHelperText}
            />
          </Reveal>

          <Reveal index={2} className="grid grid-cols-1 gap-3 min-[380px]:grid-cols-2 sm:gap-4 min-[1100px]:grid-cols-4">
            <SummaryCard
              icon={ArrowDownLeft}
              tone="credit"
              label={d.creditsLabel}
              value={formatMoney(fin.summary.totalCredits, fin.currency)}
              description={`${fin.summary.creditCount} ${d.creditsDescription}`}
            />
            <SummaryCard
              icon={ArrowUpRight}
              tone="debit"
              label={d.debitsLabel}
              value={formatMoney(fin.summary.totalDebits, fin.currency)}
              description={`${fin.summary.debitCount} ${d.debitsDescription}`}
            />
            <SummaryCard icon={ListOrdered} label={d.transactionsLabel} value={String(fin.summary.count)} description={d.transactionsDescription} />
            <SummaryCard
              icon={CalendarClock}
              label={d.latestActivityLabel}
              value={fin.summary.latestDate ? formatDate(fin.summary.latestDate) : "—"}
              description={d.latestActivityDescription}
            />
          </Reveal>

          <div className="grid gap-5 pt-3 min-[1360px]:grid-cols-[minmax(0,1fr)_320px]">
            <Reveal index={3}>
              <RecentTransactions transactions={fin.recent} currency={fin.currency} heading={d.recentHeading} viewAllText={d.viewAllText} content={tx} noticeText={notices.transactionDetailHelperText} />
            </Reveal>
            <Reveal index={4} className="space-y-5 min-[1360px]:pt-[44px]">
              {side}
            </Reveal>
          </div>
        </div>
      )}
    </div>
  );
}
