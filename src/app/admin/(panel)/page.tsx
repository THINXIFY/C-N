import { ArrowDownLeft, ArrowUpRight, CalendarClock, ChevronRight, FileText, ListOrdered, Lock, ShieldCheck, Type, UserCheck, UserMinus, UserPlus, Users, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { AdminSection } from "@/components/admin/AdminSection";
import { RoleBadge } from "@/components/admin/UserBadges";
import { SummaryCard } from "@/components/dashboard/SummaryCard";
import { PageHeader } from "@/components/layout/PageHeader";
import { Reveal } from "@/components/ui/Reveal";
import { UserAvatar } from "@/components/ui/UserAvatar";
import type { UserSummary } from "@/data/users";
import { requireRole } from "@/lib/auth";
import { formatDate, formatDateTime, formatMoney } from "@/lib/format";
import { getFinancialSnapshot } from "@/lib/records-service";
import { getContentSettings, getUserStats, listUsers } from "@/lib/users-service";

const manage = [
  { href: "/admin/users", icon: Users, title: "Manage Users", hint: "Accounts, roles and access" },
  { href: "/admin/users/new", icon: UserPlus, title: "Add User", hint: "Create a new account" },
  { href: "/admin/content", icon: Type, title: "Edit Dashboard Content", hint: "Text and support help" },
  { href: "/admin/transactions", icon: FileText, title: "Browse Transactions", hint: "Read-only record history" },
];

function Stat(props: { icon: LucideIcon; label: string; value: string; description: string; tone?: "credit" | "debit" | "neutral" }) {
  return <SummaryCard {...props} />;
}

function UserList({ title, users, when, empty }: { title: string; users: UserSummary[]; when: (u: UserSummary) => string; empty: string }) {
  return (
    <AdminSection title={title}>
      {users.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted">{empty}</p>
      ) : (
        <ul className="-my-2 divide-y divide-line">
          {users.map((u) => (
            <li key={u.id}>
              <Link href={`/admin/users/${u.id}`} className="flex items-center gap-3 rounded-lg py-3 transition-colors hover:bg-canvas/60">
                <UserAvatar name={u.displayName} photoPath={u.profilePhotoPath} size={36} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{u.displayName}</span>
                  <span className="block truncate text-xs text-muted">{when(u)}</span>
                </span>
                <RoleBadge role={u.role} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AdminSection>
  );
}

export default async function AdminOverview() {
  await requireRole("admin");
  const [stats, fin, content, users] = await Promise.all([getUserStats(), getFinancialSnapshot(), getContentSettings(), listUsers()]);
  const lastUpdated = [content.updatedAt, ...users.map((u) => u.updatedAt)].filter(Boolean).sort().at(-1) ?? null;

  return (
    <>
      <Reveal>
        <PageHeader
          title="Dashboard Management"
          subtitle="Manage who can sign in to Ledgerline and how each record is presented."
          action={
            <p className="text-sm text-muted">
              Last updated: <span className="font-medium text-ink">{lastUpdated ? formatDateTime(lastUpdated) : "—"}</span>
            </p>
          }
        />
      </Reveal>

      <div className="space-y-5">
        <Reveal index={1} className="grid grid-cols-1 gap-3 min-[380px]:grid-cols-2 sm:gap-4 min-[1100px]:grid-cols-4">
          <Stat icon={Users} label="Total Users" value={String(stats.total)} description="All accounts" />
          <Stat icon={UserCheck} tone="credit" label="Active Users" value={String(stats.active)} description="Can sign in" />
          <Stat icon={UserMinus} label="Inactive Users" value={String(stats.inactive)} description="Sign-in blocked" />
          <Stat icon={ShieldCheck} label="Admins" value={String(stats.admins)} description="Administrator accounts" />
        </Reveal>

        <Reveal index={2} className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-2">
          <UserList title="Recently Created Users" users={stats.recentlyCreated} when={(u) => `Created ${formatDate(u.createdAt)}`} empty="No users yet." />
          <UserList title="Recent Logins" users={stats.recentLogins} when={(u) => `Signed in ${formatDateTime(u.lastLoginAt!)}`} empty="No sign-ins yet." />
        </Reveal>

        <Reveal index={3}>
          <AdminSection
            title="Financial Record — Read Only"
            description="Financial record values cannot be changed from the administration panel."
            badge={
              <span className="inline-flex items-center gap-1.5 rounded-full bg-canvas px-2.5 py-1 text-xs font-medium text-muted">
                <Lock className="h-3 w-3" aria-hidden="true" /> Read only
              </span>
            }
          >
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-6 sm:gap-4">
              <div className="col-span-2">
                <Stat icon={Wallet} label="Recorded Balance" value={formatMoney(fin.balance, fin.currency)} description="Internal record" />
              </div>
              <div className="sm:col-span-2">
                <Stat icon={ArrowDownLeft} tone="credit" label="Credits" value={formatMoney(fin.summary.totalCredits, fin.currency)} description={`${fin.summary.creditCount} records`} />
              </div>
              <div className="sm:col-span-2">
                <Stat icon={ArrowUpRight} tone="debit" label="Debits" value={formatMoney(fin.summary.totalDebits, fin.currency)} description={`${fin.summary.debitCount} records`} />
              </div>
              <div className="sm:col-span-3">
                <Stat icon={ListOrdered} label="Transactions" value={String(fin.summary.count)} description="Records in history" />
              </div>
              <div className="sm:col-span-3">
                <Stat icon={CalendarClock} label="Latest Activity" value={fin.summary.latestDate ? formatDate(fin.summary.latestDate) : "—"} description="Most recent record" />
              </div>
            </div>
          </AdminSection>
        </Reveal>

        <Reveal index={4}>
          <section aria-labelledby="qm-h">
            <h2 id="qm-h" className="mb-3 text-[15px] font-semibold">Quick Management</h2>
            <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {manage.map(({ href, icon: Icon, title, hint }) => (
                <li key={href}>
                  <Link href={href} className="group flex h-full items-center gap-3.5 rounded-2xl border border-line bg-white p-4 transition-[border-color,transform] duration-200 hover:-translate-y-px hover:border-[#cfd8d3]">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-dark">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">{title}</span>
                      <span className="block text-xs text-muted">{hint}</span>
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted/60 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </Reveal>
      </div>
    </>
  );
}

