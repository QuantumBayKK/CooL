"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A split-flap readout for a figure that comes from the claim registry. It
 * cycles digits once when scrolled into view, then rests on the real value.
 * Reduced motion and no-JS both show the final value immediately.
 */
export function SplitFlapCounter({ value, label }: { value: string; label: string }) {
  const [display, setDisplay] = useState(value);
  const el = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const node = el.current!;
    let timer = 0;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e?.isIntersecting) return;
        io.disconnect();
        let n = 0;
        timer = window.setInterval(() => {
          n++;
          if (n > 10) {
            clearInterval(timer);
            setDisplay(value);
            return;
          }
          setDisplay(
            [...value]
              .map((c, i) => (/\d/.test(c) && n < 10 - i ? String((Number(c) + n * 3) % 10) : c))
              .join(""),
          );
        }, 60);
      },
      { threshold: 0.6 },
    );
    io.observe(node);
    return () => {
      io.disconnect();
      clearInterval(timer);
    };
  }, [value]);

  return (
    <div ref={el}>
      <div className="f-flap" aria-hidden="true">
        {[...display].map((c, i) => (
          <span key={i} className="f-flap__cell">
            {c}
          </span>
        ))}
      </div>
      <p className="f-sr">{value}</p>
      <p className="f-label" style={{ marginTop: 14 }}>
        {label}
      </p>
    </div>
  );
}
