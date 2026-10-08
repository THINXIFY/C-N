import { Building2, FileLock2, UserRound, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { CustomCssInjector } from "@/components/shared/CustomCssInjector";
import { Reveal } from "@/components/ui/Reveal";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { formatDate, formatMoney } from "@/lib/format";
import { requireRole } from "@/lib/auth";
import { getAccount, getContent, getFinancialForUser } from "@/lib/records-service";

function Section({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children: React.ReactNode }) {
  return (
    <section className="px-5 py-6 sm:px-8">
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        <Icon className="h-4 w-4 text-brand" aria-hidden="true" /> {title}
      </h2>
      <dl className="mt-5 grid gap-x-12 gap-y-5 sm:grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">{children}</dl>
    </section>
  );
}

function Item({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-1 break-words text-[15px] font-medium">{children}</dd>
    </div>
  );
}

export default async function AccountPage() {
  const user = await requireRole("user");
  const [a, { account: c, notices }, fin] = await Promise.all([getAccount(user), getContent(), getFinancialForUser(user.id)]);
  return (
    <div data-page="account" className="account-shell">
      <CustomCssInjector scope="account" />
      <Reveal className="max-w-4xl">
        <PageHeader title={c.title} subtitle={c.accountIntro} />

        <div className="overflow-hidden rounded-2xl border border-line bg-white">
          <div className="flex flex-wrap items-center gap-4 border-b border-line bg-canvas/60 px-5 py-6 sm:px-8">
            <UserAvatar name={a.holderName} photoPath={a.photoPath} size={64} textClassName="text-lg" className="ring-1 ring-brand/20" />
            <div className="min-w-0 flex-1">
              <p className="text-lg font-semibold leading-tight">{a.holderName}</p>
              <p className="mt-0.5 break-words text-sm text-muted">{a.businessName}</p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1 text-xs font-medium text-brand-dark">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" /> {a.status}
            </span>
          </div>

          <div className="divide-y divide-line">
            <div className="grid divide-y divide-line sm:grid-cols-2 sm:divide-x sm:divide-y-0">
              <Section icon={UserRound} title={c.accountHolderSectionTitle}>
                <Item label={c.nameLabel}>{a.holderName}</Item>
              </Section>
              <Section icon={Building2} title={c.businessSectionTitle}>
                <Item label={c.nameLabel}>{a.businessName}</Item>
              </Section>
            </div>
            <Section icon={Wallet} title={c.balanceSectionTitle}>
              {fin ? (
                <>
                  <Item label={c.balanceLabel}>
                    <span className="tabular text-xl font-semibold tracking-tight">{formatMoney(fin.balance, fin.currency)}</span>
                    <span className="mt-0.5 block text-xs font-normal text-muted">{notices.accountBalanceHelperText}</span>
                  </Item>
                  <Item label={c.recordsInHistoryLabel}>{fin.summary.count}</Item>
                  {fin.summary.latestDate && <Item label={c.latestActivityLabel}>{formatDate(fin.summary.latestDate)}</Item>}
                </>
              ) : (
                <Item label={c.noRecordLabel}>{c.noRecordText}</Item>
              )}
            </Section>
            <Section icon={FileLock2} title={c.recordDetailsSectionTitle}>
              <Item label={c.recordStatusLabel}>{a.status}</Item>
              <Item label={c.recordTypeLabel}>{a.recordType}</Item>
            </Section>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
