"use client";

import { Slide } from "@/components/Slide";
import { Reveal, Mark } from "@/components/ui";
import Terminal, { type TermLine } from "@/components/Terminal";

/**
 * Slide 3 — the solution, as the same afternoon with the work removed.
 *
 * This slide is deliberately the mirror of slide 2. Same repository, same
 * branch, the same commit message, the same six chores — except here they tick
 * themselves off in the output stream. The reader does not have to be told what
 * changed; they can see that the only thing missing is their afternoon.
 *
 * Nothing is asked of the developer's workflow. That is the argument: there is
 * no new place to go, no new habit, no dashboard to remember to update. They
 * push, as they already do, and the paperwork stops existing.
 */

const INSTALL: readonly TermLine[] = [
  { kind: "cmd", text: "npm i @northwind/cool-sdk" },
  { kind: "out", text: "added 6 packages in 3.1s", tone: "dim" },
  { kind: "gap" },
  { kind: "cmd", text: "npx cool init" },
  { kind: "out", text: "scanning repository…", tone: "dim" },
  { kind: "out", text: "  ✔ ci            GitHub Actions", tone: "ok" },
  { kind: "out", text: "  ✔ providers     OpenAI, Anthropic  (via LiteLLM gateway)", tone: "ok" },
  { kind: "out", text: "  ✔ frameworks    LangChain, LlamaIndex", tone: "ok" },
  { kind: "out", text: "  ✔ trackers      Jira Cloud, Confluence, Slack", tone: "ok" },
  { kind: "gap" },
  { kind: "out", text: "  wrote  .github/workflows/cool.yml", tone: "accent" },
  { kind: "out", text: "  wrote  cool.config.ts", tone: "accent" },
  { kind: "gap" },
  { kind: "out", text: "→ one file to review. that is the whole install.", tone: "warn" },
];

const PUSH: readonly TermLine[] = [
  { kind: "out", text: "~/acme/ai-platform on  feat/adverse-action-reasons", tone: "dim" },
  { kind: "cmd", text: 'git commit -am "add reason codes to adverse-action prompt"' },
  { kind: "cmd", text: "git push" },
  { kind: "out", text: "   9c1e40b..4f2a1c9  feat/adverse-action-reasons -> feat/adverse-action-reasons", tone: "dim" },
  { kind: "gap" },
  { kind: "out", text: "[cool] change captured    prompt · retail-lending/adverse-action", tone: "accent" },
  { kind: "out", text: "[cool] policy matched     regulated-credit-decision", tone: "accent" },
  { kind: "gap" },
  { kind: "out", text: "[cool] ✔ confluence       AI-CHG-2841 written", tone: "ok" },
  { kind: "out", text: "[cool] ✔ jira             LEND-2841 created, commit linked", tone: "ok" },
  { kind: "out", text: "[cool] ✔ approvals        requested — security, compliance", tone: "ok" },
  { kind: "out", text: "[cool] ✔ servicenow       register updated, retention 7y", tone: "ok" },
  { kind: "out", text: "[cool] ✔ slack            #ai-governance notified", tone: "ok" },
  { kind: "out", text: "[cool] ✔ evidence sealed  mh:sha256:9f2ac41b8e…", tone: "ok" },
  { kind: "gap" },
  { kind: "out", text: "[cool] done in 412ms · 0 manual steps · +0ms to inference", tone: "warn" },
];

const CONFIG = `// cool.config.ts
export default {
  capture:    ["github-actions", "sdk", "gateway"],
  connectors: ["jira", "confluence", "slack", "servicenow"],
  policies:   "./policies",          // plain Rego, versioned like any code
  evidence:   { retention: "7y", sign: "hybrid-pqc" },
};`;

const GAINS: [string, string][] = [
  ["Under an hour", "from npm install to your first sealed change"],
  ["Zero new habits", "you push exactly the way you already do"],
  ["Up to 90%", "lower compliance cost per AI change"],
];

