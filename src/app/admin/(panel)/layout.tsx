import { AppShell } from "@/components/layout/AppShell";
import { requireRole } from "@/lib/auth";
import { getContent, getNotifications } from "@/lib/records-service";

export default async function AdminPanelLayout({ children }: LayoutProps<"/admin">) {
  const admin = await requireRole("admin");
  // Admin pages keep their own hardcoded copy — this one notice is the exception, since the same
  // RecordNotice component renders on both the user and admin side and is now admin-editable.
  const [notifications, { notices }] = await Promise.all([getNotifications(), getContent()]);
  return (
    <AppShell
      variant="admin"
      profile={{ name: admin.displayName, subtitle: "Administrator", photoPath: admin.profilePhotoPath ?? null }}
      notifications={notifications}
      noticeText={notices.dashboardInfoStrip}
    >
      {children}
    </AppShell>
  );
}
