import Link from "next/link";

import { BOOKING_URL, EVIDENCE_URL } from "@/content/claims";
import { HERO } from "@/content/copy";

import { CopyCommand } from "./CopyCommand";
import { Icon } from "./Icons";

/**
 * The hero: the promise on the left, the proof on the right.
 *
 * The panel is not a mock-up of a UI we hope to build — every row is a
 * domain result from the published Phala Cloud Intel TDX run
 * (artifacts/closure-verification-matrix.md), including the one that did not
 * pass: anchor is reported absent, and the panel says so.
 */
const ROWS = [
  ["binding", "record hashes to the signed digest"],
  ["signature", "ML-DSA-65 + Ed25519, both valid"],
  ["inclusion", "leaf proven under a signed tree head"],
  ["consistency", "log only grew — 36 of 36 pairs"],
  ["witness", "independent CVM co-signed the head"],
  ["attestation", "Intel TDX quote, bound to the key"],
  ["enclave", "MRTD + RTMR0–3 match the pin"],
] as const;

export function Hero() {
  return (
    <section className="f-hero" aria-labelledby="hero-title">
      <div className="f-dots" aria-hidden="true" />
      <div className="f-wrap f-hero__grid">
        <div>
          <span className="f-eyebrow">
            <i aria-hidden="true" />
            {HERO.eyebrow}
          </span>
          <h1 id="hero-title" className="f-display" style={{ marginTop: 22 }}>
            {HERO.title}
          </h1>
          <p className="f-lead" style={{ marginTop: 22 }}>
            {HERO.lead}
          </p>
          <div className="f-btn-row" style={{ marginTop: 32 }}>
            <Link href="/verify" className="f-btn">
              Verify a receipt
              <Icon name="arrow" className="f-btn__arrow" />
            </Link>
            <a href={BOOKING_URL} target="_blank" rel="noopener" className="f-btn f-btn--line">
              Book a demo
            </a>
          </div>
          <div style={{ marginTop: 16, maxWidth: 360 }}>
            <CopyCommand command={HERO.install} />
          </div>
          <div className="f-hero__meta">
            {HERO.points.map((p) => (
              <span key={p}>
                <Icon name="check" />
                {p}
              </span>
            ))}
          </div>
        </div>

        <figure className="f-panel" style={{ margin: 0 }} aria-labelledby="panel-cap">
          <div className="f-panel__bar">
            <span className="f-panel__dots" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <span>cool verify receipt.json</span>
          </div>
          <ul className="f-panel__rows">
            {ROWS.map(([name, desc]) => (
              <li key={name} className="f-panel__row">
                <span className="f-panel__ok" aria-hidden="true">
                  <Icon name="check" />
                </span>
                <span className="f-panel__name">{name}</span>
                <span className="f-panel__desc">{desc}</span>
                <span className="f-chip f-chip--pass">Pass</span>
              </li>
            ))}
            <li className="f-panel__row">
              <span className="f-panel__ok f-panel__ok--muted" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                  <path d="M6 12h12" />
                </svg>
              </span>
              <span className="f-panel__name">anchor</span>
              <span className="f-panel__desc">public-chain anchor not proven</span>
              <span className="f-chip f-chip--absent">Absent</span>
            </li>
          </ul>
          <figcaption id="panel-cap" className="f-panel__foot">
            <span>
              <b>7 / 7 verified</b> on Intel TDX · Phala Cloud
            </span>
            <a className="f-link" href={EVIDENCE_URL} target="_blank" rel="noopener">
              Published run
            </a>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
