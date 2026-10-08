import { ContentEditor } from "@/components/admin/ContentEditor";
import { PageHeader } from "@/components/layout/PageHeader";
import { Reveal } from "@/components/ui/Reveal";
import { requireRole } from "@/lib/auth";
import { getContentSettings } from "@/lib/users-service";

export default async function AdminContentPage() {
  await requireRole("admin");
  const settings = await getContentSettings();
  return (
    <Reveal className="max-w-5xl">
      <PageHeader
        title="Content & Labels"
        subtitle="Nearly all user-facing text, across login, dashboard, transactions, account and support. Per-user greeting, subtitle and display options are edited on each user’s page."
      />
      <ContentEditor initial={settings} />
    </Reveal>
  );
}
