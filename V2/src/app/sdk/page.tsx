import type { Metadata } from "next";
import Link from "next/link";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Backdrop from "@/components/Backdrop";
import Copyable from "@/components/sdk/Copyable";
import TryIt from "@/components/sdk/TryIt";
import { SITE } from "@/lib/site";

/**
 * The SDK's public front door.
 *
 * Everything a stranger needs to use CooL without talking to us: the artefact
 * URLs, their checksums, three code blocks, and a panel that runs the published
 * bundle in their browser so they can see it work before installing anything.
 *
 * The artefact table is read from `public/sdk/manifest.json` at build time
 * rather than hard-coded, so the sizes and hashes on this page are always the
 * ones actually being served. A docs page that can drift from its downloads is
 * worse than no docs page — particularly for a product whose whole claim is
 * that you should check rather than trust.
 */

interface Artefact {
  file: string;
  bytes: number;
  sha256: string;
}

interface Manifest {
  name: string;
  version: string;
  license: string;
  artefacts: Artefact[];
  /**
   * Whether this exact version is on the npm registry. Written at build time by
   * asking the registry, so the page cannot advertise an install that 404s.
   */
  registry?: { published: boolean; install: string; global: string };
}

function manifest(): Manifest {
  try {
    return JSON.parse(
      readFileSync(join(process.cwd(), "public", "sdk", "manifest.json"), "utf8"),
    ) as Manifest;
  } catch {
    // The page must still render if someone builds before `npm run sdk:build`.
    return {
      name: "cool-tee",
      version: "2.0.0",
      license: "Apache-2.0",
      artefacts: [],
    };
  }
}

const M = manifest();
// Derived from the manifest, never typed: the artefacts are named after the
// package, and a rename that leaves this page pointing at a 404 is exactly the
// kind of drift the manifest exists to prevent.
const TARBALL = `${SITE.url}/sdk/${M.name}-${M.version}.tgz`;

export const metadata: Metadata = {
  title: "SDK",
  description:
    "Install the CooL SDK: tamper-evident, offline-verifiable evidence for AI systems, sealed inside a hardware TEE. Hybrid post-quantum signatures, an RFC 6962 transparency log, measurement-sealed keys via Phala dstack, and a verifier that trusts nothing but the bytes.",
  alternates: { canonical: "/sdk" },
  openGraph: {
    title: "The CooL SDK — evidence for AI, sealed in a TEE",
    description:
      "npm install from a URL, or import the ESM bundle straight into a browser. Then verify a receipt offline, without an account and without trusting us.",
    url: "/sdk",
    type: "website",
  },
};

const CLI = `cool                 # interactive session
cool walkthrough     # the whole model, by doing it, in ~3 minutes
cool help            # 13 command pages + 10 concept pages
cool help attestation   # …the concepts too, not just the flags

cool seal prompt billing/agent#system "Approve refunds up to $500."
cool records --kind prompt --env prod
cool verify all                      # exits non-zero on any failure
cool disclose last change.after "…"  # open ONE field, provably
cool witness cosign --key auditor    # independent co-signature
cool policy · cool compliance · cool pack build --out audit.json`;

const QUICKSTART = `import { CoolTee } from "cool-tee";

// 1 · Connect once at boot. Derives a signing key sealed to the enclave
//     measurement and completes the RA-TLS handshake before anything is sent.
const cool = await CoolTee.connect({
  app: { name: "refund-agent", imageDigest: process.env.IMAGE_DIGEST },
  backend: async ({ model, prompt, params }) => ({
    output: await yourModel(model, prompt, params),
  }),
});

// 2 · Inference. Returns when the model returns; evidence goes out-of-band.
const { output } = await cool.complete({
  model: "phala/deepseek-v4-pro@2026.07",
  prompt: "Assess application A-40182…",
  params: { temperature: 0.2 },
});

// 3 · A change to the AI system itself — the half nobody records today.
await cool.change({
  kind: "prompt",
  ref: "billing/refund-agent#system",
  before: previousPrompt,
  after: nextPrompt,
  actor: { id: "ci:github-actions", method: "oidc" },
  approval: { policy_id: "POL-014", decision: "approved", approvers: ["priya@bank.example"] },
});`;

