"use client";

/**
 * The demo's session.
 *
 * One evidence plane, booted in the visitor's browser, shared by every scene.
 * The studio has a session of its own; this one is deliberately separate and
 * deliberately smaller, because the two are optimising for different things.
 * The studio wants a populated estate to explore. A demo wants to be at the
 * first scene within a second of the page loading, with the interesting work
 * happening while someone is watching rather than before they arrived.
 *
 * So: boot the enclave, seal four backdrop records, stop. The change that
 * matters is sealed live, in scene two, off a keystroke.
 *
 * The policy set is handed to the plane rather than applied by this file, which
 * is the difference between governance that is enforced and governance that is
 * described. `cool.change()` is called with no approval block at all — the
 * enclave decides, and its decision is sealed by the same signature as the
 * change it governs.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  CoolTee,
  DEFAULT_POLICY,
  SimulatedDstackClient,
  verifyReceiptV2,
} from "@/lib/cool/phala";
import type {
  AttestationHandshake,
  EnclaveInfo,
  PolicyOutcome,
  ReceiptV2,
  VerdictV2,
} from "@/lib/cool/phala";
import { explainCascade } from "@/lib/story/cascade";
import type { CascadeInput, CascadeResult } from "@/lib/story/cascade";
import { BACKDROP, ENGINEER, REPO } from "@/lib/story/script";

/* ── shapes ───────────────────────────────────────────────────────────── */

export interface Row {
  readonly id: string;
  readonly receipt: ReceiptV2;
  readonly verdict: VerdictV2 | null;
  readonly label: string;
  readonly ref: string;
  readonly actor: string;
  readonly environment: string;
  readonly at: number;
  /** Sealed during this visit — the timeline flashes these. */
  readonly fresh: boolean;
  /**
   * The plaintext, kept in this tab only so the UI can show a diff. It is not
   * in the receipt and never leaves the browser — the record holds salted
   * commitments to these strings, which is the whole reason a prompt can be
   * proved later without being stored anywhere.
   */
  readonly before: string;
  readonly after: string;
  readonly decision: string;
}

export interface StorySession {
  readonly ready: boolean;
  readonly booting: string | null;
  readonly enclave: EnclaveInfo | null;
  readonly handshake: AttestationHandshake | null;
  readonly rows: readonly Row[];
  readonly logSize: number;

  /** Seal the hero change and take the receipt apart. */
  seal(input: {
    before: string;
    after: string;
    commit: string;
    path: string;
    ref: string;
  }): Promise<CascadeResult | null>;

  /** Re-run the verifier over one row, live. */
  reverify(id: string): Promise<VerdictV2 | null>;

  /** Flip one byte and verify the result — the same verifier, a different answer. */
  tamper(id: string): Promise<VerdictV2 | null>;

  readonly client: CoolTee | null;
}

const Ctx = createContext<StorySession | null>(null);

export function useStory(): StorySession {
  const session = useContext(Ctx);
  if (!session) throw new Error("useStory must be used inside <StoryProvider>");
  return session;
}

/* ── helpers ──────────────────────────────────────────────────────────── */

const yieldToBrowser = () => new Promise<void>((r) => setTimeout(r, 0));

const now = () => (typeof performance === "undefined" ? Date.now() : performance.now());

/* ── provider ─────────────────────────────────────────────────────────── */

