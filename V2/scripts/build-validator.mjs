/**
 * Precompile the receipt JSON Schema into a plain-JavaScript validator.
 *
 * ── why this exists ──
 *
 * Ajv's normal mode is a just-in-time compiler: `ajv.compile(schema)` generates
 * JavaScript source for the schema and evaluates it with `new Function`. That
 * is fast and it is completely incompatible with a Content-Security-Policy that
 * does not grant `'unsafe-eval'` — which this site's does not, and must not,
 * because granting it to run a schema validator would hand the same privilege
 * to anything else that lands on the page.
 *
 * The failure was not theoretical. The live demo — the one surface on the site
 * that proves the whole argument — ran seven of its eight stages and then died
 * on the eighth with:
 *
 *     EvalError: Refused to evaluate a string as JavaScript because
 *     'unsafe-eval' is not an allowed source of script
 *
 * It had never worked in production. In development the policy includes
 * `'unsafe-eval'` for Turbopack, so the bug was invisible there; and before the
 * CSP nonce fix, every script on the page was blocked, so the demo never got
 * far enough to reach stage eight at all. Two separate conditions hid it.
 *
 * ── why not just swap Ajv for Zod ──
 *
 * Zod is already a dependency and does no codegen, so it would also fix this.
 * It was rejected because `RECEIPT_SCHEMA` is not ours to restate: it is kept
 * byte-identical to `cool-spec/receipt-format/receipt.schema.json`, and a
 * conformance test asserts the match. Hand-porting it to Zod would replace a
 * checked copy of the spec with an unchecked paraphrase, and the first time the
 * two drifted, the site would be validating receipts against a schema that is
 * not the published one. The site's entire claim is that its verifier is the
 * same implementation as the CLI's.
 *
 * So: same Ajv, same schema, same semantics — compiled at build time rather
 * than in the browser.
 *
 * ── keeping it honest ──
 *
 * The output is committed, and `--check` re-generates and compares instead of
 * writing. `npm run verify:all` runs the check, so a schema edit that is not
 * accompanied by a regenerated validator fails before review rather than
 * silently shipping a validator for the previous schema.
 */
import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

import { Ajv2020 } from "ajv/dist/2020.js";
import standaloneCode from "ajv/dist/standalone/index.js";

import { RECEIPT_SCHEMA } from "../src/lib/cool/schema.ts";

const here = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(here, "../src/lib/cool/receipt-validator.generated.js");

const BANNER = `/* eslint-disable */
// @ts-nocheck
/**
 * GENERATED — DO NOT EDIT.
 *
 * Ajv validator for cool.receipt.v1, precompiled by scripts/build-validator.mjs
 * so the browser never has to call \`new Function\`. See that script for why.
 *
 * Regenerate:  npm run build:validator
 * Verify:      npm run verify:validator
 */
`;

/**
 * `source: true` makes Ajv emit code instead of a closure; `esm: true` emits
 * an ES module. `strict: false` and `allErrors: true` must match the runtime
 * options the site used before, or the precompiled validator would accept or
 * reject differently from the one it replaces.
 */
const ajv = new Ajv2020({
  strict: false,
  allErrors: true,
  logger: false,
  code: { source: true, esm: true },
});

const validate = ajv.compile(RECEIPT_SCHEMA);
const generated = BANNER + standaloneCode(ajv, validate);

const check = process.argv.includes("--check");

if (check) {
  if (!existsSync(OUT)) {
    console.error(`\n  MISSING  ${OUT}\n  Run: npm run build:validator\n`);
    process.exit(1);
  }
  const onDisk = readFileSync(OUT, "utf8");
  if (onDisk.trim() !== generated.trim()) {
    console.error(
      "\n  STALE  the committed receipt validator does not match the schema." +
        "\n  The schema changed without regenerating the validator." +
        "\n  Run: npm run build:validator\n",
    );
    process.exit(1);
  }
  console.log("\n  receipt validator is up to date with the schema\n");
} else {
  writeFileSync(OUT, generated, "utf8");
  console.log(
    `\n  wrote ${OUT.split(/[\\/]/).pop()} — ${(generated.length / 1024).toFixed(1)} kB, no runtime eval\n`,
  );
}
