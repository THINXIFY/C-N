"use client";

import { Ellipsis, KeyRound, Pencil, Plus, Power, Search, SearchX, ShieldQuestion, Trash2, UserRound, X, Eye } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { setUserStatusAction } from "@/app/actions/admin";
import { Button } from "@/components/ui/Button";
import { buttonClass } from "@/components/ui/button-styles";
import { EmptyState } from "@/components/ui/EmptyState";
import { Popover } from "@/components/ui/Popover";
import { useToast } from "@/components/ui/Toast";
import { UserAvatar } from "@/components/ui/UserAvatar";
import type { UserSummary } from "@/data/users";
import { cn } from "@/lib/cn";
import { formatLastLogin } from "@/lib/format";
import { CredentialDialog, type CredentialKind } from "./CredentialDialog";
import { DeleteUserDialog } from "./DeleteUserDialog";
import { RoleBadge, StatusBadge } from "./UserBadges";

type Filter = "all" | "active" | "inactive" | "user" | "admin";
const filters: Array<{ value: Filter; label: string }> = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "user", label: "User" },
  { value: "admin", label: "Admin" },
];

const menuItem = "flex min-h-11 w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-canvas disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-transparent";

function RowActions({ u, currentUserId, onCredential, onDelete, onToggle }: { u: UserSummary; currentUserId: string; onCredential: (kind: CredentialKind, u: UserSummary) => void; onDelete: (u: UserSummary) => void; onToggle: (u: UserSummary) => void }) {
  const self = u.id === currentUserId;
  return (
    <Popover
      className="w-56"
      trigger={({ open, toggle, id }) => (
        <button
          data-popover-trigger
          onClick={toggle}
          aria-label={`Actions for ${u.displayName}`}
          aria-expanded={open}
          aria-controls={id}
          className="flex h-11 w-11 items-center justify-center rounded-[10px] text-muted transition-colors duration-150 hover:bg-black/[0.05] hover:text-ink active:bg-black/[0.07]"
        >
          <Ellipsis className="h-5 w-5" />
        </button>
      )}
    >
      {(close) => (
        <div role="menu" aria-label={`Actions for ${u.displayName}`}>
          <Link role="menuitem" href={`/admin/users/${u.id}`} onClick={close} className={menuItem}><Eye className="h-4 w-4 text-muted" /> View</Link>
          <Link role="menuitem" href={`/admin/users/${u.id}`} onClick={close} className={menuItem}><Pencil className="h-4 w-4 text-muted" /> Edit</Link>
          <button role="menuitem" className={menuItem} onClick={() => { close(); onCredential("password", u); }}><KeyRound className="h-4 w-4 text-muted" /> Reset Password</button>
          <button role="menuitem" className={menuItem} onClick={() => { close(); onCredential("code", u); }}><ShieldQuestion className="h-4 w-4 text-muted" /> Reset Access Code</button>
          <button role="menuitem" className={menuItem} disabled={self && u.status === "active"} title={self ? "You can’t deactivate your own account" : undefined} onClick={() => { close(); onToggle(u); }}>
            <Power className="h-4 w-4 text-muted" /> {u.status === "active" ? "Deactivate" : "Activate"}
          </button>
          <div className="my-1 border-t border-line" />
          <button role="menuitem" className={cn(menuItem, "text-debit hover:bg-debit-soft")} disabled={self} title={self ? "You can’t delete your own account" : undefined} onClick={() => { close(); onDelete(u); }}>
            <Trash2 className="h-4 w-4" /> Delete
          </button>
        </div>
      )}
    </Popover>
  );
}

