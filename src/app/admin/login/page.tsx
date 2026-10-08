import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";
import { getCurrentUser } from "@/lib/auth";
import { getContent } from "@/lib/records-service";

export const metadata: Metadata = { title: "Administrator sign in — Ledgerline" };

export default async function AdminLoginPage() {
  const user = await getCurrentUser();
  if (user?.role === "admin") redirect("/admin");
  // Admin login keeps its own fixed copy — this one notice is the exception, since AuthShell's footer
  // is the same shared notice shown on the user sign-in page and is now admin-editable.
  const { notices } = await getContent();
  return (
    <AuthShell admin footerNotice={notices.loginFooterNotice}>
      <LoginForm
        role="admin"
        title="Administrator Access"
        subtitle="Sign in to access dashboard management."
      />
    </AuthShell>
  );
}
