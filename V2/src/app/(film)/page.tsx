import type { Metadata } from "next";
import Link from "next/link";

import { BlackBoxHero } from "@/components/film/BlackBoxHero";
import { CopyCommand } from "@/components/film/CopyCommand";
import { Ecosystem } from "@/components/film/Ecosystem";
import { EvidenceSequence } from "@/components/film/EvidenceSequence";
import { FlightTape } from "@/components/film/FlightTape";
import { HudFrame, StatusChip } from "@/components/film/HudFrame";
import { RecorderSequence } from "@/components/film/RecorderSequence";
import { Reveal } from "@/components/film/Reveal";
import { SectionHead } from "@/components/film/SectionHead";
import { SplitFlapCounter } from "@/components/film/SplitFlapCounter";
import { VerdictTerminal } from "@/components/film/VerdictTerminal";
import { BOOKING_URL, CLAIMS, EVIDENCE_URL, claim } from "@/content/claims";
import {
  AUDIENCES,
  COMPARISON,
  FINAL,
  PRODUCTS,
  QUESTIONS,
  STATEMENT,
  UPDATES,
} from "@/content/copy";

export const metadata: Metadata = {
  title: { absolute: "Northwind Cipher — CooL, the flight recorder for AI change" },
  description:
    "CooL by Northwind Cipher seals every AI change — prompts, models, policies, tool grants — as a hybrid post-quantum signed receipt anyone can verify offline. Verified on Intel TDX hardware via Phala Cloud.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Northwind Cipher — CooL, proof of what your AI did",
    description: "Signed, verifiable receipts for AI changes. Run the verifier and try to break it.",
    url: "/",
  },
};

const QUICKSTART = `import { CooL, verifyEvidence } from "cool-nwc";

const cool = new CooL({ applicationId: "refund-agent" });

const { evidence } = await cool.record({
  type: "model.execution",
  metadata: { model: "my-model", version: "1.0.0" },
  payloads: { input: "the request", output: "the response" },
});

const verdict = await verifyEvidence(evidence);
verdict.ok;                       // true
verdict.checks.attestation.status; // "simulated" without hardware — never "pass"`;

