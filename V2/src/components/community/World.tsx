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
type Props = { me: Me; flags: Record<string, boolean>; team: TeamMember[]; desks: Desk[]; tour?: boolean };
type Card =
  | { kind: "object"; label: string; href: string | null }
  | { kind: "elevator"; floor: number }
  | { kind: "meeting" }
  | { kind: "desk"; id: string; owner: string | null; mine: boolean; hasDesk: boolean }
  | { kind: "person"; key: string; name: string; role?: string; handle: string | null; linkedin?: string | null; live: boolean };
type Dir = "down" | "up" | "left" | "right";

const STEP = 0.18; // seconds per tile
const FLOOR_CAP = 25; // people per floor; a full floor sends newcomers to the next identical floor
const TOP_FLOOR = 9;
const CYCLE = [1, 0, 2, 0]; // walk frames: step, pass, other step, pass
// The tour: your character walks to each place in turn while a line explains it.
const TOUR: { go: string | null; title: string; text: string }[] = [
  { go: "lobby.directory", title: "Main lobby", text: "Everyone arrives here. Walk up to anyone to Message or Wave; the notice board has the news." },
  { go: "elevator", title: "Elevator", text: "Every floor is the same office. When one fills up, the next opens; ride up and down to visit." },
  { go: "help.guidelines", title: "Help desk", text: "The guidelines, the privacy notice and your profile settings." },
  { go: "projects.directory", title: "Project district", text: "Open-source projects you can join, any project, not just ours." },
  { go: "commons.ideas", title: "The Commons", text: "Post an idea for a project and shape it together in the open." },
  { go: "assembly.polls", title: "Assembly hall", text: "Votes decide which ideas become real projects." },
  { go: "meeting.terminal", title: "Meeting hall", text: "Start a Google Meet here and everyone on your floor gets a Join button." },
  { go: "showcase.wall", title: "Showcase", text: "What the community has built." },
  { go: "desk:q1", title: "Quiet work area", text: "Claim a free desk, pin badges on it and draw on its screen." },
  { go: null, title: "And on the site", text: "Inbox for messages, People to meet everyone, and your profile for your points. You earn points by joining, proposing, commenting, voting in public polls and contributing." },
];
const MEET = /^https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}$/; // the only links the office will show

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
export function World({ me, flags, team, desks, tour: startTour = false }: Props) {
  const router = useRouter();
  const host = useRef<HTMLDivElement>(null);
  const act = useRef<{ open: () => void; wave: (handle: string) => void; floor: (n: number) => void; meet: () => void; go: (id: string) => void }>({ open: () => {}, wave: () => {}, floor: () => {}, meet: () => {}, go: () => {} });
  const [tourStep, setTourStep] = useState<number | null>(null);
  const meetRef = useRef("");
  const [meetings, setMeetings] = useState<{ handle: string; name: string; link: string }[]>([]);
  const [meetDraft, setMeetDraft] = useState("");
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
      const others = new Map<string, Actor & { name: string; seen: number; route: { x: number; y: number }[] }>();
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
        } else if (piece?.interact === "meeting.terminal") {
          next = { kind: "meeting" };
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
      // What the floor knows about me: where I stand, and the Google Meet I'm in, if I shared one.
      let sent = { x: -1, y: -1 }, sentAt = 0, tracked = { x: -1, y: -1 }, stoppedAt = 0;
      const announce = () => {
        tracked = { x: meActor.tx, y: meActor.ty };
        return channel?.track({ name: self.name, avatar: self.avatar, x: meActor.tx, y: meActor.ty, ...(meetRef.current && { meet: meetRef.current }) });
      };
      const clearOthers = () => { for (const o of others.values()) { o.sprite.destroy(); o.shadow.destroy(); o.tag.destroy(); } others.clear(); syncSeats(); setOnline(0); setMeetings([]); };
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
          const state = ch.presenceState<{ name: string; avatar: unknown; x: number; y: number; meet?: unknown }>();
          const count = Object.keys(state).filter((h) => h !== self.handle).length;
          // Arriving at a full floor sends you up to the next identical one.
          if (first && auto && count >= FLOOR_CAP && n < TOP_FLOOR) { first = false; void joinFloor(n + 1, true); return; }
          first = false;
          for (const [handle, metas] of Object.entries(state)) {
            const meta = metas[0];
            if (!meta || handle === self.handle) continue;
            const x = Number(meta.x), y = Number(meta.y);
            const known = others.get(handle);
            // Where they settled. Moves arrive faster than this, so it only corrects someone whose
            // moves were missed, never a person who is walking.
            if (known) {
              if (known.t >= 1 && !known.route.length && Date.now() - known.seen > 2000 && walkable(map, x, y) && (x !== known.tx || y !== known.ty)) { known.fx = known.tx = x; known.fy = known.ty = y; }
              continue;
            }
            const name = teamFor(handle)?.name ?? clean(meta.name, 40);
            const o = makeActor(meta.avatar, name, walkable(map, x, y) ? x : map.spawn.x, walkable(map, x, y) ? y : map.spawn.y);
            others.set(handle, Object.assign(o, { name, seen: 0, route: [] }));
          }
          for (const [handle, o] of others) if (!state[handle]) { o.sprite.destroy(); o.shadow.destroy(); o.tag.destroy(); others.delete(handle); }
          syncSeats();
          setOnline(others.size);
          setMeetings(Object.entries(state).flatMap(([handle, metas]) => {
            const link = metas[0]?.meet;
            const o = others.get(handle);
            return typeof link === "string" && MEET.test(link) ? [{ handle, name: handle === self.handle ? "You" : o?.name ?? "Someone", link }] : [];
          }));
          refresh();
        });
        ch.on("broadcast", { event: "mv" }, ({ payload }) => {
          const o = others.get(clean(payload.h, 40));
          const x = Number(payload.x), y = Number(payload.y);
          if (!o || !walkable(map, x, y)) return; // never trust a position that is off the floor
          o.seen = Date.now();
          // Walk them there tile by tile; snap only if they're somewhere unreachable or far off.
          const route = findPath(map, o.tx, o.ty, x, y);
          if (route && route.length <= 40) o.route = route;
          else { o.route = []; o.fx = o.tx = x; o.fy = o.ty = y; o.t = 1; }
        });
        ch.on("broadcast", { event: "wave" }, ({ payload }) => {
          if (payload.to === self.handle) setToast(`${clean(payload.name, 40)} waved at you`);
        });
        ch.subscribe(async (status) => {
          if (status === "SUBSCRIBED" && shown && channel === ch) { await announce(); sent = { x: meActor.tx, y: meActor.ty }; }
        });
        refresh();
      };
      // If the connection drops (sleep, network change, an expired sign-in), rejoin the same floor.
      let broken = 0;
      const checkLive = () => {
        if (disposed || !supabase || !channel) return;
        broken = channel.state === "joined" || channel.state === "joining" ? 0 : broken + 1;
        if (broken >= 2) { broken = 0; void supabase.realtime.setAuth().then(() => joinFloor(floor, false)).catch(() => {}); }
      };
      const watchdog = setInterval(checkLive, 5000);
      const onShow = () => { if (document.visibilityState === "visible") checkLive(); };
      document.addEventListener("visibilitychange", onShow);
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

      // Walks to the nearest free tile beside a piece (the tour, and the end-to-end suite).
      const walkNextTo = (id: string) => {
        const p = map.pieces.find((q) => q.interact === id);
        let best: { x: number; y: number }[] | null = null;
        for (let y = p ? p.y - 1 : 0; p && y <= p.y + p.h; y++) for (let x = p.x - 1; x <= p.x + p.w; x++) {
          // only spots where this piece is the one within reach (corners and neighbours' spots don't count)
          if (!walkable(map, x, y) || reachable(map, x, y)?.interact !== id) continue;
          const r = x === meActor.tx && y === meActor.ty ? [] : findPath(map, meActor.tx, meActor.ty, x, y);
          if (r && (!best || r.length < best.length)) best = r;
        }
        if (best) { path.length = 0; path.push(...best); }
        return Boolean(best);
      };

      act.current = {
        open: () => {
          const p = reachable(map, meActor.tx, meActor.ty);
          const mate = seated.find((t) => atDesk(t) && near(t.s.x, t.s.y));
          if (mate?.m.joined && mate.m.member_handle) router.push(`/community/inbox?with=${mate.m.member_handle}`);
          else if (p && !mate && p.interact !== "elevator" && !p.interact?.startsWith("desk:")) { const h = hrefFor(p, flagMap); if (h) router.push(h); }
        },
        wave: (handle) => { send("wave", { to: handle, name: self.name }); setToast("You waved"); },
        meet: () => { void announce(); },
        go: (id) => { walkNextTo(id); },
        floor: (n) => {
          if (n < 1 || n > TOP_FLOOR || n === floor) return;
          setToast(`Floor ${n}`);
          void joinFloor(n, false);
        },
      };
      // A hook for the local end-to-end suite to read positions and walk; never part of a production build.
      if (process.env.NODE_ENV !== "production") Object.assign(window, { __office: {
        me: () => ({ x: meActor.tx, y: meActor.ty, floor }),
        others: () => [...others].map(([h, o]) => ({ h, name: o.name, x: o.tx, y: o.ty, moving: o.t < 1 || o.route.length > 0 })),
        walkTo: (x: number, y: number) => { const r = findPath(map, meActor.tx, meActor.ty, x, y); if (r) { path.length = 0; path.push(...r); } return Boolean(r); },
        nextTo: walkNextTo,
      } });
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
          if (next && walkable(map, next.x, next.y)) stepActor(meActor, next.x, next.y);
        }
        const wasMoving = meActor.t < 1;
        const pos = place(meActor, dt, path.length > 0);
        if (wasMoving && meActor.t >= 1) { refresh(); stoppedAt = performance.now(); }
        // Tell the floor where I'm heading: a clicked route in one message, held keys a few times a
        // second (others walk the tiles in between). Once I've stood still, settle my position.
        if (shown && channel) {
          const now = performance.now();
          const goal = path.length ? path[path.length - 1]! : { x: meActor.tx, y: meActor.ty };
          if ((goal.x !== sent.x || goal.y !== sent.y) && now - sentAt >= 250) { send("mv", { h: self.handle, x: goal.x, y: goal.y }); sent = goal; sentAt = now; }
          if (meActor.t >= 1 && !path.length && now - stoppedAt >= 600 && (meActor.tx !== tracked.x || meActor.ty !== tracked.y)) void announce();
        }
        for (const { actor } of seated) place(actor, dt, false);
        for (const o of others.values()) {
          if (o.t >= 1 && o.route.length) { const n = o.route.shift()!; stepActor(o, n.x, n.y); if (!o.route.length) refresh(); }
          place(o, dt, o.route.length > 0);
        }

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
        clearInterval(watchdog);
        document.removeEventListener("visibilitychange", onShow);
        if (channel) void supabase?.removeChannel(channel);
        app.destroy(true, { children: true, texture: true });
      };
    })().catch((error) => { console.error("Office failed to start", error); if (!disposed) setFailed(true); });

    return () => { disposed = true; cleanup(); act.current = { open: () => {}, wave: () => {}, floor: () => {}, meet: () => {}, go: () => {} }; };
  }, [key, live, router]);

  // New members arrive with ?tour=1; anyone can replay it from the Tour button.
  useEffect(() => {
    if (!startTour) return;
    window.history.replaceState(null, "", "/community/world");
    const t = setTimeout(() => setTourStep(0), 1200); // let the office load first
    return () => clearTimeout(t);
  }, [startTour]);
  useEffect(() => {
    const go = tourStep === null ? null : TOUR[tourStep]?.go;
    if (!go) return;
    const t = setTimeout(() => act.current.go(go), 50);
    return () => clearTimeout(t);
  }, [tourStep]);
  const step = tourStep === null ? null : TOUR[tourStep];

  const claim = async (id: string) => {
    const { error } = (await communityBrowser()?.rpc("claim_desk", { p_id: id })) ?? { error: true };
    setToast(error ? "That desk was just taken" : "This desk is yours");
    if (!error) router.refresh();
  };

  // Shares a Google Meet with this floor (or stops, given ""). Accepts a full link or the bare code.
  const shareMeet = (input: string) => {
    const code = /(?:^|meet\.google\.com\/)([a-z]{3}-[a-z]{4}-[a-z]{3})(?![a-z-])/.exec(input.trim().toLowerCase())?.[1];
    if (input && !code) return setToast("That isn't a Google Meet link");
    if (input && !visible) return setToast("You're invisible, so no one would see it");
    meetRef.current = code ? `https://meet.google.com/${code}` : "";
    act.current.meet();
    setMeetDraft("");
    setToast(code ? "Shared with everyone on this floor" : "Stopped sharing");
  };

  const becomeVisible = async () => {
    const s = communityBrowser();
    const { data } = (await s?.auth.getUser()) ?? { data: { user: null } };
    if (!s || !data.user) return;
    const { error } = await s.from("profile_privacy").update({ presence: "online" }).eq("user_id", data.user.id);
    if (!error) setVisible(true);
  };

  return (
    <div className={`cm-world${full ? " is-full" : ""}${tourStep !== null ? " is-touring" : ""}`} ref={host} data-online={online}>
      <button type="button" className="cm-world-full" onClick={toggleFull} aria-label={full ? "Exit full screen" : "Full screen"} aria-pressed={full}>
        <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
          {full ? <path d="M6 2v4H2M10 2v4h4M6 14v-4H2M10 14v-4h4" /> : <path d="M2 6V2h4M14 6V2h-4M2 10v4h4M14 10v4h-4" />}
        </svg>
      </button>
      <button type="button" className="cm-world-tourbtn" onClick={() => setTourStep(0)}>Tour</button>
      {step && tourStep !== null && (
        <div className="cm-world-tour" role="dialog" aria-label="Office tour">
          <small>{tourStep + 1} of {TOUR.length}</small>
          <strong>{step.title}</strong>
          <p>{step.text}</p>
          {!step.go && (
            <div className="cm-actions">
              <Link className="cm-btn secondary small" href="/community/inbox">Inbox</Link>
              <Link className="cm-btn secondary small" href="/community/contributors">People</Link>
              <Link className="cm-btn secondary small" href="/community/profile#points">Your points</Link>
            </div>
          )}
          <div className="cm-actions">
            {tourStep + 1 < TOUR.length
              ? <button type="button" className="cm-btn small" onClick={() => setTourStep(tourStep + 1)}>Next</button>
              : <button type="button" className="cm-btn small" onClick={() => setTourStep(null)}>Start exploring</button>}
            {tourStep + 1 < TOUR.length && <button type="button" className="cm-btn secondary small" onClick={() => setTourStep(null)}>End tour</button>}
          </div>
        </div>
      )}
      {room && <div key={room} className="cm-world-room" aria-live="polite">{room}</div>}
      {(online > 0 || meetings.length > 0) && (
        <div className="cm-world-live">
          {online > 0 && <span><i aria-hidden /> {online + 1} here</span>}
          {meetings.map((m) => (
            <a key={m.handle} href={m.link} target="_blank" rel="noopener noreferrer">{m.handle === me.handle ? "Your Google Meet" : `${m.name} is in a Google Meet`} · Join</a>
          ))}
        </div>
      )}
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
          ) : card.kind === "meeting" ? (
            <div className="cm-world-card">
              <strong>Meeting terminal</strong>
              {meetings.some((m) => m.handle === me.handle) ? (
                <>
                  <small>Your Google Meet is shown to everyone on this floor.</small>
                  <div className="cm-actions"><button type="button" className="cm-btn secondary small" onClick={() => shareMeet("")}>Stop sharing</button></div>
                </>
              ) : (
                <>
                  <small>Start a Google Meet, then paste its link here to invite everyone on this floor.</small>
                  <div className="cm-actions"><a className="cm-btn small" href="https://meet.google.com/new" target="_blank" rel="noopener noreferrer">Start a Google Meet</a></div>
                  <form className="cm-world-meetform" onSubmit={(e) => { e.preventDefault(); shareMeet(meetDraft); }}>
                    <input aria-label="Google Meet link" placeholder="meet.google.com/abc-defg-hij" value={meetDraft} maxLength={200} onChange={(e) => setMeetDraft(e.target.value)} />
                    <button type="submit" className="cm-btn secondary small" disabled={!meetDraft.trim()}>Share</button>
                  </form>
                </>
              )}
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
