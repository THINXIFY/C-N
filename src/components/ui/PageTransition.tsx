"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

/** Route-level fade (used by template.tsx): only the main content moves; sidebar and header stay put. */
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.22, 0.61, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
