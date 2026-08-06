"use client";

import clsx from "clsx";
import { motion } from "motion/react";
import { shortHex, type MerkleWalk } from "@/lib/demo/merkle-walk";

/**
 * The inclusion proof, climbed one level at a time.
 *
 * Every hash on screen was computed a moment ago by the same function the
 * verifier uses. The last row is the moment of truth: the root this walk
 * reconstructs, set against the root the Signed Tree Head claims. Tamper with
 * anything and the two stop matching — visibly, on the same screen.
 */
export default function MerkleWalkView({ walk }: { walk: MerkleWalk }) {
  return (
    <div className="frost rounded-xl border border-line p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-mono text-[12px] tracking-[0.14em] text-verify uppercase">
          RFC 6962 inclusion proof
        </p>
        <p className="font-mono text-[11px] text-mist">
          leaf {walk.leafIndex} of tree({walk.treeSize}) · {walk.steps.length}{" "}
          sibling{walk.steps.length === 1 ? "" : "s"}
        </p>
      </div>

      {/* the climb */}
      <div className="mt-3 space-y-1.5">
        {/* leaf */}
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35 }}
          className="flex items-center gap-2.5 rounded-lg border border-verify/35 bg-verify/[0.07] px-3 py-2"
        >
          <span className="w-14 shrink-0 font-mono text-[10px] tracking-[0.12em] text-verify">
            LEAF
          </span>
          <span className="min-w-0 flex-1 truncate font-mono text-[11.5px] text-ink">
            {shortHex(walk.leaf, 12, 10)}
          </span>
        </motion.div>

        {walk.steps.map((step, i) => (
          <motion.div
            key={step.level}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: 0.1 * (i + 1) }}
            className="rounded-lg border border-line bg-panel/50 px-3 py-2"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-14 shrink-0 font-mono text-[10px] tracking-[0.12em] text-mist">
                L{step.level}
              </span>
              <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-mist">
                + sibling {shortHex(step.sibling, 10, 8)}
              </span>
              <span
                className={clsx(
                  "shrink-0 rounded border px-1.5 py-0.5 font-mono text-[9.5px] tracking-[0.1em]",
                  step.side === "left"
                    ? "border-line text-fog"
                    : "border-line text-fog",
                )}
              >
                {step.side === "left" ? "H(node‖sib)" : "H(sib‖node)"}
              </span>
            </div>
            <div className="mt-1.5 flex items-center gap-2.5">
              <span className="w-14 shrink-0" />
              <span className="min-w-0 flex-1 truncate font-mono text-[11.5px] text-ink">
                → {shortHex(step.parent, 12, 10)}
              </span>
            </div>
          </motion.div>
        ))}

        {/* the comparison */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 * (walk.steps.length + 1) }}
          className={clsx(
            "rounded-lg border px-3 py-2.5",
            walk.matches
              ? "border-live/45 bg-live/[0.08]"
              : "border-fail/50 bg-fail/[0.08]",
          )}
        >
          <div className="flex items-center gap-2.5">
            <span className="w-14 shrink-0 font-mono text-[10px] tracking-[0.12em] text-mist">
              ROOT
            </span>
            <span className="min-w-0 flex-1 truncate font-mono text-[11.5px] text-ink">
              {shortHex(walk.computedRoot, 12, 10)}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-2.5">
            <span className="w-14 shrink-0 font-mono text-[10px] tracking-[0.12em] text-mist">
              STH
            </span>
            <span className="min-w-0 flex-1 truncate font-mono text-[11.5px] text-ink">
              {walk.claimedRoot ? shortHex(walk.claimedRoot, 12, 10) : "—"}
            </span>
          </div>
          <p
            className={clsx(
              "mt-2 font-mono text-[11px] tracking-[0.1em] uppercase",
              walk.matches ? "text-live" : "text-fail",
            )}
          >
            {walk.matches
              ? "✓ reconstructed root matches the signed tree head"
              : "✕ reconstructed root does not match — the log was altered"}
          </p>
        </motion.div>
      </div>
    </div>
  );
}
