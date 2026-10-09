import { Globe } from "lucide-react";
import { ModuleRequestCard } from "@/components/dashboard/ModuleRequestCard";
import { PageHeader } from "@/components/layout/PageHeader";
import { Reveal } from "@/components/ui/Reveal";
import { requireRole } from "@/lib/auth";
import { getContent } from "@/lib/records-service";

export default async function FxSalesPage() {
  await requireRole("user");
  const { fxSales } = await getContent();

  return (
    <div data-page="fx-sales" className="fx-sales-shell">
      <Reveal className="max-w-3xl">
        <PageHeader title={fxSales.pageTitle} subtitle={fxSales.pageSubtitle} />
        <div className="rounded-2xl border border-line bg-white p-5 sm:p-6">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand-dark">
            <Globe className="h-5 w-5" aria-hidden="true" />
          </span>
          <p className="mt-4 text-[15px] leading-relaxed text-ink">{fxSales.bodyText}</p>
          <div className="mt-5">
            <ModuleRequestCard buttonLabel={fxSales.requestButtonLabel} toastText={fxSales.requestToast} />
          </div>
        </div>
      </Reveal>
    </div>
  );
}
