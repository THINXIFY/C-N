"use client";

import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { setTransferEnabledAction, setTransferResultModeAction } from "@/app/actions/admin";
import { useToast } from "@/components/ui/Toast";
import type { AppSettings, TransferResultMode } from "@/data/app-settings";
import { cn } from "@/lib/cn";

const MODES: { value: TransferResultMode; label: string; description: string }[] = [
  { value: "accepted", label: "Request Accepted", description: "Users are told their transfer request was received and is pending processing." },
  { value: "unavailable", label: "Temporarily Unavailable", description: "Users are told the transfer request could not be processed right now." },
];

export function TransferSettingsCard({ initial }: { initial: AppSettings }) {
  const router = useRouter();
  const { toast } = useToast();
  const [settings, setSettings] = useState(initial);
  const [togglePending, startToggleTransition] = useTransition();
  const [modePending, startModeTransition] = useTransition();

  function onToggleEnabled() {
    const next = !settings.transferEnabled;
    startToggleTransition(async () => {
      const res = await setTransferEnabledAction(next);
      if (!res.ok || !res.settings) {
        toast(res.error ?? "Unable to save changes.");
        return;
      }
      setSettings(res.settings);
      toast(next ? "Transfer requests enabled" : "Transfer requests disabled");
      router.refresh();
    });
  }

  function onSelectMode(mode: TransferResultMode) {
    if (mode === settings.transferResultMode) return;
    startModeTransition(async () => {
      const res = await setTransferResultModeAction(mode);
      if (!res.ok || !res.settings) {
        toast(res.error ?? "Unable to save changes.");
        return;
      }
      setSettings(res.settings);
      toast("Result mode updated");
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span
          className={cn(
            "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium",
            settings.transferEnabled ? "bg-brand-soft text-brand-dark" : "bg-canvas text-muted",
          )}
        >
          <span className={cn("h-2 w-2 rounded-full", settings.transferEnabled ? "bg-brand" : "bg-[#b7bfbb]")} aria-hidden="true" />
          {settings.transferEnabled ? "Transfer Requests Enabled" : "Transfer Requests Disabled"}
        </span>
        <Link
          href="/dashboard/transfer"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-11 items-center gap-1.5 rounded-[10px] border border-line px-4 text-sm font-medium text-ink transition-colors hover:bg-canvas"
        >
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" /> Open User Preview
        </Link>
      </div>

      <div className="flex min-h-11 items-start justify-between gap-6 border-t border-line py-4">
        <div className="min-w-0">
          <p className="text-sm font-medium">Enable Transfer Requests</p>
          <p className="mt-0.5 text-[13px] leading-snug text-muted">
            {settings.transferEnabled
              ? "The Transfer Funds nav item and page are available to normal users."
              : "The nav item is hidden and the page shows an unavailable message. Admin access is unaffected."}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={settings.transferEnabled}
          aria-label="Enable Transfer Requests"
          disabled={togglePending}
          onClick={onToggleEnabled}
          className="-my-2 -mr-2 flex h-11 w-14 shrink-0 items-center justify-center rounded-xl disabled:opacity-60"
        >
          <span className={cn("relative block h-6 w-11 rounded-full transition-colors duration-200 ease-out", settings.transferEnabled ? "bg-brand" : "bg-[#cfd8d3]")}>
            <span
              className={cn(
                "absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ease-out motion-reduce:transition-none",
                settings.transferEnabled && "translate-x-5",
              )}
            />
          </span>
        </button>
      </div>

      <div className="border-t border-line pt-4">
        <p className="mb-1 text-sm font-medium">Result Mode</p>
        <p className="mb-3 text-[13px] leading-snug text-muted">
          Controls what a user sees right after submitting a transfer request. There is no payment integration yet — neither option means money
          actually moved.
        </p>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {MODES.map((m) => (
            <button
              key={m.value}
              type="button"
              disabled={modePending}
              onClick={() => onSelectMode(m.value)}
              className={cn(
                "rounded-xl border p-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60",
                settings.transferResultMode === m.value ? "border-brand/40 bg-brand-soft" : "border-line bg-white hover:bg-canvas",
              )}
            >
              <span className={cn("text-sm font-medium", settings.transferResultMode === m.value ? "text-brand-dark" : "text-ink")}>{m.label}</span>
              <p className="mt-1 text-[13px] leading-snug text-muted">{m.description}</p>
            </button>
          ))}
        </div>
      </div>

      <p className="border-t border-line pt-4 text-xs leading-relaxed text-muted">
        Edit the accepted/failure titles and messages shown to users under{" "}
        <Link href="/admin/content" className="font-medium text-brand-dark hover:underline">
          Content &amp; Labels → Transfer
        </Link>
        .
      </p>
    </div>
  );
}
