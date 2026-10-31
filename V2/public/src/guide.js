// Homepage interactions: setup-guide tabs with progress + "Next" buttons, and
// the sticky section bar that appears after the hero and tracks the section in view.
const tabs = [...document.querySelectorAll('.guide__steps [role="tab"]')];
const bar = document.querySelector(".guide__progress i");

const select = (tab, focus = false) => {
  tabs.forEach((t, i) => {
    const on = t === tab;
    t.setAttribute("aria-selected", String(on));
    t.tabIndex = on ? 0 : -1;
    document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
    if (on && bar) bar.style.width = `${((i + 1) / tabs.length) * 100}%`;
  });
  if (focus) tab.focus();
};

tabs.forEach((tab, i) => {
  tab.tabIndex = i === 0 ? 0 : -1;
  tab.addEventListener("click", () => select(tab));
  tab.addEventListener("keydown", (e) => {
    const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
    if (!step) return;
    e.preventDefault();
    select(tabs[(i + step + tabs.length) % tabs.length], true);
  });
});

document.querySelectorAll(".guide__next").forEach((btn) =>
  btn.addEventListener("click", () => {
    select(document.getElementById(btn.dataset.next), true);
    document.querySelector(".guide__rail")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }),
);

const secbar = document.getElementById("secbar");
const hero = document.querySelector(".hero");
if (secbar && hero) {
  new IntersectionObserver(([e]) => secbar.classList.toggle("is-on", !e.isIntersecting), { rootMargin: "-72px 0px 0px 0px" }).observe(hero);
  const links = [...secbar.querySelectorAll('a[href^="#"]')];
  const spy = new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      if (!e.isIntersecting) return;
      links.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === `#${e.target.id}`));
    }),
    { rootMargin: "-45% 0px -50% 0px" },
  );
  links.forEach((a) => { const el = document.querySelector(a.getAttribute("href")); if (el) spy.observe(el); });
}
