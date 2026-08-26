// CooL Console — enterprise dashboard driven by the REAL crypto engine.
// Auto-capture (Proxy) → sign (ML-DSA-65 + Ed25519) → Merkle log → offline verify.
import { TransparencyLog } from './src/log.js';
import { autoCapture } from './src/capture.js';
import { verifyAll, verifyRecord } from './src/verify.js';
import { generateKeypair } from './src/crypto.js';
import { Witness } from './src/witness.js';

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fmtTime = ts => new Date(ts).toLocaleString('en-US',{month:'short',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false});
const ago = ts => { const s=(Date.now()-ts)/1000; if(s<60)return Math.floor(s)+'s ago'; if(s<3600)return Math.floor(s/60)+'m ago'; if(s<86400)return Math.floor(s/3600)+'h ago'; return Math.floor(s/86400)+'d ago'; };

// ---------- engine ----------
const keys = generateKeypair();
const witness = new Witness('auditor-witness');
const log = new TransparencyLog(keys).attachWitness(witness);

// connected AI systems (each wrapped so changes auto-capture)
const SYSTEMS = [
  { id:'refund-agent',   name:'Refund Agent',    icon:'💳', team:'Payments',
    cfg:{ systemPrompt:'Escalate refunds over $200.', model:'gpt-4o-2024-08', refundPolicy:{autoApproveUnder:200}, temperature:0.2 } },
  { id:'fraud-scorer',   name:'Fraud Scorer',     icon:'🛡', team:'Risk',
    cfg:{ systemPrompt:'Score transactions 0–100 for fraud risk.', model:'claude-sonnet-4', threshold:82, temperature:0.0 } },
  { id:'support-copilot',name:'Support Copilot',  icon:'💬', team:'CX',
    cfg:{ systemPrompt:'Answer using the knowledge base only.', model:'gpt-4o-mini', guardrail:'no-PII-in-logs', temperature:0.3 } },
  { id:'kyc-classifier', name:'KYC Classifier',   icon:'🪪', team:'Compliance',
    cfg:{ systemPrompt:'Classify KYC documents by type.', model:'llama-3.3-70b', policy:'strict', temperature:0.1 } },
];
const sysById = Object.fromEntries(SYSTEMS.map(s=>[s.id,s]));
const proxies = {};
SYSTEMS.forEach(s => { proxies[s.id] = autoCapture(s.cfg, log, { actor:'system', source:s.id }); });

// possible mutations to simulate real engineering activity
const ACTORS = ['p.shrinaath','k.kalimuthu','a.rao','deploy-bot','m.iyer'];
const MUT = {
  'refund-agent':[ ['systemPrompt',['Approve refunds up to $500 without escalation.','Approve up to $500; flag suspected fraud.','Escalate refunds over $1000.']],
                   ['model',['gpt-4o-2024-11','gpt-4o-2024-08']], ['refundPolicy',[{autoApproveUnder:500},{autoApproveUnder:1000},{autoApproveUnder:200}]], ['temperature',[0.1,0.3]] ],
  'fraud-scorer':[ ['threshold',[78,85,90,82]], ['model',['claude-sonnet-4','claude-opus-4']], ['systemPrompt',['Score transactions 0–100; explain top factors.']] ],
  'support-copilot':[ ['systemPrompt',['Answer using the KB; escalate billing to a human.','Answer concisely using the KB only.']], ['guardrail',['no-PII-in-logs','block-financial-advice']], ['model',['gpt-4o','gpt-4o-mini']] ],
  'kyc-classifier':[ ['policy',['strict','standard']], ['model',['llama-3.3-70b','mistral-large-2']], ['temperature',[0.0,0.1]] ],
};
const pick = a => a[Math.floor((seedRand()) * a.length) % a.length];
// deterministic-ish PRNG (no Math.random dependence needed, but fine to use here)
let _s = 1337; function seedRand(){ _s = (_s*1103515245 + 12345) & 0x7fffffff; return _s/0x7fffffff; }

