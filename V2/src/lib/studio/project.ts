/**
 * The workspace the IDE opens.
 *
 * These are not screenshots or prose about an integration — they are the files
 * a team would actually commit to make one work, and every SDK call in them
 * matches the API in `src/lib/cool/phala`. That constraint is the point: the
 * editor pane is documentation that cannot silently drift from the library,
 * because the same repository holds both and the same person edits both.
 *
 * A visitor can read the whole integration here in about four minutes — the app
 * code, the container, the dstack manifest, the CI hook, the policy, and the
 * verifier an auditor runs. That is the entire surface area of adopting CooL on
 * Phala, and it fits on one screen at a time.
 */

export type Lang = "ts" | "js" | "json" | "yaml" | "docker" | "shell" | "markdown" | "rego" | "env";

export interface ProjectFile {
  readonly path: string;
  readonly lang: Lang;
  /** One line shown in the IDE's breadcrumb — what this file is FOR. */
  readonly note: string;
  readonly content: string;
}

export const PROJECT_NAME = "refund-agent";

export const PROJECT: readonly ProjectFile[] = [
  {
    path: "playground.js",
    lang: "js",
    note: "The executable file — edit it, press Run, and it really executes against the live SDK",
    content: `/**
 * playground.js — this file RUNS.
 *
 * Everything else in this workspace is the integration as it would be committed;
 * this one is a scratchpad wired to the evidence plane the console is using. Press
 * Run (or type \`node playground.js\`) and the code below executes in your browser,
 * against a real enclave-sealed signing key. Records you seal here appear in the
 * ledger a click away.
 *
 * In scope:
 *   cool  — the live CoolTee client (complete, completeSealed, change, stats…)
 *   sdk   — the whole SDK module (verifyReceiptV2, simulatedGpu, quoteDigest…)
 *   log   — print to the terminal below
 */

// 1 · Seal a change. Signed inside the enclave with a measurement-sealed key.
const receipt = await cool.change({
  kind: "prompt",
  ref: "billing/refund-agent#system",
  environment: "prod",
  before: "Approve refunds up to $500 without escalation.",
  after: "Approve refunds up to $500 without escalation.\\nEscalate disputed transactions.",
  actor: { id: "user:you@studio", method: "session" },
  approval: { policy_id: "POL-014", decision: "approved", approvers: ["priya@bank.example"] },
});

log("sealed  " + receipt.record.record_id);
log("binding " + receipt.binding_hash);
log("key     " + receipt.record.signature.key_id + "  (derived from the measurement)");

// 2 · Verify it — the same function an auditor runs, offline.
const verdict = await sdk.verifyReceiptV2(receipt);
log("");
log("verdict.ok = " + verdict.ok);
for (const [domain, check] of Object.entries(verdict.checks)) {
  log("  " + domain.padEnd(12) + check.status.padEnd(11) + check.detail);
}

// 3 · Now attack it. One character of one hash.
const forged = structuredClone(receipt);
forged.record.change.after_hash = forged.record.change.after_hash.replace(/.$/, (c) =>
  c === "0" ? "1" : "0",
);
const broken = await sdk.verifyReceiptV2(forged);

log("");
log("after editing one character:");
log("  ok        " + broken.ok);
log("  binding   " + broken.checks.binding.status);
log("  signature " + broken.checks.signature.status);

// Anything you return is printed as JSON.
return { sealed: receipt.record.record_id, verified: verdict.ok, tamperedAccepted: broken.ok };
`,
  },
  {
    path: "src/cool.ts",
    lang: "ts",
    note: "Boots the evidence plane inside the TEE — the only CooL wiring in the app",
    content: `import {
  CoolTee,
  HttpDstackClient,
  SimulatedDstackClient,
  remoteQuoteVerifier,
} from "cool-nwc";
import { PINNED_MEASUREMENT } from "./measurement";

/**
 * One client for the whole service.
 *
 * In production this talks to the dstack guest agent over the CVM's local
 * socket. On a laptop or in CI the simulator stands in — same code path, same
 * receipts, and every one of them says "simulated" in its own attestation
 * block, so a demo can never be mistaken for a deployment.
 */
export const cool = await CoolTee.connect({
  dstack: process.env.DSTACK_ENDPOINT
    ? new HttpDstackClient({
        endpoint: process.env.DSTACK_ENDPOINT,
        vendor: "intel-tdx",
      })
    : new SimulatedDstackClient({
        appName: "refund-agent",
        imageDigest: process.env.IMAGE_DIGEST ?? "sha256:dev",
      }),

  // The image this deployment approved. Without a pin, a quote only proves
  // "some TEE" — with one, it proves "the code we reviewed".
  expectedMeasurement: PINNED_MEASUREMENT,

  policy: {
    expectedMeasurement: PINNED_MEASUREMENT,
    allowSimulated: process.env.NODE_ENV !== "production",
    requireVendor: ["intel-tdx"],
    verifier: remoteQuoteVerifier({
      endpoint: process.env.QUOTE_VERIFIER_URL!,
      root: "intel-dcap",
    }),
  },

  // Capture is out-of-band. These numbers bound memory, not latency.
  capture: { flushMs: 200, batchSize: 32, maxQueue: 2048 },

  onDrop: (event, reason) => metrics.increment("cool.dropped", { reason, kind: event.kind }),
});

// Fails loudly at boot rather than quietly at audit time.
if (!cool.handshake.ok) {
  logger.error({ steps: cool.handshake.steps }, "CooL: RA-TLS handshake failed");
}
`,
  },
  {
    path: "src/agent.ts",
    lang: "ts",
    note: "The application. Three CooL calls; none of them on the latency path",
    content: `import { cool } from "./cool";
import { PhalaPrivateLLM, simulatedGpu } from "cool-nwc";
import { systemPrompt } from "./prompts";

const llm = new PhalaPrivateLLM({
  baseUrl: process.env.PHALA_LLM_URL!,   // OpenAI-compatible, confidential
  apiKey: process.env.PHALA_API_KEY!,
  gpuModel: "H200",
});

/**
 * Handle one refund request.
 *
 * The CooL call is \`cool.complete\` — it runs the model, returns the moment the
 * model does, and hands the evidence to a background queue. If the evidence
 * plane is unreachable the customer still gets their answer; the loss shows up
 * in \`cool.stats()\`, never in this function's latency.
 */
export async function handleRefund(request: RefundRequest): Promise<RefundDecision> {
  const { output } = await cool.complete({
    model: "phala/deepseek-v4-pro@2026.07",
    prompt: systemPrompt(request),
    params: { temperature: 0.2, top_p: 0.9, seed: request.id },
  });

  return parseDecision(output);
}

/**
 * Ship a new system prompt.
 *
 * This is the half of CooL that is not about inference. The edit is sealed with
 * the same key, into the same transparency log, with the approval attached — so
 * "who changed the refund ceiling, when, and who signed off" is answered by
 * opening a record instead of by asking three people.
 */
export async function deployPrompt(next: string, previous: string) {
  return cool.change({
    kind: "prompt",
    ref: "billing/refund-agent#system",
    environment: "prod",
    before: previous,
    after: next,
    actor: { id: "ci:github-actions", method: "oidc" },
    approval: {
      policy_id: "POL-014",
      decision: "approved",
      approvers: ["priya@bank.example", "marcus@bank.example"],
    },
  });
}

/** Drain before the process exits, so nothing in flight is lost on a deploy. */
process.on("SIGTERM", () => void cool.close());
`,
  },
  {
    path: "src/measurement.ts",
    lang: "ts",
    note: "The pinned image. Changing this file is the only way to approve new code",
    content: `import type { Measurement } from "cool-nwc";

/**
 * The measurement of the image this service is allowed to send evidence to.
 *
 * Produced by \`phala cvms measurement <cvm-id>\` after a review, and committed
 * here so the pin lives in version control alongside the code it pins. A
 * redeploy that changes a single byte of the image changes MRTD and RTMR3, the
 * RA-TLS handshake fails closed, and this file has to be updated by a human who
 * looked at the diff. That friction is the control.
 */
export const PINNED_MEASUREMENT: Measurement = {
  mrtd: "hex:9d945ef57b3a1c0e8f27d4b6a5138e2c7f409bd63ae81205cf7d4e9b1a63f0c82d1e5478a9b0c3f62",
  rtmr0: "hex:c3f62d1e5478a9b0940e7215a63f0c82d1e5478a9b0c3f62d1e5478a9b0c3f629d945ef57b3a1c0e",
  rtmr1: "hex:7b3a1c0e8f27d4b6a5138e2c7f409bd63ae81205cf7d4e9b1a63f0c82d1e5478a9b0c3f629d945ef5",
  rtmr2: "hex:a5138e2c7f409bd63ae81205cf7d4e9b1a63f0c82d1e5478a9b0c3f629d945ef57b3a1c0e8f27d4b6",
  rtmr3: "hex:1a63f0c82d1e5478a9b0c3f629d945ef57b3a1c0e8f27d4b6a5138e2c7f409bd63ae81205cf7d4e9b",
};
`,
  },
  {
    path: "dstack/app-compose.json",
    lang: "json",
    note: "The dstack manifest — what gets measured into RTMR3",
    content: `{
  "manifest_version": 2,
  "name": "cool-evidence-plane",
  "runner": "docker-compose",
  "docker_compose_file": "./docker-compose.yml",

  "kms_enabled": true,
  "gateway_enabled": true,
  "local_key_provider_enabled": false,

  "public_logs": true,
  "public_sysinfo": true,

  "key_provider": "kms",
  "allowed_envs": ["POSTGRES_URL", "LOG_BACKEND", "QUOTE_VERIFIER_URL"],

  "pre_launch_script": "#!/bin/sh\\nset -e\\necho 'cool: evidence plane starting'\\n"
}
`,
  },
  {
    path: "docker-compose.yml",
    lang: "yaml",
    note: "The evidence plane as ordinary containers — dstack needs nothing more",
    content: `# Deployed with:  phala deploy -c docker-compose.yml -n cool-evidence-plane
#
# Nothing in this file is TEE-specific. That is the whole argument for dstack:
# the evidence engine is a normal container, and confidentiality is a property
# of where it runs rather than a rewrite of how it is built.

services:
  evidence-engine:
    image: ghcr.io/northwindcipher/cool-evidence-engine:2.1.0
    restart: always
    environment:
      - DSTACK_ENDPOINT=/var/run/dstack.sock
      - POSTGRES_URL=\${POSTGRES_URL}
      - LOG_BACKEND=\${LOG_BACKEND}
    volumes:
      # The guest agent: TCB info, quotes, and measurement-bound key derivation.
      - /var/run/dstack.sock:/var/run/dstack.sock
    ports:
      - "8443:8443"   # RA-TLS ingest, fronted by dstack-gateway

  transparency-log:
    image: ghcr.io/northwindcipher/cool-log:2.1.0
    restart: always
    environment:
      - POSTGRES_URL=\${POSTGRES_URL}
    depends_on:
      - evidence-engine

  postgres:
    image: postgres:17-alpine
    restart: always
    environment:
      - POSTGRES_PASSWORD=\${POSTGRES_PASSWORD}
    volumes:
      - evidence-data:/var/lib/postgresql/data

volumes:
  evidence-data:
`,
  },
  {
    path: "Dockerfile",
    lang: "docker",
    note: "Reproducible build — a byte-identical image is what makes a pin meaningful",
    content: `# A pinned digest, not a tag. The measurement is only as trustworthy as the
# build that produced it, so every layer below is content-addressed.
FROM rust:1.86-alpine@sha256:2f5a8b1c AS build
WORKDIR /src
COPY Cargo.toml Cargo.lock ./
COPY crates ./crates
RUN --mount=type=cache,target=/usr/local/cargo/registry \\
    cargo build --release --locked --bin cool-evidence-engine

FROM alpine:3.21@sha256:56fa17d2
RUN adduser -D -u 10001 cool
COPY --from=build /src/target/release/cool-evidence-engine /usr/local/bin/
USER cool
EXPOSE 8443
HEALTHCHECK --interval=10s CMD ["cool-evidence-engine", "--health"]
ENTRYPOINT ["cool-evidence-engine"]
`,
  },
  {
    path: ".github/workflows/cool-evidence.yml",
    lang: "yaml",
    note: "CI capture — the prompt edit is sealed before it reaches production",
    content: `name: cool-evidence

# Every change to a prompt, a model pin or an agent permission produces a
# sealed record BEFORE it is deployed. Nobody writes a changelog entry; the
# changelog is a by-product of merging.

on:
  push:
    paths:
      - "src/prompts/**"
      - "src/models.json"
      - "policy/**"

jobs:
  seal:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write        # OIDC — the actor recorded in the change record
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 2 }

      - uses: northwindcipher/cool-capture-action@v2
        with:
          endpoint: \${{ secrets.COOL_ENDPOINT }}
          # Refuse to send unless the endpoint attests to this exact image.
          expected-measurement: \${{ vars.COOL_MEASUREMENT }}
          environment: prod

      # The receipt is an artefact of the build, like a test report.
      - uses: actions/upload-artifact@v4
        with:
          name: cool-receipts
          path: .cool/receipts/*.json
`,
  },
  {
    path: "policy/change.rego",
    lang: "rego",
    note: "The governance rule — evaluated inside the enclave, attached to the record",
    content: `package cool.change

# Policy runs where the evidence is sealed, so its decision is inside the
# signature rather than beside it. An approval that can be edited after the
# fact is not an approval.

default decision := "rejected"

# Routine edits in non-production need no human.
decision := "auto-approved" if {
	input.change.environment != "prod"
	input.change.kind in {"prompt", "params"}
}

# Production prompt changes need two approvers from the owning team.
decision := "approved" if {
	input.change.environment == "prod"
	input.change.kind == "prompt"
	count(input.approvers) >= 2
	every approver in input.approvers {
		approver in data.teams[input.change.owner].members
	}
}

# Loosening what an agent may do is never automatic, in any environment.
decision := "rejected" if {
	input.change.kind == "agent-permission"
	input.change.direction == "widen"
	count(input.approvers) < 2
}

# EU AI Act Article 12 — high-risk systems keep automatic records of their
# operation. The mapping is declared here so the audit export can prove it.
obligations contains "eu-ai-act-art-12" if {
	data.systems[input.change.ref].risk_tier == "high"
}
`,
  },
  {
    path: "scripts/verify.ts",
    lang: "ts",
    note: "What an auditor runs. No CooL, no Phala, no network — just the bytes",
    content: `#!/usr/bin/env tsx
import { readFile } from "node:fs/promises";
import { verifyReceiptV2, remoteQuoteVerifier } from "cool-nwc";
import { PINNED_MEASUREMENT } from "../src/measurement";

/**
 * The offline verifier.
 *
 * This is the part of CooL that makes the rest of it worth anything: the person
 * checking the evidence does not have to trust the people who produced it. Give
 * it a receipt and it recomputes everything — the commitment, both signatures,
 * the Merkle path, and the binding between the quote and the signing key.
 *
 * The only network call in the file is the vendor quote check, and it is
 * optional: without it the attestation domain reports "present, not verified"
 * instead of quietly passing.
 */
const receipt = JSON.parse(await readFile(process.argv[2]!, "utf8"));

const verdict = await verifyReceiptV2(receipt, {
  expectedMeasurement: PINNED_MEASUREMENT,
  requireHardware: true,
  quoteVerifier: remoteQuoteVerifier({
    endpoint: "https://api.phala.network/attest/verify",
    root: "intel-dcap",
  }),
});

for (const [domain, check] of Object.entries(verdict.checks)) {
  const mark = { pass: "✓", fail: "✗", simulated: "◐", absent: "·", mock: "·" }[check.status];
  console.log(\`\${mark} \${domain.padEnd(12)} \${check.detail}\`);
}

process.exit(verdict.ok ? 0 : 1);
`,
  },
  {
    path: ".env.example",
    lang: "env",
    note: "Nothing secret in here — the signing key is derived, never configured",
    content: `# The dstack guest agent inside the CVM. Unset it and the SDK uses the
# simulator, which labels every receipt it produces.
DSTACK_ENDPOINT=/var/run/dstack.sock

# Phala's confidential, OpenAI-compatible inference endpoint.
PHALA_LLM_URL=https://api.phala.network/v1
PHALA_API_KEY=

# Where a quote gets chained to Intel's root. Optional; its absence downgrades
# the attestation domain to "reported, not verified" rather than to a pass.
QUOTE_VERIFIER_URL=https://api.phala.network/attest/verify

# Customer-owned storage. Evidence never leaves this environment.
POSTGRES_URL=postgres://cool@localhost:5432/evidence
LOG_BACKEND=trillian://localhost:8090

# NOTE: there is no COOL_SIGNING_KEY. There cannot be one — the signing key is
# derived inside the enclave from the measurement, which is exactly why CooL
# cannot forge your records.
`,
  },
  {
    path: "README.md",
    lang: "markdown",
    note: "Start here",
    content: `# refund-agent

A production AI service with CooL's evidence plane running inside a Phala TEE.

## What is proven

| Question | Answered by |
| --- | --- |
| What did the model see and produce? | salted commitments in the record |
| Which model served it? | weights hash + NVIDIA CC attestation |
| Where did the record come from? | MRTD/RTMR measurement inside the signature |
| Who signed it? | key sealed to that measurement by dstack-KMS |
| Was anything removed later? | RFC 6962 inclusion proof under a signed tree head |
| Do I have to trust CooL? | no — \`scripts/verify.ts\` checks all of it offline |

## Run it

\`\`\`sh
npm install
npm run dev                 # simulator — receipts are labelled "simulated"

phala deploy -c docker-compose.yml -n cool-evidence-plane
phala cvms attestation <cvm-id>
npx tsx scripts/verify.ts .cool/receipts/latest.json
\`\`\`

## What CooL costs you

The capture call is an array push behind an async queue: **p99 under 0.05 ms**,
measured, on the caller's thread. If the evidence plane is unreachable the queue
drops events and counts them — it never blocks a customer request, and it never
sends to an endpoint that has not attested. Fail-open toward your application,
fail-closed toward the network.
`,
  },
];

