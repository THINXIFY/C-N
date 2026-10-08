import { NextResponse, type NextRequest } from "next/server";
import { AVATAR_FILENAME_RE, mimeForExt, readAvatarFile } from "@/lib/avatar-storage";

// Read-only. Serves exactly one thing: an uploaded profile photo, by its server-generated filename.
// No financial data, no mutation, nothing else under .data is reachable — the filename must match the
// strict pattern we generate (user-<id>-<16 hex>.<png|jpg|webp>), which also rules out path traversal.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  if (!AVATAR_FILENAME_RE.test(file)) return new NextResponse("Not found", { status: 404 });

  const bytes = await readAvatarFile(file);
  if (!bytes) return new NextResponse("Not found", { status: 404 });

  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": mimeForExt(file),
      // The filename is unique per upload (replacing a photo never reuses it), so this is safe to cache hard.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
