import type { Metadata } from "next";
import Link from "next/link";

import { PageHead } from "@/components/film/SectionHead";
import { claim } from "@/content/claims";
import { FAQ } from "@/content/copy";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Common questions about CooL: what it records, how verification works, hardware attestation, pricing and limits.",
  alternates: { canonical: "/faq" },
};

const GROUPS: readonly { title: string; items: readonly { q: string; a: React.ReactNode }[] }[] = [
  { title: "Product", items: FAQ.map((f) => ({ q: f.q, a: f.a })) },
  {
    title: "Trust and limits",
    items: [
      { q: "What does CooL not prove?", a: claim("notCorrectness") },
      { q: "Is the witness independent?", a: claim("witnessSameAccount") },
      { q: "Is public-chain anchoring live?", a: claim("anchorAbsent") },
      { q: "Do you attest GPUs?", a: `${claim("cpuOnly")} ${claim("gpuAttestation")}` },
      { q: "Are you certified?", a: claim("certifications") },
      {
        q: "Where is the full list of limitations?",
        a: (
          <>
            On the <Link href="/limits">Limits</Link> page, each with the source it was checked against.
          </>
        ),
      },
    ],
  },
  {
    title: "Pricing and licence",
    items: [
      { q: "Can I pay you today?", a: claim("billing") },
      { q: "Is verification free?", a: "Yes, always. Anyone can verify any receipt offline, with no account, at no cost." },
      { q: "What licence is the SDK under?", a: claim("licence") },
      { q: "Does the SDK phone home?", a: `${claim("noTelemetry")} ${claim("noInstallScripts")}` },
    ],
  },
];

export default function FaqPage() {
  return (
    <>
      <PageHead label="FAQ" title="Common questions, answered." lead="If yours is not here, book a call — the founders answer them directly." />
      {GROUPS.map((g) => (
        <section key={g.title} className="f-section" aria-label={g.title}>
          <div className="f-wrap f-grid">
            <h2 className="f-h3 f-span-4">{g.title}</h2>
            <div className="f-span-8 f-faq">
              {g.items.map((f) => (
                <details key={f.q}>
                  <summary>{f.q}</summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      ))}
    </>
  );
}
