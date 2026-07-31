"use client";

import { useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import clsx from "clsx";
import type { ReactNode } from "react";

/**
 * Eye-follow CTA — the pupil tracks the cursor. Observability as a
 * micro-interaction: the button that watches back.
 */
export default function EyeButton({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const x = useSpring(useMotionValue(0), { stiffness: 180, damping: 16 });
  const y = useSpring(useMotionValue(0), { stiffness: 180, damping: 16 });

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      const d = Math.hypot(dx, dy) || 1;
      const m = Math.min(d / 60, 1) * 2.6;
      x.set((dx / d) * m);
      y.set((dy / d) * m);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [x, y]);

  return (
    <a ref={ref} href={href} className={clsx("inline-flex items-center justify-center gap-2.5", className)}>
      <span className="eye-blink relative inline-flex size-[18px] items-center justify-center overflow-hidden rounded-full border border-ink/20 bg-white">
        <motion.span
          className="absolute size-[9px] rounded-full bg-[#0a0c10]"
          style={{ x, y }}
        />
      </span>
      {children}
    </a>
  );
}
