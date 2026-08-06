import assert from "node:assert/strict";
import { test } from "node:test";

import {
  CODE_PREFIX,
  codeHint,
  digestsEqual,
  generateCode,
  hashCode,
  normaliseCode,
  toBytea,
} from "../src/lib/auth/codes";
import { truncateIp } from "../src/lib/auth/ip";

/**
 * Tests for the code and request helpers.
 *
 * These are the pieces where a bug is silent rather than loud: a normalisation
 * that drops a character still returns a plausible-looking code, and an IP
 * truncation that fails open still returns a string. Both would be found in
 * production, by an attacker, rather than in review.
 */

test("generated codes match the documented format", () => {
  for (let i = 0; i < 200; i += 1) {
    const code = generateCode();
    assert.match(
      code,
      /^COOL-INV-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}$/,
      `unexpected shape: ${code}`,
    );
    // The confusable characters must never appear — that is the whole reason
    // for the restricted alphabet.
    assert.ok(!/[ILOU]/.test(code.slice(9)), `confusable char in ${code}`);
  }
});

test("generated codes are not repeated", () => {
  const seen = new Set<string>();
  for (let i = 0; i < 2000; i += 1) seen.add(generateCode());
  // 2000 draws from a 32^8 space: a collision here means the RNG is broken,
  // not that we were unlucky.
  assert.equal(seen.size, 2000);
});

test("normalisation accepts every reasonable way a human types a code", () => {
  const canonical = "COOL-INV-72JQ-A91K";
  const variants = [
    "COOL-INV-72JQ-A91K",
    "cool-inv-72jq-a91k",
    "COOL INV 72JQ A91K",
    "coolinv72jqa91k",
    "72JQ-A91K",
    "72jqa91k",
    "  COOL-INV-72JQ-A91K  \n",
    "COOL–INV–72JQ–A91K", // en-dashes, as pasted from a word processor
  ];
  for (const v of variants) {
    assert.equal(normaliseCode(v), canonical, `failed on: ${JSON.stringify(v)}`);
  }
});

test("normalisation rejects wrong lengths and illegal characters", () => {
  for (const bad of ["", "72JQ", "72JQ-A91K-EXTRA", "72JQ-A91I", "72JQ-A91O", "!!!!!!!!"]) {
    assert.equal(normaliseCode(bad), null, `should reject: ${JSON.stringify(bad)}`);
  }
});

test("hashing is stable across input spellings and differs per code", () => {
  const a = hashCode("cool inv 72jq a91k");
  const b = hashCode("COOL-INV-72JQ-A91K");
  assert.ok(digestsEqual(a, b), "same code must hash identically");

  const c = hashCode("COOL-INV-72JQ-A91M");
  assert.ok(!digestsEqual(a, c), "different codes must hash differently");
  assert.equal(a.length, 32, "sha-256 is 32 bytes");
});

test("the hint reveals four characters and no more", () => {
  const code = `${CODE_PREFIX}-72JQ-A91K`;
  const hint = codeHint(code);
  assert.equal(hint, "72JQ");
  assert.equal(hint.length, 4);
  // The second group is the part that must never leak.
  assert.ok(!hint.includes("A91K"));
});

test("bytea encoding is postgres hex", () => {
  const digest = hashCode("COOL-INV-72JQ-A91K");
  const encoded = toBytea(digest);
  assert.match(encoded, /^\\x[0-9a-f]{64}$/);
});

/* ── IP truncation ────────────────────────────────────────────────────────── */

test("IPv4 is truncated to /24", () => {
  assert.equal(truncateIp("203.0.113.42"), "203.0.113.0/24");
  // The left-most entry of an XFF chain is the client.
  assert.equal(truncateIp("203.0.113.42, 70.41.3.18"), "203.0.113.0/24");
  assert.equal(truncateIp("  203.0.113.42  "), "203.0.113.0/24");
});

test("IPv6 is truncated to /48", () => {
  assert.equal(truncateIp("2001:db8:1234:5678::1"), "2001:db8:1234::/48");
});

test("truncation returns null rather than storing attacker-controlled text", () => {
  // x-forwarded-for is client-settable. Anything unparseable must be dropped,
  // never written through — it ends up in the audit log and in a rate-limit key.
  for (const bad of [
    null,
    undefined,
    "",
    "not-an-ip",
    "999.1.1.1",
    "1.2.3",
    "<script>alert(1)</script>",
    "'; drop table audit_log; --",
  ]) {
    assert.equal(truncateIp(bad), null, `should reject: ${JSON.stringify(bad)}`);
  }
});