function applyMutation(sysId, actor){
  const opts = MUT[sysId]; const [field, vals] = pick(opts);
  const val = pick(vals);
  // avoid no-op
  const cur = JSON.stringify(proxies[sysId][field]);
  let v = val, guard=0;
  while(JSON.stringify(v)===cur && guard++<4) v = pick(vals);
  const meta = { actor };
  // set source+actor for this capture by temporarily wrapping? capture uses fixed meta; we instead
  // stash actor on the change via a second proxy write is messy — set a module-level current actor:
  CURRENT_ACTOR = actor;
  proxies[sysId][field] = v;
}
let CURRENT_ACTOR = 'system';
// patch capture to read CURRENT_ACTOR: re-wrap using onCapture to rewrite actor before it's signed? Too late.
// Simpler: rebuild proxies with a getter for actor.
SYSTEMS.forEach(s => { proxies[s.id] = autoCapture(s.cfg, log, { actor:()=>CURRENT_ACTOR, source:s.id }); });

// ---------- seed history (backdated) ----------
function seed(){
  let t = Date.now() - 1000*60*60*26; // start 26h ago
  const steps = 11;
  for(let i=0;i<steps;i++){
    t += 1000*60*(40 + Math.floor(seedRand()*160)); // 40–200 min apart
    log.clock = () => t;
    const sys = SYSTEMS[Math.floor(seedRand()*SYSTEMS.length)%SYSTEMS.length];
    applyMutation(sys.id, ACTORS[Math.floor(seedRand()*ACTORS.length)%ACTORS.length]);
  }
  log.clock = () => Date.now();
}
seed();

// ---------- state ----------
let exported = log.export();
let verifyState = verifyAll(exported);
let tampered = null; // {exported, verify} when tamper active
function refresh(){ exported = log.export(); verifyState = verifyAll(tampered ? tampered.exported : exported); }

// enrich: attach service + risk to each record view
const KIND_RISK = { model:'critical', policy:'critical', prompt:'routine', config:'routine', change:'routine' };
function recView(rec, i){
  const sys = sysById[rec.change.source] || {name:rec.change.source||'system',icon:'◆'};
  return { i, rec, sys, kind:rec.change.kind, risk:KIND_RISK[rec.change.kind]||'routine',
           verdict:(verifyState.results[i]?.verdict)||'VALID' };
}
function allViews(){ const ex = tampered?tampered.exported:exported; return ex.records.map(recView); }

// ---------- router ----------
const CRUMB = {overview:'Overview',feed:'Change Feed',verify:'Verification',audit:'Audit & Compliance',systems:'Connected Systems'};
function go(view){
  $$('.nav').forEach(n=>n.classList.toggle('active', n.dataset.view===view));
  $$('.view').forEach(v=>v.classList.remove('show'));
  $('#v-'+view).classList.add('show');
  $('#crumb').textContent = CRUMB[view];
  render(view);
}
$$('[data-view]').forEach(el=>el.addEventListener('click',()=>go(el.dataset.view)));

// ---------- renderers ----------
function tile(k,v,d,unit){ return `<div class="tile"><div class="k">${k}</div><div class="v">${v}${unit?`<span class="unit"> ${unit}</span>`:''}</div><div class="d">${d||''}</div></div>`; }

function render(view){
  refresh();
  if(view==='overview') renderOverview();
  if(view==='feed') renderFeed();
  if(view==='verify') renderVerify();
  if(view==='audit') renderAudit();
  if(view==='systems') renderSystems();
  // shared
  $('#feedBadge').textContent = exported.records.length;
  $('#liveCount').textContent = exported.records.length;
}

function verdictPill(v){ return v==='VALID'?'<span class="pill ok">Verified</span>':'<span class="pill bad">Tampered</span>'; }
function kindTag(k){ return `<span class="kindtag k-${k}">${k}</span>`; }
function svcCell(sys,rec){ return `<div class="svc"><div class="ico">${sys.icon}</div><div><div class="nm">${esc(sys.name)}</div><div class="id">${esc(rec.change.source)}</div></div></div>`; }

