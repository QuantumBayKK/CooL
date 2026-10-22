import type { Metadata } from "next";
import Link from "next/link";

import { CopyCommand } from "@/components/film/CopyCommand";
import { StatusChip } from "@/components/film/HudFrame";
import { PageHead, SectionHead } from "@/components/film/SectionHead";
import { CLAIMS, EVIDENCE_URL, REPO_URL, claim } from "@/content/claims";

export const metadata: Metadata = {
  title: "Evidence",
  description:
    "The seven CooL verification domains, verified on two Phala Cloud Intel TDX confidential VMs: evidence, negative controls, the 11-row tamper matrix, the workload-change test and how to reproduce it.",
  alternates: { canonical: "/evidence" },
};

const ART = `${REPO_URL}/tree/main/artifacts/closure`;

/** Transcribed from artifacts/closure-verification-matrix.md (checked 2026-10-20). */
const DOMAINS = [
  {
    id: "binding",
    evidence: "8 receipts, verification/binding-domain-final.json",
    method: "Canonical CBOR + node:crypto recompute, outside the SDK verifier",
    negative: "Flipped binding_hash or a record field: binding fails",
  },
  {
    id: "signature",
    evidence: "verification/signature-domain-final.json",
    method: "ML-DSA-65 and Ed25519 each verified directly over the exact signed bytes",
    negative: "Altered Ed25519 or ML-DSA bytes: signature fails",
  },
  {
    id: "inclusion",
    anchor: "log",
    evidence: "Final receipt: leaf 7 of an 8-entry tree, audit path length 3",
    method: "Every head's root recomputed with an independent RFC 6962 implementation; STH signatures verified",
    negative: "Altered root, forged STH, altered audit path: inclusion fails",
  },
  {
    id: "consistency",
    evidence: "8-event deployed log, heads of sizes 1..8",
    method: "SDK verifyLogConsistency plus an independent RFC 6962/9162 check: 36 of 36 pairs verify",
    negative: "Modified roots, wrong sizes, truncated proof, forked history: 28 of 28 rejected per class",
  },
  {
    id: "witness",
    evidence: "Separate CVM, node, app_id and enclave-sealed key",
    method: "Witness pulled and verified all 8 receipts, 8 heads, 7 consistency pairs before signing",
    negative: "Forged heads refused (HTTP 409); forged witness signature fails the domain",
  },
  {
    id: "attestation",
    evidence: "Raw TDX v4 quotes + Phala attestation responses",
    method: "MRTD, RTMR0–3 and report_data equal the receipt; report_data binds the signing key; local dcap-qvl: TCB UpToDate",
    negative: "One flipped quote byte: Phala returns verified:false; attestation and enclave fail",
  },
  {
    id: "enclave",
    evidence: "verification/enclave-domain-final.json, runtime-A.json",
    method: "Non-zero MRTD/RTMR0–3 equal the raw quote; runtime status observed inside the CVM",
    negative: "Wrong pin, zero pin, requireHardware without a verifier: enclave fails",
  },
] as const;

const TAMPER = [
  "binding hash",
  "record metadata",
  "ML-DSA-65 signature",
  "Ed25519 signature",
  "tree root",
  "forged signed tree head",
  "audit path",
  "forged witness signature",
  "wrong quote",
  "wrong report_data",
  "altered quote bytes",
];

const WORKLOAD = [
  ["MRTD", "identical", "identical"],
  ["RTMR0", "identical", "identical"],
  ["RTMR1", "identical", "identical"],
  ["RTMR2", "identical", "identical"],
  ["RTMR3", "Deployment A", "different — rejected against A's pin"],
] as const;

