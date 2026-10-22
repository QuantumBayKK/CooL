import type { Metadata } from "next";

import { HudFrame, StatusChip } from "@/components/film/HudFrame";
import { PageHead, SectionHead } from "@/components/film/SectionHead";
import { BOOKING_URL, claim } from "@/content/claims";

export const metadata: Metadata = {
  title: "Design partners",
  description:
    "Pilot CooL with the founders: a scoped deployment of tamper-evident, offline-verifiable AI change records, with honest expectations about what exists today.",
  alternates: { canonical: "/design-partners" },
};

const GET = [
  "A scoped pilot on one AI system you already run — prompts, models, policies or tool grants.",
  "Direct work with both founders; no account managers in between.",
  "Receipts your own auditors can verify offline, from day one.",
  "The hardware-attested path (Intel TDX on Phala Cloud) where your workload allows it.",
];

const EXPECT = [
  ["You would be among the first.", claim("customers")],
  ["Billing is not wired.", claim("billing")],
  ["No certifications yet.", claim("certifications")],
  ["Some domains are not proven.", claim("anchorAbsent")],
  ["It records, it does not judge.", claim("notCorrectness")],
] as const;

const STEPS = [
  ["01", "A 30-minute call", "Your system, your obligations, and whether CooL fits at all."],
  ["02", "Scope", "One system, one change type, a written definition of done."],
  ["03", "Install", "SDK or CLI in your release path. Receipts start landing."],
  ["04", "Review", "Your auditor verifies them offline. We fix what they find."],
];

export default function DesignPartnersPage() {
  return (
    <>
      <PageHead
        label="Design partners"
        title="Pilot it with the people who built it."
        lead="We are looking for a small number of teams running production AI in regulated settings."
      >
        <div className="f-btn-row">
          <a href={BOOKING_URL} target="_blank" rel="noopener" className="f-btn" data-impact="max">
            Book a 30-minute call ↗
          </a>
          <a href="mailto:pranauvshrinaath@northwindcipher.com?subject=CooL%20design%20partner" className="f-btn f-btn--line" data-impact="small">
            Email the founders
          </a>
        </div>
        <p className="f-label" style={{ marginTop: 16 }}>
          Booking opens cal.com in a new tab. There is no form on this site and nothing you type here is collected.
        </p>
      </PageHead>

      <section className="f-section f-section--flush" aria-labelledby="dp-get">
        <div className="f-wrap f-grid">
          <h2 id="dp-get" className="f-label f-span-3">
            What a pilot includes
          </h2>
          <ol className="f-span-8 f-rows" style={{ listStyle: "none", padding: 0 }}>
            {GET.map((g, i) => (
              <li key={g} className="f-row" style={{ gridTemplateColumns: "4rem minmax(0,1fr)" }}>
                <span className="f-label">{String(i + 1).padStart(2, "0")}</span>
                <p className="f-h3">{g}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="f-section" aria-labelledby="dp-expect">
        <div className="f-wrap">
          <SectionHead id="dp-expect" label="Truthful expectations" title="What you should know before the call." />
          <div className="f-grid" style={{ marginTop: 48 }}>
            {EXPECT.map(([t, d]) => (
              <HudFrame key={t} className="f-span-4 f-hud--fill" meta={<StatusChip status="ABSENT" />}>
                <h3 className="f-h3">{t}</h3>
                <p className="f-body f-small" style={{ marginTop: 12 }}>
                  {d}
                </p>
              </HudFrame>
            ))}
          </div>
        </div>
      </section>

      <section className="f-section f-invert" aria-labelledby="dp-steps">
        <div className="f-wrap">
          <SectionHead id="dp-steps" label="How it runs" title="Four steps." />
          <div className="f-cells" style={{ marginTop: 48 }}>
            {STEPS.map(([n, t, d]) => (
              <div key={n}>
                <p className="f-label">{n}</p>
                <p className="f-h3" style={{ marginTop: 12 }}>
                  {t}
                </p>
                <p className="f-body f-small" style={{ marginTop: 10 }}>
                  {d}
                </p>
              </div>
            ))}
          </div>
          <a href={BOOKING_URL} target="_blank" rel="noopener" className="f-btn" style={{ marginTop: 40 }} data-impact="full">
            Start with the call ↗
          </a>
        </div>
      </section>
    </>
  );
}
