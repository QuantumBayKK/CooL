/**
 * The top nav.
 *
 * Five items, no hamburger, no JavaScript. A menu button that hides four links
 * behind a tap is worse than four links that scroll — on a phone the row simply
 * scrolls sideways inside its own bar, which costs nothing and hides nothing.
 *
 * Investors is deliberately absent. It is one gated link inside the Explore
 * section at the bottom, which is where someone who wants it will look, and
 * keeping it out of the public nav stops a buyer's first impression being that
 * this is a company looking for money rather than customers.
 *
 * The presentation lives in globals.css under `.essay-nav`. It used to be eight
 * inline style objects here; the shape is unchanged, but a sticky bar's
 * geometry is a system decision and it is now written where the rest of the
 * system is.
 */
import Link from "next/link";
import { CONTACT } from "@/lib/contact";

const LINKS = [
  { href: "#solution", label: "Product" },
  { href: "#technology", label: "Technology" },
  { href: "#market", label: "Market" },
  { href: "#team", label: "Team" },
];

export function EssayNav() {
  return (
    <div className="essay-nav">
      <nav aria-label="Main" className="essay-nav__bar">
        <Link href="#cover" className="essay-nav__brand">
          CooL
        </Link>

        {/* Section links are for pointing devices. On a phone they pushed the
            CTA half off the edge, and a jump-link is worth very little on a
            page you reach by scrolling anyway — so below 640px the row is the
            wordmark and the one action, both fully visible. */}
        {LINKS.map((link) => (
          <Link key={link.href} href={link.href} className="essay-navlink">
            {link.label}
          </Link>
        ))}

        <a
          href={CONTACT.booking}
          target="_blank"
          rel="noreferrer"
          className="essay-nav__cta"
        >
          Book a call
        </a>
      </nav>
    </div>
  );
}
