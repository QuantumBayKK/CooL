"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { ArrowLeft, ArrowUpRight, Play, LayoutDashboard } from "lucide-react";
import Backdrop from "@/components/Backdrop";
import SnapScroll from "@/components/SnapScroll";
import { GithubMark } from "@/components/ui";
import { INVEST_MAILTO, MEETING_URL } from "@/components/Nav";
import { Build, Eyebrow, Headline, Lead, Stage } from "./KeynoteStage";
import {
  BUY_BUILD,
  HERO,
  LAYERS,
  MVP_SLICE,
  PRINCIPLES,
  STATUS,
  TERMS,
  TOPOLOGIES,
} from "@/content/investors";

/**
 * The investors keynote.
 *
 * Fourteen stages, one idea each, built in sequence. This is diligence material
 * presented rather than published: the same content a partner would otherwise
 * read as a memo, paced so the argument arrives in the order it should be
 * believed in â€” principles, then architecture, then an honest account of what
 * is and is not built, then what the money does.
 *
 * Nothing here repeats the deck.
 */

/** One label per stage, in order. Must stay the same length as the stages. */
const STAGE_LABELS = [
  "Open",
  "Principles",
  "Critical path",
  "Data boundary",
  "One artifact",
  "Reuse",
  "Hybrid crypto",
  "Architecture",
  "What works",
  "What doesn't",
  "Buy vs build",
  "Deployments",
  "The round",
  "Close",
];

/** Right-edge progress rail. Desktop only â€” it is orientation, not navigation. */
function Rail() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const stages = Array.from(
      document.querySelectorAll<HTMLElement>("[data-slide]"),
    );
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            const n = parseInt(e.target.getAttribute("data-slide") ?? "1", 10);
            setActive(n - 1);
          }
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    stages.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  return (
    <nav
      aria-label="Keynote progress"
      className="fixed top-1/2 right-5 z-40 hidden -translate-y-1/2 flex-col items-end gap-2.5 lg:flex"
    >
      {STAGE_LABELS.map((label, i) => (
        <a
          key={label}
          href={`#stage-${String(i + 1).padStart(2, "0")}`}
          className="group flex items-center gap-2.5"
          aria-label={label}
        >
          <span
            className={clsx(
              "font-mono text-[10px] tracking-[0.14em] whitespace-nowrap uppercase transition-all duration-300",
              i === active
                ? "text-verify opacity-100"
                : "text-mist opacity-0 group-hover:opacity-70",
            )}
          >
            {label}
          </span>
          <span
            className={clsx(
              "rounded-full transition-all duration-300",
              i === active
                ? "h-5 w-1.5 bg-verify shadow-[0_0_8px_rgba(88,166,255,0.6)]"
                : "size-1.5 bg-ink/25 group-hover:bg-ink/45",
            )}
          />
        </a>
      ))}
    </nav>
  );
}

/* â”€â”€ reusable stage furniture â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

/** A principle stage: a big number, the rule, and what it buys. */
function PrincipleStage({
  no,
  index,
}: {
  no: string;
  index: number;
}) {
  const p = PRINCIPLES[index]!;
  return (
    <Stage no={no}>
      <Build>
        <p className="display text-[clamp(4rem,16vw,9rem)] leading-none text-verify/25">
          {p.n}
        </p>
      </Build>
      <Headline>{p.title}</Headline>
      <Lead>{p.detail}</Lead>
      <Build>
        <p className="mt-7 max-w-xl border-l-2 border-verify/50 pl-4 text-[14.5px] leading-relaxed text-mist sm:text-[15.5px]">
          {p.consequence}
        </p>
      </Build>
    </Stage>
  );
}

const STATE_STYLE = {
  working: { label: "WORKING", cls: "text-live border-live/45 bg-live/10" },
  partial: { label: "PARTIAL", cls: "text-verify border-verify/45 bg-verify/10" },
  planned: { label: "PLANNED", cls: "text-mock border-mock/40 bg-mock/[0.08]" },
} as const;

