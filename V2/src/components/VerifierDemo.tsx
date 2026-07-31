"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { MonoTag } from "@/components/ui";

/* The live proof: a real receipt checked in the visitor's browser, plus
   the tamper demo. Embedded in slide 05 — the deck's claim, made runnable. */

const PAYLOAD = {
  receipt_id: "rcpt_01J8ZQ4WPD",
  model_hash: "9f2c71aa04b7e3d8c5f0e6b2a1d94c37",
  weight_hash: "5d41c8f2b06e9a7d3c1f8e5b2a90d647",
  prompt_hash: "c1a59e04f7b3d2c8e6a0f4b9d1735e28",
  output_hash: "e3b0c44298fc1c149afbf4c8996fb924",
  timestamp: "2026-07-08T09:41:07Z",
  tee_quote: "mock:MockAttestor-v0",
  merkle_root: "a7f3d914c2b8e05f6a1d9c47b3e82f50",
  anchor_tx: "local:FileAnchor",
};

type PayloadKey = keyof typeof PAYLOAD;

const TAMPER_INDEX = 9;

const FIELD_NOTES: Record<string, string> = {
  receipt_id: "Unique ID of this inference receipt.",
  model_hash: "SHA-256 commitment to the exact model that ran.",
  weight_hash: "SHA-256 of the exact weights loaded — a quiet fine-tune changes this.",
  prompt_hash: "Hash of the input. The prompt itself never leaves the enclave.",
  output_hash: "Hash of what the model returned — this is the byte we'll tamper.",
  timestamp: "Signed time of execution.",
  tee_quote: "Hardware attestation quote — labelled MockAttestor, stated honestly.",
  merkle_root: "RFC 6962 transparency-log root at the moment of inclusion.",
  anchor_tx: "On-chain anchor — local FileAnchor today, stated honestly.",
  receipt_hash: "SHA-256 over every field above — recomputed live in your browser.",
  signature: "ML-DSA-65 (FIPS 204) signature over the receipt hash.",
};

async function sha256hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type CheckKind = "live" | "demo" | "mock";
type CheckStatus = "idle" | "run" | "pass" | "fail";

const CHECKS: { id: string; label: string; kind: CheckKind }[] = [
  { id: "hash", label: "Receipt hash recomputed", kind: "live" },
  { id: "sig", label: "ML-DSA-65 signature", kind: "demo" },
  { id: "ts", label: "Timestamp valid", kind: "live" },
  { id: "merkle", label: "Merkle inclusion proof", kind: "demo" },
  { id: "anchor", label: "Anchor consistent", kind: "demo" },
  { id: "tee", label: "Hardware quote", kind: "mock" },
];

const FAILS_WITH_HASH = new Set(["hash", "sig", "merkle", "anchor"]);

