import { Zap } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Reveal } from "@/components/ui/Reveal";
import { requireRole } from "@/lib/auth";
import { getContent } from "@/lib/records-service";

export default async function ZellePage() {
  await requireRole("user");
  const { zelle } = await getContent();

  return (
    <div data-page="zelle" className="zelle-shell">
      <Reveal className="max-w-3xl">
        <PageHeader title={zelle.pageTitle} subtitle={zelle.pageSubtitle} />
        <div className="rounded-2xl border border-line bg-white p-5 sm:p-6">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand-dark">
            <Zap className="h-5 w-5" aria-hidden="true" />
          </span>
          <p className="mt-4 text-[15px] leading-relaxed text-ink">{zelle.bodyText}</p>
          <div className="mt-5 rounded-xl border border-line bg-canvas px-4 py-3.5">
            <p className="text-sm leading-relaxed text-muted">{zelle.availabilityText}</p>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
