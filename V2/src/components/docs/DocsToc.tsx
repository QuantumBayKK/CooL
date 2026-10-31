"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * "On this page" rail with scroll-spy: the heading nearest the top of the
 * viewport is marked active, so the rail doubles as a progress indicator.
 */
export function DocsToc({ headings }: { headings: { id: string; text: string; level: 2 | 3 }[] }) {
  const [active, setActive] = useState(headings[0]?.id ?? "");

  useEffect(() => {
    const els = headings.map((h) => document.getElementById(h.id)).filter((el): el is HTMLElement => !!el);
    if (!els.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-80px 0px -70% 0px" },
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [headings]);

  if (headings.length < 2) return null;

  return (
    <nav className="docs-toc" aria-label="On this page">
      <p className="docs-toc-title">On this page</p>
      <ul>
        {headings.map((h) => (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              className={cn(h.level === 3 && "is-sub", active === h.id && "is-active")}
              aria-current={active === h.id ? "location" : undefined}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
      <a href="#top" className="docs-toc-top">Back to top ↑</a>
    </nav>
  );
}
