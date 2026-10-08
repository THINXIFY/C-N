"use client";

import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";

/** Applies prefers-reduced-motion to every Framer Motion animation (transforms are dropped, opacity stays). */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
