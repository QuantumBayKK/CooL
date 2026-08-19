"use client";

/**
 * The studio session — one live SDK instance, shared by the console and the IDE.
 *
 * Everything the two surfaces display comes from here, and everything here is
 * produced by the actual library in `src/lib/cool/phala`: the enclave is booted,
 * keys are derived from its measurement, the RA-TLS handshake really runs, and
 * every row in the ledger is a receipt that was signed in the visitor's own
 * browser and verified by the same verifier an auditor would run.
 *
 * The estate is synthetic. The cryptography is not. Keeping that line visible is
 * a product decision as much as an honesty one — a buyer who checks will check
 * this first, and a demo that blurs it is worth less than no demo.
 *
 * Boot is deliberately streamed rather than awaited in one lump. ML-DSA-65 is a
 * few milliseconds per signature and there are twenty-odd records; sealing them
 * one at a time with a yield between keeps the UI responsive and, as a side
 * effect, shows the pipeline filling the way a real one does.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  CoolTee,
  SimulatedDstackClient,
  verifyReceiptV2,
} from "@/lib/cool/phala";
import type {
  AttestationHandshake,
  CaptureStats,
  EnclaveInfo,
  Measurement,
  ReceiptV2,
  VerdictV2,
} from "@/lib/cool/phala";
import {
  APPROVED_IMAGE,
  ROGUE_IMAGE,
  SEED_CHANGES,
  SEED_INFERENCES,
  SYSTEMS,
} from "@/lib/studio/scenario";

/* ── shapes ───────────────────────────────────────────────────────────── */

export interface LedgerEntry {
  readonly id: string;
  readonly receipt: ReceiptV2;
  readonly verdict: VerdictV2 | null;
  readonly kind: "inference" | "change";
  /** What changed, or which model ran. */
  readonly label: string;
  readonly system: string;
  readonly environment: string;
  /** Display time in epoch milliseconds. */
  readonly at: number;
  /** Set for records produced during this visit — the ledger flashes them. */
  readonly fresh: boolean;
  /** Plaintext kept ONLY in this browser tab, so the UI can show a diff. */
  readonly detail: EntryDetail;
}

export type EntryDetail =
  | { kind: "inference"; model: string; prompt: string; output: string; params: unknown; gpu: string | null }
  | { kind: "change"; changeKind: string; ref: string; before: string | null; after: string; decision: string; approvers: readonly string[] };

export interface BootStep {
  readonly label: string;
  readonly detail: string;
  readonly ok: boolean;
}

export interface StudioSession {
  readonly phase: "booting" | "ready";
  readonly progress: number;
  readonly bootSteps: readonly BootStep[];
  readonly entries: readonly LedgerEntry[];
  readonly handshake: AttestationHandshake | null;
  readonly enclave: EnclaveInfo | null;
  readonly stats: CaptureStats | null;
  readonly image: string;
  readonly pinned: Measurement | null;
  /** Records sealed by a previous image, kept across a redeploy. */
  readonly rotations: number;

  runInference(input: { system: string; model: string; prompt: string; gpu: boolean }): Promise<LedgerEntry | null>;
  commitChange(input: {
    system: string;
    kind: "prompt" | "model" | "params" | "policy" | "dataset" | "agent-permission" | "tool";
    ref: string;
    before: string;
    after: string;
    environment: string;
    approvers: string[];
  }): Promise<LedgerEntry | null>;
  reverify(id: string, options?: { requireHardware?: boolean; pin?: Measurement }): Promise<VerdictV2 | null>;
  /** Flip a byte in a sealed record and verify the result. */
  tamper(id: string): Promise<VerdictV2 | null>;
  /** Staple a quote from a different enclave onto a record and verify it. */
  swapQuote(id: string): Promise<VerdictV2 | null>;
  /** Redeploy the evidence plane from a different image. */
  redeploy(image: string): Promise<void>;

  /**
   * The live client, for surfaces that drive the SDK directly — the IDE's
   * playground runs user code against exactly this instance.
   */
  readonly client: CoolTee | null;
  /**
   * Fold any receipts the client produced outside {@link commitChange} and
   * {@link runInference} into the ledger. The IDE calls this after running
   * user code, so a record sealed from the editor shows up in the console.
   */
  adoptNew(): number;
}

const StudioContext = createContext<StudioSession | null>(null);

