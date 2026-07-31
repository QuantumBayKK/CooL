"use client";

import { Station, Reveal, Glass } from "@/components/ui";
import Disclosure from "@/components/Disclosure";
import InteractivePortrait from "@/components/InteractivePortrait";
import Ticker from "@/components/Ticker";

const PRINCIPLES = [
  "Don't trust us. Verify.",
  "Evidence must outlive companies.",
  "Operator resistance is the product.",
  "Proof > trust.",
  "Standards over cleverness.",
  "Infrastructure should disappear.",
];

export default function Founders() {
  return (
    <Station
      id="founders"
      layer="03 · DUE DILIGENCE"
      station="§26+§18 · Founders"
      title="Not resumes. Obsessions."
      sub="Pre-seed means you're betting on people. Here's exactly who we are — including the parts a polished site would hide."
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Reveal>
          <Glass className="h-full overflow-hidden rounded-2xl">
            <InteractivePortrait
              src="/founders/pranauv.jpg"
              alt="Pranauv S, CEO"
              initials="PS"
              className="h-52 w-full"
            />
            <div className="p-4">
              <p className="font-mono text-sm text-white">Pranauv S — CEO</p>
              <p className="mt-0.5 font-mono text-[11px] text-mist">
                cryptography &amp; protocol design
              </p>
              <div className="mt-3">
                <Disclosure
                  summary={<span className="font-mono text-xs text-verify">Why I&rsquo;m obsessed</span>}
                  className="border-0 bg-transparent"
                >
                  <p className="text-sm leading-relaxed text-mist">
                    Came in from applied cryptography: built{" "}
                    <span className="text-fog">ipsec-pqc-ikev2</span> — an
                    open-source research prototype mapping NIST&rsquo;s ML-KEM
                    into the IPsec key exchange, in C with liboqs, aligned with
                    NIST PQC guidance and the IETF post-quantum drafts. Shipped
                    Solidity in production (RationChain — on-chain identity
                    against welfare fraud). Rust CLIs, full-stack TypeScript
                    daily. 19, second-year B.Tech, and honest about it —{" "}
                    <span className="text-fog">
                      early dressed up as late is the one lie this company can
                      never tell.
                    </span>
                  </p>
                </Disclosure>
              </div>
            </div>
          </Glass>
        </Reveal>

        <Reveal delay={0.08}>
          <Glass className="h-full overflow-hidden rounded-2xl">
            <InteractivePortrait
              src="/founders/kailosh.jpg"
              alt="Kailosh K, CTO"
              initials="KK"
              className="h-52 w-full"
            />
            <div className="p-4">
              <p className="font-mono text-sm text-white">Kailosh K — CTO</p>
              <p className="mt-0.5 font-mono text-[11px] text-mist">
                systems &amp; runtime engineering
              </p>
              <div className="mt-3">
                <Disclosure
                  summary={<span className="font-mono text-xs text-verify">How I think</span>}
                  className="border-0 bg-transparent"
                >
                  <p className="text-sm leading-relaxed text-mist">
                    Owns the runtime end-to-end: the SDK, the verifier, the
                    append-only log, the enclave orchestration. Operating
                    principle:{" "}
                    <span className="text-fog">
                      every component must be independently checkable — if
                      trusting CooL is required for CooL to work, we built the
                      wrong thing.
                    </span>
                  </p>
                </Disclosure>
              </div>
            </div>
          </Glass>
        </Reveal>
      </div>

      <Reveal delay={0.12}>
        <p className="mt-10 mb-3 font-mono text-[11px] tracking-[0.18em] text-mist uppercase">
          §18 · Engineering principles — beliefs, not features
        </p>
        <Ticker seconds={34}>
          {PRINCIPLES.map((p) => (
            <span
              key={p}
              className="glass shrink-0 rounded-full px-4 py-2 font-mono text-xs whitespace-nowrap text-fog"
            >
              &ldquo;{p}&rdquo;
            </span>
          ))}
        </Ticker>
      </Reveal>
    </Station>
  );
}
