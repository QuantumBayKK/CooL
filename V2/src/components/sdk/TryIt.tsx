"use client";

/**
 * Runs the published artefact, from the published URL, in the reader's browser.
 *
 * Not a re-enactment: this component fetches the published bundle — the same file
 * the install instructions above it point at — boots an evidence plane, seals a
 * record and verifies it. If the bundle we ship were broken, this panel would
 * say so on our own page, which is the point of putting it here.
 *
 * The import is hidden from the bundler on purpose. A static `import(url)`
 * would be resolved at build time and inlined into the page chunk; going through
 * `new Function` keeps it a genuine runtime fetch of the static asset, which is
 * the only version of this that proves anything.
 */
import { useState } from "react";

interface Domain {
  status: string;
  detail: string;
}

interface Result {
  ok: boolean;
  keyId: string;
  recordId: string;
  mrtd: string;
  ms: number;
  checks: [string, Domain][];
}

const GLYPH: Record<string, string> = {
  pass: "✓",
  fail: "✕",
  simulated: "◐",
  absent: "·",
  mock: "·",
};

const COLOR: Record<string, string> = {
  pass: "text-live",
  fail: "text-fail",
  simulated: "text-verify",
  absent: "text-mist",
  mock: "text-mist",
};

export default function TryIt({ bundle }: { bundle: string }) {
  const [state, setState] = useState<"idle" | "running" | "done" | "error">("idle");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string>("");

  const run = async () => {
    setState("running");
    setError("");
    const started = performance.now();
    try {
      const load = new Function(`return import("${bundle}")`) as () => Promise<
        typeof import("@/lib/cool/phala")
      >;
      const { CoolTee, verifyReceiptV2 } = await load();

      const cool = await CoolTee.connect({
        app: { name: "sdk-page-visitor", imageDigest: "sha256:cool-nwc-docs-demo" },
        capture: { flushMs: 1 },
      });

      const receipt = await cool.change({
        kind: "prompt",
        ref: "docs/try-it#system",
        before: "Answer questions about refunds.",
        after: "Answer questions about refunds.\nEscalate anything marked disputed.",
        environment: "demo",
        actor: { id: "user:visitor", method: "session" },
      });

      const verdict = await verifyReceiptV2(receipt);
      await cool.close();

      setResult({
        ok: verdict.ok,
        keyId: receipt.record.signature.key_id,
        recordId: receipt.record.record_id,
        mrtd: receipt.record.runtime.enclave_measurement?.mrtd.slice(4, 28) ?? "—",
        ms: Math.round(performance.now() - started),
        checks: Object.entries(verdict.checks) as [string, Domain][],
      });
      setState("done");
    } catch (caught) {
      setError((caught as Error).message);
      setState("error");
    }
  };

  return (
    <div className="rounded-xl border border-line bg-panel/60 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] tracking-[0.12em] text-verify uppercase">
            Run the published bundle
          </p>
          <p className="mt-1 text-[13.5px] leading-relaxed text-fog">
            This imports <code className="font-mono text-[12.5px]">{bundle}</code> — the
            exact file above — and seals a record in your browser.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void run()}
          disabled={state === "running"}
          className="rounded-full bg-verify-deep px-4 py-1.5 font-mono text-[12px] text-white transition-shadow hover:shadow-[0_0_22px_rgba(9,105,218,0.55)] disabled:opacity-60"
        >
          {state === "running" ? "sealing…" : state === "done" ? "run again" : "run it"}
        </button>
      </div>

      {state === "error" && (
        <p className="mt-4 font-mono text-[12px] text-fail">failed: {error}</p>
      )}

      {result && (
        <div className="mt-4 space-y-1 font-mono text-[12px] leading-relaxed">
          <p className="text-mist">
            record <span className="text-fog">{result.recordId}</span> · sealed and verified in{" "}
            <span className="text-fog">{result.ms} ms</span>
          </p>
          <p className="text-mist">
            key <span className="text-fog">{result.keyId}</span> · derived from mrtd{" "}
            <span className="text-fog">{result.mrtd}…</span>
          </p>
          <div className="mt-2 space-y-0.5">
            {result.checks.map(([domain, check]) => (
              <p key={domain} className={COLOR[check.status] ?? "text-mist"}>
                {GLYPH[check.status] ?? "·"} {domain.padEnd(12, " ")}{" "}
                <span className="text-mist">{check.detail}</span>
              </p>
            ))}
          </div>
          <p className={result.ok ? "pt-1 text-live" : "pt-1 text-fail"}>
            {result.ok ? "receipt verifies" : "receipt rejected"}
          </p>
        </div>
      )}
    </div>
  );
}
