// Client-side pre-check only — fast feedback before the file even leaves the browser. The server re-validates
// the real bytes (src/lib/avatar-storage.ts) regardless, since a browser-reported type/extension can't be trusted.
export const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];
export const PHOTO_UPLOAD_ERROR = "Please upload a PNG, JPG or WEBP image under 2 MB.";
export const PHOTO_ACCEPT = "image/png,image/jpeg,image/webp";

export function precheckPhoto(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) return PHOTO_UPLOAD_ERROR;
  if (file.size > MAX_PHOTO_BYTES) return PHOTO_UPLOAD_ERROR;
  return null;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
