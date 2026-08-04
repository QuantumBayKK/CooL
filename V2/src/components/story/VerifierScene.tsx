"use client";

/**
 * Act ten — hand it a file.
 *
 * Everything up to here verified a receipt the page was already holding, which
 * a sceptic is right to discount: of course it passes, you made it. So this act
 * takes a file off the visitor's disk and runs the same verifier over whatever
 * is in it.
 *
 * It accepts a receipt or a whole audit pack, and it accepts files this page
 * never produced. That matters more than it looks: drop a receipt from someone
 * else's deployment and it verifies against the keys inside it; edit one
 * character of a file first and it fails, naming the domain that broke. The
 * verifier has no idea which files are "ours", because nothing in the format
 * gives it a way to care.
 *
 * The failure path gets the same care as the success path. A demo where the
 * only visible outcome is a green tick teaches nothing about what the product
 * does; the useful moment is watching a tampered file get rejected and reading
 * why.
 */
import { useCallback, useRef, useState } from "react";
import { FileJson, Upload } from "lucide-react";
import { domainOrder, validateReceiptV2Shape, verifyAuditPack, verifyReceiptV2 } from "@/lib/cool/phala";
import type { AuditPack, ReceiptV2, VerdictV2 } from "@/lib/cool/phala";
import { Label, Panel, Pill, toneOf } from "./ui";

type Outcome =
  | { kind: "receipt"; name: string; verdict: VerdictV2 }
  | { kind: "pack"; name: string; ok: boolean; total: number; failed: number }
  | { kind: "error"; name: string; message: string };

export function VerifierScene() {
  const [over, setOver] = useState(false);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const handle = useCallback(async (file: File) => {
    setBusy(true);
    setOutcome(null);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as Record<string, unknown>;

      if (parsed["schema"] === "cool.audit-pack.v2") {
        const verdict = await verifyAuditPack(parsed as unknown as AuditPack);
        setOutcome({
          kind: "pack",
          name: file.name,
          ok: verdict.ok,
          total: verdict.total,
          failed: verdict.failed,
        });
      } else {
        // Shape first, so a file that is merely the wrong sort of JSON says so
        // rather than failing seven cryptographic domains for no useful reason.
        const shape = validateReceiptV2Shape(parsed);
        if (!shape.ok) {
          setOutcome({
            kind: "error",
            name: file.name,
            message: shape.errors.join("; ") || "not a cool.receipt.v2",
          });
        } else {
          const verdict = await verifyReceiptV2(parsed as unknown as ReceiptV2);
          setOutcome({ kind: "receipt", name: file.name, verdict });
        }
      }
    } catch (error) {
      setOutcome({ kind: "error", name: file.name, message: (error as Error).message });
    }
    setBusy(false);
  }, []);

  return (
    <div className="thin-scroll flex h-full min-h-0 flex-col gap-3 overflow-y-auto pr-1">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          const file = e.dataTransfer.files[0];
          if (file) void handle(file);
        }}
        onClick={() => input.current?.click()}
        className="grid cursor-pointer place-items-center rounded-lg border border-dashed px-6 py-10 transition-colors"
        style={{
          borderColor: over ? "var(--color-verify)" : "var(--color-line-strong)",
          background: over ? "rgba(88,166,255,0.06)" : "transparent",
        }}
      >
        <input
          ref={input}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handle(file);
          }}
        />
        <Upload size={22} className="text-mist" />
        <div className="mt-2.5 text-[13.5px] text-ink">
          {busy ? "verifying…" : "Drop a receipt or an audit pack"}
        </div>
        <div className="mt-1 max-w-md text-center text-[11.5px] leading-relaxed text-mist">
          The file you downloaded, or one from somewhere else entirely. Nothing is uploaded — the
          verifier runs here, on the bytes you gave it.
        </div>
      </div>

      {outcome && (
        <Panel className="overflow-hidden">
          <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3">
            <FileJson size={15} className="text-mist" />
            <span className="font-mono text-[12px] text-fog">{outcome.name}</span>
            <span className="ml-auto">
              {outcome.kind === "receipt" && (
                <Pill tone={outcome.verdict.ok ? "live" : "fail"}>
                  {outcome.verdict.ok ? "evidence valid" : "evidence invalid"}
                </Pill>
              )}
              {outcome.kind === "pack" && (
                <Pill tone={outcome.ok ? "live" : "fail"}>
                  {outcome.ok ? "pack valid" : "pack invalid"}
                </Pill>
              )}
              {outcome.kind === "error" && <Pill tone="fail">unreadable</Pill>}
            </span>
          </div>

          <div className="px-4 py-3">
            {outcome.kind === "receipt" && (
              <div className="flex flex-col gap-[3px]">
                {domainOrder().map((domain) => {
                  const check = outcome.verdict.checks[domain];
                  return (
                    <div key={domain} className="flex items-start gap-2">
                      <span className="w-[86px] shrink-0 font-mono text-[11px] text-mist">
                        {domain}
                      </span>
                      <Pill tone={toneOf(check.status)}>{check.status}</Pill>
                      <span className="min-w-0 flex-1 text-[11.5px] leading-relaxed text-mist">
                        {check.detail}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {outcome.kind === "pack" && (
              <div className="text-[12px] leading-relaxed text-mist">
                {outcome.total} receipts checked, {outcome.failed} failed. Every record
                re-verified from its own bytes — commitments, both signatures, and Merkle
                inclusion against the tree head in the pack. The pack&rsquo;s own summary is
                ignored and recomputed.
              </div>
            )}

            {outcome.kind === "error" && (
              <div className="font-mono text-[11.5px] leading-relaxed text-fail">
                {outcome.message}
              </div>
            )}
          </div>
        </Panel>
      )}

      <Panel className="p-4">
        <Label>Why this is the honest test</Label>
        <p className="mt-2 max-w-prose text-[12px] leading-relaxed text-mist">
          A verifier that only ever sees its own output proves nothing. This one takes bytes it did
          not make, from a disk it does not control, and answers with a verdict it can justify
          domain by domain. Open the file in an editor, change one character anywhere in it, and
          drop it again — the domain that catches you is the one you touched.
        </p>
      </Panel>
    </div>
  );
}
