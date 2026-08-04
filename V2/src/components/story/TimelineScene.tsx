"use client";

/**
 * Act eight — the console, as a timeline.
 *
 * Not analytics. A buyer does not open this to find a chart; they open it to
 * answer "what changed, who changed it, and can I prove it" — which is a list
 * in time order where every row ends in a verdict. So the console is a timeline
 * and every card carries a Verify button that re-runs the real verifier on
 * click. Nothing is cached: press it twice and it is computed twice.
 *
 * The counters at the top are the first thing a buyer reads, and they are the
 * easiest thing in the product to quietly inflate, so they are built to be
 * interrogated. Two of them are measured from this session — records sealed,
 * log size — and are labelled `this session`. The rest are a projection over a
 * stated estate, labelled `projected`, and the arithmetic that produces them is
 * printed underneath rather than hidden behind the number. Anyone who thinks
 * eighteen minutes is the wrong figure for writing a change note can substitute
 * their own and redo it in their head.
 *
 * The tamper control is in here rather than off in a security tab on purpose.
 * The moment a verdict flips from VALID to INVALID in front of someone, on a
 * record they watched get created, is the moment the rest of the demo stops
 * being a slideshow.
 */
import { useCallback, useMemo, useState } from "react";
import { AlertTriangle, ChevronDown, RotateCcw, ShieldCheck } from "lucide-react";
import { domainOrder } from "@/lib/cool/phala";
import type { VerdictV2 } from "@/lib/cool/phala";
import { ESTATE_SCALE, MANUAL_MINUTES } from "@/lib/story/script";
import { useStory, type Row } from "./session";
import { Button, Digest, Label, Panel, Pill, clockOf, relativeOf, toneOf } from "./ui";

/* ── the counters ─────────────────────────────────────────────────────── */

/**
 * Everything the header shows, derived from the two constants in the script.
 *
 * Computed rather than written down so the arithmetic printed under each tile
 * cannot drift away from the number above it.
 */
function projection() {
  const noteMinutes = ESTATE_SCALE.monthlyChanges * MANUAL_MINUTES.changeNote;
  const docMinutes = ESTATE_SCALE.monthlyDocuments * MANUAL_MINUTES.controlNarrative;
  const totalHours = Math.round((noteMinutes + docMinutes) / 60);
  return {
    totalHours,
    tasks: ESTATE_SCALE.monthlyChanges + ESTATE_SCALE.monthlyDocuments,
    noteMinutes,
    docMinutes,
  };
}

function Counters({ sealed, logSize }: { sealed: number; logSize: number }) {
  const p = useMemo(projection, []);

  const tiles = [
    {
      value: `${p.totalHours.toLocaleString()} h`,
      label: "Time saved this month",
      how: `${ESTATE_SCALE.monthlyChanges.toLocaleString()} × ${MANUAL_MINUTES.changeNote}m + ${ESTATE_SCALE.monthlyDocuments.toLocaleString()} × ${MANUAL_MINUTES.controlNarrative}m`,
      kind: "projected" as const,
    },
    {
      value: p.tasks.toLocaleString(),
      label: "Manual tasks eliminated",
      how: "change notes + control narratives nobody wrote",
      kind: "projected" as const,
    },
    {
      value: ESTATE_SCALE.monthlyDocuments.toLocaleString(),
      label: "Compliance documents generated",
      how: "one per obligation, per system, per period",
      kind: "projected" as const,
    },
    {
      value: `${sealed}`,
      label: "Evidence records sealed",
      how: `in this browser · log tree size ${logSize}`,
      kind: "measured" as const,
    },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {tiles.map((tile) => (
          <Panel key={tile.label} className="p-3.5">
            <div className="flex items-start justify-between gap-2">
              <span
                className="font-mono text-[26px] leading-none"
                style={{
                  color: tile.kind === "measured" ? "var(--color-live)" : "var(--color-ink)",
                }}
              >
                {tile.value}
              </span>
              <Pill tone={tile.kind === "measured" ? "live" : "mock"} glyph={false}>
                {tile.kind === "measured" ? "this session" : "projected"}
              </Pill>
            </div>
            <div className="mt-2 text-[12px] leading-snug text-fog">{tile.label}</div>
            <div className="mt-1 font-mono text-[10.5px] leading-snug text-mist">{tile.how}</div>
          </Panel>
        ))}
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-mist">
        Projections are for a stated demo estate, not a customer measurement — CooL has no
        customer data. The minutes are estimates and are printed so they can be argued with. The
        fourth tile is counted from the records sealed in this tab.
      </p>
    </div>
  );
}

/* ── the timeline ─────────────────────────────────────────────────────── */

