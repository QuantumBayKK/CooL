"use client";

import Link from "next/link";
import { Play, ArrowRight } from "lucide-react";
import { Slide } from "@/components/Slide";
import { Reveal, GithubMark } from "@/components/ui";

/**
 * Slide 5 — proof, and the invitation to check it.
 *
 * The strongest thing on this slide is a link, not a claim: the demo runs the
 * published SDK in the reader's own browser. An investor who clicks it is doing
 * diligence, not watching a video.
 */

const WORKING: [string, string][] = [
  ["Cryptographic signatures", "hybrid post-quantum + classical, on every record"],
  ["Tamper-evident log", "real RFC 6962 Merkle tree with inclusion proofs"],
  ["Offline verifier", "anyone can check a record without trusting us"],
  ["Public SDK", "installable and inspectable on GitHub today"],
];

export default function S05Proof() {
  return (
    <Slide
      id="proof"
      no="05"
      kicker="Demo & proof"
      title="The hard part already works — and it's public."
      sub="Not a mockup and not a video. The cryptography runs in your browser, and the source is on GitHub under Apache-2.0."
      wide
    >
      <Reveal>
        <div className="frost-verify rounded-2xl border border-verify/35 p-4 sm:p-5">
          <p className="font-mono text-[11px] tracking-[0.16em] text-verify uppercase">
            Try it yourself
          </p>
          <p className="mt-2 text-[15.5px] leading-snug font-semibold text-ink">
            A real prompt change → captured → documented → sealed into a
            tamper-proof record → verified offline, by you, without trusting us.
          </p>
          <p className="mt-2 text-[13.5px] leading-relaxed text-fog">
            Then try to cheat: alter the record and watch the same verifier reject
            it, and tell you exactly which domain broke.
          </p>
          {/* One action. The console is in the nav for anyone who wants it —
              here, the only thing worth asking for is that they run it. */}
          <div className="mt-3.5">
            <Link
              href="/demo"
              prefetch
              className="inline-flex items-center gap-2 rounded-full bg-verify-deep px-5 py-3 font-mono text-[12.5px] text-white shadow-[0_0_22px_rgba(9,105,218,0.45)] transition-shadow hover:shadow-[0_0_34px_rgba(9,105,218,0.75)]"
            >
              <Play className="size-3.5" strokeWidth={2.4} /> Run it yourself
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </Reveal>

      <Reveal delay={0.12}>
        <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
          {WORKING.map(([what, how]) => (
            <div
              key={what}
              className="frost flex items-start gap-3 rounded-xl border border-live/25 px-3.5 py-3"
            >
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-live/50 bg-live/15 font-mono text-[10px] text-live">
                ✓
              </span>
              <p className="min-w-0 text-[13.5px] leading-snug text-fog">
                <span className="font-semibold text-ink">{what}</span> — {how}
              </p>
            </div>
          ))}
        </div>
      </Reveal>

      <Reveal delay={0.2}>
        <div className="mt-4 grid gap-3 sm:grid-cols-[1.1fr_0.9fr]">
          <div className="frost rounded-2xl border border-line px-4 py-4">
            <p className="font-mono text-[11px] tracking-[0.16em] text-verify uppercase">
              Open source
            </p>
            <div className="mt-2 space-y-1.5">
              {[
                ["cool-sdk", "mint and verify receipts"],
                ["cool-verifier", "the offline CLI auditors run"],
                ["cool-spec", "the format, threat model and conformance vectors"],
              ].map(([repo, what]) => (
                <a
                  key={repo}
                  href={`https://github.com/KenidoesCode/${repo}`}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-center gap-2 font-mono text-[12.5px] text-fog transition-colors hover:text-ink"
                >
                  <GithubMark className="size-3.5 shrink-0 text-mist" />
                  <span className="text-verify group-hover:underline">{repo}</span>
                  <span className="text-mist">— {what}</span>
                </a>
              ))}
            </div>
          </div>

          <div className="frost rounded-2xl border border-line px-4 py-4">
            <p className="font-mono text-[11px] tracking-[0.16em] text-verify uppercase">
              Founder&apos;s published research
            </p>
            <p className="mt-2 font-mono text-[13px] text-ink">ipsec-pqc-ikev2</p>
            <p className="mt-1 text-[13px] leading-relaxed text-fog">
              Real post-quantum cryptography in production networking code —
              mapping ML-KEM into IKEv2 (liboqs / C).
            </p>
          </div>
        </div>
      </Reveal>

      <Reveal delay={0.28}>
        <p className="mt-4 rounded-xl border border-mock/30 bg-panel/50 px-4 py-3 text-[13px] leading-relaxed text-mist">
          <span className="font-mono text-[11px] tracking-[0.14em] text-mock uppercase">
            What isn&apos;t done
          </span>
          <br />
          The hardware-attestation tier is mocked and reported as MOCK — never as
          a pass. This round finishes it. We would rather show you the gap than
          have you find it.
        </p>
      </Reveal>
    </Slide>
  );
}
