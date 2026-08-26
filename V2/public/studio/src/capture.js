// AUTO-CAPTURE: the developer just uses their AI system normally.
// CooL wraps the AI config object in a Proxy so that EVERY change — a prompt edit,
// a model swap, a policy change — is intercepted and sealed automatically.
// No manual "seal" call anywhere in the app code. That is the "auto-capture every AI change" story.

export function autoCapture(target, log, meta = {}) {
  const actor = meta.actor || 'system';
  const source = meta.source || 'sdk-proxy';

  return new Proxy(target, {
    set(obj, key, value) {
      const before = obj[key];
      const result = Reflect.set(obj, key, value);
      // Only seal a real change (value actually differs)
      const changed = JSON.stringify(before) !== JSON.stringify(value);
      if (changed && !String(key).startsWith('_')) {
        const actorV = typeof actor === 'function' ? actor() : actor;
        const sourceV = typeof source === 'function' ? source() : source;
        const record = log.append({
          kind: inferKind(key),
          subject: String(key),
          before: before === undefined ? null : before,
          after: value,
          actor: actorV,
          source: sourceV,
        });
        // emit so the demo can narrate; in production this is silent
        if (meta.onCapture) meta.onCapture(record);
      }
      return result;
    },
  });
}

function inferKind(key) {
  const k = String(key).toLowerCase();
  if (k.includes('prompt') || k.includes('system')) return 'prompt';
  if (k.includes('model') || k.includes('weights')) return 'model';
  if (k.includes('policy') || k.includes('rule') || k.includes('guard')) return 'policy';
  if (k.includes('temperature') || k.includes('config') || k.includes('param')) return 'config';
  return 'change';
}
