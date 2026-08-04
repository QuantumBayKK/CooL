"use client";

/**
 * Act eleven — where it runs.
 *
 * This act is short by design and honest by necessity, and the two are related.
 *
 * A browser tab has no Intel TDX in it. The enclave here is
 * `SimulatedDstackClient`, the quote is signed by a simulator root, and the
 * verifier reports the attestation domain as `simulated` — never `pass`. That
 * rule lives in `verify.ts`, not in this component's copy, so no amount of
 * presentation can turn it green. Claiming hardware in a demo that has none is
 * the one mistake that would cost more than the demo is worth, particularly in
 * front of the people who build the hardware path.
 *
 * What the act *can* show, and what actually matters, is that the wiring is
 * real and the gap is one object. `enclave` below is a measurement the SDK
 * produced; the handshake steps are the RA-TLS checks that really ran; the key
 * binding is the property that makes a quote mean something about *this*
 * record. Swapping the simulator for the guest agent changes the connect call
 * and nothing else — which is the claim the code panel makes checkable rather
 * than asserting.
 */
import { useCallback, useState } from "react";
import { Cpu, Server, ShieldAlert } from "lucide-react";
import { CodeBlock } from "@/components/studio/CodeBlock";
import { verifyReceiptV2 } from "@/lib/cool/phala";
import type { VerdictV2 } from "@/lib/cool/phala";
import { DEPLOY_STEPS, HARDWARE_TABLE } from "@/lib/story/hardware";
import { useStory } from "./session";
import { Button, Digest, Label, Panel, Pill } from "./ui";

/** What the connect call becomes on a real CVM. The whole difference, in one object. */
const PRODUCTION = `const cool = await CoolTee.connect({
  // laptop:      new SimulatedDstackClient({ ... })
  // production:  the guest agent, over its unix socket
  dstack: new HttpDstackClient({
    endpoint: "/var/run/dstack.sock",
    vendor: "intel-tdx",
  }),
  expectedMeasurement: PINNED_MEASUREMENT,
  policy: {
    expectedMeasurement: PINNED_MEASUREMENT,
    allowSimulated: false,          // <- the line that closes this demo's gap
    requireVendor: ["intel-tdx"],
    verifier: remoteQuoteVerifier({
      endpoint: process.env.QUOTE_VERIFIER_URL!,
      root: "intel-dcap",
    }),
  },
});`;

const TARGETS = [
  { name: "Phala dstack", detail: "Intel TDX · CVM with a guest agent on a unix socket", ready: true },
  { name: "NVIDIA Confidential Computing", detail: "H100 / H200 · GPU attestation bound to the record", ready: true },
  { name: "AWS Nitro Enclaves", detail: "NSM attestation document · same verifier interface", ready: false },
  { name: "AMD SEV-SNP", detail: "quote format wired, root not yet pinned", ready: false },
];

/**
 * The switch an auditor flips, run for real.
 *
 * This is the strongest thing the act can do without hardware, and it works
 * precisely because it fails. `requireHardware` is a real option on the real
 * verifier: set it and a receipt that is not backed by a vendor-rooted quote is
 * rejected outright, no matter how many other domains pass. Pressing this on a
 * laptop produces `INVALID` and prints the verifier's own reason string.
 *
 * A demo that could only ever show green would prove nothing about the gate.
 * Showing it refuse — on a record the audience watched get created and verified
 * a minute earlier — proves the gate exists, is enforced, and is not something
 * the UI can talk its way past. The same call on a CVM returns VALID, and by
 * then the audience has seen what it costs to get there.
 */
