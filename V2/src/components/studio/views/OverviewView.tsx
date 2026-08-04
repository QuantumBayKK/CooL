"use client";

/**
 * Overview — what a regulated enterprise opens on Monday morning.
 *
 * The ordering is the argument: the numbers a platform team will challenge come
 * first (how much does capture cost, how much was dropped, does it all verify),
 * then the estate, then the live feed. Compliance coverage sits a click away in
 * Governance because it is the answer to a question nobody asks until an auditor
 * does.
 */
import { ArrowRight, Cpu, FileCheck2, Lock, Radio, ShieldCheck } from "lucide-react";
import { useStudio } from "../session";
import { SYSTEMS } from "@/lib/studio/scenario";
import {
  Btn,
  Card,
  CardHead,
  Dot,
  Hash,
  KeyValue,
  Lozenge,
  Row,
  StatTile,
  Table,
  Td,
  Th,
  relativeTime,
} from "../ui";

export default function OverviewView({ onView }: { onView: (view: "ledger" | "attestation" | "governance" | "verifier" | "models") => void }) {
  const { entries, stats, enclave, handshake, image } = useStudio();

  const changes = entries.filter((e) => e.kind === "change");
  const verified = entries.filter((e) => e.verdict?.ok).length;
  const passRate = entries.length === 0 ? 0 : Math.round((verified / entries.length) * 100);
  const treeSize = entries[0]?.receipt.sth?.tree_size ?? 0;
  const rejected = changes.filter(
    (e) => e.detail.kind === "change" && e.detail.decision === "rejected",
  );

  return (
    <div className="mx-auto max-w-[1180px] px-5 py-6">
      <header className="mb-5">
        <p className="text-[11px] font-bold tracking-[0.1em] uppercase" style={{ color: "var(--atl-muted)" }}>
          Evidence plane · confidential compute
        </p>
        <h1 className="mt-1 text-[24px] leading-tight font-semibold">
          Every AI change in the estate, already sealed inside a TEE.
        </h1>
        <p className="mt-1.5 max-w-3xl text-[13.5px] leading-relaxed" style={{ color: "var(--atl-subtle)" }}>
          The estate below is synthetic. Everything computed from it is not — each row is a
          receipt signed in this browser by the production evidence engine, bound to a
          measured enclave, and checked by the same verifier an auditor would run.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatTile label="Records sealed" value={entries.length} hint={`${changes.length} changes · ${entries.length - changes.length} inferences`} />
        <StatTile
          label="Verifies clean"
          value={`${passRate}%`}
          tone={passRate === 100 ? "success" : "warn"}
          hint="binding + signature + log inclusion"
        />
        <StatTile
          label="Capture p99"
          value={stats ? `${stats.p99Ms.toFixed(3)}ms` : "—"}
          tone="info"
          hint="on the caller's thread, measured"
        />
        <StatTile
          label="Events dropped"
          value={stats?.dropped ?? 0}
          tone={(stats?.dropped ?? 0) > 0 ? "warn" : "success"}
          hint="counted, never silent"
        />
        <StatTile label="Log tree size" value={treeSize} hint="RFC 6962 append-only" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        <Card>
          <CardHead
            title="Live activity"
            hint="Newest first. Every line was captured out-of-band and sealed inside the enclave."
            right={
              <Btn size="sm" variant="link" onClick={() => onView("ledger")}>
                Open ledger <ArrowRight className="size-3.5" />
              </Btn>
            }
          />
          <div className="-mx-1">
            {entries.slice(0, 9).map((entry) => (
              <div
                key={entry.id}
                className={`flex min-w-0 items-center gap-2.5 overflow-hidden border-b px-1 py-[7px] last:border-0 ${entry.fresh ? "studio-flash" : ""}`}
                style={{ borderColor: "var(--atl-border)" }}
              >
                <Dot tone={entry.verdict?.ok ? "success" : "danger"} />
                <span className="w-[76px] shrink-0 text-[12px]" style={{ color: "var(--atl-muted)" }}>
                  {relativeTime(entry.at)}
                </span>
                <span className="shrink-0">
                  <Lozenge tone={entry.kind === "change" ? "purple" : "info"}>{entry.kind}</Lozenge>
                </span>
                <span className="min-w-0 flex-1 truncate text-[13px]">{entry.label}</span>
                <span className="hidden truncate text-[12px] sm:block" style={{ color: "var(--atl-muted)" }}>
                  {entry.system}
                </span>
                <Hash value={entry.receipt.binding_hash} chars={8} />
              </div>
            ))}
          </div>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHead
              title="Where this ran"
              right={
                <Btn size="sm" variant="link" onClick={() => onView("attestation")}>
                  Attestation
                </Btn>
              }
            />
            <div className="space-y-0.5">
              <KeyValue
                k="Silicon"
                v={
                  <span className="inline-flex items-center gap-1.5">
                    <Cpu className="size-3.5" /> {enclave?.vendor ?? "—"}
                  </span>
                }
              />
              <KeyValue
                k="Attestation"
                v={<Lozenge tone="teal" glyph>{enclave?.mode ?? "—"}</Lozenge>}
              />
              <KeyValue k="MRTD" v={enclave ? <Hash value={enclave.measurement.mrtd} chars={14} /> : "—"} />
              <KeyValue k="RTMR3" v={enclave ? <Hash value={enclave.measurement.rtmr3} chars={14} /> : "—"} />
              <KeyValue k="Image" v={<span className="font-mono text-[11.5px]">{image.slice(0, 26)}…</span>} />
              <KeyValue
                k="RA-TLS"
                v={
                  handshake?.ok ? (
                    <Lozenge tone="success" glyph>channel open</Lozenge>
                  ) : (
                    <Lozenge tone="danger" glyph>closed</Lozenge>
                  )
                }
              />
            </div>
            <p className="mt-3 text-[12px] leading-relaxed" style={{ color: "var(--atl-muted)" }}>
              The signing key is derived from that measurement by dstack-KMS. Ship different
              code and the key changes — which is why CooL cannot forge one of these records.
            </p>
          </Card>

          <Card>
            <CardHead title="Needs a human" hint="Policy decisions the engine would not make alone" />
            {rejected.length === 0 ? (
              <p className="text-[13px]" style={{ color: "var(--atl-muted)" }}>
                Nothing waiting.
              </p>
            ) : (
              rejected.map((entry) => (
                <div key={entry.id} className="flex items-center gap-2 py-1">
                  <Lozenge tone="danger" glyph>rejected</Lozenge>
                  <span className="min-w-0 flex-1 truncate text-[13px]">{entry.label}</span>
                  <Btn size="sm" variant="subtle" onClick={() => onView("governance")}>
                    Review
                  </Btn>
                </div>
              ))
            )}
          </Card>
        </div>
      </div>

      <Card className="mt-4">
        <CardHead
          title="The estate"
          hint="Four systems, three of them high-risk. Records are counted from this session."
        />
        <Table
          head={
            <>
              <Th>System</Th>
              <Th>Owner</Th>
              <Th>Risk tier</Th>
              <Th>Regimes</Th>
              <Th>Records</Th>
              <Th>Last activity</Th>
            </>
          }
        >
          {SYSTEMS.map((system) => {
            const mine = entries.filter((e) => e.system === system.id);
            const last = mine[0];
            return (
              <Row key={system.id} onClick={() => onView("ledger")}>
                <Td>
                  <span className="font-medium">{system.name}</span>
                  <span className="ml-2 font-mono text-[11.5px]" style={{ color: "var(--atl-muted)" }}>
                    {system.id}
                  </span>
                </Td>
                <Td>{system.owner}</Td>
                <Td>
                  <Lozenge tone={system.riskTier === "high" ? "warn" : system.riskTier === "limited" ? "info" : "neutral"}>
                    {system.riskTier}
                  </Lozenge>
                </Td>
                <Td>
                  <span className="text-[12px]" style={{ color: "var(--atl-subtle)" }}>
                    {system.regimes.join(" · ")}
                  </span>
                </Td>
                <Td mono>{mine.length}</Td>
                <Td nowrap>{last ? relativeTime(last.at) : "—"}</Td>
              </Row>
            );
          })}
        </Table>
      </Card>

      <Card className="mt-4">
        <CardHead title="The path every event takes" hint="Nothing here is a diagram of intent — each stage is a module you can open." />
        <div className="grid gap-2 md:grid-cols-5">
          {[
            { icon: Radio, title: "Capture", body: "async, fail-open queue in your app. p99 " + (stats ? stats.p99Ms.toFixed(3) : "—") + " ms." },
            { icon: Lock, title: "RA-TLS", body: "SDK verifies the enclave quote before it transmits anything." },
            { icon: ShieldCheck, title: "Seal", body: "hash → hybrid-sign with a measurement-sealed key, inside the TEE." },
            { icon: FileCheck2, title: "Log", body: "append to an RFC 6962 tree; take an inclusion proof + STH." },
            { icon: Cpu, title: "Verify", body: "anyone, offline, without trusting CooL or Phala." },
          ].map((stage, index) => {
            const Icon = stage.icon;
            return (
              <div
                key={stage.title}
                className="rounded-[3px] border p-3"
                style={{ borderColor: "var(--atl-border)", background: "var(--atl-raised)" }}
              >
                <div className="flex items-center gap-2">
                  <Icon className="size-4" style={{ color: "var(--atl-blue)" }} />
                  <span className="text-[13px] font-semibold">{index + 1}. {stage.title}</span>
                </div>
                <p className="mt-1.5 text-[12px] leading-snug" style={{ color: "var(--atl-muted)" }}>
                  {stage.body}
                </p>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
