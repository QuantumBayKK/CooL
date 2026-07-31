"use client";

import type { ReactNode } from "react";
import { ServiceCard } from "./service-card";
import { Reveal } from "./reveal";

/**
 * ScannerCardStream — a row of cards each crossed by a slow scan line.
 *
 * The scan is a CSS animation (`scan-y`) rather than a JS loop: four cards
 * animating forever on the main thread is exactly the kind of thing that makes
 * a phone drop frames while you scroll past.
 */
export function ScannerCardStream({
  items,
}: {
  items: { title: string; description: string; icon?: ReactNode }[];
}) {
  return (
    <Reveal stagger={70} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item, i) => (
        <div key={item.title} className="relative">
          <ServiceCard
            title={item.title}
            description={item.description}
            icon={item.icon}
            className="min-h-48"
          />
          <span
            aria-hidden
            className="scan-y pointer-events-none absolute inset-x-0 top-0 h-16 rounded-t-2xl bg-[linear-gradient(180deg,rgba(88,166,255,0.16),transparent)]"
            style={{ animationDelay: `${i * 0.55}s` }}
          />
        </div>
      ))}
    </Reveal>
  );
}