export function StoryProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [booting, setBooting] = useState<string | null>("starting the enclave");
  const [enclave, setEnclave] = useState<EnclaveInfo | null>(null);
  const [handshake, setHandshake] = useState<AttestationHandshake | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [logSize, setLogSize] = useState(0);

  const coolRef = useRef<CoolTee | null>(null);
  const clockRef = useRef<number>(Date.now());
  const bootedRef = useRef(false);
  const cancelledRef = useRef(false);

  const clock = useCallback(() => new Date(clockRef.current).toISOString(), []);

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
        appName: REPO.name,
        imageDigest: REPO.image,
        clock,
      });
      const info = await dstack.info();
      if (cancelledRef.current) return;
      setEnclave(info);
      setBooting("deriving keys from the measurement");
      await yieldToBrowser();

      const cool = await CoolTee.connect({
        dstack,
        app: { name: REPO.name, imageDigest: REPO.image },
        expectedMeasurement: info.measurement,
        // Two different policies, and conflating them would be a real bug:
        // `policy` decides whether the CHANNEL opens, `governance` decides
        // whether a CHANGE is allowed and gets sealed into the record.
        policy: { expectedMeasurement: info.measurement, requireVendor: ["intel-tdx"] },
        governance: DEFAULT_POLICY,
        logId: "banking-agent",
        clock,
        capture: { flushMs: 1 },
        retain: 200,
      });
      if (cancelledRef.current) return;
      coolRef.current = cool;
      setHandshake(cool.handshake);
      setBooting("sealing the estate");
      await yieldToBrowser();

      // Oldest first, so leaf indices and timestamps tell the same story.
      const seeds = [...BACKDROP].sort((a, b) => b.minutesAgo - a.minutesAgo);
      for (const seed of seeds) {
        if (cancelledRef.current) return;
        clockRef.current = Date.now() - seed.minutesAgo * 60_000;
        try {
          const receipt = await cool.change({
            kind: seed.kind,
            ref: seed.ref,
            environment: seed.environment,
            before: seed.before,
            after: seed.after,
            actor: seed.actor,
            approvers: seed.approvers,
          });
          const verdict = await verifyReceiptV2(receipt);
          const decision =
            receipt.record.schema === "cool.change.v2"
              ? (receipt.record.change.approval?.decision ?? "—")
              : "—";
          if (cancelledRef.current) return;
          setRows((prev) =>
            [
              {
                id: receipt.record.record_id,
                receipt,
                verdict,
                label: seed.label,
                ref: seed.ref,
                actor: seed.actor.id,
                environment: seed.environment,
                at: clockRef.current,
                fresh: false,
                before: seed.before,
                after: seed.after,
                decision,
              },
              ...prev,
            ].sort((a, b) => b.at - a.at),
          );
        } catch {
          // A refused channel must not take the demo down — the same fail-open
          // rule the SDK follows toward the application it is capturing.
        }
        await yieldToBrowser();
      }

      if (cancelledRef.current) return;
      clockRef.current = Date.now();
      setLogSize(cool.plane.logSize);
      setBooting(null);
      setReady(true);
    })();

    return () => {
      cancelledRef.current = true;
    };
  }, [clock]);

  const seal = useCallback<StorySession["seal"]>(
    async (input) => {
      const cool = coolRef.current;
      if (!cool) return null;
      clockRef.current = Date.now();

      // No approval block. The enclave's policy decides, and seals its own
      // decision — which is the property the cascade's policy step then shows
      // by reaching the same verdict independently.
      const started = now();
      const receipt = await cool.change({
        kind: "prompt",
        ref: input.ref,
        environment: REPO.environment,
        before: input.before,
        after: input.after,
        actor: { id: ENGINEER.id, method: ENGINEER.method },
        approvers: [],
      });
      const sealMs = Math.round((now() - started) * 10) / 10;
      const outcome: PolicyOutcome | null = cool.plane.lastPolicyOutcome;

      const cascadeInput: CascadeInput = {
        commit: input.commit,
        repo: REPO.name,
        path: input.path,
        author: ENGINEER.id,
        ref: input.ref,
        environment: REPO.environment,
        kind: "prompt",
        actorMethod: ENGINEER.method,
        approvers: [],
        at: clockRef.current,
      };

      const result = await explainCascade(receipt, outcome, cascadeInput, sealMs);

      const decision =
        receipt.record.schema === "cool.change.v2"
          ? (receipt.record.change.approval?.decision ?? "—")
          : "—";

      setRows((prev) =>
        [
          {
            id: receipt.record.record_id,
            receipt,
            verdict: result.verdict,
            label: "Prompt changed",
            ref: input.ref,
            actor: ENGINEER.id,
            environment: REPO.environment,
            at: clockRef.current,
            fresh: true,
            before: input.before,
            after: input.after,
            decision,
          },
          ...prev,
        ].sort((a, b) => b.at - a.at),
      );
      setLogSize(cool.plane.logSize);

      return result;
    },
    [],
  );

  const reverify = useCallback<StorySession["reverify"]>(
    async (id) => {
      const row = rows.find((r) => r.id === id);
      if (!row) return null;
      const verdict = await verifyReceiptV2(row.receipt);
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, verdict } : r)));
      return verdict;
    },
    [rows],
  );

  const tamper = useCallback<StorySession["tamper"]>(
    async (id) => {
      const row = rows.find((r) => r.id === id);
      if (!row) return null;
      const edited = JSON.parse(JSON.stringify(row.receipt)) as ReceiptV2;
      const record = edited.record as unknown as Record<string, unknown>;
      if (edited.record.schema === "cool.change.v2") {
        // Change the environment the record claims — the smallest edit that
        // would actually matter to an auditor, and one character of it.
        const change = record["change"] as Record<string, unknown>;
        change["environment"] = "staging";
      }
      return verifyReceiptV2(edited);
    },
    [rows],
  );

  const value: StorySession = {
    ready,
    booting,
    enclave,
    handshake,
    rows,
    logSize,
    seal,
    reverify,
    tamper,
    client: coolRef.current,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
