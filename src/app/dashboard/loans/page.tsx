import { HandCoins } from "lucide-react";
import { ModuleRequestCard } from "@/components/dashboard/ModuleRequestCard";
import { PageHeader } from "@/components/layout/PageHeader";
import { Reveal } from "@/components/ui/Reveal";
import { requireRole } from "@/lib/auth";
import { getContent } from "@/lib/records-service";

export default async function LoansPage() {
  await requireRole("user");
  const { loans } = await getContent();

  return (
    <div data-page="loans" className="loans-shell">
      <Reveal className="max-w-3xl">
        <PageHeader title={loans.pageTitle} subtitle={loans.pageSubtitle} />
        <div className="rounded-2xl border border-line bg-white p-5 sm:p-6">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand-dark">
            <HandCoins className="h-5 w-5" aria-hidden="true" />
          </span>
          <p className="mt-4 text-[15px] leading-relaxed text-ink">{loans.bodyText}</p>
          <div className="mt-5">
            <ModuleRequestCard buttonLabel={loans.requestButtonLabel} toastText={loans.requestToast} />
          </div>
        </div>
      </Reveal>
    </div>
  );
}
