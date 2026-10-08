"use client";

import { useSyncExternalStore } from "react";

/** SSR-safe media query hook (false on the server, correct after hydration). */
export function useMedia(query: string): boolean {
  return useSyncExternalStore(
    (notify) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", notify);
      return () => mq.removeEventListener("change", notify);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

export const useIsMobile = () => useMedia("(max-width: 639px)");
