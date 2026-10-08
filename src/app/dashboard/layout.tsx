import { AppShell } from "@/components/layout/AppShell";
import { getAppSettings } from "@/lib/app-settings-service";
import { requireRole } from "@/lib/auth";
import { getContent, getNotifications } from "@/lib/records-service";

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const user = await requireRole("user");
  const [notifications, { navigation, messages, notices }, appSettings] = await Promise.all([getNotifications(), getContent(), getAppSettings()]);
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
      hiddenNavHrefs={appSettings.transferEnabled ? undefined : ["/dashboard/transfer"]}
    >
      {children}
    </AppShell>
  );
}
