"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { logoutAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/Button";
import { flashToast } from "@/components/ui/Toast";

export function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <Button
      variant="secondary"
      loading={busy}
      onClick={async () => {
        setBusy(true);
        await logoutAction();
        flashToast("Signed out successfully");
        router.replace("/admin/login");
      }}
    >
      {!busy && <LogOut className="h-4 w-4" aria-hidden="true" />} Sign Out
    </Button>
  );
}
