"use client";

import { Menu } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { logoutAction } from "@/app/actions/auth";
import { BrandName } from "@/components/ui/BrandName";
import { RecordNotice } from "@/components/ui/RecordNotice";
import { Sheet } from "@/components/ui/Sheet";
import { flashToast } from "@/components/ui/Toast";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { cn } from "@/lib/cn";
import type { NotificationRecord } from "@/data/records";
import type { NavigationContent } from "@/data/settings";
import { SidebarContent } from "./Sidebar";
import { Topbar } from "./Topbar";
import { adminNav, applyNavLabels, isActive, userNav } from "./nav";

interface Props {
  variant: "user" | "admin";
  profile: { name: string; subtitle: string; photoPath?: string | null };
  notifications: NotificationRecord[];
  children: ReactNode;
  /** User-side only: admin-editable nav labels (href/icon/order stay fixed — labels only). Omitted on the admin side.
   *  Only plain label strings cross the server/client boundary; the icon-bearing nav array is built here, client-side. */
  navLabels?: NavigationContent;
  accountLabel?: string;
  logoutLabel?: string;
  signedOutToast?: string;
  /** Admin-editable (notices.dashboardInfoStrip); shown on both the user and admin side since it's the same notice. */
  noticeText?: string;
}

export function AppShell({ variant, profile, notifications, children, navLabels, accountLabel, logoutLabel, signedOutToast = "Signed out successfully", noticeText }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const nav = navLabels ? applyNavLabels(navLabels) : (variant === "admin" ? adminNav : userNav);
  const [drawer, setDrawer] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      try {
        setCollapsed(localStorage.getItem("lf_sidebar") === "1");
      } catch {}
    });
  }, []);

  function toggleCollapse() {
    setCollapsed((c) => {
      try {
        localStorage.setItem("lf_sidebar", c ? "0" : "1");
      } catch {}
      return !c;
    });
  }

  async function logout() {
    await logoutAction();
    flashToast(signedOutToast);
    router.replace(variant === "admin" ? "/admin/login" : "/login");
  }

  const sectionLabel = nav.find((n) => isActive(n, pathname))?.label ?? "Dashboard";
  const accountHref = variant === "admin" ? "/admin/account" : "/dashboard/account";
  const helpHref = variant === "admin" ? "/admin/settings" : "/dashboard/support";

  return (
    <div className="min-h-dvh">
      {/* Desktop / tablet sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden overflow-hidden border-r border-line bg-white transition-[width] duration-200 ease-out md:block md:w-[72px]",
          !collapsed && "lg:w-[252px]",
        )}
      >
        <SidebarContent
          nav={nav}
          profile={profile}
          onLogout={logout}
          logoutLabel={logoutLabel}
          collapsed={collapsed}
          onToggleCollapse={toggleCollapse}
          idPrefix={`${variant}-side`}
        />
      </aside>

      {/* Mobile drawer */}
      <Sheet open={drawer} onClose={() => setDrawer(false)} title="Navigation" side="left" hideHeader className="max-w-[300px]">
        <SidebarContent
          nav={nav}
          profile={profile}
          onLogout={logout}
          logoutLabel={logoutLabel}
          onNavigate={() => setDrawer(false)}
          forceExpanded
          idPrefix={`${variant}-drawer`}
        />
      </Sheet>

      <div className={cn("transition-[padding] duration-200 ease-out md:pl-[72px]", !collapsed && "lg:pl-[252px]")}>
        <RecordNotice text={noticeText} />

        {/* Mobile top navbar */}
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-line bg-white/90 px-4 backdrop-blur md:hidden">
          <button
            onClick={() => setDrawer(true)}
            aria-label="Open navigation menu"
            className="-ml-2.5 flex h-11 w-11 items-center justify-center rounded-[10px] text-ink transition-colors duration-150 hover:bg-black/[0.05] active:bg-black/[0.07]"
          >
            <Menu className="h-5 w-5" />
          </button>
          <BrandName className="text-lg" />
          <button
            onClick={() => router.push(variant === "admin" ? "/admin/account" : "/dashboard/account")}
            aria-label="Profile"
            className="rounded-full transition-[box-shadow] duration-150 active:ring-2 active:ring-brand/30"
          >
            <UserAvatar name={profile.name} photoPath={profile.photoPath} size={40} />
          </button>
        </header>

        <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-6 lg:px-10">
          <div className="hidden md:block">
            <Topbar
              sectionLabel={sectionLabel}
              profile={profile}
              accountHref={accountHref}
              accountLabel={accountLabel}
              helpHref={helpHref}
              logoutLabel={logoutLabel}
              notifications={notifications}
              onLogout={logout}
            />
          </div>
          <main className="pb-12 pt-4 sm:pb-16 md:pt-4">{children}</main>
        </div>
      </div>
    </div>
  );
}
