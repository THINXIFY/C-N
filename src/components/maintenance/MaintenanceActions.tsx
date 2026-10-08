"use client";

import { RefreshCw, LifeBuoy } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

export function MaintenanceActions({ refreshLabel, supportLabel }: { refreshLabel: string; supportLabel: string }) {
  const { toast } = useToast();
  return (
    <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
      <Button type="button" onClick={() => window.location.reload()} className="gap-2">
        <RefreshCw className="h-4 w-4" aria-hidden="true" /> {refreshLabel}
      </Button>
      <Button
        type="button"
        variant="secondary"
        onClick={() => toast("Please contact your account administrator directly.")}
        className="gap-2"
      >
        <LifeBuoy className="h-4 w-4" aria-hidden="true" /> {supportLabel}
      </Button>
    </div>
  );
}
