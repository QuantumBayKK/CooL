import type { Metadata } from "next";
import Link from "next/link";

import { HudFrame, StatusChip } from "@/components/film/HudFrame";
import { PageHead, SectionHead } from "@/components/film/SectionHead";
import { CLAIMS, REPO_URL, claim } from "@/content/claims";

export const metadata: Metadata = {
  title: "Security",
  description:
    "How CooL handles keys and data, what leaves your environment (nothing in plaintext), telemetry (none), dependencies, provenance and how to report a vulnerability.",
  alternates: { canonical: "/security" },
};

const FLOW = [
  ["Your application", "Prompt, output and metadata exist only here, in plaintext."],
  ["SDK · commit", "Salted SHA-256 commitments are computed; the plaintext is discarded."],
  ["SDK · sign", "The record is canonicalised and hybrid-signed (ML-DSA-65 + Ed25519)."],
  ["Log", "Commitments and signatures — never plaintext — are appended to the RFC 6962 log."],
  ["Verifier", "Anyone holding the receipt checks it offline. No call back to CooL."],
] as const;

const KEYS = [
  {
    t: "On hardware",
    s: "REAL",
    d: "Inside an Intel TDX confidential VM via Phala dstack, the signing key is derived in the enclave from its measurement. There is no key to configure or leak, and the quote binds the key to the measured workload.",
  },
  {
    t: "Without hardware",
    s: "SIMULATED",
    d: "The SDK's simulator produces structurally complete quotes under a CooL-held root. Every such receipt is labelled simulated, and the verifier never reports those domains as pass.",
  },
  {
    t: "Pinning",
    s: "REAL",
    d: "security.expectedMeasurement pins the image you approved. A changed workload changes RTMR3 and fails the enclave domain.",
  },
] as const;

const INVARIANTS = [
  "The receipt never contains plaintext metadata or payloads.",
  "A single edited byte breaks both binding and signature.",
  "A valid quote cannot be stapled onto a record it did not attest.",
  "The verifier never throws on malformed input — it returns a failed verdict.",
  "Simulated is never reported as pass.",
];

export default function SecurityPage() {
  return (
    <>
      <PageHead
        label="[ Security ]"
        title="Keys, data, and what never leaves."
        lead={`${claim("saltedCommitments")} ${claim("noTelemetry")}`}
      />

      <section className="f-section f-section--flush" style={{ paddingTop: 0 }} aria-labelledby="s-flow">
        <div className="f-wrap">
          <h2 id="s-flow" className="f-label" style={{ marginBottom: 20 }}>
            [ Data flow ]
          </h2>
          <ol className="f-pipe" style={{ listStyle: "none", padding: 0, margin: 0, gridTemplateColumns: "repeat(5, minmax(0,1fr))" }}>
            {FLOW.map(([t, d], i) => (
              <li key={t} className="f-pipe__stage" data-lit={i === 0 ? "true" : "false"} style={{ minHeight: 220 }}>
                <span className="f-label">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="f-h3">{t}</h3>
                <p className="f-body f-small">{d}</p>
              </li>
            ))}
          </ol>
          <p className="f-label" style={{ marginTop: 16 }}>
            Inverted stage: the only place plaintext exists. Control plane carries no customer evidence or PII.
          </p>
        </div>
      </section>

      <section className="f-section" aria-labelledby="s-keys">
        <div className="f-wrap">
          <SectionHead id="s-keys" label="[ Key handling ]" title="On hardware, there is no signing key to steal." />
          <div className="f-grid" style={{ marginTop: 48 }}>
            {KEYS.map((k) => (
              <HudFrame key={k.t} className="f-span-4 f-hud--fill" meta={<StatusChip status={k.s} />}>
                <h3 className="f-h3">{k.t}</h3>
                <p className="f-body f-small" style={{ marginTop: 12 }}>
                  {k.d}
                </p>
              </HudFrame>
            ))}
          </div>
        </div>
      </section>

      <section className="f-section" aria-labelledby="s-supply">
        <div className="f-wrap">
          <SectionHead id="s-supply" label="[ Supply chain ]" title="Small, inspectable, no install scripts." />
          <div className="f-rows" style={{ marginTop: 48 }}>
            {(["runtimeDeps", "noInstallScripts", "noTelemetry", "packageVersion", "licence"] as const).map((id) => (
              <div key={id} className="f-row">
                <span className="f-label">{id === "licence" ? "Licence" : "Package"}</span>
                <p className="f-body">{CLAIMS[id].wording}</p>
                <StatusChip status={CLAIMS[id].status} />
              </div>
            ))}
            <div className="f-row">
              <span className="f-label">Provenance</span>
              <p className="f-body">
                Published to npm as cool-nwc. Browser builds served from this site are listed with checksums at{" "}
                <a className="f-link" href="/sdk/checksums.txt">
                  /sdk/checksums.txt
                </a>
                .
              </p>
              <StatusChip status="REAL" />
            </div>
          </div>
        </div>
      </section>

      <section className="f-section" aria-labelledby="s-inv">
        <div className="f-wrap f-grid">
          <h2 id="s-inv" className="f-label f-span-3">
            [ Invariants the test suite enforces ]
          </h2>
          <ol className="f-span-8 f-rows" style={{ listStyle: "none", padding: 0 }}>
            {INVARIANTS.map((v, i) => (
              <li key={v} className="f-row" style={{ gridTemplateColumns: "4rem minmax(0,1fr)" }}>
                <span className="f-label">{String(i + 1).padStart(2, "0")}</span>
                <p className="f-h3">{v}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="f-section f-invert" aria-labelledby="s-disc">
        <div className="f-wrap f-grid">
          <div className="f-span-6 f-stack">
            <p className="f-label">[ Responsible disclosure ]</p>
            <h2 id="s-disc" className="f-h2">
              Found something? Tell us privately.
            </h2>
            <p className="f-body">{claim("disclosure")}</p>
            <p className="f-body f-small">
              In scope: forging or silently editing a receipt that still verifies, making a simulated receipt verify as
              hardware-backed, bypassing requireAttestation / requireHardware, canonicalisation ambiguities, signature
              confusion, secrets reaching logs or the tarball, code execution at install.
            </p>
          </div>
          <div className="f-span-6 f-stack">
            <a href={`${REPO_URL}/security/advisories/new`} target="_blank" rel="noopener" className="f-btn" data-impact="full">
              Report a vulnerability ↗
            </a>
            <a href={`${REPO_URL}/blob/main/SECURITY.md`} target="_blank" rel="noopener" className="f-btn f-btn--line" data-impact="small">
              Read SECURITY.md ↗
            </a>
            <Link href="/security/model" className="f-btn f-btn--line" data-impact="small">
              Full security model
            </Link>
            <Link href="/security/readiness" className="f-btn f-btn--line" data-impact="small">
              Readiness ladder
            </Link>
            <p className="f-label">{claim("certifications")} {claim("externalAudit")}</p>
          </div>
        </div>
      </section>
    </>
  );
}
