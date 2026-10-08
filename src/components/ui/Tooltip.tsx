import type { ReactNode } from "react";

/** CSS-only tooltip: shows on hover and keyboard focus of the wrapped control. */
export function Tooltip({ label, children, block }: { label: string; children: ReactNode; block?: boolean }) {
  return (
    <span className={block ? "group/tip relative flex w-full" : "group/tip relative inline-flex"}>
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute left-1/2 top-full z-50 mt-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-ink px-2 py-1 text-xs text-white opacity-0 transition-opacity duration-150 group-hover/tip:opacity-100 group-focus-within/tip:opacity-100"
      >
        {label}
      </span>
    </span>
  );
}
