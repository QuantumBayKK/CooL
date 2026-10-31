import { test } from "node:test";
import assert from "node:assert/strict";

import { DISTRICTS, MAP_H, MAP_W, buildWorld, findPath, reachable, teamSeat, walkable } from "../src/lib/community/world-map";
import { ROOMS } from "../src/lib/community/world";

const m = buildWorld();

test("spawn is walkable and every district can be reached from it", () => {
  assert.ok(walkable(m, m.spawn.x, m.spawn.y));
  for (const d of DISTRICTS) {
    let ok = false;
    for (let y = d.y0; y < d.y0 + 9 && !ok; y++) for (let x = d.x0; x < d.x0 + 14 && !ok; x++) {
      if (walkable(m, x, y) && findPath(m, m.spawn.x, m.spawn.y, x, y)) ok = true;
    }
    assert.ok(ok, `${d.id} is unreachable`);
  }
});

test("every interactable in the world is reachable, and every room's actions exist in the world", () => {
  const ids = new Set<string>();
  for (const p of m.pieces.filter((p) => p.interact)) {
    ids.add(p.interact!);
    assert.ok(p.label, `${p.interact} has a label`);
    let ok = false;
    for (let y = p.y - 1; y <= p.y + p.h && !ok; y++) for (let x = p.x - 1; x <= p.x + p.w && !ok; x++) {
      if (walkable(m, x, y) && reachable(m, x, y)?.interact === p.interact && findPath(m, m.spawn.x, m.spawn.y, x, y)) ok = true;
    }
    assert.ok(ok, `${p.interact} cannot be reached`);
  }
  for (const r of ROOMS) for (const i of r.interactables) assert.ok(ids.has(i.id), `${i.id} has no object in the world`);
});

test("furniture stays inside its district and solid pieces never overlap", () => {
  const taken = new Set<string>();
  for (const p of m.pieces) {
    const d = m.districtAt(p.x, p.y);
    assert.ok(d && m.districtAt(p.x + p.w - 1, p.y + p.h - 1)?.id === d.id, `${p.kind} at ${p.x},${p.y} leaves its room`);
    if (!p.solid) continue;
    for (let y = p.y; y < p.y + p.h; y++) for (let x = p.x; x < p.x + p.w; x++) {
      assert.ok(!taken.has(`${x},${y}`), `overlap at ${x},${y}`);
      taken.add(`${x},${y}`);
    }
  }
});

test("paths are 4-directional, one tile per step, and avoid solid tiles", () => {
  const d = DISTRICTS.find((x) => x.id === "hq.events")!;
  const path = findPath(m, m.spawn.x, m.spawn.y, d.x0 + 7, d.y0 + 8)!;
  assert.ok(path.length > 5);
  let px = m.spawn.x, py = m.spawn.y;
  for (const s of path) {
    assert.equal(Math.abs(s.x - px) + Math.abs(s.y - py), 1);
    assert.ok(walkable(m, s.x, s.y));
    px = s.x; py = s.y;
  }
  assert.equal(findPath(m, m.spawn.x, m.spawn.y, 0, 0), null, "void is unreachable");
  assert.equal(m.floor.length, MAP_H);
  assert.equal(m.floor[0]!.length, MAP_W);
});

test("team seats sit on chairs that can be walked up to", () => {
  for (const seat of [1, 2]) {
    const s = teamSeat(seat)!;
    assert.ok(m.pieces.some((p) => p.kind === "chair" && p.x === s.x && p.y === s.y), `seat ${seat} is a chair`);
    const beside = [[1, 0], [-1, 0], [0, 1]].map(([dx, dy]) => ({ x: s.x + dx!, y: s.y + dy! })).filter((t) => walkable(m, t.x, t.y));
    assert.ok(beside.some((t) => findPath(m, m.spawn.x, m.spawn.y, t.x, t.y)), `seat ${seat} is reachable`);
  }
});
