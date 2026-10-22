"use client";

import { useEffect, useRef } from "react";

/**
 * Fades its children in when they enter the viewport. Content is visible by
 * default; the hidden start state only applies once JS has added `is-js` to
 * the root, so nothing is lost without JavaScript.
 */
export function Reveal({
  children,
  className = "",
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "li" | "section";
}) {
  const el = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = el.current;
    if (!node) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) {
          node.classList.add("is-in");
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);
  return (
    <Tag ref={el as never} className={`f-reveal ${className}`}>
      {children}
    </Tag>
  );
}