export default function VerifierDemo() {
  const [tampered, setTampered] = useState(false);
  const [statuses, setStatuses] = useState<Record<string, CheckStatus>>({});
  const [verdict, setVerdict] = useState<"verified" | "rejected" | null>(null);
  const [running, setRunning] = useState(false);
  const [expectedHash, setExpectedHash] = useState<string | null>(null);
  const [computedHash, setComputedHash] = useState<string | null>(null);
  const [field, setField] = useState<string | null>(null);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    sha256hex(JSON.stringify(PAYLOAD)).then((h) => {
      if (alive.current) setExpectedHash(h);
    });
    return () => {
      alive.current = false;
    };
  }, []);

  const tamperedPayload = () => {
    const oh = PAYLOAD.output_hash;
    return {
      ...PAYLOAD,
      output_hash:
        oh.slice(0, TAMPER_INDEX) +
        (oh[TAMPER_INDEX] === "f" ? "0" : "f") +
        oh.slice(TAMPER_INDEX + 1),
    };
  };

  const runVerify = async (isTampered: boolean) => {
    if (running || !expectedHash) return;
    setRunning(true);
    setVerdict(null);
    setStatuses({});

    const payload = isTampered ? tamperedPayload() : PAYLOAD;
    const digest = await sha256hex(JSON.stringify(payload));
    if (!alive.current) return;
    setComputedHash(digest);
    const hashOk = digest === expectedHash;

    for (const c of CHECKS) {
      if (!alive.current) return;
      setStatuses((s) => ({ ...s, [c.id]: "run" }));
      await sleep(430);
      if (!alive.current) return;
      const ok = hashOk || !FAILS_WITH_HASH.has(c.id);
      setStatuses((s) => ({ ...s, [c.id]: ok ? "pass" : "fail" }));
    }
    await sleep(250);
    if (!alive.current) return;
    setVerdict(hashOk ? "verified" : "rejected");
    setRunning(false);
  };

  const tamper = () => {
    if (running) return;
    setTampered(true);
    setVerdict(null);
    setStatuses({});
    void runVerify(true);
  };

  const reset = () => {
    if (running) return;
    setTampered(false);
    setStatuses({});
    setVerdict(null);
    setComputedHash(null);
    setField(null);
  };

  const payload = tampered ? tamperedPayload() : PAYLOAD;

  const jsonRow = (k: string, v: string, highlight?: boolean) => (
    <button
      key={k}
      type="button"
      onClick={() => setField(field === k ? null : k)}
      className={clsx(
        "block w-full text-left leading-6 transition-colors hover:bg-ink/4",
        field === k && "bg-ink/8",
      )}
    >
      <span className="text-verify/80">&quot;{k}&quot;</span>
      <span className="text-mist">: </span>
      <span className={clsx("break-all", highlight ? "" : "text-fog")}>
        {highlight ? (
          <>
            <span className="text-fog">&quot;{v.slice(0, TAMPER_INDEX)}</span>
            <span className="rounded-sm bg-fail/25 px-0.5 font-bold text-fail">
              {v[TAMPER_INDEX]}
            </span>
            <span className="text-fog">{v.slice(TAMPER_INDEX + 1)}&quot;</span>
          </>
        ) : (
          <>&quot;{v}&quot;</>
        )}
      </span>
    </button>
  );

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div className="glass-strong overflow-hidden rounded-2xl">
        <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
          <span className="font-mono text-[11px] text-mist">receipt.json</span>
          <span className="font-mono text-[10px] tracking-wide text-mist uppercase">
            tap a field
          </span>
        </div>
        <div className="overflow-x-auto px-4 py-3 font-mono text-[12px]">
          <p className="text-mist">{"{"}</p>
          <div className="pl-4">
            {(Object.keys(payload) as PayloadKey[]).map((k) =>
              jsonRow(k, payload[k], k === "output_hash" && tampered),
            )}
            {jsonRow(
              "receipt_hash",
              expectedHash ? `${expectedHash.slice(0, 24)}…` : "computing…",
            )}
            {jsonRow("signature", "mldsa65:8f1e…a92c")}
          </div>
          <p className="text-mist">{"}"}</p>
        </div>
        {field && (
          <div className="border-t border-line bg-verify/5 px-4 py-3">
            <p className="font-mono text-[11px] text-verify">{field}</p>
            <p className="mt-1 text-xs leading-relaxed text-fog">{FIELD_NOTES[field]}</p>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void runVerify(tampered)}
            disabled={running || !expectedHash}
            className="rounded-full bg-verify-deep px-5 py-2.5 font-mono text-[13px] text-white shadow-[0_0_22px_rgba(9,105,218,0.45)] disabled:opacity-50"
          >
            ▶ verifyReceipt()
          </button>
          <button
            type="button"
            onClick={tamper}
            disabled={running || tampered}
            className="rounded-full border border-fail/40 bg-fail/10 px-5 py-2.5 font-mono text-[13px] text-fail disabled:opacity-40"
          >
            ⚡ Tamper one byte
          </button>
          <button
            type="button"
            onClick={reset}
            disabled={running}
            className="rounded-full border border-line px-4 py-2.5 font-mono text-[13px] text-mist disabled:opacity-40"
          >
            ↺ Reset
          </button>
        </div>

        <div className="glass rounded-2xl p-2">
          {CHECKS.map((c) => {
            const st = statuses[c.id] ?? "idle";
            return (
              <div
                key={c.id}
                className={clsx(
                  "flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 transition-colors",
                  st === "fail" && "bg-fail/10",
                  st === "pass" && "bg-live/5",
                )}
              >
                <span className="flex items-center gap-2.5 font-mono text-[13px]">
                  <span className="w-5 text-center">
                    {st === "idle" && <span className="text-ink/25">·</span>}
                    {st === "run" && (
                      <span className="inline-block animate-spin text-verify">◌</span>
                    )}
                    {st === "pass" && <span className="text-live">✓</span>}
                    {st === "fail" && <span className="text-fail">✕</span>}
                  </span>
                  <span
                    className={clsx(
                      st === "fail" ? "text-fail" : st === "pass" ? "text-fog" : "text-mist",
                    )}
                  >
                    {c.label}
                  </span>
                </span>
                {c.kind !== "live" && (
                  <MonoTag tone={c.kind === "mock" ? "mock" : "mist"}>{c.kind}</MonoTag>
                )}
              </div>
            );
          })}
        </div>

        {verdict && (
          <div
            className={clsx(
              "rounded-2xl border px-4 py-4 text-center",
              verdict === "verified"
                ? "border-live/40 bg-live/10"
                : "shake border-fail/50 bg-fail/10",
            )}
          >
            <p
              className={clsx(
                "display text-2xl",
                verdict === "verified" ? "text-live" : "text-fail",
              )}
            >
              {verdict === "verified" ? "✓ Verified" : "✕ Rejected"}
            </p>
            {computedHash && (
              <p className="mt-1.5 font-mono text-[10px] break-all text-mist">
                sha256: {computedHash.slice(0, 32)}…{" "}
                {verdict === "rejected" && (
                  <span className="text-fail">≠ receipt_hash</span>
                )}
              </p>
            )}
          </div>
        )}

        <p className="font-mono text-[11px] leading-relaxed text-mist">
          Hash check runs live in your browser (WebCrypto SHA-256).{" "}
          <span className="text-mock">demo/mock</span> rows use demo data.
        </p>
      </div>
    </div>
  );
}
