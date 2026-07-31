"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import clsx from "clsx";

export type Testimonial = {
  quote: string;
  name: string;
  role: string;
  company: string;
  initials: string;
  /** short label above the quote — e.g. the sector */
  tag?: string;
};

/**
 * TestimonialCarousel — profile cards on a horizontal rail.
 *
 * Performance approach, deliberately:
 *   · the rail is a native overflow-x scroller with CSS scroll-snap, so phones
 *     get real momentum scrolling handled entirely by the compositor;
 *   · the focus effect (centre card sharp, neighbours dimmed and shrunk) is an
 *     IntersectionObserver toggling one class, with the tween done by a CSS
 *     transition — no per-frame JavaScript anywhere;
 *   · mouse drag is synthesised only for fine pointers, where there is no
 *     native fling to inherit.
 * Net cost while idle: zero.
 */
export function TestimonialCarousel({
  items,
  className,
}: {
  items: Testimonial[];
  className?: string;
}) {
  const rail = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  /* which card is centred → drives the focus class and the dots */
  useEffect(() => {
    const root = rail.current;
    if (!root) return;
    const cards = Array.from(
      root.querySelectorAll<HTMLElement>("[data-card]"),
    );
    if (!cards.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const el = e.target as HTMLElement;
          const on = e.intersectionRatio > 0.6;
          el.classList.toggle("is-active", on);
          if (on) setActive(cards.indexOf(el));
        }
      },
      { root, threshold: [0, 0.6, 1] },
    );
    cards.forEach((c) => io.observe(c));
    return () => io.disconnect();
  }, [items.length]);

  /* end-stop state for the arrows — coalesced to one read per frame */
  useEffect(() => {
    const root = rail.current;
    if (!root) return;
    let queued = false;
    const read = () => {
      queued = false;
      setAtStart(root.scrollLeft < 8);
      setAtEnd(root.scrollLeft + root.clientWidth >= root.scrollWidth - 8);
    };
    const onScroll = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(read);
    };
    read();
    root.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      root.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [items.length]);

  const step = useCallback((dir: 1 | -1) => {
    const root = rail.current;
    if (!root) return;
    const card = root.querySelector<HTMLElement>("[data-card]");
    const by = card ? card.offsetWidth + 16 : root.clientWidth * 0.8;
    root.scrollBy({ left: by * dir, behavior: "smooth" });
  }, []);

  const jump = useCallback((i: number) => {
    const root = rail.current;
    if (!root) return;
    const cards = root.querySelectorAll<HTMLElement>("[data-card]");
    cards[i]?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, []);

  /* mouse drag — touch already has native momentum, so leave it alone */
  useEffect(() => {
    const root = rail.current;
    if (!root) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    let down = false;
    let startX = 0;
    let startLeft = 0;
    let moved = false;

    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      down = true;
      moved = false;
      startX = e.clientX;
      startLeft = root.scrollLeft;
      root.classList.add("is-dragging");
    };
    const onMove = (e: PointerEvent) => {
      if (!down) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 4) moved = true;
      root.scrollLeft = startLeft - dx;
    };
    const onUp = () => {
      if (!down) return;
      down = false;
      root.classList.remove("is-dragging");
    };
    // a drag must not also fire the link/button under the cursor
    const onClick = (e: MouseEvent) => {
      if (moved) {
        e.preventDefault();
        e.stopPropagation();
        moved = false;
      }
    };

    root.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerup", onUp);
    root.addEventListener("click", onClick, true);
    return () => {
      root.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      root.removeEventListener("click", onClick, true);
    };
  }, []);

  return (
    <div className={clsx("relative", className)}>
      <div
        ref={rail}
        role="region"
        aria-label="Testimonials"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") {
            e.preventDefault();
            step(1);
          }
          if (e.key === "ArrowLeft") {
            e.preventDefault();
            step(-1);
          }
        }}
        className={clsx(
          "carousel-rail no-scrollbar -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pt-2 pb-6",
          "outline-none focus-visible:ring-1 focus-visible:ring-verify/50",
        )}
      >
        {items.map((t, i) => (
          <article
            key={`${t.name}-${i}`}
            data-card
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${items.length}`}
            className={clsx(
              "carousel-card glass relative flex w-[84vw] shrink-0 snap-center flex-col rounded-2xl p-6",
              "sm:w-[420px]",
            )}
          >
            <span
              aria-hidden
              className="absolute inset-x-0 top-0 h-px bg-ink/20"
            />
            <Quote
              className="size-7 text-verify/70"
              strokeWidth={1.5}
              aria-hidden
            />
            {t.tag ? (
              <p className="mt-4 font-mono text-[10px] tracking-[0.22em] text-mist uppercase">
                {t.tag}
              </p>
            ) : null}
            <blockquote className="mt-3 flex-1 text-[16px] leading-relaxed text-fog sm:text-[17px]">
              {t.quote}
            </blockquote>
            <footer className="mt-6 flex items-center gap-3 border-t border-line pt-4">
              <span
                aria-hidden
                className="flex size-11 shrink-0 items-center justify-center rounded-full border border-verify/25 bg-verify/[0.08] font-mono text-[12px] font-semibold text-verify"
              >
                {t.initials}
              </span>
              <span className="min-w-0">
                <p className="font-mono text-[13px] font-semibold text-ink">
                  {t.name}
                </p>
                <p className="mt-0.5 text-[12px] leading-snug text-mist">
                  {t.role}
                  {t.company ? `, ${t.company}` : ""}
                </p>
              </span>
            </footer>
          </article>
        ))}
      </div>

      {/* controls */}
      <div className="mt-1 flex items-center justify-between gap-4">
        <div className="flex items-center gap-1.5" role="tablist">
          {items.map((t, i) => (
            <button
              key={`dot-${t.name}-${i}`}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-label={`Go to testimonial ${i + 1}`}
              onClick={() => jump(i)}
              className={clsx(
                "h-1.5 rounded-full transition-all duration-300",
                i === active
                  ? "w-6 bg-verify shadow-[0_0_10px_rgba(88,166,255,0.6)]"
                  : "w-1.5 bg-ink/25 hover:bg-ink/45",
              )}
            />
          ))}
        </div>

        <div className="hidden items-center gap-2 sm:flex">
          <RailButton
            label="Previous testimonial"
            onClick={() => step(-1)}
            disabled={atStart}
          >
            <ChevronLeft className="size-4" strokeWidth={2} />
          </RailButton>
          <RailButton
            label="Next testimonial"
            onClick={() => step(1)}
            disabled={atEnd}
          >
            <ChevronRight className="size-4" strokeWidth={2} />
          </RailButton>
        </div>
      </div>
    </div>
  );
}

function RailButton({
  children,
  label,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        "flex size-9 items-center justify-center rounded-full border border-line bg-panel/70 text-fog backdrop-blur-xl",
        "transition-all duration-300 hover:border-verify/45 hover:text-ink",
        "disabled:pointer-events-none disabled:opacity-30",
      )}
    >
      {children}
    </button>
  );
}
