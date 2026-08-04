"use client";

/**
 * Install — the page a developer lands on after they are convinced.
 *
 * Three code blocks and a CLI section. The API in every snippet is the one this
 * console is running on, so anything a reader copies out of here behaves the way
 * the page behind it just did.
 */
import { Code2, Terminal } from "lucide-react";
import { CodeBlock } from "../CodeBlock";
import { Btn, Card, CardHead, Lozenge } from "../ui";

const INSTALL = `# Published from this domain — works today, no registry account needed.
npm install https://northwindcipher.com/sdk/cool-nwc-2.0.2.tgz

# Browser or Deno, no bundler:
#   import { CoolTee } from "https://northwindcipher.com/sdk/cool-nwc.js";

# Checksums: https://northwindcipher.com/sdk/checksums.txt

# Install it globally and the cool command works in any directory:
npm install -g https://northwindcipher.com/sdk/cool-nwc-2.0.2.tgz

cool              # interactive session — /help, /demo, /stats, /attest
cool demo         # seal → verify → tamper, in about four seconds
cool verify all   # exits non-zero on any failure — what CI gates on
cool doctor       # what this environment can and cannot prove`;

const QUICKSTART = `import { CoolTee } from "cool-nwc";

// 1 · Connect. Boots the evidence plane, seals a signing key to the enclave
//     measurement, and completes the RA-TLS handshake before anything is sent.
const cool = await CoolTee.connect({
  app: { name: "refund-agent", imageDigest: process.env.IMAGE_DIGEST! },
  backend: async ({ model, prompt, params }) => {
    const output = await yourModel(model, prompt, params);
    return { output, provider: "phala-private-llm" };
  },
});

// 2 · Run inference. Returns when the model returns; evidence goes out-of-band.
const { output } = await cool.complete({
  model: "phala/deepseek-v4-pro@2026.07",
  prompt: "Assess application A-40182…",
  params: { temperature: 0.2 },
});

// 3 · Record a change to the AI system itself.
await cool.change({
  kind: "prompt",
  ref: "billing/refund-agent#system",
  before: previousPrompt,
  after: nextPrompt,
  actor: { id: "ci:github-actions", method: "oidc" },
  approval: { policy_id: "POL-014", decision: "approved", approvers: ["priya@bank.example"] },
});`;

const PRODUCTION = `import {
  CoolTee,
  HttpDstackClient,
  remoteQuoteVerifier,
} from "cool-nwc";
import { PINNED_MEASUREMENT } from "./measurement";

const cool = await CoolTee.connect({
  // Inside the CVM, the guest agent answers over a local socket.
  dstack: new HttpDstackClient({ endpoint: "/var/run/dstack.sock", vendor: "intel-tdx" }),

  // The measurement you reviewed and approved. Without a pin, a quote proves
  // "some TEE" — with one, it proves "the code we shipped".
  expectedMeasurement: PINNED_MEASUREMENT,

  policy: {
    expectedMeasurement: PINNED_MEASUREMENT,
    allowSimulated: false,               // no simulator in production, ever
    requireVendor: ["intel-tdx"],
    verifier: remoteQuoteVerifier({
      endpoint: process.env.QUOTE_VERIFIER_URL!,
      root: "intel-dcap",
    }),
  },

  // Bounded memory, never bounded latency.
  capture: { flushMs: 200, batchSize: 32, maxQueue: 2048 },
  onDrop: (event, reason) => metrics.increment("cool.dropped", { reason }),
});

if (!cool.handshake.ok) logger.error({ steps: cool.handshake.steps }, "attestation failed");`;

const VERIFY = `import { verifyReceiptV2 } from "cool-nwc";

const verdict = await verifyReceiptV2(receipt, {
  expectedMeasurement: PINNED_MEASUREMENT,
  requireHardware: true,
});

verdict.ok;                       // false unless every domain that can pass, did
verdict.checks.enclave.detail;    // "quote is inside the signature; measurement … holds the signing key"`;

const CLI = `# Deploy the evidence plane into a confidential VM
phala deploy -c docker-compose.yml -n cool-evidence-plane

# Read the CVM's attestation and record the measurement you are pinning
phala cvms attestation <cvm-id>

# Verify a receipt — offline, no CooL account, no Phala account
npx @northwindcipher/cool-verifier verify ./receipt.json --require-hardware`;

export default function InstallView({ onView }: { onView: (view: "ide") => void }) {
  return (
    <div className="mx-auto max-w-[980px] px-5 py-6">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold">Install the SDK</h1>
          <p className="mt-1 max-w-2xl text-[13.5px] leading-relaxed" style={{ color: "var(--atl-subtle)" }}>
            One dependency, one connect call, and no signing key to configure — there cannot be
            one, because the key is derived inside the enclave.
          </p>
        </div>
        <Btn variant="primary" onClick={() => onView("ide")}>
          <Code2 className="size-3.5" /> Open the workspace in the IDE
        </Btn>
      </header>

      <div className="space-y-4">
        <Card>
          <CardHead
            title="1 · Install"
            hint="Node 20+. Works in Node, Bun, Deno, Workers and the browser."
            right={
              <a
                href="/sdk"
                className="text-[12.5px] font-medium"
                style={{ color: "var(--atl-blue)" }}
              >
                Full SDK page ↗
              </a>
            }
          />
          <CodeBlock code={INSTALL} lang="shell" title="terminal" />
        </Card>

        <Card>
          <CardHead
            title="2 · Three calls"
            hint="Connect once at boot; the other two are what your application already does."
          />
          <CodeBlock code={QUICKSTART} lang="ts" title="src/agent.ts" />
        </Card>

        <Card>
          <CardHead
            title="3 · Production wiring"
            hint="The difference between a demo and a deployment is this object."
            right={<Lozenge tone="warn">read this one twice</Lozenge>}
          />
          <CodeBlock code={PRODUCTION} lang="ts" title="src/cool.ts" />
        </Card>

        <Card>
          <CardHead
            title="4 · What the auditor runs"
            hint="Ship this to whoever asks. It needs nothing from you."
          />
          <CodeBlock code={VERIFY} lang="ts" title="scripts/verify.ts" />
        </Card>

        <Card>
          <CardHead
            title="Command line"
            hint="Deploying the plane and checking a receipt, without writing any code"
            right={<Terminal className="size-4" style={{ color: "var(--atl-muted)" }} />}
          />
          <CodeBlock code={CLI} lang="shell" title="terminal" />
        </Card>

        <Card>
          <CardHead title="What runs where" />
          <div className="grid gap-3 text-[12.5px] leading-relaxed md:grid-cols-3" style={{ color: "var(--atl-subtle)" }}>
            <div>
              <p className="mb-1 font-semibold" style={{ color: "var(--atl-text)" }}>
                Your application
              </p>
              The SDK: an async, fail-open queue and an RA-TLS client. No crypto, no blocking, no
              plaintext retained.
            </div>
            <div>
              <p className="mb-1 font-semibold" style={{ color: "var(--atl-text)" }}>
                The enclave
              </p>
              The evidence engine: commit, bind, hybrid-sign, append to the log. Deployed as
              ordinary containers through dstack.
            </div>
            <div>
              <p className="mb-1 font-semibold" style={{ color: "var(--atl-text)" }}>
                Anywhere else
              </p>
              The verifier. Runs offline, in a browser or a CI job, and trusts nothing but the
              bytes it was handed.
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
