"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Eye, EyeOff, Lock } from "lucide-react";
import { useState, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function PasswordField({
  className,
  noun = "password",
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { noun?: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted" aria-hidden="true" />
      <input
        {...rest}
        type={visible ? "text" : "password"}
        className={cn(
          "h-[50px] w-full rounded-xl border border-line bg-white pl-11 pr-12 text-[15px] text-ink placeholder:text-muted/70",
          "transition-[border-color,box-shadow] duration-200 ease-out hover:border-[#cfd8d3] focus:border-brand focus:outline-none focus:ring-[3px] focus:ring-brand/15",
          "aria-[invalid=true]:border-debit aria-[invalid=true]:focus:ring-debit/15",
          className,
        )}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? `Hide ${noun}` : `Show ${noun}`}
        aria-pressed={visible}
        className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-xl text-muted transition-colors duration-150 hover:bg-canvas hover:text-ink active:bg-canvas"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={visible ? "hide" : "show"}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.12 }}
            className="flex"
          >
            {visible ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
          </motion.span>
        </AnimatePresence>
      </button>
    </div>
  );
}
