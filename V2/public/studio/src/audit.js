// AUDIT / GOVERNANCE / COMPLIANCE export.
// Because every change is stored in one typed, signed, ordered format, producing the
// document an auditor asks for is a projection over the log — not a manual assembly.
// This turns "prove your AI change controls" from a multi-week fire drill into an export.

export function buildAuditPack(exported, verifyResult) {
  const byKind = {};
  const byActor = {};
  for (const r of exported.records) {
    byKind[r.change.kind] = (byKind[r.change.kind] || 0) + 1;
    byActor[r.change.actor] = (byActor[r.change.actor] || 0) + 1;
  }

  // A tiny illustrative compliance map: which regimes each change-kind produces evidence for.
  const complianceMap = {
    prompt: ['EU AI Act Art.12 (event logging)', 'DPDP (processing record)'],
    model: ['EU AI Act Art.12', 'SR 11-7 (model change record)', 'RBI model-risk (draft)'],
    policy: ['EU AI Act Art.12', 'SOC 2 CC (change management)'],
    config: ['SOC 2 CC (change management)'],
    change: ['EU AI Act Art.12'],
  };
  const obligationsCovered = new Set();
  for (const kind of Object.keys(byKind)) (complianceMap[kind] || []).forEach(o => obligationsCovered.add(o));

  return {
    title: 'CooL Audit Pack (demo)',
    generated_at: exported.signed_tree_head.at,
    summary: {
      total_changes: exported.records.length,
      verified: verifyResult.valid,
      failed: verifyResult.invalid,
      tamper_evident_root: exported.signed_tree_head.root,
      tree_consistent: verifyResult.tree_root_matches_sth,
      signature_alg: 'ML-DSA-65 + Ed25519 (hybrid, post-quantum)',
      attestation: 'SIMULATED in this demo — real on Phala TDX',
    },
    changes_by_kind: byKind,
    changes_by_actor: byActor,
    obligations_evidenced: [...obligationsCovered],
    change_log: exported.records.map(r => ({
      id: r.id,
      when: r.captured_at,
      kind: r.change.kind,
      subject: r.change.subject,
      actor: r.change.actor,
      before: r.change.before,
      after: r.change.after,
      content_hash: r.content_hash,
      verdict: verifyResult.results.find(v => v.id === r.id)?.verdict,
    })),
    honesty_note:
      'Every row above is cryptographically bound and hybrid-signed; anyone can re-verify offline. ' +
      'Hardware attestation is simulated in this demo and becomes a real Intel TDX quote on Phala.',
  };
}
