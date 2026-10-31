// Nav dropdowns and the typed terminal reveal.
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

for (const menu of document.querySelectorAll(".cnav__menu")) {
  const trigger = menu.querySelector(".cnav__trigger");
  let timer;
  const set = (open) => {
    clearTimeout(timer);
    menu.classList.toggle("is-open", open);
    trigger.setAttribute("aria-expanded", String(open));
  };
  trigger.addEventListener("click", () => set(!menu.classList.contains("is-open")));
  menu.addEventListener("mouseenter", () => set(true));
  menu.addEventListener("mouseleave", () => { timer = setTimeout(() => set(false), 120); });
  menu.addEventListener("keydown", (e) => { if (e.key === "Escape") { set(false); trigger.focus(); } });
  document.addEventListener("click", (e) => { if (!menu.contains(e.target)) set(false); });
}

// The terminal prints line by line the first time it scrolls into view.
const term = document.querySelector(".cterm");
if (term && !reduce && "IntersectionObserver" in window) {
  const rows = [...term.querySelectorAll(".cterm__line, .cterm__gap")];
  term.classList.add("is-typing");
  const io = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return;
    io.disconnect();
    rows.forEach((row, i) => setTimeout(() => row.classList.add("is-shown"), i === 0 ? 0 : 500 + i * 140));
  }, { threshold: 0.35 });
  io.observe(term);
}
