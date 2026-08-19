import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { Container, StatusBadge } from "@/components/ui/primitives";
import { DOMAINS, HERO_STATS, PROOF_STRIP } from "@/content/home";

/**
 * The hero.
 *
 * ── the shape, and why it is this shape ──
 *
 * Two columns: the claim on the left, the artefact on the right. This is the
 * layout GitHub, Atlassian and every serious developer-infrastructure company
 * converges on, and the reason is not fashion — the left column has to survive
 * a reader who is deciding in four seconds whether this is real, and the
 * fastest way to answer that is to show them the thing rather than describe it.
 *
 * The right panel is therefore not decoration. It is a receipt and the verdict
 * over that receipt, in the exact shape the product emits, including the two
 * domains that do not pass. A hero panel showing seven green ticks would be a
 * better advertisement and a worse first impression: the whole argument of this
 * site is that our output can be checked, and the first thing a sceptic does
 * with a wall of green is stop believing it.
 *
 * ── what was here before ──
 *
 * A centred headline, two buttons and a scroll cue, followed by three pinned
 * scroll acts. That opening asked the reader to scroll several viewport-heights
 * before it showed them anything they could evaluate. This one puts the
 * artefact, the install line and the honest verdict above the fold, and the
 * page below it is a document rather than a trailer.
 */
export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-line">
      <GridBackdrop />

      <Container className="relative">
        <div className="grid items-start gap-x-14 gap-y-12 py-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,32rem)] lg:items-center lg:py-20">
          {/* ── the claim ────────────────────────────────────────────── */}
          <div className="flex flex-col items-start">
            <Link href="/security/readiness" className="group w-fit">
              <StatusBadge
                status="warn"
                className="transition-colors group-hover:border-warn/50"
              >
                Stage 0 · working demo · attestation simulated
              </StatusBadge>
            </Link>

            <h1 className="mt-7 max-w-[15ch] text-balance text-display">
              The black box for AI.
            </h1>

            {/* The subhead is a rule with a label on it rather than a second
                paragraph. Set as plain sentence copy it competed with the lead
                directly beneath it — two lines of similar weight, three
                millimetres apart, and the eye had no idea which was the
                subordinate one. */}
            <p className="mt-5 flex items-center gap-3 font-mono text-[0.8125rem] uppercase tracking-[0.14em] text-ink-subtle">
              <span aria-hidden className="h-px w-6 shrink-0 bg-accent" />
              Private by default. Provable by design.
            </p>

            <p className="mt-7 max-w-[58ch] text-lead text-ink-muted">
              Every change to your AI — a prompt edit, a model swap, a permission
              grant — is captured as it ships and sealed into a signed,
              tamper-evident record. Then we hand you a verifier we do not
              control, so you never have to take our word for any of it.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <Link href="/demo">
                  Run the live demo
                  <ArrowRight className="size-4" strokeWidth={2} />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/docs/quickstart">Read the quickstart</Link>
              </Button>
            </div>

            <InstallLine />
          </div>

          {/* ── the artefact ─────────────────────────────────────────── */}
          <ReceiptPanel />
        </div>
      </Container>

      <StatRail />
    </section>
  );
}

/* ── backdrop ─────────────────────────────────────────────────────────────── */

/**
 * Vertical hairlines behind the hero, fading out downward.
 *
 * This is the site's structural signature — cells divided by 1px rules —
 * applied as atmosphere rather than as layout. It is a `background-image` on
 * one absolutely-positioned div: no extra elements, no compositor layer, and
 * nothing to lay out. `aria-hidden` because it is texture and a screen reader
 * announcing it would be announcing nothing.
 *
 * The mask is what keeps it from reading as a wireframe: the rules are visible
 * behind the badge and headline, and gone by the time they would collide with
 * body copy.
 */
function GridBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{
        backgroundImage:
          "repeating-linear-gradient(to right, var(--line) 0 1px, transparent 1px 5.5rem)",
        maskImage: "linear-gradient(to bottom, rgb(0 0 0 / 0.5), transparent 62%)",
        WebkitMaskImage:
          "linear-gradient(to bottom, rgb(0 0 0 / 0.5), transparent 62%)",
      }}
    />
  );
}

/* ── install ──────────────────────────────────────────────────────────────── */

/**
 * The install command, as a control rather than as a code block.
 *
 * A full `CodeBlock` here would be a third visual weight competing with the two
 * buttons directly above it. This is one line, one border and a copy affordance
 * — the reader who wants it can take it in a click, and the reader who does not
 * reads past it.
 */
function InstallLine() {
  const cmd = "npm install cool-nwc";
  return (
    <div className="mt-6 flex w-full max-w-[26rem] items-center justify-between gap-3 rounded-[--radius-sm] border border-line bg-surface py-1.5 pl-3.5 pr-1.5">
      <code className="min-w-0 flex-1 truncate font-mono text-sm text-ink">
        <span className="select-none text-ink-subtle">$ </span>
        {cmd}
      </code>
      <CopyButton value={cmd} />
    </div>
  );
}

/* ── the artefact panel ───────────────────────────────────────────────────── */

