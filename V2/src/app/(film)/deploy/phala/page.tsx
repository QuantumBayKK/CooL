import type { Metadata } from "next";
import Link from "next/link";

import { HudFrame, StatusChip } from "@/components/film/HudFrame";
import { IconTile } from "@/components/film/Icons";
import { PageHead, SectionHead } from "@/components/film/SectionHead";
import { CLAIMS, EVIDENCE_URL } from "@/content/claims";

export const metadata: Metadata = {
  title: "Deploy on Phala Cloud",
  description:
    "Run CooL's evidence plane inside Intel TDX confidential VMs on Phala Cloud via dstack, pin the measured image, and refuse simulated evidence.",
  alternates: { canonical: "/deploy/phala" },
};

const GAINS = [
  { icon: "cpu", t: "Hardware-rooted signing", d: "The quote's report_data binds the CooL signing key to the measured enclave, so a receipt proves which code produced it." },
  { icon: "lock", t: "Pinned images", d: "Pin MRTD and RTMR0–3 of the image you reviewed. A changed workload changes RTMR3 and fails the enclave domain." },
  { icon: "verifier", t: "Attested witnesses", d: "A witness in a second CVM verifies receipts and heads before co-signing, with its own enclave-sealed key." },
] as const;

const STEPS = [
  {
    t: "Provision a TDX CVM",
    d: "Create an Intel TDX confidential VM on Phala Cloud with dstack. The guest agent exposes a socket inside the VM for quotes and key derivation.",
    code: "# inside the CVM\nls /var/run/dstack.sock",
  },
  {
    t: "Point CooL at dstack",
    d: "Set the attestation provider to dstack — or export COOL_DSTACK_ENDPOINT — so quotes come from silicon instead of the simulator.",
    code: `const cool = new CooL({
  applicationId: "refund-agent",
  attestation: { provider: "dstack" },
});`,
  },
  {
    t: "Pin and require attestation",
    d: "Pin the measurement of the image you reviewed and require attestation, so the client refuses to run unattested.",
    code: `security: {
  requireAttestation: true,
  expectedMeasurement: PINNED_MEASUREMENT,
}`,
  },
  {
    t: "Refuse simulated evidence",
    d: "Gate every pipeline on hardware-backed receipts. From here a simulated receipt is not acceptable evidence anywhere.",
    code: "$ cool verify all --require-hardware",
  },
] as const;

export default function DeployPhalaPage() {
  return (
    <>
      <PageHead
        label="Deploy · Phala Cloud"
        title="Run CooL inside Intel TDX on Phala Cloud."
        lead="The same SDK, with the evidence plane inside a confidential VM — so every receipt carries a hardware quote bound to the code you approved."
      >
        <div className="f-btn-row">
          <Link href="/docs/production" className="f-btn">
            Read the production guide
          </Link>
          <a href={EVIDENCE_URL} target="_blank" rel="noopener" className="f-btn f-btn--line">
            See the hardware evidence ↗
          </a>
        </div>
      </PageHead>

      <section className="f-section f-section--flush">
        <div className="f-wrap f-grid">
          {GAINS.map((g) => (
            <HudFrame key={g.t} className="f-span-4 f-hud--fill">
              <IconTile name={g.icon} />
              <h2 className="f-h3" style={{ marginTop: 16 }}>
                {g.t}
              </h2>
              <p className="f-body f-small" style={{ marginTop: 8 }}>
                {g.d}
              </p>
            </HudFrame>
          ))}
        </div>
      </section>

      <section className="f-section f-alt" aria-labelledby="d-steps">
        <div className="f-wrap">
          <SectionHead id="d-steps" label="How it works" title="Four steps from simulator to silicon." />
          <ol className="f-steps f-steps--2" style={{ marginTop: 48, listStyle: "none", padding: 0 }}>
            {STEPS.map((s, i) => (
              <li key={s.t} className="f-step">
                <span className="f-step__n">{i + 1}</span>
                <h3 className="f-h3">{s.t}</h3>
                <p className="f-body f-small">{s.d}</p>
                <div className="f-term" style={{ marginTop: "auto" }}>
                  <pre className="f-term__body" style={{ margin: 0, minHeight: 0 }} tabIndex={0}>
                    <code>{s.code}</code>
                  </pre>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="f-section" aria-labelledby="d-limits">
        <div className="f-wrap">
          <SectionHead id="d-limits" label="Know before you deploy" title="Limits of the hardware path today." />
          <div className="f-rows" style={{ marginTop: 32 }}>
            {(["cpuOnly", "devImage", "onlineAttestation", "quoteFreshness", "witnessSameAccount", "phalaInfra"] as const).map((id) => (
              <div key={id} className="f-row" style={{ gridTemplateColumns: "minmax(0,1fr) auto" }}>
                <p className="f-body">{CLAIMS[id].wording}</p>
                <StatusChip status={CLAIMS[id].status} />
              </div>
            ))}
          </div>
          <p className="f-small f-muted" style={{ marginTop: 16 }}>
            Phala provides the infrastructure CooL ran on; this page is not an endorsement by Phala.
          </p>
        </div>
      </section>
    </>
  );
}
