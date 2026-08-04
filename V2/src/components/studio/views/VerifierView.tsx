"use client";

/**
 * The verifier — the same function an auditor runs, with a paste box in front.
 *
 * This view intentionally accepts arbitrary input. Download a receipt from the
 * ledger, edit one character in a text editor, paste it back, and watch the
 * verdict change. A verification tool that only accepts evidence it produced
 * itself proves nothing; this one runs `verifyReceiptV2` over whatever JSON is
 * in the box, exactly as the published verifier would.
 */
import { useMemo, useState } from "react";
import { FlaskConical, ShieldCheck } from "lucide-react";
import { verifyReceiptV2 } from "@/lib/cool/phala";
import type { VerdictV2 } from "@/lib/cool/phala";
import { useStudio } from "../session";
import { Btn, Card, CardHead, Lozenge, Select } from "../ui";
import { VerdictGrid } from "./VerdictGrid";

export default function VerifierView() {
  const { entries, enclave, tamper, swapQuote } = useStudio();
  const [selected, setSelected] = useState<string>("");
  const [text, setText] = useState("");
  const [verdict, setVerdict] = useState<VerdictV2 | null>(null);
  const [elapsed, setElapsed] = useState<number | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [requireHardware, setRequireHardware] = useState(false);
  const [pin, setPin] = useState(false);
  const [busy, setBusy] = useState(false);

  const options = useMemo(
    () => [
      { value: "", label: "— choose a record from the ledger —" },
      ...entries.slice(0, 40).map((entry) => ({
        value: entry.id,
        label: `${entry.kind === "change" ? "◆" : "•"} ${entry.label} · ${entry.system}`,
      })),
    ],
    [entries],
  );

  const load = (id: string) => {
    setSelected(id);
    setVerdict(null);
    setNote(null);
    const entry = entries.find((e) => e.id === id);
    setText(entry ? JSON.stringify(entry.receipt, null, 2) : "");
  };

  const verify = async () => {
    setBusy(true);
    setNote(null);
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      setVerdict(null);
      setNote("That is not valid JSON — the verifier never saw a receipt.");
      setBusy(false);
      return;
    }
    const started = performance.now();
    const result = await verifyReceiptV2(parsed, {
      ...(requireHardware ? { requireHardware: true } : {}),
      ...(pin && enclave ? { expectedMeasurement: enclave.measurement } : {}),
    });
    setElapsed(performance.now() - started);
    setVerdict(result);
    setBusy(false);
  };

  const attack = async (kind: "tamper" | "quote") => {
    if (!selected) return;
    setBusy(true);
    const result = kind === "tamper" ? await tamper(selected) : await swapQuote(selected);
    setVerdict(result);
    setNote(
      kind === "tamper"
        ? "One character of one hash was changed. Binding and signature both fail — the record cannot be edited without the enclave key."
        : "A valid quote from a DIFFERENT image was stapled on. The enclave domain fails, because the quote's digest is inside the signed core.",
    );
    setBusy(false);
  };

  return (
    <div className="mx-auto max-w-[1180px] px-5 py-6">
      <header className="mb-5">
        <h1 className="text-[22px] font-semibold">Verifier</h1>
        <p className="mt-1 max-w-3xl text-[13.5px] leading-relaxed" style={{ color: "var(--atl-subtle)" }}>
          Offline, in this browser, with no access to CooL or Phala. Paste any receipt — one
          from this session, or one you edited yourself.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1.15fr_1fr]">
        <Card>
          <CardHead title="Input" hint="A cool.receipt.v2 document" />
          <div className="mb-3">
            <Select value={selected} onChange={load} options={options} label="Load from the ledger" />
          </div>
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            rows={16}
            spellCheck={false}
            placeholder="Paste a receipt here…"
            className="thin-scroll w-full resize-y rounded-[3px] border px-2.5 py-2 font-mono text-[11px] leading-[1.5] outline-none"
            style={{
              background: "var(--atl-sunken)",
              borderColor: "var(--atl-border-strong)",
              color: "var(--atl-subtle)",
            }}
          />

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Btn variant="primary" onClick={() => void verify()} disabled={busy || !text}>
              <ShieldCheck className="size-3.5" /> Verify
            </Btn>
            <label className="flex items-center gap-1.5 text-[12.5px]">
              <input
                type="checkbox"
                checked={requireHardware}
                onChange={(event) => setRequireHardware(event.target.checked)}
                className="size-3.5 accent-[color:var(--atl-blue)]"
              />
              require hardware root
            </label>
            <label className="flex items-center gap-1.5 text-[12.5px]">
              <input
                type="checkbox"
                checked={pin}
                onChange={(event) => setPin(event.target.checked)}
                className="size-3.5 accent-[color:var(--atl-blue)]"
              />
              pin the running measurement
            </label>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-[12px] font-semibold" style={{ color: "var(--atl-muted)" }}>
              Attack it:
            </span>
            <Btn size="sm" onClick={() => void attack("tamper")} disabled={busy || !selected}>
              <FlaskConical className="size-3.5" /> Edit one byte
            </Btn>
            <Btn size="sm" onClick={() => void attack("quote")} disabled={busy || !selected}>
              <FlaskConical className="size-3.5" /> Swap the quote
            </Btn>
          </div>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHead
              title="Verdict"
              right={
                elapsed !== null ? (
                  <span className="font-mono text-[11.5px]" style={{ color: "var(--atl-muted)" }}>
                    {elapsed.toFixed(1)} ms
                  </span>
                ) : undefined
              }
            />
            {note && (
              <p
                className="mb-2 rounded-[3px] border px-2.5 py-2 text-[12px] leading-relaxed"
                style={{
                  borderColor: "var(--atl-yellow-bg)",
                  background: "var(--atl-yellow-bg)",
                  color: "var(--atl-yellow)",
                }}
              >
                {note}
              </p>
            )}
            <VerdictGrid verdict={verdict} />
          </Card>

          <Card>
            <CardHead title="What a clean verdict does and does not mean" />
            <div className="space-y-2 text-[12.5px] leading-relaxed" style={{ color: "var(--atl-subtle)" }}>
              <p>
                <Lozenge tone="success" glyph>proves</Lozenge> the record&apos;s contents match its
                commitment, both signatures verify, the entry is in the log under a signed tree
                head, and the quote it names attests the key that signed it.
              </p>
              <p>
                <Lozenge tone="danger" glyph>does not prove</Lozenge> that the model&apos;s output was
                correct, fair, safe or compliant. CooL records what happened; it does not grade
                it.
              </p>
              <p>
                <Lozenge tone="teal" glyph>simulated</Lozenge> means the quote chains to a
                CooL-held root instead of Intel&apos;s. On this deployment that is always the case,
                and the verifier says so rather than rounding it up to a pass. Tick{" "}
                <em>require hardware root</em> to see a regulated deployment&apos;s posture: the
                same receipt stops being acceptable.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
