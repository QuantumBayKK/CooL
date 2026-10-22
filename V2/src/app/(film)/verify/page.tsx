import type { Metadata } from "next";

import { CopyCommand } from "@/components/film/CopyCommand";
import { StatusChip } from "@/components/film/HudFrame";
import { ReceiptDrop } from "@/components/film/ReceiptDrop";
import { PageHead } from "@/components/film/SectionHead";
import { claim } from "@/content/claims";

export const metadata: Metadata = {
  title: "Verify a receipt",
  description:
    "Run the real CooL verifier in your browser against published conformance vectors, tamper with one byte, or drop your own receipt. Nothing is uploaded.",
  alternates: { canonical: "/verify" },
};

const CHECKED = [
  ["binding", "Recomputes the binding hash from the canonical record and compares it."],
  ["signature", "Verifies ML-DSA-65 and Ed25519 over the binding. Both must pass."],
  ["inclusion", "Checks the audit path against the signed tree head, when the receipt carries one."],
] as const;

const NOT_CHECKED = [
  ["attestation", "MOCK", "The sample vectors were sealed without hardware. A browser cannot produce or fully check an Intel TDX quote."],
  ["witnesses", "ABSENT", "No external witness signatures are bundled with these receipts."],
  ["anchor", "ABSENT", "No public-chain anchor is checked here."],
  ["consistency · enclave", "ABSENT", "These are cool.receipt.v2 domains, checked by the SDK verifier — see /evidence for the hardware results."],
] as const;

export default function VerifyPage() {
  return (
    <>
      <PageHead
        label="Verify"
        title="Check a receipt yourself."
        lead={`${claim("browserVerifier")} ${claim("browserAttestationMock")}`}
      />

      <section className="f-section f-section--flush" aria-label="Verifier">
        <div className="f-wrap">
          <ReceiptDrop />
        </div>
      </section>

      <section className="f-section" aria-labelledby="v-scope">
        <div className="f-wrap f-grid">
          <div className="f-span-6">
            <p className="f-label">Checked in this browser</p>
            <h2 id="v-scope" className="f-h3" style={{ marginTop: 14 }}>
              What runs here
            </h2>
            <div className="f-rows" style={{ marginTop: 24 }}>
              {CHECKED.map(([d, t]) => (
                <div key={d} className="f-row">
                  <span className="f-label">{d}</span>
                  <p className="f-body f-small">{t}</p>
                  <StatusChip status="REAL" />
                </div>
              ))}
            </div>
          </div>
          <div className="f-span-6">
            <p className="f-label">Not proven here</p>
            <h2 className="f-h3" style={{ marginTop: 14 }}>
              What this page cannot tell you
            </h2>
            <div className="f-rows" style={{ marginTop: 24 }}>
              {NOT_CHECKED.map(([d, s, t]) => (
                <div key={d} className="f-row">
                  <span className="f-label">{d}</span>
                  <p className="f-body f-small">{t}</p>
                  <StatusChip status={s} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="f-section" aria-labelledby="v-cli">
        <div className="f-wrap f-grid">
          <div className="f-span-6 f-stack">
            <p className="f-label">Offline, on your machine</p>
            <h2 id="v-cli" className="f-h2">
              Or use the CLI.
            </h2>
            <p className="f-body">
              <code className="f-mono">cool verify</code> runs with no account and no network, and exits non-zero on any
              failure — the code a CI job gates on. {claim("packageVersion")}
            </p>
          </div>
          <div className="f-span-6 f-stack" style={{ ["--stack" as string]: "12px" }}>
            <CopyCommand command="npm i -g cool-nwc" />
            <CopyCommand command="cool verify evidence.json" />
            <CopyCommand command="cool doctor" />
          </div>
        </div>
      </section>
    </>
  );
}
