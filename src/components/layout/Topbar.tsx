"use client";

import { Bell, CircleHelp, LogOut, UserRound } from "lucide-react";
import Link from "next/link";
import { Popover } from "@/components/ui/Popover";
import { Tooltip } from "@/components/ui/Tooltip";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { formatDate } from "@/lib/format";
import type { NotificationRecord } from "@/data/records";

interface Props {
  sectionLabel: string;
  profile: { name: string; subtitle: string; photoPath?: string | null };
  accountHref: string;
  accountLabel?: string;
  helpHref: string;
  logoutLabel?: string;
  notifications: NotificationRecord[];
  onLogout: () => void;
}

const iconBtn =
  "relative flex h-10 w-10 items-center justify-center rounded-[10px] text-muted transition-colors duration-150 hover:bg-black/[0.05] hover:text-ink active:bg-black/[0.07]";

export function Topbar({ sectionLabel, profile, accountHref, accountLabel = "Account", helpHref, logoutLabel = "Sign out", notifications, onLogout }: Props) {
  return (
    <div className="flex h-16 items-center justify-between gap-4">
      <div className="hidden min-w-0 md:block">
        <p className="truncate text-sm font-medium">{sectionLabel}</p>
        <p className="text-xs text-muted">{formatDate(new Date().toISOString(), { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</p>
      </div>
      <div className="ml-auto flex items-center gap-1">
        <Popover
          trigger={({ open, toggle, id }) => (
            <Tooltip label="Notifications">
              <button
                data-popover-trigger
                onClick={toggle}
                aria-label="Notifications"
                aria-expanded={open}
                aria-controls={id}
                className={iconBtn}
              >
                <Bell className="h-5 w-5" />
                <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-brand ring-2 ring-white" />
              </button>
            </Tooltip>
          )}
        >
          {() => (
            <div>
              <p className="px-3 pb-1 pt-2 text-sm font-semibold">Notifications</p>
              <ul>
                {notifications.map((n) => (
                  <li key={n.id} className="rounded-lg px-3 py-2.5 hover:bg-canvas">
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="mt-0.5 text-[13px] leading-snug text-muted">{n.body}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Popover>

        <Tooltip label="Help & support">
          <Link href={helpHref} aria-label="Help & support" className={iconBtn}>
            <CircleHelp className="h-5 w-5" />
          </Link>
        </Tooltip>

        <div className="ml-2">
          <Popover
            trigger={({ open, toggle, id }) => (
              <button
                data-popover-trigger
                onClick={toggle}
                aria-label="Profile menu"
                aria-expanded={open}
                aria-controls={id}
                className="rounded-full ring-1 ring-brand/20 transition-shadow hover:ring-brand/40"
              >
                <UserAvatar name={profile.name} photoPath={profile.photoPath} size={40} textClassName="text-[13px]" />
              </button>
            )}
            className="w-64"
          >
            {(close) => (
              <div>
                <div className="px-3 pb-2.5 pt-2">
                  <p className="text-sm font-semibold">{profile.name}</p>
                  <p className="truncate text-xs text-muted">{profile.subtitle}</p>
                </div>
                <div className="border-t border-line pt-1.5">
                  <Link
                    href={accountHref}
                    onClick={close}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm hover:bg-canvas"
                  >
                    <UserRound className="h-4 w-4 text-muted" /> {accountLabel}
                  </Link>
                  <button
                    onClick={() => {
                      close();
                      onLogout();
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm hover:bg-debit-soft hover:text-debit"
                  >
                    <LogOut className="h-4 w-4" /> {logoutLabel}
                  </button>
                </div>
              </div>
            )}
          </Popover>
        </div>
      </div>
    </div>
  );
}
