/**
 * The demo scenario.
 *
 * One engineer, one prompt, one save. Everything downstream of that save is
 * produced by the SDK at runtime, so this file holds only the things a demo
 * legitimately has to invent: the repository the change lands in, the person
 * who made it, and the estate it lands beside.
 *
 * The split matters, and it is the first thing a technical reviewer will look
 * for. Nothing here is a result. There are no hashes, no signatures, no
 * verdicts, no timings — those cannot be written down in advance without the
 * demo becoming a re-enactment. What is written down is the input, which is
 * exactly what a customer would supply.
 *
 * Names are `*.example` on purpose (RFC 2606). A demo that borrows a real
 * bank's name is claiming a customer it does not have.
 */
import type { Lang } from "@/lib/studio/project";

/* ── the repository the engineer has open ─────────────────────────────── */

export const REPO = {
  name: "banking-agent",
  branch: "main",
  system: "fraud/investigator",
  environment: "prod",
  /** The image the evidence plane is pinned to — measured into MRTD at boot. */
  image: "sha256:9d945ef57b3a1c0e-cool-evidence-plane-2.4.0",
} as const;

export const ENGINEER = {
  id: "user:pranauv@bank.example",
  name: "Pranauv",
  method: "session",
  handle: "pranauv",
} as const;

/* ── the file that is open in the editor ──────────────────────────────── */

/**
 * The system prompt, before the edit.
 *
 * Written so the change is a single line in the middle of a file that plainly
 * matters. That is the honest shape of the problem: the edit is trivial, takes
 * four seconds, and moves the system from answering questions to making
 * accusations. Nothing about the diff announces that.
 */
export const PROMPT_BEFORE = `You are a banking assistant.

Answer customer questions about their accounts, transactions
and card status. Be concise and factual.

Rules:
- Never reveal full card numbers. Last four digits only.
- If a customer disputes a transaction, open a case and hand
  off to a human agent.
- Do not speculate about why a payment failed.
`;

/** The same file, after the edit. One line differs. */
export const PROMPT_AFTER = `You are a banking fraud investigator.

Answer customer questions about their accounts, transactions
and card status. Be concise and factual.

Rules:
- Never reveal full card numbers. Last four digits only.
- If a customer disputes a transaction, open a case and hand
  off to a human agent.
- Do not speculate about why a payment failed.
`;

/** Where the change is recorded. Everything downstream keys off this ref. */
export const CHANGE_REF = "fraud/investigator#system";

/** The path shown in the editor's tab, breadcrumb and status bar. */
export const PROMPT_PATH = "agents/fraud/system.prompt";

/**
 * The rest of the tree.
 *
 * Present so the editor reads as a repository rather than a text box, and so
 * the integration is visible: `cool.config.ts` is the whole of what the
 * engineer had to write, once, to get everything the demo then does.
 */
export interface TreeFile {
  readonly path: string;
  /** Reuses the studio's tokeniser, so the editor highlights for free. */
  readonly lang: Lang;
  readonly body: string;
  /** Only the prompt is editable — the rest is context, and says so. */
  readonly editable?: boolean;
}

export const CONFIG_FILE = `import { CoolTee, HttpDstackClient } from "cool-nwc";

/**
 * The evidence plane.
 *
 * There is no signing key here. There cannot be one: the key is derived inside
 * the enclave from its own measurement, which is why a change to the image
 * produces a different key and an old pin stops verifying.
 */
export const cool = await CoolTee.connect({
  app: { name: "banking-agent", imageDigest: process.env.IMAGE_DIGEST! },
  dstack: new HttpDstackClient({ endpoint: "/var/run/dstack.sock" }),
  expectedMeasurement: PINNED_MEASUREMENT,
  policy: DEFAULT_POLICY,
});
`;

export const HOOK_FILE = `import { cool } from "./cool.config";
import { readFileSync } from "node:fs";

/**
 * Post-commit hook. Six lines, installed once.
 *
 * This is the entire integration surface. Everything the console, the auditor
 * export and the verifier show downstream comes from this call — the engineer
 * who edits the prompt never sees it, and never has to.
 */
export async function onCommit(path: string, before: string) {
  await cool.change({
    kind: "prompt",
    ref: "fraud/investigator#system",
    environment: "prod",
    before,
    after: readFileSync(path, "utf8"),
    actor: { id: process.env.GIT_AUTHOR!, method: "session" },
  });
}
`;

