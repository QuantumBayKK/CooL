import type { Metadata } from "next";
import dynamic from "next/dynamic";
import Link from "next/link";

import { SurfaceHeader } from "@/components/shell/SurfaceHeader";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/primitives";
import { SITE } from "@/lib/site";

const DemoShell = dynamic(() => import("@/components/demo/DemoShell"));

export const metadata: Metadata = {
  title: "Run the demo — real cryptography in your browser",
  description:
    "Seal one AI change and verify it, live: deterministic CBOR, SHA-256 commitments, ML-DSA-65 + Ed25519 signatures and an RFC 6962 transparency log, all executing in this tab. Then forge the receipt and watch the verifier reject it.",
  alternates: { canonical: "/demo" },
  openGraph: {
    title: "Run the CooL demo — real cryptography, in your browser",
    description:
      "Real ML-DSA-65 + Ed25519 signatures, a real RFC 6962 Merkle log, and an offline verifier — executing on your machine. Nothing pre-recorded.",
    url: "/demo",
    type: "website",
  },
};

/**
 * The demo, as a destination.
 *
 * ── why this route exists ──
 *
 * The demo was reachable two ways and neither worked. It was mounted on the
 * homepage below three pinned trailer acts — 15,800px down, 17.6 viewport
 * heights, which nobody scrolls — and it had a working copy at `/pipeline`
 * that appeared in no navigation menu at all. So the single most persuasive
 * thing on the site, the part that runs real cryptography and can be attacked
 * by the visitor, was in practice unreachable.
 *
 * This is now the canonical home for it: one click from the header, the hero
 * and the mobile bar, with the controls at the top of the page instead of the
 * bottom of a trailer. `/pipeline` permanently redirects here so existing
 * links and any indexed URL still land somewhere real.
 *
 * The homepage still carries the demo, because arriving at it after the three
 * acts is a good ending for someone who read the whole argument. It is no
 * longer the only way in.
 */
export default function DemoPage() {
  return (
    <div data-surface="console">
      <SurfaceHeader
        compact
        eyebrow="Live · nothing pre-recorded"
        title="Seal a change. Then try to forge it."
        lead="Real cryptography, executing in this tab. No server, no account, nothing uploaded."
        actions={
          /* Hidden below `lg`. On a phone these three stack into a 150px
             block between the title and the demo, which is 150px of things
             the reader did not come for sitting on top of the one they did.
             They reappear under the demo — see `MoreLinks`. */
          <div className="hidden flex-wrap items-center gap-2 lg:flex">
            <Button asChild variant="secondary" size="sm">
              <Link href="/verify">The seven-stop walkthrough</Link>
            </Button>
            <Button asChild variant="secondary" size="sm">
              <Link href="/console">Open the console</Link>
            </Button>
            <Button asChild variant="secondary" size="sm">
              <Link href="/docs/quickstart">Install the SDK</Link>
            </Button>
          </div>
        }
        honesty={
          <>
            The cryptography is real and runs on your machine: deterministic
            CBOR, SHA-256 commitments, ML-DSA-65 + Ed25519 hybrid signatures, an
            RFC 6962 transparency log, and the offline verifier. Stages that
            would need a server or a third-party API are labelled{" "}
            <code className="font-mono text-[0.8125rem]">SIMULATED</code> from
            the stage&apos;s own field rather than from copy, and the estate data
            is synthetic. Hardware attestation reports{" "}
            <code className="font-mono text-[0.8125rem]">MOCK</code> and public
            anchoring <code className="font-mono text-[0.8125rem]">ABSENT</code>{" "}
            because neither ships yet — the verifier will never mark them as
            passing, and nothing in this UI can reach that rule.
          </>
        }
      />

      <Container>
        {/* The controls start here, immediately under the header. On a phone
            this matters more than it looks: the previous arrangement put the
            run button 968px down a 844px viewport, so a reader who tapped
            "Run the demo" arrived at a heading with nothing to press. */}
        <div className="py-4 lg:py-8">
          <DemoShell />
        </div>

        {/* The header's secondary links, for the phone layout that hides them
            above so the demo controls can sit closer to the top. */}
        <div className="flex flex-wrap gap-2 border-t border-line py-6 lg:hidden">
          <Button asChild variant="secondary" size="sm">
            <Link href="/verify">The seven-stop walkthrough</Link>
          </Button>
          <Button asChild variant="secondary" size="sm">
            <Link href="/console">Open the console</Link>
          </Button>
          <Button asChild variant="secondary" size="sm">
            <Link href="/docs/quickstart">Install the SDK</Link>
          </Button>
        </div>

        <div className="border-t border-line py-8">
          <p className="font-mono text-xs leading-relaxed text-ink-subtle">
            Source ·{" "}
            {[
              ["cool-sdk", SITE.repo],
              ["cool-verifier", "https://github.com/KenidoesCode/cool-verifier"],
              ["cool-spec", "https://github.com/KenidoesCode/cool-spec"],
            ].map(([label, href], i) => (
              <span key={label}>
                {i > 0 && " · "}
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-ink underline underline-offset-4"
                >
                  {label}
                </a>
              </span>
            ))}{" "}
            · Apache-2.0 · {SITE.company}
          </p>
        </div>
      </Container>
    </div>
  );
}