export function TimelineScene() {
  const { rows, logSize } = useStory();

  return (
    <div className="thin-scroll flex h-full min-h-0 flex-col gap-4 overflow-y-auto pr-1">
      <Counters sealed={rows.length} logSize={logSize} />

      <div>
        <div className="mb-2 flex items-baseline justify-between">
          <Label>Change timeline</Label>
          <span className="text-[11px] text-mist">{rows.length} records · newest first</span>
        </div>
        <ol className="flex flex-col gap-2">
          {rows.map((row) => (
            <li key={row.id}>
              <TimelineCard row={row} />
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function TimelineCard({ row }: { row: Row }) {
  const { reverify, tamper } = useStory();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<"verify" | "tamper" | null>(null);
  const [forged, setForged] = useState<VerdictV2 | null>(null);

  const verdict = forged ?? row.verdict;
  const ok = verdict?.ok ?? false;

  const onVerify = useCallback(async () => {
    setBusy("verify");
    setForged(null);
    await reverify(row.id);
    setBusy(null);
    setOpen(true);
  }, [reverify, row.id]);

  const onTamper = useCallback(async () => {
    setBusy("tamper");
    const result = await tamper(row.id);
    setForged(result);
    setBusy(null);
    setOpen(true);
  }, [tamper, row.id]);

  return (
    <Panel
      className={`overflow-hidden ${row.fresh ? "story-flash" : ""}`}
      style={forged ? { borderColor: "rgba(248,81,73,0.5)" } : undefined}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
        <span className="font-mono text-[11.5px] text-mist tabular-nums">{clockOf(row.at)}</span>

        <span className="text-[13.5px] font-medium text-ink">{row.label}</span>

        <span className="font-mono text-[11.5px] text-mist">{row.ref}</span>

        {row.fresh && <Pill tone="verify">new</Pill>}

        <span className="ml-auto flex items-center gap-2">
          {verdict && (
            <Pill tone={forged ? "fail" : ok ? "live" : "fail"}>
              {forged ? "tampered · invalid" : ok ? "verified" : "invalid"}
            </Pill>
          )}
          <Button size="sm" onClick={onVerify} disabled={busy !== null}>
            {busy === "verify" ? "verifying…" : "Verify"}
          </Button>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="rounded p-1 text-mist transition-colors hover:text-ink"
            aria-label={open ? "collapse" : "expand"}
          >
            <ChevronDown size={15} className={open ? "rotate-180" : ""} />
          </button>
        </span>
      </div>

      {open && verdict && (
        <div className="border-t border-line px-4 py-3">
          <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
            {/* evidence */}
            <div>
              <Label>Evidence</Label>
              <div className="mt-2 flex flex-col">
                <Row2 k="Record id" v={<Digest value={row.id} chars={18} />} />
                <Row2 k="Binding hash" v={<Digest value={row.receipt.binding_hash} chars={18} />} />
                <Row2 k="Timestamp" v={row.receipt.record.time.issued_at} />
                <Row2 k="Signer" v={<Digest value={row.receipt.record.signature.key_id} chars={18} />} />
                <Row2 k="Algorithm" v={row.receipt.record.signature.alg} />
                <Row2
                  k="Attestation"
                  v={`${row.receipt.attestation.mode} · ${row.receipt.record.runtime.tee_vendor}`}
                />
                <Row2 k="Leaf index" v={`#${row.receipt.inclusion?.leaf_index ?? "—"}`} />
                <Row2 k="Actor" v={row.actor} />
                <Row2 k="Decision" v={row.decision} />
              </div>
            </div>

            {/* verdict */}
            <div>
              <div className="flex items-center justify-between">
                <Label>Verification</Label>
                <span
                  className="font-mono text-[12px] font-medium"
                  style={{ color: ok ? "var(--color-live)" : "var(--color-fail)" }}
                >
                  {ok ? "VALID" : "INVALID"}
                </span>
              </div>
              <div className="mt-2 flex flex-col gap-[3px]">
                {domainOrder().map((domain) => {
                  const check = verdict.checks[domain];
                  return (
                    <div key={domain} className="flex items-center gap-2">
                      <span className="w-[86px] shrink-0 font-mono text-[11px] text-mist">
                        {domain}
                      </span>
                      <Pill tone={toneOf(check.status)}>{check.status}</Pill>
                      <span className="min-w-0 flex-1 truncate text-[11px] text-mist" title={check.detail}>
                        {check.detail}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3">
                {forged ? (
                  <>
                    <span className="flex items-center gap-1.5 text-[11.5px] text-fail">
                      <AlertTriangle size={13} />
                      One field was edited. The verifier named the domain that broke.
                    </span>
                    <Button size="sm" tone="ghost" onClick={onVerify}>
                      <RotateCcw size={12} /> Restore
                    </Button>
                  </>
                ) : (
                  <>
                    <Button size="sm" tone="danger" onClick={onTamper} disabled={busy !== null}>
                      <AlertTriangle size={12} />
                      {busy === "tamper" ? "forging…" : "Try to forge this record"}
                    </Button>
                    <span className="flex items-center gap-1 text-[11px] text-mist">
                      <ShieldCheck size={12} /> edits the sealed record, then re-verifies it
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {row.before !== row.after && (
            <div className="mt-3 border-t border-line pt-3">
              <Label>What changed</Label>
              <div className="mt-2 overflow-hidden rounded-md border border-line font-mono text-[11.5px]">
                <div
                  className="px-3 py-1"
                  style={{ background: "rgba(248,81,73,0.07)", color: "#ff9b93" }}
                >
                  − {row.before.split("\n")[0]}
                </div>
                <div
                  className="px-3 py-1"
                  style={{ background: "rgba(63,185,80,0.07)", color: "var(--color-live)" }}
                >
                  + {row.after.split("\n")[0]}
                </div>
              </div>
              <p className="mt-1.5 text-[11px] text-mist">
                Shown from this tab. The receipt holds salted commitments to these strings, never
                the strings themselves — which is how a prompt is proved later without being
                stored anywhere.
              </p>
            </div>
          )}

          <div className="mt-2 text-right text-[11px] text-mist">{relativeOf(row.at)}</div>
        </div>
      )}
    </Panel>
  );
}

function Row2({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-line/60 py-[5px] last:border-0">
      <span className="shrink-0 text-[11.5px] text-mist">{k}</span>
      <span className="min-w-0 truncate text-right font-mono text-[11.5px] text-fog">{v}</span>
    </div>
  );
}