function StatusList({ states }: { states: readonly ("working" | "partial" | "planned")[] }) {
  return (
    <div className="mt-7 space-y-2">
      {STATUS.filter((s) => states.includes(s.state)).map((s) => {
        const st = STATE_STYLE[s.state];
        return (
          <Build key={s.item}>
            <div className="flex flex-col gap-1.5 border-b border-line pb-2.5 sm:flex-row sm:items-baseline sm:gap-4">
              <span
                className={clsx(
                  "w-fit shrink-0 rounded-full border px-2 py-0.5 font-mono text-[9.5px] tracking-[0.12em] sm:w-[70px] sm:text-center",
                  st.cls,
                )}
              >
                {st.label}
              </span>
              <div className="min-w-0">
                <p className="text-[14.5px] leading-snug font-semibold text-ink sm:text-[15.5px]">
                  {s.item}
                </p>
                <p className="mt-0.5 text-[13px] leading-relaxed text-mist sm:text-[13.5px]">
                  {s.note}
                </p>
              </div>
            </div>
          </Build>
        );
      })}
    </div>
  );
}

/* â”€â”€ the keynote â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

export default function InvestorKeynote() {
  return (
    <>
      <Backdrop />
      <div className="grain" aria-hidden />
      <Rail />
      {/* Gives the keynote its advance: one wheel notch = one stage, which is
          what makes this read as a presentation rather than a long page. It
          also measures each stage and drops the snap point from any that
          outgrows the viewport, so a dense stage on a short laptop can still be
          read instead of being yanked back to its top. On touch it stands down
          entirely — the stylesheet has already disabled snapping there. */}
      <SnapScroll />

      {/* quiet chrome â€” a keynote has no navigation bar */}
      <div className="fixed inset-x-0 top-[calc(0.8rem+env(safe-area-inset-top))] z-50 flex justify-center px-4">
        <div className="glass-strong flex items-center gap-1 rounded-full py-1.5 pr-1.5 pl-3.5">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 pr-2 font-mono text-[11px] text-mist transition-colors hover:text-ink"
          >
            <ArrowLeft className="size-3.5" /> Deck
          </Link>
          <span className="h-4 w-px bg-line" aria-hidden />
          <Link
            href="/demo"
            prefetch
            className="rounded-full px-2.5 py-1 font-mono text-[11px] text-mist transition-colors hover:text-ink"
          >
            Demo
          </Link>
          <Link
            href="/dashboard"
            prefetch
            className="rounded-full px-2.5 py-1 font-mono text-[11px] text-mist transition-colors hover:text-ink"
          >
            Dashboard
          </Link>
        </div>
      </div>

      <main className="relative z-10">
        {/* â”€â”€ 01 Â· open â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <Stage no="01">
          <Eyebrow>{HERO.kicker}</Eyebrow>
          <Headline size="xl">{HERO.title}</Headline>
          <Lead>{HERO.lead}</Lead>
          <Build>
            <p className="mt-10 font-mono text-[11px] tracking-[0.16em] text-mist uppercase">
              Scroll
            </p>
          </Build>
        </Stage>

        {/* â”€â”€ 02 Â· principles overture â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <Stage no="02">
          <Eyebrow>Design principles</Eyebrow>
          <Headline size="xl">
            Five decisions everything
            <br className="hidden sm:block" /> else follows from.
          </Headline>
          <Lead>
            Each one exists because violating it is a known way that enterprise
            infrastructure companies die.
          </Lead>
          <div className="mt-8 space-y-1">
            {PRINCIPLES.map((p) => (
              <Build key={p.n}>
                <div className="flex items-baseline gap-4 border-b border-line py-2">
                  <span className="font-mono text-[11px] text-verify">{p.n}</span>
                  <span className="text-[15px] font-medium text-fog sm:text-[16.5px]">
                    {p.title}
                  </span>
                </div>
              </Build>
            ))}
          </div>
        </Stage>

        {/* â”€â”€ 03â€“07 Â· one principle per screen â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <PrincipleStage no="03" index={0} />
        <PrincipleStage no="04" index={1} />
        <PrincipleStage no="05" index={2} />
        <PrincipleStage no="06" index={3} />
        <PrincipleStage no="07" index={4} />

        {/* â”€â”€ 08 Â· architecture â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <Stage no="08">
          <Eyebrow>Architecture</Eyebrow>
          <Headline>One boundary matters more than the rest.</Headline>
          <Lead>
            Customer data never crosses it. That is what makes CooL sellable to a
            regulated enterprise at all.
          </Lead>

          <div className="mt-7 grid gap-3 lg:grid-cols-[1.35fr_0.65fr]">
            <Build>
              <div className="frost rounded-2xl border border-verify/35 p-4">
                <p className="font-mono text-[10.5px] tracking-[0.16em] text-verify uppercase">
                  Customer environment
                </p>
                <div className="mt-2.5 space-y-1.5">
                  {LAYERS.filter((l) => l.zone === "Customer environment").map((l) => (
                    <div
                      key={l.name}
                      className="flex flex-col gap-0.5 border-b border-line/60 pb-1.5 last:border-b-0 sm:flex-row sm:items-baseline sm:gap-3"
                    >
                      <span className="w-full shrink-0 text-[13.5px] font-semibold text-ink sm:w-40">
                        {l.name}
                      </span>
                      <span className="min-w-0 font-mono text-[10.5px] leading-snug text-mist">
                        {l.stack}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Build>

            <Build>
              <div className="frost h-full rounded-2xl border border-line p-4">
                <p className="font-mono text-[10.5px] tracking-[0.16em] text-mist uppercase">
                  CooL control plane
                </p>
                <div className="mt-2.5">
                  <p className="text-[13.5px] font-semibold text-ink">
                    Orchestration
                  </p>
                  <p className="mt-1 font-mono text-[10.5px] leading-snug text-mist">
                    Fleet health Â· updates Â· licensing Â· billing
                  </p>
                  <p className="mt-3 text-[13px] leading-relaxed text-fog">
                    Carries no customer evidence or PII â€” by construction, not by
                    policy.
                  </p>
                </div>
              </div>
            </Build>
          </div>
        </Stage>

        {/* â”€â”€ 09 Â· what works â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <Stage no="09">
          <Eyebrow>Build status</Eyebrow>
          <Headline>The hard cryptography already runs.</Headline>
          <StatusList states={["working"]} />
        </Stage>

        {/* â”€â”€ 10 Â· what doesn't â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <Stage no="10">
          <Eyebrow>Build status</Eyebrow>
          <Headline>And this part does not.</Headline>
          <StatusList states={["partial", "planned"]} />
          <Build>
            <p className="mt-6 max-w-2xl text-[14.5px] leading-relaxed text-fog sm:text-[15.5px]">
              The verifier is built so a mocked domain can never report a pass.
              Attestation returns{" "}
              <span className="font-mono text-[13px] text-mock">MOCK</span> and
              anchoring returns{" "}
              <span className="font-mono text-[13px] text-mock">ABSENT</span>.
              Run the demo and try to make them go green.
            </p>
          </Build>
          <Build>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                href="/demo"
                prefetch
                className="inline-flex items-center gap-2 rounded-full border border-verify/45 bg-verify/10 px-4 py-2 font-mono text-[12px] text-ink transition-colors hover:bg-verify/20"
              >
                <Play className="size-3.5" /> Verify it yourself
              </Link>
              {["cool-sdk", "cool-verifier", "cool-spec"].map((repo) => (
                <a
                  key={repo}
                  href={`https://github.com/KenidoesCode/${repo}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-line px-3.5 py-2 font-mono text-[12px] text-mist transition-colors hover:border-verify/40 hover:text-ink"
                >
                  <GithubMark className="size-3.5" />
                  {repo}
                </a>
              ))}
            </div>
          </Build>
        </Stage>

        {/* â”€â”€ 11 Â· buy vs build â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <Stage no="11">
          <Eyebrow>Capital efficiency</Eyebrow>
          <Headline>
            We refuse to build seven
            <br className="hidden sm:block" /> of these ten things.
          </Headline>
          <Lead>
            A pre-seed team that rebuilds a Merkle log, a policy engine and a
            workflow engine ships nothing.
          </Lead>

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            {(["buy", "build"] as const).map((verdict) => (
              <Build key={verdict}>
                <div
                  className={clsx(
                    "frost h-full rounded-2xl border p-4",
                    verdict === "build" ? "border-verify/40" : "border-line",
                  )}
                >
                  <p
                    className={clsx(
                      "font-mono text-[10.5px] tracking-[0.16em] uppercase",
                      verdict === "build" ? "text-verify" : "text-mist",
                    )}
                  >
                    {verdict === "buy" ? "Reused" : "Our only original IP"}
                  </p>
                  <div className="mt-2.5 space-y-1">
                    {BUY_BUILD.filter((b) => b.verdict === verdict).map((b) => (
                      <div
                        key={b.need}
                        className="flex items-baseline justify-between gap-3 border-b border-line/50 pb-1 last:border-b-0"
                      >
                        <span className="min-w-0 text-[13px] text-fog">
                          {b.need}
                        </span>
                        <span
                          className={clsx(
                            "shrink-0 font-mono text-[10.5px]",
                            verdict === "build" ? "text-verify" : "text-mist",
                          )}
                        >
                          {b.choice}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </Build>
            ))}
          </div>
        </Stage>

        {/* â”€â”€ 12 Â· deployments + the round â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <Stage no="12">
          <Eyebrow>How it reaches enterprise</Eyebrow>
          <Headline>One artifact. Three deployments.</Headline>
          <Lead>
            The same Helm package every time. This is how a two-person company
            sells to a bank without forking itself into oblivion.
          </Lead>
          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            {TOPOLOGIES.map((t) => (
              <Build key={t.name}>
                <div className="frost h-full rounded-2xl border border-line p-4">
                  <p className="text-[14.5px] leading-snug font-semibold text-ink">
                    {t.name}
                  </p>
                  <p className="mt-1.5 font-mono text-[10.5px] text-verify">
                    {t.who}
                  </p>
                  <p className="mt-2 text-[13px] leading-relaxed text-fog">
                    {t.how}
                  </p>
                </div>
              </Build>
            ))}
          </div>
        </Stage>

        {/* â”€â”€ 13 Â· the money â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <Stage no="13">
          <Eyebrow>Use of funds</Eyebrow>
          <Headline>What â‚¹1 Cr becomes, in eight weeks.</Headline>
          <Lead>
            Not the full architecture â€” one thin vertical slice of it, shaped so
            nothing has to be thrown away later.
          </Lead>

          <div className="mt-6 space-y-1.5">
            {MVP_SLICE.map((s, i) => (
              <Build key={s}>
                <div className="flex items-start gap-3 border-b border-line py-1.5">
                  <span className="shrink-0 pt-0.5 font-mono text-[10.5px] text-verify">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="min-w-0 text-[13.5px] leading-relaxed text-fog sm:text-[14.5px]">
                    {s}
                  </p>
                </div>
              </Build>
            ))}
          </div>

          <Build>
            <div className="mt-7 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {[
                [TERMS.amount, "Raising"],
                [TERMS.instrument, "Instrument"],
                [TERMS.cap, "Valuation"],
                [TERMS.runway, "Runway"],
              ].map(([big, small]) => (
                <div
                  key={small}
                  className="frost rounded-xl border border-verify/30 px-3 py-3 text-center"
                >
                  <p className="font-mono text-[13.5px] leading-snug font-semibold text-ink">
                    {big}
                  </p>
                  <p className="mt-1 font-mono text-[9.5px] tracking-[0.12em] text-mist uppercase">
                    {small}
                  </p>
                </div>
              ))}
            </div>
          </Build>
        </Stage>

        {/* â”€â”€ close â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <Stage no="14">
          <Build>
            <p className="keynote text-[clamp(1.6rem,5.2vw,3.1rem)] leading-tight">
              The cryptography is real and public.
              <br />
              The attestation tier is mocked, and says so.
            </p>
          </Build>
          <Lead>
            This round turns a proven core into a product a regulated enterprise
            runs every day.
          </Lead>
          <Build>
            <div className="mt-9 flex flex-wrap gap-2.5">
              <a
                href={MEETING_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-verify-deep px-5 py-3 font-mono text-[12.5px] text-white shadow-[0_0_24px_rgba(9,105,218,0.45)] transition-shadow hover:shadow-[0_0_36px_rgba(9,105,218,0.8)]"
              >
                Book a meeting <ArrowUpRight className="size-3.5" />
              </a>
              <a
                href={INVEST_MAILTO}
                className="inline-flex items-center gap-2 rounded-full border border-verify/45 bg-verify/10 px-5 py-3 font-mono text-[12.5px] text-ink transition-colors hover:bg-verify/20"
              >
                Email the founders
              </a>
              <Link
                href="/dashboard"
                prefetch
                className="inline-flex items-center gap-2 rounded-full border border-line px-5 py-3 font-mono text-[12.5px] text-mist transition-colors hover:border-verify/40 hover:text-ink"
              >
                <LayoutDashboard className="size-3.5" /> See the product
              </Link>
            </div>
          </Build>
          <Build>
            <p className="mt-8 font-mono text-[11px] leading-relaxed text-mist">
              {TERMS.entity} Â· Pranauv Shrinaath S, CEO Â· Kailosh Kalimuthu, CTO
            </p>
          </Build>
        </Stage>
      </main>
    </>
  );
}