export default function Home() {
  return (
    <>
      <BlackBoxHero />
      <FlightTape />

      {/* 01 · statement */}
      <section className="f-section f-section--flush" aria-labelledby="s-statement">
        <div className="f-wrap">
          <SectionHead id="s-statement" label={STATEMENT.label} title={STATEMENT.title} lead={STATEMENT.body} />
        </div>
      </section>

      {/* 02 · questions */}
      <section className="f-section" aria-labelledby="s-questions">
        <div className="f-wrap">
          <SectionHead
            id="s-questions"
            label="[ 02 · Questions ]"
            title="The questions that arrive after something goes wrong."
          />
          <ol className="f-cells" style={{ marginTop: 64, listStyle: "none", padding: 0 }}>
            {QUESTIONS.map((q, i) => (
              <Reveal as="li" key={q.q}>
                <p className="f-label">Q.{String(i + 1).padStart(2, "0")}</p>
                <p className="f-h3" style={{ marginTop: 16 }}>
                  {q.q}
                </p>
                <p className="f-body f-small" style={{ marginTop: 14 }}>
                  {q.a}
                </p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* 03 · product */}
      <section className="f-section" aria-labelledby="s-product">
        <div className="f-wrap">
          <SectionHead id="s-product" label="[ 03 · Product ]" title="Four parts. One record." />
          <ul className="f-grid" style={{ marginTop: 64, listStyle: "none", padding: 0 }}>
            {PRODUCTS.map((p) => (
              <HudFrame as="li" key={p.id} index={p.index} className="f-span-3 f-hud--fill">
                <Link href={p.href} className="f-stack" style={{ display: "block" }} data-impact="small">
                  <span className="f-tile-name">{p.name}</span>
                  <span className="f-body f-small" style={{ display: "block" }}>
                    {p.body}
                  </span>
                  <span className="f-label" style={{ display: "block" }}>
                    Open →
                  </span>
                </Link>
              </HudFrame>
            ))}
          </ul>
        </div>
      </section>

      {/* Sequence A */}
      <RecorderSequence />

      {/* 04 · how it works — Sequence B */}
      <section id="pipeline" className="f-section" aria-labelledby="s-pipeline">
        <div className="f-wrap">
          <SectionHead
            id="s-pipeline"
            label="[ 04 · How it works ]"
            title="Six stages, each one checkable."
            lead="Scroll through the pipeline. Every stage maps to a verifier domain that can fail on its own — which is what makes a failure diagnostic instead of merely alarming."
          />
          <div style={{ marginTop: 64 }}>
            <EvidenceSequence />
          </div>
        </div>
      </section>

      {/* 05 · verifier — Sequence C, an inversion moment */}
      <section className="f-section f-invert" aria-labelledby="s-verify">
        <div className="f-wrap">
          <div className="f-grid" style={{ alignItems: "start" }}>
            <div className="f-span-5 f-stack">
              <p className="f-label">[ 05 · Verify it here ]</p>
              <h2 id="s-verify" className="f-h2">
                Don&apos;t trust us. Break a receipt.
              </h2>
              <p className="f-body">{claim("browserVerifier")}</p>
              <p className="f-body">
                Press <b>Tamper one byte</b>: one hex digit of one committed hash flips, the verifier runs again, and
                the exact domains that break are shown. Nothing here is a canned result.
              </p>
              <p className="f-label">
                <StatusChip status="MOCK" /> {claim("browserAttestationMock")}
              </p>
              <Link href="/verify" className="f-btn" data-impact="full">
                Verify your own receipt
              </Link>
            </div>
            <div className="f-span-7">
              <VerdictTerminal />
            </div>
          </div>
        </div>
      </section>

      {/* 06 · evidence studies */}
      <section className="f-section f-section--flush" aria-labelledby="s-evidence">
        <div className="f-wrap">
          <SectionHead
            id="s-evidence"
            label="[ 06 · Evidence ]"
            title="Measured on real hardware. Published with its limits."
            lead={
              <>
                Two Phala Cloud Intel TDX confidential VMs, verified outside the enclave.{" "}
                <a className="f-link" href={EVIDENCE_URL} target="_blank" rel="noopener">
                  Read the full matrix ↗
                </a>
              </>
            }
          />
          <div className="f-cells" style={{ marginTop: 64 }}>
            <Reveal>
              <SplitFlapCounter value="7/7" label="Verification domains verified on Intel TDX" />
            </Reveal>
            <Reveal>
              <SplitFlapCounter value="11" label="Tamper-matrix rows, each failing the expected domain" />
            </Reveal>
            <Reveal>
              <SplitFlapCounter value="36/36" label="Consistency pairs verified against enclave-signed heads" />
            </Reveal>
            <Reveal>
              <SplitFlapCounter value="119" label="Fixture tests passing, 0 skipped — software, not silicon" />
            </Reveal>
          </div>
          <div className="f-rows" style={{ marginTop: 48 }}>
            {(["anchorAbsent", "cpuOnly", "witnessSameAccount", "quoteFreshness"] as const).map((id) => (
              <div key={id} className="f-row">
                <span className="f-label">Limit</span>
                <p className="f-body">{CLAIMS[id].wording}</p>
                <StatusChip status={CLAIMS[id].status} />
              </div>
            ))}
          </div>
          <div className="f-btn-row" style={{ marginTop: 32 }}>
            <Link href="/evidence" className="f-btn" data-impact="full">
              All evidence
            </Link>
            <Link href="/limits" className="f-btn f-btn--line" data-impact="small">
              Every limit
            </Link>
          </div>
        </div>
      </section>

      <FlightTape />

      {/* 07 · comparison */}
      <section className="f-section f-section--flush" aria-labelledby="s-compare">
        <div className="f-wrap">
          <SectionHead id="s-compare" label="[ 07 · Comparison ]" title={COMPARISON.title} />
          <div className="f-tablewrap" style={{ marginTop: 64 }}>
            <table className="f-table">
              <thead>
                <tr>
                  <th scope="col">Question</th>
                  <th scope="col">A log you keep</th>
                  <th scope="col">A CooL receipt</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.rows.map(([q, a, b]) => (
                  <tr key={q}>
                    <th scope="row" style={{ fontFamily: "var(--f-display)", fontSize: "0.9375rem", textTransform: "none", letterSpacing: 0, color: "inherit", fontWeight: 500 }}>
                      {q}
                    </th>
                    <td>{a}</td>
                    <td style={{ color: "var(--w)" }}>{b}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="f-label" style={{ marginTop: 20 }}>
            {claim("notCorrectness")}
          </p>
        </div>
      </section>

      {/* 08 · audiences */}
      <section className="f-section" aria-labelledby="s-who">
        <div className="f-wrap">
          <SectionHead id="s-who" label="[ 08 · Who it is for ]" title="Three people read the same receipt." />
          <div className="f-grid" style={{ marginTop: 64 }}>
            {AUDIENCES.map((a) => (
              <HudFrame key={a.who} index={a.index.replace(/[[\]\s]/g, "")} className="f-span-4 f-hud--fill">
                <h3 className="f-h3">{a.who}</h3>
                <p className="f-body f-small" style={{ marginTop: 14 }}>
                  {a.body}
                </p>
              </HudFrame>
            ))}
          </div>
        </div>
      </section>

      {/* 09 · ecosystem */}
      <section className="f-section" aria-labelledby="s-eco">
        <div className="f-wrap">
          <SectionHead id="s-eco" label="[ 09 · Ecosystem ]" title="Built on confidential computing." />
          <div style={{ marginTop: 64 }}>
            <Ecosystem />
          </div>
        </div>
      </section>

      {/* 10 · developers */}
      <section className="f-section" aria-labelledby="s-dev">
        <div className="f-wrap">
          <div className="f-grid" style={{ alignItems: "start" }}>
            <div className="f-span-5 f-stack">
              <p className="f-label">[ 10 · Developers ]</p>
              <h2 id="s-dev" className="f-h2">
                One package. Thirty seconds.
              </h2>
              <p className="f-body">
                {claim("packageVersion")} {claim("runtimeDeps")} {claim("noTelemetry")}
              </p>
              <div className="f-btn-row">
                <CopyCommand command="npm i -g cool-nwc" />
                <Link href="/developers" className="f-btn f-btn--line" data-impact="small">
                  Developer docs
                </Link>
              </div>
            </div>
            <div className="f-span-7">
              <div className="f-term">
                <div className="f-term__bar">
                  <span>quickstart.ts · cool-nwc 3.0.0</span>
                  <span>from the published README</span>
                </div>
                <pre className="f-term__body" style={{ margin: 0, minHeight: 0 }}>
                  <code>{QUICKSTART}</code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 11 · updates */}
      <section className="f-section" aria-labelledby="s-updates">
        <div className="f-wrap">
          <SectionHead id="s-updates" label="[ 11 · Log ]" title="Dated, and only what happened." />
          <ol className="f-rows" style={{ marginTop: 64, listStyle: "none", padding: 0 }}>
            {UPDATES.map((u) => (
              <li key={u.date + u.title} className="f-row">
                <time className="f-label" dateTime={u.date}>
                  {u.date}
                </time>
                <p className="f-body" style={{ color: "var(--w)" }}>
                  {u.title}
                </p>
                <span className="f-label">{u.source}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* final */}
      <section className="f-section f-invert" aria-labelledby="s-final">
        <div className="f-wrap">
          <p className="f-label">[ End of tape ]</p>
          <h2 id="s-final" className="f-display" style={{ marginTop: 24, fontSize: "clamp(2.75rem, 1rem + 6vw, 8rem)" }}>
            {FINAL.title}
          </h2>
          <p className="f-lead" style={{ marginTop: 28 }}>
            {FINAL.body}
          </p>
          <div className="f-btn-row" style={{ marginTop: 40 }}>
            <Link href="/verify" className="f-btn" data-impact="full">
              Run the verifier
            </Link>
            <a href={BOOKING_URL} target="_blank" rel="noopener" className="f-btn f-btn--line" data-impact="small">
              Book a call ↗
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
