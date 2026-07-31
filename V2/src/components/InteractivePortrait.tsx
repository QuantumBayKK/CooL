"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useMotionTemplate,
} from "framer-motion";
import clsx from "clsx";

/**
 * Interactive portrait: a desaturated duotone base with the full-colour
 * photo revealed on top through a fluid lens that follows the cursor
 * (tap-and-drag on touch). Falls back to initials until the photo exists.
 */
export default function InteractivePortrait({
  src,
  alt,
  initials,
  className,
}: {
  src: string;
  alt: string;
  initials: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [ok, setOk] = useState<boolean | null>(null);

  // The static HTML ships the <img> before React hydrates, so a load/error
  // that happens pre-hydration never fires the handlers. Inspect the DOM
  // state on mount and settle it explicitly.
  useEffect(() => {
    const img = imgRef.current;
    if (img?.complete) setOk(img.naturalWidth > 0);
  }, [src]);

  const mx = useSpring(useMotionValue(-200), { stiffness: 220, damping: 26 });
  const my = useSpring(useMotionValue(-200), { stiffness: 220, damping: 26 });
  const r = useSpring(useMotionValue(0), { stiffness: 160, damping: 22 });
  const rx = useSpring(useMotionValue(0), { stiffness: 120, damping: 18 });
  const ry = useSpring(useMotionValue(0), { stiffness: 120, damping: 18 });

  const clip = useMotionTemplate`circle(${r}px at ${mx}px ${my}px)`;

  const move = (e: PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    mx.set(x);
    my.set(y);
    r.set(86);
    ry.set(((x / rect.width) - 0.5) * 10);
    rx.set(((y / rect.height) - 0.5) * -8);
  };
  const leave = () => {
    r.set(0);
    rx.set(0);
    ry.set(0);
  };

  if (ok === false) {
    return (
      <div
        className={clsx(
          "flex items-center justify-center bg-gradient-to-br from-ink/6 to-transparent",
          className,
        )}
      >
        <span className="display text-5xl text-ink/20">{initials}</span>
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      onPointerMove={move}
      /* A tap opens the lens on touch. Without this the effect needed a
         drag to appear at all, so on a phone it read as a plain grey photo —
         the interaction existed but was undiscoverable. */
      onPointerDown={move}
      onPointerUp={leave}
      onPointerLeave={leave}
      onPointerCancel={leave}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 800 }}
      className={clsx("relative touch-pan-y overflow-hidden", className)}
    >
      {/* duotone base */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        onLoad={() => setOk(true)}
        onError={() => setOk(false)}
        className="h-full w-full object-cover opacity-80 brightness-[0.72] contrast-[1.08] grayscale"
        draggable={false}
      />
      {/* full colour, revealed through the lens */}
      <motion.div className="absolute inset-0" style={{ clipPath: clip }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt=""
          aria-hidden
          className="h-full w-full object-cover"
          draggable={false}
        />
      </motion.div>
      <p className="pointer-events-none absolute right-2 bottom-2 font-mono text-[9px] tracking-[0.2em] text-white/70 uppercase drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]">
        hover / touch
      </p>
    </motion.div>
  );
}
