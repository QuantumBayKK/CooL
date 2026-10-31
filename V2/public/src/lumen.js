// Hero light and motion: silk ribbons of light behind the headline, a dot-matrix
// decode on the second line, Apple-style scroll easing on the hero, and a light
// that follows the pointer across the glass terminals. Plain WebGL, no library.
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

// ── silk ─────────────────────────────────────────────────────────────────────
// A few soft bands of light drifting across the black, each with a fine sheen
// running through it like woven fabric. Drawn at reduced resolution and blurred
// by the browser's upscale, which is exactly the softness we want.
const FRAG = `
precision highp float;
uniform vec2 r; uniform float t; uniform vec2 m;
float band(vec2 p, float off, float amp, float freq, float speed, float w, float sheen){
  float c = off + amp*sin(p.x*freq + t*speed) + amp*.45*sin(p.x*freq*2.13 - t*speed*1.4 + off*5.);
  float d = p.y - c;
  float body = exp(-d*d/w);
  float fibre = .5 + .5*sin(d*sheen + p.x*3.5 + t*.35);
  return body*(.55 + .45*fibre);
}
void main(){
  // On tall (phone) screens scale by width, so the ribbons stay as fine as on a laptop.
  vec2 p = (gl_FragCoord.xy - .5*r)/max(r.y, r.x*.9);
  p += m*.035;
  p.x += .07*sin(p.y*2.7 + t*.18);
  p.y += .05*sin(p.x*2.1 - t*.13);
  float l = 0.;
  l += band(p,  .10, .16, 1.5,  .21, .0016, 160.)*.70;
  l += band(p, -.06, .22, 1.05,-.16, .0120,  70.)*.42;
  l += band(p,  .26, .11, 2.2,  .12, .0008, 240.)*.50;
  l += band(p, -.30, .15, .75,  .09, .0400,  40.)*.22;
  l += band(p,  .38, .20, 1.3, -.07, .0060, 110.)*.20;
  vec2 q = p - vec2(.0, .02);
  l += .10*exp(-dot(q,q)*3.2);
  vec3 col = l*vec3(.90,.94,1.0) + l*l*vec3(.10,.08,.06);
  col *= smoothstep(1.25, .15, length(p*vec2(.75,1.15)));
  // Keep the light a backdrop: never brighter than the words in front of it.
  col = col*.62/(1. + col*.9);
  gl_FragColor = vec4(col, 1.);
}`;

function silk(canvas) {
  const gl = canvas.getContext("webgl", { antialias: false, alpha: false, premultipliedAlpha: false, powerPreference: "low-power" });
  if (!gl) return;
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, "attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}"));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const uR = gl.getUniformLocation(prog, "r"), uT = gl.getUniformLocation(prog, "t"), uM = gl.getUniformLocation(prog, "m");

  const SCALE = 0.5; // half resolution: cheaper, and softer
  const size = () => {
    const w = Math.max(1, Math.round(canvas.clientWidth * SCALE)), h = Math.max(1, Math.round(canvas.clientHeight * SCALE));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; gl.viewport(0, 0, w, h); }
    gl.uniform2f(uR, w, h);
  };
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  addEventListener("pointermove", (e) => { mouse.tx = e.clientX / innerWidth - .5; mouse.ty = .5 - e.clientY / innerHeight; }, { passive: true });

  let visible = true, raf = 0;
  const start = performance.now() - 20000; // begin mid-flow, not at a symmetric t = 0
  const draw = (now) => {
    raf = 0;
    size();
    mouse.x += (mouse.tx - mouse.x) * .04; mouse.y += (mouse.ty - mouse.y) * .04;
    gl.uniform1f(uT, (now - start) / 1000);
    gl.uniform2f(uM, mouse.x, mouse.y);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (!reduce && visible && !document.hidden) raf = requestAnimationFrame(draw);
  };
  const kick = () => { if (!raf) raf = requestAnimationFrame(draw); };
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) kick(); }).observe(canvas);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) kick(); });
  addEventListener("resize", kick, { passive: true });
  kick();
  requestAnimationFrame(() => canvas.classList.add("is-ready"));
}
const silkCanvas = document.getElementById("silk");
if (silkCanvas) silk(silkCanvas);

// ── dot-matrix decode ─────────────────────────────────────────────────────────
// The second line of the headline resolves out of dot-matrix noise, left to right.
const GLYPHS = "01#%*+=:·<>/\\|ABCDEFHKLMNPRSTUVXYZ";
for (const el of document.querySelectorAll("[data-decode]")) {
  const final = el.textContent;
  el.setAttribute("aria-label", final);
  if (reduce) continue;
  const letters = [...final];
  let frame = 0;
  const total = 34;
  const tick = () => {
    frame++;
    el.textContent = letters.map((ch, i) => {
      if (ch === " ") return " ";
      const settle = 10 + i * 3.4;
      return frame >= settle ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0];
    }).join("");
    if (frame < total + letters.length * 3.4) setTimeout(tick, 42);
    else { el.textContent = final; el.classList.add("is-set"); }
  };
  setTimeout(tick, 650);
}

// ── hero scroll ───────────────────────────────────────────────────────────────
// As the page scrolls, the headline recedes: a little smaller, a little dimmer,
// a touch out of focus. The light stays put behind it.
const hero = document.getElementById("hero"), copy = document.getElementById("heroCopy");
if (hero && copy && !reduce) {
  let ticking = false;
  const update = () => {
    ticking = false;
    const p = Math.min(Math.max(scrollY / (hero.offsetHeight * .85), 0), 1);
    copy.style.transform = `translate3d(0, ${p * -60}px, 0) scale(${1 - p * .08})`;
    copy.style.opacity = String(1 - p * 1.1);
    copy.style.filter = p > .02 ? `blur(${(p * 6).toFixed(2)}px)` : "";
    hero.style.setProperty("--lumen-fade", String(1 - p * .7));
  };
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  update();
}

// ── light on glass ────────────────────────────────────────────────────────────
// Each glass surface carries a soft highlight that follows the pointer.
for (const el of document.querySelectorAll(".cterm, .code, .glass")) {
  el.addEventListener("pointermove", (e) => {
    const b = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - b.left}px`);
    el.style.setProperty("--my", `${e.clientY - b.top}px`);
  }, { passive: true });
}

// ── founders ──────────────────────────────────────────────────────────────────
// The portraits drift slightly slower than the page, so each sits a little
// behind its frame as it passes.
const shots = [...document.querySelectorAll(".fdr__shot")];
if (shots.length && !reduce) {
  let queued = false;
  const drift = () => {
    queued = false;
    for (const shot of shots) {
      const b = shot.getBoundingClientRect();
      if (b.bottom < 0 || b.top > innerHeight) continue;
      const p = (b.top + b.height / 2 - innerHeight / 2) / (innerHeight / 2 + b.height / 2); // -1 … 1
      shot.style.setProperty("--fdr-shift", `${(-6 + p * 6).toFixed(2)}%`);
    }
  };
  addEventListener("scroll", () => { if (!queued) { queued = true; requestAnimationFrame(drift); } }, { passive: true });
  addEventListener("resize", drift, { passive: true });
  drift();
}
