import type { Metadata } from "next";

import { CopyCommand } from "@/components/film/CopyCommand";
import { HudFrame, StatusChip } from "@/components/film/HudFrame";
import { PageHead, SectionHead } from "@/components/film/SectionHead";
import { BOOKING_URL, claim } from "@/content/claims";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "CooL launch pricing: a free developer tier, Pro and Team plans and usage-based sealing. Verifying is always free. Billing is not live yet.",
  alternates: { canonical: "/pricing" },
};

/**
 * Transcribed from the signed-off pricing page (public/pricing.html, checked
 * 2026-10-20). Items that do not exist yet carry `planned: true` and render a
 * PLANNED chip, and Gate 2 reserved wording for isolated deployments is avoided.
 */
type Feature = { t: string; planned?: boolean };
const PLANS: readonly {
  name: string;
  price: string;
  per: string;
  who: string;
  features: readonly Feature[];
  cta: "install" | "call";
  flag?: string;
}[] = [
  {
    name: "Free · Developer",
    price: "$0",
    per: "per month, forever",
    who: "For trying CooL and building the first integration.",
    features: [
      { t: "1,000 sealed changes / month" },
      { t: "Unlimited offline verification" },
      { t: "30-day log retention" },
      { t: "1 developer seat" },
      { t: "Community support" },
    ],
    cta: "install",
  },
  {
    name: "Pro",
    price: "$39",
    per: "per month, billed annually ($49 monthly)",
    who: "For developers and small teams shipping AI changes.",
    features: [
      { t: "20,000 sealed changes / month, then $2.00 per 1,000" },
      { t: "1-year retention · 3 seats" },
      { t: "Policy engine + selective disclosure" },
      { t: "Audit-pack export" },
      { t: "Email support" },
    ],
    cta: "call",
  },
  {
    name: "Team",
    price: "$299",
    per: "per month, billed annually ($349 monthly)",
    who: "For teams standardising AI change governance.",
    features: [
      { t: "200,000 sealed changes / month, then $1.50 per 1,000" },
      { t: "Unlimited retention · 10 seats ($15/seat beyond)" },
      { t: "Witnesses + public-chain anchoring", planned: true },
      { t: "SSO (OIDC) + RBAC", planned: true },
      { t: "High-assurance sealing (hosted tier)", planned: true },
      { t: "Priority support" },
    ],
    cta: "call",
    flag: "Most popular",
  },
  {
    name: "Enterprise",
    price: "Custom",
    per: "annual, org-wide licence",
    who: "For regulated organisations deploying CooL as their system of record.",
    features: [
      { t: "Volume sealed-change pricing" },
      { t: "On-prem, single-tenant VPC or air-gapped deployment", planned: true },
      { t: "SAML SSO + SCIM · DPA", planned: true },
      { t: "BAA at general availability", planned: true },
      { t: "Dedicated support, SLA at general availability", planned: true },
    ],
    cta: "call",
  },
];

const METER = [
  ["Standard sealed change", "Software signing + append to the transparency log", "$2.00 per 1,000 · $0.002 each", false],
  ["High-assurance sealed change", "Sealed inside Intel TDX on Phala Cloud, so attestation and enclave verify against a real quote", "$20.00 per 1,000 · $0.02 each", true],
  ["Offline verification", "No account, no network, no limit — for you or your auditor", "Free forever", false],
  ["Extended log retention", "Beyond included retention", "$0.50 per 100,000 records / month", false],
  ["Additional seat (Team)", "Beyond the 10 included", "$15.00 per seat / month", false],
] as const;

const VOLUME = [
  ["First 1,000 — every account, every plan", "Free"],
  ["Up to 1M", "$2.00"],
  ["1M – 10M", "$1.50"],
  ["10M – 50M", "$1.00"],
  ["50M+", "Custom"],
] as const;

const BILLS = [
  { name: "Solo developer, evaluating", lines: [["800 sealed changes", "included"], ["verification", "$0.00"], ["plan", "Free"]], total: "$0" },
  {
    name: "Pro team, shipping weekly",
    lines: [["Pro plan", "$39.00"], ["20,000 included", "$0.00"], ["40,000 overage @ $2.00/k", "$80.00"], ["verification", "$0.00"]],
    total: "$119",
  },
  {
    name: "Team, governing several AI products",
    lines: [["Team plan", "$299.00"], ["200,000 included", "$0.00"], ["300,000 overage @ $1.50/k", "$450.00"], ["50,000 high-assurance @ $20/k", "$1,000.00"], ["verification", "$0.00"]],
    total: "$1,749",
    note: "Includes the high-assurance line so the arithmetic is complete — that tier bills only once the hosted hardware tier opens. Until then the same customer pays $749.",
  },
] as const;

const FAQ = [
  ["What exactly is a sealed change?", "One change to your AI — a prompt edit, a model swap, a policy change, a granted tool, or a captured governance event — serialised deterministically, hashed, signed and appended to the transparency log. One provable record, one unit on the meter."],
  ["Why is verification free?", "Because the whole promise is “don't trust us — verify it yourself.” Charging for that would put a toll booth in front of the one thing that makes the product credible."],
  ["Why does high-assurance cost ten times more?", "It consumes real confidential-compute capacity, passed through with margin. The hardware path is validated on Phala Cloud — the evidence is in the SDK repo — and it bills only once the hosted tier opens."],
  ["Do failed or duplicate changes count?", "No. You are billed only for changes that successfully seal into the log."],
  ["What happens at my plan's limit?", "Pro and Team continue on usage-based overage. Free caps: sealing pauses until the next cycle or an upgrade, but verification keeps working."],
  ["Can I pay you today?", "Not yet, and we would rather say so than take an order we can't fulfil. Paid tiers route to a conversation. The Developer tier and the verifier are live now."],
] as const;

