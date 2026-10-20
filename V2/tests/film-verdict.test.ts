/**
 * The film-led verifier must not be able to lie.
 *
 * Runs the real verifier over the published conformance vectors and pushes the
 * result through the only display mapping the UI uses. Asserts that tampered
 * vectors fail exactly the domain the vector index names, that the one-byte
 * tamper action breaks a valid receipt, and that MOCK / ABSENT can never be
 * rendered as PASS — including when a verdict is hand-built to try.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { verifyReceipt } from "../src/lib/cool/verify";
import { stateOf, viewVerdict } from "../src/lib/film/verdictView";
import { FIXTURES, tamperOneByte } from "../src/lib/receipts";

const PUBLIC = join(import.meta.dirname, "..", "public");
const load = (p: string) => JSON.parse(readFileSync(join(PUBLIC, p), "utf8"));

test("valid fixture: core domains pass, hardware-dependent ones are not PASS", async () => {
  const valid = FIXTURES.find((f) => f.kind === "valid")!;
  const view = viewVerdict(await verifyReceipt(load(valid.path)));
  const by = Object.fromEntries(view.rows.map((r) => [r.domain, r.state]));
  assert.equal(by.binding, "PASS");
  assert.equal(by.signature, "PASS");
  assert.equal(by.inclusion, "PASS");
  assert.equal(by.attestation, "MOCK");
  assert.equal(by.anchor, "ABSENT");
  assert.equal(by.witnesses, "ABSENT");
  assert.equal(view.ok, true);
  assert.doesNotMatch(view.headline, /every domain passed/);
});

for (const f of FIXTURES.filter((x) => x.kind === "tampered")) {
  test(`tampered fixture ${f.id} fails ${f.expectFail}`, async () => {
    const view = viewVerdict(await verifyReceipt(load(f.path)));
    assert.equal(view.ok, false);
    assert.ok(view.failed.includes(f.expectFail!), `failed: ${view.failed.join(",")}`);
    assert.match(view.headline, /^FAILED/);
  });
}

test("tamper action flips one hex digit and breaks verification", async () => {
  const valid = load(FIXTURES[0]!.path);
  const t = tamperOneByte(valid);
  assert.notEqual(t.before, t.after);
  assert.equal(t.before.length, t.after.length);
  const diffs = [...t.before].filter((c, i) => c !== t.after[i]).length;
  assert.equal(diffs, 1);
  const view = viewVerdict(await verifyReceipt(t.receipt));
  assert.equal(view.ok, false);
  assert.ok(view.failed.length > 0);
  // The original is untouched — restore is just re-verifying it.
  assert.equal((await verifyReceipt(valid)).ok, true);
});

test("MOCK, SIMULATED, ABSENT and unknown statuses never display as PASS", () => {
  for (const s of ["mock", "simulated", "absent", "", "PASS", "ok", "true"]) {
    assert.notEqual(stateOf(s), "PASS", `status ${JSON.stringify(s)}`);
  }
  const forged = viewVerdict({
    ok: true,
    checks: {
      binding: { status: "pass", detail: "" },
      signature: { status: "pass", detail: "" },
      inclusion: { status: "pass", detail: "" },
      witnesses: { status: "absent", detail: "" },
      attestation: { status: "mock", detail: "" },
      anchor: { status: "absent", detail: "" },
    },
  } as never);
  assert.doesNotMatch(forged.headline, /every domain passed/);
  assert.equal(forged.limited.length, 3);
});

test("a verdict with ok:true but a failed domain is shown as failed", () => {
  const view = viewVerdict({
    ok: true,
    checks: {
      binding: { status: "fail", detail: "" },
      signature: { status: "pass", detail: "" },
      inclusion: { status: "pass", detail: "" },
      witnesses: { status: "absent", detail: "" },
      attestation: { status: "mock", detail: "" },
      anchor: { status: "absent", detail: "" },
    },
  } as never);
  assert.equal(view.ok, false);
  assert.match(view.headline, /^FAILED/);
});
