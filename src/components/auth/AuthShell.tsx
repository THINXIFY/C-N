import { LineChart, Lock, ShieldCheck } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { BrandName } from "@/components/ui/BrandName";
import type { LoginContent } from "@/data/settings";

function BrandPanel({ admin, content }: { admin?: boolean; content?: LoginContent }) {
  return (
    <aside className="relative hidden w-[54%] overflow-hidden bg-[#0f1a14] text-white lg:flex lg:flex-col lg:justify-between lg:p-14 xl:p-16">
      {/* decorative layers */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.06) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse at 30% 40%, #000 20%, transparent 75%)",
        }}
      />
      <div aria-hidden="true" className="absolute -right-24 -top-24 h-[420px] w-[420px] rounded-full bg-brand/25 blur-[110px]" />
      <div aria-hidden="true" className="absolute -bottom-32 left-10 h-[360px] w-[360px] rounded-full bg-brand/15 blur-[120px]" />
      <svg aria-hidden="true" viewBox="0 0 600 220" className="absolute bottom-28 right-0 w-[78%] opacity-60" fill="none">
        <defs>
          <linearGradient id="area" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#18a84a" stopOpacity=".28" />
            <stop offset="1" stopColor="#18a84a" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M0 170 C60 150 90 160 140 120 S230 100 280 120 360 60 420 70 520 30 600 20 V220 H0Z" fill="url(#area)" />
        <path d="M0 170 C60 150 90 160 140 120 S230 100 280 120 360 60 420 70 520 30 600 20" stroke="#3ddc78" strokeWidth="2" strokeLinecap="round" />
        <circle cx="420" cy="70" r="5" fill="#0f1a14" stroke="#3ddc78" strokeWidth="2" />
      </svg>
      <div aria-hidden="true" className="absolute right-14 top-14 h-40 w-40 rounded-full border border-white/10" />
      <div aria-hidden="true" className="absolute right-24 top-24 h-40 w-40 rounded-full border border-white/10" />

      {/* abstract, number-free dashboard motif (decorative only) */}
      <div
        aria-hidden="true"
        className="absolute right-12 top-[38%] hidden w-[220px] rounded-2xl border border-white/10 bg-white/[0.03] p-4 xl:block"
      >
        <div className="h-2 w-16 rounded-full bg-white/15" />
        <div className="mt-3 h-3 w-28 rounded-full bg-white/10" />
        <div className="mt-5 flex h-14 items-end gap-1.5">
          {[38, 56, 44, 70, 52, 84, 62].map((h, i) => (
            <span key={i} className="flex-1 rounded-sm bg-brand/40" style={{ height: `${h}%` }} />
          ))}
        </div>
        <div className="mt-4 space-y-2">
          <div className="h-2 w-full rounded-full bg-white/[0.07]" />
          <div className="h-2 w-4/5 rounded-full bg-white/[0.07]" />
        </div>
      </div>

      <div className="relative">
        <BrandName light className="text-2xl" />
      </div>

      <div className="relative max-w-[520px]">
        {admin && (
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/80">
            <ShieldCheck className="h-3.5 w-3.5 text-brand" /> Administrator Access
          </span>
        )}
        <h1 className="text-[44px] font-semibold leading-[1.08] tracking-tight xl:text-5xl">
          {content?.headline1 ?? "Financial clarity,"}
          <br />
          {content?.headline2 ?? "all in one place."}
        </h1>
        <p className="mt-6 max-w-md text-base leading-relaxed text-white/65">
          {content?.tagline ?? "A private record dashboard designed to keep your financial activity organized, accessible and easy to understand."}
        </p>
        <ul className="mt-10 flex flex-wrap gap-x-7 gap-y-3 text-sm text-white/60">
          <li className="flex items-center gap-2"><LineChart className="h-4 w-4 text-brand" /> {content?.trustPoint1 ?? "Recorded history"}</li>
          <li className="flex items-center gap-2"><Lock className="h-4 w-4 text-brand" /> {content?.trustPoint2 ?? "Private access"}</li>
        </ul>
      </div>

      <div aria-hidden="true" />
    </aside>
  );
}

export function AuthShell({
  admin,
  content,
  footerNotice = "Private record access · Not an official banking portal",
  children,
}: {
  admin?: boolean;
  /** User-side only: admin-editable headline/tagline/trust points/help text. Never passed on /admin/login. */
  content?: LoginContent;
  /** Admin-editable (notices.loginFooterNotice); passed on BOTH /login and /admin/login since it's the same notice. */
  footerNotice?: string;
  children: ReactNode;
}) {
  return (
    <div
      data-page={admin ? undefined : "login"}
      className={`flex min-h-dvh flex-col bg-canvas${admin ? "" : " user-shell login-shell"}`}
    >
      <div className="flex flex-1">
        <BrandPanel admin={admin} content={content} />
        <main className="flex flex-1 flex-col bg-white lg:bg-canvas">
          <div className="flex flex-1 items-center justify-center px-5 py-8 sm:px-8 sm:py-10">
            <div className="w-full max-w-[420px]">
              <BrandName className="mb-8 block text-xl lg:hidden" />
              {admin && (
                <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-2.5 py-1 text-xs font-medium text-brand-dark lg:hidden">
                  <ShieldCheck className="h-3.5 w-3.5" /> Administrator Access
                </span>
              )}
              {children}
              <p className="mt-6 text-center text-sm text-muted">
                {content?.helpText ?? "Need help? Contact your account administrator."}
                {admin ? (
                  <>
                    {" "}
                    <Link href="/login" className="font-medium text-brand-dark hover:underline">
                      User sign in
                    </Link>
                  </>
                ) : null}
              </p>
            </div>
          </div>
          <footer className="px-5 pb-6 text-center">
            <p className="text-xs text-muted">{footerNotice}</p>
          </footer>
        </main>
      </div>
    </div>
  );
}
