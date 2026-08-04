"use client";

/**
 * Studio IDE — an editor that edits, and a file that runs.
 *
 * Two things separate this from a screenshot with syntax colouring:
 *
 *   • every file is editable, with dirty markers, indent handling and ⌘/Ctrl-S;
 *   • `playground.js` is executed for real. Press Run and the code in the buffer
 *     is compiled with `AsyncFunction` and invoked with the live `CoolTee`
 *     instance the console is using — so a record sealed in the editor is signed
 *     by the same enclave-derived key and appears in the ledger a click away.
 *
 * The reference files (`src/cool.ts`, the compose file, the Rego policy) are
 * TypeScript and YAML: editable, but not executable in a browser, and the editor
 * says so rather than pretending. Being straight about which pane is live is the
 * difference between a tool and a mock-up.
 */
import { useCallback, useMemo, useRef, useState } from "react";
import {
  Bell,
  Bug,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  Columns2,
  Files,
  GitBranch,
  Package,
  Play,
  RotateCcw,
  Save,
  Search,
  Settings,
  TriangleAlert,
  X,
} from "lucide-react";
import {
  buildTree,
  fileAt,
  LANG_LABEL,
  PROJECT,
  PROJECT_NAME,
  type ProjectFile,
  type TreeNode,
} from "@/lib/studio/project";
import type { DomainCheckV2 } from "@/lib/cool/phala";
import { useStudio } from "../session";
import { Editor } from "./Editor";
import { Terminal, type Printer, type TerminalApi, type TermLine } from "./Terminal";

const PLAYGROUND = "playground.js";
const DEFAULT_OPEN = [PLAYGROUND, "src/cool.ts", "src/agent.ts"];
const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

type SideView = "explorer" | "search" | "scm" | "run";
type PanelTab = "terminal" | "problems" | "output";
type Problem = { severity: "error" | "warning"; file: string; line: number; text: string };

/** `new AsyncFunction(...)` — the only way to compile a user's `await` at runtime. */
const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor as new (
  ...args: string[]
) => (...args: unknown[]) => Promise<unknown>;

