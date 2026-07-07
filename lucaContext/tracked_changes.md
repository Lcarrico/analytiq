# Tracked Changes — R34 Marketing Site Build-Out

A running log of every meaningful change made while implementing Release R34 (the 7-page marketing site), written to explain **what** changed, **why**, and **the underlying tech/concept** behind it — for learning, not just as a changelog. New entries are appended at the bottom as work progresses. See `RELEASE_PLAN.md:1528-1559` for the story tracker this work fulfills, and `C:\Users\Lucac\.claude\plans\vectorized-sleeping-quiche.md` for the full approved plan.

---

## Environment note (found before Story 1, applies to all of R34)

**What:** `playwright.config.mjs` launches its browser via the `@sparticuz/chromium` npm package, which is built specifically for AWS Lambda. On this native Windows machine it extracts a Linux ELF binary (confirmed with the `file` command) — Windows can't execute that, so every Playwright UI test fails with `spawn ENOENT`, regardless of what the test actually checks. This is a pre-existing gap, not something caused by this work — I found it by trying to run the new marketing spec and watching *every* UI spec fail identically, including ones I hadn't touched.

**Why it matters / decision made:** Fixing this would mean editing shared test infrastructure (`playwright.config.mjs`), which is outside this release's scope (marketing pages only) and affects every other UI spec in the repo, not just marketing ones. Given the choice between fixing it now or deferring it, we're deferring it — each story below still gets a written/updated Playwright spec (so the *intent* and RED/GREEN discipline is preserved and the spec is ready to run the moment the environment is fixed), but the spec is not actually executed as part of this engagement. Verification instead relies on: `npm run build` (catches syntax/import errors — Vite would fail loudly), the backend `pytest` suite (confirms no backend regression, expected clean since marketing is pure frontend), and manual reasoning about the rendered JSX against the mockup spec.

**Tech concept:** Playwright drives a *real* browser (Chromium here) via a low-level automation protocol (CDP — Chrome DevTools Protocol) to load pages and assert on what actually rendered, unlike a unit test that only checks JavaScript logic in isolation. That's why it needs an actual browser binary present and executable on the host OS — a Linux binary simply cannot run as a Windows process, no matter how correct the test code is.

---

## R34S1E1 — Shared MarketingNav + MarketingFooter chrome

**What changed:**
- `client/src/components/MarketingNav.jsx` (new) — the 64px top nav (logo + 6 links + Log in/Start free) shared by 6 of the 7 marketing pages.
- `client/src/components/MarketingFooter.jsx` (new) — the dark 5-column footer + legal bar, now rendered on every marketing page.
- `client/src/components/icons.jsx` — extended the existing `Logo` component with two new *optional* props, `markFill` and `iqColor`, both defaulting to the original hardcoded colors. This is how an existing component gets reused in a new context without breaking any of its current callers (`Shell.jsx`, `Auth.jsx`, `Onboarding.jsx`, `Workbench.jsx`) — every one of them calls `<Logo .../>` without those props, so they silently keep getting the old colors; only `MarketingFooter` passes the new ones, to get the mockup's lighter footer-specific shades.
- `client/src/screens/Marketing.jsx` — removed the old inline `Nav()` function and the one-line footer stub; both `Landing()` and `Pricing()` now render `<MarketingNav />` / `<MarketingFooter />` instead.
- `tests/ui/r29s1_marketing.spec.js` → renamed to `tests/ui/r34s1_marketing.spec.js` (via `git mv`, so history follows the file) and extended with assertions for the new nav's 6 links and the footer's 4 columns + legal bar. **Not executed** — see the environment note above.

**Why:**
- The mockups (`docs/specs/mockups/Marketing*.dc.html`) draw this exact nav+footer on every page. Building it once as a shared component (rather than copy-pasting the JSX into all 7 page files) means every later story just imports it — one source of truth for "what the site chrome looks like," matching how `Shell.jsx` is the one source of truth for the app-side sidebar.
- The footer only appears once in the actual mockup files (on Landing), but the plan calls for treating it as common chrome across all 7 pages — otherwise 6 of 7 pages would visually dead-end with no way back to the rest of the site.
- "Log in" now points to the real `/login` page (built in an earlier release) instead of `/app` — a small correctness fix, since a real login page already exists and the mockup's own intent was always "go log in," not "skip straight into the app." "Start free" was **left pointing at `/app`, unchanged** — an existing test (`r15s1_router.spec.js`) already asserts that clicking it lands on `/app`, and changing that destination wasn't in scope for this story.

