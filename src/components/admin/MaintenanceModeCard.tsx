"use client";

import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { setMaintenanceEstimatedReturnAction, setMaintenanceModeAction } from "@/app/actions/admin";
import { Button } from "@/components/ui/Button";
import { buttonClass } from "@/components/ui/button-styles";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import type { AppSettings } from "@/data/app-settings";
import { cn } from "@/lib/cn";
import { formatDateTime } from "@/lib/format";

export function MaintenanceModeCard({ initial }: { initial: AppSettings }) {
  const router = useRouter();
  const { toast } = useToast();
  const [settings, setSettings] = useState(initial);
  const [confirmOpen, setConfirmOpen] = useState<"enable" | "disable" | null>(null);
  const [estimatedReturn, setEstimatedReturn] = useState(initial.maintenanceEstimatedReturn);
  const [pending, startTransition] = useTransition();
  const [savingReturn, startReturnTransition] = useTransition();

  const active = settings.maintenanceMode;
  const dirtyReturn = estimatedReturn !== settings.maintenanceEstimatedReturn;

  function confirmToggle() {
    const enabling = confirmOpen === "enable";
    startTransition(async () => {
      const res = await setMaintenanceModeAction(enabling);
      if (!res.ok || !res.settings) {
        toast(res.error ?? "Unable to save changes.");
        return;
      }
      setSettings(res.settings);
      toast(enabling ? "Maintenance mode enabled" : "User side is now available");
      setConfirmOpen(null);
      router.refresh();
    });
  }

  function saveEstimatedReturn() {
    startReturnTransition(async () => {
      const res = await setMaintenanceEstimatedReturnAction(estimatedReturn);
      if (!res.ok || !res.settings) {
        toast(res.error ?? "Unable to save changes.");
        return;
      }
      setSettings(res.settings);
      setEstimatedReturn(res.settings.maintenanceEstimatedReturn);
      toast("Estimated return updated");
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span
          className={cn(
            "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium",
            active ? "bg-debit-soft text-debit" : "bg-brand-soft text-brand-dark",
          )}
        >
          <span className={cn("h-2 w-2 rounded-full", active ? "bg-debit" : "bg-brand")} aria-hidden="true" />
          {active ? "Under Construction" : "Available"}
        </span>
        <Link
          href="/maintenance"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-11 items-center gap-1.5 rounded-[10px] border border-line px-4 text-sm font-medium text-ink transition-colors hover:bg-canvas"
        >
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" /> Preview Maintenance Page
        </Link>
      </div>

      <div className="flex min-h-11 items-start justify-between gap-6 border-t border-line py-4">
        <div className="min-w-0">
          <p className="text-sm font-medium">Maintenance Mode</p>
          <p className="mt-0.5 text-[13px] leading-snug text-muted">
            {active ? "Normal users are shown the maintenance page instead of the application." : "Normal users can access the application as usual."}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={active}
          aria-label="Maintenance Mode"
          disabled={pending}
          onClick={() => setConfirmOpen(active ? "disable" : "enable")}
          className="-my-2 -mr-2 flex h-11 w-14 shrink-0 items-center justify-center rounded-xl disabled:opacity-60"
        >
          <span className={cn("relative block h-6 w-11 rounded-full transition-colors duration-200 ease-out", active ? "bg-debit" : "bg-[#cfd8d3]")}>
            <span
              className={cn(
                "absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ease-out motion-reduce:transition-none",
                active && "translate-x-5",
              )}
            />
          </span>
        </button>
      </div>

      {(settings.maintenanceEnabledAt || settings.maintenanceDisabledAt) && (
        <dl className="grid gap-x-8 gap-y-3 border-t border-line pt-4 text-sm sm:grid-cols-3">
          {settings.maintenanceEnabledAt && (
            <div>
              <dt className="text-xs text-muted">Maintenance started</dt>
              <dd className="mt-0.5 font-medium">{formatDateTime(settings.maintenanceEnabledAt)}</dd>
            </div>
          )}
          {settings.maintenanceEnabledBy && (
            <div>
              <dt className="text-xs text-muted">Enabled by</dt>
              <dd className="mt-0.5 font-medium">{settings.maintenanceEnabledBy}</dd>
            </div>
          )}
          {settings.maintenanceDisabledAt && (
            <div>
              <dt className="text-xs text-muted">Last disabled</dt>
              <dd className="mt-0.5 font-medium">{formatDateTime(settings.maintenanceDisabledAt)}</dd>
            </div>
          )}
        </dl>
      )}

      <div className="border-t border-line pt-4">
        <label htmlFor="maint-eta" className="mb-1.5 block text-sm font-medium">
          Estimated Return <span className="ml-1.5 text-xs font-normal text-muted">Optional</span>
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            id="maint-eta"
            value={estimatedReturn}
            onChange={(e) => setEstimatedReturn(e.target.value)}
            placeholder="e.g. Today at 6:00 PM"
            maxLength={80}
            className="h-12 w-full rounded-xl border border-line bg-white px-3.5 text-[15px] text-ink placeholder:text-muted/70 transition-[border-color,box-shadow] duration-150 focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15 sm:max-w-xs"
          />
          <Button type="button" variant="secondary" onClick={saveEstimatedReturn} loading={savingReturn} disabled={!dirtyReturn || savingReturn} className="shrink-0">
            {savingReturn ? "Saving…" : "Save"}
          </Button>
        </div>
        <p className="mt-1.5 text-[13px] leading-snug text-muted">Shown on the maintenance page when set. Leave blank to hide it completely.</p>
      </div>

      <Modal
        open={confirmOpen === "enable"}
        onClose={() => !pending && setConfirmOpen(null)}
        title="Enable Maintenance Mode?"
        description="Normal users will temporarily lose access to the user-facing application and will see the maintenance page instead. Admin access will remain available."
      >
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={() => setConfirmOpen(null)} disabled={pending}>Cancel</Button>
          <button onClick={confirmToggle} disabled={pending} className={buttonClass("danger")}>
            {pending ? "Enabling…" : "Enable Maintenance Mode"}
          </button>
        </div>
      </Modal>

      <Modal
        open={confirmOpen === "disable"}
        onClose={() => !pending && setConfirmOpen(null)}
        title="Make User Side Available?"
        description="Normal users will immediately regain access to the application."
      >
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={() => setConfirmOpen(null)} disabled={pending}>Cancel</Button>
          <Button type="button" onClick={confirmToggle} loading={pending}>
            {pending ? "Saving…" : "Make Available"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
