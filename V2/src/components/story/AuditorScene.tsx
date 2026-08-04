"use client";

/**
 * Act nine — the same evidence, read by the other reader.
 *
 * An engineer wants to know what changed. An auditor wants to know whether an
 * obligation was met, and cannot use a change feed to answer that. So this is
 * the same records, pivoted: obligations down the side, evidence behind each
 * one, and a count that is computed by `coverage()` from the receipts actually
 * in the log rather than typed in.
 *
 * That last part is what makes the export worth anything. Every obligation row
 * is a predicate over receipts — `record.change.approval !== null`, and so on —
 * evaluated at render time. If nothing satisfies a clause the row says zero and
 * the pack ships with it saying zero, because a compliance report that cannot
 * come back empty is not a report.
 *
 * The export is a JSON audit pack, not a PDF. A PDF is a picture of evidence; a
 * pack is the evidence, and it carries the command that checks it. When a
 * regulator's own verifier can re-derive every claim in the file without
 * running any CooL code, "trust the vendor's report" stops being part of the
 * process.
 */
import { useCallback, useMemo, useState } from "react";
import { Download, FileCheck2 } from "lucide-react";
import { buildAuditPack, coverage, verifyAuditPack } from "@/lib/cool/phala";
import type { PackVerdict } from "@/lib/cool/phala";
import { REPO } from "@/lib/story/script";
import { useStory } from "./session";
import { Button, Label, Panel, Pill } from "./ui";

export function AuditorScene() {
  const { rows, enclave } = useStory();
  const [checked, setChecked] = useState<PackVerdict | null>(null);
  const [busy, setBusy] = useState(false);

  const receipts = useMemo(() => rows.map((r) => r.receipt), [rows]);
  const rowsOfCoverage = useMemo(() => coverage(receipts), [receipts]);

  const pack = useMemo(
    () =>
      buildAuditPack(receipts, {
        subject: `${REPO.name} · ${REPO.environment}`,
        ...(enclave
          ? {
              enclave: {
                vendor: enclave.vendor,
                mode: "simulated",
                app_id: enclave.appId,
                measurement: enclave.measurement,
              },
            }
          : {}),
      }),
    [receipts, enclave],
  );

  const required = rowsOfCoverage.length;
  const met = rowsOfCoverage.filter((r) => r.covered).length;
  const missing = required - met;

  const download = useCallback(() => {
    const blob = new Blob([JSON.stringify(pack, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "audit-pack.json";
    a.click();
    URL.revokeObjectURL(url);
  }, [pack]);

  /** Verify the pack we just built, with the function that ships to the auditor. */
  const check = useCallback(async () => {
    setBusy(true);
    setChecked(await verifyAuditPack(pack));
    setBusy(false);
  }, [pack]);

  return (
    <div className="thin-scroll flex h-full min-h-0 flex-col gap-4 overflow-y-auto pr-1">
      {/* the three numbers an auditor opens with */}
      <div className="grid grid-cols-3 gap-2.5">
        {[
          { value: required, label: "Obligations in scope", tone: "mock" as const },
          { value: met, label: "Evidenced", tone: "live" as const },
          { value: missing, label: "Gaps", tone: missing === 0 ? ("live" as const) : ("warn" as const) },
        ].map((tile) => (
          <Panel key={tile.label} className="p-3.5">
            <div
              className="font-mono text-[26px] leading-none"
              style={{
                color:
                  tile.tone === "live"
                    ? "var(--color-live)"
                    : tile.tone === "warn"
                      ? "var(--color-warn)"
                      : "var(--color-ink)",
              }}
            >
              {tile.value}
            </div>
            <div className="mt-2 text-[12px] text-fog">{tile.label}</div>
          </Panel>
        ))}
      </div>

      {/* obligations */}
      <div>
        <div className="mb-2 flex items-baseline justify-between">
          <Label>Compliance register</Label>
          <span className="text-[11px] text-mist">
            counted from {receipts.length} receipts, at render time
          </span>
        </div>
        <Panel className="overflow-hidden">
          {rowsOfCoverage.map((row, index) => (
            <div
              key={row.obligation.id}
              className={`flex flex-wrap items-start gap-x-3 gap-y-1.5 px-4 py-3 ${
                index > 0 ? "border-t border-line" : ""
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[12.5px] font-medium text-ink">
                    {row.obligation.regime}
                  </span>
                  <span className="font-mono text-[11px] text-mist">{row.obligation.clause}</span>
                </div>
                <p className="mt-1 text-[11.5px] leading-relaxed text-mist">
                  {row.obligation.requirement}
                </p>
                <p className="mt-1 font-mono text-[11px] text-fog">
                  satisfied by: {row.obligation.satisfiedBy}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="font-mono text-[11.5px] text-mist">
                  {row.records} record{row.records === 1 ? "" : "s"}
                </span>
                <Pill tone={row.covered ? "live" : "warn"}>{row.covered ? "evidenced" : "gap"}</Pill>
              </div>
            </div>
          ))}
        </Panel>
      </div>

      {/* export */}
      <Panel className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <Label>Export</Label>
            <p className="mt-2 max-w-prose text-[12px] leading-relaxed text-mist">
              One file: every receipt, the obligation mapping, the enclave the records were
              produced in, and the keys a verifier needs. It is checked with{" "}
              <code className="font-mono text-fog">cool pack verify</code> — offline, by the
              recipient, without an account or an API call.
            </p>
            <p className="mt-1.5 text-[11.5px] text-mist">
              {pack.records.length} records · {pack.obligations.length} obligations ·{" "}
              {(JSON.stringify(pack).length / 1024).toFixed(1)} kB
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-2">
            <Button tone="primary" onClick={download}>
              <Download size={13} /> audit-pack.json
            </Button>
            <Button size="sm" onClick={check} disabled={busy}>
              <FileCheck2 size={13} /> {busy ? "verifying…" : "Verify the pack"}
            </Button>
          </div>
        </div>

        {checked && (
          <div className="mt-3 border-t border-line pt-3">
            <div className="flex flex-wrap items-center gap-3">
              <Pill tone={checked.ok ? "live" : "fail"}>{checked.ok ? "pack valid" : "pack invalid"}</Pill>
              <span className="font-mono text-[11.5px] text-mist">
                {checked.total} records checked
              </span>
            </div>
          </div>
        )}
      </Panel>
    </div>
  );
}