function HardwareGate() {
  const { rows } = useStory();
  const receipt = rows[0]?.receipt ?? null;
  const [verdict, setVerdict] = useState<VerdictV2 | null>(null);
  const [busy, setBusy] = useState(false);

  const run = useCallback(async () => {
    if (!receipt) return;
    setBusy(true);
    setVerdict(await verifyReceiptV2(receipt, { requireHardware: true }));
    setBusy(false);
  }, [receipt]);

  return (
    <Panel className="p-4" style={verdict ? { borderColor: "rgba(210,153,34,0.45)" } : undefined}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <Label>The auditor&rsquo;s switch</Label>
          <p className="mt-2 max-w-prose text-[12px] leading-relaxed text-mist">
            <code className="font-mono text-fog">--require-hardware</code> is a real option on the
            real verifier. Set it and a receipt without a vendor-rooted quote is rejected outright,
            however many other domains pass. Run it here, on the record sealed a minute ago.
          </p>
        </div>
        <Button tone="default" onClick={() => void run()} disabled={!receipt || busy}>
          <ShieldAlert size={13} />
          {busy ? "verifying…" : "cool verify --require-hardware"}
        </Button>
      </div>

      {verdict && (
        <div className="mt-3 border-t border-line pt-3">
          <div className="flex flex-wrap items-center gap-3">
            <Pill tone={verdict.ok ? "live" : "fail"}>{verdict.ok ? "VALID" : "REFUSED"}</Pill>
            <span className="font-mono text-[11.5px] text-mist">
              attestation: {verdict.checks.attestation.status}
            </span>
          </div>
          {verdict.reasons.map((reason) => (
            <p key={reason} className="mt-2 font-mono text-[11.5px] leading-relaxed text-fail">
              {reason}
            </p>
          ))}
          <p className="mt-2 max-w-prose text-[11.5px] leading-relaxed text-mist">
            That refusal is the product working. The same call inside a Phala CVM, with{" "}
            <code className="font-mono text-fog">QUOTE_VERIFIER_URL</code> set, returns VALID —
            because by then something has actually checked a chain to Intel. Nothing on this page
            can produce that here, which is the point.
          </p>
        </div>
      )}
    </Panel>
  );
}

