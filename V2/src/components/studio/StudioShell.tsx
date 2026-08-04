"use client";

/**
 * The studio shell: Slack's arrangement, Atlassian's palette, VS Code's IDE.
 *
 * Layout choices, in case they look arbitrary:
 *
 *   • A dark rail against a light workspace. It is the shape every operator tool
 *     converged on because it does one useful thing — the rail stops competing
 *     with the data. Navigation is chrome; evidence is content.
 *   • 3px corners, 13px text, dense rows. A console is scanned, not browsed.
 *   • The IDE is a view, not a second application. Someone evaluating CooL wants
 *     to see the code and the evidence it produces without changing tabs, so the
 *     editor sits behind the same rail and shares the same live SDK session.
 *
 * The shell owns almost no state: a view id, a search string, and the session
 * that every view reads from.
 */
import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  Code2,
  Cpu,
  LayoutDashboard,
  Package,
  Scale,
  ScrollText,
  Search,
  ShieldCheck,
} from "lucide-react";
import { StudioProvider, useStudio } from "./session";
import { Lozenge } from "./ui";
import OverviewView from "./views/OverviewView";
import LedgerView from "./views/LedgerView";
import AttestationView from "./views/AttestationView";
import ModelsView from "./views/ModelsView";
import GovernanceView from "./views/GovernanceView";
import VerifierView from "./views/VerifierView";
import InstallView from "./views/InstallView";
import IdeView from "./ide/IdeView";

type ViewId =
  | "overview"
  | "ledger"
  | "attestation"
  | "models"
  | "governance"
  | "verifier"
  | "ide"
  | "install";

const NAV: readonly {
  id: ViewId;
  label: string;
  icon: typeof LayoutDashboard;
  group: string;
}[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard, group: "Estate" },
  { id: "ledger", label: "Evidence ledger", icon: ScrollText, group: "Estate" },
  { id: "governance", label: "Governance", icon: Scale, group: "Estate" },
  { id: "attestation", label: "Attestation", icon: ShieldCheck, group: "Confidential compute" },
  { id: "models", label: "Models & GPU", icon: Cpu, group: "Confidential compute" },
  { id: "verifier", label: "Verifier", icon: BadgeCheck, group: "Confidential compute" },
  { id: "ide", label: "Studio IDE", icon: Code2, group: "Build" },
  { id: "install", label: "Install the SDK", icon: Package, group: "Build" },
];

export default function StudioShell() {
  return (
    <StudioProvider>
      <Shell />
    </StudioProvider>
  );
}

function Shell() {
  const [view, setView] = useState<ViewId>("overview");
  const [query, setQuery] = useState("");
  const session = useStudio();
  const ide = view === "ide";

  const go = (next: ViewId) => {
    setView(next);
    if (next !== "ledger") setQuery("");
  };

  return (
    <div
      data-app-shell
      data-skin="atlassian"
      className="fixed inset-0 flex flex-col overflow-hidden"
      style={{ background: "var(--atl-bg)", color: "var(--atl-text)" }}
    >
      <TopBar
        query={query}
        onQuery={(value) => {
          setQuery(value);
          if (value) setView("ledger");
        }}
      />

      <div className="flex min-h-0 flex-1">
        <Rail view={view} onView={go} />

        <main className="thin-scroll min-w-0 flex-1 overflow-y-auto" style={ide ? { overflow: "hidden" } : undefined}>
          {session.phase === "booting" && view !== "ide" ? (
            <BootPanel />
          ) : (
            <>
              {view === "overview" && <OverviewView onView={go} />}
              {view === "ledger" && <LedgerView query={query} onQuery={setQuery} />}
              {view === "attestation" && <AttestationView />}
              {view === "models" && <ModelsView />}
              {view === "governance" && <GovernanceView />}
              {view === "verifier" && <VerifierView />}
              {view === "install" && <InstallView onView={go} />}
              {view === "ide" && <IdeView />}
            </>
          )}
        </main>
      </div>

      <MobileTabs view={view} onView={go} />
    </div>
  );
}

/* ── top bar ──────────────────────────────────────────────────────────── */

