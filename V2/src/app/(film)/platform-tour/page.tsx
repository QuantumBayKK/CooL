import type { Metadata } from "next";
import Link from "next/link";

import { StatusChip } from "@/components/film/HudFrame";
import { PageHead, SectionHead } from "@/components/film/SectionHead";
import { claim } from "@/content/claims";

export const metadata: Metadata = {
  title: "Platform tour",
  description:
    "A walk through CooL: capture a change, seal it into a receipt, append it to the transparency log, attest where it ran, and verify it offline.",
  alternates: { canonical: "/platform-tour" },
};

// The receipt excerpt is copied from the published conformance vector
// public/cool-vectors/valid-receipt-with-inclusion.json (mock-attested).
const STOPS = [
  {
    n: "01",
    title: "Capture the change",
    body: "A prompt edit, a model swap, a policy change or a tool grant is captured as it ships — from the SDK in your service, or the CLI in your release path.",
    status: "REAL",
    file: "terminal",
    code: `$ cool seal prompt billing/agent#system "Approve refunds up to $500."
$ cool records --kind prompt`,
  },
  {
    n: "02",
    title: "Seal it into a receipt",
    body: "The record is canonicalised to CBOR, committed as salted SHA-256 hashes, and signed with ML-DSA-65 and Ed25519. The receipt carries commitments, never plaintext.",
    status: "REAL",
    file: "valid-receipt-with-inclusion.json (excerpt)",
    code: `"record": {
  "record_id": "01J6XR7K8M2Q3N5P7R9TVWXYZ1",
  "model": { "id": "acme/credit-scorer", "version": "2026.06.0" },
  "signature": { "alg": "ml-dsa-65+ed25519", "key_id": "cool-sign-2026Q2-01" }
},
"binding_hash": "mh:sha256:9865438fdff2dfee…0c0f7f64c"`,
  },
  {
    n: "03",
    title: "Append it to the log",
    body: "Each receipt is a leaf in an RFC 6962 Merkle tree under a signed tree head. Inclusion proves it is there; consistency proves the log only grew. Witnesses co-sign the heads they have checked.",
    status: "REAL",
    file: "terminal",
    code: `$ cool log --consistency 12
$ cool witness cosign --key auditor`,
  },
  {
    n: "04",
    title: "Prove where it ran",
    body: "Inside an Intel TDX confidential VM, the signing key is bound to a hardware quote of the measured image. Pin the measurement and a changed workload fails the enclave domain.",
    status: "REAL",
    file: "terminal",
    code: `$ cool attest
$ cool status`,
  },
  {
    n: "05",
    title: "Verify it anywhere",
    body: "Anyone holding the receipt verifies it on their own machine, offline, with no account. Each domain is reported separately, and CI can gate on the exit code.",
    status: "REAL",
    file: "terminal",
    code: `$ cool verify all --require-hardware
$ cool pack build --out audit.json`,
  },
] as const;

export default function PlatformTourPage() {
  return (
    <>
      <PageHead
        label="Platform tour"
        title="From a change to a proof anyone can check."
        lead="Five stops: capture, seal, log, attest, verify. Every command below is in the cool CLI today."
      >
        <div className="f-btn-row">
          <Link href="/studio" className="f-btn">
            Open the live Studio
          </Link>
          <Link href="/verify" className="f-btn f-btn--line">
            Try the verifier
          </Link>
        </div>
      </PageHead>

      {STOPS.map((s, i) => (
        <section key={s.n} className={`f-section${i % 2 ? " f-alt" : ""}`} aria-labelledby={`stop-${s.n}`}>
          <div className="f-wrap f-grid" style={{ alignItems: "center" }}>
            <div className="f-span-5 f-stack" style={{ order: i % 2 ? 2 : 0 }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <span className="f-step__n">{s.n}</span>
                <StatusChip status={s.status} />
              </div>
              <h2 id={`stop-${s.n}`} className="f-h2">
                {s.title}
              </h2>
              <p className="f-body">{s.body}</p>
            </div>
            <div className="f-span-7">
              <div className="f-term">
                <div className="f-term__bar">
                  <span>{s.file}</span>
                </div>
                <pre className="f-term__body" style={{ margin: 0, minHeight: 0 }} tabIndex={0}>
                  <code>{s.code}</code>
                </pre>
              </div>
            </div>
          </div>
        </section>
      ))}

      <section className="f-section" aria-labelledby="tour-limits">
        <div className="f-wrap">
          <SectionHead
            id="tour-limits"
            label="Stated with the tour"
            title="What the platform does not do yet."
            lead={`${claim("anchorAbsent")} ${claim("externalWitness")} ${claim("gpuAttestation")}`}
          >
            <Link href="/limits" className="f-btn f-btn--line">
              Every limit
            </Link>
          </SectionHead>
        </div>
      </section>
    </>
  );
}
