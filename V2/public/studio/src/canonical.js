// Deterministic canonical JSON serialization (RFC 8785-style: sorted keys, no whitespace).
// Same logical object -> exact same bytes, every time, on every machine.
// This is what makes a hash reproducible and a signature verifiable by anyone.

export function canonicalize(value) {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return '[' + value.map(canonicalize).join(',') + ']';
  }
  const keys = Object.keys(value).sort();
  return '{' + keys.map(k => JSON.stringify(k) + ':' + canonicalize(value[k])).join(',') + '}';
}

export function canonicalBytes(value) {
  return new TextEncoder().encode(canonicalize(value));
}
