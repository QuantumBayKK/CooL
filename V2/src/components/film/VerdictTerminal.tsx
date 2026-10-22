"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { viewVerdict, type VerdictView } from "@/lib/film/verdictView";
import { FIXTURES, tamperOneByte, type TamperResult } from "@/lib/receipts";

import { StatusChip } from "./HudFrame";

/**
 * Sequence C — the verdict terminal.
 *
 * Runs the real cool.receipt.v1 verifier (src/lib/cool/verify.ts) in the
 * browser. Every row is derived from the verifier's structured output through
 * `viewVerdict`, the one mapping that cannot render MOCK or ABSENT as PASS.
 *
 * Tamper flips one hex digit of one committed hash in a copy of the current
 * receipt and re-runs the verifier; Restore re-verifies the untouched
 * original. Fixtures are fetched from this site (/cool-vectors). A receipt
 * the visitor supplies through `external` is verified in memory and never
 * sent anywhere.
 */

type Source = { kind: "fixture"; id: string } | { kind: "external"; name: string };

export function VerdictTerminal({
  external,
  showPicker = true,
}: {
  external?: { name: string; receipt: unknown } | null;
  showPicker?: boolean;
}) {
  const FIRST = FIXTURES[0]!;
  const [fixtureId, setFixtureId] = useState(FIRST.id);
  const [original, setOriginal] = useState<unknown>(null);
  const [tamper, setTamper] = useState<TamperResult | null>(null);
  const [view, setView] = useState<VerdictView | null>(null);
  const [shown, setShown] = useState(0);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");
  const [source, setSource] = useState<Source>({ kind: "fixture", id: FIRST.id });
  const reduced = useRef(false);
  const run = useRef(0);
  const box = useRef<HTMLDivElement>(null);
  // Verification (ML-DSA-65 is real work) waits until the terminal is near
  // the viewport, so a terminal far down the homepage costs nothing at load.
  const [active, setActive] = useState(false);

  useEffect(() => {
    reduced.current = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e?.isIntersecting) return;
        io.disconnect();
        // Even in view, wait for load + idle so the verification does not
        // compete with the page's first paint and hydration.
        const go = () => {
          const ric = (window as unknown as { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number })
            .requestIdleCallback;
          if (ric) ric(() => setActive(true), { timeout: 1500 });
          else setTimeout(() => setActive(true), 300);
        };
        if (document.readyState === "complete") go();
        else addEventListener("load", go, { once: true });
      },
      { rootMargin: "50% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const verify = useCallback(async (receipt: unknown) => {
    const id = ++run.current;
    setState("loading");
    setShown(0);
    try {
      const { verifyReceipt } = await import("@/lib/cool/verify");
      const verdict = await verifyReceipt(receipt);
      if (id !== run.current) return;
      setView(viewVerdict(verdict));
      setState("ready");
    } catch (e) {
      if (id !== run.current) return;
      setError(e instanceof Error ? e.message : "verification threw");
      setState("error");
    }
  }, []);

  // Load a fixture.
  useEffect(() => {
    if (external || !active) return;
    const f = FIXTURES.find((x) => x.id === fixtureId) ?? FIRST;
    let live = true;
    setTamper(null);
    setSource({ kind: "fixture", id: f.id });
    fetch(f.path)
      .then((r) => {
        if (!r.ok) throw new Error(`fixture HTTP ${r.status}`);
        return r.json();
      })
      .then((json) => {
        if (!live) return;
        setOriginal(json);
        void verify(json);
      })
      .catch((e: Error) => {
        if (!live) return;
        setError(`Could not load the fixture (${e.message}). Check your connection and retry.`);
        setState("error");
      });
    return () => {
      live = false;
    };
  }, [fixtureId, external, verify, active]);

  // Verify a dropped receipt.
  useEffect(() => {
    if (!external) return;
    setTamper(null);
    setOriginal(external.receipt);
    setSource({ kind: "external", name: external.name });
    void verify(external.receipt);
  }, [external, verify]);

  // Reveal rows one by one, unless reduced motion.
  useEffect(() => {
    if (state !== "ready" || !view) return;
    if (reduced.current) {
      setShown(view.rows.length + 1);
      return;
    }
    let n = 0;
    const id = setInterval(() => {
      n++;
      setShown(n);
      if (n > view.rows.length) clearInterval(id);
    }, 110);
    return () => clearInterval(id);
  }, [state, view]);

  const doTamper = () => {
    if (!original) return;
    try {
      const t = tamperOneByte(original);
      setTamper(t);
      void verify(t.receipt);
    } catch (e) {
      setError(e instanceof Error ? e.message : "cannot tamper with this receipt");
      setState("error");
    }
  };
  const restore = () => {
    if (!original) return;
    setTamper(null);
    void verify(original);
  };

  const done = state === "ready" && view && shown > view.rows.length;
  const name =
    source.kind === "external" ? source.name : (FIXTURES.find((f) => f.id === source.id)?.path.split("/").pop() ?? "");

  return (
    <div ref={box} className="f-term">
      <div className="f-term__bar">
        <span>cool verify {name}{tamper ? " · TAMPERED" : ""}</span>
        <span>offline · in this browser</span>
      </div>

      <div className="f-term__body" aria-busy={state === "loading"}>
        <div>
          <span aria-hidden="true">$ </span>cool verify {name}
        </div>
        {state === "loading" && (
          <div className="f-term__detail">
            verifying… <span className="f-term__cursor" aria-hidden="true" />
          </div>
        )}
        {state === "error" && (
          <div role="alert" style={{ marginTop: 12 }}>
            × {error}
          </div>
        )}
        {state === "ready" &&
          view &&
          view.rows.slice(0, shown).map((r) => (
            <div key={r.domain} className="f-term__row">
              <span>{r.domain}</span>
              <StatusChip status={r.state} />
              <span className="f-term__detail">{r.detail}</span>
            </div>
          ))}
        {done && view && (
          <div className="f-term__head">
            {view.headline}
            {view.limited.length > 0 && (
              <div className="f-term__detail" style={{ fontWeight: 400 }}>
                not proven by this receipt: {view.limited.join(" · ")}
              </div>
            )}
          </div>
        )}
        <p className="f-sr" aria-live="polite">
          {done && view ? `Verification result: ${view.headline}. ${view.limited.length ? "Not proven: " + view.limited.join(", ") : ""}` : ""}
        </p>
      </div>

      {tamper && (
        <div className="f-term__diff">
          <div>
            tampered field <b>{tamper.path}</b>, one hex digit at position {tamper.offset}:
          </div>
          <div>
            − {tamper.before.slice(0, tamper.offset)}
            <mark>{tamper.before[tamper.offset]}</mark>
          </div>
          <div>
            + {tamper.after.slice(0, tamper.offset)}
            <mark>{tamper.after[tamper.offset]}</mark>
          </div>
        </div>
      )}

      <div className="f-term__ctl">
        {showPicker && !external && (
          <label className="f-label" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, maxWidth: "100%", minWidth: 0 }}>
            Fixture
            <select
              value={fixtureId}
              onChange={(e) => setFixtureId(e.target.value)}
              style={{
                height: 40,
                maxWidth: "100%",
                minWidth: 0,
                background: "var(--k)",
                color: "var(--w)",
                border: "1px solid var(--w-24)",
                fontFamily: "inherit",
                padding: "0 8px",
              }}
            >
              {FIXTURES.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
          </label>
        )}
        <button type="button" className="f-btn" onClick={doTamper} disabled={!original} data-impact="full">
          Tamper one byte
        </button>
        <button type="button" className="f-btn f-btn--line" onClick={restore} disabled={!tamper} data-impact="small">
          Restore
        </button>
      </div>
    </div>
  );
}
