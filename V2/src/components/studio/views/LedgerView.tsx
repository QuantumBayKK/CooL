"use client";

/**
 * The evidence ledger — the table an auditor is eventually pointed at.
 *
 * Two decisions worth naming:
 *
 *   • The verdict column is computed, never stored. Each row shows the result of
 *     running the verifier over that receipt, so a row cannot claim to be valid
 *     while being invalid — the display and the check are the same operation.
 *   • The drawer shows the plaintext (prompt, diff) because in a real deployment
 *     that plaintext is already in the customer's environment; only its
 *     commitment is in the record. The receipt beside it proves the two agree.
 */
import { useMemo, useState } from "react";
import { Download, Plus, X } from "lucide-react";
import { useStudio, type LedgerEntry } from "../session";
import { SYSTEMS } from "@/lib/studio/scenario";
import { lineDiff } from "@/lib/cool/phala";
import type { VerdictV2 } from "@/lib/cool/phala";
import {
  Btn,
  Card,
  CardHead,
  Hash,
  Json,
  KeyValue,
  Lozenge,
  Row,
  Select,
  Table,
  Td,
  Th,
  TextArea,
  Toggle,
  clockTime,
  relativeTime,
} from "../ui";
import { VerdictGrid } from "./VerdictGrid";

export default function LedgerView({
  query,
  onQuery,
}: {
  query: string;
  onQuery: (value: string) => void;
}) {
  const { entries } = useStudio();
  const [kind, setKind] = useState("all");
  const [system, setSystem] = useState("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return entries.filter((entry) => {
      if (kind !== "all" && entry.kind !== kind) return false;
      if (system !== "all" && entry.system !== system) return false;
      if (!needle) return true;
      return (
        entry.label.toLowerCase().includes(needle) ||
        entry.system.toLowerCase().includes(needle) ||
        entry.id.toLowerCase().includes(needle) ||
        entry.receipt.binding_hash.includes(needle)
      );
    });
  }, [entries, kind, system, query]);

  const open = entries.find((entry) => entry.id === openId) ?? null;

  return (
    <div className="flex min-h-full">
      <div className="min-w-0 flex-1 px-5 py-6">
        <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-[22px] font-semibold">Evidence ledger</h1>
            <p className="mt-1 text-[13px]" style={{ color: "var(--atl-subtle)" }}>
              {rows.length} of {entries.length} records · every verdict below was recomputed in
              this browser.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Toggle
              value={kind}
              onChange={setKind}
              options={[
                { value: "all", label: "All" },
                { value: "change", label: "Changes" },
                { value: "inference", label: "Inferences" },
              ]}
            />
            <div className="w-[200px]">
              <Select
                value={system}
                onChange={setSystem}
                options={[
                  { value: "all", label: "All systems" },
                  ...SYSTEMS.map((s) => ({ value: s.id, label: s.name })),
                ]}
              />
            </div>
            <Btn variant="primary" onClick={() => setComposing((v) => !v)}>
              <Plus className="size-3.5" /> Seal a change
            </Btn>
          </div>
        </header>

        {query && (
          <div className="mb-3 flex items-center gap-2 text-[12.5px]" style={{ color: "var(--atl-muted)" }}>
            Filtering by “{query}”
            <button type="button" onClick={() => onQuery("")} className="underline">
              clear
            </button>
          </div>
        )}

        {composing && <Composer onDone={() => setComposing(false)} />}

        <Card padded={false} className="px-3 pt-3 pb-1">
          <Table
            head={
              <>
                <Th width="92px">Time</Th>
                <Th width="94px">Kind</Th>
                <Th>Subject</Th>
                <Th width="150px">System</Th>
                <Th width="88px">Env</Th>
                <Th width="120px">Verdict</Th>
                <Th width="110px">Binding</Th>
              </>
            }
          >
            {rows.map((entry) => (
              <Row
                key={entry.id}
                onClick={() => setOpenId(entry.id)}
                active={entry.id === openId}
                flash={entry.fresh}
              >
                <Td nowrap>
                  <span title={new Date(entry.at).toISOString()}>{relativeTime(entry.at)}</span>
                </Td>
                <Td>
                  <Lozenge tone={entry.kind === "change" ? "purple" : "info"}>{entry.kind}</Lozenge>
                </Td>
                <Td>
                  <span className="font-medium">{entry.label}</span>
                </Td>
                <Td>
                  <span className="text-[12px]" style={{ color: "var(--atl-muted)" }}>
                    {entry.system}
                  </span>
                </Td>
                <Td>
                  <Lozenge tone={entry.environment === "prod" ? "warn" : "neutral"}>
                    {entry.environment}
                  </Lozenge>
                </Td>
                <Td>{verdictLozenge(entry.verdict)}</Td>
                <Td>
                  <Hash value={entry.receipt.binding_hash} chars={9} />
                </Td>
              </Row>
            ))}
          </Table>
          {rows.length === 0 && (
            <p className="px-2 py-8 text-center text-[13px]" style={{ color: "var(--atl-muted)" }}>
              Nothing matches that filter.
            </p>
          )}
        </Card>
      </div>

      {open && <Drawer entry={open} onClose={() => setOpenId(null)} />}
    </div>
  );
}