const PRODUCTION = `import { CoolTee, HttpDstackClient, remoteQuoteVerifier } from "cool-tee";

const cool = await CoolTee.connect({
  // Inside the CVM the dstack guest agent answers on a local socket.
  dstack: new HttpDstackClient({ endpoint: "/var/run/dstack.sock", vendor: "intel-tdx" }),

  // The image you reviewed. Without a pin a quote proves "some TEE";
  // with one it proves "the code we approved".
  expectedMeasurement: PINNED_MEASUREMENT,

  policy: {
    expectedMeasurement: PINNED_MEASUREMENT,
    allowSimulated: false,            // no simulator in production, ever
    requireVendor: ["intel-tdx"],
    verifier: remoteQuoteVerifier({ endpoint: QUOTE_VERIFIER_URL, root: "intel-dcap" }),
  },

  capture: { flushMs: 200, batchSize: 32, maxQueue: 2048 },
  onDrop: (event, reason) => metrics.increment("cool.dropped", { reason }),
});

if (!cool.handshake.ok) logger.error({ steps: cool.handshake.steps }, "attestation failed");`;

const VERIFY = `import { verifyReceiptV2 } from "cool-tee";

const verdict = await verifyReceiptV2(receipt, {
  expectedMeasurement: PINNED_MEASUREMENT,
  requireHardware: true,
});

verdict.ok;                     // false unless every domain that can pass, did
verdict.checks.enclave.detail;  // quote ↔ measurement ↔ signing key`;

const DOMAINS: [string, string][] = [
  ["binding", "the record's contents match its commitment"],
  ["signature", "ML-DSA-65 and Ed25519 both verify over core‖binding"],
  ["inclusion", "the leaf is in the log under a validly signed tree head"],
  ["witnesses", "independent co-signatures — a self-signature never counts"],
  ["attestation", "the quote chains to a hardware root of trust"],
  ["enclave", "the quote, the measurement and the signing key are one chain"],
  ["anchor", "the tree head is anchored publicly — not implemented, never a pass"],
];

