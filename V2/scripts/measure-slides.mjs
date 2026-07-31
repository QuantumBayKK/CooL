/**
 * Measure every deck slide against the viewport.
 *
 * "One slide per scroll" is only achievable if each slide actually fits the
 * screen — a slide taller than the viewport either gets its snap point dropped
 * (so it does not snap) or, if forced to snap, traps the reader at its top.
 * So before changing any styling, find out which slides overflow and by how
 * much, at the sizes people actually use.
 */
import { chromium } from "playwright-core";

const BASE = process.argv[2] ?? "http://localhost:3002";

const VIEWPORTS = [
  { name: "iPhone SE", width: 375, height: 667 },
  { name: "iPhone 14", width: 390, height: 844 },
  { name: "laptop", width: 1440, height: 900 },
];

const browser = await chromium.launch({
  channel: "chromium-headless-shell",
  args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader"],
});

for (const vp of VIEWPORTS) {
  const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
  await page.goto(BASE, { waitUntil: "networkidle", timeout: 60000 });
  // let the intro finish and reveals settle
  await page.waitForTimeout(4500);
  // force every scroll-triggered reveal to run so heights are final
  await page.evaluate(async () => {
    const slides = document.querySelectorAll("[data-slide]");
    for (const s of slides) {
      s.scrollIntoView({ behavior: "instant", block: "start" });
      await new Promise((r) => setTimeout(r, 220));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(800);

  const rows = await page.evaluate(() => {
    const vh = window.innerHeight;
    return Array.from(document.querySelectorAll("[data-slide]")).map((s) => ({
      no: s.getAttribute("data-slide"),
      id: s.id,
      height: Math.round(s.getBoundingClientRect().height),
      vh,
      tall: s.classList.contains("is-tall"),
    }));
  });

  console.log(`\n=== ${vp.name}  ${vp.width}x${vp.height} ===`);
  let over = 0;
  for (const r of rows) {
    const excess = r.height - r.vh;
    const flag = excess > 0 ? `OVERFLOWS by ${excess}px` : "fits";
    if (excess > 0) over++;
    console.log(
      `  ${r.no} ${String(r.id).padEnd(12)} ${String(r.height).padStart(5)}px / ${r.vh}px  ${flag}${r.tall ? "  [is-tall]" : ""}`,
    );
  }
  console.log(`  --> ${over}/${rows.length} slides overflow`);
  await page.close();
}

await browser.close();
