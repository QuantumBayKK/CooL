"use client";

import { useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import { FLUID } from "@/components/ui";

/**
 * 3D card carousel — cards live on a shallow arc in z-space; swipe or tap
 * to bring one forward. The active card's detail renders beneath.
 */
export default function Carousel3D({
  items,
  height = 190,
  renderDetail,
}: {
  items: { key: string; card: ReactNode; detail?: ReactNode }[];
  height?: number;
  renderDetail?: boolean;
}) {
  const [index, setIndex] = useState(0);
  const n = items.length;
  const clamp = (i: number) => Math.max(0, Math.min(n - 1, i));

  return (
    <div>
      <div
        className="relative w-full overflow-visible"
        style={{ height, perspective: 1100 }}
      >
        {items.map((it, i) => {
          const off = i - index;
          const abs = Math.abs(off);
          return (
            <motion.div
              key={it.key}
              className={clsx(
                "absolute top-0 left-1/2 w-[80%] max-w-sm",
                off !== 0 && "cursor-pointer",
              )}
              style={{ transformStyle: "preserve-3d" }}
              animate={{
                x: `calc(-50% + ${off * 66}%)`,
                z: -abs * 120,
                rotateY: off * -16,
                scale: 1 - abs * 0.07,
                opacity: abs > 2 ? 0 : 1 - abs * 0.28,
              }}
              transition={{ duration: 0.65, ease: FLUID }}
              onClick={() => off !== 0 && setIndex(i)}
            >
              <div style={{ height }} className="[&>*]:h-full">
                {it.card}
              </div>
            </motion.div>
          );
        })}
        {/* swipe surface */}
        <motion.div
          className="absolute inset-0 z-10"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.08}
          onDragEnd={(_, info) => {
            if (info.offset.x < -48 || info.velocity.x < -420) setIndex((i) => clamp(i + 1));
            else if (info.offset.x > 48 || info.velocity.x > 420) setIndex((i) => clamp(i - 1));
          }}
          style={{ touchAction: "pan-y" }}
        />
      </div>

      {/* dots */}
      <div className="mt-4 flex justify-center gap-2">
        {items.map((it, i) => (
          <button
            key={it.key}
            type="button"
            aria-label={`Card ${i + 1}`}
            onClick={() => setIndex(i)}
            className={clsx(
              "h-1.5 rounded-full transition-all duration-300",
              i === index ? "w-6 bg-verify" : "w-1.5 bg-ink/20",
            )}
          />
        ))}
      </div>

      {renderDetail && (
        <AnimatePresence mode="wait">
          <motion.div
            key={items[index]?.key}
            initial={{ opacity: 0, y: 14, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
            transition={{ duration: 0.45, ease: FLUID }}
            className="mt-5"
          >
            {items[index]?.detail}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
