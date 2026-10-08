import type { ReactNode } from "react";

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-x-4 gap-y-3 sm:mb-7">
      <div className="min-w-0">
        <h1 className="break-words text-[22px] font-semibold leading-tight tracking-tight sm:text-[26px] lg:text-[30px]">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted sm:mt-1.5 sm:text-[15px]">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
