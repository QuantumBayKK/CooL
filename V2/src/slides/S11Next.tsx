"use client";

import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Slide } from "@/components/Slide";
import { Reveal } from "@/components/ui";
import { MEETING_URL } from "@/components/Nav";

/**
 * Slide 11 — the end of the pitch, and the only place it offers an exit.
 *
 * This is a ladder, not a menu. Earlier versions put "run the demo" and "open
 * the dashboard" beside the deck as equal-weight buttons, which gave a reader
 * three ways out of the first screen and no way through it. Here the steps are
 * numbered and ordered — see it, test it, check us, then talk — so each has an
 * obvious next and the meeting is the last rung rather than a rival option.
 *
 * Order matters: the product first, because it is the most convincing thing we
 * have; the proof second, for the sceptic; the diligence third, for whoever has
 * to defend the decision internally.
 */

const STEPS = [
  {
    n: "01",
    href: "/dashboard",
    label: "See the product",
    detail: "The console a bank or a hospital opens on Monday morning.",
  },
  {
    n: "02",
    href: "/demo",
    label: "Test it yourself",
    detail: "Seal a record in your own browser, then try to forge it.",
  },
  {
    n: "03",
    href: "/investors",
    label: "Check our working",
    detail: "The architecture, what is built, and where the money goes.",
  },
] as const;

export default function S11Next() {
  return (
    <Slide
      id="ask"
      no="11"
      kicker="What now"
      title="Don't take our word for any of it."
      sub="Everything we've claimed is one tap away, in the order a sceptic would want it."
    >
      <Reveal>
        <div className="mx-auto w-full max-w-xl">
          {STEPS.map((s, i) => (
            <Link
              key={s.n}
              href={s.href}
              prefetch
              className={`group flex items-center gap-4 py-3.5 text-left transition-colors ${
                i > 0 ? "border-t border-line" : ""
              }`}
            >
              <span className="shrink-0 font-mono text-[11px] text-verify">{s.n}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] leading-snug font-semibold text-ink">
                  {s.label}
                </span>
                <span className="mt-0.5 block text-[13px] leading-snug text-mist">
                  {s.detail}
                </span>
              </span>
              <ArrowRight className="size-4 shrink-0 text-mist transition-transform group-hover:translate-x-1 group-hover:text-verify" />
            </Link>
          ))}
        </div>
      </Reveal>

      <Reveal delay={0.18}>
        <div className="mt-9 flex flex-col items-center gap-2.5">
          <p className="font-mono text-[11px] tracking-[0.18em] text-mist uppercase">
            Then
          </p>
          <a
            href={MEETING_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex w-full max-w-xs items-center justify-center gap-2 rounded-full bg-verify-deep px-6 py-3.5 font-mono text-[13px] text-white shadow-[0_0_28px_rgba(9,105,218,0.55)] transition-shadow hover:shadow-[0_0_44px_rgba(9,105,218,0.9)] sm:w-auto"
          >
            Book a meeting <ArrowUpRight className="size-4" />
          </a>
          <p className="mt-1 max-w-[38ch] text-[13px] leading-relaxed text-mist">
            ₹1 Cr pre-seed · SAFE at a ₹10 Cr cap · twelve months to revenue.
          </p>
        </div>
      </Reveal>
    </Slide>
  );
}
