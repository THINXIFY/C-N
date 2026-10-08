import { NextResponse, type NextRequest } from "next/server";
import { isMaintenanceModeActive } from "@/lib/app-settings-service";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

// First, cheap gate: the signed cookie must exist and carry the right role. This does NOT consult the database
// for the role/account check — the authoritative check (account still exists, is active, same role, same
// session version) is requireRole() in every layout and page, and the admin server actions. Login pages are
// left open here and redirect signed-in users themselves, which also avoids redirect loops when a cookie has
// gone stale.
//
// Maintenance mode DOES read the database directly (it's simple global state with no per-user nuance), since
// this is the one place that can enforce it for every request — a typed URL, an old bookmark, or JS disabled —
// not just client-side navigation. proxy.ts runs on the Node.js runtime by default in Next.js 16, so the
// existing fs-backed read is safe to call here. A read failure fails OPEN (treated as "available"), so a
// storage hiccup can never take the whole app down for every visitor.
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  const go = (to: string) => NextResponse.redirect(new URL(to, req.url));

  // Maintenance mode blocks the normal user side only. A valid admin session always passes through — admin
  // sign-in and every /admin route stay fully reachable so maintenance mode can always be disabled again.
  const isUserSidePath = pathname === "/" || pathname === "/login" || pathname.startsWith("/dashboard");
  if (isUserSidePath && session?.role !== "admin" && (await isMaintenanceModeActive())) {
    return go("/maintenance");
  }

  if (pathname === "/") return NextResponse.next(); // page.tsx handles its own role-based redirect
  if (pathname === "/login" || pathname === "/admin/login") return NextResponse.next();

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
  matcher: ["/", "/login", "/admin/:path*", "/dashboard/:path*"],
};
