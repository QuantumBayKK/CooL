"use client";

/**
 * Attestation — the page that answers "why should I believe any of this?".
 *
 * It is deliberately the least decorated view in the console. Measurement
 * registers, an event log, a handshake transcript and a quote body: the things a
 * security engineer will read line by line and the things a marketing page would
 * have summarised into a badge. The one interactive control redeploys the
 * evidence plane from a different image, because the fastest way to explain
 * measurement-sealed keys is to break them on purpose.
 */
import { useState } from "react";
import { KeyRound, RefreshCw, ShieldAlert, ShieldCheck } from "lucide-react";
import { useStudio } from "../session";
import { APPROVED_IMAGE, ROGUE_IMAGE } from "@/lib/studio/scenario";
import { Btn, Card, CardHead, Hash, Json, KeyValue, Lozenge } from "../ui";

const REGISTER_MEANING: Record<string, string> = {
  mrtd: "Build-time measurement of the TD image. Changes if a single byte of the deployed image changes.",
  rtmr0: "Virtual hardware configuration.",
  rtmr1: "Kernel and initrd.",
  rtmr2: "Kernel command line.",
  rtmr3: "Application events — app id, compose digest, instance id, key provider. The register that moves when YOUR code moves.",
};

export default function AttestationView() {
  const { enclave, handshake, image, redeploy, entries, rotations } = useStudio();
  const [busy, setBusy] = useState(false);

  const swap = async (next: string) => {
    setBusy(true);
    await redeploy(next);
    setBusy(false);
  };

  const quote = handshake?.quote ?? null;
  const keyId = entries[0]?.receipt.record.signature.key_id ?? "—";

  return (
    <div className="mx-auto max-w-[1180px] px-5 py-6">
      <header className="mb-5">
        <h1 className="text-[22px] font-semibold">Attestation</h1>
        <p className="mt-1 max-w-3xl text-[13.5px] leading-relaxed" style={{ color: "var(--atl-subtle)" }}>
          The evidence plane runs inside a confidential VM managed by dstack. This page shows
          what that VM measured, what it signed, and how the signing key is tied to both.
        </p>
      </header>

      <div
        className="mb-4 flex flex-wrap items-center gap-2 rounded-[3px] border px-3 py-2 text-[12.5px]"
        style={{ background: "var(--atl-teal-bg)", borderColor: "var(--atl-border)", color: "var(--atl-teal)" }}
      >
        <ShieldAlert className="size-4 shrink-0" />
        <span>
          <strong>Simulated enclave.</strong> Quotes on this page are structurally complete and
          cryptographically real, and they chain to a CooL-held root rather than to Intel. Every
          receipt says so, and the verifier reports <em>simulated</em> — never <em>pass</em> — on
          the two domains that depend on hardware.
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
        <Card>
          <CardHead title="Enclave identity" hint="Reported by the dstack guest agent inside the CVM" />
          <div className="space-y-0.5">
            <KeyValue k="Vendor" v={enclave?.vendor ?? "—"} />
            <KeyValue k="Mode" v={<Lozenge tone="teal" glyph>{enclave?.mode ?? "—"}</Lozenge>} />
            <KeyValue k="TCB status" v={enclave?.tcbStatus ?? "—"} />
            <KeyValue k="App id" v={<span className="font-mono text-[11.5px]">{enclave?.appId ?? "—"}</span>} />
            <KeyValue k="Instance id" v={<span className="font-mono text-[11.5px]">{enclave?.instanceId ?? "—"}</span>} />
            <KeyValue k="Image digest" v={<span className="font-mono text-[11.5px]">{image}</span>} />
            <KeyValue k="Quote format" v={quote?.format ?? "—"} />
            <KeyValue
              k="Root of trust"
              v={<Lozenge tone={quote?.root === "intel-dcap" ? "success" : "teal"}>{quote?.root ?? "—"}</Lozenge>}
            />
          </div>
        </Card>

        <Card>
          <CardHead
            title="Key sealing chain"
            hint="Each arrow is a function, not a policy. Nobody can skip a link."
          />
          <ol className="space-y-2">
            {[
              { label: "Deployed image", value: image.slice(0, 34) + "…" },
              { label: "Measured into MRTD + RTMR3", value: enclave ? enclave.measurement.mrtd.slice(4, 30) + "…" : "—" },
              { label: "dstack-KMS derives a seed bound to that measurement", value: "32 bytes, never leaves the TEE" },
              { label: "Hybrid signing key", value: keyId },
              { label: "Quote report_data commits to that key", value: quote ? quote.body.report_data.slice(10, 34) + "…" : "—" },
              { label: "Quote digest goes inside the signed core", value: "so the quote cannot be swapped later" },
            ].map((step, index) => (
              <li key={step.label} className="flex gap-2.5">
                <span
                  className="mt-[2px] grid size-5 shrink-0 place-items-center rounded-full text-[11px] font-bold"
                  style={{ background: "var(--atl-blue-bg)", color: "var(--atl-blue)" }}
                >
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-[12.5px] font-medium">{step.label}</p>
                  <p className="font-mono text-[11.5px] break-all" style={{ color: "var(--atl-muted)" }}>
                    {step.value}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHead
          title="Measurement registers"
          hint="What the customer pins. A mismatch closes the channel before any data moves."
        />
        <div className="space-y-2">
          {enclave &&
            (["mrtd", "rtmr0", "rtmr1", "rtmr2", "rtmr3"] as const).map((register) => (
              <div
                key={register}
                className="rounded-[3px] border p-2.5"
                style={{ borderColor: "var(--atl-border)", background: "var(--atl-raised)" }}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-mono text-[12.5px] font-semibold uppercase">{register}</span>
                  <span className="text-[11.5px]" style={{ color: "var(--atl-muted)" }}>
                    {REGISTER_MEANING[register]}
                  </span>
                </div>
                <p
                  className="mt-1 font-mono text-[11px] break-all"
                  style={{ color: "var(--atl-subtle)" }}
                >
                  {enclave.measurement[register].slice(4)}
                </p>
              </div>
            ))}
        </div>
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHead title="RA-TLS handshake" hint="Run before the SDK transmitted a single event" />
          <ol className="space-y-1.5">
            {(handshake?.steps ?? []).map((step, index) => (
              <li key={index} className="flex gap-2">
                <span
                  aria-hidden
                  className="mt-[1px] w-3 shrink-0 text-center text-[12px] font-bold"
                  style={{ color: step.ok ? "var(--atl-green)" : "var(--atl-red)" }}
                >
                  {step.ok ? "✓" : "✕"}
                </span>
                <div className="min-w-0">
                  <p className="text-[12.5px] font-medium">{step.label}</p>
                  <p className="text-[11.5px] leading-snug" style={{ color: "var(--atl-muted)" }}>
                    {step.detail}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </Card>

        <Card>
          <CardHead title="RTMR3 event log" hint="What dstack extended into the application register" />
          <div className="space-y-1">
            {(enclave?.eventLog ?? []).map((event) => (
              <div
                key={event.event}
                className="flex items-center justify-between gap-3 border-b py-1.5 last:border-0"
                style={{ borderColor: "var(--atl-border)" }}
              >
                <span className="font-mono text-[12px]">
                  <span style={{ color: "var(--atl-muted)" }}>imr{event.imr}</span> {event.event}
                </span>
                <Hash value={event.digest} chars={16} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHead
          title="Redeploy the evidence plane"
          hint="The demonstration that matters: change the image, and the key changes with it."
          right={
            <span className="text-[12px]" style={{ color: "var(--atl-muted)" }}>
              {rotations} rotation{rotations === 1 ? "" : "s"} this session
            </span>
          }
        />
        <div className="grid gap-3 md:grid-cols-2">
          <div
            className="rounded-[3px] border p-3"
            style={{
              borderColor: image === APPROVED_IMAGE ? "var(--atl-green-bold)" : "var(--atl-border)",
              background: "var(--atl-surface)",
            }}
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4" style={{ color: "var(--atl-green)" }} />
              <span className="text-[13px] font-semibold">Approved image</span>
              {image === APPROVED_IMAGE && <Lozenge tone="success">running</Lozenge>}
            </div>
            <p className="mt-1.5 font-mono text-[11.5px] break-all" style={{ color: "var(--atl-muted)" }}>
              {APPROVED_IMAGE}
            </p>
            <div className="mt-2">
              <Btn size="sm" onClick={() => void swap(APPROVED_IMAGE)} disabled={busy || image === APPROVED_IMAGE}>
                <RefreshCw className="size-3.5" /> Deploy
              </Btn>
            </div>
          </div>

          <div
            className="rounded-[3px] border p-3"
            style={{
              borderColor: image === ROGUE_IMAGE ? "var(--atl-red-bold)" : "var(--atl-border)",
              background: "var(--atl-surface)",
            }}
          >
            <div className="flex items-center gap-2">
              <ShieldAlert className="size-4" style={{ color: "var(--atl-red)" }} />
              <span className="text-[13px] font-semibold">Patched image</span>
              {image === ROGUE_IMAGE && <Lozenge tone="danger">running</Lozenge>}
            </div>
            <p className="mt-1.5 font-mono text-[11.5px] break-all" style={{ color: "var(--atl-muted)" }}>
              {ROGUE_IMAGE}
            </p>
            <div className="mt-2">
              <Btn size="sm" variant="danger" onClick={() => void swap(ROGUE_IMAGE)} disabled={busy || image === ROGUE_IMAGE}>
                <RefreshCw className="size-3.5" /> Deploy
              </Btn>
            </div>
          </div>
        </div>

        <div
          className="mt-3 flex gap-2 rounded-[3px] border px-3 py-2.5 text-[12.5px] leading-relaxed"
          style={{ background: "var(--atl-blue-bg)", borderColor: "var(--atl-blue-border)", color: "var(--atl-text)" }}
        >
          <KeyRound className="mt-[2px] size-4 shrink-0" style={{ color: "var(--atl-blue)" }} />
          <span>
            After a redeploy, seal a new record and compare it with an older one. The key id
            changes, because the seed is a function of the measurement. The old records keep
            verifying — against a key this deployment can no longer produce. That is what
            &ldquo;CooL cannot forge your evidence&rdquo; means in practice, and the ledger&apos;s{" "}
            <strong>Swap quote</strong> button shows the other half: a valid quote from the wrong
            image is rejected because its digest is inside the signature.
          </span>
        </div>
      </Card>

      {quote && (
        <Card className="mt-4">
          <CardHead title="The quote" hint="Hashed into every record's signed core" />
          <Json value={quote} maxHeight={340} />
        </Card>
      )}
    </div>
  );
}
