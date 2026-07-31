"use client";

import { Station, Reveal, Glass } from "@/components/ui";
import ScrollTextReveal from "@/components/ScrollTextReveal";

const FORCES = [
  {
    k: "01 · Regulation",
    t: "The regulatory wave",
    d: "EU AI Act in force with verifiability requirements for high-risk systems. HIPAA extending to AI-assisted decisions. FINRA model-governance rules. India's DPDP. By 2027, regulated industries can't deploy AI without a cryptographic audit trail.",
  },
  {
    k: "02 · Trust",
    t: "The trust collapse",
    d: "2025: a healthcare-AI vendor silently downgraded its model; a fraud-detection \"AI\" turned out to be a rule-based system in a trench coat. The procurement question changed overnight — from \"is your AI accurate?\" to \"how do we verify?\"",
  },
  {
    k: "03 · Primitives",
    t: "The stack got real",
    d: "NVIDIA Confidential Compute shipped at scale. Phala's TEE network hit mainnet. NIST standardized ML-KEM & ML-DSA (August 2024). ZK proving became economically practical for inference-sized workloads.",
  },
];

export default function WhyNow() {
  return (
    <Station
      id="why-now"
      layer="01 · THE MOVIE"
      station="Why now"
      title="Three forces, one collision course."
      sub="This is a now-problem, not a future-problem. Three forces converge in 2026–27:"
    >
      <div className="grid gap-3">
        {FORCES.map((f, i) => (
          <Reveal key={f.k} delay={i * 0.08}>
            <Glass className="p-4">
              <p className="font-mono text-[10px] tracking-[0.2em] text-verify uppercase">
                {f.k}
              </p>
              <p className="mt-1.5 font-mono text-sm text-white">{f.t}</p>
              <p className="mt-2 text-sm leading-relaxed text-mist">{f.d}</p>
            </Glass>
          </Reveal>
        ))}
      </div>
      <ScrollTextReveal
        className="display mt-10 text-[clamp(1.4rem,5.5vw,2.1rem)] text-white"
        segments={[
          { text: "Eighteen months ago this wasn’t buildable." },
          { text: "Today it is.", className: "text-verify" },
        ]}
      />
    </Station>
  );
}
