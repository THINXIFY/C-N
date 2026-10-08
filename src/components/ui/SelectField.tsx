import { ChevronDown } from "lucide-react";
import { useId, type ReactNode } from "react";
import { cn } from "@/lib/cn";

interface Props<T extends string> {
  label: string;
  value: T;
  onChange: (value: T) => void;
  children: ReactNode;
  className?: string;
}

/** Labelled native select with a custom chevron — accessible, keyboard-friendly and mobile-native. */
export function SelectField<T extends string>({ label, value, onChange, children, className }: Props<T>) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-muted">
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value as T)}
          className={cn(
            "h-11 w-full appearance-none rounded-[10px] border border-line bg-white pl-3.5 pr-9 text-sm text-ink",
            "transition-[border-color,box-shadow] duration-150 hover:border-[#cfd8d3] focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15",
          )}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
      </div>
    </div>
  );
}
