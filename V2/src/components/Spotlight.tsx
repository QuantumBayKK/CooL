"use client";

import { useRef, type ReactNode, type PointerEvent } from "react";
import clsx from "clsx";

/**
 * Spotlight card — a soft radial highlight tracks the cursor across the
 * glass surface. Pure CSS variables; zero re-renders.
 */
export default function Spotlight({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const move = (e: PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || e.pointerType !== "mouse") return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--spot-x", `${e.clientX - r.left}px`);
    el.style.setProperty("--spot-y", `${e.clientY - r.top}px`);
    el.style.setProperty("--spot-o", "1");
  };
  const leave = () => {
    ref.current?.style.setProperty("--spot-o", "0");
  };

  return (
    <div
      ref={ref}
      onPointerMove={move}
      onPointerLeave={leave}
      className={clsx("group relative overflow-hidden", className)}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{
          opacity: "var(--spot-o, 0)",
          background:
            "radial-gradient(240px circle at var(--spot-x, 50%) var(--spot-y, 50%), rgba(88,166,255,0.10), transparent 65%)",
        }}
      />
      {children}
    </div>
  );
}
