"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { communityBrowser } from "@/lib/community/browser";
import { buildWorld, findPath, reachable, teamSeat, walkable, TILE, MAP_W, MAP_H, type Piece } from "@/lib/community/world-map";
import { ROOMS } from "@/lib/community/world";
import { NC_PATHS } from "./NcLogo";

export type TeamMember = { handle: string; name: string; role: string; linkedin: string | null; avatar: unknown; seat: number; member_handle: string | null; joined: boolean };
export type Me = { handle: string; name: string; avatar: unknown; visible: boolean };
export type Desk = { id: string; owner_handle: string | null; owner_name: string | null; badges: string[]; screen: string };
type Props = { me: Me; flags: Record<string, boolean>; team: TeamMember[]; desks: Desk[] };
type Card =
  | { kind: "object"; label: string; href: string | null }
  | { kind: "elevator"; floor: number }
  | { kind: "desk"; id: string; owner: string | null; mine: boolean; hasDesk: boolean }
  | { kind: "person"; key: string; name: string; role?: string; handle: string | null; linkedin?: string | null; live: boolean };
type Dir = "down" | "up" | "left" | "right";

const STEP = 0.18; // seconds per tile
const FLOOR_CAP = 25; // people per floor; a full floor sends newcomers to the next identical floor
const TOP_FLOOR = 9;
const CYCLE = [1, 0, 2, 0]; // walk frames: step, pass, other step, pass

function hrefFor(p: Piece, flags: Record<string, boolean>): string | null {
  const room = ROOMS.find((r) => r.interactables.some((i) => i.id === p.interact));
  const item = room?.interactables.find((i) => i.id === p.interact);
  if (!room || !item) return null;
  return room.flag === null || flags[room.flag] ? item.href : null;
}
const clean = (v: unknown, n: number) => (typeof v === "string" ? v.slice(0, n) : "");

/**
 * The headquarters. Walk with the arrow keys or WASD, or click/tap where you want to go. Next to an
 * object, a person or a teammate's desk, a small card appears. Other members appear live and move in
 * real time unless they have chosen to be invisible; a teammate who is here in person leaves their desk.
 */
