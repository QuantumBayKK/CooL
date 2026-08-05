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
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 30,
        background: "rgba(13,17,23,0.86)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(240,246,252,0.1)",
        paddingTop: "env(safe-area-inset-top)",
      }}
    >
      <nav
        aria-label="Main"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "18px",
          maxWidth: "900px",
          margin: "0 auto",
          padding: "0 max(16px, env(safe-area-inset-left)) 0 max(16px, env(safe-area-inset-right))",
          height: "52px",
          overflowX: "auto",
          scrollbarWidth: "none",
        }}
      >
        <Link
          href="#cover"
          style={{
            fontWeight: 800,
            fontSize: "17px",
            color: "#e9edf5",
            textDecoration: "none",
            flex: "none",
            display: "inline-flex",
            alignItems: "center",
            minHeight: "44px",
          }}
        >
          CooL
        </Link>

        {/* Section links are for pointing devices. On a phone they pushed the
            CTA half off the edge, and a jump-link is worth very little on a
            page you reach by scrolling anyway — so below 640px the row is the
            wordmark and the one action, both fully visible. */}
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="essay-navlink"
            style={{
              fontSize: "14.5px",
              color: "#8a94a8",
              textDecoration: "none",
              whiteSpace: "nowrap",
              flex: "none",
              alignItems: "center",
              minHeight: "44px",
            }}
          >
            {link.label}
          </Link>
        ))}

        <a
          href={CONTACT.booking}
          target="_blank"
          rel="noreferrer"
          style={{
            marginLeft: "auto",
            background: "#5b8cff",
            color: "#06122e",
            fontWeight: 700,
            fontSize: "14.5px",
            padding: "0 14px",
            borderRadius: "10px",
            textDecoration: "none",
            whiteSpace: "nowrap",
            flex: "none",
            display: "inline-flex",
            alignItems: "center",
            minHeight: "44px",
          }}
        >
          Book a call
        </a>
      </nav>
    </div>
  );
}
