import type { Metadata } from "next";
import Link from "next/link";

import { HudFrame, StatusChip } from "@/components/film/HudFrame";
import { IconTile } from "@/components/film/Icons";
import { PageHead, SectionHead } from "@/components/film/SectionHead";
import { claim } from "@/content/claims";

export const metadata: Metadata = {
  title: "Use cases",
  description:
    "Where verifiable AI change records matter: model risk in financial services, agent permissions, prompt governance, model supply chain, audit evidence and record-keeping obligations.",
  alternates: { canonical: "/use-cases" },
};

/**
 * Use cases, not customer stories: CooL has no paying customers yet
 * (claims.ts → customers), so this page describes where the product fits and
 * never implies a deployment that has not happened.
 */
const CASES = [
  {
    tag: "Financial services",
    icon: "scale",
    title: "Model risk and change control",
    body: "Supervisors expect documented, defensible records of what a model was and when it changed. Each model swap, retrain or threshold change becomes a receipt your model-risk team can verify.",
  },
  {
    tag: "AI agents",
    icon: "key",
    title: "Agent permissions and tool grants",
    body: "When an agent gains a tool or a wider scope, seal the grant with who approved it. If something goes wrong, the permission history is provable, not reconstructed.",
  },
  {
    tag: "Prompt governance",
    icon: "receipts",
    title: "Which prompt was live",
    body: "System prompts change often and quietly. Receipts commit to each version under a signed tree head, so “what was live on the 14th” has an answer anyone can check.",
  },
  {
    tag: "Model supply chain",
    icon: "layers",
    title: "Weights and provider changes",
    body: "Record the model identity and weights hash with every change, across providers. A silent swap breaks the signature on any receipt that claims otherwise.",
  },
  {
    tag: "Audit",
    icon: "eye",
    title: "Evidence as an export",
    body: "Instead of assembling evidence by hand, hand auditors an audit pack they verify themselves, offline, with no account.",
  },
  {
    tag: "Record-keeping",
    icon: "clock",
    title: "Automatic logging obligations",
    body: "Rules such as the EU AI Act's record-keeping article call for automatic recording over a system's lifetime. CooL produces that record continuously — it does not on its own make a system compliant.",
  },
  {
    tag: "Confidential AI",
    icon: "cpu",
    title: "Prove where it ran",
    body: "Running inside Intel TDX, receipts carry a quote binding the measured image to the signing key — evidence of which code produced the record.",
  },
  {
    tag: "Vendor due diligence",
    icon: "verifier",
    title: "Checking an AI vendor",
    body: "Ask a vendor for receipts rather than assurances. Your security team verifies them with the open command, without trusting the vendor or us.",
  },
] as const;

export default function UseCasesPage() {
  return (
    <>
      <PageHead
        label="Use cases"
        title="Where provable AI change records matter."
        lead="CooL fits wherever someone will later ask what an AI system was, what changed, and whether the record was touched."
      >
        <p className="f-small" style={{ display: "flex", gap: 10, alignItems: "flex-start", color: "var(--ink-3)", maxWidth: 640 }}>
          <StatusChip status="ABSENT" />
          <span>{claim("customers")} These are the situations CooL is built for, not customer case studies.</span>
        </p>
      </PageHead>

      <section className="f-section f-section--flush">
        <div className="f-wrap">
          <ul className="f-grid" style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {CASES.map((c) => (
              <HudFrame as="li" key={c.title} className="f-span-6 f-hud--fill">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <IconTile name={c.icon} />
                  <span className="f-chip f-chip--planned" style={{ textTransform: "none", letterSpacing: 0 }}>
                    {c.tag}
                  </span>
                </div>
                <h2 className="f-h3" style={{ marginTop: 16 }}>
                  {c.title}
                </h2>
                <p className="f-body f-small" style={{ marginTop: 8 }}>
                  {c.body}
                </p>
              </HudFrame>
            ))}
          </ul>
        </div>
      </section>

      <section className="f-section f-invert">
        <div className="f-wrap f-grid" style={{ alignItems: "center" }}>
          <div className="f-span-7">
            <SectionHead label="Design partners" title="Have one of these problems? Pilot CooL with us." />
          </div>
          <div className="f-span-5 f-btn-row" style={{ justifyContent: "flex-end" }}>
            <Link href="/contact" className="f-btn">
              Book a demo
            </Link>
            <Link href="/design-partners" className="f-btn f-btn--line">
              How pilots work
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