function TopBar({ query, onQuery }: { query: string; onQuery: (value: string) => void }) {
  const { handshake, entries, phase } = useStudio();

  return (
    <header
      className="flex h-12 shrink-0 items-center gap-3 border-b px-3"
      style={{ background: "var(--atl-nav)", borderColor: "var(--atl-nav-line)" }}
    >
      <Link href="/" className="flex items-center gap-2 pr-1" title="Back to the CooL site">
        <ArrowLeft className="size-4" style={{ color: "var(--atl-nav-text)" }} />
        <span className="display text-[19px] leading-none text-white">CooL</span>
      </Link>

      <span className="h-5 w-px" style={{ background: "var(--atl-nav-line)" }} aria-hidden />

      <div className="flex items-center gap-2">
        <span className="text-[13px] font-semibold text-white">Studio</span>
        <span className="hidden text-[12px] sm:inline" style={{ color: "var(--atl-nav-text)" }}>
          Demo Enterprise Pvt. Ltd.
        </span>
      </div>

      <div className="mx-auto hidden w-full max-w-md items-center gap-2 rounded-[3px] px-2.5 py-1.5 md:flex"
        style={{ background: "rgba(255,255,255,0.08)" }}
      >
        <Search className="size-3.5" style={{ color: "var(--atl-nav-text)" }} />
        <input
          value={query}
          onChange={(event) => onQuery(event.target.value)}
          placeholder="Search the evidence ledger…"
          className="w-full bg-transparent text-[13px] text-white outline-none placeholder:text-[color:var(--atl-nav-text)]"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* Channel state, not silicon trivia. What an operator needs at a glance
            is whether evidence is flowing; the enclave's vendor, mode and
            measurement live on the Attestation page where they can be read
            properly. */}
        <span
          className="hidden items-center gap-2 rounded-[3px] px-2.5 py-1 text-[12px] font-medium lg:inline-flex"
          style={{
            background: "rgba(255,255,255,0.08)",
            color: handshake?.ok ? "#8fe3bd" : "#ff9c8f",
          }}
          title={
            handshake?.ok
              ? "RA-TLS handshake passed — the channel is open and events are being sealed"
              : "RA-TLS handshake failed — nothing is being transmitted"
          }
        >
          <span className="relative flex size-2">
            {handshake?.ok && (
              <span
                className="absolute inline-flex size-full animate-ping rounded-full"
                style={{ background: "rgba(126,226,184,0.55)" }}
              />
            )}
            <span
              className="relative inline-flex size-2 rounded-full"
              style={{ background: handshake?.ok ? "#4cc38a" : "#f27a70" }}
            />
          </span>
          Evidence plane
        </span>

        <span
          className="hidden rounded-[3px] px-2 py-1 font-mono text-[11px] xl:inline"
          style={{ background: "rgba(255,255,255,0.08)", color: "var(--atl-nav-text)" }}
          title="Records sealed in this session"
        >
          {phase === "booting" ? "sealing…" : `${entries.length} records`}
        </span>

        <span
          className="grid size-7 place-items-center rounded-full text-[11px] font-bold text-white"
          style={{ background: "var(--atl-nav-active)" }}
          title="Signed in as the demo operator"
        >
          KS
        </span>
      </div>
    </header>
  );
}

/* ── rail ─────────────────────────────────────────────────────────────── */