function rowsTable(views, {limit}={}){
  const list = [...views].reverse().slice(0, limit||9999);
  if(!list.length) return `<div class="empty">No changes yet.</div>`;
  return `<table><thead><tr><th>System</th><th>Change</th><th>Actor</th><th>When</th><th>Record</th><th style="text-align:right">Status</th></tr></thead><tbody>${
    list.map(v=>`<tr class="rowc" data-open="${v.i}">
      <td>${svcCell(v.sys,v.rec)}</td>
      <td>${kindTag(v.kind)} <span class="muted">${esc(v.rec.change.subject)}</span></td>
      <td class="actor">${esc(v.rec.change.actor)}</td>
      <td class="tstamp">${ago(new Date(v.rec.captured_at).getTime())}</td>
      <td class="hash">${v.rec.content_hash.slice(0,10)}…</td>
      <td style="text-align:right">${verdictPill(v.verdict)}</td>
    </tr>`).join('')
  }</tbody></table>`;
}
function bindRows(root){ $$(`${root} [data-open]`).forEach(r=>r.addEventListener('click',()=>openChange(+r.dataset.open))); }

function renderOverview(){
  const V = allViews();
  const total = V.length, verified = V.filter(v=>v.verdict==='VALID').length;
  const critical = V.filter(v=>v.risk==='critical').length;
  const last = V.length?ago(new Date(V[V.length-1].rec.captured_at).getTime()):'—';
  $('#kpis').innerHTML =
    tile('Changes captured', total, `across ${SYSTEMS.length} systems`)+
    tile('Verified', `${total?Math.round(verified/total*100):100}`, `${verified}/${total} records`, '%')+
    tile('Critical changes', critical, 'model / policy edits')+
    tile('Last change', last, 'auto-captured');
  drawChart(V);
  renderCoverage($('#cov'), V);
  $('#chartTotal').textContent = `${total} total`;
  $('#recentTable').innerHTML = rowsTable(V,{limit:6}); bindRows('#recentTable');
}

function drawChart(V){
  // stacked bars per ~2h bucket, routine vs critical
  const N=14, now=Date.now(), span=1000*60*60*28, w=span/N;
  const buckets=Array.from({length:N},()=>({routine:0,critical:0}));
  V.forEach(v=>{ const t=new Date(v.rec.captured_at).getTime(); let b=Math.floor((t-(now-span))/w); b=Math.max(0,Math.min(N-1,b)); buckets[b][v.risk==='critical'?'critical':'routine']++; });
  const max=Math.max(3,...buckets.map(b=>b.routine+b.critical));
  const W=640,H=180,pad=10,bw=(W-pad*2)/N;
  let svg='';
  buckets.forEach((b,i)=>{
    const x=pad+i*bw+2, bwi=bw-4;
    const hR=(b.routine/max)*(H-24), hC=(b.critical/max)*(H-24);
    let y=H-14;
    if(hR>0){ svg+=`<rect x="${x}" y="${y-hR}" width="${bwi}" height="${Math.max(0,hR-2)}" rx="3" fill="var(--brand)"/>`; y-=hR+2; }
    if(hC>0){ svg+=`<rect x="${x}" y="${y-hC}" width="${bwi}" height="${Math.max(0,hC-2)}" rx="3" fill="var(--brand-2)"/>`; }
  });
  svg+=`<line x1="${pad}" y1="${H-14}" x2="${W-pad}" y2="${H-14}" stroke="var(--border)" />`;
  $('#volChart').innerHTML=svg;
}

const FRAMEWORKS = [
  { name:'EU AI Act — Art. 12 logging', kinds:['prompt','model','policy','config'] },
  { name:'India DPDP — processing record', kinds:['prompt','policy'] },
  { name:'SR 11-7 — model change record', kinds:['model'] },
  { name:'SOC 2 CC — change management', kinds:['policy','config','model','prompt'] },
];
function renderCoverage(root, V){
  const kinds = new Set(V.map(v=>v.kind));
  root.innerHTML = FRAMEWORKS.map(f=>{
    const have=f.kinds.filter(k=>kinds.has(k)).length, pct=Math.round(have/f.kinds.length*100);
    return `<div class="row"><div class="lab">${esc(f.name)}</div><div class="bar"><div class="fill" style="width:${pct}%"></div></div><div class="pct">${pct}%</div></div>`;
  }).join('');
}

function renderFeed(){
  const V=allViews();
  $('#feedCount').textContent = `${V.length} changes`;
  $('#feedTable').innerHTML = rowsTable(V); bindRows('#feedTable');
}

