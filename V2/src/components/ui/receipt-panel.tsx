"use client";

import { useEffect, useRef } from "react";
import { animate, stagger } from "animejs";
import { cn } from "@/lib/utils";
import { FLUID, prefersReduced } from "@/lib/motion";

export type ReceiptRow = { key: string; value: string };

/**
 * ReceiptPanel — the sealed record, drawn as the thing it actually is.
 *
 * A row of generic feature cards said "here are four features". A signed
 * receipt says "here is the artefact" — which is the whole point of the slide,
 * so the record is rendered as a monospace manifest with a seal stamped on it.
 *
 * anime.js deals the rows in from the left, then lands the stamp. One-shot, on
 * an IntersectionObserver, so it costs nothing after it has played.
 */
export function ReceiptPanel({
  rows,
  filename = "receipt.json",
  footer,
  className,
}: {
  rows: ReceiptRow[];
  filename?: string;
  footer?: string;
  className?: string;
}) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;

    const lines = Array.from(el.querySelectorAll<HTMLElement>("[data-row]"));
    const seal = el.querySelector<HTMLElement>("[data-seal]");

    const land = () => {
      for (const l of lines) {
        l.style.opacity = "1";
        l.style.transform = "none";
      }
      if (seal) {
        seal.style.opacity = "1";
        seal.style.transform = "none";
      }
    };

    if (prefersReduced()) {
      land();
      return;
    }

    let played = false;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting || played) continue;
          played = true;
          io.disconnect();

          animate(lines, {
            opacity: [0, 1],
            translateX: [-14, 0],
            duration: 620,
            ease: FLUID,
            delay: stagger(85),
          });

          if (seal) {
            animate(seal, {
              opacity: [0, 1],
              scale: [1.45, 1],
              rotate: [-9, 0],
              duration: 620,
              // lands just after the last row has settled
              delay: 85 * lines.length + 160,
              ease: "outBack",
            });
          }
        }
      },
      { rootMargin: "-10% 0px -10% 0px", threshold: 0.01 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={host}
      className={cn(
        "glass relative overflow-hidden rounded-2xl",
        // the accent spine — reads as the sealed edge of a document
        "before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:bg-gradient-to-b before:from-verify before:via-verify/40 before:to-transparent",
        className,
      )}
    >
      {/* header bar */}
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5 sm:px-5">
        <p className="flex items-center gap-2 font-mono text-[12px] text-mist">
          <span
            aria-hidden
            className="size-1.5 rounded-full bg-live shadow-[0_0_8px_rgba(63,185,80,0.8)]"
          />
          {filename}
        </p>
        <span
          data-seal
          className="rounded-full border border-live/45 bg-live/[0.10] px-2.5 py-1 font-mono text-[10px] font-semibold tracking-[0.18em] text-live uppercase"
          style={{ opacity: 0 }}
        >
          Sealed
        </span>
      </div>

      {/* the record itself */}
      <dl className="px-4 py-4 sm:px-5">
        {rows.map((r) => (
          <div
            key={r.key}
            data-row
            className="grid grid-cols-[5rem_1fr] items-baseline gap-3 border-b border-line/50 py-2.5 last:border-b-0 sm:grid-cols-[7rem_1fr]"
            style={{ opacity: 0 }}
          >
            <dt className="font-mono text-[12px] tracking-[0.08em] text-verify">
              {r.key}
            </dt>
            <dd className="text-[14px] leading-relaxed text-fog sm:text-[15px]">
              {r.value}
            </dd>
          </div>
        ))}
      </dl>

      {footer ? (
        <p className="border-t border-line px-4 py-2.5 font-mono text-[11px] text-mist sm:px-5">
          {footer}
        </p>
      ) : null}
    </div>
  );
}
