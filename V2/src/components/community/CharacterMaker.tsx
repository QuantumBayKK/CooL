"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { communityBrowser } from "@/lib/community/browser";
import {
  CLOTH_COLORS, CLOTH_OPTIONS, DEFAULT_AVATAR, FACIAL_OPTIONS, HAIR_COLORS, HAIR_OPTIONS, SKIN_OPTIONS,
  randomAvatar, renderAvatarWalk, sanitizeAvatar, type AvatarSpec,
} from "@/lib/community/art/avatar";

const POSES = ["down", "right", "up", "left"] as const;
const CYCLE = [1, 0, 2, 0]; // walk frames: step, pass, other step, pass

/** The character walking on the spot and turning around, drawn at a whole-pixel scale so it stays crisp. */
function Preview({ spec }: { spec: AvatarSpec }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const walk = renderAvatarWalk(spec);
    const k = 6 * Math.max(1, Math.round(window.devicePixelRatio || 1));
    c.width = walk.w * k; c.height = walk.h * k;
    c.style.width = `${walk.w * 6}px`; c.style.height = `${walk.h * 6}px`;
    const g = c.getContext("2d")!;
    g.imageSmoothingEnabled = false;
    const tmp = document.createElement("canvas");
    tmp.width = walk.w; tmp.height = walk.h;
    const draw = (buf: Uint8ClampedArray) => {
      tmp.getContext("2d")!.putImageData(new ImageData(new Uint8ClampedArray(buf), walk.w, walk.h), 0, 0);
      g.clearRect(0, 0, c.width, c.height);
      g.drawImage(tmp, 0, 0, c.width, c.height);
    };
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { draw(walk.down[0]!); return; }
    let tick = 0;
    const timer = setInterval(() => {
      const pose = POSES[Math.floor(tick / 12) % 4]!; // a few steps facing each way
      draw(walk[pose][CYCLE[tick % 4]!]!);
      tick++;
    }, 160);
    return () => clearInterval(timer);
  }, [spec]);
  return <canvas ref={ref} key={JSON.stringify(spec)} className="cm-char-pop" role="img" aria-label="Your character" style={{ imageRendering: "pixelated" }} />;
}

function Swatches({ label, colors, value, onPick }: { label: string; colors: string[]; value: string; onPick: (c: string) => void }) {
  return (
    <div className="cm-field" role="group" aria-label={label}>
      <span>{label}</span>
      <div className="cm-actions" style={{ gap: "0.4rem" }}>
        {colors.map((c) => (
          <button key={c} type="button" aria-label={`${label} ${c}`} aria-pressed={c === value} onClick={() => onPick(c)}
            style={{ width: 26, height: 26, borderRadius: "50%", background: c, border: c === value ? "2px solid #fff" : "2px solid rgb(255 255 255 / 0.15)", cursor: "pointer" }} />
        ))}
      </div>
    </div>
  );
}

/** Your character for the office: a live preview and a few simple choices. With `next`, saving moves on. */
export function CharacterMaker({ initial, next }: { initial: unknown; next?: string }) {
  const router = useRouter();
  const [spec, setSpec] = useState<AvatarSpec>(() => (initial ? sanitizeAvatar(initial) : DEFAULT_AVATAR));
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (p: Partial<AvatarSpec>) => { setMsg(""); setSpec((s) => sanitizeAvatar({ ...s, ...p })); };
  const save = async () => {
    const s = communityBrowser();
    const { data } = (await s?.auth.getUser()) ?? { data: { user: null } };
    if (!s || !data.user) return;
    setBusy(true);
    const { error } = await s.from("profiles").update({ avatar: spec }).eq("id", data.user.id);
    setBusy(false);
    setMsg(error ? "Could not save your character." : "Saved.");
    if (!error && next) router.push(next);
    else if (!error) router.refresh();
  };
  const select = (label: string, value: string, options: { id: string; label: string }[], on: (v: string) => void) => (
    <label className="cm-field"><span>{label}</span>
      <select value={value} onChange={(e) => on(e.target.value)}>{options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}</select>
    </label>
  );
  return (
    <div className="cm-split" style={{ alignItems: "center" }}>
      <div className="cm-stack" style={{ alignItems: "center" }}>
        <div style={{ padding: "1rem 2rem", borderRadius: 14, background: "#c9c4b8" }}><Preview spec={spec} /></div>
        <button type="button" className="cm-btn secondary small" onClick={() => { setMsg(""); setSpec(randomAvatar()); }}>Surprise me</button>
      </div>
      <div className="cm-stack">
        <Swatches label="Skin" colors={SKIN_OPTIONS.map((s) => s.color)} value={SKIN_OPTIONS.find((s) => s.id === spec.skin)?.color ?? ""} onPick={(c) => set({ skin: SKIN_OPTIONS.find((s) => s.color === c)?.id ?? spec.skin })} />
        <div className="cm-grid">
          {select("Hair", spec.hair, HAIR_OPTIONS, (v) => set({ hair: v }))}
          {select("Outfit", spec.cloth, CLOTH_OPTIONS, (v) => set({ cloth: v }))}
          {select("Facial hair", spec.facial, FACIAL_OPTIONS, (v) => set({ facial: v }))}
        </div>
        <Swatches label="Hair colour" colors={HAIR_COLORS} value={spec.hairColor} onPick={(c) => set({ hairColor: c })} />
        <Swatches label="Outfit colour" colors={CLOTH_COLORS} value={spec.clothColor} onPick={(c) => set({ clothColor: c })} />
        <label className="cm-check"><input type="checkbox" checked={spec.glasses} onChange={(e) => set({ glasses: e.target.checked })} /> Glasses</label>
        <div className="cm-actions"><button type="button" className="cm-btn" disabled={busy} onClick={save}>{busy ? "Saving…" : next ? "Save and take the tour" : "Save character"}</button>{msg && <span className="cm-small cm-muted" role="status">{msg}</span>}</div>
      </div>
    </div>
  );
}
