"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Station, Reveal } from "@/components/ui";
import TypeText from "@/components/TypeText";

export default function OneLine() {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText("cool.complete(prompt)");
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable — no-op */
    }
  };

  return (
    <Station
      id="one-line"
      layer="02 · THE ENGINEER"
      station="§02 · Live SDK"
      title="Change one line. Keep everything else."
      sub="Same OpenAI-compatible API. Every call now returns a receipt alongside the output."
    >
      <Reveal>
        <div className="glass-strong overflow-hidden rounded-2xl">
          <div className="flex items-center gap-1.5 border-b border-line px-4 py-2.5">
            <span className="size-2.5 rounded-full bg-white/15" />
            <span className="size-2.5 rounded-full bg-white/15" />
            <span className="size-2.5 rounded-full bg-white/15" />
            <span className="ml-2 font-mono text-[11px] text-mist">app.ts</span>
          </div>
          <div className="overflow-x-auto px-4 py-4 font-mono text-[13px] leading-7 sm:text-sm">
            <p className="text-mist">
              <span className="select-none text-white/25">{"// "}</span>before
            </p>
            <motion.p
              initial={{ opacity: 1 }}
              whileInView={{ opacity: 0.45 }}
              viewport={{ once: true }}
              transition={{ delay: 0.9, duration: 0.5 }}
              className="text-fail/90"
            >
              <span className="select-none">- </span>
              <span className="line-through decoration-fail/60">
                openai.complete(prompt)
              </span>
            </motion.p>
            <p className="mt-2 text-mist">
              <span className="select-none text-white/25">{"// "}</span>after
            </p>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 1.1, duration: 0.3 }}
              className="text-live"
            >
              <span className="select-none">+ </span>
              <TypeText text="cool.complete(prompt)" startDelay={1300} />
            </motion.p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={copy}
            className="rounded-full bg-verify-deep px-5 py-2.5 font-mono text-xs text-white transition-opacity active:opacity-80"
          >
            {copied ? "✓ Copied" : "📋 Copy"}
          </button>
          <a
            href="#evidence"
            className="glass rounded-full px-5 py-2.5 font-mono text-xs text-fog"
          >
            Docs ↓
          </a>
          <span className="rounded-full border border-line px-5 py-2.5 font-mono text-xs text-mist">
            GitHub — public at MVP
          </span>
        </div>
      </Reveal>
    </Station>
  );
}
