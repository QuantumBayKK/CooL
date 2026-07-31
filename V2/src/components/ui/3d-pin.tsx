"use client";

import clsx from "clsx";

/**
 * Pin3D — a labelled callout pinned over a 3D stage, bobbing gently.
 *
 * The bob is CSS (`float-y`) so it runs on the compositor and keeps ticking
 * even while the main thread is busy compiling shaders for the scene it sits on
 * top of.
 */
export function Pin3D({
  label,
  className,
  delay = 0,
}: {
  label: string;
  className?: string;
  /** seconds of offset, so several pins don't bob in lockstep */
  delay?: number;
}) {
  return (
    <div className={clsx("absolute z-20", className)}>
      <div
        className="float-y"
        style={{ animationDelay: `${delay}s` }}
      >
        <div className="glass rounded-full px-3 py-2 font-mono text-[12px] font-semibold text-ink shadow-[0_0_28px_rgba(88,166,255,0.16)]">
          {label}
        </div>
        <div className="mx-auto h-8 w-px bg-verify/35" />
        <div className="mx-auto size-2.5 rounded-full bg-verify shadow-[0_0_22px_rgba(88,166,255,0.65)]" />
      </div>
    </div>
  );
}
