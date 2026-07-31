"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * A horizontal rail of quote cards.
 *
 * Native overflow scrolling with CSS snap, deliberately: on a phone the
 * compositor then owns the gesture — momentum, rubber-banding and all — and the
 * main thread does nothing. A JS carousel here would fight the touch handler
 * and stutter on exactly the devices most people will read this on.
 *
 * `overscroll-behavior-x: contain` stops a horizontal flick at the end of the
 * rail from chaining into the page's own scroll, which on a snapping deck would
 * otherwise fling the reader to the next slide mid-quote.
 */

export interface Quote {
  readonly quote: string;
  readonly name: string;
  readonly role: string;
  readonly tag: string;
}

export default function TestimonialRail({ quotes }: { quotes: readonly Quote[] }) {
  const rail = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const sync = useCallback(() => {
    const el = rail.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setAtStart(scrollLeft <= 4);
    setAtEnd(scrollLeft + clientWidth >= scrollWidth - 4);
    // which card is nearest the left edge
    const card = el.firstElementChild as HTMLElement | null;
    if (card) {
      const step = card.offsetWidth + 12;
      setActive(Math.round(scrollLeft / step));
    }
  }, []);

  useEffect(() => {
    const el = rail.current;
    if (!el) return;
    sync();
    el.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync, { passive: true });
    return () => {
      el.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, [sync]);

  const nudge = useCallback((dir: 1 | -1) => {
    const el = rail.current;
    if (!el) return;
    const card = el.firstElementChild as HTMLElement | null;
    const step = card ? card.offsetWidth + 12 : el.clientWidth * 0.8;
    el.scrollBy({ left: step * dir, behavior: "smooth" });
  }, []);

  return (
    <div className="relative w-full">
      <div
        ref={rail}
        className="no-scrollbar edge-fade -mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-1 sm:mx-0 sm:px-0"
        style={{ overscrollBehaviorX: "contain" }}
      >
        {quotes.map((q) => (
          <figure
            key={q.name}
            className="frost flex w-[268px] shrink-0 snap-start flex-col rounded-2xl border border-line px-4 py-4 text-left sm:w-[300px]"
          >
            <span className="font-mono text-[9.5px] tracking-[0.16em] text-verify uppercase">
              {q.tag}
            </span>
            <blockquote className="mt-2 flex-1 text-[13px] leading-relaxed text-fog">
              &ldquo;{q.quote}&rdquo;
            </blockquote>
            <figcaption className="mt-3 border-t border-line pt-2.5">
              <p className="font-mono text-[12px] font-semibold text-ink">{q.name}</p>
              <p className="mt-0.5 text-[11.5px] leading-snug text-mist">{q.role}</p>
            </figcaption>
          </figure>
        ))}
      </div>

      {/* controls — pointer devices only; touch just swipes */}
      <div className="mt-3 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => nudge(-1)}
          disabled={atStart}
          aria-label="Previous quote"
          className="hidden size-7 items-center justify-center rounded-full border border-line text-mist transition-colors hover:border-verify/40 hover:text-ink disabled:opacity-30 sm:flex"
        >
          <ChevronLeft className="size-3.5" />
        </button>

        <div className="flex items-center gap-1.5" aria-hidden>
          {quotes.map((q, i) => (
            <span
              key={q.name}
              className={clsx(
                "rounded-full transition-all duration-300",
                i === active ? "h-1.5 w-4 bg-verify" : "size-1.5 bg-ink/25",
              )}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => nudge(1)}
          disabled={atEnd}
          aria-label="Next quote"
          className="hidden size-7 items-center justify-center rounded-full border border-line text-mist transition-colors hover:border-verify/40 hover:text-ink disabled:opacity-30 sm:flex"
        >
          <ChevronRight className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
