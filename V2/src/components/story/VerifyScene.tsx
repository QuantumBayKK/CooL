"use client";

/**
 * Act seven — verification, offline.
 *
 * This is the act the demo exists for, and it is the one most easily faked, so
 * it is built to be checked rather than believed.
 *
 * "Offline" is a claim about behaviour, and claims about behaviour should be
 * measured. For the duration of the verify call this scene replaces `fetch`,
 * `XMLHttpRequest.open`, `WebSocket`, `EventSource` and `sendBeacon` with
 * counting wrappers, runs the verifier, restores them, and prints the count. If
 * verification ever reached for the network the number would not be zero, and
 * the panel would say so — it renders the counter, not a hard-coded zero.
 *
 * A reviewer does not have to trust that instrumentation either: the same
 * receipt downloads as a file, and the same verifier is on npm. The printed
 * command is the one that checks this receipt on their own laptop, with the
 * Wi-Fi off, against code they installed themselves. That is the only version
 * of this claim that actually survives contact with a software engineer, so it
 * is the one on screen.
 */
import { useCallback, useMemo, useRef, useState } from "react";
import { Copy, Download, WifiOff } from "lucide-react";
import { Terminal, type Printer, type TerminalApi } from "@/components/studio/ide/Terminal";
import { verifyReceiptV2, domainOrder } from "@/lib/cool/phala";
import type { ReceiptV2 } from "@/lib/cool/phala";
import { REPO } from "@/lib/story/script";
import { Button, Label, Panel, Pill } from "./ui";

/** The command a reviewer runs on their own machine, against the file they downloaded. */
export const CLI_COMMAND = "npx cool-nwc verify ./change-receipt.json --offline";

/* ── network instrumentation ──────────────────────────────────────────── */

/**
 * Count every outbound call attempted while `body` runs.
 *
 * Deliberately covers the five ways a browser can reach the network from
 * script. It is not a sandbox and does not pretend to be one — a determined
 * caller could hold a reference to the original `fetch` from before this ran.
 * It is an honest measurement of whether the verifier, which is right there in
 * the repository, reaches out. The downloadable receipt and the npm package are
 * what settle it for someone who wants to be adversarial about it.
 */
async function countingNetwork<T>(body: () => Promise<T>): Promise<{ value: T; calls: number }> {
  let calls = 0;
  const w = window as unknown as Record<string, unknown>;

  const realFetch = window.fetch;
  const realOpen = XMLHttpRequest.prototype.open;
  const realWs = w["WebSocket"];
  const realEs = w["EventSource"];
  const realBeacon = navigator.sendBeacon?.bind(navigator);

  window.fetch = ((...args: Parameters<typeof fetch>) => {
    calls++;
    return realFetch(...args);
  }) as typeof fetch;
  // `open` is overloaded, so the wrapper is typed through the prototype's own
  // signature rather than reconstructed — the cast is at the assignment, where
  // it is visible, instead of hidden inside a hand-written parameter list.
  XMLHttpRequest.prototype.open = function (this: XMLHttpRequest, ...args: unknown[]) {
    calls++;
    return (realOpen as (...a: unknown[]) => void).apply(this, args);
  } as typeof XMLHttpRequest.prototype.open;
  if (typeof realWs === "function") {
    w["WebSocket"] = new Proxy(realWs as object, {
      construct(target, args: unknown[]) {
        calls++;
        return Reflect.construct(target as new (...a: unknown[]) => object, args);
      },
    });
  }
  if (typeof realEs === "function") {
    w["EventSource"] = new Proxy(realEs as object, {
      construct(target, args: unknown[]) {
        calls++;
        return Reflect.construct(target as new (...a: unknown[]) => object, args);
      },
    });
  }
  if (realBeacon) {
    navigator.sendBeacon = ((...args: Parameters<typeof navigator.sendBeacon>) => {
      calls++;
      return realBeacon(...args);
    }) as typeof navigator.sendBeacon;
  }

  try {
    const value = await body();
    return { value, calls };
  } finally {
    window.fetch = realFetch;
    XMLHttpRequest.prototype.open = realOpen;
    if (realWs) w["WebSocket"] = realWs;
    if (realEs) w["EventSource"] = realEs;
    if (realBeacon) navigator.sendBeacon = realBeacon;
  }
}