export default function IdeView() {
  const session = useStudio();
  const [buffers, setBuffers] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<Record<string, string>>({});
  const [open, setOpen] = useState<string[]>(DEFAULT_OPEN);
  const [active, setActive] = useState<string>(PLAYGROUND);
  const [side, setSide] = useState<SideView>("explorer");
  const [panel, setPanel] = useState<PanelTab>("terminal");
  const [panelOpen, setPanelOpen] = useState(true);
  const [cursor, setCursor] = useState({ line: 1, column: 1 });
  const [query, setQuery] = useState("");
  const [running, setRunning] = useState(false);
  const termRef = useRef<TerminalApi | null>(null);

  const file = fileAt(active) ?? PROJECT[0]!;

  const read = useCallback(
    (path: string): string => buffers[path] ?? fileAt(path)?.content ?? "",
    [buffers],
  );
  const isDirty = useCallback(
    (path: string): boolean =>
      buffers[path] !== undefined && buffers[path] !== (saved[path] ?? fileAt(path)?.content),
    [buffers, saved],
  );

  const edit = (path: string, next: string) => setBuffers((prev) => ({ ...prev, [path]: next }));

  const save = (path: string) =>
    setSaved((prev) => ({ ...prev, [path]: buffers[path] ?? fileAt(path)?.content ?? "" }));

  const revert = (path: string) => {
    setBuffers((prev) => {
      const next = { ...prev };
      delete next[path];
      return next;
    });
    setSaved((prev) => {
      const next = { ...prev };
      delete next[path];
      return next;
    });
  };

  const openFile = (path: string) => {
    setOpen((prev) => (prev.includes(path) ? prev : [...prev, path]));
    setActive(path);
    setCursor({ line: 1, column: 1 });
  };

  const closeFile = (path: string) => {
    setOpen((prev) => {
      const next = prev.filter((p) => p !== path);
      if (path === active && next.length > 0) setActive(next[next.length - 1]!);
      return next;
    });
  };

  /* ── problems: a real syntax check of the executable file, plus session state ── */
  const problems = useMemo<Problem[]>(() => {
    const list: Problem[] = [];

    try {
      new AsyncFunction("cool", "sdk", "log", read(PLAYGROUND));
    } catch (error) {
      list.push({
        severity: "error",
        file: PLAYGROUND,
        line: 1,
        text: `${(error as Error).name}: ${(error as Error).message}`,
      });
    }

    if (session.handshake && !session.handshake.ok) {
      list.push({
        severity: "error",
        file: "src/cool.ts",
        line: 38,
        text: "RA-TLS handshake failed — the SDK is refusing to transmit. Nothing is being captured.",
      });
    }
    if (session.enclave?.mode === "simulated") {
      list.push({
        severity: "warning",
        file: "src/cool.ts",
        line: 21,
        text: "Attestation is simulated. `policy.allowSimulated` must be false before production, and `requireHardware` will reject these receipts.",
      });
    }
    if ((session.stats?.dropped ?? 0) > 0) {
      list.push({
        severity: "warning",
        file: "src/cool.ts",
        line: 46,
        text: `${session.stats?.dropped} event(s) dropped by the capture queue. Fail-open worked; the evidence is incomplete.`,
      });
    }
    return list;
  }, [read, session.handshake, session.enclave, session.stats]);

  const errors = problems.filter((p) => p.severity === "error").length;
  const warnings = problems.filter((p) => p.severity === "warning").length;

  /* ── running the playground for real ── */
  const runPlayground = useCallback(
    async (print: Printer) => {
      const cool = session.client;
      if (!cool) {
        print({ text: "the evidence plane is still booting — try again in a moment", tone: "warn" });
        return;
      }
      const source = read(PLAYGROUND);
      const started = performance.now();
      setRunning(true);

      try {
        const sdk = await import("@/lib/cool/phala");
        const fn = new AsyncFunction("cool", "sdk", "log", "console", source);
        const consoleShim = {
          log: (...args: unknown[]) => print(args.map(stringify).join(" ")),
          error: (...args: unknown[]) => print({ text: args.map(stringify).join(" "), tone: "err" }),
          warn: (...args: unknown[]) => print({ text: args.map(stringify).join(" "), tone: "warn" }),
          info: (...args: unknown[]) => print(args.map(stringify).join(" ")),
        };
        const returned = await fn(cool, sdk, (line: unknown) => print(stringify(line)), consoleShim);

        if (returned !== undefined) print({ text: `→ ${stringify(returned)}`, tone: "accent" });

        const adopted = session.adoptNew();
        print({
          text: `[done in ${(performance.now() - started).toFixed(0)} ms${
            adopted > 0 ? ` · ${adopted} record(s) added to the ledger` : ""
          }]`,
          tone: "dim",
        });
      } catch (error) {
        const err = error as Error;
        print({ text: `${err.name}: ${err.message}`, tone: "err" });
        const frame = err.stack?.split("\n").find((line) => line.includes("<anonymous>"));
        if (frame) print({ text: frame.trim(), tone: "dim" });
      } finally {
        setRunning(false);
      }
    },
    [read, session],
  );

  /* ── the terminal's command set ── */
  const onRun = useCallback(
    async (command: string, print: Printer) => {
      const [verb, ...rest] = command.split(/\s+/);

      const printVerdict = (label: string, id: string) => {
        const entry = session.entries.find((e) => e.id === id);
        if (!entry?.verdict) {
          print({ text: `no verified record ${id}`, tone: "err" });
          return;
        }
        print({ text: label, tone: "dim" });
        const domains = Object.entries(entry.verdict.checks) as [string, DomainCheckV2][];
        for (const [domain, check] of domains) {
          const glyph = { pass: "✓", fail: "✗", simulated: "◐", pending: "◔", absent: "·", mock: "·" }[check.status];
          const tone =
            check.status === "pass"
              ? "ok"
              : check.status === "fail"
                ? "err"
                : check.status === "simulated"
                  ? "accent"
                  : "dim";
          print({
            text: `  ${glyph} ${domain.padEnd(12)} ${check.detail}`,
            tone: tone as TermLine["tone"],
          });
        }
        print({
          text: entry.verdict.ok ? "receipt verifies" : "receipt REJECTED",
          tone: entry.verdict.ok ? "ok" : "err",
        });
      };

      switch (`${verb} ${rest[0] ?? ""}`.trim()) {
        case "help": {
          print("commands:");
          print({ text: "  node playground.js          RUN the editor's buffer against the live SDK", tone: "dim" });
          print({ text: "  npm run dev                 replay the evidence plane's boot", tone: "dim" });
          print({ text: "  phala deploy                deploy the compose file into a CVM", tone: "dim" });
          print({ text: "  phala cvms attestation      print the enclave's quote summary", tone: "dim" });
          print({ text: "  cool seal                   seal a change record, live", tone: "dim" });
          print({ text: "  cool verify [latest|<id>]   run the offline verifier", tone: "dim" });
          print({ text: "  cool ledger                 list recent records", tone: "dim" });
          print({ text: "  cool stats                  capture queue counters", tone: "dim" });
          print({ text: "  ls · cat <file> · clear", tone: "dim" });
          return;
        }

        case "node playground.js":
        case "node ./playground.js": {
          await runPlayground(print);
          return;
        }

        case "node": {
          const target = rest[0] ?? "";
          print({
            text: target
              ? `${target}: this browser can execute playground.js only — the rest of the workspace is TypeScript and YAML`
              : "usage: node playground.js",
            tone: "warn",
          });
          return;
        }

        case "ls": {
          for (const entry of PROJECT) {
            print({
              text: `${isDirty(entry.path) ? "M" : " "} ${entry.path}`,
              tone: isDirty(entry.path) ? "warn" : "out",
            });
          }
          return;
        }

        case "cat": {
          const target = rest[0] ?? "";
          if (!fileAt(target)) {
            print({ text: `cat: ${target}: no such file`, tone: "err" });
            return;
          }
          for (const line of read(target).split("\n")) print({ text: line, tone: "dim" });
          return;
        }

        case "npm run": {
          if (rest[1] !== "dev") {
            print({ text: `unknown script '${rest[1] ?? ""}'`, tone: "err" });
            return;
          }
          print({ text: "> refund-agent@2.1.0 dev", tone: "dim" });
          await sleep(140);
          print({ text: `▸ dstack   ${session.enclave?.vendor} · ${session.enclave?.mode}`, tone: "accent" });
          await sleep(110);
          print({ text: `▸ measure  mrtd ${session.enclave?.measurement.mrtd.slice(4, 28)}…`, tone: "out" });
          await sleep(110);
          print({
            text: `▸ kms      derived ${session.entries[0]?.receipt.record.signature.key_id ?? "—"} (sealed to the measurement)`,
            tone: "out",
          });
          await sleep(120);
          for (const step of session.handshake?.steps ?? []) {
            print({
              text: `  ${step.ok ? "✓" : "✗"} ${step.label.padEnd(16)} ${step.detail}`,
              tone: step.ok ? "ok" : "err",
            });
            await sleep(40);
          }
          print({
            text: session.handshake?.ok
              ? "▸ ready    RA-TLS channel open · capture queue armed"
              : "▸ closed   channel refused — the app keeps serving, nothing is transmitted",
            tone: session.handshake?.ok ? "ok" : "warn",
          });
          return;
        }

        case "phala deploy": {
          print({ text: "building compose plan", tone: "dim" });
          await sleep(200);
          print("selecting CPU TEE: Intel TDX");
          await sleep(160);
          print("injecting encrypted env");
          await sleep(160);
          print({
            text: `measured image → mrtd ${session.enclave?.measurement.mrtd.slice(4, 28)}…`,
            tone: "out",
          });
          await sleep(140);
          print({ text: "cvm ready: https://cool-evidence-plane.dstack-prod.phala.network", tone: "ok" });
          print({ text: "note: this workspace is a sample — nothing was deployed from your browser.", tone: "dim" });
          return;
        }

        case "phala cvms": {
          const quote = session.handshake?.quote;
          if (!quote) {
            print({ text: "no quote available", tone: "err" });
            return;
          }
          print({ text: `format       ${quote.format}`, tone: "out" });
          print({ text: `root         ${quote.root}`, tone: "out" });
          print({ text: `app_id       ${quote.body.app_id}`, tone: "out" });
          print({ text: `instance_id  ${quote.body.instance_id}`, tone: "out" });
          print({ text: `tcb_status   ${quote.body.tcb_status}`, tone: "out" });
          print({ text: `report_data  ${quote.body.report_data}`, tone: "out" });
          return;
        }

        case "cool seal": {
          print({ text: "capturing change → billing/refund-agent#system", tone: "dim" });
          const started = performance.now();
          const entry = await session.commitChange({
            system: "billing/refund-agent",
            kind: "prompt",
            ref: "billing/refund-agent#system",
            before: "Approve refunds up to $500 without escalation.",
            after: "Approve refunds up to $500 without escalation.\nAlways cite the dispute reference.",
            environment: "prod",
            approvers: ["priya@bank.example", "marcus@bank.example"],
          });
          if (!entry) {
            print({ text: "channel closed — event dropped and counted (the app was never blocked)", tone: "warn" });
            return;
          }
          print({ text: `✓ sealed ${entry.id}`, tone: "ok" });
          print({ text: `  binding  ${entry.receipt.binding_hash}`, tone: "out" });
          print({
            text: `  leaf     ${entry.receipt.inclusion?.leaf_index} of ${entry.receipt.inclusion?.tree_size}`,
            tone: "out",
          });
          print({
            text: `  ${(performance.now() - started).toFixed(1)} ms end to end, in this browser`,
            tone: "dim",
          });
          return;
        }

        case "cool verify": {
          const target = !rest[1] || rest[1] === "latest" ? session.entries[0]?.id : rest[1];
          if (!target) {
            print({ text: "nothing to verify yet", tone: "err" });
            return;
          }
          await session.reverify(target);
          printVerdict(`verifying ${target}`, target);
          return;
        }

        case "cool ledger": {
          for (const entry of session.entries.slice(0, 10)) {
            print({
              text: `${entry.verdict?.ok ? "✓" : entry.verdict ? "✗" : "·"} ${entry.id.slice(0, 12)}  ${entry.kind.padEnd(9)} ${entry.label}`,
              tone: entry.verdict?.ok === false ? "err" : "out",
            });
          }
          print({ text: `${session.entries.length} records in this session`, tone: "dim" });
          return;
        }

        case "cool stats": {
          const stats = session.stats;
          if (!stats) {
            print({ text: "no capture statistics yet", tone: "err" });
            return;
          }
          print({ text: `sent      ${stats.sent}`, tone: "out" });
          print({ text: `dropped   ${stats.dropped}`, tone: stats.dropped > 0 ? "warn" : "out" });
          print({ text: `batches   ${stats.batches}`, tone: "out" });
          print({ text: `queue max ${stats.highWater}`, tone: "out" });
          print({ text: `p50       ${stats.p50Ms.toFixed(4)} ms`, tone: "ok" });
          print({ text: `p99       ${stats.p99Ms.toFixed(4)} ms  ← cost on the caller's thread`, tone: "ok" });
          return;
        }

        default:
          print({ text: `command not found: ${command}`, tone: "err" });
          print({ text: "try `help`", tone: "dim" });
      }
    },
    [session, runPlayground, isDirty, read],
  );

  const greeting = useMemo<TermLine[]>(
    () => [
      { text: "CooL Studio — integrated terminal", tone: "dim" },
      { text: "Wired to the live SDK session. `node playground.js` runs the editor's buffer.", tone: "dim" },
      { text: "", tone: "dim" },
    ],
    [],
  );

  const send = (command: string) => {
    setPanel("terminal");
    setPanelOpen(true);
    void termRef.current?.submit(command);
  };

  const runActive = () => send(active === PLAYGROUND ? "node playground.js" : "npm run dev");

  return (
    <div
      data-skin="vscode"
      className="flex h-full min-h-0 flex-col"
      style={{ background: "var(--vsc-editor)", color: "var(--vsc-text)" }}
    >
      <TitleBar onRun={runActive} running={running} />

      <div className="flex min-h-0 flex-1">
        <ActivityBar side={side} onSide={setSide} problems={problems.length} />

        <aside
          className="thin-scroll hidden w-[240px] shrink-0 overflow-y-auto border-r sm:block"
          style={{ background: "var(--vsc-chrome)", borderColor: "var(--vsc-border)" }}
        >
          {side === "explorer" && <ExplorerPane active={active} onOpen={openFile} dirty={isDirty} />}
          {side === "search" && (
            <SearchPane query={query} onQuery={setQuery} onOpen={openFile} read={read} />
          )}
          {side === "scm" && <ScmPane onOpen={openFile} dirty={isDirty} onRevert={revert} />}
          {side === "run" && <RunPane onLaunch={send} />}
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <Tabs open={open} active={active} onSelect={setActive} onClose={closeFile} dirty={isDirty} />
          <Breadcrumb
            file={file}
            dirty={isDirty(file.path)}
            onSave={() => save(file.path)}
            onRevert={() => revert(file.path)}
          />

          <Editor
            path={file.path}
            lang={file.lang}
            value={read(file.path)}
            onChange={(next) => edit(file.path, next)}
            onSave={() => save(file.path)}
            onCursor={setCursor}
            readOnlyNote={
              file.path === PLAYGROUND
                ? "this file executes — edit it, then Run"
                : "editable · not executed in the browser"
            }
          />

          {panelOpen && (
            <div
              className="flex h-[236px] shrink-0 flex-col border-t"
              style={{ borderColor: "var(--vsc-border)", background: "var(--vsc-chrome)" }}
            >
              <div
                className="flex shrink-0 items-center gap-4 border-b px-3"
                style={{ borderColor: "var(--vsc-border)" }}
              >
                {(["terminal", "problems", "output"] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setPanel(tab)}
                    className="border-b-[1.5px] py-1.5 text-[11px] font-semibold tracking-[0.08em] uppercase"
                    style={{
                      borderColor: panel === tab ? "var(--vsc-text)" : "transparent",
                      color: panel === tab ? "var(--vsc-bright)" : "var(--vsc-muted)",
                    }}
                  >
                    {tab}
                    {tab === "problems" && problems.length > 0 && (
                      <span
                        className="ml-1.5 rounded-full px-1.5 text-[10px]"
                        style={{
                          background: errors > 0 ? "var(--vsc-term-red)" : "var(--vsc-border-strong)",
                          color: "#fff",
                        }}
                      >
                        {problems.length}
                      </span>
                    )}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setPanelOpen(false)}
                  className="ml-auto p-1"
                  aria-label="Close panel"
                >
                  <X className="size-3.5" style={{ color: "var(--vsc-muted)" }} />
                </button>
              </div>

              <div className="min-h-0 flex-1">
                {panel === "terminal" && (
                  <Terminal
                    greeting={greeting}
                    onRun={onRun}
                    onReady={(api) => {
                      termRef.current = api;
                    }}
                  />
                )}
                {panel === "problems" && <ProblemsPane problems={problems} onOpen={openFile} />}
                {panel === "output" && <OutputPane />}
              </div>
            </div>
          )}
        </div>
      </div>

      <StatusBar
        file={file}
        cursor={cursor}
        errors={errors}
        warnings={warnings}
        dirty={PROJECT.filter((entry) => isDirty(entry.path)).length}
        onPanel={(tab) => {
          setPanel(tab);
          setPanelOpen(true);
        }}
      />
    </div>
  );
}

