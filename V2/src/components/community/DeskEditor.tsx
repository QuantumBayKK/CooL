"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { communityBrowser } from "@/lib/community/browser";

const PALETTE = ["#1f3346", "#ffffff", "#8fd8ff", "#ffd89a", "#f29e8e", "#a8d68f", "#c7b6f2", "#14161b"];
const BADGES = ["star", "heart", "bolt", "leaf", "code", "coffee", "flag", "music"];

/** Decorate your office desk: up to three badges and a 10 x 6 pixel drawing on the monitor. */
export function DeskEditor({ desk }: { desk: { id: string; badges: string[]; screen: string } | null }) {
  const router = useRouter();
  const [badges, setBadges] = useState<string[]>(desk?.badges ?? []);
  const [pixels, setPixels] = useState<number[]>(() => (desk?.screen.length === 60 ? [...desk.screen].map(Number) : Array<number>(60).fill(0)));
  const [color, setColor] = useState(1);
  const [painting, setPainting] = useState(false);
  const [msg, setMsg] = useState("");

  if (!desk) return <p className="cm-muted">You don&apos;t have a desk yet. Walk to the Quiet work area in the <Link className="cm-link" href="/community/world">office</Link> and claim a free one.</p>;

  const paint = (i: number) => setPixels((p) => p.map((v, k) => (k === i ? color : v)));
  const toggle = (b: string) => setBadges((x) => (x.includes(b) ? x.filter((y) => y !== b) : x.length < 3 ? [...x, b] : x));
  const call = async (fn: string, args?: Record<string, unknown>, ok?: string) => {
    const { error } = (await communityBrowser()?.rpc(fn, args)) ?? { error: true };
    setMsg(error ? "That didn't work." : ok ?? "");
    if (!error) router.refresh();
  };

  return (
    <div className="cm-split" style={{ alignItems: "start" }}>
      <div className="cm-stack">
        <span className="cm-small cm-muted">Screen: click or drag to paint</span>
        <div className="cm-pixels" onPointerLeave={() => setPainting(false)} onPointerUp={() => setPainting(false)}>
          {pixels.map((v, i) => (
            <button key={i} type="button" aria-label={`Pixel ${i + 1}`} style={{ background: PALETTE[v] }}
              onPointerDown={(e) => { e.preventDefault(); setPainting(true); paint(i); }} onPointerEnter={() => painting && paint(i)} />
          ))}
        </div>
        <div className="cm-actions" style={{ gap: "0.4rem" }}>
          {PALETTE.map((c, i) => (
            <button key={c} type="button" aria-label={`Colour ${i + 1}`} aria-pressed={color === i} onClick={() => setColor(i)}
              style={{ width: 24, height: 24, borderRadius: 6, background: c, border: color === i ? "2px solid #fff" : "1px solid rgb(255 255 255 / 0.2)", cursor: "pointer" }} />
          ))}
          <button type="button" className="cm-btn secondary small" onClick={() => setPixels(Array<number>(60).fill(0))}>Clear</button>
        </div>
      </div>
      <div className="cm-stack">
        <span className="cm-small cm-muted">Badges (up to 3)</span>
        <div className="cm-actions" style={{ gap: "0.4rem" }}>
          {BADGES.map((b) => (
            <button key={b} type="button" className={`cm-btn small${badges.includes(b) ? "" : " secondary"}`} aria-pressed={badges.includes(b)} onClick={() => toggle(b)}>{b}</button>
          ))}
        </div>
        <div className="cm-actions">
          <button type="button" className="cm-btn" onClick={() => call("decorate_desk", { p_badges: badges, p_screen: pixels.join("") }, "Saved. Your desk is updated in the office.")}>Save desk</button>
          <button type="button" className="cm-btn danger small" onClick={() => confirm("Give up your desk?") && call("release_desk", undefined, "Desk released.")}>Give up desk</button>
        </div>
        {msg && <p className="cm-small cm-muted" role="status">{msg}</p>}
      </div>
    </div>
  );
}
