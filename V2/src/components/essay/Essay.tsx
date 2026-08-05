/**
 * The public site, as an essay.
 *
 * Ten sections, one screen each, read top to bottom. Server components with no
 * client boundary and no scroll-triggered reveals: every word is in the HTML
 * that arrives, which is what a crawler indexes and what someone with a flaky
 * connection actually gets.
 *
 * The copy here is final and is not paraphrased anywhere else. Two rules govern
 * it and both are load-bearing:
 *
 * Narrative sections stay at or under ~80 words so they fit one screen without
 * scrolling inside themselves. If a section grows past that, the fix is to cut
 * words, not to shrink the type — type that shrinks to fit is type nobody
 * reads.
 *
 * Nothing on these pages claims a customer, a partner or a number we cannot
 * stand behind. Market figures say they are estimates; the attestation tier
 * says it is unfinished. Those markers are an asset with the exact audience
 * that checks, and they are never to be quietly dropped.
 */
import Image from "next/image";
import Link from "next/link";
import { CONTACT, PHONES } from "@/lib/contact";

/**
 * The numbers, as tap targets.
 *
 * A phone number on a phone is a `tel:` link or it is a screenshot someone has
 * to retype. Each one is its own 48px row rather than an inline run inside a
 * paragraph, because an inline link inherits 13px line-height and becomes a
 * 15px target — a mis-tap every time.
 *
 * 48px, not 44. 44 is Apple's floor and it is what these used to be; the build
 * document's QA checklist asks for 48, which is also the Material and WCAG 2.2
 * AAA figure, and it is what every `.btn` on the page already used. Two
 * different minimums on one page is how a row of links ends up looking aligned
 * and tapping unevenly.
 */
function PhoneLinks({ align = "center" }: { align?: "center" | "left" }) {
  return (
    <div className={align === "center" ? "phones" : "phones phones-left"}>
      {PHONES.map((phone) => (
        <a key={phone.e164} href={`tel:${phone.e164}`} className="tap-link tap-link-strong">
          {phone.display}
        </a>
      ))}
    </div>
  );
}

/* ── 1 · cover ────────────────────────────────────────────────────────── */

export function Cover() {
  return (
    <section id="cover">
      <div className="wrap">
        <h1 className="opener wordmark">CooL</h1>
        <p className="opener promise">
          The black box for AI.
        </p>
        <p className="body">
          Every change your AI makes — documented, governed, and provable.
          Automatically.
        </p>
        <div className="actions-loose">
          <Link href="/demo" className="btn btn-primary">
            See it
          </Link>
          <a href={CONTACT.booking} target="_blank" rel="noreferrer" className="btn btn-ghost">
            Book a call
          </a>
        </div>

        {/* Contact on the first screen, as asked. Quiet enough not to compete
            with the two buttons, and dialable in one tap. */}
        <div className="actions">
          <PhoneLinks />
        </div>
      </div>
      <span className="scroll-cue" aria-hidden="true">
        Scroll
      </span>
    </section>
  );
}

/* ── 2 · problem ──────────────────────────────────────────────────────── */

export function Problem() {
  return (
    <section id="problem">
      <div className="wrap">
        <h2 className="opener">Every AI change drags hours of manual work behind it.</h2>
        <p className="body">
          One ordinary morning, a developer changes a single line in a prompt —
          thirty seconds of work. Then someone has to document it, get it
          approved, update governance, file the evidence, and keep it for years.
          An afternoon, gone.
        </p>
        <p className="body">
          It happens again the next day, and the day after — quietly burning
          weeks a year and stalling the biggest deals in security review.
        </p>
        <p className="body">
          And now the law wants proof: the kind of provable record no one can
          produce by hand.
        </p>
      </div>
    </section>
  );
}

/* ── 3 · solution ─────────────────────────────────────────────────────── */

export function Solution() {
  return (
    <section id="solution">
      <div className="wrap">
        <h2 className="opener">Install CooL once, and that morning simply disappears.</h2>
        <p className="body">
          The moment a change ships, CooL is already on it — the write-up, the
          approval, the governance update, the sealed tamper-proof evidence, the
          notifications — all before the laptop closes.
        </p>
        <p className="body">
          The ten-tool, afternoon-long chore becomes invisible. Teams win back
          the weeks they lost to paperwork, compliance costs fall with it, and
          audits stop being fire drills.
        </p>
        <p className="body">
          Every record is provable across any AI provider — and anyone can check
          it, without trusting us.
        </p>
      </div>
    </section>
  );
}

