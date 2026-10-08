import { FilePenLine, KeyRound, MessageCircleQuestion } from "lucide-react";
import { ContactAdminCard } from "@/components/dashboard/ContactAdminCard";
import { PageHeader } from "@/components/layout/PageHeader";
import { CustomCssInjector } from "@/components/shared/CustomCssInjector";
import { Reveal } from "@/components/ui/Reveal";
import { requireRole } from "@/lib/auth";
import { getContent } from "@/lib/records-service";

const topicIcons = [KeyRound, MessageCircleQuestion, FilePenLine];

export default async function SupportPage() {
  await requireRole("user");
  const { support: c } = await getContent();
  return (
    <div data-page="support" className="support-shell">
      <CustomCssInjector scope="support" />
      <Reveal className="max-w-4xl">
        <PageHeader title={c.title} subtitle={c.supportIntro} />

        <div className="grid gap-4 md:grid-cols-3">
          {c.topics.map(({ title, body }, i) => {
            const Icon = topicIcons[i] ?? KeyRound;
            return (
              <section key={i} className="rounded-2xl border border-line bg-white p-5 transition-colors hover:border-[#cfd8d3]">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand-dark">
                  <Icon className="h-5 w-5" />
                </span>
                <h2 className="mt-4 text-[15px] font-semibold">{title}</h2>
                <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-muted">{body}</p>
              </section>
            );
          })}
        </div>

        <div className="mt-4">
          <ContactAdminCard
            instructions={c.adminInstructions}
            title={c.contactTitle}
            buttonText={c.contactButtonText}
            toastText={c.contactToast}
          />
        </div>

        <p className="mt-5 text-xs leading-relaxed text-muted">{c.footerNote}</p>
      </Reveal>
    </div>
  );
}
