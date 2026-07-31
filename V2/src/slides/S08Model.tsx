"use client";

import { Slide } from "@/components/Slide";
import { Reveal } from "@/components/ui";

/**
 * Slide 8 — how the money works, as a ladder.
 *
 * Ordered by commitment, cheapest first, so the land-and-expand motion is
 * visible without a diagram. The closing line is the positioning: we sell time
 * back, and the cryptography is why the claim holds.
 */

const TIERS: { tier: string; price: string; what: string; why: string }[] = [
  {
    tier: "Free SDK",
    price: "₹0",
    what: "Developers install it in under an hour and start capturing changes.",
    why: "Distribution and credibility. This is how we get in the door.",
  },
  {
    tier: "SaaS",
    price: "Monthly, per team",
    what: "Automated change management, governance and reporting on the dashboard.",
    why: "The team stops doing the paperwork. This is where the pain actually ends.",
  },
  {
    tier: "Enterprise platform",
    price: "Annual licence",
    what: "Org-wide, with SSO, policy enforcement and audit-grade evidence.",
    why: "CooL becomes the standard the whole company runs AI changes through.",
  },
  {
    tier: "Professional services",
    price: "Project",
    what: "Integrations, private and on-prem deployment, support.",
    why: "How regulated and air-gapped buyers get over the line.",
  },
];

export default function S08Model() {
  return (
    <Slide
      id="model"
      no="08"
      kicker="Business model"
      title="Free to adopt. Paid to scale. Enterprise to standardise."
      sub="A developer can start alone in an afternoon. The company pays when it wants the work to stop being manual across every team."
      wide
    >
      <div className="frost overflow-hidden rounded-2xl border border-line">
        {TIERS.map((t, i) => (
          <Reveal key={t.tier} delay={i * 0.06}>
            <div
              className={`px-4 py-4 sm:px-5 ${i > 0 ? "border-t border-line" : ""}`}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-[15px] font-semibold text-ink">{t.tier}</p>
                <span className="font-mono text-[11.5px] text-verify">{t.price}</span>
              </div>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-fog">{t.what}</p>
              <p className="mt-1 text-[13px] leading-relaxed text-mist">{t.why}</p>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal delay={0.28}>
        <p className="mt-4 rounded-xl border border-verify/30 bg-verify/[0.07] px-4 py-3.5 text-[14.5px] leading-relaxed text-fog">
          We sell{" "}
          <span className="font-semibold text-ink">
            time saved and audits de-risked
          </span>
          . The cryptography is why it holds up under scrutiny — never the reason
          anyone buys.
        </p>
      </Reveal>
    </Slide>
  );
}
