/**
 * What changes when this runs on real hardware.
 *
 * A projection, and labelled as one everywhere it is rendered. That distinction
 * is the whole reason this file is separate from the verifier: nothing here can
 * make a domain pass, because nothing here is consulted when a receipt is
 * checked. `verifyReceiptV2` does not import this module and never will.
 *
 * The table below is derived from the verifier's own rules rather than from
 * marketing — each row states the condition the verifier actually tests, so a
 * reader can open `verify.ts` and check that the claim matches the code. Three
 * domains change on a confidential VM and four do not, which is worth being
 * plain about: deploying to hardware does not make `witnesses` or `anchor`
 * pass, because those need an independent party and a Bitcoin block
 * respectively, and no amount of silicon substitutes for either.
 */

export type DomainName =
  | "binding"
  | "signature"
  | "inclusion"
  | "witnesses"
  | "attestation"
  | "enclave"
  | "anchor";

export interface HardwareRow {
  readonly domain: DomainName;
  /** What it reports in a browser, with no enclave anywhere. */
  readonly here: string;
  /** What it reports inside a Phala CVM with a vendor root configured. */
  readonly onHardware: string;
  /** True when deploying is what changes it. */
  readonly changes: boolean;
  /** The condition the verifier actually tests. */
  readonly because: string;
  /** Who or what has to supply it. */
  readonly provider: string;
}

export const HARDWARE_TABLE: readonly HardwareRow[] = [
  {
    domain: "binding",
    here: "pass",
    onHardware: "pass",
    changes: false,
    because: "SHA-256 recomputed over the canonical bytes. Pure maths over the receipt.",
    provider: "the receipt itself",
  },
  {
    domain: "signature",
    here: "pass",
    onHardware: "pass",
    changes: false,
    because: "ML-DSA-65 and Ed25519 both verify over core‖binding. Also pure maths.",
    provider: "the receipt itself",
  },
  {
    domain: "inclusion",
    here: "pass",
    onHardware: "pass",
    changes: false,
    because: "RFC 6962 audit path to a validly signed tree head.",
    provider: "the log",
  },
  {
    domain: "witnesses",
    here: "absent",
    onHardware: "absent",
    changes: false,
    because:
      "Only co-signatures marked external are counted, and a CooL self-signature never is. Hardware does not create an independent party.",
    provider: "your auditor — not CooL, and not Phala",
  },
  {
    domain: "attestation",
    here: "simulated",
    onHardware: "pass",
    changes: true,
    because:
      "Passes only when a verifier chains the quote to a vendor root. The simulator's root is CooL's own, which is why it reports simulated instead.",
    provider: "Intel DCAP, via QUOTE_VERIFIER_URL",
  },
  {
    domain: "enclave",
    here: "simulated",
    onHardware: "pass",
    changes: true,
    because:
      "The quote digest is inside the signed core and report_data commits to the signing key. That binding already holds here — it is reported as simulated only because the quote underneath it is.",
    provider: "the dstack guest agent",
  },
  {
    domain: "anchor",
    here: "absent",
    onHardware: "pending → pass",
    changes: true,
    because:
      "Needs a tree head committed in a Bitcoin block. Runs on any machine — it is listed here because a real deployment is where anyone bothers to submit one.",
    provider: "OpenTimestamps calendars, then the chain",
  },
];

/** The five steps between a laptop and a verified quote. */
export interface DeployStep {
  readonly n: number;
  readonly title: string;
  readonly why: string;
  /** PowerShell, because that is what a Windows operator is actually holding. */
  readonly powershell: string;
  readonly bash: string;
}

export const DEPLOY_STEPS: readonly DeployStep[] = [
  {
    n: 1,
    title: "Authenticate",
    why: "One interactive step. The API key is yours and never leaves your machine.",
    powershell: "npm install -g phala\nphala login",
    bash: "npm install -g phala\nphala login",
  },
  {
    n: 2,
    title: "Deploy the evidence plane into a CVM",
    why: "Until the process is inside a TDX guest, every receipt says simulated in its own body.",
    powershell: "cd deploy\nphala deploy -c docker-compose.yml -n cool-evidence",
    bash: "cd deploy && phala deploy -c docker-compose.yml -n cool-evidence",
  },
  {
    n: 3,
    title: "Point CooL at the guest agent",
    why: "A unix socket, not a URL — fetch cannot open one, so CooL routes it through node:http.",
    powershell: '$env:DSTACK_ENDPOINT = "/var/run/dstack.sock"',
    bash: "export DSTACK_ENDPOINT=/var/run/dstack.sock",
  },
  {
    n: 4,
    title: "Give it a vendor root",
    why: "The step that turns attestation from simulated into pass — the first point at which anything checks a chain to Intel.",
    powershell:
      '$env:QUOTE_VERIFIER_URL = "https://api.phala.network/attest/verify"',
    bash: "export QUOTE_VERIFIER_URL=https://api.phala.network/attest/verify",
  },
  {
    n: 5,
    title: "Pin the measurement, then prove it",
    why: "Pin before any data flows; a pin set afterwards proves nothing. Then let the verifier decide.",
    powershell:
      'phala cvms attestation <cvm-id>\n$env:COOL_PIN_MRTD = "hex:<mrtd>"\ncool wire\ncool verify last --require-hardware',
    bash:
      "phala cvms attestation <cvm-id>\nexport COOL_PIN_MRTD=hex:<mrtd>\ncool wire && cool verify last --require-hardware",
  },
];
