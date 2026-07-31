"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Slide } from "@/components/Slide";
import { Reveal, Mark } from "@/components/ui";

/**
 * Slide 3 — the solution as the same Monday, deleted.
 *
 * Deliberately mirrors slide 2's structure so the contrast lands without a
 * paragraph explaining it. The five automated actions are the same list of
 * chores from the problem slide, ticked off.
 */

const DONE: [string, string][] = [
  ["Documentation", "written and versioned the moment the change ships"],
  ["Approvals", "requested, tracked and recorded against the change"],
  ["Governance", "registers updated across every system that needs it"],
  ["Audit evidence", "sealed, tamper-proof, and filed for retention"],
  ["Notifications", "security and compliance owners told, automatically"],
];

const GAINS: [string, string][] = [
  ["Up to 90%", "lower compliance cost per AI change"],
  ["Weeks → seconds", "for work that used to span ten tools"],
  ["Zero", "engineers pulled off building"],
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
          CooL is the black box for AI — a dashboard that{" "}
          <Mark tone="live">gives your team their time back</Mark>. The moment a
          developer ships a change, CooL is already on it.
        </>
      }
      wide
    >
      <Reveal>
        <div className="frost overflow-hidden rounded-2xl border border-live/30">
          <div className="border-b border-line bg-live/[0.06] px-4 py-3 sm:px-5">
            <p className="font-mono text-[11px] tracking-[0.16em] text-live uppercase">
              Monday, 09:14 · with CooL
            </p>
            <p className="mt-1.5 text-[15px] leading-snug font-semibold text-ink">
              A developer edits one line of a prompt. Nothing else happens to
              anyone.
            </p>
          </div>

          <div className="divide-y divide-line">
            {DONE.map(([what, how]) => (
              <div key={what} className="flex items-start gap-3 px-4 py-3 sm:px-5">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-live/50 bg-live/15 font-mono text-[10px] text-live">
                  ✓
                </span>
                <p className="min-w-0 text-[14px] leading-snug text-fog">
                  <span className="font-semibold text-ink">{what}</span> — {how}
                </p>
              </div>
            ))}
          </div>

          <div className="border-t border-line px-4 py-3 sm:px-5">
            <p className="font-mono text-[12px] leading-relaxed text-live">
              All of it done before the laptop closes. Nobody lifted a finger.
            </p>
          </div>
        </div>
      </Reveal>

      <Reveal delay={0.12}>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {GAINS.map(([big, small]) => (
            <div key={big} className="frost rounded-2xl border border-live/30 px-4 py-4">
              <p className="display text-[clamp(1.5rem,4.6vw,2rem)] leading-none text-live">
                {big}
              </p>
              <p className="mt-2 text-[13.5px] leading-relaxed text-fog">{small}</p>
            </div>
          ))}
        </div>
      </Reveal>

      <Reveal delay={0.2}>
        <div className="mt-4 flex flex-col gap-3 rounded-xl border border-verify/30 bg-verify/[0.07] px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[14.5px] leading-relaxed text-fog">
            Audits stop being fire drills, because the evidence was already sealed
            and waiting — and it&apos;s provable across every AI provider you use.
          </p>
          <Link
            href="/dashboard"
            prefetch
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-verify/45 bg-verify/15 px-4 py-2.5 font-mono text-[12px] text-ink transition-colors hover:bg-verify/25"
          >
            Open the dashboard <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </Reveal>
    </Slide>
  );
}
