import { Plus } from "lucide-react";
import Link from "next/link";
import { UsersTable } from "@/components/admin/UsersTable";
import { buttonClass } from "@/components/ui/button-styles";
import { PageHeader } from "@/components/layout/PageHeader";
import { Reveal } from "@/components/ui/Reveal";
import { requireRole } from "@/lib/auth";
import { listUsers } from "@/lib/users-service";

export default async function AdminUsersPage() {
  const admin = await requireRole("admin");
  const users = await listUsers();
  return (
    <Reveal>
      <PageHeader
        title="User Management"
        subtitle="Create and manage access to Ledgerline."
        action={
          <Link href="/admin/users/new" className={buttonClass("primary")}>
            <Plus className="h-4 w-4" aria-hidden="true" /> Add User
          </Link>
        }
      />
      <UsersTable users={users} currentUserId={admin.id} />
    </Reveal>
  );
}