**Tech concepts worth knowing:**
- **React component reuse via props, not copy-paste.** `MarketingNav`/`MarketingFooter` are plain functions that return JSX — importing and rendering `<MarketingNav />` from three different page files gives you the exact same markup and behavior everywhere, and a future style tweak only has to happen in one file.
- **`useLocation()` (react-router)** — a hook that returns the current URL's path. `MarketingNav` uses it to figure out which of the 6 links is "active" (rendered as plain bold text instead of a clickable link), matching the mockup's own active-item pattern, without needing any parent component to pass that information down manually.
- **`data-testid` attributes** — these are inert HTML attributes with no visual/behavioral effect; they exist purely so Playwright tests can find a specific element reliably (`page.getByTestId('nav-product')`) instead of relying on fragile CSS selectors or exact visible text, which can change with a copy edit.
- **Optional props with defaults** (`markFill = '#0f172a'`) — a common React pattern for extending a component's behavior without breaking existing call sites: any caller that doesn't pass the new prop gets identical behavior to before.

---

## R34S1E2 — Landing rebuild

**What changed:** `client/src/screens/Marketing.jsx` — `Landing()` fully rebuilt per `docs/specs/mockups/Marketing Landing.dc.html` and `01 - Landing Page Diff.md`. Broken into small local sub-components in the same file: `Hero` (dark hero + `HeroPreview`, the simulated "live build" panel with a chat bubble, status lines, 3 KPI cards, an inline SVG line chart, and a follow-up input), `BiComparison` ("Traditional BI" vs "AnalytIQ" two-column comparison), `ValueProps` (4 icon-chip cards), `UseCases` (6 clickable template preview cards, each with a unique small SVG illustration), `TrustStrip` (dark "GOVERNED BY DESIGN" band), `CtaBand` (closing call-to-action). `tests/ui/r34s1_marketing.spec.js`'s landing test was rewritten to match the new copy/sections (the old assertion checked for `'0 RAW ROWS TO LLM'`, which no longer exists verbatim in the new stat-strip wording).

**Why:**
- The mockup draws this page as roughly 8 distinct visual bands. Splitting each band into its own small named function (`Hero`, `BiComparison`, etc.) inside the file keeps each piece around the same size/readability as the equivalent mockup section, rather than one 300-line JSX blob — easier to check any one section against its mockup counterpart later.
- Colors/spacing were pulled from the mockup's literal hex values *except* where an exact match already exists in `tokens.js` (`P.darkBg` = `#0b1220` for the hero/trust-strip background, `P.darkPanel` = `#0f1729` for the preview-panel background, `P.darkAccent` = `#60a5fa`, `P.codeGreen`/`P.codeRed` for the KPI deltas, etc.) — these tokens already existed, seemingly pre-built in anticipation of this exact marketing rebuild, so reusing them keeps one source of truth instead of a second copy of the same hex values.
- **Decision — hero CTA destination:** the mockup points both the nav's and the hero's "Start free" buttons at a registration flow (`Auth.dc.html#register`). The nav's button is already locked by an existing test (`r15s1_router.spec.js`) to land on `/app`, from before real auth pages existed. Rather than have two "Start free" buttons on the same page go to two different places, the hero's button was also pointed at `/app` for now, matching the nav — a deliberate, visible inconsistency with the mockup's literal intent (register vs. straight-into-demo), flagged here rather than silently decided. Worth a real product decision later: should "Start free" always mean "create an account" now that `/register` exists for real?
- **Verification gap, documented rather than hidden:** this machine has no Chromium browser installed at all (confirmed while trying a one-off manual visual check outside the checked-in test suite — `npx playwright install chromium` has never been run here). Combined with the `@sparticuz/chromium` config issue from Story 1, there is currently no way to *render* the page and look at it on this machine. Verification for this story is: a clean `npm run build` (Vite would fail loudly on any JSX/syntax error), a careful line-by-line trace of the new JSX against the mockup's literal HTML/CSS values (color hex codes, sizes, copy text), and the backend pytest suite (expected/confirmed unaffected, since this is pure frontend). This is weaker than an actual rendered screenshot and is called out explicitly rather than implied to be equivalent.

