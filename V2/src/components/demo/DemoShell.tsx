"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import clsx from "clsx";
import { motion } from "motion/react";
import { Play, GitBranch, Plug, Brain, Binary } from "lucide-react";
import LiveDemo from "./LiveDemo";

/**
 * The demo shell.
 *
 * Five views, in the order a sceptic actually asks questions:
 *
 *   Pipeline     — does the cryptography work? (run it and see)
 *   Timeline     — what does that look like across my systems?
 *   Integrations — what does it write into the tools I already run?
 *   Intelligence — does it tell me anything I didn't know?
 *   Internals    — show me the bytes.
 *
 * Only the pipeline is loaded eagerly; the rest are code-split, so opening the
 * page costs one view rather than five. Each heavy view also carries its own
 * loading state, because ML-DSA keygen is real work and a blank panel would
 * read as a broken tab.
 */

const TimelineView = dynamic(() => import("./TimelineView"), {
  loading: () => <ViewLoading label="Building the change timeline…" />,
});
const IntegrationsView = dynamic(() => import("./IntegrationsView"), {
  loading: () => <ViewLoading label="Loading connectors…" />,
});
const IntelligenceView = dynamic(() => import("./IntelligenceView"), {
  loading: () => <ViewLoading label="Scoring the estate…" />,
});
const InternalsView = dynamic(() => import("./InternalsView"), {
  loading: () => <ViewLoading label="Minting a receipt to dissect…" />,
});

function ViewLoading({ label }: { label: string }) {
  return (
    <div className="frost flex min-h-[280px] items-center justify-center rounded-2xl border border-line">
      <p className="flex items-center gap-2.5 font-mono text-[12px] text-mist">
        <span className="size-3 animate-spin rounded-full border-2 border-mist/30 border-t-mist" />
        {label}
      </p>
    </div>
  );
}

type TabId = "pipeline" | "timeline" | "integrations" | "intelligence" | "internals";

const TABS: {
  id: TabId;
  label: string;
  icon: typeof Play;
  blurb: string;
}[] = [
  {
    id: "pipeline",
    label: "Pipeline",
    icon: Play,
    blurb:
      "One AI change, sealed and verified live in this tab. Then try to forge it.",
  },
  {
    id: "timeline",
    label: "Timeline",
    icon: GitBranch,
    blurb:
      "The same change followed across commit, PR, CI, Jira, Confluence, Slack, evidence and audit.",
  },
  {
    id: "integrations",
    label: "Integrations",
    icon: Plug,
    blurb:
      "Every connector, what CooL reads from it, and exactly what it writes back for you.",
  },
  {
    id: "intelligence",
    label: "Intelligence",
    icon: Brain,
    blurb:
      "Which changes are about to cause an incident, why, and the indexed history of everything that already did.",
  },
  {
    id: "internals",
    label: "Internals",
    icon: Binary,
    blurb:
      "The bytes. Canonical encoding, the signing message, the Merkle leaf, and the real key sizes.",
  },
];

export default function DemoShell() {
  const [tab, setTab] = useState<TabId>("pipeline");
  const active = TABS.find((t) => t.id === tab)!;

  return (
    <div className="w-full">
      {/* tabs — horizontally scrollable on phone so nothing truncates */}
      <div className="no-scrollbar -mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0">
        <div
          role="tablist"
          aria-label="Demo views"
          className="flex w-max min-w-full gap-1.5 sm:w-auto"
        >
          {TABS.map((t) => {
            const Icon = t.icon;
            const on = t.id === tab;
            return (
              <button
                key={t.id}
                role="tab"
                aria-selected={on}
                type="button"
                onClick={() => setTab(t.id)}
                className={clsx(
                  "relative inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 font-mono text-[12px] whitespace-nowrap transition-colors",
                  on
                    ? "border-verify/55 text-ink"
                    : "border-line text-mist hover:border-verify/40 hover:text-ink",
                )}
              >
                {on ? (
                  <motion.span
                    layoutId="demo-tab"
                    className="absolute inset-0 rounded-full bg-verify/15"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                ) : null}
                <Icon className="relative z-10 size-3.5" />
                <span className="relative z-10">{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <p className="mt-3 text-[13.5px] leading-relaxed text-mist">
        {active.blurb}
      </p>

      <div className="mt-4">
        {tab === "pipeline" ? <LiveDemo /> : null}
        {tab === "timeline" ? <TimelineView /> : null}
        {tab === "integrations" ? <IntegrationsView /> : null}
        {tab === "intelligence" ? <IntelligenceView /> : null}
        {tab === "internals" ? <InternalsView /> : null}
      </div>
    </div>
  );
}
