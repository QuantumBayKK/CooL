"use client";

import { useCallback, useEffect, useState } from "react";
import clsx from "clsx";
import { motion } from "motion/react";
import { RefreshCw } from "lucide-react";
import { Cool, generateKeypair } from "@/lib/cool";
import { canonicalCbor } from "@/lib/cool/canonical";
import { toHex, fromBase64Field, concatBytes } from "@/lib/cool/codec";
import { coreOf, recordSigningMessage, recordLeafData } from "@/lib/cool/record";
import { leafHash } from "@/lib/cool/merkle";
import { multihashDigest } from "@/lib/cool/multihash";
import type { Receipt } from "@/lib/cool/types";

/**
 * The inner workings, at the byte level.
 *
 * Every number on this screen is measured from a receipt minted moments ago in
 * this tab — not quoted from documentation. That distinction is the reason the
 * view exists: an engineer doing diligence wants to see that the signing
 * message really is `canonicalCBOR(core) ‖ binding_digest`, and that the leaf
 * really is `SHA256(0x00 ‖ digest)`, rather than read a sentence claiming so.
 */

interface Dissection {
  receipt: Receipt;
  cbor: Uint8Array;
  signingMessage: Uint8Array;
  bindingDigest: Uint8Array;
  leaf: Uint8Array;
  mlDsaSig: Uint8Array;
  edSig: Uint8Array;
  mlDsaPub: Uint8Array;
  edPub: Uint8Array;
  receiptBytes: number;
  mintMs: number;
}

function hexBlock(bytes: Uint8Array, max = 64): string {
  const head = toHex(bytes.subarray(0, max));
  const pairs = head.match(/.{2}/g) ?? [];
  const rows: string[] = [];
  for (let i = 0; i < pairs.length; i += 16) {
    rows.push(pairs.slice(i, i + 16).join(" "));
  }
  return rows.join("\n") + (bytes.length > max ? "\n…" : "");
}

function Row({
  label,
  value,
  mono = true,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-line/60 py-1.5 last:border-b-0 sm:flex-row sm:gap-3">
      <span className="w-full shrink-0 font-mono text-[10.5px] text-mist sm:w-52">
        {label}
      </span>
      <span
        className={clsx(
          "min-w-0 flex-1 break-all text-[12px] text-fog",
          mono && "font-mono text-[11.5px]",
        )}
      >
        {value}
      </span>
    </div>
  );
}

function Panel({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="frost rounded-2xl border border-line p-4 sm:p-5">
      <p className="font-mono text-[11px] tracking-[0.16em] text-verify uppercase">
        {title}
      </p>
      {hint ? (
        <p className="mt-1.5 text-[13px] leading-relaxed text-mist">{hint}</p>
      ) : null}
      <div className="mt-3">{children}</div>
    </section>
  );
}

