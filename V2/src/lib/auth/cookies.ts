/**
 * Cookie names, isolated from the crypto that uses them.
 *
 * The middleware runs on the Edge runtime and only needs to know whether a
 * cookie is present. Importing that name from `session.ts` dragged `node:crypto`
 * into the Edge bundle — which Turbopack warns about and which would fail at
 * runtime on a real edge deployment, for the sake of two string constants.
 *
 * So the names live here, with no imports at all, and both the Node-side
 * session module and the Edge-side middleware read them from one place. Two
 * copies of a cookie name is exactly the kind of duplication that produces a
 * session which cannot be cleared.
 */

export const SESSION_COOKIE_NAME = "cool_investor";
export const ADMIN_COOKIE_NAME = "cool_admin";
