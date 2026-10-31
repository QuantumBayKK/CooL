# Documentation implementation report

## Product and source of truth

The docs describe **CooL**, Northwind Cipher's cryptographic evidence SDK and CLI (`cool-nwc`), not only the separate cinematic website. The source of truth is the V2 implementation and its `content/docs/*.mdx`; the readiness ladder is `src/content/gates.ts`, and the published limits page is `content/docs/limits.mdx`. The docs run inside the existing Next.js 16 / React 19 app with static MDX routes, MiniSearch, Shiki code rendering, and the existing CooL design tokens. No additional documentation framework or backend was introduced.

## Reference audit: `https://docs.caution.co/`

Inspected the reference homepage, a getting-started page, a how-to guide, a concept page, and a configuration reference page. The rendered page structure exposes a persistent docs header, grouped left navigation, search entry point, breadcrumbs, article headings with a right-side “On this page” rail, code examples, related links, and previous/next navigation. The reference organizes content by task and concept rather than presenting a marketing landing page.

| Pattern | Priority | CooL adaptation |
| --- | --- | --- |
| Grouped sidebar, active page, search, breadcrumbs, prev/next | Essential | Kept in the existing docs shell and generated from MDX metadata |
| Right-side “On this page” rail | Observed in the reference | Removed at the owner's request; the article uses the available reading width |
| Compact, readable article column; code and callouts | Essential | Kept with Shiki and existing `Note` / `Warning` MDX components |
| Persistent docs header and mobile navigation | Essential | Uses a docs-only “Back to CooL home” header; the wordmark stays by “Developer documentation” in the sidebar |
| Caution wordmark, copy, page taxonomy, colors | Do not copy | Replaced by CooL's `/assets/wordmark.svg`, red/ink tokens, and product-specific sections |
| Search modal details, dark theme, loading transitions, mobile reference behavior | Not verified | No behavior is claimed as observed; CooL keeps its existing inline local search and light-only theme |

## Implemented

- Used the actual CooL wordmark SVG in the docs sidebar.
- Replaced the marketing header, route breadcrumbs, large marketing footer, and mobile CTA on `/docs` with a compact “Back to CooL home” link and small docs footer.
- Made each sidebar section keyboard-operable and collapsible; kept the active page indicator and independent desktop sidebar scrolling.
- Removed the complete right rail: article TOC, evidence-path diagram, trust-boundary diagram, and related-link rail. The article now uses the full reading column.
- Removed the blue docs-only accent override so sidebar, links, and callouts use CooL's brand tokens.
- Added contextual search excerpts, arrow-key result selection, Enter navigation, and Escape dismissal to the local MiniSearch UI.
- Reconciled stale V2 README statements about hardware attestation and anchoring against the current readiness ladder and limits page.
- Kept the existing 12 MDX pages, static generation, page metadata/canonicals, sitemap inclusion, code copy component, responsive shell, and no-backend search.

## Add or edit a page

Create an `.mdx` file in `content/docs/` with front matter for `title`, `description`, `section`, and `order`. Use one of the existing section names (`Start here`, `Concepts`, `Reference`, `Operations`) or update `SECTION_ORDER` in `src/lib/docs.ts`. Write content in MDX and use the existing `Note`, `Warning`, `Grid`, `CardLink`, and fenced-code components. The route, sidebar, search index, metadata, heading anchors, and sitemap are derived from the content. Run `npm run docs:mirror` to refresh the plain-Markdown mirror under the repository-level `docs/` directory.

## Verification

- `npm run typecheck` — passed.
- `npm run verify:all` — passed: 83 tests passed, 1 skipped, 0 failed; claim and palette checks passed.
- `npm run build` — passed; all 12 documentation pages were statically generated. Next.js also reports the existing `middleware` convention deprecation warning.
- Playwright on Chromium — confirmed docs route/title, “Back to CooL home” link, sidebar wordmark beside “Developer documentation,” grouped/collapsible navigation, and the absence of right-rail content at desktop and mobile viewports. Search previously returned 8 matching `receipt` results with excerpts, and ArrowDown + Enter navigated to Architecture. The mobile sidebar control was present at 390 × 844. No browser console errors appeared; offline Google Fonts requests fell back to system fonts during the dev preview. The revised viewport screenshot was reviewed.
- Internal `/docs/...` links were checked across all 12 MDX pages; all destinations resolve.
- The code-copy control is present on Quickstart code blocks. Clipboard write feedback could not be confirmed in headless Chromium because clipboard access was denied in that browser context.

## Content gaps

The current library documents quickstart, verification, architecture, threat model, attestation, witness, receipt format, verifier, CLI, limits, and licensing. There are no separate complete API/SDK type references, deployment runbooks, release notes, migration guides, or troubleshooting catalog yet; add these when the underlying product interfaces and operational details are ready to document. The SDK package and deployment are documented from repository material, but hosting credentials and a public docs-specific URL are not configured in this implementation.