export const TREE: readonly TreeFile[] = [
  { path: PROMPT_PATH, lang: "markdown", body: PROMPT_BEFORE, editable: true },
  { path: "cool.config.ts", lang: "ts", body: CONFIG_FILE },
  { path: "hooks/on-commit.ts", lang: "ts", body: HOOK_FILE },
];

/* ── the estate the change lands in ───────────────────────────────────── */

/**
 * Records sealed before the demo starts.
 *
 * These are seeds, not receipts: each one is pushed through the real evidence
 * plane at boot, so the rows the timeline shows are signed in the visitor's
 * browser like every other row. The only thing invented is what changed.
 */
export interface BackdropChange {
  readonly kind: "prompt" | "model" | "params" | "policy" | "dataset" | "agent-permission";
  readonly ref: string;
  readonly label: string;
  readonly environment: string;
  readonly before: string;
  readonly after: string;
  readonly actor: { id: string; method: string };
  readonly approvers: readonly string[];
  /** Minutes before the demo's "now", for ordering and display only. */
  readonly minutesAgo: number;
}

export const BACKDROP: readonly BackdropChange[] = [
  {
    kind: "model",
    ref: "fraud/investigator#scorer",
    label: "Model changed",
    environment: "prod",
    before: "phala/deepseek-v4-flash@2026.05",
    after: "phala/deepseek-v4-pro@2026.07",
    actor: { id: "user:marcus@bank.example", method: "session" },
    approvers: ["risk-committee@bank.example", "cro@bank.example"],
    minutesAgo: 6,
  },
  {
    kind: "params",
    ref: "kyc/document-review#inference",
    label: "Inference parameters changed",
    environment: "prod",
    before: '{"temperature":0.0,"top_p":1.0,"max_tokens":1024}',
    after: '{"temperature":0.4,"top_p":0.9,"max_tokens":2048}',
    actor: { id: "ci:github-actions", method: "oidc" },
    approvers: ["compliance@bank.example"],
    minutesAgo: 34,
  },
  {
    kind: "agent-permission",
    ref: "support/copilot#tools",
    label: "Agent permissions widened",
    environment: "prod",
    before: "read:tickets\nread:kb",
    after: "read:tickets\nread:kb\nwrite:tickets\nrefund:initiate",
    actor: { id: "user:dev-oncall@bank.example", method: "session" },
    approvers: [],
    minutesAgo: 78,
  },
  {
    kind: "policy",
    ref: "credit/underwriting#adverse-action",
    label: "Adverse-action policy changed",
    environment: "prod",
    before: "Explain declines using the top 2 contributing factors.",
    after:
      "Explain declines using the top 4 contributing factors.\nInclude the reference data window.\nNever cite protected attributes.",
    actor: { id: "user:compliance@bank.example", method: "session" },
    approvers: ["compliance@bank.example", "cro@bank.example"],
    minutesAgo: 145,
  },
];

/* ── the operational counters ─────────────────────────────────────────── */

/**
 * What the buyer sees first.
 *
 * Two of these four are counted, not claimed: `records` and `documents` are
 * read off the live log at render time, because the demo really does seal every
 * one of them. The other two are a projection — the manual minutes each record
 * type would have cost, multiplied out — and the UI says so rather than letting
 * a number that cannot be checked sit next to two that can.
 *
 * The minutes come from what the task actually is: writing a change note and
 * filing it (18), assembling an evidence bundle for one record (9), and
 * producing a control narrative for an auditor (35). They are estimates, they
 * are labelled as estimates, and they are the input to the arithmetic rather
 * than the output — anyone can substitute their own and redo it.
 */
export const MANUAL_MINUTES = {
  changeNote: 18,
  evidenceBundle: 9,
  controlNarrative: 35,
} as const;

/** How much of the month the demo estate stands in for. */
export const ESTATE_SCALE = {
  /** Records the estate seals in a month, of which the demo shows a handful. */
  monthlyRecords: 8_912,
  /** Change events inside that, each of which would have been written by hand. */
  monthlyChanges: 1_283,
  /** Documents the export produces without anyone assembling them. */
  monthlyDocuments: 614,
} as const;