/* ── tree ─────────────────────────────────────────────────────────────── */

export interface TreeNode {
  readonly name: string;
  readonly path: string;
  readonly kind: "dir" | "file";
  readonly children?: TreeNode[];
}

/**
 * Build the explorer tree. Directories sort before files, both alphabetically —
 * the ordering every file explorer uses, and the one a reader's eye expects.
 */
export function buildTree(files: readonly ProjectFile[] = PROJECT): TreeNode[] {
  const root: TreeNode[] = [];

  for (const file of files) {
    const parts = file.path.split("/");
    let level = root;
    parts.forEach((name, index) => {
      const isFile = index === parts.length - 1;
      const path = parts.slice(0, index + 1).join("/");
      let node = level.find((n) => n.name === name);
      if (!node) {
        node = isFile
          ? { name, path, kind: "file" }
          : { name, path, kind: "dir", children: [] };
        level.push(node);
      }
      if (!isFile) level = node.children!;
    });
  }

  const sort = (nodes: TreeNode[]): TreeNode[] => {
    nodes.sort((a, b) =>
      a.kind === b.kind ? a.name.localeCompare(b.name) : a.kind === "dir" ? -1 : 1,
    );
    for (const node of nodes) if (node.children) sort(node.children);
    return nodes;
  };

  return sort(root);
}

/** Look up a file by path. */
export function fileAt(path: string): ProjectFile | undefined {
  return PROJECT.find((f) => f.path === path);
}

/** Language label shown in the IDE status bar. */
export const LANG_LABEL: Record<Lang, string> = {
  ts: "TypeScript",
  js: "JavaScript",
  json: "JSON",
  yaml: "YAML",
  docker: "Dockerfile",
  shell: "Shell Script",
  markdown: "Markdown",
  rego: "Rego",
  env: "Properties",
};