export function UsersTable({ users, currentUserId }: { users: UserSummary[]; currentUserId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [cred, setCred] = useState<{ kind: CredentialKind; user: UserSummary } | null>(null);
  const [del, setDel] = useState<UserSummary | null>(null);
  const [, startTransition] = useTransition();

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter(
      (u) =>
        (filter === "all" || u.status === filter || u.role === filter) &&
        (!q || u.username.toLowerCase().includes(q) || u.displayName.toLowerCase().includes(q) || u.businessName.toLowerCase().includes(q)),
    );
  }, [users, query, filter]);

  function toggleStatus(u: UserSummary) {
    const next = u.status === "active" ? "inactive" : "active";
    startTransition(async () => {
      const res = await setUserStatusAction(u.id, next);
      if (!res.ok) return toast(res.error ?? "Unable to save changes.");
      toast(next === "active" ? "User activated" : "User deactivated");
      router.refresh();
    });
  }

  const filtered = query.trim() !== "" || filter !== "all";

  return (
    <>
      <div className="mb-4 rounded-2xl border border-line bg-white p-4 sm:p-5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted" aria-hidden="true" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search users by username, display name or organization"
            placeholder="Search users"
            className="h-12 w-full rounded-xl border border-line bg-white pl-11 pr-11 text-[15px] placeholder:text-muted/70 transition-[border-color,box-shadow] duration-150 focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15"
          />
          {query && (
            <button onClick={() => setQuery("")} aria-label="Clear search" className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-muted hover:bg-canvas hover:text-ink">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div role="radiogroup" aria-label="Filter users" className="mt-4 flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f.value}
              role="radio"
              aria-checked={filter === f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                "h-10 rounded-full border px-4 text-sm font-medium transition-colors duration-150 sm:h-9",
                filter === f.value ? "border-brand/30 bg-brand-soft text-brand-dark" : "border-line bg-white text-muted hover:text-ink",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <p className="mb-3 px-1 text-sm text-muted" aria-live="polite" data-testid="user-count">
        Showing <span className="font-medium text-ink">{rows.length}</span> of {users.length} {users.length === 1 ? "user" : "users"}
      </p>

      <div className="rounded-2xl border border-line bg-white">
        {rows.length === 0 ? (
          <EmptyState
            icon={filtered ? SearchX : UserRound}
            title={filtered ? "No matching users" : "No users yet"}
            description={filtered ? "We couldn’t find any users matching your search or filter." : "Add a user to give someone access to Ledgerline."}
            action={
              filtered ? (
                <Button variant="secondary" onClick={() => { setQuery(""); setFilter("all"); }}>Clear filters</Button>
              ) : (
                <Link href="/admin/users/new" className={buttonClass("primary")}><Plus className="h-4 w-4" /> Add User</Link>
              )
            }
          />
        ) : (
          <>
            <table className="hidden w-full table-fixed border-collapse md:table">
              <caption className="sr-only">Users</caption>
              <colgroup>
                <col className="w-[27%]" />
                <col className="w-[15%]" />
                <col className="hidden lg:table-column w-[19%]" />
                <col className="w-[84px]" />
                <col className="w-[104px]" />
                <col className="hidden xl:table-column w-[17%]" />
                <col className="w-[64px]" />
              </colgroup>
              <thead>
                <tr className="border-b border-line text-left text-xs font-medium uppercase tracking-wide text-muted">
                  <th scope="col" className="px-5 py-3.5 font-medium">User</th>
                  <th scope="col" className="px-3 py-3.5 font-medium">Username</th>
                  <th scope="col" className="hidden px-3 py-3.5 font-medium lg:table-cell">Organization</th>
                  <th scope="col" className="px-3 py-3.5 font-medium">Role</th>
                  <th scope="col" className="px-3 py-3.5 font-medium">Status</th>
                  <th scope="col" className="hidden px-3 py-3.5 font-medium xl:table-cell">Last Login</th>
                  <th scope="col" className="px-3 py-3.5 text-right font-medium"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((u) => (
                  <tr key={u.id} className="border-b border-line/70 transition-colors duration-150 last:border-0 hover:bg-canvas">
                    <td className="px-5 py-3.5">
                      <Link href={`/admin/users/${u.id}`} className="flex items-center gap-3 rounded-md">
                        <UserAvatar name={u.displayName} photoPath={u.profilePhotoPath} size={36} />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium">{u.displayName}{u.id === currentUserId && <span className="ml-1.5 text-xs font-normal text-muted">(you)</span>}</span>
                          {u.email && <span className="block truncate text-xs text-muted">{u.email}</span>}
                        </span>
                      </Link>
                    </td>
                    <td className="px-3 py-3.5"><span className="block truncate font-mono text-[13px] text-ink/80">{u.username}</span></td>
                    <td className="hidden px-3 py-3.5 lg:table-cell"><span className="block truncate text-sm text-muted">{u.businessName}</span></td>
                    <td className="px-3 py-3.5"><RoleBadge role={u.role} /></td>
                    <td className="px-3 py-3.5"><StatusBadge status={u.status} /></td>
                    <td className="hidden px-3 py-3.5 text-sm text-muted xl:table-cell">{formatLastLogin(u.lastLoginAt)}</td>
                    <td className="px-3 py-3.5 text-right"><div className="flex justify-end"><RowActions u={u} currentUserId={currentUserId} onCredential={(kind, user) => setCred({ kind, user })} onDelete={setDel} onToggle={toggleStatus} /></div></td>
                  </tr>
                ))}
              </tbody>
            </table>

            <ul className="space-y-2 p-2 md:hidden">
              {rows.map((u) => (
                <li key={u.id} className="rounded-xl border border-line/80 bg-white p-3.5">
                  <div className="flex items-start gap-3">
                    <UserAvatar name={u.displayName} photoPath={u.profilePhotoPath} size={40} />
                    <Link href={`/admin/users/${u.id}`} className="min-w-0 flex-1 rounded-md">
                      <span className="block break-words text-sm font-medium leading-snug">{u.displayName}{u.id === currentUserId && <span className="ml-1.5 text-xs font-normal text-muted">(you)</span>}</span>
                      <span className="block truncate font-mono text-xs text-muted">{u.username}</span>
                      <span className="mt-0.5 block break-words text-xs text-muted">{u.businessName}</span>
                    </Link>
                    <RowActions u={u} currentUserId={currentUserId} onCredential={(kind, user) => setCred({ kind, user })} onDelete={setDel} onToggle={toggleStatus} />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <RoleBadge role={u.role} />
                    <StatusBadge status={u.status} />
                    <span className="ml-auto text-xs text-muted">Last login: {formatLastLogin(u.lastLoginAt)}</span>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <CredentialDialog kind={cred?.kind ?? null} user={cred?.user ?? null} onClose={() => setCred(null)} />
      <DeleteUserDialog
        user={del}
        onClose={() => setDel(null)}
        onDeleted={() => {
          setDel(null);
          router.refresh();
        }}
      />
    </>
  );
}
