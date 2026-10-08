"use client";

import { UserCog } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

export function ContactAdminCard({
  instructions,
  title = "Contact Administrator",
  buttonText = "Contact Administrator",
  toastText = "Please contact your dashboard administrator directly",
}: {
  instructions: string;
  title?: string;
  buttonText?: string;
  toastText?: string;
}) {
  const { toast } = useToast();
  return (
    <section className="flex flex-col gap-5 rounded-2xl border border-line bg-white p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <div className="flex items-start gap-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-dark">
          <UserCog className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-[15px] font-semibold">{title}</h2>
          <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-muted">{instructions}</p>
        </div>
      </div>
      <Button variant="secondary" onClick={() => toast(toastText)}>
        {buttonText}
      </Button>
    </section>
  );
}
