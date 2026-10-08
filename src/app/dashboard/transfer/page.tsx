import { TriangleAlert } from "lucide-react";
import { TransferForm } from "@/components/dashboard/TransferForm";
import { PageHeader } from "@/components/layout/PageHeader";
import { Reveal } from "@/components/ui/Reveal";
import { getAppSettings } from "@/lib/app-settings-service";
import { requireRole } from "@/lib/auth";
import { getContent } from "@/lib/records-service";

export default async function TransferPage() {
  await requireRole("user");
  const [{ transfer }, appSettings] = await Promise.all([getContent(), getAppSettings()]);

  if (!appSettings.transferEnabled) {
    return (
      <div data-page="transfer" className="transfer-shell">
        <Reveal className="max-w-xl">
          <div className="rounded-2xl border border-line bg-white p-8 text-center sm:p-10">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-canvas text-muted">
              <TriangleAlert className="h-6 w-6" aria-hidden="true" />
            </span>
            <h1 className="mt-5 text-xl font-semibold">{transfer.unavailableTitle}</h1>
            <p className="mt-2 text-[15px] leading-relaxed text-muted">{transfer.unavailableMessage}</p>
          </div>
        </Reveal>
      </div>
    );
  }

  return (
    <div data-page="transfer" className="transfer-shell">
      <Reveal className="max-w-3xl">
        <PageHeader title={transfer.pageTitle} subtitle={transfer.pageSubtitle} />
        {transfer.helperText && (
          <p className="-mt-3 mb-5 text-[13px] leading-snug text-muted">{transfer.helperText}</p>
        )}
        <TransferForm content={transfer} />
      </Reveal>
    </div>
  );
}