export default function InternalsView() {
  const [d, setD] = useState<Dissection | null>(null);
  const [busy, setBusy] = useState(false);

  const mint = useCallback(async () => {
    setBusy(true);
    // yield so the spinner paints before ML-DSA keygen occupies the thread
    await new Promise((r) => setTimeout(r, 16));

    const t0 = performance.now();
    const signing = generateKeypair("internals-demo-01");
    const cool = new Cool({
      signing,
      log: "memory",
      logId: "internals",
      backend: ({ prompt }) => ({ output: `sealed:${prompt.length}` }),
    });
    const { receipt } = await cool.complete({
      model: "acme/credit-scorer@2026.07.1",
      prompt: "Return approve or decline, with the top three factors.",
      params: { temperature: 0, seed: 7 },
    });
    const mintMs = Math.round(performance.now() - t0);

    const core = coreOf(receipt.record);
    const cbor = canonicalCbor(core);
    const bindingDigest = multihashDigest(receipt.binding_hash);
    const entry = receipt.key_directory[receipt.record.signature.key_id]!;

    setD({
      receipt,
      cbor,
      signingMessage: recordSigningMessage(core, receipt.binding_hash),
      bindingDigest,
      leaf: leafHash(recordLeafData(receipt.binding_hash)),
      mlDsaSig: fromBase64Field(receipt.record.signature.ml_dsa),
      edSig: fromBase64Field(receipt.record.signature.ed25519),
      mlDsaPub: fromBase64Field(entry.ml_dsa_pub),
      edPub: fromBase64Field(entry.ed25519_pub),
      receiptBytes: new TextEncoder().encode(JSON.stringify(receipt)).length,
      mintMs,
    });
    setBusy(false);
  }, []);

  useEffect(() => {
    void mint();
  }, [mint]);

  if (!d) {
    return (
      <div className="frost flex min-h-[240px] items-center justify-center rounded-2xl border border-line">
        <p className="font-mono text-[12px] text-mist">
          Minting a receipt to dissect…
        </p>
      </div>
    );
  }

  const r = d.receipt;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-[13.5px] leading-relaxed text-fog">
          Everything below was measured from a receipt minted in this tab{" "}
          <span className="text-ink">{d.mintMs} ms</span> ago. Press regenerate
          and every value changes — because it is being computed, not recited.
        </p>
        <button
          type="button"
          onClick={mint}
          disabled={busy}
          className="inline-flex shrink-0 items-center gap-2 rounded-full border border-verify/45 bg-verify/10 px-3.5 py-2 font-mono text-[11.5px] text-ink transition-colors hover:bg-verify/20 disabled:opacity-50"
        >
          <RefreshCw className={clsx("size-3.5", busy && "animate-spin")} />
          Regenerate
        </button>
      </div>

      {/* the pipeline as equations */}
      <Panel
        title="How the commitment is built"
        hint="Four steps, each one reproducible by anyone holding the same record."
      >
        <div className="space-y-2">
          {[
            {
              step: "1",
              eq: "canonical = CBOR_CDE(core)",
              got: `${d.cbor.length} bytes`,
              why: "RFC 8949 §4.2 deterministic encoding — map keys sorted by encoded byte order, shortest-form integers. Same logical record, same bytes, every machine.",
            },
            {
              step: "2",
              eq: "binding_hash = mh:sha256(canonical)",
              got: `${d.bindingDigest.length}-byte digest`,
              why: "The fingerprint of the whole change. Alter one character of the core and this stops matching.",
            },
            {
              step: "3",
              eq: "message = canonical ‖ binding_digest",
              got: `${d.signingMessage.length} bytes`,
              why: "The signature commits to the raw bytes AND to the commitment over them, so neither can be swapped independently.",
            },
            {
              step: "4",
              eq: "leaf = SHA256(0x00 ‖ binding_digest)",
              got: `${d.leaf.length}-byte leaf`,
              why: "RFC 6962 leaf hashing. The 0x00 prefix is what stops a leaf being reinterpreted as an interior node.",
            },
          ].map((s) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, delay: Number(s.step) * 0.05 }}
              className="rounded-xl border border-line bg-void/50 px-3.5 py-2.5"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-mono text-[12.5px] text-ink">
                  <span className="mr-2 text-verify">{s.step}</span>
                  {s.eq}
                </p>
                <span className="font-mono text-[11px] text-live">{s.got}</span>
              </div>
              <p className="mt-1 text-[12.5px] leading-relaxed text-mist">{s.why}</p>
            </motion.div>
          ))}
        </div>
      </Panel>

      {/* the actual bytes */}
      <div className="grid gap-3 lg:grid-cols-2">
        <Panel
          title="Canonical CBOR"
          hint="The first 64 bytes of what actually gets hashed."
        >
          <pre className="overflow-x-auto rounded-lg border border-line bg-void/70 p-3 font-mono text-[11px] leading-relaxed text-fog">
            {hexBlock(d.cbor)}
          </pre>
          <Row label="total length" value={`${d.cbor.length} bytes`} />
          <Row label="encoding" value="RFC 8949 Core Deterministic Encoding" />
        </Panel>

        <Panel
          title="Signing message"
          hint="Canonical bytes with the 32-byte binding digest appended."
        >
          <pre className="overflow-x-auto rounded-lg border border-line bg-void/70 p-3 font-mono text-[11px] leading-relaxed text-fog">
            {hexBlock(
              concatBytes(
                d.signingMessage.subarray(0, 32),
                d.signingMessage.subarray(d.signingMessage.length - 32),
              ),
            )}
          </pre>
          <Row label="total length" value={`${d.signingMessage.length} bytes`} />
          <Row
            label="tail = binding digest"
            value={`${toHex(d.bindingDigest).slice(0, 32)}…`}
          />
        </Panel>
      </div>

      {/* the hybrid scheme, sized */}
      <Panel
        title="The hybrid signature, measured"
        hint="Both must verify. The size difference is the honest cost of post-quantum security — and the reason it is worth paying only where evidence has to outlive the algorithm."
      >
        <div className="space-y-2.5">
          {[
            {
              name: "ML-DSA-65",
              spec: "FIPS 204 · post-quantum lattice",
              sig: d.mlDsaSig.length,
              pub: d.mlDsaPub.length,
            },
            {
              name: "Ed25519",
              spec: "RFC 8032 · classical elliptic curve",
              sig: d.edSig.length,
              pub: d.edPub.length,
            },
          ].map((s) => (
            <div key={s.name} className="rounded-xl border border-line bg-void/50 p-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-mono text-[13px] text-ink">{s.name}</p>
                <p className="font-mono text-[10.5px] text-mist">{s.spec}</p>
              </div>
              <div className="mt-2 flex items-center gap-2.5">
                <span className="w-20 shrink-0 font-mono text-[10.5px] text-mist">
                  signature
                </span>
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-faint">
                  <motion.span
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (s.sig / 3400) * 100)}%` }}
                    transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                    className="block h-full rounded-full bg-verify"
                  />
                </span>
                <span className="w-16 shrink-0 text-right font-mono text-[10.5px] text-ink">
                  {s.sig} B
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-2.5">
                <span className="w-20 shrink-0 font-mono text-[10.5px] text-mist">
                  public key
                </span>
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-faint">
                  <motion.span
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (s.pub / 3400) * 100)}%` }}
                    transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                    className="block h-full rounded-full bg-verify/50"
                  />
                </span>
                <span className="w-16 shrink-0 text-right font-mono text-[10.5px] text-ink">
                  {s.pub} B
                </span>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      {/* the envelope */}
      <Panel
        title="The receipt envelope"
        hint="Self-contained: the public keys travel inside it, so verification never needs to reach CooL."
      >
        <Row label="schema" value={r.schema} />
        <Row label="record schema" value={r.record.schema} />
        <Row label="record id" value={r.record.record_id} />
        <Row label="model" value={`${r.record.model.id}@${r.record.model.version}`} />
        <Row label="weights commitment" value={r.record.model.weights_hash} />
        <Row label="input commitment" value={r.record.request.input_hash} />
        <Row label="input salt" value={r.record.request.input_salt} />
        <Row label="params commitment" value={r.record.request.params_hash} />
        <Row label="output commitment" value={r.record.response.output_hash} />
        <Row label="signature alg" value={r.record.signature.alg} />
        <Row label="key id" value={r.record.signature.key_id} />
        <Row
          label="key directory"
          value={`${Object.keys(r.key_directory).length} keys embedded`}
        />
        <Row
          label="log"
          value={
            r.sth
              ? `${r.sth.log_id} · leaf ${r.inclusion?.leaf_index} of tree(${r.sth.tree_size})`
              : "none"
          }
        />
        <Row label="root hash" value={r.sth?.root_hash ?? "—"} />
        <Row label="attestation" value={`${r.attestation.mode} — ${r.attestation.note}`} />
        <Row label="anchor" value={r.anchor === null ? "absent (planned)" : "present"} />
        <Row label="envelope size" value={`${(d.receiptBytes / 1024).toFixed(1)} KB of JSON`} />

        <p className="mt-3 rounded-lg border border-mock/30 bg-panel/50 px-3 py-2.5 text-[12.5px] leading-relaxed text-mist">
          Note the last two rows. Attestation is{" "}
          <span className="font-mono text-[11.5px] text-mock">mock</span> and the
          anchor is <span className="font-mono text-[11.5px] text-mock">null</span>{" "}
          because neither ships yet — and the verifier is built so those can never
          be reported as passing. A demo that hid this would be the one thing the
          product cannot afford to be.
        </p>
      </Panel>
    </div>
  );
}
