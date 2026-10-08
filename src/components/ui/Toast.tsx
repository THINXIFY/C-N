"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Info } from "lucide-react";
import { useIsMobile } from "@/lib/use-media";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

interface ToastItem {
  id: number;
  message: string;
}
interface Ctx {
  toast: (message: string) => void;
}

const ToastContext = createContext<Ctx>({ toast: () => {} });
export const useToast = () => useContext(ToastContext);

const FLASH_KEY = "lf_flash";

/** Queue a toast that survives a full navigation (e.g. after login/logout redirects). */
export function flashToast(message: string) {
  try {
    sessionStorage.setItem(FLASH_KEY, message);
  } catch {}
  window.dispatchEvent(new Event(FLASH_KEY));
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const mobile = useIsMobile();

  const toast = useCallback((message: string) => {
    const id = Date.now() + Math.random();
    setItems((cur) => [...cur.slice(-2), { id, message }]);
    setTimeout(() => setItems((cur) => cur.filter((t) => t.id !== id)), 3200);
  }, []);

  useEffect(() => {
    const consume = () => {
      try {
        const msg = sessionStorage.getItem(FLASH_KEY);
        if (msg) {
          sessionStorage.removeItem(FLASH_KEY);
          toast(msg);
        }
      } catch {}
    };
    queueMicrotask(consume);
    window.addEventListener(FLASH_KEY, consume);
    return () => window.removeEventListener(FLASH_KEY, consume);
  }, [toast]);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 top-[calc(env(safe-area-inset-top)+0.75rem)] z-[100] flex flex-col items-center gap-2 px-4 sm:inset-x-0 sm:bottom-6 sm:top-auto"
      >
        <AnimatePresence>
          {items.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: mobile ? -10 : 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: mobile ? -8 : 8 }}
              transition={{ duration: 0.2, ease: [0.22, 0.61, 0.36, 1] }}
              className="pointer-events-auto flex max-w-[min(92vw,420px)] items-center gap-2.5 rounded-xl bg-ink px-4 py-3 text-sm text-white shadow-lg"
            >
              {t.message.toLowerCase().includes("signed") ? (
                <CheckCircle2 className="h-4 w-4 text-brand" />
              ) : (
                <Info className="h-4 w-4 text-brand" />
              )}
              {t.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
