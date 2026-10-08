import { cn } from "@/lib/cn";

/** Text-only product name. There is deliberately no image or icon logo anywhere in the app. */
export const BRAND_NAME = "Dashboard";

export function BrandName({ className, light }: { className?: string; light?: boolean }) {
  return (
    <span
      className={cn(
        "select-none whitespace-nowrap text-xl font-semibold tracking-tight sm:text-[22px]",
        light ? "text-white" : "text-ink",
        className,
      )}
    >
      {BRAND_NAME}
    </span>
  );
}

/** Single-letter stand-in used only where the sidebar is a 72px icon rail and the full word can't fit. */
export function BrandInitial({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex h-9 w-9 select-none items-center justify-center rounded-[10px] border border-line bg-white text-base font-semibold text-ink",
        className,
      )}
    >
      {BRAND_NAME[0]}
    </span>
  );
}
