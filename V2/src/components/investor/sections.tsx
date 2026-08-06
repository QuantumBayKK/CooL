import Link from "next/link";

import { ArchitectureDiagram } from "@/components/diagrams/ArchitectureDiagram";
import { GateLadder } from "@/components/security/GateLadder";
import {
  Card,
  DataList,
  Eyebrow,
  Rule,
  StatusBadge,
  type Status,
} from "@/components/ui/primitives";
import { GATES } from "@/content/gates";
import {
  BUY_BUILD,
  CLOSING,
  FUNDS,
  LAYERS,
  MVP_SLICE,
  PHASES,
  PRINCIPLES,
  STATUS,
  TERMS,
  TOPOLOGIES,
  VOICES,
} from "@/content/investors";

/**
 * Bodies for the sections that have real content.
 *
 * Everything here is rendered from `content/investors.ts` and `content/gates.ts`
 * — the same modules the public site reads. That is deliberate: an investor
 * room whose claims differ from the public site's is a liability, and the only
 * reliable way to prevent the drift is to have one source.
 */
export function RoomSectionBody({ slug }: { slug: string }) {
  switch (slug) {
    case "overview":
      return <Overview />;
    case "roadmap":
      return <Roadmap />;
    case "competition":
      return <Competition />;
    case "architecture":
      return <Architecture />;
    case "diligence":
      return <Diligence />;
    case "faq":
      return <Faq />;
    default:
      return null;
  }
}

/* ── overview ─────────────────────────────────────────────────────────────── */

