import type { Metadata } from "next";
import Link from "next/link";

import { CopyCommand } from "@/components/film/CopyCommand";
import { HudFrame } from "@/components/film/HudFrame";
import { PageHead, SectionHead } from "@/components/film/SectionHead";
import { NPM_URL, REPO_URL, claim } from "@/content/claims";

export const metadata: Metadata = {
  title: "Developers",
  description:
    "Install cool-nwc, record evidence with new CooL(), verify it with verifyEvidence(), and use the cool CLI. API, entry points, receipt format and threat model.",
  alternates: { canonical: "/developers" },
};

// All code, options and commands below are from the cool-nwc 3.0.0 README
// published on npm (https://unpkg.com/cool-nwc@3.0.0/README.md).
const QUICK = `import { CooL, verifyEvidence } from "cool-nwc";

const cool = new CooL({ applicationId: "my-app" });

const { evidence } = await cool.record({
  type: "model.execution",
  metadata: { model: "my-model", version: "1.0.0" },
  // optional — commit to sensitive data without storing it
  payloads: { input: "the request", output: "the response" },
});

const verdict = await verifyEvidence(evidence);
console.log(verdict.ok);                       // true
console.log(verdict.checks.signature.status);  // "pass"`;

const VERDICT = `{ ok: false,
  checks: { binding, signature, inclusion, witnesses, attestation, enclave, anchor },
  reasons: ["signature: ML-DSA-65 did not verify …"] }`;

const ENTRY = [
  ["cool-nwc", "CooL, verifyEvidence, formatVerdict, typed errors, crypto primitives"],
  ["cool-nwc/verify", "the standalone verifier only"],
  ["cool-nwc/phala", "the advanced tier: CoolTee, dstack clients, quote / anchor / witness / policy / disclosure"],
  ["cool-nwc/node", "filesystem-backed transparency log, unix-socket transport"],
  ["cool-nwc/tee", "everything, in one import"],
] as const;

const OPTIONS = [
  ["applicationId", "string", `"cool-app"`],
  ["attestation.provider", `"local" | "dstack"`, `"local" (or "dstack" if $COOL_DSTACK_ENDPOINT is set)`],
  ["attestation.endpoint", "string", "$COOL_DSTACK_ENDPOINT, then /var/run/dstack.sock"],
  ["security.requireAttestation", "boolean", "false"],
  ["security.expectedMeasurement", "Measurement", "— (pin the image you approved)"],
] as const;

const CLI = [
  ["cool verify evidence.json", "Offline; no enclave, no account. Exits non-zero on any failure."],
  ["cool doctor", "Node version, web crypto, dstack socket, round-trip."],
  ["cool walkthrough", "Learn the model by doing it, about three minutes."],
  ["cool seal …", "Seal a change."],
  ["cool records …", "Search the records you have."],
  ["cool pack build …", "Build the artefact an auditor asks for."],
  ["cool disclose …", "Open one committed field, provably."],
] as const;

