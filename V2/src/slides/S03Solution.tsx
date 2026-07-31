"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Slide } from "@/components/Slide";
import { Reveal, Mark } from "@/components/ui";

/**
 * Slide 3 — the same Monday, with the work removed.
 *
 * Deliberately mirrors slide 2: the same six jobs, in the same order, now in
 * the past tense and ticked. The reader does not need to be told what changed;
 * they recognise the list they were just shown and see that it has already
 * happened.
 *
 * The two terminals that used to carry this are gone. They demonstrated the
 * install beautifully to an engineer and said nothing at all to the compliance
 * officer sitting next to them, which on this slide is the more important
 * reader.
 */

const DONE: [string, string][] = [
  ["Written up", "the change document, generated and versioned"],
  ["Approved", "the right people asked, their answers recorded"],
  ["Registered", "the governance system updated"],
  ["Announced", "risk owners told, where they already work"],
  ["Filed", "evidence sealed so it cannot be altered later"],
  ["Retained", "kept for as long as the regulator requires"],
];

const GAINS: [string, string][] = [
  ["Under an hour", "to connect. Nothing about how your teams work changes."],
  ["Seconds", "instead of an afternoon, on every single change"],
  ["Up to 90%", "lower cost of staying compliant"],
];

const FITS = [
  "GitHub",
  "GitLab",
  "Jenkins",
  "OpenAI",
  "Anthropic",
  "Bedrock",
  "Vertex",
  "Jira",
  "Confluence",
  "Slack",
  "ServiceNow",
  "PagerDuty",
];

export default function S03Solution() {
  return (
    <Slide
      id="solution"
      no="03"
      kicker="The solution"
      title="Install once. That Monday morning simply disappears."
      sub={
        <>
          CooL watches for changes to your AI and does everything that follows —{" "}
          <Mark tone="live">before anyone would have started</Mark>.
        </>
      }
      wide
    >
      <Reveal>
        <div className="frost overflow-hidden rounded-2xl border border-live/30">
          <div className="border-b border-line bg-live/[0.06] px-4 py-3.5 sm:px-5">
            <p className="font-mono text-[11px] tracking-[0.16em] text-live uppercase">
              Monday, 09:14 · with CooL
            </p>
            <p className="mt-1.5 text-[15px] leading-snug font-semibold text-ink">
              Someone changes one line of a prompt. Nothing else happens to
              anyone.
            </p>
            <p className="mt-1 text-[14px] leading-relaxed text-fog">
              The same six jobs from the last slide. All of them, done, before
              the laptop closes.
            </p>
          </div>

          <div className="divide-y divide-line">
            {DONE.map(([what, how]) => (
              <div key={what} className="flex items-start gap-3.5 px-4 py-3 sm:px-5">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-live/50 bg-live/15 font-mono text-[10px] text-live">
                  ✓
                </span>
                <p className="min-w-0 text-[14px] leading-snug text-fog">
                  <span className="font-semibold text-ink">{what}</span> — {how}
                </p>
              </div>
            ))}
          </div>

          <div className="border-t border-line px-4 py-3.5 sm:px-5">
            <p className="font-mono text-[12.5px] leading-relaxed text-live">
              Done in under a second. Nobody lifted a finger.
            </p>
          </div>
        </div>
      </Reveal>

      <Reveal delay={0.12}>
        <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_1fr]">
          <div className="frost rounded-2xl border border-line px-4 py-4">
            <p className="font-mono text-[11px] tracking-[0.16em] text-verify uppercase">
              It fits what you already run
            </p>
            <p className="mt-2 text-[13.5px] leading-relaxed text-fog">
              CooL reads your existing setup — your code system, your AI
              providers, your ticketing — and connects to them. No migration, no
              new platform, no retraining anyone.
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {FITS.map((f) => (
                <span
                  key={f}
                  className="rounded-full border border-line bg-panel/60 px-2.5 py-1 font-mono text-[10.5px] text-fog"
                >
                  {f}
                </span>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {GAINS.map(([big, small]) => (
              <div
                key={big}
                className="frost rounded-2xl border border-live/30 px-4 py-3.5"
              >
                <p className="display text-[clamp(1.3rem,4vw,1.7rem)] leading-none text-live">
                  {big}
                </p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-fog">{small}</p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      <Reveal delay={0.2}>
        <div className="mt-4 flex flex-col gap-3 rounded-xl border border-verify/30 bg-verify/[0.07] px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[14.5px] leading-relaxed text-fog">
            Audits stop being fire drills, because the evidence was already
            sealed and waiting — and it holds up whichever AI provider you use.
          </p>
          <Link
            href="/dashboard"
            prefetch
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-verify/45 bg-verify/15 px-4 py-2.5 font-mono text-[12px] text-ink transition-colors hover:bg-verify/25"
          >
            See it <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </Reveal>
    </Slide>
  );
}
