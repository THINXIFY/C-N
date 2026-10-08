"use client";

import { TriangleAlert } from "lucide-react";
import { useState, useTransition } from "react";
import { deleteUserAction } from "@/app/actions/admin";
import { Button } from "@/components/ui/Button";
import { buttonClass } from "@/components/ui/button-styles";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

export function DeleteUserDialog({
  user,
  onClose,
  onDeleted,
}: {
  user: { id: string; displayName: string; username: string } | null;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const { toast } = useToast();
  const [typed, setTyped] = useState("");
  const [pending, startTransition] = useTransition();
  const confirmed = !!user && typed.trim().toLowerCase() === user.username.toLowerCase();

  function close() {
    setTyped("");
    onClose();
  }

  function confirm() {
    if (!user || !confirmed) return;
    startTransition(async () => {
      const res = await deleteUserAction(user.id);
      if (!res.ok) {
        toast(res.error ?? "Unable to delete the user.");
        return;
      }
      toast("User deleted");
      setTyped("");
      onDeleted();
    });
  }

  return (
    <Modal open={!!user} onClose={close} title="Delete user?" description="This will permanently remove the user account and associated presentation settings.">
      {user && (
        <div className="space-y-5">
          <dl className="divide-y divide-line rounded-xl border border-line">
            <div className="flex items-center justify-between gap-4 px-4 py-3">
              <dt className="text-sm text-muted">Display name</dt>
              <dd className="min-w-0 truncate text-sm font-medium">{user.displayName}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 px-4 py-3">
              <dt className="text-sm text-muted">Username</dt>
              <dd className="min-w-0 truncate text-sm font-medium">{user.username}</dd>
            </div>
          </dl>
          <div>
            <label htmlFor="del-confirm" className="mb-1.5 block text-sm font-medium">
              Type <span className="font-semibold">{user.username}</span> to confirm
            </label>
            <input
              id="del-confirm"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoComplete="off"
              className="h-12 w-full rounded-xl border border-line bg-white px-3.5 text-[15px] focus:border-debit focus:outline-none focus:ring-4 focus:ring-debit/15"
            />
          </div>
          <p className="flex items-start gap-2 text-[13px] text-muted">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-debit" aria-hidden="true" />
            This can’t be undone. The user is signed out immediately.
          </p>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={close} disabled={pending}>Cancel</Button>
            <button
              onClick={confirm}
              disabled={!confirmed || pending}
              className={buttonClass("danger")}
            >
              {pending ? "Deleting…" : "Delete User"}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
