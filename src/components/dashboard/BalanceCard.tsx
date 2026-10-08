"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Tooltip } from "@/components/ui/Tooltip";
import { formatDate, formatMoney } from "@/lib/format";

export function BalanceCard({
  holderName,
  businessName,
  balance,
  currency,
  latestDate,
  hiddenByDefault = false,
  balanceLabel = "Recorded Balance",
  helperText = "Internal record · Not bank-verified",
}: {
  holderName: string;
  businessName: string;
  balance: number;
  currency: string;
  latestDate: string | null;
  hiddenByDefault?: boolean;
  balanceLabel?: string;
  helperText?: string;
}) {
  const [visible, setVisible] = useState(!hiddenByDefault);
  const [whole, cents] = formatMoney(balance, currency).split(".");

  return (
    <section
      aria-label="Recorded balance"
      className="relative overflow-hidden rounded-2xl border border-[#1c2b23] bg-[#0f1a14] p-5 text-white transition-[border-color,box-shadow] duration-200 ease-out hover:border-[#2a4234] hover:shadow-[0_6px_18px_rgba(15,26,20,.14)] sm:p-7"
    >
      <div aria-hidden="true" className="absolute -right-16 -top-24 h-64 w-64 rounded-full bg-brand/25 blur-[90px]" />
      <svg aria-hidden="true" viewBox="0 0 400 120" className="absolute right-6 top-14 hidden h-24 w-[38%] max-w-[420px] opacity-45 lg:block" fill="none" preserveAspectRatio="none">
        <defs>
          <linearGradient id="bal-area" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#18a84a" stopOpacity=".3" />
            <stop offset="1" stopColor="#18a84a" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M0 95 C50 90 70 70 110 75 S180 50 220 55 290 25 330 30 380 10 400 8 V120 H0Z" fill="url(#bal-area)" />
        <path d="M0 95 C50 90 70 70 110 75 S180 50 220 55 290 25 330 30 380 10 400 8" stroke="#3ddc78" strokeWidth="1.8" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      </svg>

      <div className="relative flex items-start justify-between gap-4">
        <p className="text-sm font-medium text-white/70">{balanceLabel}</p>
        <Tooltip label={visible ? "Hide balance" : "Show balance"}>
          <button
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Hide balance" : "Show balance"}
            aria-pressed={!visible}
            className="-mt-1.5 flex h-10 w-10 items-center justify-center rounded-[10px] border border-white/10 bg-white/5 text-white/80 transition-colors hover:bg-white/10"
          >
            {visible ? <Eye className="h-[18px] w-[18px]" /> : <EyeOff className="h-[18px] w-[18px]" />}
          </button>
        </Tooltip>
      </div>

      <div className="relative -mt-3 h-[52px] sm:h-[58px]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={visible ? "shown" : "hidden"}
            initial={{ opacity: 0, y: 6, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -6, filter: "blur(4px)" }}
            transition={{ duration: 0.2, ease: [0.22, 0.61, 0.36, 1] }}
            className="tabular text-[32px] font-semibold leading-[52px] tracking-tight min-[400px]:text-[36px] sm:text-[42px] sm:leading-[58px]"
            aria-live="polite"
          >
            {visible ? (
              <>
                {whole}
                <span className="text-white/50">.{cents}</span>
              </>
            ) : (
              <span aria-label="Balance hidden" className="tracking-[0.2em]">••••••••••</span>
            )}
          </motion.p>
        </AnimatePresence>
      </div>
      <p className="relative mt-1 text-[13px] text-white/50">{helperText}</p>

      <dl className="relative mt-6 grid gap-x-8 gap-y-4 border-t border-white/10 pt-5 sm:grid-cols-[1fr_1fr_auto]">
        <div className="min-w-0">
          <dt className="text-[11px] font-medium uppercase tracking-wide text-white/40">Business</dt>
          <dd className="mt-1 break-words text-sm font-medium">{businessName}</dd>
        </div>
        <div className="min-w-0">
          <dt className="text-[11px] font-medium uppercase tracking-wide text-white/40">Account holder</dt>
          <dd className="mt-1 text-sm font-medium">{holderName}</dd>
        </div>
        {latestDate && (
          <div>
            <dt className="text-[11px] font-medium uppercase tracking-wide text-white/40">Latest activity</dt>
            <dd className="mt-1 whitespace-nowrap text-sm font-medium">{formatDate(latestDate)}</dd>
          </div>
        )}
      </dl>
    </section>
  );
}
