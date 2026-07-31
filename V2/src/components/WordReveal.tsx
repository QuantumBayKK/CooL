"use client";

import { motion, useReducedMotion } from "framer-motion";
import { FLUID } from "@/components/ui";

export type WordSegment = { text: string; className?: string };

/**
 * Word-by-word entrance reveal — fires once when the slide arrives.
 * (Deck-appropriate replacement for scroll-scrubbed text.)
 */
export default function WordReveal({
  segments,
  className,
  stagger = 0.045,
}: {
  segments: WordSegment[];
  className?: string;
  stagger?: number;
}) {
  const reduced = useReducedMotion();
  const words = segments.flatMap((seg) =>
    seg.text.split(/\s+/).filter(Boolean).map((w) => ({ w, className: seg.className })),
  );

  if (reduced) {
    return (
      <p className={className}>
        {words.map((x, i) => (
          <span key={i} className={x.className}>
            {x.w}{" "}
          </span>
        ))}
      </p>
    );
  }

  return (
    <motion.p
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
      transition={{ staggerChildren: stagger }}
    >
      {words.map((x, i) => (
        <motion.span
          key={i}
          className={x.className}
          style={{ display: "inline-block", whiteSpace: "pre" }}
          variants={{
            hidden: { opacity: 0, y: 14, filter: "blur(6px)" },
            show: {
              opacity: 1,
              y: 0,
              filter: "blur(0px)",
              transition: { duration: 0.55, ease: FLUID },
            },
          }}
        >
          {x.w}{" "}
        </motion.span>
      ))}
    </motion.p>
  );
}
