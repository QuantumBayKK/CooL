"use client";

import { useRef, type ReactNode, type PointerEvent } from "react";
import { motion, useMotionValue, useSpring, useMotionTemplate } from "framer-motion";
import clsx from "clsx";

/**
 * Magic 3D lift — the card tilts toward the cursor and rises off the page,
 * its shadow deepening beneath it. Springs, never snaps. On touch, a press
 * gives a brief lift instead.
 */
export default function Lift3D({
  children,
  className,
  tilt = 7,
  lift = 1.025,
}: {
  children: ReactNode;
  className?: string;
  /** max tilt in degrees */
  tilt?: number;
  /** scale when lifted */
  lift?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const rx = useSpring(useMotionValue(0), { stiffness: 180, damping: 18 });
  const ry = useSpring(useMotionValue(0), { stiffness: 180, damping: 18 });
  const s = useSpring(useMotionValue(1), { stiffness: 220, damping: 20 });
  const elev = useSpring(useMotionValue(0), { stiffness: 200, damping: 22 });

  const shadow = useMotionTemplate`0 ${elev}px ${elev}px -8px rgba(0,0,0,0.55)`;

  const move = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse") return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    ry.set(px * tilt);
    rx.set(-py * tilt);
    s.set(lift);
    elev.set(26);
  };
  const settle = () => {
    rx.set(0);
    ry.set(0);
    s.set(1);
    elev.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onPointerMove={move}
      onPointerLeave={settle}
      whileTap={{ scale: lift }}
      style={{
        rotateX: rx,
        rotateY: ry,
        scale: s,
        boxShadow: shadow,
        transformPerspective: 900,
      }}
      className={clsx("rounded-2xl will-change-transform", className)}
    >
      {children}
    </motion.div>
  );
}
