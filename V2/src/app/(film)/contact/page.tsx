import type { Metadata } from "next";
import Link from "next/link";

import { HudFrame } from "@/components/film/HudFrame";
import { IconTile } from "@/components/film/Icons";
import { PageHead } from "@/components/film/SectionHead";
import { BOOKING_URL, REPO_URL } from "@/content/claims";

export const metadata: Metadata = {
  title: "Book a demo",
  description: "Book a 30-minute call with the Northwind Cipher founders, or reach us by email.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <>
      <PageHead
        label="Contact"
        title="Book a demo with the founders."
        lead="Thirty minutes on your AI system, your obligations, and whether CooL fits — with the people who built it."
      >
        <div className="f-btn-row">
          <a href={BOOKING_URL} target="_blank" rel="noopener" className="f-btn">
            Pick a time on cal.com ↗
          </a>
          <Link href="/design-partners" className="f-btn f-btn--line">
            About design partnerships
          </Link>
        </div>
        <p className="f-small f-muted" style={{ marginTop: 14 }}>
          Booking opens cal.com in a new tab. There is no form on this site and nothing you type here is collected.
        </p>
      </PageHead>

      <section className="f-section f-section--flush">
        <div className="f-wrap f-grid">
          <HudFrame className="f-span-4 f-hud--fill">
            <IconTile name="users" />
            <h2 className="f-h3" style={{ marginTop: 16 }}>
              Sales and partnerships
            </h2>
            <p className="f-body f-small" style={{ marginTop: 8 }}>
              Pranauv Shrinaath S, Founder &amp; CEO
            </p>
            <a className="f-link f-small" href="mailto:pranauvshrinaath@northwindcipher.com">
              pranauvshrinaath@northwindcipher.com
            </a>
          </HudFrame>
          <HudFrame className="f-span-4 f-hud--fill">
            <IconTile name="code" />
            <h2 className="f-h3" style={{ marginTop: 16 }}>
              Technical and integration
            </h2>
            <p className="f-body f-small" style={{ marginTop: 8 }}>
              Kailosh Kalimuthu, Co-Founder &amp; CTO
            </p>
            <a className="f-link f-small" href="mailto:kailoshkalimuthu@northwindcipher.com">
              kailoshkalimuthu@northwindcipher.com
            </a>
          </HudFrame>
          <HudFrame className="f-span-4 f-hud--fill">
            <IconTile name="lock" />
            <h2 className="f-h3" style={{ marginTop: 16 }}>
              Security reports
            </h2>
            <p className="f-body f-small" style={{ marginTop: 8 }}>
              Please do not email vulnerabilities. Use GitHub private vulnerability reporting on cool-sdk.
            </p>
            <a className="f-link f-small" href={`${REPO_URL}/security/advisories/new`} target="_blank" rel="noopener">
              Report a vulnerability ↗
            </a>
          </HudFrame>
        </div>
      </section>
    </>
  );
}
