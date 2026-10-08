import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";
import { CustomCssInjector } from "@/components/shared/CustomCssInjector";
import { getCurrentUser, homeFor } from "@/lib/auth";
import { getContent } from "@/lib/records-service";

export const metadata: Metadata = { title: "Sign in — Dashboard" };

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect(homeFor(user.role));
  const { login, messages, notices } = await getContent();
  return (
    <>
      <CustomCssInjector scope="login" />
      <AuthShell content={login} footerNotice={notices.loginFooterNotice}>
        <LoginForm role="user" title={login.welcomeTitle} subtitle={login.welcomeSubtitle} content={login} signedInToast={messages.signedInToast} />
      </AuthShell>
    </>
  );
}