const FITS = [
  "GitHub Actions",
  "GitLab CI",
  "Jenkins",
  "OpenAI",
  "Anthropic",
  "Bedrock",
  "Vertex",
  "LiteLLM",
  "Portkey",
  "LangChain",
  "LlamaIndex",
  "OpenTelemetry",
];

export default function S03Solution() {
  return (
    <Slide
      id="solution"
      no="03"
      kicker="The solution"
      title="You don't change how you work. You just stop doing the paperwork."
      sub={
        <>
          Same repo. Same commit. Same push. CooL does the six things that used
          to be your afternoon — <Mark tone="live">before the push finishes</Mark>
          .
        </>
      }
      wide
    >
      {/* 1 · it installs in a minute */}
      <Reveal>
        <p className="font-mono text-[11px] tracking-[0.16em] text-verify uppercase">
          Monday, 09:00 — install it once
        </p>
        <p className="mt-1.5 mb-2.5 text-[14px] leading-relaxed text-fog">
          It reads your repository and wires itself into what is already there.
          No migration, no new platform, no rewrite.
        </p>
        <Terminal lines={INSTALL} title="acme/ai-platform — zsh" />
      </Reveal>

      {/* 2 · the same push from the last slide */}
      <Reveal delay={0.1}>
        <p className="mt-6 font-mono text-[11px] tracking-[0.16em] text-verify uppercase">
          Monday, 09:14 — the exact same commit as the last slide
        </p>
        <p className="mt-1.5 mb-2.5 text-[14px] leading-relaxed text-fog">
          Watch the six chores from a moment ago tick themselves off.
        </p>
        <Terminal lines={PUSH} title="acme/ai-platform — zsh" outMs={130} />
      </Reveal>

      {/* 3 · and it is configured like code */}
      <Reveal delay={0.16}>
        <div className="mt-4 grid gap-3 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="overflow-hidden rounded-xl border border-line bg-[#0a0d12]">
            <div className="border-b border-line bg-panel/60 px-3 py-2">
              <span className="font-mono text-[10.5px] text-mist">cool.config.ts</span>
            </div>
            <pre className="overflow-x-auto px-3.5 py-3 font-mono text-[11.5px] leading-[1.7] text-fog">
              <code>{CONFIG}</code>
            </pre>
          </div>

          <div className="frost rounded-xl border border-line p-4">
            <p className="font-mono text-[11px] tracking-[0.16em] text-verify uppercase">
              Hooks into what you already run
            </p>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {FITS.map((f) => (
                <span
                  key={f}
                  className="rounded-full border border-line bg-panel/60 px-2.5 py-1 font-mono text-[10.5px] text-fog"
                >
                  {f}
                </span>
              ))}
            </div>
            <p className="mt-3 text-[13px] leading-relaxed text-mist">
              Five choke points — SDK, CI, gateway, telemetry, webhooks — instead
              of an integration per framework. That is why the install is an hour
              and not a quarter.
            </p>
          </div>
        </div>
      </Reveal>

      {/* 4 · what it bought */}
      <Reveal delay={0.22}>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {GAINS.map(([big, small]) => (
            <div key={big} className="frost rounded-2xl border border-live/30 px-4 py-4">
              <p className="display text-[clamp(1.4rem,4.4vw,1.9rem)] leading-none text-live">
                {big}
              </p>
              <p className="mt-2 text-[13.5px] leading-relaxed text-fog">{small}</p>
            </div>
          ))}
        </div>
      </Reveal>

      <Reveal delay={0.28}>
        <p className="mt-4 rounded-xl border border-verify/30 bg-verify/[0.07] px-4 py-3.5 text-[14.5px] leading-relaxed text-fog">
          Audits stop being fire drills, because the evidence was sealed the
          moment the change shipped — and it holds up{" "}
          <span className="font-semibold text-ink">
            across every AI provider you use
          </span>
          , not just the one you started with.
        </p>
      </Reveal>
    </Slide>
  );
}
