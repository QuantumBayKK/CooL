"use client";

/**
 * The interaction layer.
 *
 * Three ideas, and a rule about when each applies.
 *
 *   · Magnetic — a control leans toward the pointer as it approaches, so the
 *     cursor feels like it is being caught rather than landed. Applied to
 *     buttons only. On a link inside a paragraph it would be noise.
 *
 *   · Lift — a panel rises 1px and its hairline brightens on hover. Applied
 *     only where hovering means something: a row you can open, a card you can
 *     act on. A static panel that lifts is lying about being interactive.
 *
 *   · Snap — everything lands in ~110ms with a decisive curve. The tell of a
 *     cheap interface is a 300ms ease-in-out on a hover state; it reads as the
 *     UI thinking about it.
 *
 * All of it collapses under `prefers-reduced-motion`, and none of it is load
 * bearing — every control works identically with the motion removed.
 */
import {
  useCallback,
  useRef,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";

/* ── magnetic pull ────────────────────────────────────────────────────── */

/**
 * Pull an element toward the pointer.
 *
 * Writes to two CSS custom properties rather than to `transform` directly, so
 * the `:active` press state can compose with the pull instead of fighting it —
 * see `.hud-button` in globals.css.
 *
 * @param strength fraction of the distance from centre to travel. Past ~0.35
 *   the control detaches from where the user clicked and starts to feel slippery.
 */
export function useMagnetic<T extends HTMLElement>(strength = 0.22) {
  const ref = useRef<T | null>(null);

  const onPointerMove = useCallback(
    (event: React.PointerEvent<T>) => {
      const el = ref.current;
      if (!el || event.pointerType !== "mouse") return;
      const box = el.getBoundingClientRect();
      const dx = event.clientX - (box.left + box.width / 2);
      const dy = event.clientY - (box.top + box.height / 2);
      // Cap the travel so a wide button does not slide half its own width.
      const cap = 6;
      el.style.setProperty("--mx", `${clamp(dx * strength, cap)}px`);
      el.style.setProperty("--my", `${clamp(dy * strength, cap)}px`);
      el.dataset["pulling"] = "true";
    },
    [strength],
  );

  const release = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    // Drop the no-transition flag first so the return home animates.
    delete el.dataset["pulling"];
    el.style.setProperty("--mx", "0px");
    el.style.setProperty("--my", "0px");
  }, []);

  return { ref, onPointerMove, onPointerLeave: release, onBlur: release };
}

const clamp = (v: number, max: number) => Math.max(-max, Math.min(max, v));

/* ── button ───────────────────────────────────────────────────────────── */

type Variant = "primary" | "default" | "ghost" | "danger";

const VARIANT: Record<Variant, string> = {
  primary:
    "border-verify/50 bg-verify/[0.14] text-ink hover:border-verify hover:bg-verify/[0.22]",
  default:
    "border-line bg-panel text-fog hover:border-line-strong hover:bg-raised hover:text-ink",
  ghost:
    "border-transparent bg-transparent text-mist hover:border-line hover:text-ink",
  danger: "border-fail/45 bg-fail/[0.10] text-fail hover:border-fail hover:bg-fail/[0.16]",
};

export function Button({
  variant = "default",
  active = false,
  className = "",
  children,
  ...rest
}: {
  variant?: Variant;
  active?: boolean;
  children: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  const magnet = useMagnetic<HTMLButtonElement>();

  return (
    <button
      ref={magnet.ref}
      onPointerMove={magnet.onPointerMove}
      onPointerLeave={magnet.onPointerLeave}
      onBlur={magnet.onBlur}
      className={`hud-button inline-flex items-center justify-center gap-1.5 border px-3 py-1.5 text-[12px] font-medium disabled:pointer-events-none disabled:opacity-40 ${
        active ? VARIANT.primary : VARIANT[variant]
      } ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

/* ── panel ────────────────────────────────────────────────────────────── */

/**
 * A square panel.
 *
 * `brackets` adds the four corner marks; `accent` makes them blue. Both are
 * opt-in because their whole value is scarcity — bracket every card on a page
 * and the reader stops seeing them, which costs the emphasis and keeps the ink.
 *
 * `lift` is for panels that respond to being hovered. Do not set it on a panel
 * that does nothing.
 */
export function Panel({
  children,
  className = "",
  padded = true,
  brackets = false,
  accent = false,
  lift = false,
  sweep = false,
  as: Tag = "section",
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
  brackets?: boolean;
  accent?: boolean;
  lift?: boolean;
  /** One-shot edge sweep on mount. For a panel that has just computed something. */
  sweep?: boolean;
  as?: "section" | "div" | "article";
}) {
  return (
    <Tag
      className={[
        "relative border border-line bg-panel",
        padded ? "p-4 sm:p-5" : "",
        brackets ? "hud-brackets" : "",
        accent ? "hud-brackets-accent" : "",
        lift ? "hud-lift" : "",
        sweep ? "hud-sweep overflow-hidden" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </Tag>
  );
}

/* ── section rule ─────────────────────────────────────────────────────── */

/** A hairline with a blue tick at its start. Groups without boxing. */
export function Rule({ label }: { label?: string }) {
  return (
    <div className="hud-rule mt-6 pt-3">
      {label ? (
        <p className="font-mono text-[10px] tracking-[0.18em] text-mist uppercase">
          {label}
        </p>
      ) : null}
    </div>
  );
}

/* ── readout ──────────────────────────────────────────────────────────── */

/**
 * A label/value pair set as an instrument readout: monospace label above,
 * figure below, hairline between rows. Used where a HUD would show a channel.
 */
export function Readout({
  label,
  value,
  tone = "ink",
}: {
  label: string;
  value: ReactNode;
  tone?: "ink" | "live" | "warn" | "fail" | "mist";
}) {
  const color = {
    ink: "text-ink",
    live: "text-live",
    warn: "text-warn",
    fail: "text-fail",
    mist: "text-mist",
  }[tone];
  return (
    <div className="border-b border-line py-2 last:border-0">
      <p className="font-mono text-[10px] tracking-[0.16em] text-mist uppercase">
        {label}
      </p>
      <p className={`mt-1 text-[13px] ${color}`}>{value}</p>
    </div>
  );
}