**Tech concepts worth knowing:**
- **Converting static HTML/CSS into JSX inline styles** is mostly mechanical but has real syntax rules: CSS properties become camelCase (`stroke-width` → `strokeWidth`, `font-family` → `fontFamily`), the style value becomes a JS object (`style="color:red"` → `style={{ color: 'red' }}`), and numeric pixel values usually drop the unit (`padding: 16` means `16px` — React adds `px` automatically for most numeric style properties).
- **Composing small local components instead of one giant function** — `Hero`, `BiComparison`, `UseCases`, etc. are not exported or reused anywhere else; they exist purely to keep `Landing()` itself short and readable (`Landing()` is now just seven component tags in a row). This is a very common React pattern: break a big screen into paragraph-sized pieces, even if each piece is only ever used once.
- **Data-driven rendering with `.map()`** — `USE_CASES.map(uc => ...)` and `VALUE_CARDS.map(card => ...)` turn an array of plain JS objects into repeated JSX elements. Any future new template/value-prop card is just one more object in the array, not a copy-pasted block of markup.
- **Inline SVG as illustration, not an image file** — every small chart/icon in the mockup (and now the rebuilt page) is literal SVG markup embedded directly in the component, not a `.png`/`.svg` file reference. This keeps everything in one file, lets colors reuse the same token system, and avoids an extra network request per icon.

---

## R34S1E3 — Product page (new)

**What changed:** New file `client/src/screens/MarketingProduct.jsx` — the `/product` page didn't exist before this story. Built per `docs/specs/mockups/Marketing Product.dc.html` and the `03 - Product Page` build spec: a centered header, a sticky 5-step anchor stepper (Understand → Validate → Build → Predict → Ship), 5 alternating-background/alternating-layout stage sections (each pairing explanatory text with a distinct visual — a plan-review chat card, a dark validation log, a gold-table build card with progress bar, a model leaderboard, and a mini dashboard preview), and a closing dark CTA band. New route `/product` added in `App.jsx`. Extended `r34s1_marketing.spec.js` with a test covering the header, all 5 stage headings, and the CTA.

**Why:**
- This is a genuinely new page (nothing to "rebuild," unlike Landing) — the mockup's `data-screen-label="Product page /product"` maps directly to the new route.
- The 5 stages are data-driven (a `STAGES` array), each with a `reverse` flag controlling whether the text or the visual comes first in the grid — this mirrors the mockup's own alternating zebra layout (`1fr 1.1fr` vs `1.1fr 1fr` grid columns) without needing 5 near-duplicate JSX blocks; only the shared `Stage` component cares about the direction.
- The sticky stepper's anchor links (`href="#stage-understand"`, etc.) are plain HTML fragment links, not React Router routes — clicking one just scrolls the browser to that section's `id` on the same page. No JavaScript needed for that part; it's a native browser feature.

**A React-specific bug worth understanding — Fragment keys:** Initially wrote the stepper's repeating step+connector pairs using the JSX shorthand fragment (`<>...</>`) inside a `.map()`. This is a real mistake, not just style: React requires every element in a list (returned from `.map()`) to have a unique `key` prop so it can track which item is which across re-renders, but the shorthand `<>` fragment syntax **cannot accept a `key` prop at all** — only the explicit `<Fragment key={...}>` form (imported from `'react'`) can. Caught it before running anything by re-reading the code, not by a failed test — a good example of why "does this actually satisfy React's rules," not just "does this look right," matters when reviewing JSX.

**Tech concepts worth knowing:**
- **`useParams`-free routing for anchors** — same-page navigation (the stepper) doesn't need React Router at all; only *different* URLs (`/product` → `/pricing`) go through `<Link>`. A common beginner confusion is reaching for router features for in-page scrolling, which plain `#id` anchors already handle natively.
- **Grid column order via a boolean flag** (`stage.reverse`) instead of writing the JSX twice — a small example of the same "data describes the difference, one component renders it" idea used for `USE_CASES` and `VALUE_CARDS` in the Landing rebuild.

---
