"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { AnimatePresence, motion } from "motion/react";
import { Play, RotateCcw, Download, ShieldAlert, Check } from "lucide-react";
import {
  GOVERNANCE_ACTIONS,
  MANUAL_MINUTES_PER_CHANGE,
  SCENARIOS,
  STAGES,
  TAMPER_OPTIONS,
  formatBytes,
  runPipeline,
  tamperWith,
  type PipelineArtifacts,
  type Scenario,
  type StageState,
  type TamperKind,
} from "@/lib/demo/pipeline";
import { verifyReceipt } from "@/lib/cool";
import { walkInclusion, shortHex } from "@/lib/demo/merkle-walk";
import type { Receipt, Verdict } from "@/lib/cool/types";
import VerdictGrid from "./VerdictGrid";
import MerkleWalkView from "./MerkleWalkView";

/**
 * The live demo: one AI change, carried end to end, in the visitor's browser.
 *
 * Two rules govern this component.
 *
 *   1. Nothing here is a re-enactment of cryptography. The CBOR bytes, the
 *      SHA-256 commitment, the ML-DSA-65 + Ed25519 signatures, the RFC 6962
 *      audit path and the verdict are all produced by the vendored CooL SDK
 *      running on this machine. The receipt you download is a real receipt and
 *      the published `cool-verifier` CLI accepts it.
 *   2. Anything that is NOT real says so. Transport and the outbound Jira /
 *      Slack / ServiceNow connectors are marked SIMULATED, and hardware
 *      attestation is reported as MOCK — because that is the honest status.
 *
 * The theatre is in the pacing and the typography, never in the claims.
 */

type Phase = "idle" | "running" | "done";

const FIDELITY_CHIP = {
  real: "border-live/45 bg-live/10 text-live",
  simulated: "border-mock/40 bg-mock/[0.08] text-mock",
} as const;

/* ── small building blocks ────────────────────────────────────────────── */

function StatDot({ status }: { status: StageState["status"] }) {
  if (status === "done") {
    return (
      <span className="flex size-5 items-center justify-center rounded-full border border-live/50 bg-live/15 font-mono text-[10px] text-live">
        ✓
      </span>
    );
  }
  if (status === "running") {
    return (
      <span className="relative flex size-5 items-center justify-center">
        <span className="absolute inset-0 animate-ping rounded-full bg-verify/40" />
        <span className="relative size-2.5 rounded-full bg-verify" />
      </span>
    );
  }
  if (status === "failed") {
    return (
      <span className="flex size-5 items-center justify-center rounded-full border border-fail/55 bg-fail/15 font-mono text-[10px] text-fail">
        ✕
      </span>
    );
  }
  return <span className="size-5 rounded-full border border-line" />;
}

/** A titled artifact pane that fades in once its data exists. */
function Pane({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="frost rounded-xl border border-line p-4"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-mono text-[12px] tracking-[0.14em] text-verify uppercase">
          {label}
        </p>
        {hint ? <p className="font-mono text-[11px] text-mist">{hint}</p> : null}
      </div>
      <div className="mt-2.5">{children}</div>
    </motion.div>
  );
}

/* ── the demo ─────────────────────────────────────────────────────────── */

