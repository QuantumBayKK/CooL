"use client";

import { Slide } from "@/components/Slide";
import { Reveal } from "@/components/ui";

/**
 * Slide 6 — practitioners, in their own words.
 *
 * Quotes are verbatim and attributed in full, including the honest framing that
 * these are discovery conversations rather than signed commitments. The closing
 * line states exactly where the pipeline stands, because overstating it here is
 * the fastest way to lose a diligence conversation later.
 */

const VOICES: { quote: string; name: string; role: string; tag: string }[] = [
  {
    quote:
      "As AI adoption grows in BFSI, an additional cryptographic verification layer for sensitive AI decisions would be valuable. Banking and financial institutions dealing with regulated customer data would definitely be interested in evaluating such a solution.",
    name: "Lokesh G.A.",
    role: "Head of Product Solutions & Strategy, Jio Payments",
    tag: "FinTech",
  },
  {
    quote:
      "The idea is technically sound and aligns with the need to securely protect enterprise AI execution while keeping sensitive data within the company's own environment. This is the kind of product that would first be evaluated by engineering and product teams before moving through enterprise procurement.",
    name: "Proneet Nibedit",
    role: "Technical Lead — Backend Engineering, PayU",
    tag: "Payments",
  },
  {
    quote:
      "Having built confidential computing infrastructure for over three years, I've seen how difficult the trust and verification layer is. CooL's backend SDK tackles this directly, and as AI moves onto confidential infrastructure, a verification layer like this becomes genuinely valuable.",
    name: "Ayush Kumar Yadav",
    role: "Backend Engineer (ex-Marlin Protocol / Oyster)",
    tag: "Confidential computing",
  },
  {
    quote:
      "A cryptographically verifiable trust layer for AI is definitely a real problem worth solving. Having a trustworthy way to verify AI execution is an important direction for the industry.",
    name: "Alluri Siddhartha",
    role: "Research & Engineering, Ritual",
    tag: "AI infrastructure",
  },
  {
    quote:
      "As AI systems become increasingly autonomous, this problem becomes much more relevant. I can definitely see organizations adopting a solution like this.",
    name: "Ojas Tripathi",
    role: "Associate Software Engineer, PayU",
    tag: "Payments",
  },
];

export default function S06Validation() {
  return (
    <Slide
      id="validation"
      no="06"
      kicker="Industry validation"
      title="We didn't guess at the problem. We asked the people who live with it."
      sub="Practitioners across fintech, confidential computing and AI infrastructure independently confirmed the need — unprompted, in their own words."
      wide
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {VOICES.map((v, i) => (
          <Reveal key={v.name} delay={i * 0.06}>
            <figure
              className={`frost flex h-full flex-col rounded-2xl border border-line px-4 py-4 ${
                i === 0 ? "sm:col-span-2 sm:border-verify/30" : ""
              }`}
            >
              <span className="font-mono text-[10.5px] tracking-[0.14em] text-verify uppercase">
                {v.tag}
              </span>
              <blockquote
                className={`mt-2 leading-relaxed text-fog ${
                  i === 0 ? "text-[15px]" : "text-[13.5px]"
                }`}
              >
                &ldquo;{v.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-3 border-t border-line pt-2.5">
                <p className="font-mono text-[12.5px] font-semibold text-ink">
                  {v.name}
                </p>
                <p className="mt-0.5 text-[12px] leading-snug text-mist">{v.role}</p>
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>

      <Reveal delay={0.32}>
        <div className="mt-4 rounded-xl border border-verify/30 bg-verify/[0.07] px-4 py-3.5">
          <p className="text-[14.5px] leading-relaxed text-fog">
            <span className="font-semibold text-ink">Where this stands.</span> These
            are customer-discovery conversations, not signed commitments — and we
            will not dress them up as more. We are now moving to commercial
            validation: enterprise discussions for pilot programmes and letters of
            intent are underway.
          </p>
        </div>
      </Reveal>
    </Slide>
  );
}
