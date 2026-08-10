"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * The sticky mobile call to action.
 *
 * A bar pinned to the bottom of the viewport below `lg`, carrying the two
 * actions that matter on every page: run the demo, or talk to us.
 *
 * ── the four rules it has to obey ──
 *
 * · **Not at the top of the page.** It appears after 620px of scroll. A CTA
 *   that is already covering content when the page loads competes with the
 *   hero's own buttons and reads as an ad. Appearing on scroll means it shows
 *   up for the reader who is still going.
 *
 * · **Never over the footer.** It hides once the footer is in view, because
 *   the footer is where the same links live in full. A floating bar that
 *   covers the thing it duplicates is pure obstruction.
 *
 * · **It must not cover content.** A fixed bar overlaps whatever is at the
 *   bottom of the document — most visibly the last line of the footer. The
 *   `body` gets bottom padding while the bar is mounted (see globals.css,
 *   `--sticky-cta-h`) rather than the bar being allowed to sit on top of text.
 *
 * · **Off inside the product and the private rooms.** The console, studio,
 *   verifier, investor room and admin have their own controls, and a marketing
 *   bar over an evidence surface is both noise and a credibility problem.
 *
 * `pb-[env(safe-area-inset-bottom)]` keeps it clear of the iOS home indicator,
 * which otherwise slices through the buttons on every notched iPhone.
 */

const HIDE_ON = [
  "/demo",
  "/console",
  "/studio",
  "/verify",
  "/pipeline",
  "/billboard",
  "/investor",
  "/admin",
  "/thank-you",
];

const SHOW_AFTER = 620;

export function StickyMobileCta() {
  const pathname = usePathname();
  const [shown, setShown] = useState(false);
  const [atFooter, setAtFooter] = useState(false);

  const suppressed = HIDE_ON.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  useEffect(() => {
    if (suppressed) return;

    const onScroll = () => setShown(window.scrollY > SHOW_AFTER);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    // The footer check is an observer rather than a scroll calculation: the
    // page height changes as the pinned trailer acts resolve, and any figure
    // derived from `document.body.scrollHeight` during that is stale by the
    // time it is used.
    const footer = document.querySelector("footer");
    let observer: IntersectionObserver | undefined;
    if (footer) {
      observer = new IntersectionObserver(
        ([entry]) => setAtFooter(Boolean(entry?.isIntersecting)),
        { rootMargin: "0px 0px -8% 0px" },
      );
      observer.observe(footer);
    }

    return () => {
      window.removeEventListener("scroll", onScroll);
      observer?.disconnect();
    };
  }, [suppressed]);

  const visible = !suppressed && shown && !atFooter;

  // Reserve the space only while the bar is actually up, so no page carries
  // dead padding at the bottom for a bar it never shows.
  useEffect(() => {
    document.body.classList.toggle("has-sticky-cta", visible);
    return () => document.body.classList.remove("has-sticky-cta");
  }, [visible]);

  if (suppressed) return null;

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-line bg-canvas/95 backdrop-blur-sm transition-[transform,opacity] duration-200 ease-[--ease-out] lg:hidden ${
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-full opacity-0"
      }`}
      // Hidden from assistive tech when off-screen: a translated-away element
      // is still in the accessibility tree and would be read out mid-page.
      aria-hidden={!visible}
    >
      <div className="flex items-center gap-2 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <Link
          href="/demo"
          className="flex-1 rounded-[--radius-sm] border border-line px-3 py-2.5 text-center text-sm font-medium text-ink"
          tabIndex={visible ? undefined : -1}
        >
          Run the demo
        </Link>
        <Link
          href="/contact"
          className="flex flex-1 items-center justify-center gap-1.5 rounded-[--radius-sm] bg-accent px-3 py-2.5 text-center text-sm font-medium text-on-accent"
          tabIndex={visible ? undefined : -1}
        >
          Talk to us
          <ArrowRight className="size-3.5" strokeWidth={2} />
        </Link>
      </div>
    </div>
  );
}
