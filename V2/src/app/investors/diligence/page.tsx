import type { Metadata } from "next";
import InvestorKeynote from "@/components/investors/InvestorKeynote";
import { InvestorGate } from "@/components/essay/InvestorGate";
import { hasInvestorAccess } from "@/lib/investor-access";
import {
  FUNDS,
  PHASES,
  RESTRICTED_COPY,
  TERMS,
  VOICES,
} from "@/content/investors-restricted";

/**
 * The long technical diligence, now behind the same server gate as /investors.
 *
 * This route previously had NO gate of any kind. It rendered the keynote
 * directly, so the ask, the use of funds and all five named practitioners were
 * served to anyone who typed the URL — and the same strings sat in a public
 * JavaScript chunk, because the keynote is a client component that imported
 * them. `noindex` was the only thing between that material and the open web,
 * and `noindex` is a polite request to crawlers, not an access control.
 *
 * Two things changed. Access is checked on the server before the keynote is
 * constructed at all, and the restricted content is imported HERE, in a server
 * component, then passed down as a prop — so it is never compiled into the
 * client bundle. See content/investors-restricted.ts for that rule in full.
 */
/** Never prerender. Same reasoning as /investors — see the note there. */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  // The root template appends " — CooL", so this stays a single clean phrase
  // rather than a second em-dashed clause.
  title: "Investor diligence",
  // The raise figure used to be in this description, which meant every link
  // preview — Slack, WhatsApp, an email client — rendered "exactly what ₹1 Cr
  // converts into" to whoever the link passed through, gate or no gate.
  // Metadata is the one part of a page that travels without being visited.
  description:
    "The architecture behind CooL, what genuinely runs today versus what does not, and what we refuse to build ourselves. Access-controlled. Northwind Cipher Pvt. Ltd.",
  alternates: { canonical: "/investors/diligence" },
  robots: { index: false, follow: false, nocache: true },
  openGraph: {
    title: "CooL — technical & operational diligence",
    description:
      "The architecture, the honest build status, and the buy-versus-build ledger. The part of the pitch that has to survive an engineer.",
    url: "/investors/diligence",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CooL — technical & operational diligence",
    description:
      "The architecture, an honest build ledger, and the part of the pitch that has to survive an engineer.",
  },
};

export default async function InvestorsDiligencePage() {
  if (!(await hasInvestorAccess())) {
    // `next` sends the reader back here after unlocking, rather than dropping
    // them on /investors and making them find this page a second time.
    return (
      <div className="essay">
        <InvestorGate next="/investors/diligence" />
      </div>
    );
  }

  return (
    <InvestorKeynote
      restricted={{
        voices: VOICES,
        funds: FUNDS,
        phases: PHASES,
        copy: RESTRICTED_COPY,
        terms: TERMS,
      }}
    />
  );
}
