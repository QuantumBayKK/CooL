// Real hybrid cryptography: ML-DSA-65 (NIST FIPS-204 post-quantum) + Ed25519 (classical).
// Hybrid = a record is signed by BOTH. It stays secure if either scheme is ever broken,
// and it is safe against "harvest-now, decrypt/forge-later" quantum attacks.

import { ml_dsa65 } from '@noble/post-quantum/ml-dsa.js';
import { ed25519 } from '@noble/curves/ed25519.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { randomBytes, bytesToHex, hexToBytes } from '@noble/hashes/utils.js';

// Universal hex (works in Node AND the browser — no Buffer dependency)
const hex = (u8) => bytesToHex(u8);
const unhex = (s) => hexToBytes(s);

// ---- hashing ----
export function hash(bytes) {
  return hex(sha256(bytes));
}

// ---- key management ----
// In production these keys are sealed to the TEE (dstack-KMS on Phala TDX).
// Here they are generated locally so the demo runs on any laptop.
export function generateKeypair() {
  const mldsa = ml_dsa65.keygen(randomBytes(32));
  const edSk = ed25519.utils.randomSecretKey
    ? ed25519.utils.randomSecretKey()
    : ed25519.utils.randomPrivateKey();
  const edPk = ed25519.getPublicKey(edSk);
  return {
    mldsa: { publicKey: hex(mldsa.publicKey), secretKey: hex(mldsa.secretKey) },
    ed25519: { publicKey: hex(edPk), secretKey: hex(edSk) },
  };
}

// ---- hybrid sign ----
export function hybridSign(messageBytes, keys) {
  const mldsaSig = ml_dsa65.sign(messageBytes, unhex(keys.mldsa.secretKey));
  const edSig = ed25519.sign(messageBytes, unhex(keys.ed25519.secretKey));
  return {
    alg: 'ML-DSA-65+Ed25519',
    mldsa: hex(mldsaSig),
    ed25519: hex(edSig),
  };
}

// ---- hybrid verify (BOTH must pass) ----
export function hybridVerify(messageBytes, sig, pub) {
  const okMldsa = ml_dsa65.verify(unhex(sig.mldsa), messageBytes, unhex(pub.mldsa.publicKey));
  const okEd = ed25519.verify(unhex(sig.ed25519), messageBytes, unhex(pub.ed25519.publicKey));
  return { mldsa: okMldsa, ed25519: okEd, ok: okMldsa && okEd };
}

export { hex, unhex };
