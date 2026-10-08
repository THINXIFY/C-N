"use client";

import { motion } from "framer-motion";
import { LogOut, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandInitial, BrandName } from "@/components/ui/BrandName";
import { Tooltip } from "@/components/ui/Tooltip";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { cn } from "@/lib/cn";
import { isActive, type NavItem } from "./nav";

interface Props {
  nav: NavItem[];
  profile: { name: string; subtitle: string; photoPath?: string | null };
  onLogout: () => void;
  logoutLabel?: string;
  onNavigate?: () => void;
  /** Icon-only rail (used on tablet and when the user collapses it on desktop). */
  collapsed?: boolean;
  /** Always show labels (mobile drawer). */
  forceExpanded?: boolean;
  onToggleCollapse?: () => void;
  idPrefix: string;
}

export function SidebarContent({
  nav,
  profile,
  onLogout,
  logoutLabel = "Sign out",
  onNavigate,
  collapsed,
  forceExpanded,
  onToggleCollapse,
  idPrefix,
}: Props) {
  const pathname = usePathname();
  // label visibility: tablet (md) is icon-only, desktop (lg) expanded unless user collapsed
  const label = forceExpanded ? "" : collapsed ? "hidden" : "hidden lg:inline";
  const center = forceExpanded ? "" : collapsed ? "justify-center px-0" : "justify-center px-0 lg:justify-start lg:px-3";

  return (
    <div className="flex h-full flex-col">
      <div className={cn("flex h-16 items-center", forceExpanded ? "px-5" : collapsed ? "justify-center" : "justify-center lg:justify-between lg:px-5")}>
        <Link href={nav[0].href} onClick={onNavigate} aria-label="Dashboard home" className="rounded-lg">
          {forceExpanded ? (
            <BrandName />
          ) : collapsed ? (
            <BrandInitial />
          ) : (
            <>
              <BrandName className="hidden lg:inline" />
              <BrandInitial className="lg:hidden" />
            </>
          )}
        </Link>
        {forceExpanded && onNavigate && (
          <button
            onClick={onNavigate}
            aria-label="Close navigation menu"
            className="flex h-11 w-11 items-center justify-center rounded-[10px] text-muted transition-colors duration-150 hover:bg-black/[0.05] hover:text-ink active:bg-black/[0.07]"
          >
            <X className="h-5 w-5" />
          </button>
        )}
        {onToggleCollapse && !forceExpanded && !collapsed && (
          <button
            onClick={onToggleCollapse}
            aria-label="Collapse sidebar"
            className="hidden rounded-lg p-1.5 text-muted transition-colors hover:bg-black/[0.04] hover:text-ink lg:block"
          >
            <PanelLeftClose className="h-[18px] w-[18px]" />
          </button>
        )}
      </div>

      <nav aria-label="Main" className="mt-4 flex-1 space-y-1 px-3">
        {nav.map((item) => {
          const active = isActive(item, pathname);
          const Icon = item.icon;
          return (
            <Tooltip key={item.href} label={item.label} block>
              <Link
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex h-11 w-full items-center gap-3 rounded-[10px] px-3 text-sm font-medium transition-colors duration-150",
                  center,
                  active ? "text-brand-dark" : "text-muted hover:bg-black/[0.04] hover:text-ink",
                )}
              >
                {active && (
                  <motion.span
                    layoutId={`${idPrefix}-active`}
                    transition={{ duration: 0.22, ease: "easeOut" }}
                    className="absolute inset-0 rounded-[10px] bg-brand-soft"
                  >
                    <span className="absolute left-0 top-2.5 bottom-2.5 w-[3px] rounded-r-full bg-brand" />
                  </motion.span>
                )}
                <Icon className={cn("relative h-[19px] w-[19px] shrink-0", active && "text-brand")} />
                <span className={cn("label-in relative truncate", label)}>{item.label}</span>
              </Link>
            </Tooltip>
          );
        })}
        {onToggleCollapse && collapsed && !forceExpanded && (
          <button
            onClick={onToggleCollapse}
            aria-label="Expand sidebar"
            className="mt-2 hidden h-10 w-full items-center justify-center rounded-[10px] text-muted hover:bg-black/[0.04] hover:text-ink lg:flex"
          >
            <PanelLeftOpen className="h-[18px] w-[18px]" />
          </button>
        )}
      </nav>

      <div className="border-t border-line p-3">
        <div className={cn("flex items-center gap-3 rounded-[10px] p-2", !forceExpanded && (collapsed ? "justify-center" : "justify-center lg:justify-start"))}>
          <UserAvatar name={profile.name} photoPath={profile.photoPath} size={36} />
          <div className={cn("label-in min-w-0", label)}>
            <p className="truncate text-sm font-medium">{profile.name}</p>
            <p className="truncate text-xs text-muted">{profile.subtitle}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className={cn(
            "mt-1 flex h-10 w-full items-center gap-3 rounded-[10px] px-3 text-sm font-medium text-muted transition-colors hover:bg-debit-soft hover:text-debit",
            !forceExpanded && (collapsed ? "justify-center px-0" : "justify-center px-0 lg:justify-start lg:px-3"),
          )}
          aria-label={logoutLabel}
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" />
          <span className={cn("label-in", label)}>{logoutLabel}</span>
        </button>
      </div>
    </div>
  );
}