/** Print a value the way a console would, without exploding on cycles. */
function stringify(value: unknown): string {
  if (typeof value === "string") return value;
  if (value instanceof Error) return `${value.name}: ${value.message}`;
  try {
    return JSON.stringify(value, null, 2) ?? String(value);
  } catch {
    return String(value);
  }
}

/* ── chrome ───────────────────────────────────────────────────────────── */

function TitleBar({ onRun, running }: { onRun: () => void; running: boolean }) {
  return (
    <div
      className="flex h-[34px] shrink-0 items-center gap-4 border-b px-3"
      style={{ background: "var(--vsc-chrome)", borderColor: "var(--vsc-border)" }}
    >
      <div className="hidden items-center gap-3 text-[12px] md:flex" style={{ color: "var(--vsc-muted)" }}>
        {["File", "Edit", "Selection", "View", "Go", "Run", "Terminal", "Help"].map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>
      <span className="mx-auto text-[12px]" style={{ color: "var(--vsc-muted)" }}>
        {PROJECT_NAME} — CooL Studio
      </span>
      <button
        type="button"
        onClick={onRun}
        disabled={running}
        title="Run the active file"
        className="flex items-center gap-1.5 rounded-[3px] px-2 py-0.5 text-[11.5px] transition-colors hover:brightness-125 disabled:opacity-60"
        style={{ color: "var(--vsc-text)", background: "rgba(255,255,255,0.07)" }}
      >
        <Play className="size-3.5" style={{ color: "var(--vsc-term-green)" }} />
        {running ? "running…" : "Run"}
      </button>
    </div>
  );
}

function ActivityBar({
  side,
  onSide,
  problems,
}: {
  side: SideView;
  onSide: (side: SideView) => void;
  problems: number;
}) {
  const items: { id: SideView; icon: typeof Files; label: string; badge?: number }[] = [
    { id: "explorer", icon: Files, label: "Explorer" },
    { id: "search", icon: Search, label: "Search" },
    { id: "scm", icon: GitBranch, label: "Source Control", badge: PROJECT.length },
    { id: "run", icon: Bug, label: "Run and Debug", badge: problems || undefined },
  ];
  return (
    <div
      className="flex w-[48px] shrink-0 flex-col items-center justify-between border-r py-1"
      style={{ background: "var(--vsc-chrome)", borderColor: "var(--vsc-border)" }}
    >
      <div className="flex flex-col items-center">
        {items.map((item) => {
          const Icon = item.icon;
          const activeItem = side === item.id;
          return (
            <button
              key={item.id}
              type="button"
              title={item.label}
              onClick={() => onSide(item.id)}
              className="relative grid h-12 w-12 place-items-center"
              style={{ color: activeItem ? "var(--vsc-bright)" : "var(--vsc-muted)" }}
            >
              {activeItem && (
                <span
                  aria-hidden
                  className="absolute top-2 bottom-2 left-0 w-[2px]"
                  style={{ background: "var(--vsc-bright)" }}
                />
              )}
              <Icon className="size-5" strokeWidth={1.5} />
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className="absolute right-1.5 bottom-2 grid size-4 place-items-center rounded-full text-[9px] font-bold text-white"
                  style={{ background: "var(--vsc-accent)" }}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div className="flex flex-col items-center pb-1" style={{ color: "var(--vsc-muted)" }}>
        <span className="grid h-12 w-12 place-items-center" title="Extensions">
          <Package className="size-5" strokeWidth={1.5} />
        </span>
        <span className="grid h-12 w-12 place-items-center" title="Settings">
          <Settings className="size-5" strokeWidth={1.5} />
        </span>
      </div>
    </div>
  );
}

function PaneTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 py-2">
      <span
        className="text-[11px] font-semibold tracking-[0.08em] uppercase"
        style={{ color: "var(--vsc-muted)" }}
      >
        {children}
      </span>
    </div>
  );
}

function ExplorerPane({
  active,
  onOpen,
  dirty,
}: {
  active: string;
  onOpen: (path: string) => void;
  dirty: (path: string) => boolean;
}) {
  const tree = useMemo(() => buildTree(), []);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const toggle = (path: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });

  const render = (nodes: TreeNode[], depth: number): React.ReactNode =>
    nodes.map((node) => {
      const isOpen = !collapsed.has(node.path);
      if (node.kind === "dir") {
        return (
          <div key={node.path}>
            <button
              type="button"
              onClick={() => toggle(node.path)}
              className="flex w-full items-center gap-1 py-[3px] pr-2 text-left text-[13px]"
              style={{ paddingLeft: 8 + depth * 12, color: "var(--vsc-text)" }}
            >
              {isOpen ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
              {node.name}
            </button>
            {isOpen && render(node.children ?? [], depth + 1)}
          </div>
        );
      }
      const isActive = node.path === active;
      const modified = dirty(node.path);
      return (
        <button
          key={node.path}
          type="button"
          onClick={() => onOpen(node.path)}
          className="flex w-full items-center gap-1.5 py-[3px] pr-2 text-left text-[13px]"
          style={{
            paddingLeft: 8 + depth * 12 + 14,
            background: isActive ? "var(--vsc-selection)" : "transparent",
            color: modified ? "var(--vsc-term-yellow)" : isActive ? "#fff" : "var(--vsc-text)",
          }}
        >
          <FileGlyph name={node.name} />
          <span className="truncate">{node.name}</span>
          {modified && <span className="ml-auto pr-1 text-[11px]">M</span>}
        </button>
      );
    });

  return (
    <div className="pb-4">
      <PaneTitle>Explorer</PaneTitle>
      <div
        className="px-4 pb-1 text-[11px] font-bold tracking-[0.06em] uppercase"
        style={{ color: "var(--vsc-text)" }}
      >
        {PROJECT_NAME}
      </div>
      {render(tree, 0)}
      <p className="mt-4 px-4 text-[11px] leading-snug" style={{ color: "var(--vsc-dim)" }}>
        Every file is editable. <span style={{ color: "var(--vsc-term-green)" }}>playground.js</span>{" "}
        is the one that executes — against the same SDK session the console is using.
      </p>
    </div>
  );
}

function FileGlyph({ name }: { name: string }) {
  const ext = name.includes(".") ? name.slice(name.lastIndexOf(".") + 1) : name;
  const color =
    ext === "ts"
      ? "#4ec9b0"
      : ext === "js"
        ? "#e2c08d"
        : ext === "json"
          ? "#cbcb41"
          : ext === "yml" || ext === "yaml"
            ? "#c586c0"
            : ext === "md"
              ? "#519aba"
              : ext === "rego"
                ? "#a074c4"
                : "#9d9d9d";
  return (
    <span
      aria-hidden
      className="grid size-3.5 shrink-0 place-items-center rounded-[2px] text-[8px] font-bold"
      style={{ background: `${color}22`, color }}
    >
      {ext.slice(0, 2).toUpperCase()}
    </span>
  );
}

function SearchPane({
  query,
  onQuery,
  onOpen,
  read,
}: {
  query: string;
  onQuery: (value: string) => void;
  onOpen: (path: string) => void;
  read: (path: string) => string;
}) {
  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (needle.length < 2) return [];
    return PROJECT.map((file) => {
      const hits = read(file.path)
        .split("\n")
        .map((line, index) => ({ line: index + 1, text: line.trim() }))
        .filter((row) => row.text.toLowerCase().includes(needle));
      return { file, hits };
    }).filter((row) => row.hits.length > 0);
  }, [query, read]);

  return (
    <div className="pb-4">
      <PaneTitle>Search</PaneTitle>
      <div className="px-3">
        <input
          value={query}
          onChange={(event) => onQuery(event.target.value)}
          placeholder="Search"
          className="w-full rounded-[2px] border px-2 py-1 text-[12.5px] outline-none"
          style={{
            background: "var(--vsc-deep)",
            borderColor: "var(--vsc-border-strong)",
            color: "var(--vsc-text)",
          }}
        />
      </div>
      <div className="mt-2">
        {results.map(({ file, hits }) => (
          <div key={file.path} className="mb-2">
            <button
              type="button"
              onClick={() => onOpen(file.path)}
              className="flex w-full items-center gap-1.5 px-3 py-1 text-left text-[12.5px]"
              style={{ color: "var(--vsc-bright)" }}
            >
              <FileGlyph name={file.path} />
              <span className="truncate">{file.path}</span>
              <span className="ml-auto text-[11px]" style={{ color: "var(--vsc-dim)" }}>
                {hits.length}
              </span>
            </button>
            {hits.slice(0, 4).map((hit) => (
              <button
                key={hit.line}
                type="button"
                onClick={() => onOpen(file.path)}
                className="block w-full truncate px-3 py-[2px] pl-8 text-left font-mono text-[11px]"
                style={{ color: "var(--vsc-muted)" }}
              >
                {hit.text}
              </button>
            ))}
          </div>
        ))}
        {query.trim().length >= 2 && results.length === 0 && (
          <p className="px-3 text-[12px]" style={{ color: "var(--vsc-dim)" }}>
            No results.
          </p>
        )}
      </div>
    </div>
  );
}

function ScmPane({
  onOpen,
  dirty,
  onRevert,
}: {
  onOpen: (path: string) => void;
  dirty: (path: string) => boolean;
  onRevert: (path: string) => void;
}) {
  const changed = PROJECT.filter((file) => dirty(file.path));
  return (
    <div className="pb-4">
      <PaneTitle>Source Control</PaneTitle>
      <p className="px-4 pb-2 text-[11.5px] leading-snug" style={{ color: "var(--vsc-dim)" }}>
        {changed.length === 0
          ? "No changes in this session. Edit a file and it appears here."
          : `${changed.length} file(s) changed in this browser session — nothing is written to disk.`}
      </p>
      {(changed.length > 0 ? changed : PROJECT).map((file) => (
        <div key={file.path} className="flex items-center gap-1.5 px-4 py-[3px] text-[12.5px]">
          <button
            type="button"
            onClick={() => onOpen(file.path)}
            className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
            style={{ color: dirty(file.path) ? "var(--vsc-term-yellow)" : "var(--vsc-text)" }}
          >
            <FileGlyph name={file.path} />
            <span className="truncate">{file.path}</span>
          </button>
          {dirty(file.path) ? (
            <button type="button" title="Discard changes" onClick={() => onRevert(file.path)}>
              <RotateCcw className="size-3" style={{ color: "var(--vsc-muted)" }} />
            </button>
          ) : (
            <span className="font-bold" style={{ color: "var(--vsc-term-green)" }}>
              A
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function RunPane({ onLaunch }: { onLaunch: (command: string) => void }) {
  const launches = [
    { label: "Run playground.js against the live SDK", command: "node playground.js" },
    { label: "Replay the evidence plane's boot", command: "npm run dev" },
    { label: "Deploy to a confidential VM", command: "phala deploy" },
    { label: "Print the enclave attestation", command: "phala cvms attestation" },
    { label: "Seal a change record", command: "cool seal" },
    { label: "Verify the latest receipt", command: "cool verify latest" },
    { label: "Capture queue statistics", command: "cool stats" },
  ];
  return (
    <div className="pb-4">
      <PaneTitle>Run and Debug</PaneTitle>
      <div className="px-2">
        {launches.map((launch) => (
          <button
            key={launch.command}
            type="button"
            onClick={() => onLaunch(launch.command)}
            className="mb-1 flex w-full items-start gap-2 rounded-[3px] px-2 py-1.5 text-left transition-colors hover:brightness-125"
            style={{ background: "var(--vsc-deep)" }}
          >
            <Play className="mt-[2px] size-3.5 shrink-0" style={{ color: "var(--vsc-term-green)" }} />
            <span>
              <span className="block text-[12.5px]" style={{ color: "var(--vsc-text)" }}>
                {launch.label}
              </span>
              <span className="block font-mono text-[11px]" style={{ color: "var(--vsc-dim)" }}>
                {launch.command}
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function Tabs({
  open,
  active,
  onSelect,
  onClose,
  dirty,
}: {
  open: string[];
  active: string;
  onSelect: (path: string) => void;
  onClose: (path: string) => void;
  dirty: (path: string) => boolean;
}) {
  return (
    <div
      className="thin-scroll flex h-[35px] shrink-0 items-stretch overflow-x-auto border-b"
      style={{ background: "var(--vsc-chrome)", borderColor: "var(--vsc-border)" }}
    >
      {open.map((path) => {
        const isActive = path === active;
        const name = path.slice(path.lastIndexOf("/") + 1);
        const modified = dirty(path);
        return (
          <div
            key={path}
            className="group flex shrink-0 items-center gap-2 border-r px-3"
            style={{
              background: isActive ? "var(--vsc-editor)" : "transparent",
              borderColor: "var(--vsc-border)",
              borderTop: isActive ? "1px solid var(--vsc-accent)" : "1px solid transparent",
            }}
          >
            <button
              type="button"
              onClick={() => onSelect(path)}
              className="flex items-center gap-1.5 text-[12.5px]"
              style={{ color: isActive ? "var(--vsc-bright)" : "var(--vsc-muted)" }}
            >
              <FileGlyph name={name} />
              <span style={{ fontStyle: modified ? "italic" : "normal" }}>{name}</span>
            </button>
            <button type="button" onClick={() => onClose(path)} aria-label={`Close ${name}`}>
              {modified ? (
                <span
                  className="block size-2 rounded-full"
                  style={{ background: "var(--vsc-bright)" }}
                  title="Unsaved changes"
                />
              ) : (
                <X
                  className="size-3 opacity-0 transition-opacity group-hover:opacity-100"
                  style={{ color: "var(--vsc-muted)" }}
                />
              )}
            </button>
          </div>
        );
      })}
      <div className="ml-auto flex items-center px-2" style={{ color: "var(--vsc-muted)" }}>
        <Columns2 className="size-4" strokeWidth={1.5} />
      </div>
    </div>
  );
}

function Breadcrumb({
  file,
  dirty,
  onSave,
  onRevert,
}: {
  file: ProjectFile;
  dirty: boolean;
  onSave: () => void;
  onRevert: () => void;
}) {
  const parts = file.path.split("/");
  return (
    <div
      className="flex shrink-0 items-center gap-1 px-4 py-1 text-[11.5px]"
      style={{ background: "var(--vsc-editor)", color: "var(--vsc-dim)" }}
    >
      {parts.map((part, index) => (
        <span key={index} className="flex items-center gap-1">
          {index > 0 && <ChevronRight className="size-3" />}
          {part}
        </span>
      ))}
      <span className="ml-3 hidden truncate italic lg:inline">{file.note}</span>
      {dirty && (
        <span className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={onSave}
            className="flex items-center gap-1 rounded-[2px] px-1.5 py-0.5"
            style={{ background: "rgba(255,255,255,0.07)", color: "var(--vsc-text)" }}
          >
            <Save className="size-3" /> Save
          </button>
          <button type="button" onClick={onRevert} className="flex items-center gap-1">
            <RotateCcw className="size-3" /> Revert
          </button>
        </span>
      )}
    </div>
  );
}

function ProblemsPane({ problems, onOpen }: { problems: Problem[]; onOpen: (path: string) => void }) {
  if (problems.length === 0) {
    return (
      <p className="px-4 py-3 text-[12.5px]" style={{ color: "var(--vsc-dim)" }}>
        No problems have been detected in the workspace.
      </p>
    );
  }
  return (
    <div className="thin-scroll h-full overflow-auto py-1">
      {problems.map((problem, index) => (
        <button
          key={index}
          type="button"
          onClick={() => onOpen(problem.file)}
          className="flex w-full items-start gap-2 px-4 py-1.5 text-left"
        >
          {problem.severity === "error" ? (
            <CircleAlert className="mt-[2px] size-3.5 shrink-0" style={{ color: "var(--vsc-term-red)" }} />
          ) : (
            <TriangleAlert className="mt-[2px] size-3.5 shrink-0" style={{ color: "var(--vsc-term-yellow)" }} />
          )}
          <span className="text-[12.5px]" style={{ color: "var(--vsc-text)" }}>
            {problem.text}
            <span className="ml-2" style={{ color: "var(--vsc-dim)" }}>
              {problem.file}:{problem.line}
            </span>
          </span>
        </button>
      ))}
    </div>
  );
}

function OutputPane() {
  const { bootSteps, entries } = useStudio();
  return (
    <div className="thin-scroll h-full overflow-auto px-3 py-2 font-mono text-[11.5px] leading-[1.65]">
      <p style={{ color: "var(--vsc-dim)" }}>[cool] evidence plane</p>
      {bootSteps.map((step, index) => (
        <p key={index} style={{ color: step.ok ? "var(--vsc-term-green)" : "var(--vsc-term-red)" }}>
          {step.ok ? "✓" : "✗"} {step.label} — {step.detail}
        </p>
      ))}
      {entries.slice(0, 12).map((entry) => (
        <p key={entry.id} style={{ color: "var(--vsc-text)" }}>
          sealed {entry.id.slice(0, 12)} · {entry.kind} · {entry.label}
        </p>
      ))}
    </div>
  );
}

function StatusBar({
  file,
  cursor,
  errors,
  warnings,
  dirty,
  onPanel,
}: {
  file: ProjectFile;
  cursor: { line: number; column: number };
  errors: number;
  warnings: number;
  dirty: number;
  onPanel: (tab: PanelTab) => void;
}) {
  const { entries, handshake } = useStudio();
  return (
    <div
      className="flex h-[22px] shrink-0 items-center gap-3 px-2 text-[11.5px]"
      style={{ background: "var(--vsc-chrome)", color: "var(--vsc-muted)" }}
    >
      <span
        className="flex h-full items-center gap-1 px-2"
        style={{ background: "var(--vsc-accent)", color: "#fff" }}
        title="The evidence plane this workspace is wired to"
      >
        ⧉ evidence plane
      </span>
      <span className="flex items-center gap-1">
        <GitBranch className="size-3" /> main{dirty > 0 ? ` · ${dirty}*` : ""}
      </span>
      <button type="button" onClick={() => onPanel("problems")} className="flex items-center gap-2">
        <span className="flex items-center gap-1">
          <CircleAlert className="size-3" /> {errors}
        </span>
        <span className="flex items-center gap-1">
          <TriangleAlert className="size-3" /> {warnings}
        </span>
      </button>

      <span className="ml-auto hidden sm:inline">
        Ln {cursor.line}, Col {cursor.column}
      </span>
      <span className="hidden md:inline">Spaces: 2</span>
      <span className="hidden md:inline">UTF-8</span>
      <span className="hidden md:inline">LF</span>
      <span>{LANG_LABEL[file.lang]}</span>
      <span
        className="flex items-center gap-1"
        style={{ color: handshake?.ok ? "var(--vsc-term-green)" : "var(--vsc-term-red)" }}
        title="Records sealed in this session"
      >
        {handshake?.ok ? "✓" : "✕"} CooL: {entries.length} sealed
      </span>
      <Bell className="size-3" />
    </div>
  );
}