export default function DevelopersPage() {
  return (
    <>
      <PageHead label="[ Developers ]" title="Record. Verify. Gate CI on it." lead={`${claim("packageVersion")} ${claim("noInstallScripts")}`}>
        <div className="f-btn-row">
          <CopyCommand command="npm install cool-nwc" />
          <a href={NPM_URL} target="_blank" rel="noopener" className="f-btn f-btn--line" data-impact="small">
            npm ↗
          </a>
          <a href={REPO_URL} target="_blank" rel="noopener" className="f-btn f-btn--line" data-impact="small">
            GitHub ↗
          </a>
        </div>
      </PageHead>

      <section className="f-section f-section--flush" style={{ paddingTop: 0 }} aria-labelledby="d-quick">
        <div className="f-wrap f-grid" style={{ alignItems: "start" }}>
          <div className="f-span-5 f-stack">
            <p className="f-label">[ 30-second quickstart ]</p>
            <h2 id="d-quick" className="f-h2">
              Two calls.
            </h2>
            <p className="f-body">
              <code className="f-mono">new CooL()</code> does no I/O. The first <code className="f-mono">record()</code>{" "}
              connects the evidence plane. {claim("simulatorLabel")}
            </p>
            <p className="f-body">{claim("saltedCommitments")}</p>
          </div>
          <div className="f-span-7 f-term">
            <div className="f-term__bar">
              <span>quickstart.ts</span>
              <span>cool-nwc 3.0.0 README</span>
            </div>
            <pre className="f-term__body" style={{ margin: 0, minHeight: 0 }}>
              <code>{QUICK}</code>
            </pre>
          </div>
        </div>
      </section>

      <section className="f-section" aria-labelledby="d-api">
        <div className="f-wrap">
          <SectionHead id="d-api" label="[ API ]" title="new CooL(options?)" />
          <div className="f-tablewrap" style={{ marginTop: 48 }}>
            <table className="f-table">
              <thead>
                <tr>
                  <th scope="col">Option</th>
                  <th scope="col">Type</th>
                  <th scope="col">Default</th>
                </tr>
              </thead>
              <tbody>
                {OPTIONS.map(([o, t, d]) => (
                  <tr key={o}>
                    <td className="f-mono">{o}</td>
                    <td className="f-mono">{t}</td>
                    <td className="f-mono">{d}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="f-grid" style={{ marginTop: 48, alignItems: "start" }}>
            <div className="f-span-6 f-stack">
              <h3 className="f-h3 f-mono">cool.record(input)</h3>
              <p className="f-body f-small">
                <code className="f-mono">{"{ type, executionId?, metadata?, payloads?, software?, gpu? }"}</code> →{" "}
                <code className="f-mono">{"{ evidence, recordId, executionId, digest }"}</code>. Metadata and every
                payload value are committed as salted hashes and discarded.
              </p>
              <h3 className="f-h3 f-mono">verifyEvidence(evidence, options?)</h3>
              <p className="f-body f-small">
                Returns a structured verdict — never a bare boolean. Each domain fails independently.{" "}
                <code className="f-mono">requireHardware</code> and <code className="f-mono">expectedMeasurement</code>{" "}
                turn simulator receipts and image mismatches into <code className="f-mono">ok: false</code>.
              </p>
            </div>
            <div className="f-span-6 f-term">
              <div className="f-term__bar">
                <span>Verdict</span>
              </div>
              <pre className="f-term__body" style={{ margin: 0, minHeight: 0 }}>
                <code>{VERDICT}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      <section className="f-section" aria-labelledby="d-entry">
        <div className="f-wrap">
          <SectionHead id="d-entry" label="[ Entry points ]" title="Import only what you need." />
          <div className="f-rows" style={{ marginTop: 48 }}>
            {ENTRY.map(([i, c]) => (
              <div key={i} className="f-row" style={{ gridTemplateColumns: "16rem minmax(0,1fr)" }}>
                <code className="f-mono">{i}</code>
                <p className="f-body f-small">{c}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="f-section" aria-labelledby="d-cli">
        <div className="f-wrap">
          <SectionHead id="d-cli" label="[ The cool command ]" title="npm install -g cool-nwc" />
          <div className="f-rows" style={{ marginTop: 48 }}>
            {CLI.map(([c, d]) => (
              <div key={c} className="f-row" style={{ gridTemplateColumns: "18rem minmax(0,1fr)" }}>
                <code className="f-mono">{c}</code>
                <p className="f-body f-small">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="receipt" className="f-section" aria-labelledby="d-docs">
        <div className="f-wrap">
          <SectionHead id="d-docs" label="[ Specification ]" title="Receipt format and threat model." />
          <div className="f-grid" style={{ marginTop: 48 }}>
            {[
              ["/docs/receipt-format", "Receipt format", "Every field of cool.receipt.v1, canonicalisation and commitments."],
              ["/docs/threat-model", "Threat model", "What an attacker can and cannot do, and where trust sits."],
              ["/docs/verify-it-yourself", "Verify it yourself", "Check a receipt with no account and no network."],
              ["/docs/quickstart", "Docs quickstart", "Wire capture into an existing application."],
            ].map(([href = "/docs", t, d]) => (
              <HudFrame key={href} className="f-span-3 f-hud--fill">
                <Link href={href} className="f-stack" style={{ display: "block", ["--stack" as string]: "12px" }} data-impact="small">
                  <span className="f-h3" style={{ display: "block" }}>
                    {t}
                  </span>
                  <span className="f-body f-small" style={{ display: "block" }}>
                    {d}
                  </span>
                  <span className="f-label" style={{ display: "block" }}>
                    Read →
                  </span>
                </Link>
              </HudFrame>
            ))}
          </div>
          <p className="f-label" style={{ marginTop: 24 }}>
            {claim("licence")}
          </p>
        </div>
      </section>
    </>
  );
}
