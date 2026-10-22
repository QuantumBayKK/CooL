import type { Metadata } from "next";
import Link from "next/link";

import { CodeTabs } from "@/components/film/CodeTabs";
import { Ecosystem } from "@/components/film/Ecosystem";
import { EvidenceSequence } from "@/components/film/EvidenceSequence";
import { Hero } from "@/components/film/Hero";
import { HudFrame, StatusChip } from "@/components/film/HudFrame";
import { Icon, IconTile } from "@/components/film/Icons";
import { Reveal } from "@/components/film/Reveal";
import { SectionHead } from "@/components/film/SectionHead";
import { VerdictTerminal } from "@/components/film/VerdictTerminal";
import { BOOKING_URL, CLAIMS, EVIDENCE_URL, claim } from "@/content/claims";
import { AUDIENCES, COMPARISON, FAQ, PRODUCTS, QUESTIONS, STATEMENT, UPDATES } from "@/content/copy";

export const metadata: Metadata = {
  title: { absolute: "Northwind Cipher — CooL, verifiable records for AI change" },
  description:
    "CooL by Northwind Cipher seals every AI change — prompts, models, policies, tool grants — as a post-quantum signed receipt anyone can verify offline. Verified on Intel TDX hardware via Phala Cloud.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Northwind Cipher — CooL, proof of what your AI did",
    description: "Signed, offline-verifiable receipts for every change to your AI.",
    url: "/",
  },
};

const STEPS = [
  {
    n: 1,
    title: "Install",
    body: "One package with the SDK, the CLI and the offline verifier. No postinstall scripts, five runtime dependencies.",
    file: "terminal",
    code: "$ npm i -g cool-nwc\n$ cool doctor\n# checks Node, web crypto, the dstack\n# socket, and a full round-trip",
  },
  {
    n: 2,
    title: "Record",
    body: "Capture each change as it ships. Prompts and outputs are committed as salted hashes and discarded.",
    file: "record.ts",
    code: 'const { evidence } = await cool.record({\n  type: "model.execution",\n  metadata: { model: "my-model" },\n});',
  },
  {
    n: 3,
    title: "Verify",
    body: "Anyone checks the receipt on their own machine — no account, no network. CI can gate on the exit code.",
    file: "terminal",
    code: "$ cool verify evidence.json\n  OK  binding      valid\n  OK  signature    valid\n  OK  inclusion    valid",
  },
] as const;

const TABS = [
  {
    label: "TypeScript",
    file: "quickstart.ts",
    code: `import { CooL, verifyEvidence } from "cool-nwc";

const cool = new CooL({ applicationId: "refund-agent" });

const { evidence } = await cool.record({
  type: "model.execution",
  metadata: { model: "my-model", version: "1.0.0" },
  payloads: { input: "the request", output: "the response" },
});

const verdict = await verifyEvidence(evidence);
verdict.ok;                        // true
verdict.checks.attestation.status; // "simulated" without hardware — never "pass"`,
  },
  {
    label: "CLI",
    file: "terminal",
    code: `$ npm install -g cool-nwc
$ cool walkthrough          # learn the model in ~3 minutes
$ cool seal …               # seal a change
$ cool records …            # search what you have
$ cool verify evidence.json # offline; exits non-zero on any failure
$ cool pack build …         # the artefact an auditor asks for`,
  },
  {
    label: "Production (TDX)",
    file: "production.ts",
    code: `import { CooL } from "cool-nwc";

const cool = new CooL({
  applicationId: "refund-agent",
  attestation: { provider: "dstack" },          // Intel TDX via Phala dstack
  security: {
    requireAttestation: true,
    expectedMeasurement: PINNED_MEASUREMENT,    // the image you reviewed
  },
});`,
  },
] as const;

const AUDIENCE_ICONS = ["code", "scale", "eye"] as const;

