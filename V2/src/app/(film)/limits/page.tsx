import type { Metadata } from "next";

import { StatusChip } from "@/components/film/HudFrame";
import { PageHead } from "@/components/film/SectionHead";
import { CLAIMS, type ClaimId } from "@/content/claims";

export const metadata: Metadata = {
  title: "Limits",
  description:
    "What CooL does not do and has not proven yet — hardware scope, witness independence, anchoring, certifications, customers and billing — stated plainly, with sources.",
  alternates: { canonical: "/limits" },
};

const REVIEWED = "2026-10-20";

const GROUPS: readonly { title: string; ids: readonly ClaimId[] }[] = [
  { title: "Scope of the product", ids: ["notCorrectness"] },
  { title: "Hardware", ids: ["cpuOnly", "gpuAttestation", "devImage", "quoteFreshness", "onlineAttestation"] },
  { title: "Log, witness and anchor", ids: ["witnessSameAccount", "externalWitness", "anchorAbsent", "manifestUnsigned"] },
  { title: "In the browser", ids: ["browserAttestationMock", "simulatorLabel"] },
  { title: "Testing and audit", ids: ["fixtureTests", "externalAudit"] },
  { title: "Company", ids: ["certifications", "customers", "billing", "licence"] },
];

export default function LimitsPage() {
  return (
    <>
      <PageHead
        label={`[ Limits · last reviewed ${REVIEWED} ]`}
        title="What this does not prove."
        lead="Limitations get the same type size as strengths. Every line below links to the source it was checked against."
      />
      {GROUPS.map((g) => (
        <section key={g.title} className="f-section" aria-label={g.title}>
          <div className="f-wrap f-grid">
            <h2 className="f-label f-span-3">[ {g.title} ]</h2>
            <div className="f-span-8 f-rows">
              {g.ids.map((id) => {
                const c = CLAIMS[id];
                const href = c.source.startsWith("http") ? c.source : undefined;
                return (
                  <div key={id} className="f-row" style={{ gridTemplateColumns: "minmax(0,1fr) auto" }}>
                    <div>
                      <p className="f-h3">{c.wording}</p>
                      <p className="f-label" style={{ marginTop: 10 }}>
                        Source:{" "}
                        {href ? (
                          <a className="f-link" href={href} target="_blank" rel="noopener">
                            {href.replace(/^https:\/\//, "")} ↗
                          </a>
                        ) : (
                          c.source
                        )}{" "}
                        · checked {c.checked}
                      </p>
                    </div>
                    <StatusChip status={c.status} />
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      ))}
    </>
  );
}
