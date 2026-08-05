"use client";

import { motion, useScroll, useSpring } from "framer-motion";
import { useEffect, useState } from "react";
import Link from "next/link";
import Magnetic from "@/components/Magnetic";

/*
 * REMOVED: `INVEST_MAILTO`, a second copy of the same investor mailto whose
 * subject named the round. Nothing imported it once the keynote stopped doing
 * so, but it still shipped: Nav is a client component, so the literal sat in
 * the shared chunk that /deck loads. The gated keynote now takes this string
 * from content/investors-restricted.ts, as a prop, on an authorised request.
 * See the matching note in lib/contact.ts.
 */
/* booking goes to Cal.com — one tap from a phone, no email app dance */
export const MEETING_URL = "https://cal.com/coolnwc";
export const MEETING_MAILTO = MEETING_URL;
/* kept for older sections that still import it */
export const DECK_MAILTO = MEETING_MAILTO;

const LINKS = [
  { label: "Problem", href: "#problem" },
  { label: "Solution", href: "#solution" },
  { label: "Proof", href: "#proof" },
  { label: "Market", href: "#market" },
  { label: "Team", href: "#team" },
  { label: "Ask", href: "#ask" },
];

/* Pages rather than deck anchors — the long read and the two product surfaces.
   Reachable from anywhere, because a reader who wants the argument in full or
   wants to see the thing working should never have to go back to the top. */
const PRODUCT_LINKS = [
  { label: "Why", href: "/why" },
  { label: "Demo", href: "/demo" },
  { label: "Pipeline", href: "/pipeline" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "Studio", href: "/studio" },
  { label: "SDK", href: "/sdk" },
];

export default function Nav() {
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 90, damping: 24 });
  const [active, setActive] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  // track which section is in view → highlight its tab
  useEffect(() => {
    const ids = LINKS.map((l) => l.href.slice(1));
    const els = ids
      .map((id) => document.getElementById(id))
      .filter((e): e is HTMLElement => !!e);
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(`#${e.target.id}`);
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // the tile sits under the hovered tab, or the active one at rest
  const tile = hovered ?? active;

  return (
    <>
      {/* top-edge scroll progress */}
      <motion.div
        className="fixed inset-x-0 top-0 z-[51] h-[2px] origin-left bg-gradient-to-r from-verify-deep via-verify to-verify"
        style={{ scaleX: progress }}
      />

      <header className="fixed inset-x-0 top-[calc(0.7rem+env(safe-area-inset-top))] z-50 flex justify-center px-3">
        <div className="glass-strong flex items-center gap-1.5 rounded-full py-1.5 pr-1.5 pl-3 shadow-[0_10px_34px_rgba(0,0,0,0.45)] sm:gap-2 sm:pl-4">
          {/* brand */}
          <a href="#cover" className="flex items-baseline gap-1.5 pr-1">
            <span className="display text-lg leading-none text-ink">CooL</span>
            <span className="inline-block size-1.5 bg-verify" aria-hidden />
          </a>

          {/* island tabs — magic tile glides under hover / active */}
          <nav
            className="relative hidden items-center rounded-full lg:flex"
            onMouseLeave={() => setHovered(null)}
            aria-label="Primary"
          >
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onMouseEnter={() => setHovered(l.href)}
                onFocus={() => setHovered(l.href)}
                onBlur={() => setHovered(null)}
                aria-current={active === l.href ? "true" : undefined}
                className={`relative rounded-full px-3.5 py-1.5 font-mono text-[11px] tracking-wide transition-colors ${
                  active === l.href ? "text-ink" : "text-mist hover:text-ink"
                }`}
              >
                {tile === l.href && (
                  <motion.span
                    layoutId="nav-tile"
                    className="absolute inset-0 rounded-full bg-ink/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                    transition={{ type: "spring", stiffness: 440, damping: 34 }}
                  />
                )}
                <span className="relative z-10">{l.label}</span>
              </a>
            ))}
          </nav>

          <span className="mx-0.5 hidden h-5 w-px bg-line lg:block" aria-hidden />

          {/* the working product — the most persuasive thing we have, so it is
              reachable from every slide rather than only from the proof one */}
          <nav className="hidden items-center lg:flex" aria-label="Product">
            {PRODUCT_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                prefetch
                className="rounded-full px-3 py-1.5 font-mono text-[11px] tracking-wide text-mist transition-colors hover:text-ink"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <span className="mx-0.5 hidden h-5 w-px bg-line lg:block" aria-hidden />

          {/* the one action in the bar — its own page, not an anchor: the
              investor keynote is a different room, entered deliberately */}
          <Magnetic>
            <Link
              href="/investors"
              prefetch
              className="group relative block overflow-hidden rounded-full bg-verify-deep px-4 py-1.5 font-mono text-[11px] tracking-wide text-white shadow-[0_0_18px_rgba(9,105,218,0.4)] transition-shadow hover:shadow-[0_0_26px_rgba(9,105,218,0.7)]"
            >
              <span aria-hidden className="sheen absolute inset-0 rounded-full" />
              <span className="relative z-10">Investors</span>
            </Link>
          </Magnetic>
        </div>
      </header>
    </>
  );
}
