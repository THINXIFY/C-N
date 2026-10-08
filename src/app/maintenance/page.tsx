import type { Metadata } from "next";
import { Wrench } from "lucide-react";
import { MaintenanceActions } from "@/components/maintenance/MaintenanceActions";
import { BrandName } from "@/components/ui/BrandName";
import { Reveal } from "@/components/ui/Reveal";
import { getAppSettings } from "@/lib/app-settings-service";
import { getContent } from "@/lib/records-service";

export const metadata: Metadata = { title: "Under Maintenance — Dashboard" };
// No auth/cookie reads happen on this page (it must be reachable by anyone), so Next.js has no automatic
// signal to treat it as dynamic. Force it explicitly — both the CMS wording and the estimated-return note
// must always reflect the latest admin edits, never a build-time snapshot.
export const dynamic = "force-dynamic";

// Public, standalone route — intentionally does not use the dashboard layout/shell. Reachable regardless of
// maintenance-mode status (admins preview it from /admin/settings even while the mode is OFF); proxy.ts only
// ever redirects INTO this page, never away from it.
export default async function MaintenancePage() {
  const [{ maintenance: m }, appSettings] = await Promise.all([getContent(), getAppSettings()]);
  const estimatedReturn = appSettings.maintenanceEstimatedReturn.trim();

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-canvas px-5 py-12">
      <Reveal index={1} className="w-full max-w-[460px]">
        <div className="rounded-2xl border border-line bg-white p-8 text-center shadow-[0_1px_2px_rgba(23,32,28,.04)] sm:p-10">
          <div className="mb-6 flex justify-center">
            <BrandName className="text-xl" />
          </div>

          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft text-brand-dark motion-safe:animate-pulse">
            <Wrench className="h-6 w-6" aria-hidden="true" />
          </span>

          <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-brand-dark">{m.eyebrow}</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-[26px]">{m.heading}</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-muted">{m.message}</p>

          {estimatedReturn && (
            <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-canvas px-3.5 py-1.5 text-sm font-medium text-ink">
              Estimated return: {estimatedReturn}
            </p>
          )}

          <MaintenanceActions refreshLabel={m.refreshButtonLabel} supportLabel={m.supportButtonLabel} />

          {m.secondaryMessage && <p className="mt-6 text-xs text-muted">{m.secondaryMessage}</p>}
        </div>
      </Reveal>
    </main>
  );
}