/**
 * A receipt and its verdict.
 *
 * Static markup, deliberately. The live version of this — real signatures, a
 * real log, a real verifier — is one click away at `/demo`, and putting a
 * cryptographic workload in the hero would cost every visitor an ML-DSA keygen
 * before they had decided whether they cared. What sits here is the shape of
 * the output, and it is accurate to the field names the SDK actually emits.
 *
 * The digests are illustrative and marked as such at the base of the panel.
 * Anything that looks like real evidence has to say whether it is.
 */
function ReceiptPanel() {
  return (
    <div className="overflow-hidden rounded-[--radius-md] border border-line-strong bg-canvas shadow-[--shadow-overlay]">
      {/* caption bar */}
      <div className="flex items-center justify-between gap-4 border-b border-line bg-surface px-3.5 py-2.5">
        <span className="truncate font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-ink-subtle">
          change-receipt.json
        </span>
        <StatusBadge status="ok" className="shrink-0">
          Sealed
        </StatusBadge>
      </div>

      {/* the record */}
      <dl className="divide-y divide-line">
        {(
          [
            ["change", "prompt.update"],
            ["subject", "billing-assistant / v3"],
            ["actor", "aria@northwind"],
            ["binding_hash", "sha256:9f2a…c41b"],
            ["signature", "ML-DSA-65 + Ed25519"],
            ["log", "index 4172 · tree 4173"],
          ] as const
        ).map(([k, v]) => (
          <div
            key={k}
            className="grid grid-cols-[8.5rem_minmax(0,1fr)] items-baseline gap-3 px-3.5 py-2"
          >
            <dt className="truncate font-mono text-xs text-ink-subtle">{k}</dt>
            <dd className="truncate font-mono text-xs text-ink" data-numeric>
              {v}
            </dd>
          </div>
        ))}
      </dl>

      {/* the verdict */}
      <div className="border-t border-line-strong bg-surface px-3.5 py-2.5">
        <p className="font-mono text-xs text-ink">
          <span className="select-none text-ink-subtle">$ </span>
          cool verify change-receipt.json --offline
        </p>
      </div>

      <ul className="divide-y divide-line">
        {DOMAINS.map((d) => (
          <li
            key={d.name}
            className="flex items-center justify-between gap-4 px-3.5 py-[0.4375rem]"
          >
            <span className="font-mono text-xs text-ink-muted">{d.name}</span>
            <VerdictMark verdict={d.verdict} />
          </li>
        ))}
      </ul>

      <p className="border-t border-line bg-surface px-3.5 py-2.5 font-mono text-[0.6875rem] leading-relaxed text-ink-subtle">
        5 verified · 1 simulated · 1 absent · 0 network requests
        <br />
        Illustrative digests. The live version runs at{" "}
        <Link href="/demo" className="text-ink underline underline-offset-2">
          /demo
        </Link>
        .
      </p>
    </div>
  );
}

/**
 * The per-domain mark.
 *
 * Glyph plus word, never colour alone — the same rule `StatusBadge` follows,
 * and for the same reason: this site's entire subject is the difference between
 * verified and not, so the one place that distinction is drawn must not depend
 * on the reader distinguishing green from amber.
 */
function VerdictMark({ verdict }: { verdict: "real" | "simulated" | "absent" }) {
  const style = {
    real: { mark: "✓", label: "verified", cls: "text-ok" },
    simulated: { mark: "~", label: "simulated", cls: "text-warn" },
    absent: { mark: "·", label: "absent", cls: "text-ink-subtle" },
  }[verdict];

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono text-[0.6875rem] uppercase tracking-[0.06em] ${style.cls}`}
    >
      <span aria-hidden>{style.mark}</span>
      {style.label}
    </span>
  );
}

/* ── stat rail ────────────────────────────────────────────────────────────── */

/**
 * Three numbers, on hairlines, spanning the full width under the hero.
 *
 * The figures are chosen for checkability rather than for size — see the note
 * on `HERO_STATS`. The band also does a structural job: it closes the hero with
 * a horizontal rule the eye can rest on, so the first section below it starts
 * against a boundary instead of drifting up into the headline.
 */
function StatRail() {
  return (
    <div className="relative border-t border-line bg-surface">
      <Container>
        <dl className="grid divide-y divide-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {HERO_STATS.map((s, i) => (
            <div
              key={s.v}
              className={`py-6 ${i === 0 ? "sm:pr-8" : "sm:px-8"} ${
                i === HERO_STATS.length - 1 ? "sm:pr-0" : ""
              }`}
            >
              <dt className="flex items-baseline gap-2.5">
                <span
                  className="font-editorial text-h1 leading-none text-ink"
                  data-numeric
                >
                  {s.k}
                </span>
                <span className="text-label uppercase text-ink-subtle">
                  {s.v}
                </span>
              </dt>
              <dd className="mt-2.5 max-w-[34ch] text-sm text-ink-muted">
                {s.note}
              </dd>
            </div>
          ))}
        </dl>
      </Container>

      {/* The standards strip. Six named specifications, no adjectives — this is
          the band where a sceptical engineer decides whether to keep reading. */}
      <div className="border-t border-line">
        <Container>
          <ul className="flex flex-wrap items-center gap-x-6 gap-y-2 py-3.5">
            {PROOF_STRIP.map((item) => (
              <li
                key={item}
                className="font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-ink-subtle"
              >
                {item}
              </li>
            ))}
          </ul>
        </Container>
      </div>
    </div>
  );
}