/** Access the live session. Throws outside the provider — a wiring bug, loudly. */
export function useStudio(): StudioSession {
  const session = useContext(StudioContext);
  if (!session) throw new Error("useStudio must be used inside <StudioProvider>");
  return session;
}

/* ── helpers ──────────────────────────────────────────────────────────── */

const yieldToBrowser = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

function systemOf(ref: string): string {
  const base = ref.split("#")[0] ?? ref;
  return SYSTEMS.find((s) => s.id === base)?.id ?? base;
}

/* ── provider ─────────────────────────────────────────────────────────── */

export function StudioProvider({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<"booting" | "ready">("booting");
  const [progress, setProgress] = useState(0);
  const [bootSteps, setBootSteps] = useState<BootStep[]>([]);
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [handshake, setHandshake] = useState<AttestationHandshake | null>(null);
  const [enclave, setEnclave] = useState<EnclaveInfo | null>(null);
  const [stats, setStats] = useState<CaptureStats | null>(null);
  const [image, setImage] = useState<string>(APPROVED_IMAGE);
  const [rotations, setRotations] = useState(0);

  const coolRef = useRef<CoolTee | null>(null);
  const knownIds = useRef<Set<string>>(new Set());
  const clockRef = useRef<number>(Date.now());
  const bootedRef = useRef(false);
  const cancelledRef = useRef(false);

  /** The plane's clock. Seeded records get plausible past timestamps. */
  const clock = useCallback(() => new Date(clockRef.current).toISOString(), []);

  const pushStep = useCallback((step: BootStep) => {
    setBootSteps((prev) => [...prev, step]);
  }, []);

  const refreshStats = useCallback(() => {
    const cool = coolRef.current;
    if (cool) setStats(cool.stats());
  }, []);

  /** Seal one seeded or live event and fold it into the ledger. */
  const seal = useCallback(
    async (
      make: (cool: CoolTee) => Promise<ReceiptV2>,
      meta: Omit<LedgerEntry, "id" | "receipt" | "verdict" | "fresh">,
      fresh: boolean,
    ): Promise<LedgerEntry | null> => {
      const cool = coolRef.current;
      if (!cool) return null;
      try {
        const receipt = await make(cool);
        const verdict = await verifyReceiptV2(receipt);
        const entry: LedgerEntry = {
          ...meta,
          id: receipt.record.record_id,
          receipt,
          verdict,
          fresh,
        };
        // Newest first. Seeded records are replayed in two passes (changes, then
        // inferences) but describe one interleaved week, so the ledger sorts by
        // the record's own time rather than by the order it was sealed in.
        knownIds.current.add(entry.id);
        setEntries((prev) => [entry, ...prev].sort((a, b) => b.at - a.at));
        refreshStats();
        return entry;
      } catch {
        // A refused channel is the expected failure here, and it must not take
        // the console down with it — the same fail-open rule the SDK follows.
        refreshStats();
        return null;
      }
    },
    [refreshStats],
  );

  /* ── boot ── */
  /**
   * The boot, and the one subtlety in it.
   *
   * `bootedRef` stops the enclave being started twice. `cancelledRef` stops a
   * finished boot writing state into an unmounted tree. Those two guards used
   * to be a ref and a plain `let`, and together they deadlocked the page under
   * React's StrictMode double-invoke:
   *
   *   run 1  bootedRef := true, starts the async boot, returns its cleanup
   *   unmount  cleanup sets run 1's `cancelled` to true
   *   run 2  bootedRef is already true, so it returns immediately
   *
   * The only boot in flight was now permanently cancelled and nothing would
   * ever re-arm it, so every `if (cancelled) return` fired and the enclave
   * never came up. Locally the walkthrough sat on "starting the enclave"
   * forever and every record-dependent stop stayed locked — the whole demo,
   * dead, in exactly the environment it is developed in.
   *
   * Holding the flag in a ref and re-arming it at the top of every run fixes
   * it: the remount clears the cancellation the unmount set, and the boot that
   * is genuinely in flight carries on. The cleanup is now returned from every
   * run rather than only the first, so a real unmount still cancels.
   */
  useEffect(() => {
    cancelledRef.current = false;
    if (bootedRef.current) return () => void (cancelledRef.current = true);
    bootedRef.current = true;

    void (async () => {
      const dstack = new SimulatedDstackClient({
        appName: "cool-evidence-plane",
        imageDigest: APPROVED_IMAGE,
        clock,
      });
      const info = await dstack.info();
      if (cancelledRef.current) return;

      pushStep({
        label: "dstack",
        detail: `${info.vendor} · app ${info.appId.slice(0, 12)} · image measured into MRTD`,
        ok: true,
      });
      setEnclave(info);
      setProgress(0.1);
      await yieldToBrowser();

      const cool = await CoolTee.connect({
        dstack,
        app: { name: "cool-evidence-plane", imageDigest: APPROVED_IMAGE },
        expectedMeasurement: info.measurement,
        policy: { expectedMeasurement: info.measurement, requireVendor: ["intel-tdx"] },
        logId: "cool-console",
        clock,
        capture: { flushMs: 1 },
        retain: 200,
      });
      if (cancelledRef.current) return;
      coolRef.current = cool;

      pushStep({
        label: "dstack-KMS",
        detail: `signing key ${cool.plane.keys.record.keyId} sealed to the measurement`,
        ok: true,
      });
      pushStep({
        label: "RA-TLS",
        detail: cool.handshake.ok
          ? `${cool.handshake.steps.length} checks passed · channel open`
          : "handshake failed · channel closed",
        ok: cool.handshake.ok,
      });
      setHandshake(cool.handshake);
      setProgress(0.2);
      await yieldToBrowser();

      // Replay the estate oldest-first so sequence numbers, leaf indices and
      // timestamps all tell the same story.
      const changes = [...SEED_CHANGES].sort((a, b) => b.minutesAgo - a.minutesAgo);
      const inferences = [...SEED_INFERENCES].sort((a, b) => b.minutesAgo - a.minutesAgo);
      const total = changes.length + inferences.length;
      let done = 0;

      const { simulatedGpu } = await import("@/lib/cool/phala");

      for (const change of changes) {
        if (cancelledRef.current) return;
        clockRef.current = Date.now() - change.minutesAgo * 60_000;
        await seal(
          (c) =>
            c.change({
              kind: change.kind,
              ref: change.ref,
              environment: change.environment,
              after: change.after,
              actor: change.actor,
              ...(change.before === undefined ? {} : { before: change.before }),
              ...(change.approval === undefined ? {} : { approval: change.approval }),
            }),
          {
            kind: "change",
            label: `${change.kind}: ${change.ref.split("#")[1] ?? change.ref}`,
            system: change.system,
            environment: change.environment,
            at: clockRef.current,
            detail: {
              kind: "change",
              changeKind: change.kind,
              ref: change.ref,
              before: change.before ?? null,
              after: change.after,
              decision: change.approval?.decision ?? "auto-approved",
              approvers: change.approval?.approvers ?? [],
            },
          },
          false,
        );
        done++;
        setProgress(0.2 + (done / total) * 0.8);
        await yieldToBrowser();
      }

      for (const run of inferences) {
        if (cancelledRef.current) return;
        clockRef.current = Date.now() - run.minutesAgo * 60_000;
        await seal(
          (c) =>
            c.captureSealed({
              kind: "inference",
              model: run.model,
              prompt: run.prompt,
              output: run.output,
              params: run.params,
              provider: "phala-private-llm",
              ...(run.gpu ? { gpu: simulatedGpu(run.gpu, run.model) } : {}),
            }),
          {
            kind: "inference",
            label: run.model,
            system: run.system,
            environment: "prod",
            at: clockRef.current,
            detail: {
              kind: "inference",
              model: run.model,
              prompt: run.prompt,
              output: run.output,
              params: run.params,
              gpu: run.gpu,
            },
          },
          false,
        );
        done++;
        setProgress(0.2 + (done / total) * 0.8);
        await yieldToBrowser();
      }

      if (cancelledRef.current) return;
      clockRef.current = Date.now();
      setProgress(1);
      setPhase("ready");
    })();

    return () => {
      cancelledRef.current = true;
    };
  }, [clock, pushStep, seal]);

  /* ── actions ── */

  const runInference = useCallback<StudioSession["runInference"]>(
    async (input) => {
      clockRef.current = Date.now();
      const { simulatedGpu } = await import("@/lib/cool/phala");
      const output = draftOutput(input.prompt);
      return seal(
        (c) =>
          c.captureSealed({
            kind: "inference",
            model: input.model,
            prompt: input.prompt,
            output,
            params: { temperature: 0.2, top_p: 0.9 },
            provider: "phala-private-llm",
            ...(input.gpu ? { gpu: simulatedGpu("H200", input.model) } : {}),
          }),
        {
          kind: "inference",
          label: input.model,
          system: input.system,
          environment: "prod",
          at: Date.now(),
          detail: {
            kind: "inference",
            model: input.model,
            prompt: input.prompt,
            output,
            params: { temperature: 0.2, top_p: 0.9 },
            gpu: input.gpu ? "H200" : null,
          },
        },
        true,
      );
    },
    [seal],
  );

  const commitChange = useCallback<StudioSession["commitChange"]>(
    async (input) => {
      clockRef.current = Date.now();
      const decision = input.approvers.length >= 2 ? "approved" : "auto-approved";
      return seal(
        (c) =>
          c.change({
            kind: input.kind,
            ref: input.ref,
            environment: input.environment,
            before: input.before,
            after: input.after,
            actor: { id: "user:you@studio", method: "session" },
            approval: {
              policy_id: "POL-014",
              decision: decision as "approved" | "auto-approved",
              approvers: input.approvers,
            },
          }),
        {
          kind: "change",
          label: `${input.kind}: ${input.ref.split("#")[1] ?? input.ref}`,
          system: systemOf(input.ref) || input.system,
          environment: input.environment,
          at: Date.now(),
          detail: {
            kind: "change",
            changeKind: input.kind,
            ref: input.ref,
            before: input.before,
            after: input.after,
            decision,
            approvers: input.approvers,
          },
        },
        true,
      );
    },
    [seal],
  );

  const applyVerdict = useCallback((id: string, verdict: VerdictV2) => {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, verdict } : e)));
  }, []);

  const reverify = useCallback<StudioSession["reverify"]>(
    async (id, options) => {
      const entry = entries.find((e) => e.id === id);
      if (!entry) return null;
      const verdict = await verifyReceiptV2(entry.receipt, {
        ...(options?.requireHardware ? { requireHardware: true } : {}),
        ...(options?.pin ? { expectedMeasurement: options.pin } : {}),
      });
      applyVerdict(id, verdict);
      return verdict;
    },
    [entries, applyVerdict],
  );

  const tamper = useCallback<StudioSession["tamper"]>(
    async (id) => {
      const entry = entries.find((e) => e.id === id);
      if (!entry) return null;
      const edited = JSON.parse(JSON.stringify(entry.receipt)) as ReceiptV2;
      const record = edited.record as unknown as Record<string, unknown>;
      if (edited.record.schema === "cool.inference.v2") {
        const response = record["response"] as Record<string, string>;
        // One character of one hash — the smallest edit anyone would attempt.
        response["output_hash"] = response["output_hash"]!.replace(/.$/, (c) =>
          c === "0" ? "1" : "0",
        );
      } else {
        const change = record["change"] as Record<string, unknown>;
        change["environment"] = "staging";
      }
      return verifyReceiptV2(edited);
    },
    [entries],
  );

  const swapQuote = useCallback<StudioSession["swapQuote"]>(
    async (id) => {
      const entry = entries.find((e) => e.id === id);
      if (!entry || !entry.receipt.attestation.key_binding) return null;
      const rogue = new SimulatedDstackClient({
        appName: "cool-evidence-plane",
        imageDigest: ROGUE_IMAGE,
      });
      const quote = await rogue.getQuote(entry.receipt.attestation.key_binding);
      const swapped: ReceiptV2 = {
        ...entry.receipt,
        attestation: { ...entry.receipt.attestation, quote },
        key_directory: { ...entry.receipt.key_directory, ...rogue.directory() },
      };
      return verifyReceiptV2(swapped);
    },
    [entries],
  );

  const redeploy = useCallback<StudioSession["redeploy"]>(
    async (nextImage) => {
      setPhase("booting");
      setProgress(0.4);
      const dstack = new SimulatedDstackClient({
        appName: "cool-evidence-plane",
        imageDigest: nextImage,
        clock,
      });
      const info = await dstack.info();
      const cool = await CoolTee.connect({
        dstack,
        app: { name: "cool-evidence-plane", imageDigest: nextImage },
        expectedMeasurement: info.measurement,
        policy: { expectedMeasurement: info.measurement, requireVendor: ["intel-tdx"] },
        logId: "cool-console",
        clock,
        capture: { flushMs: 1 },
        retain: 200,
      });
      coolRef.current = cool;
      clockRef.current = Date.now();
      setEnclave(info);
      setHandshake(cool.handshake);
      setImage(nextImage);
      setRotations((n) => n + 1);
      pushStep({
        label: "redeploy",
        detail: `image ${nextImage.slice(0, 24)}… · new key ${cool.plane.keys.record.keyId}`,
        ok: true,
      });
      setProgress(1);
      setPhase("ready");
    },
    [clock, pushStep],
  );

  /**
   * Build a ledger row from a receipt alone.
   *
   * Deliberately thin: a receipt carries commitments, not plaintext, so a record
   * adopted this way shows what it can prove and says the rest was never kept.
   */
  const adoptNew = useCallback((): number => {
    const cool = coolRef.current;
    if (!cool) return 0;
    const fresh = cool.receipts.filter((receipt) => !knownIds.current.has(receipt.record.record_id));
    if (fresh.length === 0) return 0;

    const rows: LedgerEntry[] = fresh.map((receipt) => {
      const change = receipt.record.schema === "cool.change.v2" ? receipt.record.change : null;
      const model = receipt.record.schema === "cool.inference.v2" ? receipt.record.model : null;
      knownIds.current.add(receipt.record.record_id);
      return {
        id: receipt.record.record_id,
        receipt,
        verdict: null,
        kind: change ? "change" : "inference",
        label: change
          ? `${change.kind}: ${change.ref.split("#")[1] ?? change.ref}`
          : `${model?.id}@${model?.version}`,
        system: change ? (change.ref.split("#")[0] ?? "playground") : "playground",
        environment: change?.environment ?? "prod",
        at: Date.parse(receipt.record.time.issued_at) || Date.now(),
        fresh: true,
        detail: change
          ? {
              kind: "change",
              changeKind: change.kind,
              ref: change.ref,
              before: null,
              after: "(sealed from the IDE — the plaintext was committed and discarded)",
              decision: change.approval?.decision ?? "auto-approved",
              approvers: change.approval?.approvers ?? [],
            }
          : {
              kind: "inference",
              model: `${model?.id}@${model?.version}`,
              prompt: "(sealed from the IDE — the plaintext was committed and discarded)",
              output: "(committed as a salted hash; never retained)",
              params: {},
              gpu: receipt.record.runtime.gpu?.gpu_model ?? null,
            },
      };
    });

    setEntries((prev) => [...rows, ...prev].sort((a, b) => b.at - a.at));
    void Promise.all(rows.map((row) => verifyReceiptV2(row.receipt))).then((verdicts) => {
      setEntries((prev) =>
        prev.map((entry) => {
          const index = rows.findIndex((row) => row.id === entry.id);
          return index >= 0 ? { ...entry, verdict: verdicts[index] ?? null } : entry;
        }),
      );
    });
    refreshStats();
    return rows.length;
  }, [refreshStats]);

  const value = useMemo<StudioSession>(
    () => ({
      phase,
      progress,
      bootSteps,
      entries,
      handshake,
      enclave,
      stats,
      image,
      pinned: enclave?.measurement ?? null,
      rotations,
      runInference,
      commitChange,
      reverify,
      tamper,
      swapQuote,
      redeploy,
      client: coolRef.current,
      adoptNew,
    }),
    [
      phase,
      progress,
      bootSteps,
      entries,
      handshake,
      enclave,
      stats,
      image,
      rotations,
      runInference,
      commitChange,
      reverify,
      tamper,
      swapQuote,
      redeploy,
      adoptNew,
    ],
  );

  return <StudioContext.Provider value={value}>{children}</StudioContext.Provider>;
}

/**
 * A stand-in for a model response.
 *
 * There is no model in this browser and pretending otherwise would be the one
 * dishonest thing in the demo. What matters for the evidence path is that the
 * output is a real string that gets committed, salted and sealed — which it is.
 */
function draftOutput(prompt: string): string {
  const trimmed = prompt.trim().replace(/\s+/g, " ");
  const head = trimmed.length > 90 ? `${trimmed.slice(0, 90)}…` : trimmed;
  return `[local echo — no model in this browser] considered: "${head}"`;
}
