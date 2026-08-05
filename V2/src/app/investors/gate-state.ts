/**
 * The gate form's state shape, kept OUT of the "use server" module.
 *
 * A `"use server"` file may only export async functions — every other export is
 * a runtime error, not a compile error. This bit us: `GATE_INITIAL` started life
 * next to the action, `tsc --noEmit` was clean, `next build` was clean, and even
 * the ungated-leak proof passed, because the gate page renders fine right up
 * until someone actually submits it. The only thing that caught it was pressing
 * the button:
 *
 *   ⨯ Error: A "use server" file can only export async functions, found object.
 *
 * So the constant lives here instead. The action imports it, the form imports
 * it, and the "use server" module exports exactly one thing: a function.
 */
export interface GateState {
  /** Shown under the field. Empty when there is nothing to say. */
  readonly error: string;
}

export const GATE_INITIAL: GateState = { error: "" };