/* ── the scene ────────────────────────────────────────────────────────── */

export function VerifyScene({ receipt }: { receipt: ReceiptV2 }) {
  const [calls, setCalls] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const api = useRef<TerminalApi | null>(null);

  const json = useMemo(() => JSON.stringify(receipt, null, 2), [receipt]);

  const download = useCallback(() => {
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "change-receipt.json";
    a.click();
    URL.revokeObjectURL(url);
  }, [json]);

  const copy = useCallback(() => {
    void navigator.clipboard?.writeText(CLI_COMMAND);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }, []);

  const run = useCallback(
    async (command: string, print: Printer) => {
      const [head, ...rest] = command.split(/\s+/);

      if (head === "help" || head === "cool" && rest.length === 0) {
        print({ text: "commands", tone: "dim" });
        print({ text: "  cool verify [--offline]   verify the sealed receipt", tone: "out" });
        print({ text: "  cool records              list what is in the log", tone: "out" });
        print({ text: "  cool attest               show the enclave the record came from", tone: "out" });
        print({ text: "  clear                     clear the screen", tone: "out" });
        return;
      }

      if (head !== "cool") {
        print({ text: `command not found: ${head}`, tone: "err" });
        return;
      }

      const sub = rest[0];

      if (sub === "verify") {
        print({ text: "reading  ./change-receipt.json", tone: "dim" });
        print({ text: `subject  ${REPO.system} · ${REPO.environment}`, tone: "dim" });
        print({ text: "", tone: "dim" });

        const started = performance.now();
        const { value: verdict, calls: seen } = await countingNetwork(() =>
          verifyReceiptV2(receipt),
        );
        const took = Math.round((performance.now() - started) * 10) / 10;
        setCalls(seen);
        setElapsed(took);

        for (const domain of domainOrder()) {
          const check = verdict.checks[domain];
          const mark =
            check.status === "pass"
              ? "✓"
              : check.status === "fail"
                ? "✕"
                : check.status === "pending"
                  ? "◔"
                  : "·";
          const tone =
            check.status === "pass"
              ? "ok"
              : check.status === "fail"
                ? "err"
                : check.status === "pending"
                  ? "warn"
                  : "dim";
          print({
            text: `  ${mark} ${domain.padEnd(12)} ${check.status.padEnd(10)} ${check.detail}`,
            tone,
          });
        }

        print({ text: "", tone: "dim" });
        print({
          text: verdict.ok ? "  VALID" : "  INVALID",
          tone: verdict.ok ? "ok" : "err",
        });
        print({ text: `  prompt      ${REPO.system}`, tone: "out" });
        print({
          text: `  signed      ${new Date(receipt.record.time.issued_at).toUTCString()}`,
          tone: "out",
        });
        print({ text: `  verified    offline · ${took} ms`, tone: "out" });
        print({
          text: `  network     ${seen} request${seen === 1 ? "" : "s"} during verification`,
          tone: seen === 0 ? "ok" : "err",
        });
        return;
      }

      if (sub === "records") {
        print({ text: `log ${receipt.sth?.log_id ?? "—"}`, tone: "accent" });
        print({ text: `  tree size   ${receipt.sth?.tree_size ?? "—"}`, tone: "out" });
        print({ text: `  tree head   ${receipt.sth?.root_hash ?? "—"}`, tone: "out" });
        print({ text: `  leaf index  ${receipt.inclusion?.leaf_index ?? "—"}`, tone: "out" });
        print({
          text: `  audit path  ${receipt.inclusion?.audit_path.length ?? 0} nodes`,
          tone: "out",
        });
        return;
      }

      if (sub === "attest") {
        const a = receipt.attestation;
        print({ text: `mode        ${a.mode}`, tone: a.mode === "hardware" ? "ok" : "warn" });
        print({ text: `note        ${a.note}`, tone: "dim" });
        print({ text: `vendor      ${receipt.record.runtime.tee_vendor}`, tone: "out" });
        print({
          text: `measurement ${a.expected_measurement?.mrtd?.slice(0, 32) ?? "—"}…`,
          tone: "out",
        });
        print({ text: `key binding ${a.key_binding ?? "—"}`, tone: "out" });
        return;
      }

      print({ text: `unknown command: cool ${sub ?? ""}`, tone: "err" });
    },
    [receipt],
  );

  return (
    <div className="grid h-full min-h-0 gap-3 lg:grid-cols-[1fr_320px]">
      {/* terminal */}
      <div
        data-skin="vscode"
        className="flex min-h-0 flex-col overflow-hidden rounded-lg border"
        style={{ borderColor: "var(--vsc-border)" }}
      >
        <div
          className="flex shrink-0 items-center justify-between border-b px-3 py-1.5"
          style={{ borderColor: "var(--vsc-border)", background: "var(--vsc-deep)" }}
        >
          <span className="font-mono text-[11px]" style={{ color: "var(--vsc-muted)" }}>
            zsh — auditor@laptop
          </span>
          <span className="flex items-center gap-1.5 font-mono text-[11px]" style={{ color: "var(--vsc-term-green)" }}>
            <WifiOff size={12} /> no network required
          </span>
        </div>
        <div className="min-h-0 flex-1">
          <Terminal
            cwd="~/audit"
            onReady={(a) => {
              api.current = a;
            }}
            greeting={[
              { text: "cool-nwc 2.4.0 — offline verifier", tone: "accent" },
              { text: "The receipt is on disk. Nothing here talks to a server.", tone: "dim" },
              { text: "Type `cool verify` (or press the button) · `help` for more.", tone: "dim" },
              { text: "", tone: "dim" },
            ]}
            onRun={run}
          />
        </div>
      </div>

      {/* proof rail */}
      <div className="flex min-h-0 flex-col gap-3 overflow-y-auto">
        <Panel className="p-4">
          <Label>Run it</Label>
          <div className="mt-2.5 flex flex-col gap-2">
            <Button tone="primary" onClick={() => void api.current?.submit("cool verify")}>
              cool verify
            </Button>
            <Button
              tone="ghost"
              size="sm"
              onClick={() => void api.current?.submit("cool attest")}
            >
              cool attest
            </Button>
          </div>
        </Panel>

        <Panel className="p-4">
          <Label>Network during verification</Label>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className="font-mono text-[30px] leading-none"
              style={{
                color:
                  calls === null
                    ? "var(--color-mist)"
                    : calls === 0
                      ? "var(--color-live)"
                      : "var(--color-fail)",
              }}
            >
              {calls ?? "—"}
            </span>
            <span className="text-[12px] text-mist">
              {calls === null ? "not measured yet" : "outbound requests"}
            </span>
          </div>
          <p className="mt-2 text-[11.5px] leading-relaxed text-mist">
            <code className="font-mono">fetch</code>, <code className="font-mono">XHR</code>,{" "}
            <code className="font-mono">WebSocket</code>, <code className="font-mono">EventSource</code>{" "}
            and <code className="font-mono">sendBeacon</code> are wrapped in counters for the
            duration of the call. This panel prints the counter, not a constant.
          </p>
          {elapsed !== null && (
            <div className="mt-2 border-t border-line pt-2">
              <Pill tone="live">verified in {elapsed} ms</Pill>
            </div>
          )}
        </Panel>

        <Panel className="p-4">
          <Label>Check it yourself</Label>
          <p className="mt-2 text-[11.5px] leading-relaxed text-mist">
            Download the receipt, turn your Wi-Fi off, and run the published package against it.
            No CooL code beyond the one you installed, and no account.
          </p>
          <div className="mt-2.5 flex flex-col gap-2">
            <Button size="sm" onClick={download}>
              <Download size={13} /> change-receipt.json
            </Button>
            <button
              type="button"
              onClick={copy}
              className="group flex items-start gap-2 rounded-md border border-line bg-void px-2.5 py-2 text-left transition-colors hover:border-verify"
            >
              <Copy size={12} className="mt-[3px] shrink-0 text-mist group-hover:text-verify" />
              <code className="min-w-0 font-mono text-[11px] leading-relaxed break-all text-fog">
                {CLI_COMMAND}
              </code>
            </button>
            {copied && <span className="text-[11px] text-live">copied</span>}
          </div>
        </Panel>
      </div>
    </div>
  );
}