/* ── 4 · technology & IP moat ─────────────────────────────────────────── */

export function Technology() {
  return (
    <section id="technology">
      <div className="wrap">
        <h2 className="opener">The hard part is the cryptography — and it already runs.</h2>
        <p className="body">
          Every change is hashed and signed the instant it happens, then written
          to a tamper-evident log that can&rsquo;t be quietly edited. The
          signatures are post-quantum, so the evidence still stands in ten years
          — and anyone can verify a record offline, without trusting us.
        </p>
        <p className="body">
          A higher-assurance tier runs the evidence inside confidential
          hardware, proving which model actually ran. That tier is the one part
          we mark as still being finished — in the open, not hidden.
        </p>
        <p className="tiny">
          <em>
            Under the hood — hybrid ML-DSA + Ed25519 signing · tamper-evident
            transparency log · TEE attestation · control-plane / data-plane
            split.
          </em>
        </p>
      </div>
    </section>
  );
}

/* ── 5 · business model ───────────────────────────────────────────────── */

export function Model() {
  return (
    <section id="model">
      <div className="wrap">
        <h2 className="opener">Free to adopt. Paid to scale.</h2>
        <p className="body">
          A developer installs the SDK free in under an hour. Teams that rely on
          it move to a monthly subscription; companies that standardise on it
          take an annual, org-wide license, with on-prem for regulated buyers.
        </p>
        <p className="body">
          We sell the time saved and the audits de-risked — never the
          cryptography. The maths is why it holds up, not why anyone buys.
        </p>
      </div>
    </section>
  );
}

/* ── 6 · market ───────────────────────────────────────────────────────── */

/**
 * The three rings are sized by AREA, not by radius.
 *
 * Sizing by radius is the default mistake and it is not a small one: at these
 * values it would draw the SOM roughly seven times larger than it is. r ∝ √v
 * keeps the picture honest, which matters more here than anywhere else on the
 * page, because a market graphic is exactly where a reader expects to be
 * flattered.
 */
