import type { Metadata } from "next";
import dynamic from "next/dynamic";
import Link from "next/link";

import { SurfaceHeader } from "@/components/shell/SurfaceHeader";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/primitives";

/**
 * The console is the whole page below the fold and pulls in every chart, so it
 * is code-split: the header and the honesty banner render immediately and the
 * application shell arrives with them rather than blocking them.
 */
const ConsoleApp = dynamic(() => import("@/components/console/ConsoleApp"));

export const metadata: Metadata = {
  title: "Console",
  description:
    "Every AI change across an estate — captured, sealed, risk-scored and audit-ready. Predictive change-risk scoring with explainable drivers, obligation coverage, and one-click audit export.",
  alternates: { canonical: "/console" },
  openGraph: {
    title: "The CooL console",
    description:
      "Every AI change in one place, already documented. Predictive risk scoring with explainable drivers, and audit export that is finished before anyone asks.",
    url: "/console",
    type: "website",
  },
};

/**
 * The operator's surface.
 *
 * `data-surface="console"` is what demotes red from brand accent to
 * failure-only for this whole subtree — see the scope block in globals.css.
 * Inside here a filled primary button is ink, and anything red genuinely means
 * something is wrong.
 */
export default function ConsolePage() {
  return (
    <div data-surface="console">
      <SurfaceHeader
        eyebrow="Product surface"
        title="Every AI change in one place. Already documented."
        lead="What a regulated team opens on Monday: everything their AI changed last week, sealed without anyone writing a word — plus what is about to go wrong, and the fix for it."
        actions={
          <>
            <Button asChild variant="secondary" size="sm">
              <Link href="/verify">See the cryptography run</Link>
            </Button>
            <Button asChild variant="secondary" size="sm">
              <Link href="/pipeline">Open the pipeline</Link>
            </Button>
          </>
        }
        honesty={
          <>
            The estate below is <strong className="text-ink">synthetic</strong> —
            a live one would be a customer&apos;s private data, and the names are{" "}
            <code className="font-mono text-[0.8125rem]">*.example</code> per RFC
            2606. Everything computed <em>from</em> it is not: the risk model, its
            per-feature explanations, the obligation coverage and the audit export
            are the production code paths running in your browser. The model
            weights are priors set from the failure modes the architecture is
            designed around — they are not fitted on customer data, because there
            is none yet.
          </>
        }
      />

      <Container>
        <div className="py-10">
          <ConsoleApp />
        </div>
      </Container>
    </div>
  );
}
