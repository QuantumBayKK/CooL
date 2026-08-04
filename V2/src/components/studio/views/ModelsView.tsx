"use client";

/**
 * Models & GPU — the "which model actually ran" view.
 *
 * The catalogue is Phala's confidential inference endpoint; the GPU shapes are
 * its marketplace. What matters here is the panel at the bottom: run something,
 * and watch the resulting record carry a model identity, a weights commitment
 * and — when the confidential GPU is on — an attestation reference for the
 * serving stack itself.
 *
 * The limits are printed next to the result rather than in a footnote, because
 * this is exactly where an evidence product is tempted to overclaim: attestation
 * binds the serving stack, not the weights, unless the provider publishes a
 * weights digest too.
 */
import { useState } from "react";
import { Cpu, Play, Server } from "lucide-react";
import { PHALA_GPUS, PHALA_MODELS } from "@/lib/cool/phala";
import { useStudio, type LedgerEntry } from "../session";
import { SYSTEMS } from "@/lib/studio/scenario";
import {
  Btn,
  Card,
  CardHead,
  Hash,
  KeyValue,
  Lozenge,
  Row,
  Select,
  Table,
  Td,
  Th,
  TextArea,
} from "../ui";
import { VerdictGrid } from "./VerdictGrid";

export default function ModelsView() {
  const { runInference, entries } = useStudio();
  const [model, setModel] = useState("phala/deepseek-v4-pro@2026.07");
  const [system, setSystem] = useState(SYSTEMS[0]!.id);
  const [gpu, setGpu] = useState(true);
  const [prompt, setPrompt] = useState(
    "Assess application A-40207. Bureau summary attached. Requested limit ₹2,50,000.",
  );
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<LedgerEntry | null>(null);

  const run = async () => {
    setBusy(true);
    const entry = await runInference({ system, model, prompt, gpu });
    setResult(entry);
    setBusy(false);
  };

  const gpuRuns = entries.filter(
    (entry) => entry.kind === "inference" && entry.receipt.record.runtime.gpu !== null,
  ).length;

  return (
    <div className="mx-auto max-w-[1180px] px-5 py-6">
      <header className="mb-5">
        <h1 className="text-[22px] font-semibold">Models &amp; GPU</h1>
        <p className="mt-1 max-w-3xl text-[13.5px] leading-relaxed" style={{ color: "var(--atl-subtle)" }}>
          CooL does not serve models. It records which one served a request, on what silicon,
          and binds that claim into the same signature as everything else in the record.
        </p>
      </header>

      <Card>
        <CardHead
          title="Confidential inference — run one and look at the record"
          hint="The completion below is a local echo; there is no model in this browser. Everything downstream of it is the production path."
        />
        <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <TextArea label="Prompt" value={prompt} onChange={setPrompt} rows={5} />
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Select
                label="Model"
                value={model}
                onChange={setModel}
                options={PHALA_MODELS.map((m) => ({
                  value: `phala/${m.id.split("/")[1]}@2026.07`,
                  label: `${m.vendor} · ${m.label}`,
                }))}
              />
              <Select
                label="System"
                value={system}
                onChange={setSystem}
                options={SYSTEMS.map((s) => ({ value: s.id, label: s.name }))}
              />
            </div>
            <label className="mt-3 flex items-center gap-2 text-[13px]">
              <input
                type="checkbox"
                checked={gpu}
                onChange={(event) => setGpu(event.target.checked)}
                className="size-3.5 accent-[color:var(--atl-blue)]"
              />
              Serve on a confidential GPU (NVIDIA CC) and bind its attestation into the record
            </label>
            <div className="mt-3 flex items-center gap-2">
              <Btn variant="primary" onClick={() => void run()} disabled={busy}>
                <Play className="size-3.5" /> {busy ? "Sealing…" : "Run & seal"}
              </Btn>
              <span className="text-[12px]" style={{ color: "var(--atl-muted)" }}>
                {gpuRuns} of {entries.filter((e) => e.kind === "inference").length} inferences in
                this session carry a GPU attestation.
              </span>
            </div>
          </div>

          <div>
            {result ? (
              <>
                <div className="mb-2 space-y-0.5">
                  <KeyValue
                    k="Model"
                    v={
                      result.receipt.record.schema === "cool.inference.v2"
                        ? `${result.receipt.record.model.id}@${result.receipt.record.model.version}`
                        : "—"
                    }
                  />
                  <KeyValue
                    k="weights_hash"
                    v={
                      result.receipt.record.schema === "cool.inference.v2" ? (
                        <Hash value={result.receipt.record.model.weights_hash} chars={16} />
                      ) : (
                        "—"
                      )
                    }
                  />
                  <KeyValue
                    k="GPU evidence"
                    v={
                      result.receipt.record.runtime.gpu ? (
                        <Hash value={result.receipt.record.runtime.gpu.evidence_hash} chars={16} />
                      ) : (
                        "not served on a GPU TEE"
                      )
                    }
                  />
                  <KeyValue
                    k="GPU verdict"
                    v={
                      result.receipt.record.runtime.gpu ? (
                        <Lozenge tone="teal" glyph>
                          {result.receipt.record.runtime.gpu.verdict}
                        </Lozenge>
                      ) : (
                        "—"
                      )
                    }
                  />
                </div>
                <VerdictGrid verdict={result.verdict} compact />
              </>
            ) : (
              <div
                className="grid h-full min-h-[220px] place-items-center rounded-[3px] border border-dashed px-4 text-center text-[12.5px]"
                style={{ borderColor: "var(--atl-border-strong)", color: "var(--atl-muted)" }}
              >
                Run one and the sealed record appears here, with its verdict.
              </div>
            )}
          </div>
        </div>

        <p
          className="mt-3 rounded-[3px] border px-3 py-2 text-[12px] leading-relaxed"
          style={{ borderColor: "var(--atl-border)", background: "var(--atl-raised)", color: "var(--atl-subtle)" }}
        >
          <strong>What a GPU attestation proves:</strong> that the serving stack ran in a
          confidential GPU environment that attested to itself. <strong>What it does not:</strong>{" "}
          which weights were loaded — unless the provider publishes a weights digest, which is
          why <code>weights_hash</code> is labelled when it is a placeholder. Turning the
          verdict from <em>simulated</em> into <em>verified</em> takes an NRAS round-trip, and
          the record says which one it got.
        </p>
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHead
            title="Private LLM catalogue"
            hint="Phala's OpenAI-compatible confidential endpoint. Prompts stay inside the TEE."
          />
          <Table
            head={
              <>
                <Th>Model</Th>
                <Th>Vendor</Th>
                <Th>Context</Th>
                <Th>Input / M</Th>
              </>
            }
          >
            {PHALA_MODELS.map((m) => (
              <Row
                key={m.id}
                onClick={() => setModel(`phala/${m.id.split("/")[1]}@2026.07`)}
                active={model.includes(m.id.split("/")[1] ?? "")}
              >
                <Td>
                  <span className="font-medium">{m.label}</span>
                  <span className="ml-2 font-mono text-[11.5px]" style={{ color: "var(--atl-muted)" }}>
                    {m.id}
                  </span>
                </Td>
                <Td>{m.vendor}</Td>
                <Td mono>{(m.context / 1000).toFixed(0)}K</Td>
                <Td mono>${m.inputPrice.toFixed(2)}</Td>
              </Row>
            ))}
          </Table>
        </Card>

        <Card>
          <CardHead title="Confidential GPU" hint="Intel TDX for the VM, NVIDIA CC for the accelerator" />
          <div className="space-y-2">
            {PHALA_GPUS.map((shape) => (
              <div
                key={shape.model}
                className="flex items-center justify-between gap-3 rounded-[3px] border p-2.5"
                style={{ borderColor: "var(--atl-border)", background: "var(--atl-raised)" }}
              >
                <div className="flex items-center gap-2.5">
                  <Server className="size-4" style={{ color: "var(--atl-blue)" }} />
                  <div>
                    <p className="text-[13px] font-semibold">{shape.model}</p>
                    <p className="text-[11.5px]" style={{ color: "var(--atl-muted)" }}>
                      {shape.vram} · {shape.vcpu} vCPU · {shape.stack}
                    </p>
                  </div>
                </div>
                <span className="font-mono text-[12.5px]">${shape.hourly.toFixed(2)}/hr</span>
              </div>
            ))}
          </div>
          <p className="mt-3 flex gap-2 text-[12px] leading-relaxed" style={{ color: "var(--atl-muted)" }}>
            <Cpu className="mt-[2px] size-3.5 shrink-0" />
            The same record format covers all three. Moving between vendors changes the quote
            format and nothing else in the evidence.
          </p>
        </Card>
      </div>
    </div>
  );
}
