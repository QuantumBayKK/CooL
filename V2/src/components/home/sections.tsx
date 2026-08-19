import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { GateSummary } from "@/components/security/GateLadder";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import {
  Container,
  Eyebrow,
  Section,
  SectionHeader,
  StatusBadge,
} from "@/components/ui/primitives";
import { GATES } from "@/content/gates";
import {
  DOMAINS,
  DRIVER_GAP,
  DRIVERS,
  LANDSCAPE,
  LANDSCAPE_COLUMNS,
  PILLARS,
  STANDING,
  type Mark,
} from "@/content/home";
import { cn } from "@/lib/utils";

/**
 * The bands of the landing page, in reading order.
 *
 * ── the format ──
 *
 * One document, divided by hairlines, alternating canvas and surface so a
 * reader can tell where they are by peripheral vision alone. Each band states
 * one thing and supports it with a table, a matrix or a set of cells — never
 * with an adjective. That is the shape GitHub, Jira and Atlassian all arrive at
 * for their product pages, and the reason is that their buyer reads the page
 * the way an engineer reads a spec: skimming for the row that disqualifies it.
 *
 * ── what was cut, and why ──
 *
 * This was fifteen bands. It is now five plus the demo, and the deletions were
 * not trims — whole sections went:
 *
 *   benefits, position   Restatements. Both said in adjectives what the product
 *                        band and the domain table had already said in code and
 *                        in verdicts, and a reader who is unconvinced by a
 *                        recomputed SHA-256 is not going to be convinced by a
 *                        card headed "Verify independently".
 *   market, roadmap,     Investor material on a buyer's page. TAM/SAM/SOM tells
 *   founders             an engineer evaluating a verifier nothing they can act
 *                        on, and all three still live in `deck.ts`, rendered in
 *                        the investor room where the audience for them is.
 *   worked example       A three-column scenario between the demo and the
 *                        comparison table — the two densest things on the page —
 *                        that most readers scrolled past to reach one of them.
 *
 * What is left is the argument and nothing else: the law wants a record, here
 * is how one is made, here is what a verdict over it actually says, run it
 * yourself, here is why the adjacent categories do not do this, and here is
 * what we do not have yet.
 *
 * ── the grid ──
 *
 * Cards are cells in a hairline grid rather than floating boxes with gaps. The
 * `rule-grid` utility in globals.css draws the top and left rules on the
 * container and the right and bottom rules on each child, which is what makes
 * an odd-numbered last row close cleanly instead of leaving a dangling edge.
 *
 * Everything here is a Server Component. There is no state on this page and no
 * interactivity beyond `<details>` in the FAQ and the demo island, so none of
 * it needs to ship as JavaScript.
 */

/* ── shared ───────────────────────────────────────────────────────────────── */

/**
 * A one-line command or expression.
 *
 * Deliberately not `CodeBlock`: Shiki's caption bar and syntax colour are right
 * for a documentation page and wrong inside a product card, where three
 * multi-coloured blocks in a row become the loudest thing in the band and pull
 * the eye away from the copy that explains them. Monochrome, one border, one
 * copy control.
 */
function Snippet({ code, className }: { code: string; className?: string }) {
  return (
    <div
      className={cn(
        "flex w-full min-w-0 items-center justify-between gap-3",
        "rounded-[--radius-sm] border border-line bg-surface py-1.5 pl-3 pr-1.5",
        className,
      )}
    >
      {/* `min-w-0` is what makes `truncate` work here. A flex item defaults to
          `min-width: auto`, so without it the code refuses to shrink below its
          own text width and pushes the whole page sideways on a phone —
          horizontal scroll on mobile being the fastest way to make a reader
          conclude the site is broken. */}
      <code className="min-w-0 flex-1 truncate font-mono text-[0.8125rem] text-ink">
        {code}
      </code>
      <CopyButton value={code} />
    </div>
  );
}

/* ── 01 · why now ─────────────────────────────────────────────────────────── */

/**
 * The regulatory case, as citations.
 *
 * `ref` is the instrument and the article, because "regulators are getting
 * serious about AI" is a sentence any vendor can type and none can support. A
 * compliance reader recognises SR 11-7 on sight and can check Article 12 in
 * ninety seconds.
 *
 * The band closes on what the regulation does *not* require, which is the
 * unusual move and the load-bearing one. Every competitor in this category
 * quotes the same four instruments; the differentiator is the sentence
 * afterwards, and it is a sentence about a gap rather than about a feature.
 */
