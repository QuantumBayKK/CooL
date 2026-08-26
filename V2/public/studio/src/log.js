// The append-only transparency log: the "better storage format".
//
// Each AI change becomes a structured RECORD with a fixed schema, canonicalized,
// hashed, hybrid-signed, and appended. The log keeps a Merkle root (Signed Tree Head).
// This is the format that makes audit/governance/compliance export trivial later —
// every record is self-describing, typed, timestamped, signed, and provably ordered.

import { canonicalBytes, canonicalize } from './canonical.js';
import { hash, hybridSign } from './crypto.js';
import { leafHash, merkleRoot, inclusionProof, toHex } from './merkle.js';
import { getAttestation } from './attest.js';

let SEQ = 0;
function ulidish(ts, seq) {
  // deterministic-ish id for the demo (no Math.random needed): time + sequence
  return `cool_${ts.toString(36)}_${seq.toString(36).padStart(4, '0')}`;
}

export class TransparencyLog {
  constructor(keys, clock) {
    this.keys = keys;
    this.records = []; // full records (the stored format)
    this.leaves = [];  // Uint8Array leaf hashes
    this.clock = clock || (() => Date.now());
  }

  // Seal one AI change into a signed, logged record.
  append(change) {
    const ts = this.clock();
    const seq = SEQ++;
    const attestation = getAttestation();

    // The signed body: everything that must be tamper-evident.
    const body = {
      schema: 'cool.record.v2',
      id: ulidish(ts, seq),
      seq,
      captured_at: new Date(ts).toISOString(),
      change,                        // {kind, subject, before, after, actor, source}
      attestation_mode: attestation.mode, // honest label travels INSIDE the signed body
    };

    const bodyBytes = canonicalBytes(body);
    const contentHash = hash(bodyBytes);           // binding: hash of the canonical body
    const signature = hybridSign(bodyBytes, this.keys); // hybrid PQC + classical signature

    const leaf = leafHash(bodyBytes);
    this.leaves.push(leaf);

    const record = {
      ...body,
      content_hash: contentHash,
      signature,
      attestation,                   // full attestation object (with honest simulated note)
    };
    this.records.push(record);
    return record;
  }

  // Signed Tree Head: the current Merkle root over all records, itself hybrid-signed.
  signedTreeHead() {
    const root = toHex(merkleRoot(this.leaves));
    const sthBody = { schema: 'cool.sth.v1', size: this.records.length, root, at: new Date(this.clock()).toISOString() };
    const sig = hybridSign(canonicalBytes(sthBody), this.keys);
    return { ...sthBody, signature: sig };
  }

  proofFor(index) {
    return inclusionProof(this.leaves, index);
  }

  publicKeys() {
    return { mldsa: { publicKey: this.keys.mldsa.publicKey }, ed25519: { publicKey: this.keys.ed25519.publicKey } };
  }

  // Attach an independent witness that co-signs the current tree head.
  attachWitness(witness) {
    this.witness = witness;
    return this;
  }

  // Serialize the whole log to a portable JSONL-ish object (what gets stored / shipped).
  export() {
    const sth = this.signedTreeHead();
    const out = {
      version: 'cool-demo-1',
      public_keys: this.publicKeys(),
      signed_tree_head: sth,
      records: this.records,
    };
    if (this.witness) out.witness = this.witness.cosign(sth);
    return out;
  }
}

export { canonicalize };
