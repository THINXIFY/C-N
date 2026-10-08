import { cn } from "@/lib/cn";
import type { UserRole, UserStatus } from "@/data/users";

export function RoleBadge({ role }: { role: UserRole }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", role === "admin" ? "bg-ink text-white" : "bg-canvas text-ink/80 ring-1 ring-line")}>
      {role === "admin" ? "Admin" : "User"}
    </span>
  );
}

export function StatusBadge({ status }: { status: UserStatus }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium", status === "active" ? "bg-brand-soft text-brand-dark" : "bg-canvas text-muted ring-1 ring-line")}>
      <span className={cn("h-1.5 w-1.5 rounded-full", status === "active" ? "bg-brand" : "bg-muted/60")} />
      {status === "active" ? "Active" : "Inactive"}
    </span>
  );
}
