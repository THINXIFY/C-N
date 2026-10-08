import { cn } from "@/lib/cn";
import { initials } from "@/lib/format";

interface Props {
  name: string;
  photoPath?: string | null;
  size?: number;
  className?: string;
  /** Extra classes for the initials-fallback text size; sized automatically from `size` if omitted. */
  textClassName?: string;
}

/**
 * Shows the user's uploaded profile photo if one exists, otherwise their initials — used everywhere an avatar
 * appears (topbar, sidebar, account page, admin lists). Photo filenames are unique per upload, so no cache-busting
 * query is needed: replacing a photo always produces a new URL.
 */
export function UserAvatar({ name, photoPath, size = 36, className, textClassName }: Props) {
  const style = { width: size, height: size };
  if (photoPath) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- small user-uploaded avatar, not a next/image candidate
      <img
        src={`/avatars/${photoPath}`}
        alt={`${name} profile photo`}
        style={style}
        className={cn("shrink-0 rounded-full border border-line object-cover", className)}
      />
    );
  }
  return (
    <span
      aria-label={`${name} profile photo`}
      style={style}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-brand-soft font-semibold text-brand-dark",
        textClassName ?? (size <= 28 ? "text-[11px]" : size <= 44 ? "text-xs" : size <= 60 ? "text-sm" : "text-lg"),
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
