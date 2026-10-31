"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { communityBrowser } from "@/lib/community/browser";
import {
  CLOTH_COLORS, CLOTH_OPTIONS, DEFAULT_AVATAR, FACIAL_OPTIONS, HAIR_COLORS, HAIR_OPTIONS, SKIN_OPTIONS,
  randomAvatar, renderAvatarScene, sanitizeAvatar, type AvatarSpec,
} from "@/lib/community/art/avatar";

/** Draws the character's front sprite at a whole-pixel scale so it stays crisp. */
function Preview({ spec }: { spec: AvatarSpec }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const s = renderAvatarScene(spec);
    const k = 6 * Math.max(1, Math.round(window.devicePixelRatio || 1));
    c.width = s.w * k; c.height = s.h * k;
    c.style.width = `${s.w * 6}px`; c.style.height = `${s.h * 6}px`;
    const g = c.getContext("2d")!;
    const img = new ImageData(new Uint8ClampedArray(s.front[0]!), s.w, s.h);
    const tmp = document.createElement("canvas");
    tmp.width = s.w; tmp.height = s.h;
    tmp.getContext("2d")!.putImageData(img, 0, 0);
    g.imageSmoothingEnabled = false;
    g.clearRect(0, 0, c.width, c.height);
    g.drawImage(tmp, 0, 0, c.width, c.height);
  }, [spec]);
  return <canvas ref={ref} role="img" aria-label="Your character" style={{ imageRendering: "pixelated" }} />;
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

/** Your character for the office: a live preview and a few simple choices. */
export function CharacterMaker({ initial }: { initial: unknown }) {
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
    if (!error) router.refresh();
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
        <div className="cm-actions"><button type="button" className="cm-btn" disabled={busy} onClick={save}>{busy ? "Saving…" : "Save character"}</button>{msg && <span className="cm-small cm-muted" role="status">{msg}</span>}</div>
      </div>
    </div>
  );
}
