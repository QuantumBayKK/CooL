import type { Metadata } from "next";
import Link from "next/link";

import { ArchitectureDiagram } from "@/components/diagrams/ArchitectureDiagram";
import { GateSummary } from "@/components/security/GateLadder";
import { Button } from "@/components/ui/button";
import { CodeBlock } from "@/components/ui/code";
import {
  Card,
  Container,
  Eyebrow,
  Section,
  SectionHeader,
  StatusBadge,
  type Status,
} from "@/components/ui/primitives";
import { GATES } from "@/content/gates";

export const metadata: Metadata = {
  title: "Security model",
  description:
    "CooL's threat model, trust boundaries, the seven verification domains, and a plain list of what the system cannot prove today.",
  alternates: { canonical: "/security" },
};

/* ── the seven domains ────────────────────────────────────────────────────── */

const DOMAINS: readonly {
  name: string;
  verdict: "pass" | "simulated" | "absent";
  what: string;
  how: string;
}[] = [
  {
    name: "canonical",
    verdict: "pass",
    what: "The record serialises deterministically.",
    how: "Re-encodes the core as CDE CBOR and compares bytes. Two implementations must agree exactly, or the digest below means nothing.",
  },
  {
    name: "binding",
    verdict: "pass",
    what: "The digest matches the record.",
    how: "SHA-256 over the canonical bytes. Alter one byte of the record and this fails.",
  },
  {
    name: "signature",
    verdict: "pass",
    what: "The record was signed by the pinned key.",
    how: "ML-DSA-65 (FIPS 204) and Ed25519, both required. A forger needs to break both, and one of them is post-quantum.",
  },
  {
    name: "inclusion",
    verdict: "pass",
    what: "The record is in the log at the position claimed.",
    how: "RFC 6962 audit path recomputed to the signed tree head.",
  },
  {
    name: "consistency",
    verdict: "pass",
    what: "The log only ever grew.",
    how: "Consistency proof between two tree heads. Catches a log that dropped or rewrote history between observations.",
  },
  {
    name: "attestation",
    verdict: "simulated",
    what: "Where the record was produced.",
    how: "No TDX in the loop yet, so this domain reports simulated and can never report pass. The rule is in the verifier — nothing in any UI can reach it.",
  },
  {
    name: "witnesses",
    verdict: "absent",
    what: "An independent party saw the same log.",
    how: "Not built. A log signed only by our keys is not tamper-evident against us, and no amount of hardware substitutes for a second signer.",
  },
];

const VERDICT_TONE: Record<string, Status> = {
  pass: "ok",
  simulated: "warn",
  absent: "neutral",
};

