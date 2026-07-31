/**
 * The inclusion proof, unrolled into steps you can watch.
 *
 * This is not an illustration of RFC 6962 — it *is* the verification walk. Each
 * step recomputes a real parent hash from the running hash and the real sibling
 * carried in the receipt, using the same `nodeHash` the verifier calls. The
 * final `root` is compared against the Signed Tree Head; if the receipt has been
 * doctored anywhere, the walk visibly lands on a different root.
 */
import { nodeHash } from "@/lib/cool/merkle";
import { leafHash } from "@/lib/cool/merkle";
import { multihashDigest } from "@/lib/cool/multihash";
import { recordLeafData } from "@/lib/cool/record";
import { toHex } from "@/lib/cool/codec";
import type { Receipt } from "@/lib/cool/types";

export interface WalkStep {
  /** Tree level, 0 = the leaf itself. */
  readonly level: number;
  /** The sibling hash pulled from the audit path (hex). */
  readonly sibling: string;
  /** Whether the running hash was the left or right child at this level. */
  readonly side: "left" | "right";
  /** The parent hash produced by this step (hex). */
  readonly parent: string;
}

export interface MerkleWalk {
  /** RFC 6962 leaf hash of the record's binding digest (hex). */
  readonly leaf: string;
  readonly steps: readonly WalkStep[];
  /** Root the walk reconstructs (hex). */
  readonly computedRoot: string;
  /** Root the Signed Tree Head claims (hex), or null if there is no STH. */
  readonly claimedRoot: string | null;
  /** True only when the reconstruction matches the signed root. */
  readonly matches: boolean;
  readonly leafIndex: number;
  readonly treeSize: number;
}

/**
 * Replay the audit path for a receipt, capturing every intermediate hash.
 * Mirrors `rootFromInclusionProof` exactly — same branch conditions, same
 * `nodeHash` ordering — but records each parent instead of only returning the
 * final root.
 */
export function walkInclusion(receipt: Receipt): MerkleWalk | null {
  const inc = receipt.inclusion;
  const sth = receipt.sth;
  if (!inc || !sth) return null;

  let running: Uint8Array;
  let auditPath: Uint8Array[];
  let claimed: string | null;
  try {
    running = leafHash(recordLeafData(receipt.binding_hash));
    auditPath = inc.audit_path.map(multihashDigest);
    claimed = toHex(multihashDigest(sth.root_hash));
  } catch {
    return null;
  }

  const leaf = toHex(running);
  const steps: WalkStep[] = [];

  let fn = inc.leaf_index;
  let sn = inc.tree_size - 1;
  let level = 0;

  for (const sibling of auditPath) {
    if (sn === 0) break;
    level++;
    let side: "left" | "right";
    if (fn % 2 === 1 || fn === sn) {
      // running hash is the RIGHT child; the sibling goes on the left
      running = nodeHash(sibling, running);
      side = "right";
      if (fn % 2 === 0) {
        while (fn % 2 === 0 && fn !== 0) {
          fn = Math.floor(fn / 2);
          sn = Math.floor(sn / 2);
        }
      }
    } else {
      running = nodeHash(running, sibling);
      side = "left";
    }
    steps.push({
      level,
      sibling: toHex(sibling),
      side,
      parent: toHex(running),
    });
    fn = Math.floor(fn / 2);
    sn = Math.floor(sn / 2);
  }

  const computedRoot = toHex(running);
  return {
    leaf,
    steps,
    computedRoot,
    claimedRoot: claimed,
    matches: claimed !== null && computedRoot === claimed,
    leafIndex: inc.leaf_index,
    treeSize: inc.tree_size,
  };
}

/** Shorten a hex digest for display: `a1b2c3…d4e5f6`. */
export function shortHex(hex: string, head = 8, tail = 6): string {
  if (hex.length <= head + tail + 1) return hex;
  return `${hex.slice(0, head)}…${hex.slice(-tail)}`;
}
