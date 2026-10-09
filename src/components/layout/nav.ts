import {
  FileText,
  Globe,
  HandCoins,
  LayoutDashboard,
  Landmark,
  LifeBuoy,
  Send,
  Settings,
  Tags,
  UserCog,
  Users,
  UserRound,
  Zap,
  ArrowLeftRight,
  type LucideIcon,
} from "lucide-react";
import type { NavigationContent } from "@/data/settings";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}

export const userNav: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/transfer", label: "Transfer Funds", icon: Send },
  { href: "/dashboard/zelle", label: "Zelle", icon: Zap },
  { href: "/dashboard/loans", label: "Loans", icon: HandCoins },
  { href: "/dashboard/fx-sales", label: "FX Sales", icon: Globe },
  { href: "/dashboard/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/dashboard/account", label: "Account", icon: UserRound },
  { href: "/dashboard/support", label: "Support", icon: LifeBuoy },
];

export const adminNav: NavItem[] = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/account", label: "Account", icon: UserCog },
  { href: "/admin/transactions", label: "Transactions", icon: FileText },
  { href: "/admin/transfer-requests", label: "Transfer Requests", icon: Landmark },
  { href: "/admin/content", label: "Content & Labels", icon: Tags },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function isActive(item: NavItem, pathname: string): boolean {
  return item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + "/");
}

/** Applies admin-editable labels to the fixed user-nav hrefs/icons/order. Routes are never editable — labels only. */
export function applyNavLabels(content: NavigationContent): NavItem[] {
  const labels: Record<string, string> = {
    "/dashboard": content.overview,
    "/dashboard/transactions": content.transactions,
    "/dashboard/account": content.account,
    "/dashboard/support": content.support,
  };
  return userNav.map((item) => ({ ...item, label: labels[item.href] ?? item.label }));
}
