"use client";

/**
 * The thumb bar.
 *
 * On a phone the most valuable real estate is the bottom 120px, because that is
 * where the thumb already is. A CTA that only exists in the hero is a CTA that
 * stops existing the moment someone starts reading — and on a long page that is
 * most of the visit.
 *
 * Three details that make it behave rather than nag:
 *
 *   - It appears only after the hero's own buttons have scrolled away, so the
 *     first screen is never showing the same action twice.
 *   - It hides again over the contact section, where there are already bigger
 *     versions of both actions. Floating a duplicate over the real thing is how
 *     these end up feeling like an ad.
 *   - `env(safe-area-inset-bottom)` keeps it clear of the iPhone home indicator,
 *     which otherwise swallows the bottom ~34px and half the tap target with it.
 *
 * Desktop never sees it: there is no thumb, the header CTA is always in view,
 * and a docked bar there is just a bar.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarClock } from "lucide-react";
import { CONTACT } from "@/lib/contact";

export function StickyCta() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const hero = document.querySelector("#hero-actions");
    const contact = document.querySelector("#contact");
    if (!hero) return;

    // Two observers, one piece of state: visible once the hero actions are gone
    // AND the contact block is not on screen.
    let heroGone = false;
    let atContact = false;
    const sync = () => setShow(heroGone && !atContact);

    const heroWatcher = new IntersectionObserver(
      ([entry]) => {
        heroGone = !entry?.isIntersecting;
        sync();
      },
      { rootMargin: "-8px 0px 0px 0px" },
    );
    heroWatcher.observe(hero);

    const contactWatcher = contact
      ? new IntersectionObserver(
          ([entry]) => {
            atContact = Boolean(entry?.isIntersecting);
            sync();
          },
          { rootMargin: "0px 0px -35% 0px" },
        )
      : null;
    if (contact && contactWatcher) contactWatcher.observe(contact);

    return () => {
      heroWatcher.disconnect();
      contactWatcher?.disconnect();
    };
  }, []);

  return (
    <div
      aria-hidden={!show}
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-line bg-void/95 backdrop-blur-lg transition-transform duration-300 md:hidden ${
        show ? "translate-y-0" : "translate-y-full"
      }`}
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 10px)" }}
    >
      <div className="flex items-center gap-2 px-4 pt-2.5">
        <Link
          href="/demo"
          tabIndex={show ? undefined : -1}
          className="flex min-h-[48px] flex-[2] items-center justify-center gap-2 rounded-xl bg-verify px-4 text-[15px] font-semibold text-[#06121f] active:brightness-95"
        >
          See it work
          <ArrowRight className="size-4" strokeWidth={2.4} />
        </Link>
        <a
          href={CONTACT.booking}
          target="_blank"
          rel="noreferrer"
          tabIndex={show ? undefined : -1}
          className="flex min-h-[48px] flex-1 items-center justify-center gap-1.5 rounded-xl border border-line-strong px-3 text-[14px] font-medium text-ink active:bg-panel"
        >
          <CalendarClock className="size-4" strokeWidth={2} />
          Call
        </a>
      </div>
    </div>
  );
}