export default function PricingPage() {
  return (
    <>
      <PageHead label="Pricing" title="Start free. Pay only to seal." lead="Verifying is always free — offline, with no account, for anyone.">
        <HudFrame index="Billing status" meta={<StatusChip status="ABSENT" />}>
          <p className="f-h3">{claim("billing")}</p>
          <p className="f-body f-small" style={{ marginTop: 10 }}>
            The Developer tier and the offline verifier work right now. Paid tiers route to a conversation until hosted
            billing is wired.
          </p>
        </HudFrame>
      </PageHead>

      <section className="f-section f-section--flush" aria-label="Plans">
        <div className="f-wrap">
          <ul className="f-grid" style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {PLANS.map((p) => (
              <HudFrame as="li" key={p.name} index={p.flag ?? p.name.split(" ")[0]} className={`f-span-3 f-hud--fill${p.flag ? " f-invert" : ""}`}>
                <div className="f-stack" style={{ ["--stack" as string]: "14px", display: "flex", flexDirection: "column", height: "100%" }}>
                  <h2 className="f-label">{p.name}</h2>
                  <p className="f-h1" style={{ fontSize: "clamp(2.5rem, 1.5rem + 2vw, 3.5rem)" }}>
                    {p.price}
                  </p>
                  <p className="f-label">{p.per}</p>
                  <p className="f-body f-small">{p.who}</p>
                  <ul style={{ listStyle: "none", padding: 0, margin: "8px 0 0" }}>
                    {p.features.map((f) => (
                      <li key={f.t} className="f-small" style={{ padding: "8px 0", borderTop: "1px solid var(--w-24)", display: "flex", justifyContent: "space-between", gap: 8 }}>
                        <span>{f.t}</span>
                        {f.planned && <StatusChip status="PLANNED" />}
                      </li>
                    ))}
                  </ul>
                  <div style={{ marginTop: "auto", paddingTop: 16 }}>
                    {p.cta === "install" ? (
                      <CopyCommand command="npm i -g cool-nwc" />
                    ) : (
                      <a href={BOOKING_URL} target="_blank" rel="noopener" className="f-btn" data-impact="full" style={{ width: "100%", justifyContent: "center" }}>
                        Talk to us ↗
                      </a>
                    )}
                  </div>
                </div>
              </HudFrame>
            ))}
          </ul>
        </div>
      </section>

      <section className="f-section" aria-labelledby="p-meter">
        <div className="f-wrap">
          <SectionHead
            id="p-meter"
            label="The meter"
            title="One unit: a sealed change."
            lead="You are billed only for changes that successfully seal. One record, one unit."
          />
          <div className="f-tablewrap" style={{ marginTop: 48 }}>
            <table className="f-table">
              <thead>
                <tr>
                  <th scope="col">Item</th>
                  <th scope="col">What it is</th>
                  <th scope="col">Price</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {METER.map(([i, d, p, planned]) => (
                  <tr key={i}>
                    <td>{i}</td>
                    <td>{d}</td>
                    <td className="f-mono">{p}</td>
                    <td>{planned ? <StatusChip status="PLANNED" /> : null}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="f-grid" style={{ marginTop: 56 }}>
            <div className="f-span-6">
              <h3 className="f-label">Volume discounts, applied automatically</h3>
              <table className="f-table" style={{ marginTop: 16 }}>
                <tbody>
                  {VOLUME.map(([v, p]) => (
                    <tr key={v}>
                      <td>{v}</td>
                      <td className="f-mono">{p}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="f-body f-small f-span-6">
              Standard sealing is a light CPU-and-storage operation, so it is priced for adoption. High-assurance sealing
              runs on real confidential hardware and is priced as that cost plus margin — roughly ten times the standard
              rate — and bills only once the hosted hardware tier opens.
            </p>
          </div>
        </div>
      </section>

      <section className="f-section" aria-labelledby="p-bills">
        <div className="f-wrap">
          <SectionHead id="p-bills" label="In practice" title="What a bill looks like." lead="Three shapes of usage, worked through. Verification is $0 in every one." />
          <div className="f-grid" style={{ marginTop: 48 }}>
            {BILLS.map((b) => (
              <HudFrame key={b.name} className="f-span-4 f-hud--fill">
                <h3 className="f-h3">{b.name}</h3>
                <dl className="f-mono f-small" style={{ margin: "16px 0 0" }}>
                  {b.lines.map(([k, v]) => (
                    <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "6px 0", borderBottom: "1px solid var(--w-12)" }}>
                      <dt className="f-muted">{k}</dt>
                      <dd style={{ margin: 0 }}>{v}</dd>
                    </div>
                  ))}
                </dl>
                <p className="f-h2" style={{ marginTop: 16 }}>
                  {b.total}
                  <span className="f-label"> / month</span>
                </p>
                {"note" in b && (
                  <p className="f-label" style={{ marginTop: 12 }}>
                    {b.note}
                  </p>
                )}
              </HudFrame>
            ))}
          </div>
        </div>
      </section>

      <section className="f-section" aria-labelledby="p-faq">
        <div className="f-wrap f-grid">
          <h2 id="p-faq" className="f-label f-span-3">
            Pricing questions
          </h2>
          <div className="f-span-8">
            {FAQ.map(([q, a]) => (
              <details key={q} style={{ borderBottom: "1px solid var(--w-24)" }}>
                <summary className="f-h3" style={{ padding: "22px 0", cursor: "pointer" }}>
                  {q}
                </summary>
                <p className="f-body" style={{ paddingBottom: 22 }}>
                  {a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
