import { ArrowLeftRight, ChevronRight, LifeBuoy, UserRound } from "lucide-react";
import Link from "next/link";
import type { DashboardContent } from "@/data/settings";

export function QuickActions({ heading = "Quick actions", content }: { heading?: string; content?: DashboardContent }) {
  const actions = [
    { href: "/dashboard/transactions", label: content?.quickAction1Label ?? "View Transactions", hint: content?.quickAction1Hint ?? "Full recorded history", icon: ArrowLeftRight },
    { href: "/dashboard/account", label: content?.quickAction2Label ?? "Account Details", hint: content?.quickAction2Hint ?? "Holder and business info", icon: UserRound },
    { href: "/dashboard/support", label: content?.quickAction3Label ?? "Contact Support", hint: content?.quickAction3Hint ?? "Reach your administrator", icon: LifeBuoy },
  ];
  return (
    <section aria-labelledby="qa-h" className="rounded-2xl border border-line bg-white p-5">
      <h2 id="qa-h" className="text-[15px] font-semibold">{heading}</h2>
      <ul className="mt-3 space-y-1">
        {actions.map(({ href, label, hint, icon: Icon }) => (
          <li key={href}>
            <Link
              href={href}
              className="group flex items-center gap-3 rounded-xl px-2.5 py-2.5 transition-colors hover:bg-canvas"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-canvas text-muted transition-colors group-hover:bg-brand-soft group-hover:text-brand-dark">
                <Icon className="h-[18px] w-[18px]" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">{label}</span>
                <span className="block text-xs text-muted">{hint}</span>
              </span>
              <ChevronRight className="h-4 w-4 text-muted/60 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
