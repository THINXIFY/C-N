import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { getFinancialOwnerId } from "@/lib/users-service";

// "Account" = the account that owns the financial record. Its profile is edited like any other user.
export default async function AdminAccountPage() {
  await requireRole("admin");
  const owner = await getFinancialOwnerId();
  redirect(owner ? `/admin/users/${owner}` : "/admin/users");
}
