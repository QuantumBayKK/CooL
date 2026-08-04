# The software-UI theme prompt

Paste this at the top of a request when you want a product surface that looks
like a tool people work in — Slack's arrangement, Atlassian's palette, VS Code's
editor — rather than a landing page with a table on it.

It is deliberately short. Long style briefs get averaged away; a small number of
hard rules survive contact with the work.

---

```
Build this as a working software console, not a marketing page. Follow this
theme exactly:

SHELL
- Slack's arrangement: a dark navigation rail on the left, a light workspace on
  the right, a slim top bar with brand, search and status.
- The rail is chrome, the workspace is content. The rail never competes for
  attention: no gradients, no glow, one accent colour for the active item.

PALETTE (Atlassian)
- nav        #101b34 / deeper #0a1428, hairlines rgba(255,255,255,0.09)
- surface    #ffffff, page #f7f8f9, raised #f1f2f4, sunken #eceef1
- borders    #dfe1e6, strong #c1c7d0
- ink        #172b4d, subtle #44546f, muted #626f86
- primary    #1868db (hover #0055cc, tint #e9f2fe)
- success #216e4e/#dcfff1 · warning #a54800/#fff7d6 · danger #ae2e24/#ffedeb ·
  purple #5e4db2/#f3f0ff · teal #206a83/#e7f9ff
- Status colours are reserved. Never reuse one as a decorative accent.

FORM
- Corner radius 3px everywhere. Sharp, not pill-shaped.
- Body text 13px, table headers 11px bold uppercase with 0.07em tracking,
  card titles 15px semibold, monospace for anything hash-, id- or code-shaped.
- Dense rows (~32px), 1px hairline dividers, generous horizontal padding.
- Cards: white surface, 1px border, the two-layer Atlassian shadow, no blur.
- Buttons: primary is solid blue, default is grey-on-white with a border,
  subtle is transparent. All get a 1px shadow that deepens on hover and
  disappears on active with a 0.5px downward nudge.
- Focus is a 2px solid primary outline, offset 1px. Never removed.

RULES THAT MATTER MORE THAN THE PALETTE
- Every status is a colour AND a glyph AND a word (✓ pass, ✕ fail, ▲ warning,
  ◐ partial, · absent). Colour is the fast channel, never the only one.
- Numbers are tabular-nums and right-aligned when compared.
- Every panel answers one question, and its subtitle says which.
- Empty states say what would appear and how to make it appear.
- Nothing is shown as certain that was not checked. If a value is stale,
  simulated, partial or unverified, the UI says so in the same breath.

IF THERE IS A CODE SURFACE
- Use VS Code Dark Modern inside it: editor #1f1f1f, chrome #181818, borders
  #2b2b2b, text #cccccc, accent #0078d4, and the standard token colours
  (keyword #569cd6, control #c586c0, string #ce9178, comment #6a9955,
  number #b5cea8, function #dcdcaa, type #4ec9b0, variable #9cdcfe).
- Keep its proportions honest: 48px activity bar, 35px tabs, 22px status bar.
- Dark code inside a light console is correct — it marks a quotation.

Scope the two skins to CSS variables under a `data-skin` attribute so they can
never bleed into each other, and so a palette change is one edit.
```

---

## Why these particular rules

The palette and the radius are the easy half; the second block is what makes a
console feel trustworthy rather than merely tidy.

- **Glyph + colour + word** survives colour-vision deficiency, greyscale
  printing, forced-colours mode, and a screenshot pasted into a slide deck.
- **One question per panel** is what stops a dashboard becoming a wall.
- **Say when a value is not certain** is the rule most product UIs break, and the
  one a technical buyer checks first. A surface that admits `simulated` where it
  is simulated earns the benefit of the doubt everywhere else.
