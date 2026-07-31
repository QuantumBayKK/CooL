"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { FLUID } from "@/components/ui";

/**
 * Apple-style glass stack: cards arrive as one deck, then fan into a
 * loosely-shuffled stack. Hover/tap lifts a card straight.
 */
export default function GlassStack({
  items,
}: {
  items: { key: string; node: ReactNode }[];
}) {
  const reduced = useReducedMotion();
  const mid = (items.length - 1) / 2;
  return (
    <div className="relative">
      {items.map((it, i) => (
        <motion.div
          key={it.key}
          className="glass-strong relative rounded-2xl p-4 shadow-[0_18px_40px_rgba(0,0,0,0.45)] [&:not(:first-child)]:-mt-8"
          style={{ zIndex: i + 1 }}
          initial={
            reduced ? false : { y: 56, opacity: 0, rotate: 0, filter: "blur(6px)" }
          }
          whileInView={{
            y: 0,
            opacity: 1,
            rotate: (i - mid) * 1.4,
            filter: "blur(0px)",
          }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.8, delay: i * 0.09, ease: FLUID }}
          whileHover={{ y: -10, rotate: 0, zIndex: 20 }}
          whileTap={{ y: -10, rotate: 0, zIndex: 20 }}
        >
          {it.node}
        </motion.div>
      ))}
    </div>
  );
}
