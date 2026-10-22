/**
 * Claim registry integrity: every claim has a source and a date, nothing
 * UNVERIFIED is publishable, and the reserved-language list from the brief
 * never appears in a publishable claim.
 */
import test from "node:test";
import assert from "node:assert/strict";

import { CLAIMS } from "../src/content/claims";

const BANNED = [
  "immutable",
  "tamper-proof",
  "tamperproof",
  "court-admissible",
  "guaranteed",
  "open source",
  "open-source",
  "production-ready",
];

test("every claim has a source and an ISO check date", () => {
  for (const [id, c] of Object.entries(CLAIMS)) {
    assert.ok(c.source && c.source.length > 3, `${id}: source`);
    assert.match(c.checked, /^\d{4}-\d{2}-\d{2}$/, `${id}: checked`);
  }
});

test("no UNVERIFIED claim is publishable", () => {
  for (const [id, c] of Object.entries(CLAIMS)) {
    if (c.status === "UNVERIFIED") assert.equal(c.publish, false, id);
  }
});

test("publishable wording avoids banned language", () => {
  for (const [id, c] of Object.entries(CLAIMS)) {
    if (!c.publish) continue;
    const w = c.wording.toLowerCase();
    for (const b of BANNED) assert.ok(!w.includes(b), `${id} uses "${b}"`);
  }
});
