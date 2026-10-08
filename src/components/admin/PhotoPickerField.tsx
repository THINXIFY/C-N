"use client";

import { ImagePlus, X } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { formatBytes, PHOTO_ACCEPT, precheckPhoto } from "./photo-utils";

/** Local-only picker used on the create-user form: the user doesn't exist yet, so nothing uploads until after creation. */
export function PhotoPickerField({ onChange }: { onChange: (file: File | null) => void }) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Derived, not stored: avoids a setState-in-effect render and keeps the URL in sync with `file` automatically.
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => void (previewUrl && URL.revokeObjectURL(previewUrl)), [previewUrl]);

  function pick(f: File | null) {
    if (!f) {
      setFile(null);
      setError(null);
      onChange(null);
      return;
    }
    const problem = precheckPhoto(f);
    if (problem) {
      setError(problem);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    setError(null);
    setFile(f);
    onChange(f);
  }

  return (
    <div>
      <p className="mb-1.5 text-sm font-medium">
        Profile Photo <span className="ml-1.5 text-xs font-normal text-muted">Optional</span>
      </p>
      <div className="flex items-center gap-4">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-line bg-canvas">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- local object-URL preview of a not-yet-uploaded file
            <img src={previewUrl} alt="Selected profile photo preview" className="h-full w-full object-cover" />
          ) : (
            <ImagePlus className="h-6 w-6 text-muted" aria-hidden="true" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <label
            htmlFor={id}
            className="inline-flex h-11 cursor-pointer items-center gap-1.5 rounded-[10px] border border-line bg-white px-3.5 text-sm font-medium text-ink transition-colors duration-150 hover:bg-canvas"
          >
            <ImagePlus className="h-3.5 w-3.5" aria-hidden="true" />
            {file ? "Change Photo" : "Upload Photo"}
          </label>
          <input
            ref={inputRef}
            id={id}
            type="file"
            accept={PHOTO_ACCEPT}
            onChange={(e) => pick(e.target.files?.[0] ?? null)}
            className="sr-only"
          />
          {file ? (
            <div className="mt-1.5 flex items-center gap-2 text-xs text-muted">
              <span className="min-w-0 truncate">{file.name} · {formatBytes(file.size)}</span>
              <button
                type="button"
                onClick={() => {
                  pick(null);
                  if (inputRef.current) inputRef.current.value = "";
                }}
                className="inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 font-medium text-debit hover:bg-debit-soft"
              >
                <X className="h-3 w-3" aria-hidden="true" /> Remove
              </button>
            </div>
          ) : (
            <p className="mt-1.5 text-xs text-muted">Optional. Upload a clear profile image for this user.</p>
          )}
          {error && <p className="mt-1.5 text-[13px] text-debit">{error}</p>}
        </div>
      </div>
    </div>
  );
}
