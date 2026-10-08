import { NewUserForm } from "@/components/admin/NewUserForm";
import { PageHeader } from "@/components/layout/PageHeader";
import { Reveal } from "@/components/ui/Reveal";
import { requireRole } from "@/lib/auth";

export default async function NewUserPage() {
  await requireRole("admin");
  return (
    <Reveal className="max-w-4xl">
      <PageHeader title="Add User" subtitle="Create a new account. Passwords and access codes are stored as hashes." />
      <NewUserForm />
    </Reveal>
  );
}