export function World({ me, flags, team, desks }: Props) {
  const router = useRouter();
  const host = useRef<HTMLDivElement>(null);
  const act = useRef<{ open: () => void; wave: (handle: string) => void; floor: (n: number) => void }>({ open: () => {}, wave: () => {}, floor: () => {} });
  const [card, setCard] = useState<Card | null>(null);
  const [room, setRoom] = useState("");
  const [toast, setToast] = useState("");
  const [failed, setFailed] = useState(false);
  const [visible, setVisible] = useState(me.visible);
  const [online, setOnline] = useState(0);
  const [full, setFull] = useState(false);

  // Full screen where the browser allows it; otherwise (iPhone Safari) the office fills the window.
  useEffect(() => {
    const sync = () => setFull(document.fullscreenElement === host.current);
    document.addEventListener("fullscreenchange", sync);
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setFull((f) => (document.fullscreenElement ? f : false)); };
    window.addEventListener("keydown", esc);
    return () => { document.removeEventListener("fullscreenchange", sync); window.removeEventListener("keydown", esc); };
  }, []);
  const toggleFull = () => {
    const el = host.current;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else if (el.requestFullscreen && document.fullscreenEnabled) void el.requestFullscreen().catch(() => setFull((f) => !f));
    else setFull((f) => !f);
  };
  // The live office is always on: members see each other unless they choose to be invisible.
  const live = true;
  const key = JSON.stringify({ me, flags, team, visible, desks });

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    const holder = host.current;
    if (!holder) return;
    let disposed = false;
    let cleanup = () => {};
    const { me: self, flags: flagMap, team: crew, visible: shown, desks: deskList } = JSON.parse(key) as { me: Me; flags: Record<string, boolean>; team: TeamMember[]; visible: boolean; desks: Desk[] };

    (async () => {
      const PIXI = await import("pixi.js");
      await import("pixi.js/unsafe-eval"); // lets Pixi run under a CSP without 'unsafe-eval'
      const art = await import("@/lib/community/art/tiles");
      const { renderAvatarWalk, DEFAULT_AVATAR, sanitizeAvatar } = await import("@/lib/community/art/avatar");
      if (disposed) return;

      const app = new PIXI.Application();
      try {
        await app.init({ resizeTo: holder, background: "#050608", antialias: false, roundPixels: true,
          resolution: Math.min(window.devicePixelRatio || 1, 3), autoDensity: true, preference: "webgl" });
      } catch {
        if (!disposed) setFailed(true);
        return;
      }
      if (disposed) { app.destroy(true); return; }
      holder.prepend(app.canvas);
      app.canvas.setAttribute("aria-hidden", "true");

      const tex = (c: HTMLCanvasElement) => { const t = PIXI.Texture.from(c); t.source.scaleMode = "nearest"; return t; };
      const map = buildWorld();
      const world = new PIXI.Container();
      app.stage.addChild(world);
      world.addChild(new PIXI.Sprite(tex(art.paintGround(map.floor))));
      const objects = new PIXI.Container();
      objects.sortableChildren = true;
      world.addChild(objects);
      for (const p of map.pieces) {
        const s = new PIXI.Sprite(tex(art.paintPiece(p.kind, p.w, p.h)));
        s.x = p.x * TILE;
        s.y = (p.y + p.h) * TILE - s.height;
        if (p.kind === "rug") { world.addChildAt(s, 1); continue; }
        s.zIndex = (p.y + p.h) * TILE - (p.kind === "chair" ? 6 : 0);
        objects.addChild(s);
        // A claimed desk shows its owner's drawing on the monitor and their badges on the desktop.
        const desk = p.interact?.startsWith("desk:") ? deskList.find((d) => d.id === p.interact!.slice(5)) : undefined;
        if (desk?.owner_handle) {
          if (desk.screen.length === 60) {
            const scr = new PIXI.Sprite(tex(art.paintScreen(desk.screen)));
            scr.position.set(s.x + 11, s.y + 2);
            scr.zIndex = s.zIndex + 0.1;
            objects.addChild(scr);
          }
          desk.badges.slice(0, 3).forEach((b, i) => {
            const badge = new PIXI.Sprite(tex(art.paintBadge(b)));
            badge.position.set(s.x + 3 + i * 7 + (i > 0 ? 14 : 0), s.y + art.UP.desk + 1);
            badge.zIndex = s.zIndex + 0.1;
            objects.addChild(badge);
          });
        }
      }
      // The Northwind Cipher mark, set into the lobby rug.
      const lobbyRug = map.pieces.find((p) => p.kind === "rug" && map.districtAt(p.x, p.y)?.id === "hq.lobby");
      if (lobbyRug) {
        const emblem = new PIXI.Sprite(tex(art.paintEmblem(30, NC_PATHS, "#ffe7bf")));
        emblem.position.set(lobbyRug.x * TILE + (lobbyRug.w * TILE - 30) / 2, lobbyRug.y * TILE + (lobbyRug.h * TILE - 30) / 2);
        world.addChildAt(emblem, 2);
      }
      const shadowTex = tex(art.paintShadow());

      // ── characters ──
      type Actor = { sprite: InstanceType<typeof PIXI.Sprite>; shadow: InstanceType<typeof PIXI.Sprite>; tag: InstanceType<typeof PIXI.Text>;
        frames: Record<Dir, InstanceType<typeof PIXI.Texture>[]>; tx: number; ty: number; fx: number; fy: number; t: number; dir: Dir; phase: number; seated: boolean };
      const framesFor = (spec: unknown) => {
        const w = renderAvatarWalk(spec ? sanitizeAvatar(spec) : DEFAULT_AVATAR);
        const toTex = (buf: Uint8ClampedArray) => {
          const c = document.createElement("canvas");
          c.width = w.w; c.height = w.h;
          const g = c.getContext("2d")!;
          const img = g.createImageData(w.w, w.h);
          img.data.set(buf);
          g.putImageData(img, 0, 0);
          return tex(c);
        };
        return { down: w.down.map(toTex), up: w.up.map(toTex), left: w.left.map(toTex), right: w.right.map(toTex) };
      };
      const makeActor = (spec: unknown, name: string, x: number, y: number, seated = false): Actor => {
        const sprite = new PIXI.Sprite();
        sprite.anchor.set(0.5, 1);
        const shadow = new PIXI.Sprite(shadowTex);
        shadow.anchor.set(0.5, 0.5);
        shadow.visible = !seated;
        const tag = new PIXI.Text({ text: name, style: { fontFamily: "monospace", fontSize: 7, fill: 0xffffff, stroke: { color: 0x000000, width: 2 }, fontWeight: "700" } });
        tag.resolution = 8;
        tag.anchor.set(0.5, 1);
        objects.addChild(shadow, sprite, tag);
        return { sprite, shadow, tag, frames: framesFor(spec), tx: x, ty: y, fx: x, fy: y, t: 1, dir: seated ? "up" : "down", phase: 0, seated };
      };
      const place = (a: Actor, dt: number, moving: boolean) => {
        if (a.t < 1) { a.t = Math.min(1, a.t + dt / STEP); a.phase += dt / STEP * 2; }
        const x = (a.fx + (a.tx - a.fx) * a.t) * TILE + TILE / 2;
        const walking = a.t < 1 || moving;
        const step = walking ? CYCLE[Math.floor(a.phase) % 4]! : 0;
        const bob = walking && step === 0 ? -1 : 0; // body rises as the legs pass
        const y = (a.fy + (a.ty - a.fy) * a.t) * TILE + TILE - 1 - (a.seated ? 5 : 0);
        a.sprite.texture = a.frames[a.dir][step]!;
        a.sprite.position.set(Math.round(x), Math.round(y) + bob);
        a.sprite.zIndex = y + (a.seated ? 6 : 0);
        a.shadow.position.set(Math.round(x), Math.round(y) - 1);
        a.shadow.zIndex = y - 0.5;
        a.tag.position.set(Math.round(x), Math.round(y) - 33);
        a.tag.zIndex = 1e5;
        return { x, y };
      };
      const stepActor = (a: Actor, x: number, y: number) => {
        a.fx = a.tx; a.fy = a.ty; a.tx = x; a.ty = y; a.t = 0;
        a.dir = y < a.fy ? "up" : y > a.fy ? "down" : x < a.fx ? "left" : "right";
      };

      // The team, always at their desks, working.
      const seated = crew.flatMap((m) => {
        const s = teamSeat(m.seat);
        if (!s) return [];
        map.solid[s.y]![s.x] = true;
        return [{ m, s, actor: makeActor(m.avatar, m.name, s.x, s.y, true) }];
      });
      const teamFor = (handle: string) => crew.find((m) => m.member_handle === handle);
      const atDesk = (t: (typeof seated)[number]) => t.actor.sprite.visible;

      const meActor = makeActor(self.avatar, "", map.spawn.x, map.spawn.y);
      meActor.tag.visible = false;
      const path: { x: number; y: number }[] = [];
      const others = new Map<string, Actor & { name: string; seen: number }>();
      // A teammate who is here in person walks around; their desk figure steps away until they leave.
      const syncSeats = () => {
        for (const t of seated) {
          const here = Boolean(t.m.member_handle) && (t.m.member_handle === self.handle || others.has(t.m.member_handle!));
          t.actor.sprite.visible = t.actor.tag.visible = !here;
        }
      };
      syncSeats();

      // A small marker that bobs over whatever you can use right now.
      const marker = new PIXI.Graphics().poly([0, 0, 6, 0, 3, 4]).fill(0xffffff);
      marker.visible = false;
      marker.zIndex = 1e6;
      objects.addChild(marker);
      const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

      // ── what's nearby ──
      let lastRoom = "", lastCard = "", target: { x: number; y: number; h: number } | null = null, bob = 0;
      const near = (x: number, y: number) => Math.abs(x - meActor.tx) + Math.abs(y - meActor.ty) <= 1;
      const refresh = () => {
        const d = map.districtAt(meActor.tx, meActor.ty);
        const name = d ? ROOMS.find((r) => r.id === d.id)?.name ?? "" : "";
        if (name && name !== lastRoom) { lastRoom = name; setRoom(live ? `Floor ${floor} · ${name}` : name); }
        let next: Card | null = null;
        target = null;
        const mate = seated.find((t) => atDesk(t) && near(t.s.x, t.s.y));
        const person = [...others.entries()].find(([, o]) => near(o.tx, o.ty));
        const piece = reachable(map, meActor.tx, meActor.ty);
        if (mate) {
          next = { kind: "person", key: "team:" + mate.m.handle, name: mate.m.name, role: mate.m.role, handle: mate.m.joined ? mate.m.member_handle : null, linkedin: mate.m.linkedin, live: false };
          target = { x: mate.s.x, y: mate.s.y, h: 38 };
        } else if (person) {
          const crewMate = teamFor(person[0]);
          next = { kind: "person", key: "member:" + person[0], name: person[1].name, role: crewMate?.role, handle: person[0], linkedin: crewMate?.linkedin, live: true };
          target = { x: person[1].tx, y: person[1].ty, h: 38 };
        } else if (piece?.interact?.startsWith("desk:")) {
          const d = deskList.find((x) => x.id === piece.interact!.slice(5));
          next = { kind: "desk", id: piece.interact.slice(5), owner: d?.owner_name ?? null, mine: d?.owner_handle === self.handle, hasDesk: deskList.some((x) => x.owner_handle === self.handle) };
          target = { x: piece.x + (piece.w - 1) / 2, y: piece.y + piece.h - 1, h: art.UP[piece.kind] + 8 };
        } else if (piece?.interact === "elevator") {
          next = { kind: "elevator", floor };
          target = { x: piece.x + (piece.w - 1) / 2, y: piece.y + piece.h - 1, h: art.UP[piece.kind] + 8 };
        } else if (piece) {
          next = { kind: "object", label: piece.label ?? "", href: hrefFor(piece, flagMap) };
          target = { x: piece.x + (piece.w - 1) / 2, y: piece.y + piece.h - 1, h: art.UP[piece.kind] + 8 };
        }
        const k = next ? JSON.stringify(next) : "";
        if (k !== lastCard) { lastCard = k; setCard(next); }
      };

      // ── live members: one private realtime channel per floor ──
      const supabase = live ? communityBrowser() : null;
      let channel: ReturnType<NonNullable<typeof supabase>["channel"]> | null = null;
      const send = (event: string, payload: Record<string, unknown>) => { void channel?.send({ type: "broadcast", event, payload }); };
      const clearOthers = () => { for (const o of others.values()) { o.sprite.destroy(); o.shadow.destroy(); o.tag.destroy(); } others.clear(); syncSeats(); setOnline(0); };
      const joinFloor = async (n: number, auto: boolean) => {
        if (!supabase || disposed) return;
        if (channel) { await supabase.removeChannel(channel); channel = null; }
        clearOthers();
        floor = n;
        lastRoom = "";
        const ch = supabase.channel(`hq:${n}`, { config: { private: true, presence: { key: self.handle }, broadcast: { self: false } } });
        channel = ch;
        let first = true;
        ch.on("presence", { event: "sync" }, () => {
          const state = ch.presenceState<{ name: string; avatar: unknown; x: number; y: number }>();
          const count = Object.keys(state).filter((h) => h !== self.handle).length;
          // Arriving at a full floor sends you up to the next identical one.
          if (first && auto && count >= FLOOR_CAP && n < TOP_FLOOR) { first = false; void joinFloor(n + 1, true); return; }
          first = false;
          for (const [handle, metas] of Object.entries(state)) {
            const meta = metas[0];
            if (!meta || handle === self.handle) continue;
            const x = Number(meta.x), y = Number(meta.y);
            const known = others.get(handle);
            // Where they last stopped; catches up anyone whose steps were missed.
            if (known) { if (known.t >= 1 && walkable(map, x, y) && (x !== known.tx || y !== known.ty)) { known.fx = known.tx = x; known.fy = known.ty = y; } continue; }
            const name = teamFor(handle)?.name ?? clean(meta.name, 40);
            const o = makeActor(meta.avatar, name, walkable(map, x, y) ? x : map.spawn.x, walkable(map, x, y) ? y : map.spawn.y);
            others.set(handle, Object.assign(o, { name, seen: Date.now() }));
          }
          for (const [handle, o] of others) if (!state[handle]) { o.sprite.destroy(); o.shadow.destroy(); o.tag.destroy(); others.delete(handle); }
          syncSeats();
          setOnline(others.size);
          refresh();
        });
        ch.on("broadcast", { event: "mv" }, ({ payload }) => {
          const o = others.get(clean(payload.h, 40));
          const x = Number(payload.x), y = Number(payload.y);
          if (!o || !walkable(map, x, y)) return; // never trust a position that is off the floor
          if (Math.abs(x - o.tx) + Math.abs(y - o.ty) === 1) stepActor(o, x, y);
          else { o.fx = o.tx = x; o.fy = o.ty = y; o.t = 1; }
          refresh();
        });
        ch.on("broadcast", { event: "wave" }, ({ payload }) => {
          if (payload.to === self.handle) setToast(`${clean(payload.name, 40)} waved at you`);
        });
        ch.subscribe(async (status) => {
          if (status === "SUBSCRIBED" && shown) await ch.track({ name: self.name, avatar: self.avatar, x: meActor.tx, y: meActor.ty });
        });
        refresh();
      };
      let floor = 1;
      if (supabase) {
        try {
          await supabase.realtime.setAuth();
          await joinFloor(1, true);
        } catch (error) {
          // The office still works on its own if the live connection can't be made.
          console.warn("Live office unavailable", error);
          channel = null;
        }
      }

      act.current = {
        open: () => {
          const p = reachable(map, meActor.tx, meActor.ty);
          const mate = seated.find((t) => atDesk(t) && near(t.s.x, t.s.y));
          if (mate?.m.joined && mate.m.member_handle) router.push(`/community/inbox?with=${mate.m.member_handle}`);
          else if (p && !mate && p.interact !== "elevator" && !p.interact?.startsWith("desk:")) { const h = hrefFor(p, flagMap); if (h) router.push(h); }
        },
        wave: (handle) => { send("wave", { to: handle, name: self.name }); setToast("You waved"); },
        floor: (n) => {
          if (n < 1 || n > TOP_FLOOR || n === floor) return;
          setToast(`Floor ${n}`);
          void joinFloor(n, false);
        },
      };
      refresh();

      // ── viewport ──
      let scale = 3;
      const layout = () => {
        const dpr = app.renderer.resolution;
        const dev = Math.max(2, Math.min(6, Math.round((app.screen.height * dpr) / (13 * TILE))));
        scale = dev / dpr;
        world.scale.set(scale);
      };
      layout();
      app.renderer.on("resize", layout);

      const keys = new Set<string>();
      let sentAt = 0;
      app.ticker.add((ticker) => {
        const dt = Math.min(ticker.deltaMS / 1000, 0.05);
        if (meActor.t >= 1) {
          let next = path.shift();
          if (!next) {
            const dx = (keys.has("arrowright") || keys.has("d") ? 1 : 0) - (keys.has("arrowleft") || keys.has("a") ? 1 : 0);
            const dy = dx ? 0 : (keys.has("arrowdown") || keys.has("s") ? 1 : 0) - (keys.has("arrowup") || keys.has("w") ? 1 : 0);
            if ((dx || dy) && walkable(map, meActor.tx + dx, meActor.ty + dy)) next = { x: meActor.tx + dx, y: meActor.ty + dy };
            else if (dx || dy) meActor.dir = dy < 0 ? "up" : dy > 0 ? "down" : dx < 0 ? "left" : "right";
          }
          if (next && walkable(map, next.x, next.y)) {
            stepActor(meActor, next.x, next.y);
            if (shown && performance.now() - sentAt > 120) { send("mv", { h: self.handle, x: next.x, y: next.y }); sentAt = performance.now(); }
          }
        }
        const wasMoving = meActor.t < 1;
        const pos = place(meActor, dt, path.length > 0);
        if (wasMoving && meActor.t >= 1) {
          refresh();
          if (shown && path.length === 0) void channel?.track({ name: self.name, avatar: self.avatar, x: meActor.tx, y: meActor.ty });
        }
        for (const { actor } of seated) place(actor, dt, false);
        for (const o of others.values()) place(o, dt, false);

        if (target) {
          bob += dt;
          marker.visible = true;
          marker.position.set(target.x * TILE + TILE / 2 - 3, (target.y + 1) * TILE - target.h - 6 - (reduce ? 0 : Math.round(Math.sin(bob * 4))));
        } else marker.visible = false;

        // camera: follow, clamp to the map, snap to whole device pixels
        const dpr = app.renderer.resolution, vw = app.screen.width, vh = app.screen.height;
        const mw = MAP_W * TILE * scale, mh = MAP_H * TILE * scale;
        let cx = vw / 2 - pos.x * scale, cy = vh / 2 - pos.y * scale;
        cx = mw <= vw ? (vw - mw) / 2 : Math.min(0, Math.max(vw - mw, cx));
        cy = mh <= vh ? (vh - mh) / 2 : Math.min(0, Math.max(vh - mh, cy));
        world.position.set(Math.round(cx * dpr) / dpr, Math.round(cy * dpr) / dpr);
      });

      // ── input ──
      const typing = (e: KeyboardEvent) => e.target instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName);
      const down = (e: KeyboardEvent) => {
        if (typing(e)) return;
        const k = e.key.toLowerCase();
        if (["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d"].includes(k)) { e.preventDefault(); keys.add(k); path.length = 0; }
        if ((k === "e" || k === "enter") && !e.repeat) act.current.open();
      };
      const up = (e: KeyboardEvent) => keys.delete(e.key.toLowerCase());
      const blur = () => keys.clear();
      window.addEventListener("keydown", down);
      window.addEventListener("keyup", up);
      window.addEventListener("blur", blur);
      app.stage.eventMode = "static";
      app.stage.hitArea = app.screen;
      app.stage.on("pointertap", (ev) => {
        const pt = world.toLocal(ev.global);
        const tx = Math.floor(pt.x / TILE), ty = Math.floor(pt.y / TILE);
        const piece = map.pieces.find((p) => p.interact && tx >= p.x && tx < p.x + p.w && ty >= p.y - Math.ceil(art.UP[p.kind] / TILE) && ty < p.y + p.h);
        const mate = seated.find((t) => atDesk(t) && tx === t.s.x && ty >= t.s.y - 2 && ty <= t.s.y); // the whole seated figure
        const targets: { x: number; y: number }[] = [];
        const around = (x0: number, y0: number, w: number, h: number) => {
          for (let y = y0 - 1; y <= y0 + h; y++) for (let x = x0 - 1; x <= x0 + w; x++) if (walkable(map, x, y)) targets.push({ x, y });
        };
        if (mate) around(mate.s.x, mate.s.y, 1, 1);
        else if (piece) around(piece.x, piece.y, piece.w, piece.h);
        else targets.push({ x: tx, y: ty });
        let best: { x: number; y: number }[] | null = null;
        for (const t of targets) {
          if (t.x === meActor.tx && t.y === meActor.ty) { best = []; break; }
          const p = findPath(map, meActor.tx, meActor.ty, t.x, t.y);
          if (p && (!best || p.length < best.length)) best = p;
        }
        if (best) { path.length = 0; path.push(...best); }
      });

      cleanup = () => {
        window.removeEventListener("keydown", down);
        window.removeEventListener("keyup", up);
        window.removeEventListener("blur", blur);
        if (channel) void supabase?.removeChannel(channel);
        app.destroy(true, { children: true, texture: true });
      };
    })().catch((error) => { console.error("Office failed to start", error); if (!disposed) setFailed(true); });

    return () => { disposed = true; cleanup(); act.current = { open: () => {}, wave: () => {}, floor: () => {} }; };
  }, [key, live, router]);

  const claim = async (id: string) => {
    const { error } = (await communityBrowser()?.rpc("claim_desk", { p_id: id })) ?? { error: true };
    setToast(error ? "That desk was just taken" : "This desk is yours");
    if (!error) router.refresh();
  };

  const becomeVisible = async () => {
    const s = communityBrowser();
    const { data } = (await s?.auth.getUser()) ?? { data: { user: null } };
    if (!s || !data.user) return;
    const { error } = await s.from("profile_privacy").update({ presence: "online" }).eq("user_id", data.user.id);
    if (!error) setVisible(true);
  };

  return (
    <div className={`cm-world${full ? " is-full" : ""}`} ref={host} data-online={online}>
      <button type="button" className="cm-world-full" onClick={toggleFull} aria-label={full ? "Exit full screen" : "Full screen"} aria-pressed={full}>
        <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
          {full ? <path d="M6 2v4H2M10 2v4h4M6 14v-4H2M10 14v-4h4" /> : <path d="M2 6V2h4M14 6V2h-4M2 10v4h4M14 10v4h-4" />}
        </svg>
      </button>
      {room && <div key={room} className="cm-world-room" aria-live="polite">{room}{online > 0 && ` · ${online + 1} here`}</div>}
      {live && !visible && <button type="button" className="cm-world-visible" onClick={becomeVisible}>You&apos;re invisible · Show me</button>}
      {toast && <div className="cm-world-toast" role="status">{toast}</div>}
      {card && (
        <div className="cm-world-prompt">
          {card.kind === "desk" ? (
            <div className="cm-world-card">
              <strong>{card.mine ? "Your desk" : card.owner ? `${card.owner}'s desk` : "Free desk"}</strong>
              <small>{card.mine ? "Add badges and draw on your screen." : card.owner ? "Claimed" : card.hasDesk ? "Move here? Your current desk is freed." : "Claim it to make it yours."}</small>
              <div className="cm-actions">
                {card.mine ? <Link className="cm-btn small" href="/community/profile#desk">Decorate</Link>
                  : !card.owner && <button type="button" className="cm-btn small" onClick={() => claim(card.id)}>Claim this desk</button>}
              </div>
            </div>
          ) : card.kind === "elevator" ? (
            <div className="cm-world-card">
              <strong>Elevator · Floor {card.floor}</strong>
              <small>{live ? "Every floor has the same rooms. Full floors open the next one." : "Other floors open with the live office."}</small>
              {live && (
                <div className="cm-actions">
                  <button type="button" className="cm-btn secondary small" disabled={card.floor <= 1} onClick={() => act.current.floor(card.floor - 1)}>Down</button>
                  <button type="button" className="cm-btn secondary small" disabled={card.floor >= TOP_FLOOR} onClick={() => act.current.floor(card.floor + 1)}>Up</button>
                </div>
              )}
            </div>
          ) : card.kind === "object" ? (
            card.href ? <Link href={card.href}>{card.label} <kbd>E</kbd></Link> : <span>{card.label} · soon</span>
          ) : (
            <div className="cm-world-card">
              <strong>{card.name}</strong>
              {card.role && <small>{card.role}</small>}
              <div className="cm-actions">
                {card.handle ? <Link className="cm-btn small" href={`/community/inbox?with=${card.handle}`}>Message</Link> : <span className="cm-small cm-muted">Not on the community yet</span>}
                {card.live && card.handle && <button type="button" className="cm-btn secondary small" onClick={() => act.current.wave(card.handle!)}>Wave</button>}
                {card.linkedin && <a className="cm-btn secondary small" href={card.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a>}
              </div>
            </div>
          )}
        </div>
      )}
      {failed && (
        <div className="cm-world-fallback">
          <p>The office needs WebGL, which this browser has turned off.</p>
          <Link className="cm-link" href="/community">Back to the community</Link>
        </div>
      )}
    </div>
  );
}
