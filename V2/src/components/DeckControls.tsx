"use client";

import { useCallback, useEffect, useState } from "react";
import clsx from "clsx";

/**
 * Deck navigation: live slide counter, prev/next chevrons, arrow-key paging.
 * The snap scroll does the physics; this gives it presentation controls.
 *
 * The slide count is read from the DOM rather than hard-coded. It used to be a
 * literal, which silently went stale the moment a slide was added to the deck —
 * the pager then disabled "next" one slide early and End jumped to the
 * second-to-last slide.
 */
export default function DeckControls() {
  const [active, setActive] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-slide]"));
    setTotal(els.length);
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            const no = parseInt(e.target.getAttribute("data-slide") ?? "1", 10);
            setActive(no - 1);
          }
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const go = useCallback(
    (index: number) => {
      if (total === 0) return;
      const clamped = Math.max(0, Math.min(total - 1, index));
      const el = document.querySelector<HTMLElement>(
        `[data-slide="${String(clamped + 1).padStart(2, "0")}"]`,
      );
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [total],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable))
        return;
      if (e.key === "ArrowDown" || e.key === "PageDown") {
        e.preventDefault();
        go(active + 1);
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        go(active - 1);
      } else if (e.key === "Home") {
        e.preventDefault();
        go(0);
      } else if (e.key === "End") {
        e.preventDefault();
        go(total - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, go, total]);

  return (
    <>
      {/* chevrons — phone gets them too; paging affordance matters most there */}
      <div className="fixed right-4 bottom-[calc(1.25rem+env(safe-area-inset-bottom))] z-40 flex flex-col gap-1.5 sm:right-5">
        {[
          { label: "Previous slide", dir: -1, glyph: "↑", disabled: active === 0 },
          {
            label: "Next slide",
            dir: 1,
            glyph: "↓",
            disabled: total > 0 && active === total - 1,
          },
        ].map((b) => (
          <button
            key={b.label}
            type="button"
            aria-label={b.label}
            disabled={b.disabled}
            onClick={() => go(active + b.dir)}
            className={clsx(
              "glass-strong flex size-9 items-center justify-center rounded-full font-mono text-sm text-fog transition-all",
              b.disabled
                ? "opacity-30"
                : "hover:border-verify/50 hover:text-verify hover:shadow-[0_0_16px_rgba(88,166,255,0.25)]",
            )}
          >
            {b.glyph}
          </button>
        ))}
      </div>
    </>
  );
}
