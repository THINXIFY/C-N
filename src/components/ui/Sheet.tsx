"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { useIsMobile } from "@/lib/use-media";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  side?: "right" | "left";
  children: ReactNode;
  className?: string;
  hideHeader?: boolean;
}

const EASE = [0.22, 0.61, 0.36, 1] as const;

/**
 * Slide-over dialog: the transaction detail panel (right) and the mobile nav drawer (left).
 * On phones a right-hand sheet becomes a bottom sheet (rounded top, drag-handle look, safe-area padding,
 * dynamic-viewport max height so it never exceeds the visible screen).
 */
export function Sheet({ open, onClose, title, side = "right", children, className = "max-w-[420px]", hideHeader }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const mobile = useIsMobile();
  const bottom = mobile && side === "right";

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && panelRef.current) {
        const f = panelRef.current.querySelectorAll<HTMLElement>(
          'a[href],button:not([disabled]),input,[tabindex]:not([tabindex="-1"])',
        );
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      prev?.focus();
    };
  }, [open, onClose]);

  const x = side === "right" ? 32 : -32;
  const hidden = bottom ? { opacity: 0, y: 48 } : { opacity: 0, x };
  const shown = bottom ? { opacity: 1, y: 0 } : { opacity: 1, x: 0 };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80]">
          <motion.div
            className="absolute inset-0 bg-ink/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            tabIndex={-1}
            initial={hidden}
            animate={shown}
            exit={hidden}
            transition={{ duration: 0.24, ease: EASE }}
            className={cn(
              "absolute flex w-full flex-col bg-white shadow-xl outline-none",
              bottom
                ? "inset-x-0 bottom-0 max-h-[88dvh] rounded-t-2xl border-t border-line"
                : cn(
                    "top-0 h-full",
                    side === "right" ? "right-0 border-l border-line" : "left-0 border-r border-line",
                    className,
                  ),
            )}
          >
            {bottom && <span aria-hidden="true" className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-line" />}
            {!hideHeader && (
              <div className="flex shrink-0 items-center justify-between border-b border-line px-5 py-3 sm:px-6 sm:py-4">
                <h2 className="text-lg font-semibold">{title}</h2>
                <button
                  onClick={onClose}
                  aria-label="Close"
                  className="-mr-2 flex h-11 w-11 items-center justify-center rounded-xl text-muted transition-colors hover:bg-canvas hover:text-ink active:bg-canvas"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            )}
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