export default function SdkPage() {
  return (
    <>
      <Backdrop />
      {/* The deck's character-rain is atmosphere; this page is reference material
          and has to stay legible over it, so a scrim sits between the two. */}
      <div className="fixed inset-0 z-[1] bg-void/80" aria-hidden />
      <div className="grain" aria-hidden />

      <main className="relative z-10 mx-auto w-full max-w-3xl px-5 pt-10 pb-24">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 font-mono text-[12px] text-mist transition-colors hover:text-ink"
          >
            <ArrowLeft className="size-3.5" /> Back to the deck
          </Link>
          <Link
            href="/studio"
            className="inline-flex items-center gap-1.5 rounded-full border border-line px-3.5 py-1.5 font-mono text-[12px] text-mist transition-colors hover:border-verify/40 hover:text-ink"
          >
            Open the console <ArrowRight className="size-3.5" />
          </Link>
        </div>

        <header className="mt-8">
          <p className="kicker text-[14px]">The SDK</p>
          <h1 className="display mt-3 text-[clamp(2rem,6vw,3.2rem)] leading-[1.05]">
            Evidence for AI,
            <br />
            sealed inside a TEE.
          </h1>
          <p className="mt-4 text-[15.5px] leading-relaxed text-fog">
            Every AI change and every inference is committed, hybrid-signed and appended to a
            transparency log — inside a confidential VM whose measurement the signing key is
            derived from. Anyone can verify the result offline, with no account and no trust in
            us.
          </p>
          <p className="mt-3 font-mono text-[12px] text-mist">
            {M.name} · v{M.version} · {M.license} · Node ≥ 20, browsers, Deno, Bun, Workers
          </p>
        </header>

        <section className="mt-10">
          <h2 className="font-mono text-[11px] tracking-[0.14em] text-verify uppercase">
            Install
          </h2>
          <p className="mt-2 text-[14px] leading-relaxed text-fog">
            Served from this domain, so it works right now for anyone, with no registry account
            involved.
          </p>

          <div className="mt-4 space-y-3">
            {M.registry?.published ? (
              <Copyable
                label="npm · yarn · pnpm · bun"
                tone="primary"
                code={`npm install ${M.name}\n\n# …and the \`cool\` command, in any directory\nnpm install -g ${M.name}`}
              />
            ) : (
              <Copyable
                label="npm · yarn · pnpm · bun"
                tone="primary"
                code={`npm install ${TARBALL}\nnpm install -g ${TARBALL}`}
              />
            )}

            <Copyable
              label="browser or Deno — pinned, never moves"
              code={`import { CoolTee, verifyReceiptV2 } from "${SITE.url}/sdk/${M.name}-${M.version}.js";`}
            />

            <Copyable
              label="no registry access? install straight from this domain"
              code={`npm install -g ${TARBALL}`}
            />
          </div>

          <p className="mt-3 text-[13px] leading-relaxed text-mist">
            Two browser URLs exist and they behave differently on purpose:{" "}
            <span className="font-mono">{`${M.name}-${M.version}.js`}</span> is frozen forever and
            belongs in a page you are not watching, while{" "}
            <span className="font-mono">{`${M.name}.js`}</span> always serves the newest build.
            Installing from the tarball URL pins that exact version — it will never be picked up
            by <span className="font-mono">npm update</span>, so prefer the registry unless you
            cannot reach it. Checksums for every artefact:{" "}
            <a href="/sdk/checksums.txt" className="text-verify hover:underline">
              /sdk/checksums.txt
            </a>
            .
          </p>
        </section>

        <section className="mt-8">
          <TryIt bundle={`/sdk/${M.name}.js`} />
        </section>

        <section className="mt-10">
          <h2 className="font-mono text-[11px] tracking-[0.14em] text-verify uppercase">
            The command line
          </h2>
          <p className="mt-2 text-[14px] leading-relaxed text-fog">
            A global install puts <span className="font-mono">cool</span> on your PATH. Typing it
            with no arguments opens an interactive session — a banner, a prompt, and panels that
            seal and verify real records in whichever directory you are standing in.
          </p>
          <div className="mt-4">
            <Copyable label="terminal" code={CLI} />
          </div>
          <p className="mt-3 text-[13px] leading-relaxed text-mist">
            Receipts are written to <span className="font-mono">.cool/receipts/</span> — one JSON
            file per record. <span className="font-mono">cool verify &lt;file&gt;</span> needs no
            enclave at all, which is the situation an auditor is in, and it exits non-zero when a
            receipt fails, which is what a pipeline gates on.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="font-mono text-[11px] tracking-[0.14em] text-verify uppercase">
            Three calls
          </h2>
          <p className="mt-2 text-[14px] leading-relaxed text-fog">
            Connect once; the other two are what your application already does. Capture is
            asynchronous and fail-open — a p99 of about 0.03 ms on the caller&apos;s thread, and
            an unreachable evidence plane never blocks a customer request.
          </p>
          <div className="mt-4">
            <Copyable label="src/agent.ts" code={QUICKSTART} />
          </div>
        </section>

        <section className="mt-10">
          <h2 className="font-mono text-[11px] tracking-[0.14em] text-verify uppercase">
            Production
          </h2>
          <p className="mt-2 text-[14px] leading-relaxed text-fog">
            Without a <span className="font-mono">dstack</span> client the SDK runs its
            simulator: same code path, same receipts, quotes under a CooL-held root — and every
            one of them labelled <span className="font-mono">simulated</span> in its own
            attestation block. This object is the difference between a demo and a deployment.
          </p>
          <div className="mt-4">
            <Copyable label="src/cool.ts" code={PRODUCTION} />
          </div>
        </section>

        <section className="mt-10">
          <h2 className="font-mono text-[11px] tracking-[0.14em] text-verify uppercase">
            Verify
          </h2>
          <p className="mt-2 text-[14px] leading-relaxed text-fog">
            The function an auditor runs. Offline, seven domains, each failing independently.
          </p>
          <div className="mt-4">
            <Copyable label="scripts/verify.ts" code={VERIFY} />
          </div>

          <dl className="mt-5 divide-y divide-line rounded-xl border border-line bg-panel/40">
            {DOMAINS.map(([domain, meaning]) => (
              <div key={domain} className="flex flex-wrap gap-x-4 gap-y-1 px-4 py-2.5">
                <dt className="w-24 shrink-0 font-mono text-[12.5px] text-ink">{domain}</dt>
                <dd className="flex-1 text-[13px] leading-snug text-mist">{meaning}</dd>
              </div>
            ))}
          </dl>

          <p className="mt-4 rounded-xl border border-line bg-panel/50 px-4 py-3 text-[13px] leading-relaxed text-mist">
            <span className="font-mono text-[11px] tracking-[0.12em] text-verify uppercase">
              What a clean verdict does not mean
            </span>
            <br />
            That the output was correct, fair, safe or compliant. CooL records what happened; it
            does not grade it. And on a simulated enclave the attestation and enclave domains
            report <span className="font-mono">simulated</span>, never{" "}
            <span className="font-mono">pass</span> — set{" "}
            <span className="font-mono">requireHardware</span> and the same receipt stops being
            acceptable.
          </p>
        </section>

        {M.artefacts.length > 0 && (
          <section className="mt-10">
            <h2 className="font-mono text-[11px] tracking-[0.14em] text-verify uppercase">
              Artefacts
            </h2>
            <div className="mt-4 overflow-x-auto rounded-xl border border-line bg-panel/40">
              <table className="w-full border-collapse text-left font-mono text-[12px]">
                <thead>
                  <tr className="text-[10.5px] tracking-[0.1em] text-mist uppercase">
                    <th className="px-4 py-2 font-normal">File</th>
                    <th className="px-4 py-2 font-normal">Size</th>
                    <th className="px-4 py-2 font-normal">SHA-256</th>
                  </tr>
                </thead>
                <tbody>
                  {M.artefacts.map((artefact) => (
                    <tr key={artefact.file} className="border-t border-line">
                      <td className="px-4 py-2">
                        <a href={`/sdk/${artefact.file}`} className="text-verify hover:underline">
                          {artefact.file}
                        </a>
                      </td>
                      <td className="px-4 py-2 text-mist">
                        {(artefact.bytes / 1024).toFixed(1)} kB
                      </td>
                      <td className="px-4 py-2 break-all text-mist">{artefact.sha256}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <section className="mt-10">
          <h2 className="font-mono text-[11px] tracking-[0.14em] text-verify uppercase">
            Next
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Link
              href="/studio"
              className="rounded-xl border border-line bg-panel/50 p-4 transition-colors hover:border-verify/40"
            >
              <p className="text-[14px] font-semibold text-ink">The console and the IDE</p>
              <p className="mt-1 text-[13px] leading-snug text-mist">
                A live evidence plane, the workspace that deploys it, and a verifier you can
                attack.
              </p>
            </Link>
            <Link
              href="/demo"
              className="rounded-xl border border-line bg-panel/50 p-4 transition-colors hover:border-verify/40"
            >
              <p className="text-[14px] font-semibold text-ink">The evidence pipeline</p>
              <p className="mt-1 text-[13px] leading-snug text-mist">
                Watch the cryptography execute, step by step, on a record you create.
              </p>
            </Link>
          </div>
          <p className="mt-4 text-[13px] leading-relaxed text-mist">
            Conformance vectors:{" "}
            <a href="/cool-vectors" className="text-verify hover:underline">
              /cool-vectors
            </a>{" "}
            · Source and issues:{" "}
            <a
              href="https://github.com/KenidoesCode/cool-sdk"
              className="text-verify hover:underline"
            >
              github.com/KenidoesCode/cool-sdk
            </a>
          </p>
        </section>
      </main>
    </>
  );
}