function renderVerify(){
  const s=verifyState;
  const ok = s.invalid===0 && s.tree_root_matches_sth;
  $('#verifySummary').innerHTML = `
    <div class="banner ${ok?'good':'sim'}" style="margin-bottom:12px">${ok?'✓ All records verify. Witness co-signed. Merkle root matches the signed tree head.':'✗ Verification failed — tampering detected in the log.'}</div>
    <div class="kv">
      <div class="kk">Records</div><div class="vv">${s.total}</div>
      <div class="kk">Valid</div><div class="vv" style="color:${ok?'var(--good)':'var(--bad)'}">${s.valid}/${s.total}</div>
      <div class="kk">Merkle root</div><div class="vv">${(tampered?tampered.exported:exported).signed_tree_head.root.slice(0,40)}…</div>
      <div class="kk">Signature</div><div class="vv">ML-DSA-65 + Ed25519 (hybrid, PQC)</div>
      <div class="kk">Witness</div><div class="vv">${exported.witness?.witness||'—'} · co-signed ✓</div>
      <div class="kk">Attestation</div><div class="vv" style="color:var(--warn)">simulated (real on Phala TDX)</div>
    </div>`;
  const V=allViews();
  $('#verifyTable').innerHTML = `<table><thead><tr><th>#</th><th>System</th><th>Change</th><th>binding</th><th>sig</th><th>incl</th><th>witness</th><th>attest</th><th>verdict</th></tr></thead><tbody>${
    V.map(v=>{ const d=verifyState.results[v.i].domains; const g=x=>x==='pass'?'<span style="color:var(--good)">✓</span>':x==='fail'?'<span style="color:var(--bad)">✗</span>':x==='simulated'?'<span style="color:var(--warn)">~</span>':'<span class="muted">·</span>';
      return `<tr class="rowc" data-open="${v.i}"><td class="mono">#${v.i}</td><td>${esc(v.sys.name)}</td><td>${kindTag(v.kind)} <span class="muted">${esc(v.rec.change.subject)}</span></td><td>${g(d.binding)}</td><td>${g(d.signature)}</td><td>${g(d.inclusion)}</td><td>${g(d.witnesses)}</td><td>${g(d.attestation)}</td><td>${verdictPill(v.verdict)}</td></tr>`;
    }).join('')
  }</tbody></table>`;
  bindRows('#verifyTable');
}

function renderAudit(){
  const V=allViews();
  const byKind={}; V.forEach(v=>byKind[v.kind]=(byKind[v.kind]||0)+1);
  const kinds=new Set(V.map(v=>v.kind));
  const obligations=new Set();
  FRAMEWORKS.forEach(f=>{ if(f.kinds.some(k=>kinds.has(k))) obligations.add(f.name); });
  $('#auditKpis').innerHTML =
    tile('Total changes', V.length,'in signed log')+
    tile('Verified', `${V.filter(v=>v.verdict==='VALID').length}/${V.length}`,'tamper-evident')+
    tile('Obligations', obligations.size,'frameworks evidenced')+
    tile('Retention', '∞','append-only');
  $('#obligations').innerHTML = [...obligations].map(o=>`<div class="dom pass" style="margin-bottom:8px"><div class="st"></div><div><div class="nm">${esc(o)}</div><div class="dsc">evidence produced from captured changes</div></div></div>`).join('');
  const maxK=Math.max(1,...Object.values(byKind));
  $('#byKind').innerHTML = Object.entries(byKind).map(([k,n])=>`<div class="row"><div class="lab">${kindTag(k)}</div><div class="bar"><div class="fill" style="width:${n/maxK*100}%"></div></div><div class="pct">${n}</div></div>`).join('');
  $('#auditTable').innerHTML = rowsTable(V); bindRows('#auditTable');
}

function renderSystems(){
  const V=allViews();
  $('#systemsGrid').innerHTML = SYSTEMS.map(s=>{
    const cnt=V.filter(v=>v.rec.change.source===s.id).length;
    const lastV=V.filter(v=>v.rec.change.source===s.id).slice(-1)[0];
    return `<div class="tile"><div class="flex between"><div class="svc"><div class="ico" style="width:30px;height:30px">${s.icon}</div><div><div class="nm">${esc(s.name)}</div><div class="id">${s.id} · ${s.team}</div></div></div><span class="live"><span class="dot pulse"></span> wrapped</span></div>
      <div class="kv" style="margin-top:12px"><div class="kk">Changes</div><div class="vv">${cnt}</div><div class="kk">Model</div><div class="vv">${esc(s.cfg.model)}</div><div class="kk">Last</div><div class="vv">${lastV?ago(new Date(lastV.rec.captured_at).getTime()):'—'}</div></div></div>`;
  }).join('');
  $('#howCapture').innerHTML = `
    <div class="banner good" style="margin-bottom:12px">No CooL calls live in your application code. The SDK wraps each system's config object; any assignment to a field is intercepted, signed, and logged.</div>
    <div class="diff"><div class="l after">agent.systemPrompt = "Approve refunds up to $500."   // your normal code</div></div>
    <p class="muted" style="font-size:12.5px">→ CooL intercepts the change, canonicalizes it, hashes it (SHA-256), hybrid-signs it (ML-DSA-65 + Ed25519), and appends it to the tamper-evident Merkle log. Nothing else to instrument.</p>`;
}

// ---------- drawer ----------
function openChange(i){
  const ex = tampered?tampered.exported:exported;
  const rec = ex.records[i]; if(!rec) return;
  const sys = sysById[rec.change.source]||{name:rec.change.source,icon:'◆'};
  const res = verifyRecord(rec, ex, i);
  $('#drTitle').innerHTML = `${sys.icon} ${esc(sys.name)} · ${kindTag(rec.change.kind)}`;
  $('#drSub').textContent = `${rec.id} · ${fmtTime(new Date(rec.captured_at).getTime())} · ${rec.change.actor}`;
  const before = rec.change.before==null?'(none)':(typeof rec.change.before==='object'?JSON.stringify(rec.change.before):String(rec.change.before));
  const after = typeof rec.change.after==='object'?JSON.stringify(rec.change.after):String(rec.change.after);
  const DESC={binding:'content hash matches the signed body',signature:'ML-DSA-65 + Ed25519 both verify',inclusion:'present in the Merkle log',witnesses:'independent auditor co-signature',attestation:'Intel TDX quote (simulated)',enclave:'code measurement (simulated)',anchor:'public-chain checkpoint'};
  const domHtml = ['binding','signature','inclusion','witnesses','attestation','enclave','anchor'].map(dn=>{
    const st=res.domains[dn]; const cls=st==='pass'?'pass':st==='fail'?'fail':st==='simulated'?'sim':'absent';
    return `<div class="dom ${cls}"><div class="st"></div><div><div class="nm" style="text-transform:capitalize">${dn}</div><div class="dsc">${DESC[dn]}</div></div></div>`;
  }).join('');
  const verdict = res.verdict==='VALID'
    ? `<div class="banner good"><b>✓ Verified.</b> This change is authentic, unaltered, and provably part of the record — checkable offline by anyone.</div>`
    : `<div class="banner baddish"><b>✗ Tampered.</b> This record no longer matches its signature. It has been altered since it was sealed.</div>`;
  $('#drBody').innerHTML = `
    ${verdict}
    <div class="sec-t">What changed</div>
    <div class="diff"><div class="l before">${esc(before.length>120?before.slice(0,120)+'…':before)}</div><div class="l after">${esc(after.length>120?after.slice(0,120)+'…':after)}</div></div>
    <div class="sec-t">Verification — 7 domains</div>
    <div class="domains">${domHtml}</div>
    <div class="banner sim" style="margin-top:10px">Attestation &amp; enclave are <b>simulated</b> in this environment. Deployed on Phala TDX they verify against a real Intel TDX quote (via dcap-qvl) and flip to pass.</div>
    <div class="sec-t">Signed record</div>
    <div class="kv">
      <div class="kk">Record ID</div><div class="vv">${rec.id}</div>
      <div class="kk">Captured</div><div class="vv">${rec.captured_at}</div>
      <div class="kk">Source</div><div class="vv">${rec.change.source} · SDK proxy</div>
      <div class="kk">Content hash</div><div class="vv">${rec.content_hash}</div>
      <div class="kk">ML-DSA-65 sig</div><div class="vv">${rec.signature.mldsa.slice(0,52)}… (${rec.signature.mldsa.length/2} B)</div>
      <div class="kk">Ed25519 sig</div><div class="vv">${rec.signature.ed25519.slice(0,52)}…</div>
    </div>`;
  $('#scrim').classList.add('show'); $('#drawer').classList.add('show');
}
$('#drClose').addEventListener('click',closeDrawer); $('#scrim').addEventListener('click',closeDrawer);
function closeDrawer(){ $('#scrim').classList.remove('show'); $('#drawer').classList.remove('show'); }

// ---------- verify actions ----------
$('#reverifyBtn').addEventListener('click',()=>{ refresh(); renderVerify(); flash($('#reverifyBtn'),'Re-verified ✓'); });
$('#tamperBtn').addEventListener('click',()=>{
  const clone = JSON.parse(JSON.stringify(exported));
  const idx = Math.max(0, clone.records.length-3);
  const r = clone.records[idx];
  if(typeof r.change.after==='object'){ const k=Object.keys(r.change.after)[0]; r.change.after[k]='TAMPERED'; }
  else r.change.after = String(r.change.after)+' [ALTERED]';
  tampered = { exported: clone };
  verifyState = verifyAll(clone);
  $('#restoreBtn').style.display='inline-flex';
  $('#tamperResult').innerHTML = `<div class="banner baddish">✗ Tampered record #${idx}. Re-verify caught it: binding + signature fail and the Merkle root no longer matches the signed tree head. <b>${verifyState.valid}/${verifyState.total} valid.</b></div>`;
  renderVerify();
});
$('#restoreBtn').addEventListener('click',()=>{ tampered=null; refresh(); $('#restoreBtn').style.display='none'; $('#tamperResult').innerHTML=''; renderVerify(); });

