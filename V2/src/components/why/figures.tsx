"use client";

/**
 * The figures for /why.
 *
 * Drawn in SVG rather than shipped as images, for three reasons that all matter
 * on this page: they stay sharp at any size on any screen, they inherit the
 * page's own colours so nothing looks pasted in from another document, and they
 * cost nothing to download — which matters when a page this long already asks
 * for a lot of a reader's patience.
 *
 * Each one is a single idea. None of them is decoration: if a figure is not
 * carrying an argument the prose cannot make as quickly, it should not be here.
 * All are `aria-hidden` with the same point stated in the surrounding text, so
 * nothing is gated behind seeing them.
 */

const INK = "#f0f6fc";
const FOG = "#c9d1d9";
const MIST = "#8b949e";
const LINE = "rgba(240,246,252,0.14)";
const FAIL = "#f85149";
const LIVE = "#3fb950";
const VERIFY = "#58a6ff";
const WARN = "#d29922";

/** Shared frame: a caption under every figure, in the same voice as an aside. */
function Figure({
  children,
  caption,
  className = "",
}: {
  children: React.ReactNode;
  caption: string;
  className?: string;
}) {
  return (
    <figure className={`my-10 ${className}`}>
      {/* Opaque, not translucent: a figure is a diagram, and a diagram with the
          cipher field showing through its own gridlines is unreadable. */}
      <div className="overflow-hidden rounded-xl border border-line bg-panel p-4 sm:p-6">
        {children}
      </div>
      <figcaption className="mt-3 max-w-[58ch] text-[12.5px] leading-[1.6] text-mist">
        {caption}
      </figcaption>
    </figure>
  );
}

/* ── I. thirty seconds, then the afternoon ────────────────────────────── */

/**
 * The whole problem in one bar. The change is a sliver; the paperwork is the
 * rest of the width. Drawn to scale — 30 seconds against 4 hours is 1:480, so
 * the sliver is deliberately drawn wider than true or it would be invisible,
 * and the caption says so rather than letting the chart quietly overstate.
 */
export function ThirtySeconds() {
  // Short labels, because the narrowest bar here is about 60px wide and a label
  // that does not fit its own bar is worse than no label at all. The full names
  // are in the prose directly above this figure.
  const CHORES = [
    ["Write up", 45],
    ["Approval", 60],
    ["Register", 35],
    ["Notify", 20],
    ["Evidence", 40],
    ["Retention", 20],
  ] as const;

  const total = CHORES.reduce((s, [, m]) => s + m, 0);
  let cursor = 0;

  return (
    <Figure caption="The change itself is the thin blue mark at the left — drawn far wider than true, because at real scale you could not see it. Everything to its right is a person, doing it by hand, once per change.">
      <svg viewBox="0 0 720 150" width="100%" role="img" aria-label="A timeline: a thirty-second change followed by about four hours of manual work" className="overflow-visible">
        <text x="0" y="12" fontSize="11" fill={MIST}>
          09:14
        </text>
        <text x="720" y="12" fontSize="11" fill={MIST} textAnchor="end">
          13:34
        </text>

        {/* the change */}
        <rect x="0" y="24" width="14" height="26" rx="3" fill={VERIFY} />

        {/* the chores */}
        {CHORES.map(([label, minutes], i) => {
          const width = (minutes / total) * (720 - 22) - 3;
          const x = 22 + cursor;
          cursor += width + 3;
          return (
            <g key={label}>
              <rect x={x} y="24" width={width} height="26" rx="3" fill={FAIL} opacity={0.28 + i * 0.1} />
              {/* Alternating rows: even at short labels, six of them across
                  700px will touch if they all sit on one baseline. */}
              <text
                x={x + width / 2}
                y={i % 2 === 0 ? 66 : 82}
                fontSize="10.5"
                fill={FOG}
                textAnchor="middle"
              >
                {label}
              </text>
              <text
                x={x + width / 2}
                y={i % 2 === 0 ? 78 : 94}
                fontSize="10"
                fill={MIST}
                textAnchor="middle"
              >
                {minutes}m
              </text>
            </g>
          );
        })}

        <line x1="0" y1="112" x2="14" y2="112" stroke={VERIFY} strokeWidth="1.5" />
        <text x="0" y="130" fontSize="12" fill={VERIFY}>
          30 seconds
        </text>
        <text x="0" y="145" fontSize="10.5" fill={MIST}>
          the actual change
        </text>

        <line x1="22" y1="112" x2="720" y2="112" stroke={FAIL} strokeWidth="1.5" opacity={0.5} />
        <text x="720" y="130" fontSize="12" fill={FAIL} textAnchor="end">
          ~3 hours 40 minutes
        </text>
        <text x="720" y="145" fontSize="10.5" fill={MIST} textAnchor="end">
          the paperwork it drags behind it
        </text>
      </svg>
    </Figure>
  );
}