export default function SecurityPage() {
  return (
    <>
      <Section bordered={false}>
        <Container>
          <SectionHeader
            as="h1"
            eyebrow="Security model"
            title="What this proves, and what it does not."
            lead="Seven verification domains, checked independently and reported separately. Two of them do not pass today, and they are named here rather than averaged into a single green tick."
          />
          <div className="mt-8">
            <GateSummary gates={GATES} />
          </div>
        </Container>
      </Section>

      {/* ── the domains ─────────────────────────────────────────────────── */}
      <Section tone="surface">
        <Container>
          <SectionHeader
            eyebrow="The seven domains"
            title="A verdict per property, never a single tick."
            lead="A verifier that returns one boolean forces you to trust its weighting. This one reports each property separately, so you can decide which ones you actually need."
          />

          <ul className="mt-10 border-t border-line">
            {DOMAINS.map((d) => (
              <li
                key={d.name}
                className="grid gap-2 border-b border-line py-4 sm:grid-cols-[minmax(0,9rem)_minmax(0,1fr)_auto] sm:items-start sm:gap-6"
              >
                <code className="font-mono text-sm text-ink">{d.name}</code>
                <div>
                  <p className="text-sm text-ink">{d.what}</p>
                  <p className="mt-1 max-w-[68ch] text-xs text-ink-subtle">
                    {d.how}
                  </p>
                </div>
                <StatusBadge
                  status={VERDICT_TONE[d.verdict] ?? "neutral"}
                  className="justify-self-start sm:justify-self-end"
                >
                  {d.verdict}
                </StatusBadge>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      {/* ── what is simulated ───────────────────────────────────────────── */}
      <Section id="simulated">
        <Container>
          <SectionHeader
            eyebrow="Full disclosure"
            title="The two that do not pass."
            lead="Both are enforced in the verifier rather than stated in copy. You can confirm that yourself in about thirty seconds."
          />

          <div className="mt-10 grid gap-px bg-line lg:grid-cols-2">
            <div className="bg-canvas p-6">
              <StatusBadge status="warn">attestation · simulated</StatusBadge>
              <h3 className="mt-4 text-h3">
                We cannot prove where a record was produced.
              </h3>
              <p className="mt-3 text-sm text-ink-muted">
                The measurement and quote machinery is built and exercised
                against a simulator, but no Intel TDX root has signed anything.
                Until a real CVM does, this domain reports{" "}
                <code className="font-mono text-[0.8125rem]">simulated</code>.
              </p>
              <p className="mt-3 text-sm text-ink-muted">
                Run the verifier with{" "}
                <code className="font-mono text-[0.8125rem]">--require-hardware</code>{" "}
                against a record this site sealed a minute ago and it{" "}
                <strong className="text-ink">refuses</strong>. That refusal is
                the most useful thing on the site: a demo that could only ever
                go green would prove nothing about the gate.
              </p>
            </div>

            <div className="bg-canvas p-6">
              <StatusBadge status="neutral">witnesses · absent</StatusBadge>
              <h3 className="mt-4 text-h3">
                The log is signed only by us.
              </h3>
              <p className="mt-3 text-sm text-ink-muted">
                A transparency log signed solely by its operator is
                tamper-evident against outsiders and{" "}
                <strong className="text-ink">not against the operator</strong>.
                Against a determined insider at CooL, today, the log is not
                sufficient on its own.
              </p>
              <p className="mt-3 text-sm text-ink-muted">
                The fix is an independent co-signer who is neither CooL nor our
                hardware vendor. It sits on Gate 2, it is not built, and a CooL
                self-signature is shown but never counted as a witness — that
                rule is in the verifier too.
              </p>
            </div>
          </div>

          <Card className="mt-8 p-6">
            <Eyebrow>Check it in thirty seconds</Eyebrow>
            <div className="mt-4">
              <CodeBlock
                lang="bash"
                code={`npm install -g cool-nwc

# seal something, then demand a hardware root
cool verify ./change-receipt.json --require-hardware

  REFUSED   attestation: simulated
  policy: requireHardware is set and this receipt is
          not backed by a verified hardware quote`}
              />
            </div>
          </Card>
        </Container>
      </Section>

      {/* ── boundaries ──────────────────────────────────────────────────── */}
      <Section tone="surface">
        <Container>
          <SectionHeader
            eyebrow="Trust boundaries"
            title="Your evidence never crosses into our network."
            lead="Control plane is ours; data plane is yours. The split is architectural — there is no configuration flag that turns it off, because there is no code path that would honour one."
          />
          <div className="mt-10">
            <ArchitectureDiagram />
          </div>

          <div className="mt-8 grid gap-px bg-line sm:grid-cols-3">
            {[
              {
                t: "No signing key we hold",
                b: "Keys are derived inside the enclave from the measurement. There is no key escrow, which is why we cannot forge your records even under legal compulsion.",
              },
              {
                t: "Fail-open toward you",
                b: "If CooL is unreachable your inference continues. Capture queues; what it cannot queue is counted and the count is itself signed.",
              },
              {
                t: "Fail-closed toward the network",
                b: "RA-TLS attests before it sends. A measurement mismatch means the channel never opens and nothing is transmitted.",
              },
            ].map((c) => (
              <div key={c.t} className="bg-canvas p-6">
                <h3 className="text-h4">{c.t}</h3>
                <p className="mt-2 text-sm text-ink-muted">{c.b}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* ── reporting ───────────────────────────────────────────────────── */}
      <Section>
        <Container>
          <div className="flex flex-col items-start gap-6">
            <SectionHeader
              eyebrow="Disclosure"
              title="Found something?"
              lead="Tell us before you tell anyone else, and we will credit you. We do not run a paid bounty yet and we are not going to pretend otherwise."
            />
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/contact?topic=security">Report a vulnerability</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/security/readiness">See the readiness ladder</Link>
              </Button>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
