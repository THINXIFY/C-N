import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export function SummaryCard({
  icon: Icon,
  label,
  value,
  description,
  tone = "neutral",
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  description: string;
  tone?: "credit" | "debit" | "neutral";
}) {
  return (
    <div className="rounded-2xl border border-line bg-white p-4 transition-[border-color,box-shadow,transform] duration-200 ease-out hover:-translate-y-0.5 hover:border-[#cfd8d3] hover:shadow-[0_4px_12px_rgba(23,32,28,.06)] motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:p-5">
      <div className="flex items-center gap-2.5">
        <span
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
            tone === "credit" && "bg-brand-soft text-brand-dark",
            tone === "debit" && "bg-debit-soft text-debit",
            tone === "neutral" && "bg-canvas text-muted",
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
        <p className="text-sm text-muted">{label}</p>
      </div>
      <p className="tabular mt-3 truncate text-[17px] font-semibold tracking-tight min-[430px]:text-xl sm:text-[22px]">{value}</p>
      <p className="mt-0.5 text-xs text-muted">{description}</p>
    </div>
  );
}
