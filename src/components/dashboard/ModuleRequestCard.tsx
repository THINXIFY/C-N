"use client";

import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

/** Shared "request interest" interaction for informational modules (Loans, FX Sales) that don't connect to a
 *  real external system yet — clicking the button only acknowledges the inquiry via a toast, never a fake
 *  approval/execution state. */
export function ModuleRequestCard({ buttonLabel, toastText }: { buttonLabel: string; toastText: string }) {
  const { toast } = useToast();
  return (
    <Button type="button" onClick={() => toast(toastText)}>
      {buttonLabel}
    </Button>
  );
}