function verdictLozenge(verdict: VerdictV2 | null) {
  if (!verdict) return <Lozenge tone="neutral">pending</Lozenge>;
  if (!verdict.ok) return <Lozenge tone="danger" glyph>failed</Lozenge>;
  const simulated =
    verdict.checks.attestation.status === "simulated" || verdict.checks.enclave.status === "simulated";
  return simulated ? (
    <Lozenge tone="teal" glyph>verified · sim</Lozenge>
  ) : (
    <Lozenge tone="success" glyph>verified</Lozenge>
  );
}

/* ── the drawer ───────────────────────────────────────────────────────── */

function Drawer({ entry, onClose }: { entry: LedgerEntry; onClose: () => void }) {
  const { reverify, tamper, swapQuote } = useStudio();
  const [attack, setAttack] = useState<{ label: string; verdict: VerdictV2 } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const run = async (label: string, fn: () => Promise<VerdictV2 | null>) => {
    setBusy(label);
    const verdict = await fn();
    if (verdict) setAttack({ label, verdict });
    setBusy(null);
  };

  const download = () => {
    const blob = new Blob([JSON.stringify(entry.receipt, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `cool-receipt-${entry.id}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const runtime = entry.receipt.record.runtime;

  return (
    <aside
      className="thin-scroll sticky top-0 hidden h-[calc(100vh-3rem)] w-[440px] shrink-0 overflow-y-auto border-l px-4 py-5 xl:block"
      style={{ background: "var(--atl-surface)", borderColor: "var(--atl-border)" }}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold tracking-[0.09em] uppercase" style={{ color: "var(--atl-muted)" }}>
            {entry.kind === "change" ? "Change record" : "Inference record"}
          </p>
          <h2 className="mt-0.5 text-[16px] leading-snug font-semibold">{entry.label}</h2>
          <p className="mt-0.5 font-mono text-[11.5px]" style={{ color: "var(--atl-muted)" }}>
            {entry.id}
          </p>
        </div>
        <button type="button" onClick={onClose} aria-label="Close" className="p-1">
          <X className="size-4" style={{ color: "var(--atl-muted)" }} />
        </button>
      </div>

      <VerdictGrid verdict={attack?.verdict ?? entry.verdict} />

      {attack && (
        <div
          className="mt-2 rounded-[3px] border px-2.5 py-2 text-[12px]"
          style={{ borderColor: "var(--atl-border)", background: "var(--atl-yellow-bg)", color: "var(--atl-yellow)" }}
        >
          Showing the verdict for: <strong>{attack.label}</strong>.{" "}
          <button type="button" className="underline" onClick={() => setAttack(null)}>
            back to the real receipt
          </button>
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-1.5">
        <Btn size="sm" onClick={() => void run("re-verified", () => reverify(entry.id))} disabled={busy !== null}>
          Verify again
        </Btn>
        <Btn
          size="sm"
          onClick={() => void run("one byte edited", () => tamper(entry.id))}
          disabled={busy !== null}
          title="Flip one character of one hash and re-run the verifier"
        >
          Tamper
        </Btn>
        <Btn
          size="sm"
          onClick={() => void run("quote from another enclave", () => swapQuote(entry.id))}
          disabled={busy !== null}
          title="Staple a valid quote from a different image onto this record"
        >
          Swap quote
        </Btn>
        <Btn size="sm" variant="subtle" onClick={download}>
          <Download className="size-3.5" /> Receipt
        </Btn>
      </div>

      <section className="mt-5">
        <p className="mb-1.5 text-[11px] font-bold tracking-[0.09em] uppercase" style={{ color: "var(--atl-muted)" }}>
          What was committed
        </p>
        {entry.detail.kind === "change" ? (
          <Diff before={entry.detail.before ?? ""} after={entry.detail.after} />
        ) : (
          <div className="space-y-2">
            <Plaintext label="Prompt" body={entry.detail.prompt} />
            <Plaintext label="Output" body={entry.detail.output} />
          </div>
        )}
        <div className="mt-2 space-y-0.5">
          {entry.detail.kind === "change" ? (
            <>
              <KeyValue k="after_hash" v={<Hash value={entry.receipt.record.schema === "cool.change.v2" ? entry.receipt.record.change.after_hash : ""} chars={14} />} />
              <KeyValue k="diff_hash" v={<Hash value={entry.receipt.record.schema === "cool.change.v2" ? entry.receipt.record.change.diff_hash : ""} chars={14} />} />
              <KeyValue k="Decision" v={<Lozenge tone={entry.detail.decision === "rejected" ? "danger" : "success"}>{entry.detail.decision}</Lozenge>} />
              <KeyValue k="Approvers" v={entry.detail.approvers.length > 0 ? entry.detail.approvers.join(", ") : "—"} />
            </>
          ) : (
            <>
              <KeyValue
                k="input_hash"
                v={<Hash value={entry.receipt.record.schema === "cool.inference.v2" ? entry.receipt.record.request.input_hash : ""} chars={14} />}
              />
              <KeyValue
                k="output_hash"
                v={<Hash value={entry.receipt.record.schema === "cool.inference.v2" ? entry.receipt.record.response.output_hash : ""} chars={14} />}
              />
              <KeyValue
                k="weights_hash"
                v={<Hash value={entry.receipt.record.schema === "cool.inference.v2" ? entry.receipt.record.model.weights_hash : ""} chars={14} />}
              />
              <KeyValue k="GPU" v={entry.detail.gpu ? `NVIDIA CC · ${entry.detail.gpu}` : "CPU only"} />
            </>
          )}
        </div>
      </section>

      <section className="mt-5">
        <p className="mb-1.5 text-[11px] font-bold tracking-[0.09em] uppercase" style={{ color: "var(--atl-muted)" }}>
          Where it ran
        </p>
        <div className="space-y-0.5">
          <KeyValue k="Silicon" v={`${runtime.tee_vendor} · ${runtime.mode}`} />
          <KeyValue k="MRTD" v={runtime.enclave_measurement ? <Hash value={runtime.enclave_measurement.mrtd} chars={14} /> : "—"} />
          <KeyValue k="Quote digest" v={runtime.tee_quote ? <Hash value={runtime.tee_quote} chars={14} /> : "—"} />
          <KeyValue k="Signing key" v={<span className="font-mono text-[11.5px]">{entry.receipt.record.signature.key_id}</span>} />
          <KeyValue k="Sealed at" v={clockTime(entry.at)} />
        </div>
      </section>

      <section className="mt-5">
        <p className="mb-1.5 text-[11px] font-bold tracking-[0.09em] uppercase" style={{ color: "var(--atl-muted)" }}>
          Transparency log
        </p>
        <div className="space-y-0.5">
          <KeyValue k="Leaf" v={entry.receipt.inclusion ? `${entry.receipt.inclusion.leaf_index} of ${entry.receipt.inclusion.tree_size}` : "—"} />
          <KeyValue k="Audit path" v={`${entry.receipt.inclusion?.audit_path.length ?? 0} hashes`} />
          <KeyValue k="Root" v={entry.receipt.sth ? <Hash value={entry.receipt.sth.root_hash} chars={14} /> : "—"} />
          <KeyValue k="Witnesses" v={`${entry.receipt.sth?.witnesses.length ?? 0} (self only — never counted)`} />
        </div>
      </section>

      <section className="mt-5">
        <p className="mb-1.5 text-[11px] font-bold tracking-[0.09em] uppercase" style={{ color: "var(--atl-muted)" }}>
          The receipt
        </p>
        <Json value={entry.receipt} maxHeight={280} />
      </section>
    </aside>
  );
}

function Plaintext({ label, body }: { label: string; body: string }) {
  return (
    <div className="rounded-[3px] border p-2.5" style={{ borderColor: "var(--atl-border)", background: "var(--atl-raised)" }}>
      <p className="text-[11px] font-bold tracking-[0.07em] uppercase" style={{ color: "var(--atl-muted)" }}>
        {label}
      </p>
      <p className="mt-1 text-[12.5px] leading-relaxed break-words" style={{ color: "var(--atl-text)" }}>
        {body}
      </p>
    </div>
  );
}

function Diff({ before, after }: { before: string; after: string }) {
  const lines = lineDiff(before, after);
  const tone: Record<string, { bg: string; fg: string; mark: string }> = {
    added: { bg: "var(--atl-green-bg)", fg: "var(--atl-green)", mark: "+" },
    removed: { bg: "var(--atl-red-bg)", fg: "var(--atl-red)", mark: "−" },
    context: { bg: "transparent", fg: "var(--atl-subtle)", mark: " " },
  };
  return (
    <div
      className="thin-scroll max-h-56 overflow-auto rounded-[3px] border font-mono text-[11.5px] leading-[1.6]"
      style={{ borderColor: "var(--atl-border)" }}
    >
      {lines.map((line, index) => {
        const t = tone[line.kind]!;
        return (
          <div key={index} className="flex gap-2 px-2 py-[1px]" style={{ background: t.bg, color: t.fg }}>
            <span className="select-none">{t.mark}</span>
            <span className="break-all whitespace-pre-wrap">{line.text || " "}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ── composer ─────────────────────────────────────────────────────────── */

/**
 * Seal a change by hand.
 *
 * In production nobody opens this — CI does it. It exists here because the
 * fastest way to believe a system of record is to put something into it and
 * watch the receipt come back verifiable.
 */
function Composer({ onDone }: { onDone: () => void }) {
  const { commitChange } = useStudio();
  const [ref, setRef] = useState("billing/refund-agent#system");
  const [kind, setKind] = useState("prompt");
  const [before, setBefore] = useState("Approve refunds up to $500 without escalation.");
  const [after, setAfter] = useState("Approve refunds up to $1,000 without escalation.");
  const [environment, setEnvironment] = useState("prod");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    await commitChange({
      system: ref.split("#")[0] ?? ref,
      kind: kind as "prompt",
      ref,
      before,
      after,
      environment,
      approvers: environment === "prod" ? ["priya@bank.example", "marcus@bank.example"] : [],
    });
    setBusy(false);
    onDone();
  };

  return (
    <Card className="mb-3">
      <CardHead
        title="Seal a change"
        hint="Captured out-of-band, sealed inside the enclave, verifiable the moment it lands."
      />
      <div className="grid gap-3 md:grid-cols-[1.2fr_1fr_0.8fr]">
        <label className="block">
          <span className="mb-1 block text-[12px] font-semibold" style={{ color: "var(--atl-subtle)" }}>
            Reference
          </span>
          <input
            value={ref}
            onChange={(event) => setRef(event.target.value)}
            className="w-full rounded-[3px] border px-2.5 py-1.5 font-mono text-[12.5px] outline-none"
            style={{ borderColor: "var(--atl-border-strong)", background: "var(--atl-surface)" }}
          />
        </label>
        <Select
          label="Kind"
          value={kind}
          onChange={setKind}
          options={[
            { value: "prompt", label: "prompt" },
            { value: "model", label: "model" },
            { value: "params", label: "params" },
            { value: "policy", label: "policy" },
            { value: "dataset", label: "dataset" },
            { value: "agent-permission", label: "agent-permission" },
            { value: "tool", label: "tool" },
          ]}
        />
        <Select
          label="Environment"
          value={environment}
          onChange={setEnvironment}
          options={[
            { value: "prod", label: "prod" },
            { value: "staging", label: "staging" },
          ]}
        />
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <TextArea label="Before" value={before} onChange={setBefore} rows={4} mono />
        <TextArea label="After" value={after} onChange={setAfter} rows={4} mono />
      </div>
      <div className="mt-3 flex items-center gap-2">
        <Btn variant="primary" onClick={() => void submit()} disabled={busy}>
          {busy ? "Sealing…" : "Capture & seal"}
        </Btn>
        <Btn variant="subtle" onClick={onDone}>
          Cancel
        </Btn>
        <span className="text-[12px]" style={{ color: "var(--atl-muted)" }}>
          Signs with the enclave-sealed key and appends to the transparency log.
        </span>
      </div>
    </Card>
  );
}
