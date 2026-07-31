"use client";

import { useRef, useState, type ReactNode, type PointerEvent } from "react";
import clsx from "clsx";

/**
 * Horizontal showcase scroller — swipe on phone, drag on desktop, snap
 * alignment, faded edges. For showcasing multiple things in one row.
 */
export default function Scroller({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const drag = useRef({ startX: 0, startScroll: 0, moved: false });

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "touch") return; // native momentum on touch
    const el = ref.current;
    if (!el) return;
    drag.current = { startX: e.clientX, startScroll: el.scrollLeft, moved: false };
    setDragging(true);
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!dragging || !ref.current) return;
    const dx = e.clientX - drag.current.startX;
    if (Math.abs(dx) > 4) drag.current.moved = true;
    ref.current.scrollLeft = drag.current.startScroll - dx;
  };
  const stop = () => setDragging(false);

  return (
    <div
      ref={ref}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={stop}
      onPointerLeave={stop}
      className={clsx(
        "no-scrollbar edge-fade flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2",
        dragging ? "cursor-grabbing snap-none" : "cursor-grab",
        className,
      )}
    >
      {children}
    </div>
  );
}
