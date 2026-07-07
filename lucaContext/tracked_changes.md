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