/* ── II. ten systems that do not speak ────────────────────────────────── */

/**
 * The sprawl. Every node is a system the same fact has to be typed into, and
 * every line is a hand-off that exists only because a person makes it. The
 * point of the drawing is that there is no centre — which is precisely the
 * problem being described.
 */
export function Sprawl() {
  const NODES = [
    { label: "Git", x: 90, y: 40 },
    { label: "Jira", x: 250, y: 26 },
    { label: "Confluence", x: 420, y: 44 },
    { label: "ServiceNow", x: 590, y: 30 },
    { label: "Slack", x: 150, y: 128 },
    { label: "Email", x: 320, y: 148 },
    { label: "Spreadsheets", x: 490, y: 132 },
    { label: "Drive", x: 640, y: 150 },
    { label: "GRC tool", x: 60, y: 210 },
    { label: "Audit vault", x: 380, y: 232 },
  ];

  // Every pair a human actually re-keys between. Deliberately tangled.
  const EDGES: [number, number][] = [
    [0, 1], [1, 2], [1, 3], [2, 3], [0, 4], [1, 4], [2, 5],
    [3, 6], [5, 6], [6, 7], [3, 8], [8, 9], [6, 9], [2, 9],
    [4, 5], [7, 9], [1, 6], [0, 8],
  ];

  return (
    <Figure caption="Ten systems, eighteen hand-offs, and not one of them automatic. The same facts get retyped at every edge — which is why the copies disagree by the end of the week, and why nobody can say which one is right.">
      <svg viewBox="0 0 720 270" width="100%" role="img" aria-label="Ten disconnected systems with manual hand-offs between them" className="overflow-visible">
        {EDGES.map(([a, b]) => (
          <line
            key={`${a}-${b}`}
            x1={NODES[a]!.x}
            y1={NODES[a]!.y}
            x2={NODES[b]!.x}
            y2={NODES[b]!.y}
            stroke={FAIL}
            strokeOpacity={0.16}
            strokeWidth="1"
          />
        ))}
        {NODES.map((n) => (
          <g key={n.label}>
            <circle cx={n.x} cy={n.y} r="4" fill={MIST} />
            <circle cx={n.x} cy={n.y} r="9" fill="none" stroke={LINE} />
            <text
              x={n.x}
              y={n.y + 24}
              fontSize="11"
              fill={FOG}
              textAnchor="middle"
            >
              {n.label}
            </text>
          </g>
        ))}
      </svg>
    </Figure>
  );
}

/* ── III. the year ────────────────────────────────────────────────────── */

/**
 * Fifty-two weeks as fifty-two marks, with the lost ones filled in. The
 * argument the prose cannot make as fast: this is not an inconvenience, it is
 * a measurable fraction of a team's year.
 */
export function TheYear() {
  const WEEKS = 52;
  const LOST = 4; // 3–4 weeks; the figure takes the top of the range and says so

  return (
    <Figure caption="Fifty-two weeks. The filled marks are what a mid-size AI team loses to change paperwork in a year — our estimate, taking the top of the 3–4 week range. It is not the biggest line in anyone's budget. It is the one nobody chose to spend.">
      <svg viewBox="0 0 720 96" width="100%" role="img" aria-label="Fifty-two weeks, of which about four are lost to change paperwork" className="overflow-visible">
        {Array.from({ length: WEEKS }, (_, i) => {
          const perRow = 26;
          const x = (i % perRow) * 27.4;
          const y = Math.floor(i / perRow) * 34;
          const lost = i < LOST;
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width="22"
              height="26"
              rx="3"
              fill={lost ? FAIL : "rgba(240,246,252,0.07)"}
              opacity={lost ? 0.85 : 1}
            />
          );
        })}
        <text x="0" y="92" fontSize="11" fill={FAIL}>
          3–4 weeks gone
        </text>
        <text x="720" y="92" fontSize="11" fill={MIST} textAnchor="end">
          per team, per year
        </text>
      </svg>
    </Figure>
  );
}

/* ── IV. the investigation ────────────────────────────────────────────── */

/**
 * Two tracks for the same question. The top one is what happens when the
 * answer has to be reconstructed from memory; the bottom is what happens when
 * it was recorded at the time. The gap is the product.
 */
