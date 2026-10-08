"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Subtle fade + rise for blocks inside a page. `index` staggers siblings.
 * index 0 renders plainly: the route-level template already fades the whole page in.
 */
export function Reveal({ children, index = 0, className }: { children: ReactNode; index?: number; className?: string }) {
  if (index === 0) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, delay: (index - 1) * 0.04, ease: [0.22, 0.61, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
