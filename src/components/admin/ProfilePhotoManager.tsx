"use client";

import { ImagePlus, Trash2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { removeUserPhotoAction, uploadUserPhotoAction } from "@/app/actions/admin";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { formatBytes, PHOTO_ACCEPT, precheckPhoto } from "./photo-utils";

export function ProfilePhotoManager({
  userId,
  displayName,
  photoPath,
}: {
  userId: string;
  displayName: string;
  photoPath: string | null;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [staged, setStaged] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);

  // Derived, not stored: avoids a setState-in-effect render and keeps the URL in sync with `staged` automatically.
  const previewUrl = useMemo(() => (staged ? URL.createObjectURL(staged) : null), [staged]);
  useEffect(() => () => void (previewUrl && URL.revokeObjectURL(previewUrl)), [previewUrl]);

  function pick(file: File | null) {
    if (!file) return;
    const problem = precheckPhoto(file);
    if (problem) {
      setError(problem);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    setError(null);
    setStaged(file);
  }

  function cancelStaged() {
    setStaged(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function saveStaged() {
    if (!staged) return;
    setSaving(true);
    const fd = new FormData();
    fd.set("photo", staged);
    const res = await uploadUserPhotoAction(userId, fd);
    setSaving(false);
    if (!res.ok) {
      setError(res.error ?? "Profile photo upload failed. Please try again.");
      return;
    }
    toast("Profile photo updated");
    cancelStaged();
    router.refresh();
  }

  async function confirmAndRemove() {
    setRemoving(true);
    const res = await removeUserPhotoAction(userId);
    setRemoving(false);
    setConfirmRemove(false);
    if (!res.ok) {
      toast(res.error ?? "Unable to remove the profile photo.");
      return;
    }
    toast("Profile photo removed");
    router.refresh();
  }

  return (
    <div>
      <p className="mb-1.5 text-sm font-medium">Profile Photo</p>
      <div className="flex flex-wrap items-center gap-4">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-line bg-canvas">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- local object-URL preview of a not-yet-saved file
            <img src={previewUrl} alt="New profile photo preview" className="h-full w-full object-cover" />
          ) : (
            <UserAvatar name={displayName} photoPath={photoPath} size={64} textClassName="text-lg" />
          )}
        </span>

        {staged ? (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-ink">{staged.name} · {formatBytes(staged.size)}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button type="button" loading={saving} onClick={saveStaged}>
                {saving ? "Saving…" : "Save Photo"}
              </Button>
              <Button type="button" variant="secondary" disabled={saving} onClick={cancelStaged}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <label
              htmlFor={id}
              className="inline-flex h-11 cursor-pointer items-center gap-1.5 rounded-[10px] border border-line bg-white px-3.5 text-sm font-medium text-ink transition-colors duration-150 hover:bg-canvas"
            >
              {photoPath ? <Upload className="h-3.5 w-3.5" aria-hidden="true" /> : <ImagePlus className="h-3.5 w-3.5" aria-hidden="true" />}
              {photoPath ? "Change Photo" : "Upload Photo"}
            </label>
            <input ref={inputRef} id={id} type="file" accept={PHOTO_ACCEPT} className="sr-only" onChange={(e) => pick(e.target.files?.[0] ?? null)} />
            {photoPath && (
              <button
                type="button"
                onClick={() => setConfirmRemove(true)}
                className="inline-flex h-11 items-center gap-1.5 rounded-[10px] border border-line bg-white px-3.5 text-sm font-medium text-debit transition-colors duration-150 hover:bg-debit-soft"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> Remove Photo
              </button>
            )}
          </div>
        )}
      </div>
      {error && <p className="mt-2 text-[13px] text-debit">{error}</p>}
      {!staged && <p className="mt-2 text-xs text-muted">PNG, JPG or WEBP, up to 2 MB.</p>}

      <Modal open={confirmRemove} onClose={() => setConfirmRemove(false)} title="Remove profile photo?" description="The user’s avatar will return to their initials.">
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={() => setConfirmRemove(false)} disabled={removing}>
            Cancel
          </Button>
          <Button type="button" variant="danger" loading={removing} onClick={confirmAndRemove}>
            {removing ? "Removing…" : "Remove Photo"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
