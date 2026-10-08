import { PageHeader } from "@/components/layout/PageHeader";
import { TransferRequestsTable } from "@/components/admin/TransferRequestsTable";
import { Reveal } from "@/components/ui/Reveal";
import { requireRole } from "@/lib/auth";
import { listTransferRequests } from "@/lib/transfer-requests-service";
import { listUsers } from "@/lib/users-service";

export default async function AdminTransferRequestsPage() {
  await requireRole("admin");
  const [requests, users] = await Promise.all([listTransferRequests(), listUsers()]);
  const userNames = Object.fromEntries(users.map((u) => [u.id, u.displayName]));

  return (
    <Reveal className="max-w-6xl">
      <PageHeader title="Transfer Requests" subtitle="Submitted transfer-request forms. This is a form/request log only — no payments are processed." />
      <TransferRequestsTable requests={requests} userNames={userNames} />
    </Reveal>
  );
}
