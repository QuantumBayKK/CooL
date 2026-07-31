"use client";

import { Station, Reveal } from "@/components/ui";
import Disclosure from "@/components/Disclosure";

const QA: { q: string; a: string; ev?: { label: string; href: string } }[] = [
  {
    q: "Does a receipt prove the answer is correct?",
    a: "No — and we won't pretend it does. A receipt proves what was computed: which model, which weights, which input, which output, when. Correctness, fairness and safety are judgment; we sell evidence. Anyone who claims cryptography proves an AI is \"right\" is selling you something else.",
    ev: { label: "What a receipt proves ↑", href: "#evidence" },
  },
  {
    q: "Why a blockchain and not a database?",
    a: "Three properties a database can't give you: tamper-resistance (an operator can rewrite a database; the chain can't be rewritten), public verifiability (a regulator can check a receipt years later without our infrastructure existing), and censorship resistance (nobody can block a valid attestation from being recorded). Base L2 gives Ethereum-grade permanence at cents per transaction.",
    ev: { label: "Try to delete a log row ↑", href: "#verify" },
  },
  {
    q: "TEEs have been broken before. Why is this secure?",
    a: "Correct — Intel SGX has a history of side-channel vulnerabilities, and we're upfront about it. Defense in depth: multiple TEE backends (Phala, NVIDIA CC, Nitro, TDX) so one vulnerable trust domain doesn't compromise the network, plus a ZK layer whose claim doesn't depend on the TEE at all, plus PQC channels so harvest-now-decrypt-later fails. No single break collapses the stack.",
    ev: { label: "Break a trust domain ↑", href: "#trust" },
  },
  {
    q: "What stops OpenAI or Google doing this themselves?",
    a: "Nothing — they probably will, for their own models. But being the prover and the verifier of your own work isn't verification, it's marketing. Regulated enterprises want vendor-neutral verification across every model they use, and the EU AI Act names third-party auditability for high-risk systems. CooL is built to be that neutral third party.",
  },
  {
    q: "Aren't you just a wrapper on Phala?",
    a: "Phala is one trust domain — plumbing. CooL adds the attestation contracts, the ZK layer, the PQC channels, multi-TEE orchestration, the OpenAI-compatible API and the verifiability standard itself. Saying we're a Phala wrapper is like saying Stripe is a wrapper on the card networks. The integration layer is the product.",
  },
  {
    q: "What's mocked today?",
    a: "TEE attestation (simulated quote until the Phala integration lands) and the Base anchor (demo transactions). Receipt signing (ML-DSA-65), the SDK, the offline verifier and the Merkle log are real. This site's verifier demo tells you which checks are live and which are demo data, inline.",
    ev: { label: "Full build board ↑", href: "#honesty" },
  },
];

export default function FAQ() {
  return (
    <Station
      id="faq"
      layer="03 · DUE DILIGENCE"
      station="§28 · FAQ"
      title="Every answer ends in evidence."
      sub="The questions investors and engineers actually ask — including the uncomfortable ones."
    >
      <div className="grid gap-3">
        {QA.map((x, i) => (
          <Reveal key={x.q} delay={i * 0.05}>
            <Disclosure
              summary={<span className="font-mono text-[13px] text-white">{x.q}</span>}
            >
              <p className="text-sm leading-relaxed text-mist">{x.a}</p>
              {x.ev && (
                <a
                  href={x.ev.href}
                  className="mt-3 inline-block font-mono text-xs text-verify"
                >
                  {x.ev.label}
                </a>
              )}
            </Disclosure>
          </Reveal>
        ))}
      </div>
    </Station>
  );
}
