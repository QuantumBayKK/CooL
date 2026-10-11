// Additions on top of the vendored app.js — kept separate so app.js stays
// byte-identical to upstream.

const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

// Hiding .rise content is opt-in from here, so the page stays readable if this
// script never loads.
if (!reduce && "IntersectionObserver" in window) document.documentElement.classList.add("x-motion");

// Founder portraits: build the tile grid, then dissolve it diagonally from the
// top-left corner when the portrait scrolls into view.
const tiles = [...document.querySelectorAll("[data-tiles]")];
for (const fig of tiles) {
  const grid = fig.querySelector(".ftile__grid");
  if (!grid || reduce) continue;
  const cols = 6, rows = 8;
  grid.style.setProperty("--cols", cols);
  grid.style.setProperty("--rows", rows);
  const frag = document.createDocumentFragment();
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i = document.createElement("i");
      // diagonal wave plus a little jitter so it reads as organic, not mechanical
      i.style.setProperty("--td", `${(r + c) * 55 + Math.round(Math.random() * 90)}ms`);
      frag.appendChild(i);
    }
  }
  grid.appendChild(frag);
  fig.dataset.armed = "";
}

// Elements marked .rise slide up as they enter the viewport, at every width.
const rises = [...document.querySelectorAll(".rise")];

if (reduce || !("IntersectionObserver" in window)) {
  tiles.forEach((t) => t.classList.add("is-lit"));
  rises.forEach((r) => r.classList.add("is-up"));
} else {
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add(e.target.matches("[data-tiles]") ? "is-lit" : "is-up");
        io.unobserve(e.target);
      }
    },
    { rootMargin: "0px 0px -12% 0px", threshold: 0.2 },
  );
  tiles.forEach((t) => io.observe(t));
  rises.forEach((r) => io.observe(r));
}