function Overview() {
  return (
    <div className="flex flex-col gap-10">
      <Card className="p-6">
        <Eyebrow>The honest position</Eyebrow>
        <p className="mt-4 text-lead text-ink">{CLOSING}</p>
      </Card>

      <section>
        <h2 className="text-h3">What actually runs today</h2>
        <p className="mt-2 text-sm text-ink-muted">
          Three states, counted from the engineering reality rather than from
          the pitch. The verifier enforces the last two — they cannot be made to
          read as working from any UI.
        </p>
        <ul className="mt-5 border-t border-line">
          {STATUS.map((row) => {
            const tone: Status =
              row.state === "working"
                ? "ok"
                : row.state === "partial"
                  ? "warn"
                  : "neutral";
            return (
              <li
                key={row.item}
                className="grid gap-2 border-b border-line py-3.5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start sm:gap-6"
              >
                <div>
                  <p className="text-sm text-ink">{row.item}</p>
                  <p className="mt-1 text-xs text-ink-subtle">{row.note}</p>
                </div>
                <StatusBadge status={tone} className="justify-self-start sm:justify-self-end">
                  {row.state}
                </StatusBadge>
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <h2 className="text-h3">The ask</h2>
        <DataList
          className="mt-5"
          rows={[
            { label: "Amount", value: TERMS.amount },
            { label: "Instrument", value: TERMS.instrument },
            { label: "Cap", value: TERMS.cap },
            { label: "Runway", value: TERMS.runway },
            { label: "Entity", value: TERMS.entity },
          ]}
        />
      </section>

      <section>
        <h2 className="text-h3">What it converts into</h2>
        <ul className="mt-5 border-t border-line">
          {FUNDS.map((slice) => (
            <li
              key={slice.label}
              className="flex items-center gap-4 border-b border-line py-3"
            >
              <span className="w-10 shrink-0 text-sm text-ink" data-numeric>
                {slice.pct}%
              </span>
              {/* Proportional bar rather than a pie: comparing angles is
                  harder than comparing lengths, and this is a ranked list. */}
              <span
                aria-hidden
                className="h-2 shrink-0 bg-accent"
                style={{ width: `${slice.pct * 2.2}%` }}
              />
              <span className="text-sm text-ink-muted">{slice.label}</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-h3">Phasing</h2>
        <DataList
          className="mt-5"
          rows={PHASES.map(([when, what]) => ({ label: when, value: what }))}
        />
      </section>
    </div>
  );
}

/* ── roadmap ──────────────────────────────────────────────────────────────── */

function Roadmap() {
  return (
    <div className="flex flex-col gap-8">
      <p className="max-w-[64ch] text-sm text-ink-muted">
        The roadmap is the readiness ladder, and it is the same one published on
        the public site. Each rung carries the exact sentence we are allowed to
        say once it is green — and the site&apos;s CI fails on any phrase from a
        rung above the one we are actually on.
      </p>
      <GateLadder gates={GATES} />
      <Card className="p-5">
        <p className="text-sm text-ink-muted">
          The hardware items on Gate 1 are the ones no amount of engineering
          here can close: they need a real Phala TDX deployment, and only a run
          on real silicon flips those two domains from{" "}
          <code className="font-mono text-[0.8125rem]">simulated</code> to{" "}
          <code className="font-mono text-[0.8125rem]">pass</code>.
        </p>
      </Card>
    </div>
  );
}

/* ── competition ──────────────────────────────────────────────────────────── */

function Competition() {
  return (
    <div className="flex flex-col gap-10">
      <section>
        <h2 className="text-h3">What we buy, and what we build</h2>
        <p className="mt-2 max-w-[62ch] text-sm text-ink-muted">
          The boundary is the competitive answer. Everything on the &ldquo;buy&rdquo;
          side is a solved problem with a mature implementation; re-solving any
          of it would spend the round on work somebody else has already
          finished.
        </p>
        <ul className="mt-5 border-t border-line">
          {BUY_BUILD.map((row) => (
            <li
              key={row.need}
              className="grid gap-2 border-b border-line py-3 sm:grid-cols-[minmax(0,16rem)_1fr_auto] sm:items-center sm:gap-6"
            >
              <span className="text-sm text-ink">{row.need}</span>
              <span className="text-sm text-ink-muted">{row.choice}</span>
              <StatusBadge
                status={row.verdict === "build" ? "accent" : "neutral"}
                className="justify-self-start sm:justify-self-end"
              >
                {row.verdict}
              </StatusBadge>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-h3">Deployment topologies</h2>
        <div className="mt-5 grid gap-px bg-line sm:grid-cols-3">
          {TOPOLOGIES.map((t) => (
            <div key={t.name} className="bg-canvas p-5">
              <h3 className="text-h4">{t.name}</h3>
              <p className="mt-1.5 text-xs text-ink-subtle">{t.who}</p>
              <p className="mt-2 text-sm text-ink-muted">{t.how}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/* ── architecture ─────────────────────────────────────────────────────────── */

function Architecture() {
  return (
    <div className="flex flex-col gap-10">
      <ArchitectureDiagram />

      <section>
        <h2 className="text-h3">The layers</h2>
        <ul className="mt-5 border-t border-line">
          {LAYERS.map((layer) => (
            <li key={layer.name} className="border-b border-line py-4">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h3 className="text-h4">{layer.name}</h3>
                <span className="font-mono text-xs text-ink-subtle">
                  {layer.stack}
                </span>
                <StatusBadge
                  status={layer.zone === "Customer environment" ? "accent" : "neutral"}
                >
                  {layer.zone === "Customer environment" ? "your boundary" : "ours"}
                </StatusBadge>
              </div>
              <p className="mt-1.5 max-w-[70ch] text-sm text-ink-muted">
                {layer.does}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-h3">The first slice we ship</h2>
        <ul className="mt-4 flex flex-col gap-2">
          {MVP_SLICE.map((item) => (
            <li key={item} className="flex gap-3 text-sm text-ink-muted">
              <span aria-hidden className="mt-2 size-1 shrink-0 bg-accent" />
              {item}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

/* ── diligence ────────────────────────────────────────────────────────────── */

function Diligence() {
  return (
    <div className="flex flex-col gap-10">
      <section>
        <h2 className="text-h3">Principles everything else follows from</h2>
        <ul className="mt-5 flex flex-col">
          {PRINCIPLES.map((p) => (
            <li key={p.n} className="border-b border-line py-5">
              <div className="flex gap-4">
                <span className="font-mono text-xs text-ink-subtle" data-numeric>
                  {p.n}
                </span>
                <div className="min-w-0">
                  <h3 className="text-h4">{p.title}</h3>
                  <p className="mt-1.5 max-w-[70ch] text-sm text-ink-muted">
                    {p.detail}
                  </p>
                  <p className="mt-2 max-w-[70ch] text-sm text-ink">
                    {p.consequence}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <Rule />

      <section>
        <h2 className="text-h3">What practitioners said</h2>
        <ul className="mt-5 flex flex-col gap-6">
          {VOICES.map((v) => (
            <li key={v.name} className="border-l-2 border-line-strong pl-4">
              <p className="max-w-[70ch] text-sm text-ink">{v.quote}</p>
              <p className="mt-2 text-xs text-ink-subtle">
                {v.name} · {v.role} · {v.tag}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

/* ── FAQ ──────────────────────────────────────────────────────────────────── */

const FAQ: readonly { q: string; a: React.ReactNode }[] = [
  {
    q: "What is genuinely working today, and what is not?",
    a: (
      <>
        Working: deterministic records, hybrid post-quantum signing, an RFC 6962
        transparency log and an offline verifier. Not working: hardware
        attestation (reported <code className="font-mono text-[0.8125rem]">simulated</code>)
        and public anchoring (reported{" "}
        <code className="font-mono text-[0.8125rem]">absent</code>). Both rules
        are in the verifier, not the copy — you can check this yourself at{" "}
        <Link href="/verify" className="text-accent underline underline-offset-4">
          /verify
        </Link>
        .
      </>
    ),
  },
  {
    q: "If the log is signed only by your keys, why can't you rewrite history?",
    a: (
      <>
        Today, against a determined insider, we could — and that is exactly why
        witnesses sit on Gate 2 rather than being claimed now. A transparency log
        signed solely by its operator is tamper-evident against outsiders and not
        against the operator. The fix is an independent co-signer who is neither
        CooL nor Phala, and no amount of hardware substitutes for it.
      </>
    ),
  },
  {
    q: "What happens to our AI if CooL goes down?",
    a: (
      <>
        Nothing. Capture is asynchronous, out-of-band and fail-open — it is never
        in the inference path. Events that cannot be queued are counted and the
        count is written as a signed entry, so loss is recorded rather than
        silent.
      </>
    ),
  },
  {
    q: "Where does our data live?",
    a: (
      <>
        Control plane is ours; data plane is yours. Evidence, prompts and PII
        stay inside your VPC or on-prem. The split is architectural rather than
        a policy promise — see the architecture section.
      </>
    ),
  },
  {
    q: "Why post-quantum now?",
    a: (
      <>
        Because evidence has to outlive the machine that made it. A compliance
        record signed today may need to be defensible in fifteen years, and a
        signature that becomes forgeable in that window retroactively destroys
        the value of every record it protected. We sign with ML-DSA-65 and
        Ed25519 together — never post-quantum alone, never classical alone.
      </>
    ),
  },
  {
    q: "Are you certified?",
    a: (
      // claim-exempt:start
      // Naming the standards we do NOT hold is the entire point of this answer,
      // and the claims scanner cannot tell a denial from a boast.
      <>
        No. We hold no SOC 2, ISO 27001 or HIPAA attestation, and we are not
        going to imply otherwise. Certification sits on Gate 3 of the published
        ladder. Anyone telling you a pre-seed company is certified is either
        confused or selling.
      </>
      // claim-exempt:end
    ),
  },
];

function Faq() {
  return (
    <ul className="border-t border-line">
      {FAQ.map((item) => (
        <li key={item.q} className="border-b border-line py-5">
          <h2 className="text-h4">{item.q}</h2>
          <div className="mt-2 max-w-[70ch] text-sm text-ink-muted">{item.a}</div>
        </li>
      ))}
    </ul>
  );
}
