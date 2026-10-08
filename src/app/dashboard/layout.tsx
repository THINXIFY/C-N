import { AppShell } from "@/components/layout/AppShell";
import { requireRole } from "@/lib/auth";
import { getContent, getNotifications } from "@/lib/records-service";

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const user = await requireRole("user");
  const [notifications, { navigation, messages, notices }] = await Promise.all([getNotifications(), getContent()]);
  return (
    <AppShell
      variant="user"
      profile={{ name: user.displayName, subtitle: user.businessName, photoPath: user.profilePhotoPath ?? null }}
      notifications={notifications}
      navLabels={navigation}
      accountLabel={navigation.account}
      logoutLabel={navigation.logout}
      signedOutToast={messages.signedOutToast}
      noticeText={notices.dashboardInfoStrip}
    >
      {children}
    </AppShell>
  );
}
