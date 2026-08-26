// RFC 6962-style Merkle transparency log (same construction as Certificate Transparency).
// Leaves are hashed with a 0x00 prefix, internal nodes with 0x01 — this domain separation
// is what makes the tree second-preimage resistant. Any change to any past record changes
// the root, so tampering is DETECTABLE by anyone, not merely prevented by access control.

import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js';

const hex = (u8) => bytesToHex(u8);
const concat = (...arrs) => {
  const total = arrs.reduce((n, a) => n + a.length, 0);
  const out = new Uint8Array(total);
  let o = 0;
  for (const a of arrs) { out.set(a, o); o += a.length; }
  return out;
};

const LEAF = new Uint8Array([0x00]);
const NODE = new Uint8Array([0x01]);

export function leafHash(recordBytes) {
  return sha256(concat(LEAF, recordBytes));
}
function nodeHash(l, r) {
  return sha256(concat(NODE, l, r));
}

// Merkle root over an array of leaf hashes (Uint8Array[])
export function merkleRoot(leaves) {
  if (leaves.length === 0) return sha256(new Uint8Array([]));
  let level = leaves;
  while (level.length > 1) {
    const next = [];
    for (let i = 0; i < level.length; i += 2) {
      if (i + 1 < level.length) next.push(nodeHash(level[i], level[i + 1]));
      else next.push(level[i]); // odd node promoted
    }
    level = next;
  }
  return level[0];
}

// Inclusion proof: the sibling hashes needed to recompute the root from leaf `index`.
export function inclusionProof(leaves, index) {
  const proof = [];
  let idx = index;
  let level = leaves;
  while (level.length > 1) {
    const next = [];
    for (let i = 0; i < level.length; i += 2) {
      if (i + 1 < level.length) {
        next.push(nodeHash(level[i], level[i + 1]));
        if (i === idx || i + 1 === idx) {
          const siblingIsRight = idx === i;
          proof.push({ hash: hex(siblingIsRight ? level[i + 1] : level[i]), right: siblingIsRight });
        }
      } else {
        next.push(level[i]);
      }
    }
    idx = Math.floor(idx / 2);
    level = next;
  }
  return proof;
}

// Verify an inclusion proof: recompute the root from the leaf + proof, compare.
export function verifyInclusion(leaf, proof, expectedRootHex) {
  let acc = leaf;
  for (const step of proof) {
    const sib = hexToBytes(step.hash);
    acc = step.right ? nodeHash(acc, sib) : nodeHash(sib, acc);
  }
  return hex(acc) === expectedRootHex;
}

export { hex as toHex };
