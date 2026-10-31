import { test } from "node:test";
import assert from "node:assert/strict";

import { bioError, handleError, nameError, parseSkills, reasonError, triedError } from "../src/lib/community/checks";
import { safeReturnPath } from "../src/lib/community/paths";
import { ROOMS } from "../src/lib/community/world";

test("safeReturnPath keeps same-origin community paths only", () => {
  assert.equal(safeReturnPath("/community/projects/cool-sdk?x=1#issues"), "/community/projects/cool-sdk?x=1#issues");
  assert.equal(safeReturnPath("/community"), "/community");
  for (const bad of [null, "", "https://evil.example/community", "//evil.example", "/\\evil.example", "/investor", "/admin/login",
    "community/x", "/community\u0000x", "javascript:alert(1)", "/communityx", "/" + "a".repeat(600)]) {
    assert.equal(safeReturnPath(bad), "/community/profile", String(bad).slice(0, 30));
  }
});

test("welcome and profile checks", () => {
  assert.equal(nameError("Ada"), "");
  assert.ok(nameError(" A "));
  assert.equal(handleError("ada-lovelace"), "");
  for (const bad of ["ab", "-ada", "ada-", "Ada", "ada_l", "a".repeat(31)]) assert.ok(handleError(bad), bad);
  assert.equal(triedError("used"), "");
  assert.ok(triedError("maybe"));
  assert.ok(reasonError("too short"));
  assert.equal(reasonError("I want to learn verifiable AI audit trails."), "");
  assert.ok(bioError("x".repeat(281)));
});

test("skills are trimmed, de-duplicated case-insensitively and capped", () => {
  assert.deepEqual(parseSkills(" TypeScript, typescript ,, Rust "), ["TypeScript", "Rust"]);
  assert.equal(parseSkills(Array.from({ length: 30 }, (_, i) => `s${i}`).join(",")).length, 20);
  assert.equal(parseSkills("x".repeat(40))[0]!.length, 32);
});

test("every room has a stable id, a sane capacity and web equivalents for its actions", () => {
  const ids = new Set<string>();
  for (const r of ROOMS) {
    assert.match(r.id, /^hq\.[a-z]+$/);
    assert.ok(!ids.has(r.id), `duplicate ${r.id}`);
    ids.add(r.id);
    assert.ok(r.capacity >= 1 && r.capacity <= 50);
    assert.ok(r.interactables.length > 0);
    for (const i of r.interactables) assert.match(i.href, /^\/community(\/|$|#)/);
  }
});
