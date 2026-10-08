import { AdminSection } from "@/components/admin/AdminSection";
import { SignOutButton } from "@/components/admin/SignOutButton";
import { PageHeader } from "@/components/layout/PageHeader";
import { Reveal } from "@/components/ui/Reveal";
import { requireRole } from "@/lib/auth";
import { formatLastLogin } from "@/lib/format";
import { getTransactionCount } from "@/lib/records-service";
import { getUserStats } from "@/lib/users-service";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 py-3.5 sm:grid-cols-[200px_1fr] sm:gap-6">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="min-w-0 break-words text-sm font-medium">{children}</dd>
    </div>
  );
}

export default async function AdminSettingsPage() {
  const admin = await requireRole("admin");
  const [count, stats] = await Promise.all([getTransactionCount(), getUserStats()]);
  return (
    <Reveal className="max-w-3xl">
      <PageHeader title="Settings" subtitle="Your administrator profile, system information and session." />
      <div className="space-y-5">
        <AdminSection title="Current Admin Profile">
          <dl className="-my-3.5 divide-y divide-line">
            <Row label="Display name">{admin.displayName}</Row>
            <Row label="Username">{admin.username}</Row>
            <Row label="Role">Administrator</Row>
            <Row label="Last sign-in">{formatLastLogin(admin.lastLoginAt)}</Row>
          </dl>
        </AdminSection>

        <AdminSection title="System Information">
          <dl className="-my-3.5 divide-y divide-line">
            <Row label="Application">Ledgerline — Private Financial Record Dashboard</Row>
            <Row label="Environment">{process.env.NODE_ENV === "production" ? "Production" : "Development"}</Row>
            <Row label="Accounts & settings">Local file store (hashed credentials)</Row>
            <Row label="Financial record">Read-only source data · {count} transactions</Row>
            <Row label="Users">{stats.total} total · {stats.active} active · {stats.admins} admin</Row>
            <Row label="Authentication">User: password + access code · Administrator: password</Row>
          </dl>
        </AdminSection>

        <AdminSection title="Session">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-muted">You are signed in as an administrator.</p>
            <SignOutButton />
          </div>
        </AdminSection>
      </div>
    </Reveal>
  );
}
