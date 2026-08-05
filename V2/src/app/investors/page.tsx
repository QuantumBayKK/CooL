import type { Metadata } from "next";
import Link from "next/link";
import { InvestorGate } from "@/components/essay/InvestorGate";
import { CONTACT } from "@/lib/contact";

/**
 * The investor page, gated.
 *
 * `noindex` is the part that actually does the work. The gate stops a customer
 * wandering into fundraising material; this stops Google indexing the SAFE
 * terms, which was always the realistic risk — a crawler that never sees the
 * page cannot surface the raise next to the product.
 *
 * The long keynote-style technical diligence still exists, at
 * /investors/diligence. This page is the short one, and it is the one carrying
 * the ask.
 */
export const metadata: Metadata = {
  title: "Investors",
  description:
    "Access-controlled. The raise, use of funds, roadmap and validation for Northwind Cipher Pvt. Ltd.",
  alternates: { canonical: "/investors" },
  robots: { index: false, follow: false, nocache: true },
};

const FUNDS = [
  ["Human Resources", 30],
  ["Engineering & R&D", 25],
  ["Go-to-Market", 15],
  ["Infrastructure", 12],
  ["Compliance & Legal", 8],
  ["Marketing", 6],
  ["Buffer", 4],
] as const;

const ROADMAP = [
  ["0–2 months", "finish the hardware-attestation tier; ship the MVP (SDK + CI + evidence log + dashboard)."],
  ["2–6 months", "first paid pilots with regulated-AI design partners; convert discovery into signed LOIs."],
  ["6–9 months", "convert pilots to recurring SaaS; first enterprise conversations."],
  ["9–12 months", "raise the seed round on real usage and revenue."],
] as const;

const VALIDATION = [
  {
    quote:
      "As AI adoption grows in BFSI, an additional cryptographic verification layer for sensitive AI decisions would be valuable…",
    who: "Lokesh G.A.",
    role: "Head of Product Solutions & Strategy, Jio Payments",
  },
  {
    quote:
      "The idea is technically sound and aligns with the need to securely protect enterprise AI execution…",
    who: "Proneet Nibedit",
    role: "Technical Lead, Backend Engineering, PayU",
  },
  {
    quote:
      "A cryptographically verifiable trust layer for AI is definitely a real problem worth solving.",
    who: "Alluri Siddhartha",
    role: "Research & Engineering, Ritual",
  },
  {
    quote:
      "…as AI moves onto confidential infrastructure, a verification layer like this becomes genuinely valuable.",
    who: "Ayush Kumar Yadav",
    role: "Backend Engineer (ex-Marlin / Oyster)",
  },
  {
    quote:
      "As AI systems become increasingly autonomous, this problem becomes much more relevant.",
    who: "Ojas Tripathi",
    role: "Associate Software Engineer, PayU",
  },
];

export default function InvestorsPage() {
  return (
    <div className="essay">
      <InvestorGate>
        {/* 7a · the ask */}
        <section id="ask">
          <div className="wrap">
            <h1 className="opener">
              ₹1 Cr pre-seed — SAFE, ₹10 Cr post-money cap. A twelve-month
              runway to seed.
            </h1>
            <p className="body">
              What it buys: MVP → first paid pilots → recurring revenue →
              seed-ready traction.
            </p>
          </div>
        </section>

        {/* 7b · use of funds */}
        <section id="funds">
          <div className="wrap">
            <h2 className="opener">Use of funds</h2>
            <div style={{ width: "100%", marginTop: "var(--s2)" }}>
              {FUNDS.map(([label, pct]) => (
                <div key={label} style={{ marginBottom: "var(--s2)", textAlign: "left" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "clamp(14px,3.6vw,16px)",
                      marginBottom: "5px",
                    }}
                  >
                    <span>{label}</span>
                    <span className="accent" style={{ fontWeight: 700 }}>
                      {pct}%
                    </span>
                  </div>
                  {/* The bar IS the number: its width is the percentage, so the
                      picture cannot drift away from the figure beside it. */}
                  <div
                    style={{
                      height: "6px",
                      borderRadius: "999px",
                      background: "rgba(240,246,252,0.08)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${pct}%`,
                        height: "100%",
                        background: "var(--accent)",
                        borderRadius: "999px",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 7c · roadmap */}
        <section id="roadmap">
          <div className="wrap">
            <h2 className="opener">Roadmap</h2>
            <div style={{ textAlign: "left", marginTop: "var(--s2)" }}>
              {ROADMAP.map(([when, what]) => (
                <p key={when} className="body">
                  <strong className="accent">{when}</strong> — {what}
                </p>
              ))}
            </div>
          </div>
        </section>

        {/* 7d · validation */}
        <section id="validation" className="tall">
          <div className="wrap">
            <h2 className="opener">Industry validation</h2>
            <div style={{ textAlign: "left", marginTop: "var(--s2)" }}>
              {VALIDATION.map((v) => (
                <blockquote
                  key={v.who}
                  style={{
                    margin: "0 0 var(--s3)",
                    paddingLeft: "var(--s2)",
                    borderLeft: "2px solid rgba(91,140,255,0.5)",
                  }}
                >
                  <p className="body" style={{ fontStyle: "italic", marginBottom: "6px" }}>
                    &ldquo;{v.quote}&rdquo;
                  </p>
                  <p className="tiny" style={{ margin: 0 }}>
                    <strong style={{ color: "var(--paper)" }}>{v.who}</strong>, {v.role}
                  </p>
                </blockquote>
              ))}
            </div>
            <p className="body">
              Now progressing from customer discovery to commercial validation —
              pilot and LOI discussions underway.
            </p>
          </div>
        </section>

        {/* the honesty note — never removed */}
        <section id="honesty">
          <div className="wrap">
            <h2 className="opener">What is not true yet.</h2>
            <p className="body">
              0 paying customers and 0 signed LOIs today. The validation above
              is real conversations, not commitments. Pilot and LOI discussions
              are underway. The hardware-attestation tier is being finished, and
              the verifier reports it as simulated until it runs in a
              confidential VM.
            </p>
            <p className="body">
              Named partners and clouds are shared on the call, not written
              here.
            </p>
            <p className="tiny">
              <Link href="/investors/diligence" style={{ color: "var(--accent)" }}>
                Technical diligence
              </Link>{" "}
              ·{" "}
              <a href={`mailto:${CONTACT.email}`} style={{ color: "var(--accent)" }}>
                {CONTACT.email}
              </a>{" "}
              ·{" "}
              <Link href="/" style={{ color: "var(--accent)" }}>
                Back to the site
              </Link>
            </p>
          </div>
        </section>
      </InvestorGate>
    </div>
  );
}