export default function Home() {
  return (
    <>
      <Hero />

      {/* trust strip */}
      <div className="f-trust" role="region" aria-label="Standards and programmes">
        <div className="f-wrap f-trust__in">
          <p className="f-trust__label">Built on open standards and confidential hardware</p>
          <div className="f-trust__items">
            <span>
              <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#76B900" d="M8.948 8.798v-1.43a6.7 6.7 0 0 1 .424-.018c3.922-.124 6.493 3.374 6.493 3.374s-2.774 3.851-5.75 3.851c-.398 0-.787-.062-1.158-.185v-4.346c1.528.185 1.837.857 2.747 2.385l2.04-1.714s-1.492-1.952-4-1.952a6.016 6.016 0 0 0-.796.035m0-4.735v2.138l.424-.027c5.45-.185 9.01 4.47 9.01 4.47s-4.08 4.964-8.33 4.964c-.37 0-.733-.035-1.095-.097v1.325c.3.035.61.062.91.062 3.957 0 6.82-2.023 9.593-4.408.459.371 2.34 1.263 2.73 1.652-2.633 2.208-8.772 3.984-12.253 3.984-.335 0-.653-.018-.971-.053v1.864H24V4.063zm0 10.326v1.131c-3.657-.654-4.673-4.46-4.673-4.46s1.758-1.944 4.673-2.262v1.237H8.94c-1.528-.186-2.73 1.245-2.73 1.245s.68 2.412 2.739 3.11M2.456 10.9s2.164-3.197 6.5-3.533V6.201C4.153 6.59 0 10.653 0 10.653s2.35 6.802 8.948 7.42v-1.237c-4.84-.6-6.492-5.936-6.492-5.936z" />
              </svg>
              NVIDIA Inception
            </span>
            <span>
              {/* eslint-disable-next-line @next/next/no-img-element -- static SVG logo */}
              <img src="/partners/phala-white.svg" alt="Phala" width={69} height={24} />
            </span>
            <span>Intel TDX</span>
            <span>ML-DSA-65 · FIPS 204</span>
            <span>RFC 6962</span>
          </div>
        </div>
      </div>

      {/* problem */}
      <section className="f-section" aria-labelledby="s-q">
        <div className="f-wrap">
          <SectionHead id="s-q" label="The problem" title={STATEMENT.title} lead={STATEMENT.body} />
          <ol className="f-cells" style={{ marginTop: 48, listStyle: "none", padding: 0 }}>
            {QUESTIONS.map((q, i) => (
              <Reveal as="li" key={q.q}>
                <p className="f-label">Question {i + 1}</p>
                <p className="f-h3" style={{ marginTop: 12 }}>
                  {q.q}
                </p>
                <p className="f-body f-small" style={{ marginTop: 10 }}>
                  {q.a}
                </p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* product */}
      <section className="f-section f-alt" aria-labelledby="s-product">
        <div className="f-wrap">
          <SectionHead
            id="s-product"
            label="Product"
            title="Four parts. One record you can prove."
            lead="Capture the change, seal it into a receipt, prove where it was made, and let anyone check it."
          />
          <ul className="f-grid" style={{ marginTop: 48, listStyle: "none", padding: 0 }}>
            {PRODUCTS.map((p) => (
              <HudFrame as="li" key={p.id} className="f-span-3 f-hud--fill">
                <Link href={p.href} style={{ display: "flex", flexDirection: "column", gap: 14, height: "100%" }}>
                  <IconTile name={p.id} />
                  <span className="f-tile-name">{p.name}</span>
                  <span className="f-body f-small">{p.body}</span>
                  <span className="f-small" style={{ marginTop: "auto", color: "var(--brand)", fontWeight: 550 }}>
                    Learn more →
                  </span>
                </Link>
              </HudFrame>
            ))}
          </ul>
        </div>
      </section>

      {/* how it works */}
      <section className="f-section" aria-labelledby="s-how">
        <div className="f-wrap">
          <SectionHead id="s-how" label="How it works" title="From change to proof in three steps." center />
          <ol className="f-steps" style={{ marginTop: 56, listStyle: "none", padding: 0 }}>
            {STEPS.map((s) => (
              <Reveal as="li" key={s.n} className="f-step">
                <span className="f-step__n">{s.n}</span>
                <h3 className="f-h3">{s.title}</h3>
                <p className="f-body f-small">{s.body}</p>
                <div className="f-term" style={{ marginTop: "auto" }}>
                  <div className="f-term__bar">
                    <span>{s.file}</span>
                  </div>
                  <pre className="f-term__body" style={{ margin: 0, minHeight: 132 }}>
                    <code>{s.code}</code>
                  </pre>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* pipeline */}
      <section id="pipeline" className="f-section f-alt" aria-labelledby="s-pipeline">
        <div className="f-wrap">
          <SectionHead
            id="s-pipeline"
            label="Under the hood"
            title="Six stages, each one independently checkable."
            lead="Every stage maps to a verifier domain that can fail on its own — so a failure tells you exactly what broke."
          />
          <div style={{ marginTop: 48 }}>
            <EvidenceSequence />
          </div>
        </div>
      </section>

      {/* live verifier */}
      <section className="f-section f-invert" aria-labelledby="s-verify">
        <div className="f-wrap f-grid" style={{ alignItems: "center" }}>
          <div className="f-span-5 f-stack">
            <p className="f-label" style={{ color: "#a9c6f5" }}>
              Try it
            </p>
            <h2 id="s-verify" className="f-h2">
              Don&apos;t trust us. Break a receipt.
            </h2>
            <p className="f-body">{claim("browserVerifier")}</p>
            <p className="f-body">
              Press <b style={{ color: "#fff" }}>Tamper one byte</b>: one hex digit of one committed hash flips, the
              verifier runs again, and the exact domains that break are shown. Nothing here is a canned result.
            </p>
            <p className="f-small" style={{ display: "flex", gap: 10, alignItems: "flex-start", color: "var(--on-dark-2)" }}>
              <StatusChip status="MOCK" />
              <span>{claim("browserAttestationMock")}</span>
            </p>
            <div className="f-btn-row">
              <Link href="/verify" className="f-btn">
                Verify your own receipt
              </Link>
            </div>
          </div>
          <div className="f-span-7">
            <VerdictTerminal />
          </div>
        </div>
      </section>

      {/* evidence */}
      <section className="f-section" aria-labelledby="s-evidence">
        <div className="f-wrap">
          <SectionHead
            id="s-evidence"
            label="Evidence"
            title="Measured on real hardware. Published with its limits."
            lead={
              <>
                Two Phala Cloud Intel TDX confidential VMs, verified from outside the enclave.{" "}
                <a className="f-link" href={EVIDENCE_URL} target="_blank" rel="noopener">
                  Read the full matrix
                </a>
                .
              </>
            }
          />
          <div className="f-cells" style={{ marginTop: 48 }}>
            {[
              ["7/7", "verification domains verified on Intel TDX"],
              ["11", "tamper-matrix rows, each failing the expected domain"],
              ["36/36", "consistency pairs verified against enclave-signed heads"],
              ["119", "SDK fixture tests passing, 0 skipped"],
            ].map(([v, l]) => (
              <Reveal key={l}>
                <p className="f-stat">{v}</p>
                <p className="f-body f-small" style={{ marginTop: 10 }}>
                  {l}
                </p>
              </Reveal>
            ))}
          </div>
          <div className="f-rows" style={{ marginTop: 40 }}>
            {(["anchorAbsent", "cpuOnly", "witnessSameAccount", "quoteFreshness"] as const).map((id) => (
              <div key={id} className="f-row" style={{ gridTemplateColumns: "minmax(0,1fr) auto" }}>
                <p className="f-body">{CLAIMS[id].wording}</p>
                <StatusChip status={CLAIMS[id].status} />
              </div>
            ))}
          </div>
          <div className="f-btn-row" style={{ marginTop: 28 }}>
            <Link href="/evidence" className="f-btn">
              All evidence
            </Link>
            <Link href="/limits" className="f-btn f-btn--line">
              Every limit
            </Link>
          </div>
        </div>
      </section>

      {/* comparison */}
      <section className="f-section f-alt" aria-labelledby="s-compare">
        <div className="f-wrap">
          <SectionHead id="s-compare" label="Why receipts" title={COMPARISON.title} />
          <div className="f-tablewrap" style={{ marginTop: 40 }}>
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
                    <th scope="row">{q}</th>
                    <td>{a}</td>
                    <td style={{ color: "var(--ink)", fontWeight: 550 }}>
                      <span style={{ display: "inline-flex", gap: 8, alignItems: "flex-start" }}>
                        <Icon name="check" className="f-btn__arrow" />
                        {b}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="f-small f-muted" style={{ marginTop: 16 }}>
            {claim("notCorrectness")}
          </p>
        </div>
      </section>

      {/* audiences */}
      <section className="f-section" aria-labelledby="s-who">
        <div className="f-wrap">
          <SectionHead id="s-who" label="Who it is for" title="Three teams read the same receipt." center />
          <div className="f-grid" style={{ marginTop: 48 }}>
            {AUDIENCES.map((a, i) => (
              <HudFrame key={a.who} className="f-span-4 f-hud--fill">
                <IconTile name={AUDIENCE_ICONS[i] ?? "check"} />
                <h3 className="f-h3" style={{ marginTop: 16 }}>
                  {a.who}
                </h3>
                <p className="f-body f-small" style={{ marginTop: 8 }}>
                  {a.body}
                </p>
              </HudFrame>
            ))}
          </div>
        </div>
      </section>

      {/* ecosystem */}
      <section className="f-section f-alt" aria-labelledby="s-eco">
        <div className="f-wrap">
          <SectionHead id="s-eco" label="Ecosystem" title="Built with the people building confidential AI." />
          <div style={{ marginTop: 40 }}>
            <Ecosystem />
          </div>
        </div>
      </section>

      {/* developers */}
      <section className="f-section" aria-labelledby="s-dev">
        <div className="f-wrap f-grid" style={{ alignItems: "start" }}>
          <div className="f-span-5 f-stack">
            <p className="f-label" style={{ color: "var(--brand)" }}>
              Developers
            </p>
            <h2 id="s-dev" className="f-h2">
              One package. Two calls.
            </h2>
            <p className="f-body">
              {claim("packageVersion")} {claim("noTelemetry")}
            </p>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10 }}>
              {["TypeScript SDK, CLI and offline verifier", "Five runtime dependencies, no install scripts", "Typed errors with stable codes and actions"].map((t) => (
                <li key={t} className="f-small" style={{ display: "flex", gap: 10, color: "var(--ink-2)" }}>
                  <Icon name="check" className="f-btn__arrow" />
                  {t}
                </li>
              ))}
            </ul>
            <div className="f-btn-row">
              <Link href="/developers" className="f-btn">
                Read the docs
              </Link>
              <Link href="/verify" className="f-btn f-btn--line">
                Try the verifier
              </Link>
            </div>
          </div>
          <div className="f-span-7">
            <CodeTabs tabs={TABS} />
          </div>
        </div>
      </section>

      {/* faq */}
      <section className="f-section f-alt" aria-labelledby="s-faq">
        <div className="f-wrap f-grid">
          <div className="f-span-4">
            <SectionHead id="s-faq" label="FAQ" title="Questions people ask twice." />
          </div>
          <div className="f-span-8 f-faq">
            {FAQ.map((f) => (
              <details key={f.q}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* updates */}
      <section className="f-section" aria-labelledby="s-updates">
        <div className="f-wrap">
          <SectionHead id="s-updates" label="Changelog" title="Dated, and only what happened." />
          <ol className="f-rows" style={{ marginTop: 40, listStyle: "none", padding: 0 }}>
            {UPDATES.map((u) => (
              <li key={u.date + u.title} className="f-row" style={{ gridTemplateColumns: "8.5rem minmax(0,1fr)" }}>
                <time className="f-label" dateTime={u.date} style={{ paddingTop: 3 }}>
                  {u.date}
                </time>
                <p className="f-body" style={{ color: "var(--ink)" }}>
                  {u.title}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* cta */}
      <section className="f-section f-invert" aria-labelledby="s-cta">
        <div className="f-wrap f-grid" style={{ alignItems: "center" }}>
          <div className="f-span-7">
            <h2 id="s-cta" className="f-h1">
              Run the verifier. Then try to break it.
            </h2>
            <p className="f-lead" style={{ marginTop: 16 }}>
              Everything on this site that can be checked, can be checked by you.
            </p>
          </div>
          <div className="f-span-5 f-btn-row" style={{ justifyContent: "flex-end" }}>
            <Link href="/verify" className="f-btn">
              Verify a receipt
            </Link>
            <a href={BOOKING_URL} target="_blank" rel="noopener" className="f-btn f-btn--line">
              Book a demo
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
