import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RoleBadge, StatusBadge } from "@/components/admin/UserBadges";
import { UserEditor } from "@/components/admin/UserEditor";
import { PageHeader } from "@/components/layout/PageHeader";
import { Reveal } from "@/components/ui/Reveal";
import { requireRole } from "@/lib/auth";
import { formatMoney } from "@/lib/format";
import { getFinancialSnapshot } from "@/lib/records-service";
import { getFinancialOwnerId, getUser, getUserSettings } from "@/lib/users-service";

export default async function UserDetailPage({ params }: PageProps<"/admin/users/[id]">) {
  const admin = await requireRole("admin");
  const { id } = await params;
  const user = await getUser(id);
  if (!user) notFound();
  const [s, ownerId] = await Promise.all([getUserSettings(id), getFinancialOwnerId()]);
  const fin = ownerId === id ? await getFinancialSnapshot() : null;

  return (
    <Reveal className="max-w-5xl">
      <Link href="/admin/users" className="-ml-1 mb-1 inline-flex min-h-11 items-center gap-1 px-1 text-sm font-medium text-muted hover:text-ink">
        <ChevronLeft className="h-4 w-4" aria-hidden="true" /> All users
      </Link>
      <PageHeader
        title={user.displayName}
        subtitle={`@${user.username} · ${user.businessName}`}
        action={
          <div className="flex items-center gap-2">
            <RoleBadge role={user.role} />
            <StatusBadge status={user.status} />
          </div>
        }
      />
      <UserEditor
        key={`${user.updatedAt}-${s.updatedAt}`}
        user={user}
        isSelf={admin.id === user.id}
        financial={fin ? { balance: formatMoney(fin.balance, fin.currency), count: fin.summary.count } : null}
        settings={{
          dashboardGreeting: s.dashboardGreeting,
          dashboardSubtitle: s.dashboardSubtitle,
          recordStatus: s.recordStatus,
          recordType: s.recordType,
          balanceHiddenDefault: s.balanceHiddenDefault,
          showRecordInfo: s.showRecordInfo,
          showQuickActions: s.showQuickActions,
        }}
      />
    </Reveal>
  );
}