// ---------- export ----------
function exportPack(){
  const V=allViews(); const byKind={}; V.forEach(v=>byKind[v.kind]=(byKind[v.kind]||0)+1);
  const pack = { title:'CooL Audit Pack', generated_at:new Date().toISOString(),
    summary:{ total_changes:V.length, verified:verifyState.valid, signature_alg:'ML-DSA-65 + Ed25519 (hybrid, post-quantum)', attestation:'SIMULATED — real on Phala TDX', tamper_evident_root:exported.signed_tree_head.root },
    changes_by_kind:byKind, change_log: exported.records.map((r,i)=>({ id:r.id, when:r.captured_at, system:r.change.source, kind:r.change.kind, subject:r.change.subject, actor:r.change.actor, before:r.change.before, after:r.change.after, content_hash:r.content_hash, verdict:verifyState.results[i].verdict })) };
  const blob=new Blob([JSON.stringify(pack,null,2)],{type:'application/json'}); const a=document.createElement('a');
  a.href=URL.createObjectURL(blob); a.download='cool-audit-pack.json'; a.click();
}
$('#exportBtn').addEventListener('click',exportPack); $('#exportBtn2').addEventListener('click',exportPack);

function flash(btn,txt){ const o=btn.textContent; btn.textContent=txt; setTimeout(()=>btn.textContent=o,1200); }

// ---------- live capture loop ----------
let running=true;
$('#simBtn').addEventListener('click',()=>{ running=!running; $('#simBtn').textContent = running?'⏸ Pause capture':'▶ Resume capture'; });
function liveTick(){
  if(running && !tampered){
    log.clock=()=>Date.now();
    const sys=SYSTEMS[Math.floor(seedRand()*SYSTEMS.length)%SYSTEMS.length];
    applyMutation(sys.id, ACTORS[Math.floor(seedRand()*ACTORS.length)%ACTORS.length]);
    const cur=$('.nav.active')?.dataset.view||'overview';
    render(cur);
    // subtle highlight of newest feed row
  }
  setTimeout(liveTick, 4200 + Math.floor(seedRand()*3000));
}

// ---------- boot ----------
render('overview');
setTimeout(liveTick, 3500);
