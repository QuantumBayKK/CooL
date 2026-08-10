/**
 * Types for the generated Ajv validator.
 *
 * Hand-written rather than generated: Ajv's standalone output is plain
 * JavaScript with `// @ts-nocheck`, and the only thing a caller needs to know
 * about it is the `ValidateFunction` contract — a predicate that also hangs
 * its `errors` array off itself. Declaring that here keeps `verify.ts` fully
 * typed against a file TypeScript never reads.
 */
import type { ValidateFunction } from "ajv";

declare const validate: ValidateFunction;
export default validate;