function MarketRings() {
  // value is $B. Order matters: largest first, so the smaller rings paint on top.
  const rings = [
    { key: "TAM", label: "TAM", figure: "$12–15B", value: 13.5, fill: "rgba(91,140,255,0.10)", stroke: "rgba(91,140,255,0.45)", ink: "#8a94a8" },
    { key: "SAM", label: "SAM", figure: "$2–4B", value: 3, fill: "rgba(91,140,255,0.16)", stroke: "rgba(91,140,255,0.7)", ink: "#c7cfdd" },
    { key: "SOM", label: "SOM", figure: "$100–300M", value: 0.2, fill: "rgba(62,207,154,0.35)", stroke: "rgba(62,207,154,0.95)", ink: "#3ecf9a" },
  ];
  const max = rings[0]!.value;
  const R = 74;
  const cx = 92;
  const cy = 92;
  // Labels sit OUTSIDE the circles on a shared left rail, each joined to its
  // ring by a leader line. They used to be stacked at the centre, where the
  // SAM and SOM captions printed straight across the SOM disc and each other —
  // the graphic that is supposed to demonstrate honest scaling was the one
  // piece of the page you could not read.
  const labelX = 196;
  const rowY: readonly [number, number, number] = [40, 92, 144];
  return (
    <svg
      viewBox="0 0 340 184"
      role="img"
      aria-label="Market sizing: total addressable 12 to 15 billion dollars, serviceable 2 to 4 billion, obtainable 100 to 300 million. Circles are scaled by area, not by radius."
      className="rings"
    >
      {rings.map((ring) => (
        <circle
          key={ring.key}
          cx={cx}
          cy={cy}
          r={R * Math.sqrt(ring.value / max)}
          fill={ring.fill}
          stroke={ring.stroke}
          strokeWidth={1}
        />
      ))}

      {rings.map((ring, i) => {
        const r = R * Math.sqrt(ring.value / max);
        return (
          <g key={ring.key}>
            {/* leader: from the ring edge out to the label rail */}
            <path
              d={`M ${cx + r} ${cy} L ${labelX - 12} ${rowY[i]!}`}
              stroke={ring.stroke}
              strokeWidth={0.75}
              fill="none"
              opacity={0.55}
            />
            <circle cx={cx + r} cy={cy} r={2} fill={ring.stroke} />
            <text x={labelX} y={rowY[i]! - 3} fill={ring.ink} fontSize={11} fontFamily="monospace" letterSpacing="0.12em">
              {ring.label}
            </text>
            <text x={labelX} y={rowY[i]! + 12} fill={ring.ink} fontSize={13} fontFamily="monospace" fontWeight={600}>
              {ring.figure}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function Market() {
  return (
    <section id="market">
      <div className="wrap">
        <h2 className="opener">Regulation is turning &ldquo;nice to have&rdquo; into &ldquo;legally required.&rdquo;</h2>
        <p className="body">
          AI governance and operations software is heading toward a $12–15B
          market by 2030; the slice running production AI in regulated,
          security-conscious sectors is $2–4B. Our realistic reach as the system
          of record is $100–300M.
        </p>
        <p className="body">
          The EU AI Act and India&rsquo;s DPDP rules now demand automated,
          provable records of what AI did — which is exactly, and only, what
          CooL produces.
        </p>
        <MarketRings />
        <p className="tiny">
          <em>
            Market figures are estimates (Grand View Research, Next Move
            Strategy) — not measured benchmarks.
          </em>
        </p>
      </div>
    </section>
  );
}

/* ── 7 · competitors ──────────────────────────────────────────────────── */

/**
 * The five capabilities, once, feeding both the table and the stacked list.
 *
 * `mobileCap` exists for exactly one row. The build document gives the wide
 * table "Works across every provider (neutral)" and the phone list "Neutral
 * across every provider" — the parenthetical earns its place in a six-column
 * header row and costs a line wrap on a 390px screen. Both strings are final
 * copy, so the fix is to carry both rather than to pick one.
 *
 * Everything else stays shared. One array is what guarantees the two views can
 * never drift into claiming different things.
 */
/** The mark cells, styled by meaning rather than by column. */
function markClass(v: string): string {
  if (v === "×") return "mark mark-no";
  if (v === "~") return "mark mark-partial";
  if (v === "manual") return "mark-manual";
  return "mark";
}

const CAPABILITIES = [
  { cap: "Auto-captures every AI change", obs: "~", grc: "×", comp: "×", diy: "manual", others: "Others mostly ×" },
  { cap: "Tamper-proof, provable evidence", obs: "×", grc: "×", comp: "×", diy: "×", others: "Others ×" },
  {
    cap: "Works across every provider (neutral)",
    mobileCap: "Neutral across every provider",
    obs: "×",
    grc: "~",
    comp: "~",
    diy: "—",
    others: "Others partial",
  },
  { cap: "Proves which model actually ran", obs: "×", grc: "×", comp: "×", diy: "×", others: "Others ×" },
  { cap: "Zero manual effort", obs: "×", grc: "×", comp: "~", diy: "×", others: "Others ×" },
] satisfies readonly {
  cap: string;
  mobileCap?: string;
  obs: string;
  grc: string;
  comp: string;
  diy: string;
  others: string;
}[];

export function Competitors() {
  return (
    <section id="competitors">
      <div className="wrap wrap-wide">
        <h2 className="opener">Everyone tracks AI. No one proves it.</h2>

        {/* ≥720px — the full comparison */}
        <div className="cmp-desktop">
          <div className="tablewrap panel">
            <table>
              <thead>
                <tr>
                  <th className="th-cap">Capability</th>
                  <th>
                    AI Observability
                    <br />
                    <span className="th-sub">Langfuse, Datadog</span>
                  </th>
                  <th>
                    Governance / GRC
                    <br />
                    <span className="th-sub">Credo AI, OneTrust</span>
                  </th>
                  <th>
                    Compliance Automation
                    <br />
                    <span className="th-sub">Vanta, Drata</span>
                  </th>
                  <th>Build in-house</th>
                  <th className="cool-col">CooL</th>
                </tr>
              </thead>
              <tbody>
                {CAPABILITIES.map((row) => (
                  <tr key={row.cap}>
                    <td className="cap">{row.cap}</td>
                    <td className={markClass(row.obs)}>{row.obs}</td>
                    <td className={markClass(row.grc)}>{row.grc}</td>
                    <td className={markClass(row.comp)}>{row.comp}</td>
                    <td className={markClass(row.diy)}>{row.diy}</td>
                    <td className="cool-col mark mark-yes">✓</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* <720px — the same five capabilities, two columns */}
        <div className="cmp-mobile panel">
          {CAPABILITIES.map((row) => (
            <div key={row.cap} className="cmp-row">
              <strong className="cmp-cap">
                {"mobileCap" in row ? row.mobileCap : row.cap}
              </strong>
              <span className="cmp-verdict">
                <span className="grn">CooL ✓</span> · {row.others}
              </span>
            </div>
          ))}
        </div>

        <p className="body actions">
          They watch, or they store policy, or they cover the company — none of
          them prove what the AI itself did. CooL does, across any stack, and the
          proof compounds with every change.
        </p>
      </div>
    </section>
  );
}

/* ── 8 · founders ─────────────────────────────────────────────────────── */

const FOUNDERS = [
  {
    photo: "/founders/pranauv.jpg",
    name: "Pranauv Shrinaath S",
    role: "Founder & CEO",
    field: "Post-quantum cryptography & blockchain",
    lines: [
      <>
        <code>ipsec-pqc-ikev2</code> — published research mapping ML-KEM into
        IKEv2 (liboqs / C).
      </>,
      <>Research on decentralising public banks, secured with PQC + Hyperledger Fabric.</>,
      <>Onsite research internship, NUS Singapore. Building since 14.</>,
    ],
    github: "https://github.com/KenidoesCode",
    handle: "github.com/KenidoesCode",
  },
  {
    photo: "/founders/kailosh.jpg",
    name: "Kailosh Kalimuthu",
    role: "Co-Founder & CTO",
    field: "Trusted execution environments & AI inference",
    lines: [
      <>
        Built <strong>BIFROST</strong> — a decentralised P2P comms / storage /
        compute network.
      </>,
      <>Repurposes idle hardware into an encrypted, distributed micro-cloud.</>,
      <>6 months building with US startup Decipher. Building since 16.</>,
    ],
    github: "https://github.com/Sk1zmo",
    handle: "github.com/Sk1zmo",
  },
];

export function Founders() {
  return (
    <section id="team" className="tall">
      <div className="wrap wrap-wide">
        <h2 className="opener">
          The rare intersection: applied post-quantum cryptography and
          confidential-compute inference.
        </h2>

        <div className="founders">
          {FOUNDERS.map((f) => (
            <div key={f.name} className="founder panel">
              {/* Intrinsic size is declared so the block never reflows as the
                  photo arrives — the jump is worst on exactly the connection
                  where it is most annoying. */}
              <Image
                src={f.photo}
                alt={f.name}
                width={280}
                height={280}
                className="avatar"
                sizes="(max-width: 720px) 28vw, 140px"
              />
              <div className="founder-name">{f.name}</div>
              <div className="founder-role">{f.role}</div>
              <div className="tiny founder-field">{f.field}</div>
              <div className="founder-lines">
                {f.lines.map((line, i) => (
                  <p key={i} className="body">
                    {line}
                  </p>
                ))}
              </div>
              <a href={f.github} target="_blank" rel="noreferrer" className="tap-link tap-link-quiet">
                {f.handle}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── 9 · roadmap ──────────────────────────────────────────────────────── */

export function Roadmap() {
  return (
    <section id="roadmap">
      <div className="wrap">
        <h2 className="opener">
          Near-term: the automatic system of record for every AI change.
        </h2>
        <p className="body">
          First the SDK and the reference integrations; then paid pilots with
          regulated-AI teams; then the enterprise standard.
        </p>
        <p className="body">
          Long-term, CooL is the control plane for enterprise AI — every change,
          across every provider, documented, governed, and provable. The layer
          every AI change flows through.
        </p>
      </div>
    </section>
  );
}

/* ── 10 · explore ─────────────────────────────────────────────────────── */

export function Explore() {
  return (
    <section id="explore">
      <div className="wrap">
        <h2 className="opener">See it for yourself.</h2>
        <div className="actions">
          <Link href="/studio" className="btn btn-ghost">
            See the Studio
          </Link>
          <Link href="/sdk" className="btn btn-ghost">
            Get the SDK
          </Link>
          <a href={CONTACT.booking} target="_blank" rel="noreferrer" className="btn btn-primary">
            Book a call
          </a>
          <Link href="/investors" className="btn btn-ghost">
            Investors
          </Link>
        </div>
        <div className="actions-loose">
          <PhoneLinks />
        </div>
        <p className="tiny" style={{ marginTop: "var(--s1)" }}>
          {CONTACT.company} · {CONTACT.city}, India
        </p>
        {/* Its own line, not inline in the paragraph above: an inline link
            inherits the line-height of 12–14px type, which is a 15px tap
            target and a mis-tap every time on a thumb. */}
        <a href={`mailto:${CONTACT.email}`} className="tap-link tap-link-small">
          {CONTACT.email}
        </a>
      </div>
    </section>
  );
}
