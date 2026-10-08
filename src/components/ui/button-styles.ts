import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-brand text-white shadow-[0_1px_0_rgba(255,255,255,.18)_inset,0_1px_2px_rgba(18,135,59,.25)] hover:bg-brand-dark active:bg-[#0f7634]",
  secondary: "border border-line bg-white text-ink hover:border-[#cfd8d3] hover:bg-canvas active:bg-[#eef1ef]",
  ghost: "text-muted hover:bg-black/[0.04] hover:text-ink active:bg-black/[0.07]",
  // Reserved for destructive admin actions only.
  danger: "bg-debit text-white hover:bg-[#b03030] active:bg-[#9c2a2a]",
};

/** One source of truth for button look & feel (44px touch target, 10px radius, subtle press feedback). */
export function buttonClass(variant: ButtonVariant = "primary", className?: string) {
  return cn(
    "inline-flex h-11 min-w-[44px] items-center justify-center gap-2 rounded-[10px] px-5 text-sm font-medium",
    "transition-[background-color,border-color,transform,box-shadow] duration-150 ease-out",
    "active:scale-[0.985] motion-reduce:transition-none motion-reduce:active:scale-100",
    "disabled:cursor-not-allowed disabled:opacity-55 disabled:active:scale-100",
    variants[variant],
    className,
  );
}
