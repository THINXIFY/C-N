import { Info } from "lucide-react";
import { cn } from "@/lib/cn";

/** Default text for the one required notice per screen. Admin-editable (see notices.dashboardInfoStrip), but
 *  never blankable and never strippable of its core meaning — see settings-validation.ts's core-notice checks. */
export const RECORD_NOTICE = "Private record dashboard. Financial values are internally maintained and are not bank-verified.";

export function RecordNotice({ text = RECORD_NOTICE, className }: { text?: string; className?: string }) {
  return (
    <div
      role="note"
      className={cn(
        "flex items-start gap-1.5 border-b border-line bg-[#eef1ef] px-4 py-1.5 text-xs leading-snug text-muted sm:items-center sm:justify-center",
        className,
      )}
    >
      <Info className="mt-px h-3.5 w-3.5 shrink-0 opacity-80 sm:mt-0" aria-hidden="true" />
      <span>{text}</span>
    </div>
  );
}