export function Investigation() {
  const WITHOUT = [
    ["Something breaks", 0],
    ["Who touched it?", 55],
    ["Search Slack", 110],
    ["Ask three teams", 190],
    ["Find the PR", 260],
    ["Confirm the cause", 330],
  ] as const;

  return (
    <Figure caption="The same question, asked two ways. The top track is what an afternoon looks like when the answer has to be reassembled from memory and chat history. The bottom is a lookup, because the link was recorded at the moment the change was made — not reconstructed after it broke.">
      <svg viewBox="0 0 720 190" width="100%" role="img" aria-label="An investigation taking about four hours without an index, versus about three minutes with one" className="overflow-visible">
        {/* without */}
        <text x="0" y="12" fontSize="11" fill={MIST}>
          WITHOUT A RECORD
        </text>
        <line x1="0" y1="42" x2="700" y2="42" stroke={FAIL} strokeOpacity={0.3} strokeWidth="1.5" />
        {WITHOUT.map(([label, minutes], i) => {
          const x = (minutes / 400) * 700;
          return (
            <g key={label}>
              <circle cx={x} cy="42" r="4.5" fill={FAIL} opacity={0.85} />
              <text
                x={x}
                y={i % 2 === 0 ? 30 : 62}
                fontSize="10.5"
                fill={FOG}
                textAnchor={i === 0 ? "start" : "middle"}
              >
                {label}
              </text>
            </g>
          );
        })}
        <text x="700" y="46" fontSize="12" fill={FAIL} textAnchor="end">
          ~4 hours
        </text>

        {/* with */}
        <text x="0" y="126" fontSize="11" fill={MIST}>
          WITH THE RECORD
        </text>
        <line x1="0" y1="156" x2="700" y2="156" stroke={LINE} strokeWidth="1.5" />
        <line x1="0" y1="156" x2="16" y2="156" stroke={LIVE} strokeWidth="3" />
        <circle cx="0" cy="156" r="4.5" fill={LIVE} />
        <circle cx="16" cy="156" r="4.5" fill={LIVE} />
        <text x="0" y="144" fontSize="10.5" fill={FOG}>
          Something breaks
        </text>
        <text x="26" y="176" fontSize="10.5" fill={FOG}>
          Open the change that caused it
        </text>
        <text x="700" y="160" fontSize="12" fill={LIVE} textAnchor="end">
          ~3 minutes
        </text>
      </svg>
    </Figure>
  );
}

/* ── V. the regulatory clock ──────────────────────────────────────────── */

/**
 * Dates on a line. This is the figure that turns "we should get to this" into
 * "we are already inside the window", which is the entire argument of the
 * chapter it sits in.
 */
export function RegulatoryClock() {
  const MARKS = [
    { date: "Aug 2024", label: "EU AI Act enters into force", tone: MIST },
    { date: "Feb 2025", label: "Prohibited practices apply", tone: MIST },
    { date: "Aug 2025", label: "GPAI obligations apply", tone: MIST },
    { date: "Aug 2026", label: "High-risk obligations apply", tone: FAIL },
    { date: "2027", label: "Full applicability", tone: WARN },
  ];

  return (
    <Figure caption="Article 12 requires automatic, lifelong event logging for high-risk systems. The date that matters is not when the rule was written — it is that logging cannot be applied retroactively. A record either existed when the change happened, or it does not exist.">
      <svg viewBox="0 0 720 128" width="100%" role="img" aria-label="A timeline of EU AI Act milestones through 2027" className="overflow-visible">
        <line x1="0" y1="56" x2="720" y2="56" stroke={LINE} strokeWidth="1.5" />
        {MARKS.map((mark, i) => {
          const x = (i / (MARKS.length - 1)) * 700;
          const isNow = mark.tone === FAIL;
          return (
            <g key={mark.date}>
              <line x1={x} y1="46" x2={x} y2="66" stroke={mark.tone} strokeWidth={isNow ? 2 : 1} />
              <circle cx={x} cy="56" r={isNow ? 5 : 3.5} fill={mark.tone} />
              <text
                x={x}
                y="34"
                fontSize="11.5"
                fill={isNow ? INK : FOG}
                textAnchor={i === 0 ? "start" : i === MARKS.length - 1 ? "end" : "middle"}
                fontWeight={isNow ? 600 : 400}
              >
                {mark.date}
              </text>
              <text
                x={x}
                y="86"
                fontSize="10.5"
                fill={MIST}
                textAnchor={i === 0 ? "start" : i === MARKS.length - 1 ? "end" : "middle"}
              >
                {mark.label}
              </text>
            </g>
          );
        })}
        <text x="0" y="120" fontSize="10.5" fill={MIST}>
          India&apos;s DPDP Rules run a parallel clock on retention and audit for significant data fiduciaries.
        </text>
      </svg>
    </Figure>
  );
}

