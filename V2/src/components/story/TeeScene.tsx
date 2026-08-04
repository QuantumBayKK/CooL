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
import { Cpu, Server } from "lucide-react";
import { CodeBlock } from "@/components/studio/CodeBlock";
import { useStory } from "./session";
import { Digest, Label, Panel, Pill } from "./ui";

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
