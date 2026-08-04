"use client";

/**
 * Governance — the work CooL is actually replacing.
 *
 * Nobody buys a transparency log. They buy the fortnight an engineer spends
 * assembling an evidence pack, and the meeting where somebody asks who approved
 * the refund ceiling change. So this view is deliberately unglamorous: policies,
 * decisions, obligations, and one button that produces the artefact an auditor
 * asked for — built from receipts that already exist rather than from a report
 * somebody writes afterwards.
 *
 * The coverage numbers are computed from the ledger, not asserted. If a regime
 * has no evidence behind it, it shows zero.
 */
import { useMemo, useState } from "react";
import { Download, FileText, Gavel } from "lucide-react";
import { useStudio } from "../session";
import { OBLIGATIONS, SYSTEMS } from "@/lib/studio/scenario";
import {
  Avatar,
  Btn,
  Card,
  CardHead,
  Lozenge,
  Meter,
  Row,
  Table,
  Td,
  Th,
  relativeTime,
} from "../ui";

const POLICIES = [
  {
    id: "POL-002",
    name: "Model & prompt changes in production",
    rule: "Two approvers from the owning team. No exceptions for high-risk systems.",
    kinds: ["model", "prompt", "policy"],
  },
  {
    id: "POL-008",
    name: "Inference parameters and reference data",
    rule: "Auto-approve outside production. In production, compliance signs off.",
    kinds: ["params", "dataset"],
  },
  {
    id: "POL-014",
    name: "Customer-facing prompt copy",
    rule: "Two approvers in production; staging is automatic.",
    kinds: ["prompt"],
  },
  {
    id: "POL-031",
    name: "Agent permissions and tools",
    rule: "Widening what an agent may do is never automatic, in any environment.",
    kinds: ["agent-permission", "tool"],
  },
] as const;

