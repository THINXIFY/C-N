import { FileQuestion } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";

export function NoFinancialRecord({
  compact,
  title = "No financial record linked",
  description = "This account doesn’t have a financial record attached. Contact your administrator if you expected to see one.",
  descriptionCompact = "This account has no recorded balance or transactions.",
}: {
  compact?: boolean;
  title?: string;
  description?: string;
  descriptionCompact?: string;
}) {
  return (
    <section aria-label="Financial record" className="rounded-2xl border border-line bg-white">
      <EmptyState icon={FileQuestion} title={title} description={compact ? descriptionCompact : description} />
    </section>
  );
}