export function WhyNow() {
  return (
    <Section id="why-now" bordered={false}>
      <Container>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] lg:gap-16">
          <SectionHeader
            eyebrow="01 — Why now"
            title="The law already wants the record."
            lead="Four instruments, three jurisdictions, one direction of travel. None of them is speculative and none of them is far away."
          />

          <ol className="rule-grid grid sm:grid-cols-2">
            {DRIVERS.map((d) => (
              <li key={d.ref} className="p-6">
                <p className="text-label uppercase text-ink-subtle">
                  {d.jurisdiction}
                </p>
                <h3 className="mt-2.5 font-mono text-sm font-semibold text-ink">
                  {d.ref}
                </h3>
                <p className="mt-3 text-sm text-ink-muted">{d.what}</p>
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-10 border-l-2 border-accent pl-5 lg:mt-12">
          <p className="max-w-[76ch] font-serif text-lead leading-[1.6] text-ink">
            {DRIVER_GAP}
          </p>
        </div>
      </Container>
    </Section>
  );
}

/* ── 02 · the product ─────────────────────────────────────────────────────── */

/**
 * Capture, seal, verify — the pipeline as three cells.
 *
 * The order is the order the bytes actually move in, and each cell carries the
 * one line of code or shell that does that step. A reader who takes nothing
 * else from this page should be able to reconstruct the pipeline from these
 * three snippets.
 */
export function Product() {
  return (
    <Section id="product" tone="surface">
      <Container>
        <SectionHeader
          eyebrow="02 — The product"
          title="Three steps, and you can run all three today."
          lead="Capture is out-of-band, sealing is deterministic, and verification is somebody else's machine. Nothing in this pipeline requires trusting us."
        />

        <div className="rule-grid mt-10 grid bg-canvas lg:grid-cols-3">
          {PILLARS.map((p) => (
            <article key={p.n} className="flex min-w-0 flex-col gap-4 p-7">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-ink-subtle" data-numeric>
                  {p.n}
                </span>
                <span className="text-label uppercase text-ink">{p.name}</span>
              </div>

              <h3 className="text-h3">{p.title}</h3>
              <p className="flex-1 text-sm text-ink-muted">{p.body}</p>

              <Snippet code={p.code} />

              <Link
                href={p.href}
                className="group inline-flex items-center gap-1.5 text-sm font-medium text-accent"
              >
                {p.linkLabel}
                <ArrowRight
                  className="size-3.5 transition-transform duration-[--duration-state] ease-[--ease-out] group-hover:translate-x-0.5"
                  strokeWidth={2}
                />
              </Link>
            </article>
          ))}
        </div>
      </Container>
    </Section>
  );
}

/* ── 03 · the seven domains ───────────────────────────────────────────────── */

const DOMAIN_TONE = {
  real: { status: "ok" as const, label: "Verified" },
  simulated: { status: "warn" as const, label: "Simulated" },
  absent: { status: "neutral" as const, label: "Absent" },
};

/**
 * The verdict table.
 *
 * Seven rows, in the verifier's own display order, with the two that do not
 * pass sitting in place rather than in a footnote. The heading says "five of
 * seven" before the reader can count, because being told a limitation is very
 * different from discovering one — and this table is the single most likely
 * place a technical evaluator starts.
 */
export function Domains() {
  return (
    <Section id="domains">
      <Container>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeader
            eyebrow="03 — Verification"
            title="Five of seven domains verify today."
            lead="A verifier that returns one boolean forces you to trust its weighting. This one reports seven properties separately, so you decide which ones you actually need. Two of them do not pass, and they are in this table rather than under it."
          />
          <Button asChild variant="secondary" className="shrink-0">
            <Link href="/security">Read the security model</Link>
          </Button>
        </div>

        <ul className="mt-10 border-t border-line">
          {DOMAINS.map((d) => {
            const tone = DOMAIN_TONE[d.verdict];
            return (
              <li
                key={d.name}
                className="grid gap-x-8 gap-y-2 border-b border-line py-5 lg:grid-cols-[minmax(0,11rem)_minmax(0,20rem)_minmax(0,1fr)] lg:items-baseline"
              >
                <code className="font-mono text-sm font-semibold text-ink">
                  {d.name}
                </code>
                <p className="text-sm text-ink">{d.what}</p>
                <div className="flex flex-col gap-2.5 lg:flex-row lg:items-baseline lg:justify-between lg:gap-8">
                  <p className="max-w-[62ch] text-sm text-ink-muted">{d.how}</p>
                  <StatusBadge
                    status={tone.status}
                    className="w-fit shrink-0 lg:self-start"
                  >
                    {tone.label}
                  </StatusBadge>
                </div>
              </li>
            );
          })}
        </ul>
      </Container>
    </Section>
  );
}

/* ── 04 · the landscape ───────────────────────────────────────────────────── */

const MARK_GLYPH: Record<Mark, { glyph: string; label: string; cls: string }> = {
  yes: { glyph: "✓", label: "Yes", cls: "text-ok" },
  partial: { glyph: "~", label: "Partial", cls: "text-warn" },
  no: { glyph: "–", label: "No", cls: "text-ink-subtle" },
};

function MarkCell({ mark, emphasis }: { mark: Mark; emphasis?: boolean }) {
  const m = MARK_GLYPH[mark];
  return (
    <td
      className={cn(
        "border-b border-line px-4 py-4 text-center",
        emphasis && "bg-accent-wash",
      )}
    >
      <span className={cn("font-mono text-sm", m.cls)} aria-hidden>
        {m.glyph}
      </span>
      <span className="sr-only">{m.label}</span>
    </td>
  );
}

/**
 * The comparison matrix.
 *
 * The runtime guard below is not defensive programming for its own sake:
 * `marks` is positional against `LANDSCAPE_COLUMNS`, and a column added to one
 * array and not the other would silently shift every mark one cell left — a
 * comparison table that is quietly wrong about competitors is a legal problem,
 * not a rendering bug. Failing the build is the correct response.
 */
export function Landscape() {
  for (const row of LANDSCAPE) {
    if (row.marks.length !== LANDSCAPE_COLUMNS.length) {
      throw new Error(
        `LANDSCAPE row "${row.capability}" has ${row.marks.length} marks for ` +
          `${LANDSCAPE_COLUMNS.length} columns — see content/home.ts`,
      );
    }
  }

  const caveats = LANDSCAPE.filter((r) => r.caveat);

  return (
    <Section id="landscape" tone="surface">
      <Container>
        <SectionHeader
          eyebrow="04 — The landscape"
          title="Adjacent categories exist. None of them produces evidence."
          lead="Observability tells you what your AI did. Governance tools hold the policy record. Compliance automation collects the certificates. All three are useful, and none of them survives the question a regulator actually asks: can you prove this was not edited afterwards?"
        />

        {/* `relative` is load-bearing, and the reason is not obvious.

            Each mark cell carries an `sr-only` word beside its glyph, and
            `sr-only` is `position: absolute`. With a statically-positioned
            scroller those thirty spans resolve against the initial containing
            block rather than against this box — so they sit at their static
            position up to 928px to the right, escape the scroller entirely,
            and drag the whole document sideways on a phone. `overflow-x` does
            not clip them, because a scroll container only clips descendants it
            is the containing block for. Making this box positioned fixes it.

            The `-mx-5 px-5` pair lets the table bleed to the screen edges on a
            phone, so the first column starts flush with the copy above it
            rather than inset by a gutter the reader then has to scroll past. */}
        <div
          data-scroll
          className="relative mt-10 -mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0"
        >
          <table className="w-full min-w-[58rem] border-collapse bg-canvas text-sm">
            <caption className="sr-only">
              Capability comparison between AI observability, governance and GRC,
              compliance automation, an in-house build, and CooL.
            </caption>
            <thead>
              <tr>
                <th
                  scope="col"
                  className="w-[22rem] border-b border-line-strong px-0 pb-3 text-left align-bottom text-label uppercase text-ink-subtle"
                >
                  Capability
                </th>
                {LANDSCAPE_COLUMNS.map((c) => (
                  <th
                    key={c.label}
                    scope="col"
                    className="border-b border-line-strong px-4 pb-3 text-center align-bottom"
                  >
                    {/* `hyphens-none` because the browser's automatic hyphen
                        turns "Build in-house" into "Build in-" / "house",
                        which reads as a typo in a table people are scanning
                        for reasons to distrust it. */}
                    <span className="block text-balance hyphens-none text-sm font-semibold text-ink">
                      {c.label}
                    </span>
                    <span className="mt-1 block font-mono text-[0.6875rem] text-ink-subtle">
                      {c.examples}
                    </span>
                  </th>
                ))}
                <th
                  scope="col"
                  className="border-b border-line-strong bg-accent-wash px-4 pb-3 text-center align-bottom"
                >
                  <span className="block text-sm font-semibold text-accent">
                    CooL
                  </span>
                  <span className="mt-1 block font-mono text-[0.6875rem] text-ink-subtle">
                    This product
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {LANDSCAPE.map((row) => (
                <tr key={row.capability}>
                  <th
                    scope="row"
                    className="border-b border-line py-4 pr-6 text-left font-normal text-ink"
                  >
                    {row.capability}
                  </th>
                  {row.marks.map((m, i) => (
                    <MarkCell key={LANDSCAPE_COLUMNS[i]?.label ?? i} mark={m} />
                  ))}
                  <MarkCell mark={row.cool} emphasis />
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2">
          {(Object.keys(MARK_GLYPH) as Mark[]).map((k) => (
            <span
              key={k}
              className="flex items-center gap-2 font-mono text-[0.6875rem] uppercase tracking-[0.06em] text-ink-subtle"
            >
              <span className={MARK_GLYPH[k].cls} aria-hidden>
                {MARK_GLYPH[k].glyph}
              </span>
              {MARK_GLYPH[k].label}
            </span>
          ))}
        </div>

        {caveats.map((row) => (
          <p
            key={row.capability}
            className="mt-6 max-w-[80ch] border-l-2 border-warn pl-4 text-sm text-ink-muted"
          >
            <span className="font-medium text-ink">{row.capability}: </span>
            {row.caveat}
          </p>
        ))}
      </Container>
    </Section>
  );
}

/* ── 05 · standing ────────────────────────────────────────────────────────── */

/**
 * What the company does not have.
 *
 * A section like this normally lives in a trust-centre page nobody visits. It
 * is on the homepage because the product's one asset is that its statements can
 * be checked, and a reader who discovers on their own that there is no SOC 2
 * report has learned two things — the second being that they have to check
 * everything else themselves.
 *
 * The `claim-exempt` markers below are read by `scripts/verify-claims.mjs`.
 * They exist for exactly this: naming a certification in order to say we do not
 * hold it. Every sentence inside the block is negative, and it has to stay that
 * way — the exemption suspends the scanner, not the honesty rule it enforces.
 */
export function Standing() {
  return (
    <Section id="standing">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:gap-16">
          <SectionHeader
            eyebrow="05 — Where we actually are"
            title="The things we do not have yet."
            lead="Published here rather than discovered later. A company selling evidence has exactly one asset, and it is that its statements can be checked."
          />

          {/* claim-exempt:start
              Naming a certification in order to state that we do not hold it.
              See the note above this component. */}
          <dl className="border-t border-line">
            {STANDING.map((s) => (
              <div
                key={s.label}
                className="grid gap-1 border-b border-line py-5 sm:grid-cols-[minmax(0,13rem)_1fr] sm:gap-8"
              >
                <dt className="text-sm font-medium text-ink">{s.label}</dt>
                <dd className="max-w-[62ch] text-sm text-ink-muted">{s.value}</dd>
              </div>
            ))}
          </dl>
          {/* claim-exempt:end */}
        </div>

        {/* The ladder is full-width rather than inside the left column. It is a
            four-rung horizontal track, and at 26rem it wrapped into
            "Security-review-" / "ready" — a component about honest readiness
            reading as a rendering fault. */}
        <div className="mt-10 flex flex-col gap-5 border-t border-line pt-8 lg:flex-row lg:items-center lg:gap-8">
          <div className="min-w-0 flex-1">
            <GateSummary gates={GATES} />
          </div>
          <Button asChild variant="secondary" className="shrink-0">
            <Link href="/security/readiness">Read the full ladder</Link>
          </Button>
        </div>
      </Container>
    </Section>
  );
}

/* ── the closing call to action ───────────────────────────────────────────── */

/**
 * The last band.
 *
 * "Don't trust it. Check it." is the only closing line consistent with
 * everything above it. A CTA that asked for a demo booking after five bands
 * arguing that the reader should not have to take our word for anything would
 * be asking them to do the one thing the page told them not to.
 */
export function CallToAction() {
  return (
    <Section id="start" tone="surface">
      <Container>
        {/* `min-w-0` on both cells. A grid item's automatic minimum size is
            `min-content`, and the `truncate` inside a snippet is `nowrap` — so
            without this the right-hand cell sizes to the full command string
            and drags the whole document wider than the phone it is on. */}
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)] lg:items-center lg:gap-16">
          <div className="min-w-0">
            <Eyebrow>Start</Eyebrow>
            <h2 className="mt-4 max-w-[16ch] text-h1">
              Don&apos;t trust it. Check it.
            </h2>
            <p className="mt-5 max-w-[56ch] text-lead text-ink-muted">
              Install the verifier, take a receipt this site produced in your own
              browser, and run it on your machine with the network switched off.
              If it is wrong, it will say so.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/demo">
                  Run the live demo
                  <ArrowRight className="size-4" strokeWidth={2} />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/contact">Talk to us</Link>
              </Button>
            </div>
          </div>

          <div className="flex min-w-0 flex-col gap-2.5">
            <Snippet code="npm install -g cool-nwc" />
            <Snippet code="cool verify ./change-receipt.json --offline" />
            <p className="mt-1.5 text-xs text-ink-subtle">
              Apache-2.0. The verifier is ours to publish and yours to run — it
              will reject a record we produced if that record is wrong.
            </p>
          </div>
        </div>
      </Container>
    </Section>
  );
}
