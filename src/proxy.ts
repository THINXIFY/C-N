import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

// First, cheap gate: the signed cookie must exist and carry the right role. This does NOT consult the database.
// The authoritative check (account still exists, is active, same role, same session version) is requireRole()
// in every layout and page, and the admin server actions. Login pages are left open here and redirect
// signed-in users themselves, which also avoids redirect loops when a cookie has gone stale.
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname === "/login" || pathname === "/admin/login") return NextResponse.next();

  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  const go = (to: string) => NextResponse.redirect(new URL(to, req.url));

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    if (!session) return go("/admin/login");
    if (session.role !== "admin") return go("/dashboard");
  } else {
    if (!session) return go("/login");
    if (session.role !== "user") return go("/admin");
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/admin/:path*", "/dashboard/:path*"],
};
