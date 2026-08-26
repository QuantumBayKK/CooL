// WITNESS co-signer.
//
// A log signed only by its own keys can, in principle, be rewritten by whoever holds
// those keys (a "split-view" attack). A WITNESS is an independent party that observes
// the Signed Tree Head and co-signs the root with ITS OWN separate hybrid keypair.
// Now tampering requires forging TWO independent parties' post-quantum signatures.
// This is what turns the "witnesses" verification domain from `absent` into `pass`.
//
// In production, witnesses are run by third parties (an auditor, a customer, a public
// notary). Here we run one independent in-process witness so the domain verifies for real.

import { generateKeypair, hybridSign, hybridVerify } from './crypto.js';
import { canonicalBytes } from './canonical.js';

export class Witness {
  constructor(name = 'witness-A') {
    this.name = name;
    this.keys = generateKeypair(); // independent from the log's signing keys
  }

  // Observe an STH and co-sign its root.
  cosign(sth) {
    const attestation = { schema: 'cool.witness.v1', witness: this.name, size: sth.size, root: sth.root };
    const signature = hybridSign(canonicalBytes(attestation), this.keys);
    return {
      witness: this.name,
      public_keys: { mldsa: { publicKey: this.keys.mldsa.publicKey }, ed25519: { publicKey: this.keys.ed25519.publicKey } },
      cosigned: attestation,
      signature,
    };
  }
}

// Verify a witness co-signature against an STH root (used by the offline verifier).
export function verifyWitness(witnessEntry, sthRoot, sthSize) {
  if (!witnessEntry) return false;
  const { cosigned, signature, public_keys } = witnessEntry;
  if (cosigned.root !== sthRoot) return false;         // witness must have signed THIS root
  if (sthSize != null && cosigned.size !== sthSize) return false;
  return hybridVerify(canonicalBytes(cosigned), signature, public_keys).ok;
}