export default function EvidencePage() {
  return (
    <>
      <PageHead
        label="Evidence"
        title="Seven domains. Real hardware. Raw files."
        lead={claim("domainsSeven")}
      >
        <div className="f-btn-row">
          <a href={EVIDENCE_URL} target="_blank" rel="noopener" className="f-btn" data-impact="full">
            Open the matrix ↗
          </a>
          <a href={ART} target="_blank" rel="noopener" className="f-btn f-btn--line" data-impact="small">
            Raw artefacts ↗
          </a>
        </div>
      </PageHead>

      <section className="f-section f-section--flush" aria-labelledby="e-domains">
        <div className="f-wrap">
          <h2 id="e-domains" className="f-label" style={{ marginBottom: 20 }}>
            Domain table · two Phala Cloud tdx.small CVMs · US-WEST-1
          </h2>
          <div className="f-tablewrap">
            <table className="f-table">
              <thead>
                <tr>
                  <th scope="col">Domain</th>
                  <th scope="col">Evidence</th>
                  <th scope="col">How it was checked</th>
                  <th scope="col">Negative control</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {DOMAINS.map((d) => (
                  <tr key={d.id} id={"anchor" in d ? d.anchor : d.id}>
                    <td className="f-mono">{d.id}</td>
                    <td>{d.evidence}</td>
                    <td>{d.method}</td>
                    <td>{d.negative}</td>
                    <td>
                      <StatusChip status="REAL" />
                    </td>
                  </tr>
                ))}
                <tr>
                  <td className="f-mono">anchor</td>
                  <td colSpan={3}>{claim("anchorAbsent")}</td>
                  <td>
                    <StatusChip status="ABSENT" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="f-label" style={{ marginTop: 20 }}>
            Verified outside the CVMs by phala-validation/closure-verify.mjs. {claim("onlineAttestation")}
          </p>
        </div>
      </section>

      <section className="f-section" aria-labelledby="e-tamper">
        <div className="f-wrap">
          <SectionHead id="e-tamper" label="Tamper matrix" title="Eleven single-field changes. Eleven failures." lead={claim("tamperMatrix")} />
          <ol className="f-cells" style={{ marginTop: 56, listStyle: "none", padding: 0 }}>
            {TAMPER.map((t, i) => (
              <li key={t}>
                <p className="f-label">T.{String(i + 1).padStart(2, "0")}</p>
                <p className="f-h3" style={{ marginTop: 10 }}>
                  {t}
                </p>
                <p className="f-label" style={{ marginTop: 10 }}>
                  ok: false
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="f-section" aria-labelledby="e-workload">
        <div className="f-wrap">
          <SectionHead id="e-workload" label="Workload change" title="Change the code, and the measurement says so." lead={claim("workloadChange")} />
          <div className="f-tablewrap" style={{ marginTop: 56 }}>
            <table className="f-table">
              <thead>
                <tr>
                  <th scope="col">Register</th>
                  <th scope="col">Deployment A → B</th>
                  <th scope="col">Result</th>
                </tr>
              </thead>
              <tbody>
                {WORKLOAD.map(([r, a, b]) => (
                  <tr key={r}>
                    <td className="f-mono">{r}</td>
                    <td>{a}</td>
                    <td>{b}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="f-label" style={{ marginTop: 20 }}>
            B against A&apos;s pin: rejected (rtmr3). B against B&apos;s pin: accepted. A&apos;s witnessed receipt re-verified after B was deployed: pass.
          </p>
        </div>
      </section>

      <section id="attestation" className="f-section" aria-labelledby="e-limits">
        <div className="f-wrap">
          <SectionHead id="e-limits" label="Stated with the evidence" title="What these runs do not show." />
          <div className="f-rows" style={{ marginTop: 56 }}>
            {(["cpuOnly", "devImage", "quoteFreshness", "witnessSameAccount", "manifestUnsigned", "fixtureTests"] as const).map((id) => (
              <div key={id} className="f-row">
                <span className="f-label">{id === "fixtureTests" ? "Scope" : "Limit"}</span>
                <p className="f-body">{CLAIMS[id].wording}</p>
                <StatusChip status={CLAIMS[id].status} />
              </div>
            ))}
          </div>
          <Link href="/limits" className="f-btn f-btn--line" style={{ marginTop: 32 }} data-impact="small">
            The full limits page
          </Link>
        </div>
      </section>

      <section className="f-section f-invert" aria-labelledby="e-repro">
        <div className="f-wrap f-grid">
          <div className="f-span-6 f-stack">
            <p className="f-label">Reproduce</p>
            <h2 id="e-repro" className="f-h2">
              Re-run the verification yourself.
            </h2>
            <p className="f-body">
              The raw quotes, receipts and verifier outputs are in the repository. The script re-verifies every domain
              from those files. Attestation goes through Phala&apos;s service online; everything else runs offline.
            </p>
          </div>
          <div className="f-span-6 f-stack" style={{ ["--stack" as string]: "12px" }}>
            <CopyCommand command="git clone https://github.com/Northwind-Cipher/cool-sdk" />
            <CopyCommand command="cd cool-sdk && npm ci && npm run build" />
            <CopyCommand command="node phala-validation/closure-verify.mjs artifacts/closure" />
            <p className="f-label">Outputs land in artifacts/closure/verification/.</p>
          </div>
        </div>
      </section>
    </>
  );
}
