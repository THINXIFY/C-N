import "server-only";
import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

// Profile-photo files live outside `public/` (not world-listable) and are served read-only through
// `src/app/avatars/[file]/route.ts`. Filenames are always server-generated — the client's filename and
// claimed MIME type are never trusted as the actual type or as any part of a filesystem path.

const DIR = path.join(process.cwd(), ".data", "uploads", "users");
export const MAX_BYTES = 2 * 1024 * 1024; // 2 MB

const SIGNATURES: Array<{ mime: "image/png" | "image/jpeg" | "image/webp"; ext: "png" | "jpg" | "webp"; check: (b: Buffer) => boolean }> = [
  { mime: "image/png", ext: "png", check: (b) => b.length > 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },
  { mime: "image/jpeg", ext: "jpg", check: (b) => b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  // WEBP = "RIFF"....."WEBP"
  { mime: "image/webp", ext: "webp", check: (b) => b.length > 12 && b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP" },
];

export interface DetectedImage {
  mime: "image/png" | "image/jpeg" | "image/webp";
  ext: "png" | "jpg" | "webp";
}

/** Sniffs the real file type from its bytes. Returns null for anything that isn't PNG/JPEG/WEBP, regardless of what the browser claimed. */
export function detectImageType(bytes: Buffer): DetectedImage | null {
  const found = SIGNATURES.find((s) => s.check(bytes));
  return found ? { mime: found.mime, ext: found.ext } : null;
}

/** Strict filename pattern the serving route also checks — rejects anything that isn't exactly what we generate. */
export const AVATAR_FILENAME_RE = /^user-[a-zA-Z0-9-]+-[a-f0-9]{16}\.(png|jpg|webp)$/;

export async function saveAvatarFile(userId: string, bytes: Buffer, type: DetectedImage): Promise<string> {
  await fs.mkdir(DIR, { recursive: true });
  const filename = `user-${userId}-${randomUUID().replace(/-/g, "").slice(0, 16)}.${type.ext}`;
  await fs.writeFile(path.join(DIR, filename), bytes, { mode: 0o600 });
  return filename;
}

/** Best-effort delete — a missing file (already gone, or a legacy record) is not an error. */
export async function deleteAvatarFile(filename: string | null | undefined): Promise<void> {
  if (!filename || !AVATAR_FILENAME_RE.test(filename)) return;
  try {
    await fs.unlink(path.join(DIR, filename));
  } catch {
    /* already gone */
  }
}

export async function readAvatarFile(filename: string): Promise<Buffer | null> {
  if (!AVATAR_FILENAME_RE.test(filename)) return null;
  try {
    return await fs.readFile(path.join(DIR, filename));
  } catch {
    return null;
  }
}

const UPLOAD_ERROR = "Please upload a PNG, JPG or WEBP image under 2 MB.";

export type PhotoValidation = { ok: true; bytes: Buffer; type: DetectedImage } | { ok: false; error: string };

/** Authoritative validation: size, then the file's real bytes — the browser's claimed type/extension is never trusted. */
export async function validatePhotoFile(file: File): Promise<PhotoValidation> {
  if (file.size === 0) return { ok: false, error: "Choose an image to upload." };
  if (file.size > MAX_BYTES) return { ok: false, error: UPLOAD_ERROR };
  const bytes = Buffer.from(await file.arrayBuffer());
  const type = detectImageType(bytes);
  if (!type) return { ok: false, error: UPLOAD_ERROR };
  return { ok: true, bytes, type };
}

export function mimeForExt(filename: string): string {
  if (filename.endsWith(".png")) return "image/png";
  if (filename.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}