export function TeeScene() {
  const { enclave, handshake, rows } = useStory();
  const receipt = rows[0]?.receipt ?? null;

  return (
    <div className="thin-scroll flex h-full min-h-0 flex-col gap-3 overflow-y-auto pr-1">
      {/* the headline, stated accurately */}
      <Panel className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Label>Trusted execution</Label>
            <div className="mt-2 flex items-center gap-2.5">
              <Cpu size={20} style={{ color: "var(--color-verify)" }} />
              <span className="text-[22px] leading-none text-ink">
                {enclave?.vendor ?? "—"}
              </span>
              <Pill tone="verify">simulated</Pill>
            </div>
            <p className="mt-2 max-w-prose text-[12px] leading-relaxed text-mist">
              This is a browser, so there is no TDX here and the verifier says so — the
              attestation domain reports <code className="font-mono text-fog">simulated</code>,
              which is a distinct status from <code className="font-mono text-fog">pass</code> and
              cannot be reached from the UI. Everything else on this page is real; this is the one
              thing a laptop cannot be.
            </p>
          </div>
          <div className="shrink-0 text-right">
            <div className="font-mono text-[11px] text-mist">TCB</div>
            <div className="font-mono text-[13px] text-fog">{enclave?.tcbStatus ?? "—"}</div>
          </div>
        </div>
      </Panel>

      {/* The switch comes before the detail. In a live run this is the beat that
          lands — the verifier refusing on the record they just watched being
          created — and it should not be something a presenter has to scroll to
          find while the room is waiting. */}
      <HardwareGate />

      <div className="grid gap-3 lg:grid-cols-2">
        {/* measurement */}
        <Panel className="p-4">
          <Label>Measurement</Label>
          <p className="mt-2 text-[11.5px] leading-relaxed text-mist">
            The image, measured into the TDX register set at boot. It is inside the signed core, so
            it cannot be swapped after the fact — and the signing key is derived from it, so a
            different image is a different key.
          </p>
          <div className="mt-2.5 flex flex-col gap-[3px]">
            {enclave &&
              (["mrtd", "rtmr0", "rtmr1", "rtmr2", "rtmr3"] as const).map((slot) => (
                <div key={slot} className="flex items-baseline justify-between gap-3">
                  <span className="font-mono text-[11px] text-mist uppercase">{slot}</span>
                  <Digest value={enclave.measurement[slot]} chars={28} />
                </div>
              ))}
          </div>
          <div className="mt-3 border-t border-line pt-2.5">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[11.5px] text-mist">App id</span>
              <Digest value={enclave?.appId ?? "—"} chars={24} />
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[11.5px] text-mist">Image</span>
              <Digest value={enclave?.imageDigest ?? "—"} chars={24} />
            </div>
          </div>
        </Panel>

        {/* handshake */}
        <Panel className="p-4">
          <Label>RA-TLS handshake</Label>
          <p className="mt-2 text-[11.5px] leading-relaxed text-mist">
            Attest before send. These checks ran when the page booted — fail any of them and the
            channel never opens, so nothing is transmitted rather than transmitted to something
            unverified.
          </p>
          <div className="mt-2.5 flex flex-col gap-1.5">
            {handshake?.steps.map((step) => (
              <div key={step.label} className="flex items-start gap-2">
                <Pill tone={step.ok ? "live" : "fail"}>{step.ok ? "ok" : "fail"}</Pill>
                <div className="min-w-0">
                  <div className="font-mono text-[11.5px] text-fog">{step.label}</div>
                  <div className="text-[11px] leading-snug text-mist">{step.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* the binding — the property that makes a quote mean something */}
      <Panel className="p-4">
        <Label>Quote ⇄ key binding</Label>
        <p className="mt-2 max-w-prose text-[12px] leading-relaxed text-mist">
          A quote on its own proves some enclave existed. This binds it to this record: the
          quote&rsquo;s <code className="font-mono text-fog">report_data</code> commits to the very
          public key the record is signed with, and the quote&rsquo;s digest sits inside the signed
          core. Staple a valid quote from a different image onto this receipt and the enclave
          domain fails — because the substitution is now inside the signature.
        </p>
        <div className="mt-2.5 grid gap-x-6 sm:grid-cols-2">
          <div className="flex items-baseline justify-between gap-3 py-[3px]">
            <span className="text-[11.5px] text-mist">Key binding</span>
            <Digest value={receipt?.attestation.key_binding ?? "—"} chars={22} />
          </div>
          <div className="flex items-baseline justify-between gap-3 py-[3px]">
            <span className="text-[11.5px] text-mist">Quote digest</span>
            <Digest value={receipt?.record.runtime.tee_quote ?? "—"} chars={22} />
          </div>
          <div className="flex items-baseline justify-between gap-3 py-[3px]">
            <span className="text-[11.5px] text-mist">Signing key</span>
            <Digest value={receipt?.record.signature.key_id ?? "—"} chars={22} />
          </div>
          <div className="flex items-baseline justify-between gap-3 py-[3px]">
            <span className="text-[11.5px] text-mist">Enclave domain</span>
            <span className="font-mono text-[11.5px] text-fog">
              {rows[0]?.verdict?.checks.enclave.status ?? "—"}
            </span>
          </div>
        </div>
      </Panel>

      {/* what deploying actually changes, domain by domain */}
      <Panel className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-2.5">
          <Label>On this laptop → on a Phala CVM</Label>
          <Pill tone="warn" glyph={false}>
            projection
          </Pill>
          <span className="ml-auto text-[11px] text-mist">
            derived from the rules in verify.ts — not a result
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] border-collapse text-left">
            <thead>
              <tr className="border-b border-line">
                {["Domain", "Here", "On hardware", "What has to supply it"].map((h) => (
                  <th key={h} className="px-4 py-2 text-[11px] font-medium text-mist">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HARDWARE_TABLE.map((row) => (
                <tr key={row.domain} className="border-b border-line/60 last:border-0 align-top">
                  <td className="px-4 py-2.5 font-mono text-[11.5px] text-fog">{row.domain}</td>
                  <td className="px-4 py-2.5">
                    <Pill
                      tone={
                        row.here === "pass" ? "live" : row.here === "simulated" ? "verify" : "mock"
                      }
                    >
                      {row.here}
                    </Pill>
                  </td>
                  <td className="px-4 py-2.5">
                    <Pill
                      tone={
                        row.onHardware === "pass"
                          ? "live"
                          : row.onHardware.includes("pass")
                            ? "warn"
                            : "mock"
                      }
                    >
                      {row.onHardware}
                    </Pill>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="text-[11.5px] text-fog">{row.provider}</div>
                    <div className="mt-0.5 max-w-[46ch] text-[11px] leading-snug text-mist">
                      {row.because}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-line px-4 py-2.5 text-[11.5px] leading-relaxed text-mist">
          Three domains change when you deploy. Four do not — and{" "}
          <span className="font-mono text-fog">witnesses</span> is the honest one to point at:
          it needs a second party who is not CooL and not Phala, so no amount of silicon moves
          it. A tool that turned all seven green on deployment would be a worse tool.
        </div>
      </Panel>

      {/* the five steps */}
      <Panel className="overflow-hidden">
        <div className="border-b border-line px-4 py-2.5">
          <Label>From here to a verified quote — five steps</Label>
        </div>
        <ol className="divide-y divide-line">
          {DEPLOY_STEPS.map((step) => (
            <li key={step.n} className="flex gap-3 px-4 py-3">
              <span className="mt-[1px] grid size-5 shrink-0 place-items-center rounded-full bg-raised font-mono text-[11px] text-mist">
                {step.n}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[12.5px] font-medium text-ink">{step.title}</div>
                <div className="mt-0.5 max-w-prose text-[11.5px] leading-relaxed text-mist">
                  {step.why}
                </div>
                <pre className="mt-2 overflow-x-auto rounded-md border border-line bg-void px-3 py-2 font-mono text-[11px] leading-relaxed text-fog">
                  {step.powershell}
                </pre>
              </div>
            </li>
          ))}
        </ol>
      </Panel>

      {/* the gap, in code */}
      <div className="grid gap-3 lg:grid-cols-[1.3fr_1fr]">
        <Panel className="overflow-hidden">
          <div className="border-b border-line px-4 py-2.5">
            <Label>What changes in production</Label>
          </div>
          {/* CodeBlock is a console component and reaches for an Atlassian token
              for its hairline. Supply it locally rather than forking the file. */}
          <div
            className="p-1"
            style={{ ["--atl-border-strong" as string]: "var(--color-line)" } as React.CSSProperties}
          >
            <CodeBlock code={PRODUCTION} lang="ts" title="cool.config.ts — production" />
          </div>
        </Panel>

        <Panel className="p-4">
          <Label>Where it can run</Label>
          <div className="mt-2.5 flex flex-col gap-2.5">
            {TARGETS.map((target) => (
              <div key={target.name} className="flex items-start gap-2.5">
                <Server size={14} className="mt-[2px] shrink-0 text-mist" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[12.5px] text-ink">{target.name}</span>
                    <Pill tone={target.ready ? "verify" : "mock"} glyph={false}>
                      {target.ready ? "wired" : "planned"}
                    </Pill>
                  </div>
                  <div className="text-[11px] leading-snug text-mist">{target.detail}</div>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 border-t border-line pt-2.5 text-[11px] leading-relaxed text-mist">
            The root of trust is reached through an interface, not a hard-coded vendor. A
            customer&rsquo;s evidence should outlive any decision about whose silicon it ran on.
          </p>
        </Panel>
      </div>
    </div>
  );
}