export default function LiveDemo() {
  const [scenario, setScenario] = useState<Scenario>(SCENARIOS[0]!);
  const [phase, setPhase] = useState<Phase>("idle");
  const [stages, setStages] = useState<StageState[]>(
    STAGES.map((spec) => ({ spec, status: "idle" })),
  );
  const [artifacts, setArtifacts] = useState<PipelineArtifacts>({});
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [tampered, setTampered] = useState<{
    kind: TamperKind;
    field: string;
    verdict: Verdict;
    receipt: Receipt;
  } | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [copied, setCopied] = useState(false);
  const running = useRef(false);

  const run = useCallback(async () => {
    if (running.current) return;
    running.current = true;
    setPhase("running");
    setReceipt(null);
    setVerdict(null);
    setTampered(null);
    setShowReceipt(false);
    setArtifacts({});

    try {
      const out = await runPipeline(scenario, {
        onStages: setStages,
        onArtifacts: setArtifacts,
      });
      setReceipt(out.receipt);
      setVerdict(out.verdict);
      setPhase("done");
    } catch (err) {
      console.error("pipeline failed", err);
      setStages((prev) =>
        prev.map((s) => (s.status === "running" ? { ...s, status: "failed" } : s)),
      );
      setPhase("done");
    } finally {
      running.current = false;
    }
  }, [scenario]);

  const reset = useCallback(() => {
    setPhase("idle");
    setStages(STAGES.map((spec) => ({ spec, status: "idle" })));
    setArtifacts({});
    setReceipt(null);
    setVerdict(null);
    setTampered(null);
    setShowReceipt(false);
  }, []);

  /** Attack the sealed receipt, then re-run the real verifier over the result. */
  const attack = useCallback(
    async (kind: TamperKind) => {
      if (!receipt) return;
      const { receipt: bad, field } = tamperWith(receipt, kind);
      const v = await verifyReceipt(bad);
      setTampered({ kind, field, verdict: v, receipt: bad });
    },
    [receipt],
  );

  const download = useCallback(() => {
    const target = tampered?.receipt ?? receipt;
    if (!target) return;
    const blob = new Blob([JSON.stringify(target, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = tampered ? "cool-receipt-tampered.json" : "cool-receipt.json";
    a.click();
    URL.revokeObjectURL(url);
  }, [receipt, tampered]);

  const copyCli = useCallback(async () => {
    try {
      await navigator.clipboard.writeText("npx @northwind/cool-verifier cool-receipt.json");
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — the command is on screen to copy by hand */
    }
  }, []);

  const walk = useMemo(() => {
    const target = tampered?.receipt ?? receipt;
    return target ? walkInclusion(target) : null;
  }, [receipt, tampered]);

  const activeVerdict = tampered?.verdict ?? verdict;
  const busy = phase === "running";

  return (
    <div className="w-full">
      {/* ── controls ─────────────────────────────────────────────────── */}
      <div className="frost-verify rounded-2xl border border-verify/30 p-4 sm:p-5">
        {/* One scrolling row on a phone, wrapping only from `sm` up.
            Wrapping put the three scenario chips on three lines and pushed
            "Ship this change" — the only control that matters here — below the
            fold of a 844px viewport. A horizontal strip keeps them on one line
            and costs nothing: the selected chip is always the leftmost visible
            one, and the row is short enough that the overflow is obvious.
            `-mx-1 px-1` lets the focus ring on the first chip breathe instead
            of being clipped by the scroll container. */}
        <div className="-mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
          <span className="shrink-0 font-mono text-[11px] tracking-[0.16em] text-mist uppercase">
            Pick a change
          </span>
          {SCENARIOS.map((s) => (
            <button
              key={s.id}
              type="button"
              disabled={busy}
              onClick={() => {
                setScenario(s);
                reset();
              }}
              className={clsx(
                "shrink-0 rounded-full border px-3 py-1.5 font-mono text-[11.5px] transition-colors disabled:opacity-45",
                s.id === scenario.id
                  ? "border-verify/60 bg-verify/15 text-ink"
                  : "border-line text-mist hover:border-verify/40 hover:text-ink",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* the diff that starts everything */}
        <div className="mt-4 overflow-hidden rounded-xl border border-line bg-void/60">
          <div className="flex items-center justify-between gap-2 border-b border-line px-3 py-2">
            <span className="font-mono text-[11px] text-mist">
              {scenario.workflow}
            </span>
            <span className="font-mono text-[11px] text-mist">
              {scenario.model}
            </span>
          </div>
          <div className="px-3 py-2.5 font-mono text-[12px] leading-relaxed">
            <p className="text-fail/85">
              <span className="mr-2 select-none text-fail/60">−</span>
              {scenario.from}
            </p>
            <p className="mt-1 text-live/90">
              <span className="mr-2 select-none text-live/60">+</span>
              {scenario.to}
            </p>
          </div>
        </div>

        {/* the one click */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={run}
            disabled={busy}
            className={clsx(
              "group relative inline-flex items-center gap-2 overflow-hidden rounded-full px-6 py-3 font-mono text-[13px] font-semibold tracking-wide transition-all",
              busy
                ? "cursor-wait bg-verify-deep/50 text-white/70"
                : "bg-verify-deep text-white shadow-[0_0_26px_rgba(9,105,218,0.5)] hover:shadow-[0_0_40px_rgba(9,105,218,0.85)]",
            )}
          >
            <span aria-hidden className="sheen absolute inset-0 rounded-full" />
            {busy ? (
              <>
                <span className="relative size-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                <span className="relative z-10">Running the pipeline…</span>
              </>
            ) : (
              <>
                <Play className="relative z-10 size-4" strokeWidth={2.4} />
                <span className="relative z-10">
                  {phase === "done" ? "Run it again" : "Ship this change"}
                </span>
              </>
            )}
          </button>

          {phase === "done" ? (
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-1.5 rounded-full border border-line px-4 py-2.5 font-mono text-[12px] text-mist transition-colors hover:border-verify/40 hover:text-ink"
            >
              <RotateCcw className="size-3.5" /> Reset
            </button>
          ) : null}

          <p className="font-mono text-[11px] leading-snug text-mist">
            Runs entirely in this tab. No server, no account, nothing uploaded.
          </p>
        </div>
      </div>

      {/* ── pipeline + artifacts ─────────────────────────────────────── */}
      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        {/* stage rail */}
        <div className="frost rounded-2xl border border-line p-4 sm:p-5">
          <div className="flex items-baseline justify-between gap-2">
            <p className="font-mono text-[12px] tracking-[0.14em] text-verify uppercase">
              The pipeline
            </p>
            <p className="font-mono text-[11px] text-mist">
              {stages.filter((s) => s.status === "done").length}/{STAGES.length}
            </p>
          </div>

          <ol className="mt-3 space-y-0.5">
            {stages.map((s, i) => (
              <li key={s.spec.id} className="relative">
                {i < stages.length - 1 ? (
                  <span
                    aria-hidden
                    className={clsx(
                      "absolute top-7 left-[9px] h-[calc(100%-14px)] w-px transition-colors duration-500",
                      s.status === "done" ? "bg-live/40" : "bg-line",
                    )}
                  />
                ) : null}
                <div
                  className={clsx(
                    "flex gap-3 rounded-lg px-1.5 py-2 transition-colors",
                    s.status === "running" && "bg-verify/[0.07]",
                  )}
                >
                  <div className="pt-0.5">
                    <StatDot status={s.status} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <p
                        className={clsx(
                          "font-mono text-[13px] font-semibold transition-colors",
                          s.status === "idle" ? "text-mist" : "text-ink",
                        )}
                      >
                        {s.spec.title}
                      </p>
                      <span
                        className={clsx(
                          "rounded border px-1.5 py-px font-mono text-[9px] tracking-[0.12em]",
                          FIDELITY_CHIP[s.spec.fidelity],
                        )}
                      >
                        {s.spec.fidelity === "real" ? "REAL" : "SIMULATED"}
                      </span>
                      {s.ms !== undefined && s.ms > 0 ? (
                        <span className="font-mono text-[10px] text-verify">
                          {s.ms} ms
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-[12.5px] leading-snug text-fog">
                      {s.spec.detail}
                    </p>
                    <p className="mt-1 font-mono text-[10.5px] text-mist">
                      {s.spec.component}
                    </p>
                    <AnimatePresence>
                      {s.result ? (
                        <motion.p
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="mt-1.5 font-mono text-[11.5px] leading-snug text-live/90"
                        >
                          → {s.result}
                        </motion.p>
                      ) : null}
                    </AnimatePresence>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* artifacts */}
        <div className="space-y-3">
          {phase === "idle" ? (
            <div className="frost flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-line p-8 text-center">
              <p className="font-mono text-[12px] tracking-[0.14em] text-mist uppercase">
                Evidence appears here
              </p>
              <p className="mt-2 max-w-sm text-[13.5px] leading-relaxed text-fog">
                Press <span className="text-ink">Ship this change</span> and watch
                one prompt edit turn into a sealed, provable, fully documented
                record — with nobody doing the paperwork.
              </p>
            </div>
          ) : null}

          {/* canonical bytes */}
          {artifacts.cborPreview ? (
            <Pane
              label="Deterministic bytes"
              hint={`${formatBytes(artifacts.cborBytes?.length ?? 0)} · RFC 8949 CDE`}
            >
              <p className="font-mono text-[11px] leading-relaxed break-all text-fog/80">
                {artifacts.cborPreview}
              </p>
              <p className="mt-2 text-[12.5px] leading-snug text-mist">
                The same change always encodes to exactly these bytes — on any
                machine, in any language. That is what makes the proof portable.
              </p>
            </Pane>
          ) : null}

          {/* commitment + seal */}
          {artifacts.bindingHash ? (
            <Pane label="Sealed" hint={artifacts.keyId}>
              <p className="font-mono text-[11px] break-all text-ink">
                {artifacts.bindingHash}
              </p>
              {artifacts.mlDsaBytes ? (
                <div className="mt-3 space-y-1.5">
                  {[
                    {
                      name: "ML-DSA-65",
                      note: "post-quantum · FIPS 204",
                      bytes: artifacts.mlDsaBytes,
                    },
                    {
                      name: "Ed25519",
                      note: "classical",
                      bytes: artifacts.ed25519Bytes ?? 0,
                    },
                  ].map((sig) => (
                    <div key={sig.name} className="flex items-center gap-2.5">
                      <span className="w-20 shrink-0 font-mono text-[11px] text-ink">
                        {sig.name}
                      </span>
                      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-faint">
                        <motion.span
                          initial={{ width: 0 }}
                          animate={{
                            width: `${Math.min(100, (sig.bytes / 3400) * 100)}%`,
                          }}
                          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                          className="block h-full rounded-full bg-verify"
                        />
                      </span>
                      <span className="w-24 shrink-0 text-right font-mono text-[10.5px] text-mist">
                        {sig.bytes} B · {sig.note}
                      </span>
                    </div>
                  ))}
                </div>
              ) : null}
              <p className="mt-2.5 text-[12.5px] leading-snug text-mist">
                Both signatures must verify. Break one scheme in twenty years and
                the evidence still stands on the other.
              </p>
            </Pane>
          ) : null}

          {/* merkle proof */}
          {walk ? <MerkleWalkView walk={walk} /> : null}

          {/* governance */}
          {artifacts.governance?.length ? (
            <Pane
              label="Paperwork done for you"
              hint={`${artifacts.governance.length}/${GOVERNANCE_ACTIONS.length} systems`}
            >
              <div className="space-y-1.5">
                {artifacts.governance.map((g) => (
                  <motion.div
                    key={g.system}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-center gap-2.5 rounded-lg border border-line bg-panel/40 px-3 py-2"
                  >
                    <Check className="size-3.5 shrink-0 text-live" strokeWidth={3} />
                    <span className="w-24 shrink-0 font-mono text-[11.5px] text-ink">
                      {g.system}
                    </span>
                    <span className="min-w-0 flex-1 text-[12.5px] leading-snug text-fog">
                      {g.action}
                    </span>
                    <span className="shrink-0 font-mono text-[10.5px] text-mist">
                      ~{g.manualMinutes} min saved
                    </span>
                  </motion.div>
                ))}
              </div>
              <p className="mt-2.5 text-[12.5px] leading-snug text-mist">
                Policy decided what this change needed, then the workflow did it.
                Connector calls are simulated here; the policy and workflow
                engines are OPA and Temporal in the deployed system.
              </p>
            </Pane>
          ) : null}

          {/* verdict */}
          {activeVerdict ? (
            <div>
              {tampered ? (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-2 flex items-center gap-2 rounded-lg border border-fail/40 bg-fail/[0.08] px-3 py-2"
                >
                  <ShieldAlert className="size-4 shrink-0 text-fail" />
                  <p className="font-mono text-[11.5px] leading-snug text-fog">
                    <span className="text-fail">Attack applied</span> ·{" "}
                    {tampered.field}
                  </p>
                </motion.div>
              ) : null}
              <VerdictGrid verdict={activeVerdict} />
            </div>
          ) : null}
        </div>
      </div>

      {/* ── the payoff ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {phase === "done" && receipt ? (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mt-4 space-y-4"
          >
            {/* the number that matters */}
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                {
                  big: `${MANUAL_MINUTES_PER_CHANGE} min`,
                  small: "of manual work, per change, gone",
                  tone: "live" as const,
                },
                {
                  big: `${artifacts.cryptoMs ?? 0} ms`,
                  small: "of real cryptography, measured just now",
                  tone: "verify" as const,
                },
                {
                  big: "0",
                  small: "people involved · 0 ms added to inference",
                  tone: "verify" as const,
                },
              ].map((stat) => (
                <div
                  key={stat.small}
                  className={clsx(
                    "frost rounded-xl border px-4 py-3.5",
                    stat.tone === "live" ? "border-live/35" : "border-verify/30",
                  )}
                >
                  <p
                    className={clsx(
                      "display text-[clamp(1.8rem,6vw,2.4rem)] leading-none",
                      stat.tone === "live" ? "text-live" : "text-verify",
                    )}
                  >
                    {stat.big}
                  </p>
                  <p className="mt-1.5 text-[12.5px] leading-snug text-fog">
                    {stat.small}
                  </p>
                </div>
              ))}
            </div>

            {/* break it */}
            <div className="frost rounded-2xl border border-line p-4 sm:p-5">
              <p className="font-mono text-[12px] tracking-[0.14em] text-fail uppercase">
                Now try to cheat
              </p>
              <p className="mt-1.5 max-w-2xl text-[13.5px] leading-relaxed text-fog">
                The receipt is sealed. Change anything inside it and the same
                verifier that just passed it will reject it — and tell you which
                domain broke. This is the difference between logging a change and
                being able to prove one.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {TAMPER_OPTIONS.map((t) => (
                  <button
                    key={t.kind}
                    type="button"
                    onClick={() => attack(t.kind)}
                    title={t.description}
                    className={clsx(
                      "rounded-full border px-3.5 py-2 font-mono text-[11.5px] transition-colors",
                      tampered?.kind === t.kind
                        ? "border-fail/60 bg-fail/15 text-fail"
                        : "border-line text-mist hover:border-fail/45 hover:text-fail",
                    )}
                  >
                    {t.label}
                  </button>
                ))}
                {tampered ? (
                  <button
                    type="button"
                    onClick={async () => {
                      setTampered(null);
                    }}
                    className="rounded-full border border-live/45 px-3.5 py-2 font-mono text-[11.5px] text-live transition-colors hover:bg-live/10"
                  >
                    Restore the real receipt
                  </button>
                ) : null}
              </div>
            </div>

            {/* take it away */}
            <div className="frost rounded-2xl border border-line p-4 sm:p-5">
              <p className="font-mono text-[12px] tracking-[0.14em] text-verify uppercase">
                Don&apos;t take our word for it
              </p>
              <p className="mt-1.5 max-w-2xl text-[13.5px] leading-relaxed text-fog">
                Download the receipt and check it yourself with the open-source
                CLI. It is self-contained — the public keys travel inside it — so
                verification never touches CooL&apos;s servers.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={download}
                  className="inline-flex items-center gap-2 rounded-full border border-verify/45 bg-verify/10 px-4 py-2 font-mono text-[12px] text-ink transition-colors hover:bg-verify/20"
                >
                  <Download className="size-3.5" />
                  {tampered ? "Download tampered receipt" : "Download receipt"}
                </button>
                <button
                  type="button"
                  onClick={copyCli}
                  className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 font-mono text-[12px] text-mist transition-colors hover:border-verify/40 hover:text-ink"
                >
                  {copied ? (
                    <>
                      <Check className="size-3.5 text-live" /> Copied
                    </>
                  ) : (
                    "Copy verify command"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowReceipt((v) => !v)}
                  className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 font-mono text-[12px] text-mist transition-colors hover:border-verify/40 hover:text-ink"
                >
                  {showReceipt ? "Hide raw receipt" : "Show raw receipt"}
                </button>
              </div>

              <pre className="mt-3 overflow-x-auto rounded-lg border border-line bg-void/70 px-3 py-2.5 font-mono text-[11.5px] text-fog">
                <code>npx @northwind/cool-verifier cool-receipt.json</code>
              </pre>

              <AnimatePresence>
                {showReceipt ? (
                  <motion.pre
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-2 max-h-80 overflow-auto rounded-lg border border-line bg-void/70 p-3 font-mono text-[11px] leading-relaxed text-fog"
                  >
                    <code>
                      {JSON.stringify(tampered?.receipt ?? receipt, null, 2)}
                    </code>
                  </motion.pre>
                ) : null}
              </AnimatePresence>

              {receipt.sth ? (
                <p className="mt-3 font-mono text-[11px] leading-relaxed text-mist">
                  log <span className="text-fog">{receipt.sth.log_id}</span> · root{" "}
                  <span className="text-fog">
                    {shortHex(receipt.sth.root_hash.replace("mh:sha256:", ""), 10, 8)}
                  </span>{" "}
                  · tree size {receipt.sth.tree_size}
                </p>
              ) : null}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