function Rail({ view, onView }: { view: ViewId; onView: (view: ViewId) => void }) {
  const { entries, stats } = useStudio();
  const groups = [...new Set(NAV.map((item) => item.group))];

  return (
    <nav
      className="hidden w-[228px] shrink-0 flex-col justify-between overflow-y-auto border-r py-3 md:flex"
      style={{ background: "var(--atl-nav-deep)", borderColor: "var(--atl-nav-line)" }}
      aria-label="Studio"
    >
      <div>
        {groups.map((group) => (
          <div key={group} className="mb-4">
            <p
              className="px-4 pb-1.5 text-[10.5px] font-bold tracking-[0.1em] uppercase"
              style={{ color: "rgba(182,194,207,0.55)" }}
            >
              {group}
            </p>
            {NAV.filter((item) => item.group === group).map((item) => {
              const Icon = item.icon;
              const active = item.id === view;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onView(item.id)}
                  className="flex w-full items-center gap-2.5 px-4 py-[7px] text-left text-[13.5px] transition-colors"
                  style={{
                    background: active ? "var(--atl-nav-active)" : "transparent",
                    color: active ? "#fff" : "var(--atl-nav-text)",
                    fontWeight: active ? 600 : 400,
                  }}
                  onMouseEnter={(event) => {
                    if (!active) event.currentTarget.style.background = "var(--atl-nav-hover)";
                  }}
                  onMouseLeave={(event) => {
                    if (!active) event.currentTarget.style.background = "transparent";
                  }}
                >
                  <Icon className="size-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                  {item.id === "ledger" && entries.length > 0 && (
                    <span
                      className="ml-auto rounded-[3px] px-1.5 py-[1px] text-[11px] font-semibold tabular-nums"
                      style={{
                        background: active ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.1)",
                        color: "#fff",
                      }}
                    >
                      {entries.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* The number a platform team asks about first, kept permanently in view. */}
      <div
        className="mx-3 rounded-[3px] p-3"
        style={{ background: "rgba(255,255,255,0.05)", color: "var(--atl-nav-text)" }}
      >
        <p className="text-[10.5px] font-bold tracking-[0.09em] uppercase">Capture overhead</p>
        <p className="mt-1 font-mono text-[17px] leading-none text-white">
          {stats ? `${stats.p99Ms.toFixed(3)} ms` : "—"}
        </p>
        <p className="mt-1.5 text-[11px] leading-snug">
          p99, measured on this machine, off the request path. {stats?.dropped ?? 0} dropped ·{" "}
          {stats?.sent ?? 0} sealed.
        </p>
      </div>
    </nav>
  );
}

function MobileTabs({ view, onView }: { view: ViewId; onView: (view: ViewId) => void }) {
  return (
    <nav
      className="thin-scroll flex shrink-0 gap-1 overflow-x-auto border-t px-2 py-1.5 md:hidden"
      style={{ background: "var(--atl-nav-deep)", borderColor: "var(--atl-nav-line)" }}
      aria-label="Studio (compact)"
    >
      {NAV.map((item) => {
        const Icon = item.icon;
        const active = item.id === view;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onView(item.id)}
            className="flex shrink-0 items-center gap-1.5 rounded-[3px] px-2.5 py-1.5 text-[12px]"
            style={{
              background: active ? "var(--atl-nav-active)" : "transparent",
              color: active ? "#fff" : "var(--atl-nav-text)",
            }}
          >
            <Icon className="size-3.5" />
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}

/* ── boot ─────────────────────────────────────────────────────────────── */

/**
 * What the console shows while the enclave comes up.
 *
 * It is a terminal rather than a spinner because the boot is the argument: keys
 * derived from a measurement, a quote taken over those keys, a handshake that
 * checks both. Hiding that behind a progress bar would waste the most persuasive
 * three seconds on the page.
 */
function BootPanel() {
  const { bootSteps, progress, entries } = useStudio();
  return (
    <div className="mx-auto flex min-h-full max-w-2xl flex-col justify-center px-5 py-10">
      <p className="text-[11px] font-bold tracking-[0.1em] uppercase" style={{ color: "var(--atl-muted)" }}>
        Starting the evidence plane
      </p>
      <h1 className="mt-2 text-[22px] font-semibold" style={{ color: "var(--atl-text)" }}>
        Booting a confidential VM, sealing keys to it, then replaying the estate.
      </h1>
      <p className="mt-2 text-[13.5px] leading-relaxed" style={{ color: "var(--atl-subtle)" }}>
        Every record you are about to see is being signed in this browser by the
        production evidence engine, against a simulated Intel TDX enclave. Nothing
        is fetched; nothing is pre-baked.
      </p>

      <div
        className="mt-6 rounded-[3px] border p-4 font-mono text-[12.5px] leading-[1.7]"
        style={{
          background: "var(--atl-nav-deep)",
          borderColor: "var(--atl-nav-line)",
          color: "#c7d1dc",
        }}
      >
        {bootSteps.map((step, index) => (
          <p key={index}>
            <span style={{ color: step.ok ? "#7ee2b8" : "#ff9c8f" }}>{step.ok ? "✓" : "✕"}</span>{" "}
            <span style={{ color: "#8fb8f6" }}>{step.label}</span> {step.detail}
          </p>
        ))}
        <p style={{ color: "#8993a4" }}>
          <span className="studio-caret">▍</span> sealing records… {entries.length}
        </p>
      </div>

      <div className="mt-4">
        <div className="h-1 w-full overflow-hidden rounded-[2px]" style={{ background: "var(--atl-sunken)" }}>
          <div
            className="h-full transition-[width] duration-300"
            style={{ width: `${Math.round(progress * 100)}%`, background: "var(--atl-blue)" }}
          />
        </div>
      </div>

      <div className="mt-4">
        <Lozenge tone="teal" glyph>
          simulated enclave — labelled in every receipt
        </Lozenge>
      </div>
    </div>
  );
}