/* ── VIII. the receipt ────────────────────────────────────────────────── */

/**
 * What actually gets produced. Labelled rather than styled: the reader should
 * come away knowing the four things a receipt commits to and the two it
 * deliberately does not, because that pairing is the product's whole claim to
 * being trustworthy.
 */
export function ReceiptAnatomy() {
  const ROWS = [
    ["record", "which model, which version, at what time", LIVE],
    ["request", "a salted hash of the input — never the input", LIVE],
    ["response", "a salted hash of the output — never the output", LIVE],
    ["binding_hash", "a commitment to all of the above, in canonical bytes", LIVE],
    ["signature", "ML-DSA-65 + Ed25519 — both must verify", LIVE],
    ["inclusion", "proof the record sits in an append-only log", LIVE],
    ["attestation", "MOCK — no hardware quote in this build", WARN],
    ["anchor", "ABSENT — not written to a public chain", MIST],
  ] as const;

  return (
    <Figure caption="Roughly nine kilobytes of JSON. The last two rows are the ones worth noticing: they are reported as unmet, in the verifier itself, and no setting turns them green. A format that overstated them would be worth less than no format at all.">
      <svg viewBox="0 0 720 268" width="100%" role="img" aria-label="The structure of a CooL receipt, including the two domains it reports as unmet" className="overflow-visible">
        <text x="0" y="12" fontSize="11" fill={MIST} fontFamily="ui-monospace, monospace">
          cool.receipt.v1
        </text>
        {ROWS.map(([key, what, tone], i) => {
          const y = 34 + i * 29;
          return (
            <g key={key}>
              <rect x="0" y={y} width="720" height="24" rx="4" fill="rgba(240,246,252,0.035)" />
              <rect x="0" y={y} width="3" height="24" rx="1.5" fill={tone} />
              <text
                x="14"
                y={y + 16}
                fontSize="11.5"
                fill={tone === MIST ? MIST : INK}
                fontFamily="ui-monospace, monospace"
              >
                {key}
              </text>
              <text x="160" y={y + 16} fontSize="11.5" fill={FOG}>
                {what}
              </text>
            </g>
          );
        })}
      </svg>
    </Figure>
  );
}

/* ── X. the two ledgers ───────────────────────────────────────────────── */

/**
 * The close. Two columns of the same week, which is the cleanest way to make
 * the argument without a single adjective.
 */
export function Ledger() {
  const ROWS = [
    ["Writing the change record", "3h 40m per change", "already written"],
    ["Finding what caused an incident", "half a day", "one query"],
    ["Preparing for an audit", "two to six weeks", "an export"],
    ["Answering a security review", "days of back-and-forth", "hand over the receipts"],
    ["Proving which model ran", "you cannot", "it is in the record"],
  ] as const;

  return (
    <Figure caption="The same week of work, kept two ways. Nothing in the right-hand column is faster because someone worked harder; it is faster because the record was written at the moment the change happened, by the system that made it.">
      <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-[1.1fr_0.9fr_0.9fr]">
        <div className="hidden sm:block" />
        <p className="hidden text-[11px] uppercase tracking-[0.12em] text-fail sm:block">
          By hand
        </p>
        <p className="hidden text-[11px] uppercase tracking-[0.12em] text-live sm:block">
          With CooL
        </p>
        {ROWS.map(([task, before, after]) => (
          <div key={task} className="contents">
            <p className="mt-4 border-t border-line pt-3 text-[13.5px] text-fog sm:mt-0">
              {task}
            </p>
            <p className="text-[13.5px] text-fail sm:mt-0 sm:border-t sm:border-line sm:pt-3">
              <span className="mr-2 text-[11px] uppercase tracking-[0.1em] text-mist sm:hidden">
                by hand
              </span>
              {before}
            </p>
            <p className="mt-1 text-[13.5px] text-live sm:mt-0 sm:border-t sm:border-line sm:pt-3">
              <span className="mr-2 text-[11px] uppercase tracking-[0.1em] text-mist sm:hidden">
                with CooL
              </span>
              {after}
            </p>
          </div>
        ))}
      </div>
    </Figure>
  );
}