export default function GovernanceView() {
  const { entries, enclave } = useStudio();
  const [exported, setExported] = useState<number | null>(null);

  const changes = useMemo(
    () => entries.filter((entry) => entry.detail.kind === "change"),
    [entries],
  );

  const coverage = useMemo(() => {
    const inferences = entries.filter((entry) => entry.kind === "inference").length;
    const approved = changes.filter(
      (entry) => entry.detail.kind === "change" && entry.detail.approvers.length > 0,
    ).length;
    const modelish = changes.filter(
      (entry) =>
        entry.detail.kind === "change" &&
        ["model", "params", "dataset"].includes(entry.detail.changeKind),
    ).length;
    const sealed = entries.filter((entry) => entry.receipt.record.runtime.tee_quote !== null).length;
    const logged = entries.filter((entry) => entry.receipt.inclusion !== null).length;
    return {
      "eu-ai-act-12": inferences,
      "eu-ai-act-14": approved,
      "eu-ai-act-15": modelish,
      "dpdp-8": sealed,
      "iso-42001-9": logged,
      "rbi-dlg": inferences,
    } as Record<string, number>;
  }, [entries, changes]);

  /**
   * The audit pack.
   *
   * Everything an outside reader needs and nothing they have to trust us for:
   * the receipts, the key directory, the pinned measurement, and the mapping
   * from clauses to the field that satisfies them. It is generated from the
   * ledger at the moment of export, so it cannot describe evidence that is not
   * in it.
   */
  const exportPack = () => {
    const pack = {
      schema: "cool.audit-pack.v1",
      generated_at: new Date().toISOString(),
      subject: "Demo Enterprise Pvt. Ltd. — synthetic estate",
      enclave: enclave
        ? {
            vendor: enclave.vendor,
            mode: enclave.mode,
            app_id: enclave.appId,
            instance_id: enclave.instanceId,
            measurement: enclave.measurement,
          }
        : null,
      systems: SYSTEMS,
      obligations: OBLIGATIONS.map((obligation) => ({
        ...obligation,
        records_covering: coverage[obligation.id] ?? 0,
      })),
      records: entries.map((entry) => ({
        record_id: entry.id,
        kind: entry.kind,
        subject: entry.label,
        system: entry.system,
        environment: entry.environment,
        sealed_at: new Date(entry.at).toISOString(),
        verdict: entry.verdict
          ? { ok: entry.verdict.ok, checks: entry.verdict.checks }
          : null,
        receipt: entry.receipt,
      })),
      how_to_verify:
        "npx @northwindcipher/cool-verifier verify --pack cool-audit-pack.json — recomputes every commitment, both signatures, the Merkle path and the enclave binding, offline.",
    };
    const blob = new Blob([JSON.stringify(pack, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "cool-audit-pack.json";
    anchor.click();
    URL.revokeObjectURL(url);
    setExported(entries.length);
  };

  return (
    <div className="mx-auto max-w-[1180px] px-5 py-6">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold">Governance</h1>
          <p className="mt-1 max-w-3xl text-[13.5px] leading-relaxed" style={{ color: "var(--atl-subtle)" }}>
            Policy decisions are evaluated where the record is sealed, so an approval lives
            inside the signature rather than beside it in a wiki.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {exported !== null && (
            <span className="text-[12px]" style={{ color: "var(--atl-green)" }}>
              ✓ {exported} records exported
            </span>
          )}
          <Btn variant="primary" onClick={exportPack}>
            <Download className="size-3.5" /> Export audit pack
          </Btn>
        </div>
      </header>

      <Card>
        <CardHead
          title="Obligations"
          hint="Each row names the receipt field that satisfies it. Coverage is counted from this session's ledger."
        />
        <Table
          head={
            <>
              <Th width="150px">Regime</Th>
              <Th>Clause</Th>
              <Th>Satisfied by</Th>
              <Th width="140px">Coverage</Th>
            </>
          }
        >
          {OBLIGATIONS.map((obligation) => {
            const count = coverage[obligation.id] ?? 0;
            const ratio = entries.length === 0 ? 0 : Math.min(1, count / Math.max(1, entries.length));
            return (
              <Row key={obligation.id}>
                <Td nowrap>
                  <span className="font-medium">{obligation.regime}</span>
                </Td>
                <Td>
                  <span className="font-medium">{obligation.clause}</span>
                  <p className="mt-0.5 text-[11.5px]" style={{ color: "var(--atl-muted)" }}>
                    {obligation.requirement}
                  </p>
                </Td>
                <Td>
                  <span className="text-[12px]" style={{ color: "var(--atl-subtle)" }}>
                    {obligation.satisfiedBy}
                  </span>
                </Td>
                <Td>
                  <div className="flex items-center gap-2">
                    <div className="w-16">
                      <Meter value={ratio} tone={count > 0 ? "success" : "warn"} />
                    </div>
                    <span className="font-mono text-[12px]">{count}</span>
                  </div>
                </Td>
              </Row>
            );
          })}
        </Table>
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1.1fr]">
        <Card>
          <CardHead title="Policies" hint="Evaluated inside the enclave, attached to the record" />
          <div className="space-y-2">
            {POLICIES.map((policy) => {
              const applied = changes.filter(
                (entry) =>
                  entry.detail.kind === "change" &&
                  (policy.kinds as readonly string[]).includes(entry.detail.changeKind),
              );
              return (
                <div
                  key={policy.id}
                  className="rounded-[3px] border p-2.5"
                  style={{ borderColor: "var(--atl-border)", background: "var(--atl-raised)" }}
                >
                  <div className="flex items-center gap-2">
                    <Gavel className="size-3.5" style={{ color: "var(--atl-purple)" }} />
                    <span className="font-mono text-[12px] font-semibold">{policy.id}</span>
                    <span className="text-[13px] font-medium">{policy.name}</span>
                    <span className="ml-auto text-[11.5px]" style={{ color: "var(--atl-muted)" }}>
                      {applied.length} applied
                    </span>
                  </div>
                  <p className="mt-1 text-[12px]" style={{ color: "var(--atl-muted)" }}>
                    {policy.rule}
                  </p>
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <CardHead
            title="Decisions"
            hint="Who signed off on what — read straight out of the sealed records"
          />
          <div className="space-y-1.5">
            {changes.map((entry) => {
              if (entry.detail.kind !== "change") return null;
              const decision = entry.detail.decision;
              return (
                <div
                  key={entry.id}
                  className="flex flex-wrap items-center gap-2 border-b py-1.5 last:border-0"
                  style={{ borderColor: "var(--atl-border)" }}
                >
                  <Lozenge
                    tone={
                      decision === "rejected" ? "danger" : decision === "approved" ? "success" : "neutral"
                    }
                    glyph
                  >
                    {decision}
                  </Lozenge>
                  <span className="min-w-0 flex-1 truncate text-[12.5px]">{entry.label}</span>
                  <div className="flex -space-x-1.5">
                    {entry.detail.approvers.slice(0, 3).map((approver) => (
                      <Avatar key={approver} id={approver} size={20} />
                    ))}
                    {entry.detail.approvers.length === 0 && (
                      <span className="text-[11.5px]" style={{ color: "var(--atl-muted)" }}>
                        no human needed
                      </span>
                    )}
                  </div>
                  <span className="w-[64px] shrink-0 text-right text-[11.5px]" style={{ color: "var(--atl-muted)" }}>
                    {relativeTime(entry.at)}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHead title="What the export contains" />
        <div className="grid gap-3 text-[12.5px] leading-relaxed md:grid-cols-3" style={{ color: "var(--atl-subtle)" }}>
          <div className="flex gap-2">
            <FileText className="mt-[2px] size-4 shrink-0" style={{ color: "var(--atl-blue)" }} />
            <span>
              <strong>Every receipt</strong>, complete with its key directory — so the pack
              verifies without contacting anyone.
            </span>
          </div>
          <div className="flex gap-2">
            <FileText className="mt-[2px] size-4 shrink-0" style={{ color: "var(--atl-blue)" }} />
            <span>
              <strong>The enclave measurement</strong> the deployment pinned, so a reader can
              check the code was the approved code.
            </span>
          </div>
          <div className="flex gap-2">
            <FileText className="mt-[2px] size-4 shrink-0" style={{ color: "var(--atl-blue)" }} />
            <span>
              <strong>The clause mapping</strong> above, with the count of records behind each
              obligation. No prose, nothing to draft.
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
