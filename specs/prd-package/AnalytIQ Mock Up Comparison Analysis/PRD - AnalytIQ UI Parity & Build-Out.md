# PRD — AnalytIQ UI Parity & Build-Out

Version 1.0 · July 4, 2026 · Owner: Leo Carrico
Source of truth for visuals: the mockup HTML files in `AnalytIQ UI Requirements Document.zip` (`*.dc.html`). Every requirement in this PRD cites the exact mockup file and, in the detailed specs, line numbers and copy-paste code snippets.

---

# PART I — PRODUCT REQUIREMENTS

## 1. Purpose

Bring the current AnalytIQ build to full visual and functional parity with the approved mockups. A page-by-page audit (Part II, chapters 00–18) compared every reviewed mockup screen against the current UI. The findings split into three classes of work:

1. **Build missing surfaces** — roughly 45+ of the 96 mockup screens do not exist at all, including entire product pillars (semantic layer, models, sharing, governance flows, onboarding, 5 of 6 marketing pages).
2. **Restructure existing surfaces** — pages that exist but diverge structurally (pricing data is factually wrong, auth renders inside the app shell, artifacts "cards" render as a list, the workbench is missing its Clarify state and canvas substance).
3. **Polish and de-leak** — a systemic pattern of internal implementation details reaching users (snake_case titles, `gate:PASS` dumps, ref hashes, spec citations like "§17.3.1"/"§5.3", "PBKDF2 passwords" copy) and missing design-system application (fonts, pills, mono values, color-coded states).

## 2. Goals & non-goals

**Goals**
- Every reviewed mockup screen exists at its designed route with the designed layout, states, and copy.
- Zero user-visible internal vocabulary anywhere in the product.
- One shared design system (Section 4) applied everywhere.
- The core loop — ask → clarify → plan → build → canvas → share — works end to end as designed.

**Non-goals**
- Backend/data-platform changes beyond what the designed UI requires.
- New features not present in the mockups.
- Pixel-perfection on screens not yet reviewed (Data, Gold & Contracts, Alerts, Collaboration, Admin, Billing, Settings, Errors) — audit those before building.

**Approved deviation from mockups (KEEP):** the collapsed icon-only sidebar inside the Create Workbench (mockup removes the sidebar entirely; current collapse behavior is preferred — see chapter 11).

## 3. How to use this document

- **Part I** is the instructional layer: global rules, design system, phasing, and acceptance criteria.
- **Part II** embeds the complete, unabridged audit documents (chapters 00–18). Each chapter is the build spec for its area: it lists status, reference screenshots (in `screenshots/`, see chapter index there), the mockup source file with line references, exact HTML/CSS snippets for every component, and a per-area priority order.
- When implementing a screen: open the chapter, open the cited `*.dc.html` mockup file, and treat the mockup markup as the visual contract. Snippets in the chapters are excerpts of that contract.

## 4. Global design system (apply everywhere)

Extracted from the mockups; these rules recur in every chapter:

1. **Typography:** IBM Plex Sans (UI text) + IBM Plex Mono (labels, eyebrows, stats, identifiers, timestamps, table numerics). Load: `https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap`.
2. **Core palette:** ink `#0f172a` · body `#334155` · secondary `#64748b` · faint `#94a3b8` · borders `#e4e8ef`/`#d4d9e1` · row dividers `#eef1f5`/`#f3f5f9` · canvas `#f7f8fa` · header fills `#fafbfc` · primary `#2563eb` (hover `#1d4ed8`) · selection tint `#f8faff` with `#c7d9f8` border · dark navy surfaces `#0b1220` (secondary dark `#0f1729`, tiles `#111c31`).
3. **Status colors:** green `#15803d` on `#e8f5ec` (dark-surface green `#4ade80`) · amber `#b45309` on `#fdf3e3` (banner `#fdf9ef`/`#f2ddb0`, text `#7a4a10`) · red `#dc2626` on `#fdeaea` · purple `#7c3aed` on `#f3eefe` · teal `#0e7490` on `#e0f3f8`.
4. **Pill pattern:** `border-radius:999px; IBM Plex Mono 8.5–10px; font-weight:600; letter-spacing:.04–.06em; height 17–26px` with the tints above. Status pills prefix a 5px dot.
5. **Mono eyebrows/labels:** 9–11px, `letter-spacing:.08–.14em`, `#94a3b8` (blue `#2563eb` for section eyebrows on marketing).
6. **Tables:** header row 36–42px on `#fafbfc`, mono letterspaced 9.5–10px headers `#64748b`; rows 44–50px, hover `#f8fafc`; numeric cells mono 10.5–12px; relative timestamps ("2h ago"), avatar+name owners, ⋯ overflow menus instead of inline button rows.
7. **Cards:** white, `border:1px solid #e4e8ef`, radius 10–12px, hover `border-color:#c7d9f8; box-shadow:0 10px 28px rgba(15,23,42,.08)`. Selected: `border:2px solid #2563eb` + blue glow.
8. **Buttons:** primary filled `#2563eb` radius 8–9px, 32–46px tall by context; secondary outlined `#d4d9e1`; destructive red text or `#f4c7c7` outline.
9. **Dark code blocks:** `background:#0b1220; border-radius:8–9px; IBM Plex Mono 10–10.5px; color:#93c5fd`, diff/added tokens `#4ade80`, floating Copy button `rgba(255,255,255,.1)`.
10. **KPI cards:** mono label 9–9.5px letterspaced → mono value 22–24px/600 → colored mono context caption.
11. **Empty/zero states:** hide zero-count badges (no red "0" bells); caption style 12.5px `#64748b`.

## 5. Engineering ground rules

1. **No internal vocabulary in the UI.** Forbidden anywhere user-visible: snake_case section/component names (`timeseries_ci`, `kpi_row`, `dimension_breakdown`), pipeline step ids (`gold_build`, `walk_forward`), raw gate dumps (`data_contract:PASS`), ref hashes (`session_spec v1 233df9cf`), spec citations (`§5.3`, `§17.3.1`), implementation copy ("Local fallback auth — PBKDF2 passwords, 24h bearer tokens", "FTS", "CENTERPIECE"), and debug panels ("Agent memory") outside admin-only affordances. Every chapter lists the specific leaks found.
2. **Human formatting always:** currency (`$4.82M`), signed colored percentages (`−6.2%` red / `+3.9%` green), relative times, expected bands (`546 (exp 500–600)`).
3. **Route architecture matters:** auth/onboarding/share/present are standalone shells (no sidebar); the workbench is a dedicated surface at `/app/create/:sessionId`; `/share/:token` renders with workspace branding, token-gated, no auth.
4. **State machines, not single states:** register (4 steps), workbench (5 states), pipeline pills (done/active/pending), share tokens (live/expired), review items (accept/edit/reject).
5. **Wire the cross-links** each chapter's "build notes" enumerate (e.g., lineage icons → lineage graph with node preselected; Share modal → /share/:token; canvas present ▶ → present mode; Home → "View all activity →").
6. **Admin-gated technical detail** is allowed only behind explicit affordances ("Show technical detail (admin)", "SQL EXPRESSION · ADMIN ONLY").

## 6. Phased delivery plan

**Phase 1 — Core loop credibility (workbench + trust surfaces)**
Chapter 11 (Clarify state, canvas formatting/toolbars/sections, building event log, inspector controls), chapter 12 (tab overflow bug, share modal, comments, de-leak), chapter 13 (artifacts card grid, table columns, detail tabs).

**Phase 2 — First-run journey**
Chapter 08 (standalone auth, register wizard, forgot/verify/SSO screens), chapter 09 (all 4 onboarding screens), chapter 10 (activity page + home polish + notifications patterns).

**Phase 3 — Governance & data trust**
Chapter 15 (overview, review queue, definition diff, quality rules), chapter 16 (lineage graph, manifests, pre-agg), chapter 17 (semantic layer, 9 screens).

**Phase 4 — Prediction & distribution**
Chapter 18 (models & model ops, 6 screens), chapter 14 (public viewer, expired, embed, present).

**Phase 5 — Marketing site**
Chapters 01–07 (landing rebuild, pricing fixes — note the pricing DATA errors are a quick correctness win to pull forward, docs/product/solutions/templates/security pages).

**Continuous:** design-system application (Section 4) and de-leaking (Section 5.1) apply to every phase.

## 7. Acceptance criteria (global)

- Screen renders at the mockup route with the mockup's layout regions, states, and copy; side-by-side with the reference screenshot, no structural differences.
- IBM Plex fonts load; no default system font anywhere.
- No item from the forbidden-vocabulary list (5.1) appears in the DOM's visible text.
- All pills/status colors match the Section 4 palette mapping.
- All cross-links in the chapter's build notes navigate correctly.
- Pricing plan data matches chapter 02's table exactly (factual correctness).
- Per-chapter "Priority order" items are all closed or explicitly deferred with sign-off.

## 8. Open items

- Unreviewed areas (audit before building): Data Sources/Import/Detail, Gold Tables & Contracts, Alerts, Collaboration/Team, Admin (incl. Security/Usage), Billing, Settings, Error pages.
- Decide fate of current-build extras not in mockups: "ROI report", "Sandbox", "Health dashboard" buttons on artifacts (chapter 13 §1.7).
- Reference screenshots must be saved into `screenshots/` per its README index (early chat images need manual placement).

---

# PART II — COMPLETE AUDIT & BUILD SPECS (chapters 00–18)

The full, unabridged contents of every audit document follow.



---

<!-- ============ CHAPTER: 00 - MASTER - Comparison Overview.md ============ -->

# MASTER — AnalytIQ Mockup vs Current UI Comparison

Last updated: 2026-07-04 · Reviewed so far: 54 of 96 mockup screens (2 marketing + 8 auth + 4 onboarding + 3 home/activity/notifications + 1 create workbench + 7 inspector + 3 artifacts + 4 sharing + 7 governance/lineage + 9 semantic + 6 models)

---

## ⚠️ CRITICAL FINDING: MULTIPLE PAGES ARE MISSING ENTIRELY

This is not just styling drift. Based on review so far, **entire pages that exist in the mockup do not exist in the current build at all.**

The current nav contains only **Pricing**. The mockup nav links to six marketing pages — **5 are completely unbuilt** (Docs confirmed missing by user; the others absent from nav). Each now has a dedicated build-spec document:

| Mockup page | Route | Current status | Spec document |
|---|---|---|---|
| Product page | /product | ❌ MISSING ENTIRELY | 03 - Product Page (MISSING ENTIRELY).md |
| Solutions (6 persona routes) | /solutions/* | ❌ MISSING ENTIRELY | 04 - Solutions Page (MISSING ENTIRELY).md |
| Templates Gallery | /templates | ❌ MISSING ENTIRELY | 05 - Templates Gallery (MISSING ENTIRELY).md |
| Security page | /security | ❌ MISSING ENTIRELY | 06 - Security Page (MISSING ENTIRELY).md |
| Docs | /docs | ❌ MISSING ENTIRELY (confirmed) | 07 - Docs Page (MISSING ENTIRELY).md |

**Auth flow (reviewed): 6 of 8 screens missing entirely** — Register steps 3–4 (role cards, invite + first path), Forgot password, Email verification, and both SSO callback states don't exist. The 2 that exist (Sign in, Create account) render *inside the logged-in app shell* with sidebar and avatar visible pre-login, and leak internal copy ("PBKDF2 passwords, 24h bearer tokens", "Agent memory" debug panel). See `08 - Auth Flow Diff.md`.

**Onboarding (reviewed): ALL 4 screens missing entirely (user-confirmed)** — Workspace Setup wizard (5-step, branding + live preview), Choose Starting Mode (5 data-source cards), First Dataset Health Preview (profiling report + table), and First Dashboard Template Picker (data-aware recommendations). New users currently get no guided path from registration to a first dashboard. See `09 - Onboarding Flow (MISSING ENTIRELY).md`.

**App Home area (reviewed):** Home itself is the closest match so far, but the **Recent Activity page (/app/activity) is missing entirely (user-confirmed) and unreachable — no link to it exists anywhere**. Action item: add a "View all activity →" link on Home (header row and/or notifications drawer footer). Notifications drawer exists but lacks scrim, date grouping, and unread styling. See `10 - App Home & Activity Diff.md`.

**Create Workbench (reviewed, updated with full current-state screenshots):** the loop skeleton exists (prompt → plan → build → canvas, chat column, inspector tabs), but Clarify state is absent, Building lacks the live event log/run metadata/pill states, Canvas lacks toolbar/filters/human formatting (snake_case titles and raw numbers leak to users), and the inspector shows debug key/values instead of editing controls (+ leaks internal spec citation "§5.3"). **Keep: the collapsed icon sidebar (user-approved deviation from mockup).** See `11 - Create Workbench Diff.md`.

**Inspector panels (reviewed):** all six current tabs are raw/debug versions of the mockup panels (snake_case names, `gate:PASS` dumps, internal ref hashes user-visible); Share is one button instead of the full modal; Comments drawer + inline comment pins missing entirely; **BUG: "Versions" tab overflows the panel edge** — adopt mockup tab spec and move Versions to the topbar button. See `12 - Inspector Panels & Overlays Diff.md`.

**Artifact sharing surfaces (reviewed): ALL 4 MISSING ENTIRELY (user-confirmed)** — Public Artifact Viewer /share/:token, Expired-token state, Embed Preview /app/artifacts/:id/embed, and Present Mode /app/artifacts/:id/present. The "shareable artifacts" product pillar currently has no delivery surface at all. See `14 - Artifact Sharing Screens (MISSING ENTIRELY).md`.

**Governance (reviewed):** current build is a single raw "Governance ops" utility page (manifest table + naked config inputs). None of the mockup's 4 screens exist as designed — Overview KPIs, Human Review Queue, Definition Review diff (the human-in-the-loop flagship), and Quality Rules table+editor all need building; the ops page's fragments map onto them. See `15 - Governance Diff.md`.

**Semantic Layer (reviewed): ALL 9 screens missing entirely (user-confirmed)** — Overview, Explores list/detail, Metrics Catalog, Metric Detail, Dimensions Catalog, Visual Field Picker, Join Path Manager, Derived Tables editor. See `17 - Semantic Layer (MISSING ENTIRELY).md`.

**Models & Model Ops (reviewed): ALL 6 screens missing entirely (user-confirmed)** — Models Overview, Training Run Detail, Model Card, Leaderboard, Feature Manifest, Retrain Center. The "predictive models with model cards" pillar has no surface. See `18 - Models & Model Ops (MISSING ENTIRELY).md`.

### Comprehensive missing-entirely tally (user-confirmed so far)
- 5 marketing pages (Product, Solutions ×6 routes, Templates, Security, Docs)
- 6 of 8 auth screens
- All 4 onboarding screens
- Recent Activity page (+ no link exists)
- Workbench states 2 (Clarify) + most of 4/5 substance; inspector overlays (Share modal, Comments, pins)
- All 4 artifact sharing surfaces (/share/:token, expired, embed, present)
- All 4 governance screens as designed + all 3 lineage/manifest/pre-agg screens
- All 9 semantic layer screens
- All 6 models/model-ops screens

(Remaining app-side pages not yet assessed: Data screens, Gold & Contracts, Alerts, Collaboration/Team, Admin, Billing, Settings, Error pages.)

Additionally, within pages that DO exist, whole sections are missing (Landing page is missing ~70% of its mockup sections — see `01 - Landing Page Diff.md`).

---

## Screenshots

All reference screenshots live in `screenshots/` (see `screenshots/README - Screenshot Index.md` for the naming convention and full index). Each diff document lists its exact reference images in its header. Images shared in chat before 2026-07-04 need to be manually saved into that folder with the listed names; later pairs are filed automatically.

## Review status by page

| # | Page | Mockup file | Status | Diff file |
|---|---|---|---|---|
| 01 | Landing / | Marketing Landing.dc.html | ✅ Reviewed — skeleton only, ~70% of sections missing | 01 - Landing Page Diff.md |
| 02 | Pricing /pricing | Marketing Pricing.dc.html | ✅ Reviewed — cards have WRONG plan data, no CTAs; toggle/compare table/FAQ/footer all missing | 02 - Pricing Page Diff.md |
| 03 | Product /product | Marketing Product.dc.html | ❌ MISSING ENTIRELY — full build spec written | 03 - Product Page (MISSING ENTIRELY).md |
| 04 | Solutions /solutions/* (6 routes) | Marketing Solutions.dc.html | ❌ MISSING ENTIRELY — full build spec written | 04 - Solutions Page (MISSING ENTIRELY).md |
| 05 | Templates /templates | Marketing Templates.dc.html | ❌ MISSING ENTIRELY — full build spec written | 05 - Templates Gallery (MISSING ENTIRELY).md |
| 06 | Security /security | Marketing Security.dc.html | ❌ MISSING ENTIRELY — full build spec written | 06 - Security Page (MISSING ENTIRELY).md |
| 07 | Docs /docs | Marketing Docs.dc.html | ❌ MISSING ENTIRELY (user-confirmed) — full build spec written | 07 - Docs Page (MISSING ENTIRELY).md |
| 08 | Auth (8 screens: /login, /register ×3, /forgot-password, /verify-email, /sso/callback ×2) | Auth.dc.html | ⚠️/❌ Reviewed — 6 of 8 screens MISSING; existing 2 render inside app shell + leak internal copy | 08 - Auth Flow Diff.md |
| 09 | Onboarding (4 screens: /onboarding/workspace, /start, /source-health, /templates) | Onboarding.dc.html | ❌ ALL 4 MISSING ENTIRELY (user-confirmed) — full build spec written | 09 - Onboarding Flow (MISSING ENTIRELY).md |
| 10 | App Home /app · Activity /app/activity · Notifications | App Home.dc.html | ✅/❌ Home close match (7 deltas); Activity page MISSING + unlinked; drawer missing patterns | 10 - App Home & Activity Diff.md |
| 11 | Create Workbench /app/create (5 states) | Create Workbench.dc.html | ⚠️ Skeleton exists; Clarify missing, Building/Canvas/inspector heavily incomplete; KEEP collapsed sidebar | 11 - Create Workbench Diff.md |
| 12 | Inspector Panels & Overlays (7 panels) | Inspector Panels.dc.html | ⚠️/❌ Tabs exist as debug versions; Share modal + Comments drawer + inline pins MISSING; tab overflow BUG | 12 - Inspector Panels & Overlays Diff.md |
| 13 | Artifacts Library (cards + table) · Artifact Detail | Artifacts Library.dc.html | ⚠️ All exist but: "Cards" renders as list w/ 14 buttons per row; no filter rail/folders; table missing half the columns; detail has no tabs + leaks internals | 13 - Artifacts Library & Detail Diff.md |
| 14 | Sharing: Public Viewer /share/:token · Expired token · Embed Preview · Present Mode | Artifact Sharing.dc.html | ❌ ALL 4 MISSING ENTIRELY (user-confirmed) — full build spec written | 14 - Artifact Sharing Screens (MISSING ENTIRELY).md |
| 15 | Governance: Overview · Review Queue · Definition Review · Quality Rules | Governance.dc.html | ❌ None exist as designed — current is one raw "ops" utility page; 4 screens to build | 15 - Governance Diff.md |
| 16 | Lineage Graph · Manifest Versions · Pre-Aggregation | Governance Lineage.dc.html | ❌ ALL 3 MISSING ENTIRELY (user-confirmed) — full build spec written | 16 - Lineage, Manifests & Pre-Agg (MISSING ENTIRELY).md |
| 17 | Semantic Layer (9 screens: overview, explores ×2, metrics ×2, dimensions, field picker, joins, derived tables) | Semantic Overview/Metrics/Tools.dc.html | ❌ ALL 9 MISSING ENTIRELY (user-confirmed) — full build spec written | 17 - Semantic Layer (MISSING ENTIRELY).md |
| 18 | Models & Model Ops (6 screens: overview, run detail, model card, leaderboard, feature manifest, retrain center) | Models.dc.html · Models Ops.dc.html | ❌ ALL 6 MISSING ENTIRELY (user-confirmed) — full build spec written | 18 - Models & Model Ops (MISSING ENTIRELY).md |

## Full mockup screen inventory (96 screens, 33 files) — awaiting review

**Data:** Data Sources /app/data/sources · Add Data Source · Connector Setup (Snowflake) · Source Detail · Table Detail · File Upload · dbt Import · REST API Connector · Webhook Connector

**Gold & Contracts:** Gold Tables /app/gold · Gold Table Detail · Data Contracts · Query Contracts

**Alerts & Collaboration:** Alerts Center /app/alerts · Alert Detail · Create Alert · Team Members · Invite Members · Comments Inbox

**Admin:** Admin Overview /app/admin · Roles and Permissions · SSO Settings · Workspace Branding · Audit Log · Row-Level Security · Secrets · Sharing Governance · Usage and Cost

**Billing & Settings:** Billing Plan /app/billing · Invoices and Payment · Token Usage · User Settings · Preferences · API Keys · Help Center

**Misc:** Error Pages

---

## Recurring global gaps (accumulated across reviews)

1. **Typography:** Current UI uses default system fonts. Mockup uses IBM Plex Sans (body) + IBM Plex Mono (labels/eyebrows/stats) everywhere.
2. **Dark navy surfaces (#0b1220)** for hero/trust/footer bands absent from current build.
3. **Icon system:** Mockup uses inline SVG icons (logo mark, card icon chips, trust icons); current build has none.
4. **Copy drift:** Headlines, subcopy, and button labels differ from mockup on reviewed pages.
5. **Missing CTAs:** Buttons absent where the mockup has them (all 4 pricing cards have no button at all).
6. **Factual data drift:** Pricing page ships wrong seat counts and token limits (e.g. Team 1M vs 500K, Business 5M vs 2M) — content, not just styling.
7. **No footers:** Pricing page has no footer of any kind; Landing has a one-line stub instead of the 5-column dark footer.
8. **Wrong page architecture:** Auth screens render inside the logged-in app shell (sidebar, workspace switcher, avatar visible pre-login) instead of standalone centered-card pages.
9. **Internal/debug copy leaking to users:** "Local fallback auth — PBKDF2 passwords, 24h bearer tokens", "Agent memory" panel with spec references (§17.3.1) shown on auth pages.
10. **Flows flattened:** Mockup's 4-step register wizard (with role cards, teammate invites, first-path picker) collapsed into a single flat form with a role dropdown.


---

<!-- ============ CHAPTER: 01 - Landing Page Diff.md ============ -->

# 01 — Landing Page: Mockup vs Current UI

Mockup source: `Marketing Landing.dc.html` (line numbers reference that file)
Reference screenshots (in `screenshots/`): `01-landing-mockup-1.png` (top half), `01-landing-mockup-2.png` (bottom half), `01-landing-current.png` (current UI)
Status: Current page is a skeleton — ~70% of mockup sections missing entirely; existing sections diverge in font, color, and copy.

---

## 0. Global / Typography

**Current:** Default system font throughout, all-white page.
**Mockup:** IBM Plex Sans (body) + IBM Plex Mono (eyebrows, stats, labels). Biggest "feel" difference on every section.

```html
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<!-- page wrapper -->
font-family:'IBM Plex Sans',sans-serif
```

## 1. Nav (64px header)

Current: text-only logo, single "Pricing" link, "Login". Mockup differences:

- **Logo has an SVG mark** (dark rounded square with 3 blue bars) before the wordmark:
```html
<svg width="24" height="24" viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#0f172a"></rect><rect x="5.5" y="12" width="3.2" height="6.5" rx="1.2" fill="#60a5fa"></rect><rect x="10.4" y="8.5" width="3.2" height="10" rx="1.2" fill="#3b82f6"></rect><rect x="15.3" y="5" width="3.2" height="13.5" rx="1.2" fill="#2563eb"></rect></svg>
<span style="font-size:16px;font-weight:700;color:#0f172a;letter-spacing:-.01em">Analyt<span style="color:#2563eb">IQ</span></span>
```
- **Six center nav links**, 13.5px/500, color `#47516b`, gap 28px: Product, Solutions, Templates, Pricing, Security, Docs.
- Right side: "Log in" (not "Login") + "Start free" (not "Start Free"):
```html
<a style="display:inline-flex;align-items:center;height:36px;padding:0 16px;background:#2563eb;color:#fff;font-size:13.5px;font-weight:600;border-radius:8px">Start free</a>
```
- Container: `height:64px; padding:0 40px; border-bottom:1px solid #e4e8ef`.

## 2. Hero — biggest visual gap

Current: white background, generic H1, one button, near-empty dark terminal card. Mockup is a **dark navy hero** with a fully populated product simulation:

- Wrapper: `background:#0b1220; grid-template-columns:1.02fr .98fr; gap:56px; padding:84px 64px 88px` plus a blue radial glow:
```html
<div style="position:absolute;inset:0;background:radial-gradient(600px 320px at 78% 18%, rgba(37,99,235,.16), transparent 70%)"></div>
```
- **Eyebrow** (missing entirely): mono, letterspaced, blue dot:
```html
<div style="font-family:'IBM Plex Mono',monospace;font-size:11px;font-weight:600;letter-spacing:.14em;color:#60a5fa">
  <span style="width:6px;height:6px;border-radius:50%;background:#60a5fa"></span>CONVERSATIONAL ANALYTICS
</div>
```
- **Headline copy is different.** Mockup: "Ask a question.\nWatch the dashboard\nbuild itself." at `font-size:52px;line-height:1.06;letter-spacing:-.025em;color:#f8fafc`. Current: "A business question in. A governed dashboard out." — dark text on white.
- **Subcopy** (`16.5px, #94a3b8, max-width:470px`): "AnalytIQ turns plain-English questions into governed, shareable dashboards — validated metrics, predictive models, and a full audit trail. No SQL, no backlog."
- **Three CTAs**, current has one. Missing:
```html
<a style="height:44px;padding:0 22px;border:1px solid rgba(255,255,255,.22);color:#e2e8f0;font-size:14.5px;font-weight:600;border-radius:9px">Book a demo</a>
<a style="font-size:14px;font-weight:500;color:#60a5fa">View a sample dashboard →</a>
```
- Primary CTA: `height:44px;padding:0 22px;background:#2563eb;color:#fff;font-size:14.5px;font-weight:600;border-radius:9px` (hover `#1d4ed8`).
- **Stat strip:** current is uppercase/plain; mockup is lowercase mono with white bold values: `4 min question → artifact · 100% queries validated · 0 raw rows sent to an LLM` (`font-size:11.5px;color:#64748b`, values `#e2e8f0`).
- **Product preview panel:** current is a mostly empty dark box with 3 text lines. Mockup (lines 71–107) is a full simulated build: window chrome with 3 dots + `analytiq · create` + green **LIVE BUILD** pill; blue user chat bubble ("Which locations will miss their Q3 revenue target?"); 4 mono status lines with green checks; **3 KPI cards** (Q3 FORECAST $4.82M / AT-RISK LOCATIONS 7/42 / MODEL MAPE 4.1%); SVG line chart (actual vs target vs at-risk forecast) with legend; "Ask a follow-up…" input with blue arrow button.

Panel shell:
```html
<div style="width:100%;background:#0f1729;border:1px solid rgba(255,255,255,.1);border-radius:14px;box-shadow:0 24px 60px rgba(2,6,23,.6);overflow:hidden">
```
LIVE BUILD pill:
```html
<span style="margin-left:auto;display:inline-flex;align-items:center;gap:5px;font-family:'IBM Plex Mono',monospace;font-size:9.5px;font-weight:600;letter-spacing:.06em;color:#4ade80;background:rgba(74,222,128,.1);border:1px solid rgba(74,222,128,.25);border-radius:999px;padding:2px 8px"><span style="width:4px;height:4px;border-radius:50%;background:#4ade80"></span>LIVE BUILD</span>
```
Chat bubble:
```html
<div style="max-width:78%;background:#2563eb;color:#eef4ff;font-size:12.5px;line-height:1.45;padding:9px 13px;border-radius:12px 12px 3px 12px">Which locations will miss their Q3 revenue target?</div>
```
KPI card example:
```html
<div style="background:#111c31;border:1px solid rgba(255,255,255,.07);border-radius:8px;padding:9px 10px">
  <div style="font-family:'IBM Plex Mono',monospace;font-size:8.5px;letter-spacing:.08em;color:#64748b">Q3 FORECAST</div>
  <div style="font-family:'IBM Plex Mono',monospace;font-size:16px;font-weight:600;color:#f1f5f9;margin-top:3px">$4.82M</div>
  <div style="font-family:'IBM Plex Mono',monospace;font-size:9.5px;color:#f87171;margin-top:2px">−6.2% vs target</div>
</div>
```
Chart (full SVG at lines 93–103): actual `#3b82f6` solid 2.5px, target `#60a5fa` dashed, at-risk forecast `#f87171` dashed, area fill `rgba(37,99,235,.18)`, vertical "now" divider.
Follow-up input:
```html
<div style="display:flex;align-items:center;gap:8px;border:1px solid rgba(255,255,255,.1);border-radius:9px;padding:9px 12px;font-size:12px;color:#64748b">Ask a follow-up…<span style="margin-left:auto;display:inline-flex;width:22px;height:22px;border-radius:6px;background:#2563eb;align-items:center;justify-content:center"><!-- arrow svg --></span></div>
```

## 3. "Why not normal BI" section — MISSING entirely

Lines 113–144. Centered eyebrow + H2 + two-column comparison. Left card "Traditional BI" on `#fafbfc` with gray ✕ rows; right card "AnalytIQ" with blue border `#c7d9f8` and glow `box-shadow:0 8px 28px rgba(37,99,235,.08)`, green ✓ rows.

```html
<span style="font-family:'IBM Plex Mono',monospace;font-size:11px;font-weight:600;letter-spacing:.14em;color:#2563eb">WHY NOT NORMAL BI?</span>
<h2 style="margin:0;font-size:34px;font-weight:700;letter-spacing:-.02em;color:#0f172a">Dashboards shouldn't take a sprint</h2>
<p style="margin:0;max-width:560px;font-size:15px;line-height:1.6;color:#64748b">Traditional BI puts an analyst queue between a question and its answer. AnalytIQ puts a governed pipeline there instead.</p>
```
Row pattern: `display:flex;gap:12px;padding:13px 0;border-bottom:1px solid #eef1f5;font-size:14px` with `✕` in `#cbd5e1` / `✓` in `#15803d`. Section: `padding:88px 64px`, grid `1fr 1fr; gap:24px; margin-top:44px`.

Rows — Traditional BI (✕): Weeks of dashboard backlog behind the data team / "Revenue" defined five different ways across tools / Static charts that go stale the week they ship / SQL gatekeeps every follow-up question / Forecasting lives in a separate DS backlog.
Rows — AnalytIQ (✓): A finished dashboard minutes after the question / One governed semantic layer — every metric defined once / Live artifacts with health scores and freshness SLAs / Plain English in, deterministic validated SQL underneath / Forecasts trained, backtested and promoted automatically.

## 4. Value props (4 cards) — present but wrong

Current: plain white cards, no icons, truncated one-liners, on white. Mockup (lines 146–170):

- Band background `#f7f8fa`, top/bottom borders `#e4e8ef`, padding `76px 64px`, grid `repeat(4,1fr); gap:20px`.
- Each card: **34px tinted icon chip** (blue `#eff4ff`, purple `#f3eefe`, teal `#e0f3f8`, green `#e8f5ec`) with inline SVG; title `15.5px/600 #0f172a`; body `13.5px #64748b`, hover `box-shadow:0 6px 20px rgba(15,23,42,.07)`.

```html
<div style="background:#fff;border:1px solid #e4e8ef;border-radius:12px;padding:24px;display:flex;flex-direction:column;gap:12px">
  <span style="width:34px;height:34px;border-radius:9px;background:#eff4ff;display:inline-flex;align-items:center;justify-content:center"><!-- shield-check svg --></span>
  <div style="font-size:15.5px;font-weight:600;color:#0f172a">Governed metrics</div>
  <p style="margin:0;font-size:13.5px;line-height:1.55;color:#64748b">Every chart resolves to one reviewed definition in the semantic layer — never an LLM's guess.</p>
</div>
```
Full mockup copy:
- Governed metrics: "Every chart resolves to one reviewed definition in the semantic layer — never an LLM's guess."
- Predictive models: "Forecasts and risk scores trained per question, backtested, leakage-checked, and promoted with a model card."
- Shareable artifacts: "Dashboards are versioned artifacts — share links, embeds, exports, all scoped by signed tokens."
- No SQL required: "Business users ask in plain English. Admins can always inspect the exact SQL that ran." (icon chip = mono "Aa" in `#15803d`)

## 5. Use Cases section — MISSING entirely

Lines 172–221. Eyebrow `USE CASES`, H2 "Start from a question they already ask" (34px/700), right-aligned "Browse all templates →" (`14px/600 #2563eb`), then **3×2 grid** (`repeat(3,1fr); gap:20px; margin-top:36px`) of clickable cards, each with a decorative 56px SVG chart, title, quoted question, mono category tag:

```html
<a href="Marketing Templates.dc.html" style="text-decoration:none;border:1px solid #e4e8ef;border-radius:12px;padding:22px;display:flex;flex-direction:column;gap:14px;background:#fff">
  <svg viewBox="0 0 240 56" style="width:100%;height:56px"><!-- sparkline art --></svg>
  <div style="font-size:15px;font-weight:600;color:#0f172a">Revenue Forecast</div>
  <div style="font-size:13px;line-height:1.5;color:#64748b">"Where does revenue land this quarter — and what drives the gap?"</div>
  <span style="font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.06em;color:#94a3b8">FINANCE · PREDICTIVE</span>
</a>
```
Hover: `border-color:#c7d9f8; box-shadow:0 8px 24px rgba(15,23,42,.07)`.
Six cards (SVGs at lines 184–214): Revenue Forecast (FINANCE · PREDICTIVE), Customer Churn Risk (CUSTOMER SUCCESS · PREDICTIVE), Operational Risk Monitor (OPERATIONS · ANOMALY), Sales Pipeline Health (SALES · DIAGNOSTIC), Margin Variance (FINANCE · VARIANCE), Inventory Demand Forecast (OPERATIONS · PREDICTIVE).

## 6. Trust strip — MISSING

Lines 223–236. Dark band `background:#0b1220;padding:26px 64px`. Mono label `GOVERNED BY DESIGN` (`10.5px, letter-spacing:.14em, #64748b`), five icon+text items in `#94a3b8` mono 11.5px, gap 28px: No raw data to LLMs / Read-only warehouse access / Deterministic validation gates / Row-level security / Full audit logs. Right link `Security →` in `#60a5fa` 12.5px/600. Icons are 12px inline SVGs stroked `#60a5fa`.

## 7. CTA band — MISSING

Lines 238–248. Centered, `padding:96px 64px;background:#fff`:
```html
<div style="font-family:'IBM Plex Mono',monospace;font-size:12px;color:#94a3b8">$ analytiq create <span style="color:#2563eb">"weekly revenue by region, forecast 8 weeks"</span><span style="color:#2563eb">▌</span></div>
<h2 style="margin:0;font-size:38px;font-weight:700;letter-spacing:-.02em;color:#0f172a">Your next dashboard is a sentence away</h2>
```
Buttons: primary "Start free" (`height:46px;padding:0 24px;background:#2563eb;border-radius:9px;font-size:15px/600`) + outlined "See how it works" (`border:1px solid #d4d9e1;color:#0f172a`).

## 8. Footer — current is one line; mockup is a full dark footer

Lines 250–297. `background:#0b1220;padding:56px 64px 40px`, **5-column grid** `1.4fr 1fr 1fr 1fr 1fr; gap:32px`:
- Brand column: logo (mark on `#1e293b`), wordmark `#f1f5f9` with `IQ` in `#60a5fa`, tagline "The conversational analytics workbench. Ask, watch it build, share the artifact." (`12.5px #64748b`), 3 social icon chips 28×28 `border:1px solid rgba(255,255,255,.12); border-radius:7px` (Twitter/LinkedIn/GitHub).
- Link columns PRODUCT / SOLUTIONS / RESOURCES / COMPANY: mono 10px letterspaced headers `#475569`; links 13px `#94a3b8`, hover `#e2e8f0`.
  - PRODUCT: How it works, Templates, Pricing, Create Workbench
  - SOLUTIONS: For executives, For data teams, For finance, For operations
  - RESOURCES: Documentation, Quickstart, Security, Changelog
  - COMPANY: About, Careers, Contact, Legal
- Bottom bar:
```html
<div style="display:flex;justify-content:space-between;align-items:center;margin-top:44px;padding-top:22px;border-top:1px solid rgba(255,255,255,.08);font-family:'IBM Plex Mono',monospace;font-size:11px;color:#475569">
  <span>© 2026 AnalytIQ, Inc.</span>
  <span>SOC 2 Type II · GDPR · ISO 27001</span>
</div>
```
Current page's `SOC 2 TYPE II · GDPR · ISO 27001 — Powered by AnalytIQ` line moves into this bottom bar (right side); "Powered by AnalytIQ" is not in the mockup.

---

## Priority order to close the gap

1. Load IBM Plex Sans/Mono globally.
2. Dark hero (#0b1220) + fully populated product preview panel.
3. Add missing sections: BI comparison, use cases grid, trust strip, CTA band, full footer.
4. Restore full nav (logo mark + 6 links + Log in / Start free).
5. Restyle value-prop cards (icon chips, full copy, #f7f8fa band).


---

<!-- ============ CHAPTER: 02 - Pricing Page Diff.md ============ -->

# 02 — Pricing Page (/pricing): Mockup vs Current UI

Mockup source: `Marketing Pricing.dc.html` (line numbers reference that file)
Reference screenshots (in `screenshots/`): `02-pricing-mockup.png` (mockup), `02-pricing-current.png` (current UI)
Status: Plan cards exist but with wrong data, wrong styling, and no CTAs. Toggle, comparison table, FAQ, and footer are **missing entirely**. Nav confirms 5 marketing pages still unbuilt.

---

## ⚠️ Data/content errors (not just styling — the numbers are wrong)

| Plan | Current UI says | Mockup says |
|---|---|---|
| Starter | 1 seat | **3 seats · 1 source** |
| Starter | "Dashboards" | **5 artifacts**, plus excluded rows: — Predictive models, — Public share links |
| Team | 5 seats | **10 seats · 3 sources** |
| Team | 1M tokens | **500K tokens/mo** |
| Team | (missing) | **Unlimited artifacts** |
| Business | 5M tokens | **2M tokens/mo · overage $8/100K** |
| Business | "Audit export" | **SSO · RLS · full audit log / Signed embeds + public links / Priority support** |
| Enterprise | "SIEM streaming" | Not in mockup. Mockup: **Unlimited seats & sources / Custom token pools / VPC · private link / 99.9% SLA · DPA · SOC 2 reports / Dedicated success engineer** |

## 1. Nav — same gaps as Landing

Only "Pricing" link; missing logo mark SVG, Product/Solutions/Templates/Security/Docs links, "Log in"/"Start free" casing. See `01 - Landing Page Diff.md` §1 for exact code. On this page, Pricing is the active item: `<span style="color:#0f172a;font-weight:600">Pricing</span>`.

## 2. Page header — wrong headline, missing toggle

Current: plain left-aligned "Pricing" H1, nothing else. Mockup (lines 48–55): centered header block, `padding:56px 64px 22px`:

```html
<h1 style="margin:0;font-size:38px;font-weight:700;letter-spacing:-.02em;color:#0f172a">Pay for answers, not seats you don't use</h1>
<p style="margin:0;font-size:15px;color:#64748b">Every plan includes governed metrics, validation gates, and read-only connections.</p>
```

**Monthly/Annual toggle — MISSING entirely:**
```html
<div style="display:flex;align-items:center;border:1px solid #d4d9e1;border-radius:999px;overflow:hidden;margin-top:6px">
  <span style="display:inline-flex;align-items:center;height:34px;padding:0 17px;background:#fff;color:#64748b;font-size:12.5px;font-weight:500;cursor:pointer">Monthly</span>
  <span style="display:inline-flex;align-items:center;gap:7px;height:34px;padding:0 17px;background:#0f172a;color:#fff;font-size:12.5px;font-weight:600">Annual<span style="display:inline-flex;height:17px;padding:0 7px;border-radius:999px;background:#15803d;font-family:'IBM Plex Mono',monospace;font-size:8.5px;font-weight:600;align-items:center">−20%</span></span>
</div>
```

## 3. Plan cards (lines 57–111)

Grid: `repeat(4,1fr); gap:16px; padding:26px 64px 30px; max-width:1328px`.

Missing from ALL current cards:
- **"/mo" price suffix** — `<span style="font-size:12px;color:#94a3b8">/mo</span>` beside a mono 30px price: `font-family:'IBM Plex Mono',monospace;font-size:30px;font-weight:600`
- **Descriptor line** under price (12px `#64748b`): "Try the loop on one dataset." / "For teams shipping weekly answers." / "Governance for the whole org." / "Scale, isolation, and guarantees."
- **CTA buttons — none exist in current UI.** Mockup has one per card:
```html
<!-- Starter / Team: outlined -->
<a style="display:inline-flex;align-items:center;justify-content:center;height:38px;border:1px solid #d4d9e1;border-radius:9px;color:#0f172a;font-size:13px;font-weight:600">Start free</a>
<!-- Business / Enterprise: filled -->
<a style="display:inline-flex;align-items:center;justify-content:center;height:38px;background:#2563eb;border-radius:9px;color:#fff;font-size:13px;font-weight:600">Start trial</a>  <!-- Enterprise: "Talk to sales" -->
```
- **Excluded-feature rows** (em-dash, grayed) on Starter/Team:
```html
<span style="display:flex;gap:8px;color:#94a3b8"><span style="color:#cbd5e1;font-weight:700">—</span>Predictive models</span>
```
- Feature rows: `12.5px #334155`, check `✓` in `#15803d`, gap 7px; token counts wrapped in mono 11.5px.

**Business card** (lines 84–96): current has thin blue border and "MOST POPULAR" as inline text inside the card. Mockup: 2px border + glow, and the badge is a floating pill overlapping the top edge:
```html
<div style="border:2px solid #2563eb;border-radius:13px;padding:24px;position:relative;box-shadow:0 16px 40px rgba(37,99,235,.12)">
  <span style="position:absolute;top:-11px;left:20px;display:inline-flex;height:22px;padding:0 11px;border-radius:999px;background:#2563eb;color:#fff;font-family:'IBM Plex Mono',monospace;font-size:9px;font-weight:600;align-items:center;letter-spacing:.06em">MOST POPULAR</span>
```

**Enterprise card** (lines 98–110): current is white like the others. Mockup is **dark navy**:
```html
<div style="border:1px solid #0b1220;border-radius:13px;padding:24px;background:#0b1220">
  <span style="font-size:15px;font-weight:600;color:#f1f5f9">Enterprise</span>
  <!-- price "Custom" in #f1f5f9 mono 30px; descriptor #94a3b8; features #cbd5e1 with ✓ in #4ade80 -->
```

## 4. Comparison table — MISSING entirely

Lines 113–123. Bordered rounded table, 5-col grid `1.6fr 1fr 1fr 1fr 1fr`, 42px rows. Header row on `#fafbfc` in mono 9.5px letterspaced (`COMPARE / STARTER / TEAM / BUSINESS / ENTERPRISE`, Business highlighted `#1d4ed8`):
```html
<div style="display:grid;grid-template-columns:1.6fr 1fr 1fr 1fr 1fr;padding:0 22px;height:42px;align-items:center;background:#fafbfc;border-bottom:1px solid #e4e8ef;font-family:'IBM Plex Mono',monospace;font-size:9.5px;font-weight:600;letter-spacing:.06em;color:#64748b">
```
Rows: Monthly tokens included (100K / 500K / **2M** / custom, mono) · Predictive models + model cards (— ✓ ✓ ✓) · SSO (SAML/OIDC) + row-level security (— — ✓ ✓) · Signed public links + embeds (— `links only` ✓ ✓) · Audit log export · VPC · SLA (— — `audit only` ✓). Partial values are mono 10.5px `#64748b`; ✓ `#15803d`; — `#cbd5e1`.

## 5. FAQ ("Questions") — MISSING entirely

Lines 125–135. Centered H2 22px "Questions", max-width 860px, accordion cards. First item expanded:
```html
<div style="border:1px solid #e4e8ef;border-radius:10px;padding:15px 18px;display:flex;flex-direction:column;gap:8px">
  <div style="display:flex;justify-content:space-between;align-items:center;cursor:pointer"><span style="font-size:13.5px;font-weight:600;color:#0f172a">What counts as a token?</span><!-- chevron-down svg --></div>
  <span style="font-size:13px;line-height:1.6;color:#64748b">Tokens meter the AI planning work — understanding questions, planning dashboards, writing narratives. Viewing dashboards, filtering, and scheduled refreshes of existing artifacts don't consume tokens.</span>
</div>
```
Collapsed items (chevron-right): "What happens when we hit our token limit?" · "Does my data ever leave my warehouse?" · "Can we switch plans or cancel anytime?" Hover: `border-color:#c7d9f8`.

## 6. Footer — MISSING

Current pricing page has no footer at all. Mockup marketing pages share the dark 5-column footer — see `01 - Landing Page Diff.md` §8.

---

## Priority order

1. Fix plan data (seats/tokens/features are factually wrong).
2. Add CTA buttons to every card.
3. Enterprise card → dark navy; Business badge → floating pill + 2px border/glow.
4. Add header headline/subcopy + Monthly/Annual toggle.
5. Add comparison table and FAQ sections.
6. Add shared footer; fix nav; IBM Plex fonts.


---

<!-- ============ CHAPTER: 03 - Product Page (MISSING ENTIRELY).md ============ -->

# 03 — Product Page (/product): ❌ PAGE MISSING ENTIRELY

**Status: This page does not exist in the current build. Everything below must be built from scratch.**
Mockup source: `Marketing Product.dc.html` (line numbers reference that file)
Reference screenshot (in `screenshots/`): `03-product-mockup.png` if added — no current-UI screenshot exists because the page is unbuilt

---

## Page structure (top to bottom)

1. Shared marketing nav (Product active) — see `01 - Landing Page Diff.md` §1. Active item: `<span style="color:#0f172a;font-weight:600">Product</span>`
2. Centered page header
3. Sticky 5-step stepper (anchor nav)
4. Five alternating stage sections (text + visual card, zebra `#fff`/`#f7f8fa`)
5. Dark CTA band

## 1. Page header (lines 48–52)

```html
<span style="font-family:'IBM Plex Mono',monospace;font-size:11px;font-weight:600;letter-spacing:.14em;color:#2563eb">HOW IT WORKS</span>
<h1 style="margin:0;font-size:40px;font-weight:700;letter-spacing:-.02em;color:#0f172a">A governed pipeline, not a chatbot</h1>
<p style="margin:0;max-width:620px;font-size:15.5px;line-height:1.6;color:#64748b">Every question runs through nine deterministic stages. The LLM plans; validated SQL and gates do the work. Click a stage to jump to it.</p>
```
Container: `padding:68px 64px 28px; text-align:center`.

## 2. Sticky stepper (lines 54–67)

`position:sticky;top:0;background:#fff;z-index:2; padding:26px 64px 56px`. Five anchor steps joined by 2px `#e4e8ef` connector lines. Step 1 active (filled), 2–5 inactive (outlined):

```html
<!-- active -->
<a href="#stage-understand"><span style="width:34px;height:34px;border-radius:50%;background:#2563eb;color:#fff;display:inline-flex;align-items:center;justify-content:center;font-family:'IBM Plex Mono',monospace;font-size:12px;font-weight:600">1</span><span style="font-size:11.5px;font-weight:600;color:#0f172a">Understand</span></a>
<!-- inactive -->
<span style="width:34px;height:34px;border-radius:50%;border:2px solid #c7d9f8;background:#f8faff;color:#1d4ed8;...">2</span>
```
Labels: Understand · Validate metrics · Build gold data · Train & backtest · Assemble & share.

## 3. Stage sections (lines 69–174)

All: `padding:34px 64px`, inner `max-width:1200px; grid 2-col; gap:56px; align-items:center`. Text side has eyebrow (`STAGE N · NAME`, mono 10.5px `#2563eb`), H2 27px/700, body 14.5px `#64748b`, optional mono footnote `#94a3b8`.

**Stage 1 · UNDERSTAND** (bg `#f7f8fa`): H2 "Your question becomes a reviewable plan". Visual = white card with chat bubble + plan review card:
```html
<div style="border:1px solid #c7d9f8;border-radius:9px;padding:11px 13px;background:#f8faff">
  <span style="font-size:11.5px;font-weight:600;color:#0f172a">Review your plan</span>
  <span style="font-family:'IBM Plex Mono',monospace;font-size:9.5px;line-height:1.8;color:#64748b">GOAL    flag locations >5% below target<br>METRICS net_revenue · target_gap_pct<br>SOURCES sample_retail + q3_targets.xlsx</span>
  <!-- Approve & Build (filled) + Edit (outlined) mini buttons -->
</div>
```
Footnote: `no raw data touches the LLM · plan is auditable JSON`.

**Stage 2 · VALIDATE** (bg `#fff`, visual left): H2 "Deterministic gates, not vibes". Visual = dark `#0b1220` terminal card, mono 11px log lines: ✓ green `#4ade80`, blocked join in red `#f87171` with `BLOCKED` tag, indented steward note. Link "Security & governance model →" to /security.

**Stage 3 · BUILD** (bg `#f7f8fa`): H2 "An immutable gold table per answer". Visual = white card: pipeline chips `orders + targets → GOLD.REV_LOC_WK_V1` (gold chip `#fdf9ef`/`#b45309`), four green gate pills (`ROW BAND ✓`, `GRAIN UNIQUE ✓`, `RECONCILES GL ✓`, `NULL CONTRACT ✓` — `background:#e8f5ec;color:#15803d;border-radius:999px;font-size:9px` mono), and an SVG progress bar "3,486 / 3,600 expected rows · within band ✓". Footnote: `GOLD.REV_LOC_WK_V1 · 3,486 rows · gates 6/6 ✓`.

**Stage 4 · PREDICT** (bg `#fff`, visual left): H2 "Forecasts earn their place". Visual = leaderboard card: header row `candidate leaderboard · 5-window backtest` / `leakage 14/14 ✓`; three horizontal bars — LightGBM 4.1% (green `#15803d`, winner), XGBoost 4.6% (`#93c5fd`), Prophet 5.8% (`#cbd5e1`); footnote `promotion gate: beat incumbent by ≥0.5pt on ≥3 windows ✓ · model card generated`.

**Stage 5 · SHIP** (bg `#f7f8fa`): H2 "A living artifact, not a screenshot". Two CTAs: "See the workbench" (filled) + "Sharing views" (outlined). Visual = mini dashboard card: 3 KPI tiles (Q3 FORECAST $4.82M / AT-RISK 7/42 / HEALTH 96 · v14), SVG trend chart with forecast split, three pills: `● HEALTHY` (green), `SIGNED LINK` (blue `#eff4ff`/`#1d4ed8`), `MODEL CARD` (purple `#f3eefe`/`#7c3aed`).

## 4. CTA band (lines 176–183)

```html
<div style="padding:72px 64px;background:#0b1220;text-align:center">
  <h2 style="margin:0;font-size:32px;font-weight:700;letter-spacing:-.02em;color:#f8fafc">Watch it build your first dashboard</h2>
  <!-- "Start free" filled #2563eb 44px + "Browse templates" outlined rgba(255,255,255,.22) -->
</div>
```


---

<!-- ============ CHAPTER: 04 - Solutions Page (MISSING ENTIRELY).md ============ -->

# 04 — Solutions Pages (/solutions/*): ❌ PAGE MISSING ENTIRELY

**Status: Does not exist in the current build. Build from scratch.**
Reference screenshot (in `screenshots/`): `04-solutions-mockup.png` if added — no current-UI screenshot exists because the page is unbuilt
Mockup source: `Marketing Solutions.dc.html`. One shared template covers **6 routes**: /solutions/executives · /data-teams · /operations · /finance · /sales · /customer-success (mockup shows the Executives variant).

---

## Page structure

1. Shared marketing nav (Solutions active)
2. Persona tab pills (centered)
3. Persona hero (text + dark digest card)
4. "Starting points" template cards (3)
5. Dark quote band
6. Three feature callouts
7. Gray CTA band

## 1. Persona tabs (lines 47–55)

Centered pill row, `padding:22px 40px 0`. Active = dark fill; inactive = outlined:
```html
<span style="display:inline-flex;align-items:center;height:32px;padding:0 15px;border-radius:999px;background:#0f172a;color:#fff;font-size:12.5px;font-weight:600">Executives</span>
<span style="...;border:1px solid #d4d9e1;color:#47516b;font-weight:500">Data teams</span>
```
Tabs: Executives · Data teams · Operations · Finance · Sales · Customer success.

## 2. Hero (lines 57–74)

Grid `1.05fr .95fr; gap:56px; padding:52px 64px 60px; max-width:1328px`.

Text side:
```html
<span style="font-family:'IBM Plex Mono',monospace;font-size:11px;font-weight:600;letter-spacing:.14em;color:#2563eb">FOR EXECUTIVES</span>
<h1 style="margin:0;font-size:38px;font-weight:700;letter-spacing:-.02em;line-height:1.12;color:#0f172a">Answers before the meeting, not after the sprint</h1>
<p style="margin:0;max-width:480px;font-size:15px;line-height:1.65;color:#64748b">Ask the question you'd ask your analyst. Get a governed dashboard with a forecast and a plain-English narrative — in minutes, with an audit trail your data team trusts.</p>
```
CTAs: "Start free" (filled 42px) + "See present mode" (outlined).

Visual side — dark digest card:
```html
<div style="background:#0b1220;border-radius:14px;padding:20px;box-shadow:0 20px 50px rgba(2,6,23,.35)">
  <!-- header: "Monday 8am digest" (#e2e8f0 12.5px/600) + "auto-generated" (mono 9px #64748b) -->
  <!-- narrative 12.5px #94a3b8 with inline highlights: $4.82M mono #f1f5f9, "Northeast" #f87171, "+3.9%" #4ade80 -->
  <!-- SVG trend chart with forecast split -->
  <!-- pills: GOVERNED (green tint) · MAPE 4.1% (blue tint) -->
</div>
```

## 3. Starting points (lines 76–93)

Mono label `STARTING POINTS FOR EXECUTIVES` (10.5px `#94a3b8`), 3-col grid, gap 18px. Card = SVG preview strip on `#f7f8fa` + text block:
```html
<a style="border:1px solid #e4e8ef;border-radius:12px;overflow:hidden" style-hover="border-color:#c7d9f8;box-shadow:0 10px 28px rgba(15,23,42,.08)">
  <div style="background:#f7f8fa;border-bottom:1px solid #eef1f5;padding:14px"><svg .../></div>
  <div style="padding:14px 16px"><span style="font-size:14px;font-weight:600;color:#0f172a">Exec Weekly Revenue</span><span style="font-size:12px;color:#64748b">Trend + forecast + one narrative paragraph.</span></div>
</a>
```
Cards: Exec Weekly Revenue · Board Pack KPIs ("The 8 numbers the board asks about, always fresh.") · Risk & Exceptions Brief ("What broke, what's drifting, who owns it.")

## 4. Quote band (lines 95–105)

`padding:56px 64px;background:#0b1220`, centered max-width 860px. Blue quote mark (mono 22px `#2563eb`), quote 21px/500 `#e2e8f0`:
> "I stopped asking for decks. I ask AnalytIQ on Sunday night and walk into Monday's exec meeting with the answer — and the receipts."

Attribution: purple avatar circle "RM" (`background:#7c3aed`), name "Rosa Martínez" (`#f1f5f9` 13px/600), role mono 10px `#64748b` "COO · national retail chain".

## 5. Feature callouts (lines 107–124)

3-col grid of bordered cards (`padding:20px;border-radius:12px`), each: 32px tinted icon chip + title 14.5px/600 + body 12.5px `#64748b`:
- **Present mode** (blue chip `#eff4ff`): "Full-screen sections with auto-generated speaker notes."
- **Alerts that matter** (red chip `#fdeaea`): "One Slack ping when a region drifts off target — not fifty."
- **Numbers that reconcile** (green chip `#e8f5ec`): "Every figure traces to one governed definition. No dueling decks."

## 6. CTA band (lines 126–129)

`padding:60px 64px;background:#f7f8fa;border-top:1px solid #e4e8ef`, centered:
```html
<h2 style="margin:0;font-size:28px;font-weight:700;letter-spacing:-.02em;color:#0f172a">Bring one real question. That's the demo.</h2>
```
Buttons: "Start free" (filled 44px) + "Book a demo" (outlined `#d4d9e1`).


---

<!-- ============ CHAPTER: 05 - Templates Gallery (MISSING ENTIRELY).md ============ -->

# 05 — Templates Gallery (/templates): ❌ PAGE MISSING ENTIRELY

**Status: Does not exist in the current build. Build from scratch.**
Mockup source: `Marketing Templates.dc.html`
Reference screenshot (in `screenshots/`): `05-templates-mockup.png` if added — no current-UI screenshot exists because the page is unbuilt

---

## Page structure

1. Shared marketing nav (Templates active)
2. Two-column layout: 250px filter rail + template grid
3. Grid header (title + count + search) and 3-column card grid (10 templates)

## 1. Layout shell (line 47)

```html
<div style="display:grid;grid-template-columns:250px 1fr;gap:0">
```

## 2. Filter rail (lines 48–68)

`border-right:1px solid #e4e8ef;padding:30px 26px`. Mono section labels (`CATEGORY`, `TYPE` — 10px letterspaced `#94a3b8`), checkbox rows 13px. Checked state = filled blue box with white check:
```html
<label style="display:flex;align-items:center;gap:9px;font-size:13px;color:#0f172a;font-weight:600;cursor:pointer">
  <span style="width:15px;height:15px;border-radius:4px;background:#2563eb;display:inline-flex;align-items:center;justify-content:center"><svg width="9" height="9" viewBox="0 0 9 9"><path d="m2 4.5 2 2 3-3.5" fill="none" stroke="#fff" stroke-width="1.4" stroke-linecap="round"></path></svg></span>All templates
</label>
<!-- unchecked: <span style="width:15px;height:15px;border-radius:4px;border:1.5px solid #cbd5e1"></span>, text #334155 -->
```
CATEGORY: All templates (checked) · Revenue · Churn · Operations · Sales · Marketing · Inventory · SLA. Divider `height:1px;background:#eef1f5`. TYPE: Predictive · Monitoring · Diagnostic.

## 3. Grid header (lines 72–75)

```html
<h1 style="margin:0;font-size:24px;font-weight:700;letter-spacing:-.015em;color:#0f172a">Templates <span style="font-family:'IBM Plex Mono',monospace;font-size:13px;font-weight:500;color:#94a3b8">10</span></h1>
<!-- search: 300px × 36px, border #d4d9e1, radius 9, placeholder "Search templates…" with magnifier svg -->
```

## 4. Template cards (lines 76–127)

3-col grid, gap 16px. Card = SVG preview on `#f7f8fa` strip + text block; hover `border-color:#c7d9f8; box-shadow:0 10px 28px rgba(15,23,42,.08)`:
```html
<div style="border:1px solid #e4e8ef;border-radius:12px;overflow:hidden;cursor:pointer">
  <div style="background:#f7f8fa;border-bottom:1px solid #eef1f5;padding:13px"><svg viewBox="0 0 320 58" style="width:100%;height:58px"><!-- preview art --></svg></div>
  <div style="padding:13px 15px;display:flex;flex-direction:column;gap:4px">
    <span style="font-size:13.5px;font-weight:600;color:#0f172a">Revenue Forecast</span>
    <span style="font-size:11.5px;line-height:1.5;color:#64748b">Weekly trend + 8-week forecast vs target.</span>
    <span style="font-family:'IBM Plex Mono',monospace;font-size:9px;color:#94a3b8;margin-top:3px">REVENUE · PREDICTIVE</span>
  </div>
</div>
```

All 10 templates (name / description / tag — SVG art defined at cited lines):
1. Revenue Forecast — "Weekly trend + 8-week forecast vs target." — REVENUE · PREDICTIVE (line 79)
2. Location Performance — "Rank stores vs target; flag laggards." — REVENUE · DIAGNOSTIC (line 84)
3. Customer Churn Risk — "Score accounts by 60-day churn probability." — CHURN · PREDICTIVE (line 89)
4. Operational Risk Monitor — "Heatmap of drift across sites and lines." — OPERATIONS · MONITORING (line 94)
5. Sales Pipeline Health — "Coverage, stage velocity, stale-deal flags." — SALES · DIAGNOSTIC (line 99)
6. Margin Variance — "SKU/supplier drivers of gross margin leaks." — REVENUE · VARIANCE (line 104)
7. Marketing Spend Efficiency — "Channel ROAS with diminishing-returns curve." — MARKETING · DIAGNOSTIC (line 109)
8. Inventory Demand Forecast — "Stockout risk by SKU and warehouse." — INVENTORY · PREDICTIVE (line 114)
9. SLA Breach Predictor — "Which shipments/tickets will miss SLA next." — SLA · PREDICTIVE (line 119)
10. Anomaly Monitor — "Baseline-aware spikes on any metric." — OPERATIONS · MONITORING (line 124)


---

<!-- ============ CHAPTER: 06 - Security Page (MISSING ENTIRELY).md ============ -->

# 06 — Security Page (/security): ❌ PAGE MISSING ENTIRELY

**Status: Does not exist in the current build. Build from scratch.**
Mockup source: `Marketing Security.dc.html`
Reference screenshot (in `screenshots/`): `06-security-mockup.png` if added — no current-UI screenshot exists because the page is unbuilt

---

## Page structure

1. Shared marketing nav (Security active)
2. Left-aligned header with compliance badge pills
3. Two-column body: sticky "ON THIS PAGE" jump nav (250px) + 8 security section cards

## 1. Header (lines 47–56)

`padding:56px 64px 30px; max-width:1328px`:
```html
<span style="font-family:'IBM Plex Mono',monospace;font-size:11px;font-weight:600;letter-spacing:.14em;color:#2563eb">SECURITY &amp; GOVERNANCE</span>
<h1 style="margin:0;font-size:38px;font-weight:700;letter-spacing:-.02em;color:#0f172a;max-width:720px">Built so your data team says yes</h1>
```
Compliance pills (30px, mono 10.5px `#334155`, green icons `#15803d`):
```html
<span style="display:inline-flex;align-items:center;gap:7px;height:30px;padding:0 13px;border:1px solid #e4e8ef;border-radius:999px;font-family:'IBM Plex Mono',monospace;font-size:10.5px;color:#334155"><!-- shield svg -->SOC 2 Type II</span>
```
Pills: SOC 2 Type II · ISO 27001 · GDPR / CCPA · AES-256 at rest · TLS 1.3.

## 2. Sticky jump nav (lines 59–70)

`position:sticky;top:24px`, mono label `ON THIS PAGE`. Active link filled:
```html
<a href="#sec-llm" style="padding:8px 12px;border-radius:7px;font-size:12.5px;font-weight:600;color:#1d4ed8;background:#eff4ff;text-decoration:none">No raw data to LLMs</a>
<!-- inactive: font-weight:500;color:#47516b, hover background:#f1f4f9 -->
```
Items: No raw data to LLMs · Read-only access · Validation gates · PII detection · Audit logs · Row-level security · Signed embed tokens · Workspace scoping.

## 3. Section cards (lines 73–129)

Stacked, gap 14px. Pattern: bordered card, 38px tinted icon chip + title 15.5px/600 + body 13.5px `#64748b`:
```html
<div id="sec-llm" style="border:1px solid #e4e8ef;border-radius:12px;padding:22px 26px;display:flex;gap:18px">
  <span style="width:38px;height:38px;border-radius:11px;background:#eff4ff;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0"><!-- icon svg --></span>
  <div style="display:flex;flex-direction:column;gap:6px">
    <span style="font-size:15.5px;font-weight:600;color:#0f172a">No raw data ever reaches an LLM</span>
    <p style="margin:0;font-size:13.5px;line-height:1.65;color:#64748b">Models see schemas, governed definitions, and aggregate result shapes — never row-level data. Answer generation runs on statistical summaries computed inside your warehouse boundary.</p>
  </div>
</div>
```

All 8 cards (title / chip tint / body summary):
1. **No raw data ever reaches an LLM** — blue `#eff4ff` — schemas & aggregates only, summaries computed inside warehouse boundary.
2. **Read-only warehouse access** — green `#e8f5ec` — dedicated read-only role; gold tables written only to isolated schema.
3. **Deterministic validation gates** — blue — SQL safety analysis + shape/contract checks; failures repair or halt.
4. **PII detected, masked, human-reviewed** — amber `#fdf3e3` — flagged on ingestion, masked by default, steward unmask logged.
5. **Every action in the audit log** — purple `#f3eefe` — builds/approvals/shares/exports/permissions; CSV/JSON export; SIEM streaming on Enterprise.
6. **Row-level security with a simulator** — teal `#e0f3f8` — policies scope every query; admins preview as any user.
7. **Signed, expiring share & embed tokens** — blue — expiration, password, domain allow-list, instant revocation.
8. **Workspace-scoped everything** — green — cross-workspace access off by default.


---

<!-- ============ CHAPTER: 07 - Docs Page (MISSING ENTIRELY).md ============ -->

# 07 — Docs (/docs): ❌ PAGE MISSING ENTIRELY

**Status: Does not exist in the current build. Build from scratch.**
Mockup source: `Marketing Docs.dc.html` (shows the Quickstart article as the representative layout)
Reference screenshot (in `screenshots/`): `07-docs-mockup.png` (mockup only — no current-UI screenshot exists because the page is unbuilt)

---

## Page structure

1. Docs-specific slim nav (58px) — different from marketing nav
2. Three-column layout: `grid-template-columns:260px 1fr 220px` — nav tree · article · "on this page"

## 1. Docs nav (lines 28–37)

```html
<div style="height:58px;display:flex;align-items:center;gap:20px;padding:0 32px;border-bottom:1px solid #e4e8ef">
  <!-- logo mark 22px + wordmark: Analyt<span style="color:#2563eb">IQ</span> <span style="font-weight:500;color:#94a3b8">Docs</span> -->
  <div style="width:380px;height:34px;display:flex;align-items:center;gap:9px;padding:0 13px;border:1px solid #d4d9e1;border-radius:8px;color:#94a3b8;font-size:12.5px"><!-- magnifier -->Search docs…<span style="margin-left:auto;font-family:'IBM Plex Mono',monospace;font-size:10px;border:1px solid #e4e8ef;border-radius:5px;padding:1px 6px">⌘K</span></div>
  <!-- right: "analytiq.app ↗" link + "Start free" button (34px, #2563eb) -->
</div>
```

## 2. Left nav tree (lines 41–56)

`background:#fbfcfd;border-right:1px solid #e4e8ef;padding:24px 18px`. Mono section labels 9.5px letterspaced `#94a3b8`; items 12.5px `#47516b`, hover `background:#f1f4f9`. Active item:
```html
<span style="padding:7px 12px;border-radius:7px;background:#e8effc;color:#1d4ed8;font-size:12.5px;font-weight:600">Quickstart</span>
```
Tree: **GET STARTED** — Quickstart (active) · Connect Snowflake · Upload CSV / XLSX · Build your first dashboard · Share a dashboard. **CONCEPTS** — Health scores · Semantic layer · Gold tables & contracts · Predictive model basics. **ADMINISTRATION** — Roles & permissions · Security guide · Tokens & billing.

## 3. Article column (lines 60–88)

`padding:36px 56px;max-width:820px`. Breadcrumb mono 10px `#94a3b8`: `DOCS / GET STARTED / QUICKSTART`.

```html
<h1 style="margin:0;font-size:30px;font-weight:700;letter-spacing:-.02em;color:#0f172a">Quickstart: question → dashboard in 4 minutes</h1>
```
Intro paragraph 14.5px/1.7 `#334155`. Section H2s 19px/600 with anchor ids: "1 · Pick your data", "2 · Ask a question", "3 · Approve the plan", "4 · Refine and share".

Key components:
- **Dark terminal block** (§1):
```html
<div style="background:#0b1220;border-radius:10px;padding:14px 16px;font-family:'IBM Plex Mono',monospace;font-size:11px;line-height:1.75;color:#93c5fd">✓ 8 tables profiled · health 94/100<br>✓ 2 PII columns masked pending review<br>→ safe to analyze</div>
```
- **Inline code chip** (§2): `font-family:'IBM Plex Mono';font-size:12.5px;background:#f1f5f9;border-radius:5px;padding:2px 7px`
- **Amber note callout** (§3):
```html
<div style="border:1px solid #f2ddb0;background:#fdf9ef;border-radius:10px;padding:12px 16px;display:flex;gap:10px">
  <!-- warning triangle svg #b45309 -->
  <span style="font-size:13px;line-height:1.6;color:#7a4a10"><strong style="font-weight:600">Note:</strong> masked PII columns are excluded automatically...</span>
</div>
```
- **Button pair** (§4): "Open the workbench" (filled 38px `#2563eb`) + "Security model" (outlined `#d4d9e1`)
- **Article footer** (border-top `#eef1f5`): left "Was this helpful? Yes · No" (links `#2563eb`), right "Next: Connect Snowflake →"

## 4. "On this page" rail (lines 92–98)

`border-left:1px solid #e4e8ef;padding:36px 22px`. Mono label `ON THIS PAGE`. Active item has blue left rule:
```html
<a href="#d-connect" style="font-size:12px;color:#1d4ed8;font-weight:600;text-decoration:none;border-left:2px solid #2563eb;padding-left:10px">Pick your data</a>
<!-- inactive: color:#64748b; border-left:2px solid transparent -->
```
Items: Pick your data · Ask a question · Approve the plan · Refine and share.


---

<!-- ============ CHAPTER: 08 - Auth Flow Diff.md ============ -->

# 08 — Auth Flow: Mockup vs Current UI

Mockup source: `Auth.dc.html` (line numbers reference that file) — **8 screens**
Reference screenshots (in `screenshots/`): `08-auth-mockup-1.png` (Login, Register 1/3/4, Forgot password, Verify email), `08-auth-mockup-2.png` (SSO callback ×2), `08-auth-current-signin.png`, `08-auth-current-register.png`
Status: **6 of 8 mockup screens missing entirely.** The 2 that exist (Sign in, Create account) are architecturally wrong — rendered inside the app shell instead of as standalone pages — and leak internal implementation details into user-facing copy.

---

## ⚠️ Critical architectural problems in the current build

1. **Auth renders INSIDE the logged-in app shell.** Current Sign in / Create account pages show the full sidebar (Home, Create, Artifacts, Data…), the workspace switcher ("Acme Retail"), search bar, notifications, and a logged-in avatar ("DK") — all while the user is *not authenticated*. Breadcrumb even reads `acme-retail / settings / profile`. Mockup: every auth screen is a standalone centered card on `#f2f4f8` with a blue radial glow and the logo centered at top. Nothing else.
2. **Internal implementation copy is user-visible:** "Local fallback auth — PBKDF2 passwords, 24h bearer tokens." Never show this. Mockup subcopy: "Welcome back to your workspace."
3. **Debug panel exposed:** an "Agent memory" card ("Nothing remembered yet", "§17.3.1") sits under both auth forms. Not in any mockup auth screen — remove.
4. **Role is a raw dropdown ("analyst")** on register. Mockup collects role in step 3 via 4 selectable cards — and it's a separate wizard step, not a form field.

## Mockup screen inventory vs current

| # | Mockup screen | Route | Current status |
|---|---|---|---|
| 1 | Login | /login | ⚠️ Exists but wrong (in-app shell, no SSO/magic link/forgot) |
| 2 | Register step 1 (account) | /register | ⚠️ Exists but wrong (single flat form, no wizard) |
| 3 | Register step 3 (role cards) | /register | ❌ MISSING (dropdown instead) |
| 4 | Register step 4 (invite + first path) | /register | ❌ MISSING |
| 5 | Forgot password (form + sent) | /forgot-password | ❌ MISSING |
| 6 | Email verification | /verify-email | ❌ MISSING |
| 7 | SSO callback — signing in | /sso/callback | ❌ MISSING |
| 8 | SSO callback — no workspace access | /sso/callback | ❌ MISSING |

## 0. Shared standalone auth shell (all screens)

```html
<div style="background:#f2f4f8;position:relative;display:flex;align-items:center;justify-content:center">
  <div style="position:absolute;inset:0;background:radial-gradient(420px 260px at 50% 0%, rgba(37,99,235,.08), transparent 70%)"></div>
  <!-- logo centered, top:26px: 22px mark svg + Analyt<span style="color:#2563eb">IQ</span> -->
  <div style="position:relative;width:420px;background:#fff;border:1px solid #e4e8ef;border-radius:14px;box-shadow:0 12px 40px rgba(15,23,42,.08);padding:32px;display:flex;flex-direction:column;gap:18px">
```
Input pattern (all forms — current UI uses mono placeholder-only fields; mockup uses labeled fields):
```html
<label style="font-size:12px;font-weight:600;color:#334155">Email</label>
<input style="height:38px;border:1px solid #d4d9e1;border-radius:8px;padding:0 12px;font-family:'IBM Plex Sans',sans-serif;font-size:13.5px;color:#0f172a;outline:none" style-focus="border-color:#2563eb;box-shadow:0 0 0 3px rgba(37,99,235,.12)">
```

## 1. Login /login (lines 27–64)

Card contents in order: H1 "Log in" 20px/600 + "Welcome back to your workspace."; Email field; Password field with right-aligned "Forgot password?" link; primary button "Log in" (40px `#2563eb` radius 9); **OR divider** (mono 10px); **three SSO buttons** (38px outlined, brand SVGs): Continue with Google · Continue with Microsoft · Enterprise SSO; **magic-link box**:
```html
<div style="display:flex;align-items:center;justify-content:center;gap:8px;padding:10px;border:1px dashed #d4d9e1;border-radius:9px;background:#fafbfc">
  <span style="font-size:12.5px;color:#64748b">Prefer a magic link?</span><span style="font-size:12.5px;font-weight:600;color:#2563eb;cursor:pointer">Email me a link</span>
</div>
```
Bottom of page (outside card): "Create account · Privacy & security" links.
Current UI missing: SSO buttons, magic link, forgot-password link, field labels, subcopy, standalone layout. Button says "Sign in" — mockup says "Log in".

## 2. Register wizard — 4 steps with stepper (lines 66–213)

Stepper (top of card): 24px circles joined by 2px lines. Active = blue fill + label; done = green check on `#e8f5ec`; upcoming = outlined `#d4d9e1`:
```html
<span style="width:24px;height:24px;border-radius:50%;background:#2563eb;color:#fff;...">1</span><span style="font-size:12px;font-weight:600;color:#0f172a">Account</span>
<span style="flex:1;height:2px;background:#eef1f5"></span>
<!-- done: background:#e8f5ec;color:#15803d; content ✓; connector background:#15803d;opacity:.25 -->
```

**Step 1 — Account:** H1 "Create your account" + "Free 14-day trial. No credit card required." Fields: Full name / Work email / Password (12+ characters) with **4-segment strength meter** (`height:3px`, filled `#15803d`, empty `#e4e8ef`). Footer: "Back to log in" + "Continue →" button.

**Step 3 — Role (labeled "Role"):** H1 "What best describes you?" + "We'll tune defaults and permissions to fit." 2×2 grid of cards; selected = `border:2px solid #2563eb;background:#f8faff` + blue check badge top-right:
```html
<div style="border:2px solid #2563eb;border-radius:11px;padding:16px;background:#f8faff;position:relative">
  <span style="position:absolute;top:10px;right:10px;width:18px;height:18px;border-radius:50%;background:#2563eb;color:#fff;...">✓</span>
  <!-- icon svg 18px --><span style="font-size:13.5px;font-weight:600;color:#0f172a">Business User</span>
  <span style="font-size:11.5px;line-height:1.45;color:#64748b">I ask questions and consume dashboards</span>
</div>
```
Cards: Business User · Analyst ("I build and refine analyses for others") · Data Admin ("I manage sources, governance and access") · Executive ("I want answers and alerts, not tooling"). Footer: "← Back" + "Continue →".

**Step 4 — Kickoff:** "Invite teammates (optional)" — chip input with email pills (`background:#eff4ff;color:#1d4ed8;` mono 11px, ✕ to remove, "Add email…" ghost). "Choose your first path" — 3 selectable rows (34px icon chip + title + subtitle; selected = 2px blue border + check): **Start with sample data** ("Retail dataset preloaded — build in 60 seconds") · **Connect a warehouse** ("Snowflake, BigQuery, Databricks, Redshift…") · **Upload a file** ("CSV, XLSX or Parquet — profiled on upload"). Footer: "← Back" + "Create workspace →".

## 3. Forgot password /forgot-password (lines 215–239) — MISSING

Two states. Form card (300px): H2 "Reset password" + "We'll email you a reset link." + Email field + "Send reset link" button + "← Back to log in". Sent card: 46px green check circle (`#e8f5ec`/`#15803d`), H2 "Check your email", body "If `dana@acmeretail.com` has an account, a reset link is on its way. It expires in 30 minutes.", "Resend email" link.

## 4. Email verification /verify-email (lines 241–257) — MISSING

400px centered card: 64px blue envelope icon tile (`#eff4ff`, radius 18) with green check badge overlapping bottom-right; H1 "Verify your email"; "We sent a verification link to `dana@acmeretail.com`" (email in mono); "Didn't get it? Check spam, or" + "Resend email" link.

## 5. SSO callback /sso/callback (lines 259–287) — MISSING (2 states)

**Signing in:** 360px card, 44px SVG spinner (blue arc on `#eef1f5` track), H1 "Signing you in…" 17px, mono caption `okta · acme-retail.okta.com`.

**No workspace access (error):** page glow switches to red `rgba(220,38,38,.05)`. 56px red alert tile (`#fdeaea`, radius 16); H1 "No workspace access"; body "Your identity was verified, but `jon@acmeretail.com` hasn't been added to any AnalytIQ workspace yet."; "Contact your admin" button; mono footnote "Other states: organization not enabled · session expired".

---

## Priority order

1. Move auth OUT of the app shell → standalone centered-card pages (no sidebar/topbar/avatar pre-login).
2. Remove internal copy ("PBKDF2…", "Agent memory" panel) from auth screens.
3. Rebuild Login with labels, forgot-password link, SSO buttons, magic link.
4. Rebuild Register as the 4-step wizard (account → … → role cards → invite + first path).
5. Add forgot-password, verify-email, and both SSO callback screens.


---

<!-- ============ CHAPTER: 09 - Onboarding Flow (MISSING ENTIRELY).md ============ -->

# 09 — Onboarding Flow (/onboarding/*): ❌ ALL 4 SCREENS MISSING ENTIRELY

**Status: No onboarding exists in the current build (user-confirmed). All four screens must be built from scratch.**
Mockup source: `Onboarding.dc.html` (line numbers reference that file)
Reference screenshots (in `screenshots/`): `09-onboarding-mockup-1.png` (Workspace Setup + Choose Starting Mode), `09-onboarding-mockup-2.png` (Dataset Health + Template Picker). No current-UI screenshots — nothing exists.

Flow order: Register step 4 → **Workspace Setup wizard** → **Choose Starting Mode** → **Dataset Health Preview** → **Template Picker** → Workspace Home.

---

## Screen 1 — Workspace Setup Wizard, branding step (/onboarding/workspace, lines 25–110)

Standalone centered card (same auth shell: `#f2f4f8` bg, radial glow, centered logo). Card 760px, `padding:30px 34px`.

**Progress header** (5-step wizard; mockup shows step 5):
```html
<div style="display:flex;justify-content:space-between;font-family:'IBM Plex Mono',monospace;font-size:10.5px;color:#94a3b8"><span>WORKSPACE SETUP</span><span>STEP 5 / 5 · BRANDING</span></div>
<div style="height:5px;border-radius:999px;background:#eef1f5;overflow:hidden"><span style="display:block;width:92%;height:100%;background:#2563eb;border-radius:999px"></span></div>
```
H1 "Make it yours" 20px/600 + "Branding applies to dashboards, share pages and email digests. You can change it anytime."

**Left column (form):**
- Logo dropzone: `border:1.5px dashed #c7d9f8;background:#f8faff;border-radius:10px` with 38px purple avatar tile "AR", filename "acme-mark.svg", mono caption "4.2 KB · drop to replace".
- Accent color swatches: 30px rounded squares — `#7c3aed` (selected: `border:2px solid #fff;outline:2px solid #7c3aed`), `#2563eb`, `#0e7490`, `#15803d`, `#b45309`, `#0f172a`, plus dashed "+" custom swatch.
- Font select (38px, "IBM Plex Sans"), then Timezone ("PT (UTC−8)") + Currency ("USD $") side by side.

**Right column — live preview** (rebrands in real time with chosen accent): mini dashboard with header (22px "AR" tile + "Acme Retail Analytics" + purple Share button), 3 KPI tiles (REVENUE $1.92M / ORDERS 48.1K / AOV $39.90, mono), purple area chart (`stroke:#7c3aed; fill:rgba(124,58,237,.1)`), caption `applies to: dashboards · share pages · email digests`.

**Footer:** "← Back" left; "Skip for now" (`#94a3b8`) + "Finish setup →" (filled 38px) right.

## Screen 2 — Choose Starting Mode (/onboarding/start, lines 112–155)

Centered page: H1 "Where's your data?" 24px/600 + "Pick a starting point — you can add more sources later." Then **5 cards** in a row (`repeat(5,188px); gap:14px`), each: 36px icon chip + title 14px/600 + subtitle 11.5px.

Selected card (Use sample data) has 2px blue border, glow, and a FASTEST pill:
```html
<a style="background:#fff;border:2px solid #2563eb;border-radius:12px;padding:20px 16px;box-shadow:0 8px 24px rgba(37,99,235,.1);position:relative">
  <span style="position:absolute;top:10px;right:10px;font-family:'IBM Plex Mono',monospace;font-size:8.5px;font-weight:600;letter-spacing:.06em;color:#15803d;background:#e8f5ec;border-radius:999px;padding:2px 7px">FASTEST</span>
```
Cards: **Use sample data** ("Retail dataset, preloaded and profiled") · **Upload a file** ("CSV, XLSX, Parquet — typed & profiled") · **Connect warehouse** ("Snowflake, BigQuery, Databricks, Redshift") · **Import dbt project** ("Models & tests become semantic candidates") · **REST API / Webhook** ("Poll an endpoint or receive pushed events").

Footer caption (mono 10.5px `#94a3b8`): `All connections are read-only · credentials encrypted at rest`.

## Screen 3 — First Dataset Health Preview (/onboarding/source-health, lines 157–203)

Full-width layout with slim top bar: logo + mono `onboarding · 2 of 3` + right "Exit setup" link.

H1: `Here's what we found in <span mono #2563eb>sample_retail</span>` + "Profiled automatically — nothing was moved or modified. Connections stay read-only."

**Green "Safe to analyze" banner:**
```html
<div style="display:flex;align-items:center;gap:14px;background:#e8f5ec;border:1px solid #b7e0c3;border-radius:10px;padding:14px 18px">
  <!-- 34px green check circle #15803d -->
  <span style="font-size:14.5px;font-weight:600;color:#14532d">Safe to analyze</span>
  <span style="font-size:12.5px;color:#3f6212">8 tables passed validation gates. 2 columns flagged for PII review — they'll be masked until a steward approves.</span>
  <span style="margin-left:auto;font-family:'IBM Plex Mono',monospace;font-size:10.5px;color:#15803d;background:#fff;border:1px solid #b7e0c3;border-radius:999px;padding:4px 10px">HEALTH 94/100</span>
</div>
```

**4 KPI cards** (mono label 9.5px / value 24px / caption 11.5px): TABLES FOUND 8 (2.4M rows total) · HEALTH SCORE 94 green (all gates passed) · PII WARNINGS 2 amber `#b45309` (masked pending review) · FRESHNESS daily (last load 03:00 PT).

**Table** (grid `2.2fr 1fr 1fr 1fr 1.3fr`, header 38px on `#fafbfc`, rows 44px, mono values): orders 1,204,318/24/0.4% HEALTHY · order_items 3,891,442/11/0.1% HEALTHY · customers 412,806/18/1.2% **PII · 2 COLS** (amber pill `#fdf3e3`/`#b45309`) · products 8,912/15/0.0% HEALTHY · stores 42/12/0.0% HEALTHY · inventory_snapshots 988,204/9/2.8% **NULL SPIKE** (amber). Status pill pattern:
```html
<span style="display:inline-flex;align-items:center;gap:5px;height:20px;padding:0 8px;border-radius:999px;background:#e8f5ec;color:#15803d;font-family:'IBM Plex Mono',monospace;font-size:9.5px;font-weight:600;letter-spacing:.04em"><span style="width:5px;height:5px;border-radius:50%;background:#15803d"></span>HEALTHY</span>
```

**Sticky footer bar** (64px, white, top border): mono `profiling completed in 6.2s` left, "Continue →" button right.

## Screen 4 — First Dashboard Template Picker (/onboarding/templates, lines 205–255)

Centered page: H1 "Recommended for your data" + "Based on the tables and columns we profiled in `sample_retail`."

**3 recommendation cards** (`repeat(3,270px)`), each: preview strip on `#f7f8fa` (skeleton KPI bars + SVG chart), title, data-aware rationale, and a match pill:
```html
<span style="font-family:'IBM Plex Mono',monospace;font-size:9.5px;color:#15803d;background:#e8f5ec;border-radius:999px;padding:3px 8px;align-self:flex-start">BEST MATCH · orders, order_items</span>
```
Cards: **Revenue Trend + Forecast** ("You have transaction dates + revenue — try an 8-week forecast." — BEST MATCH green) · **Location Performance** ("42 stores detected — rank against targets and flag laggards." — MATCH · stores, orders, blue `#eff4ff`/`#1d4ed8`) · **Inventory Demand Watch** ("Daily snapshots found — monitor stockout risk by warehouse." — MATCH · inventory_snapshots, blue).

Below grid: "Skip — start from scratch with a blank prompt →" (13px `#64748b`, links to Create Workbench).


---

<!-- ============ CHAPTER: 10 - App Home & Activity Diff.md ============ -->

# 10 — App Home, Activity & Notifications: Mockup vs Current UI

Mockup source: `App Home.dc.html` (line numbers reference that file) — 3 screens: Workspace Home /app, Recent Activity /app/activity, Notifications drawer /app/notifications
Reference screenshots (in `screenshots/`): `10-home-mockup-1.png` (Home + Activity), `10-home-mockup-2.png` (Notifications drawer), `10-home-current.png`, `10-home-current-notifications.png`
Status: **Home is the closest match so far** — layout, sidebar, and widget grid are structurally right. But the **Recent Activity page (/app/activity) is MISSING ENTIRELY (user-confirmed)**, and there is **no link to it anywhere**. Notifications drawer exists but is missing several patterns.

---

## ❌ Recent Activity page (/app/activity) — MISSING ENTIRELY (lines 248–368)

Full app-shell page, content column `max-width:1000px`. Must be built:

**Header:** breadcrumb mono `acme-retail / activity` + H1 "Recent activity" (21px/600).

**Filter row:** pill tabs (All active dark, then Builds · Governance · Data · Sharing) + right-aligned date-range picker:
```html
<span style="display:inline-flex;align-items:center;height:30px;padding:0 13px;border-radius:999px;background:#0f172a;color:#fff;font-size:12.5px;font-weight:600">All</span>
<span style="...border:1px solid #d4d9e1;background:#fff;color:#47516b;font-weight:500">Builds</span>
<span style="margin-left:auto;...font-family:'IBM Plex Mono',monospace;font-size:11px">Jun 26 → Jul 3 ▾</span>
```

**Timeline card** (white, `padding:6px 22px`): each row = icon tile (28px, tinted per event type) with a 1px vertical connector line below it, rich text, mono metadata line, mono timestamp, 26px actor avatar:
```html
<div style="display:flex;gap:14px;padding:15px 0;border-bottom:1px solid #eef1f5">
  <div style="display:flex;flex-direction:column;align-items:center">
    <span style="width:28px;height:28px;border-radius:8px;background:#eff4ff;..."><!-- event icon --></span>
    <span style="flex:1;width:1px;background:#eef1f5;margin-top:6px"></span>
  </div>
  <div style="flex:1;display:flex;flex-direction:column;gap:3px">
    <span style="font-size:13px;color:#334155"><strong style="color:#0f172a;font-weight:600">Dana Kim</strong> built <a style="color:#2563eb;font-weight:500">Q3 Revenue Forecast</a> from a prompt</span>
    <span style="font-family:'IBM Plex Mono',monospace;font-size:10.5px;color:#94a3b8">pipeline 9/9 stages passed · model v2 promoted</span>
  </div>
  <span style="font-family:'IBM Plex Mono',monospace;font-size:10.5px;color:#94a3b8">09:12</span>
  <span style="width:26px;height:26px;border-radius:50%;background:#0e7490;color:#fff;font-size:9.5px;font-weight:700">DK</span>
</div>
```
Event types shown (icon tint / avatar): build `#eff4ff` blue / user · governance approval `#f3eefe` purple / user · alert fired `#fdeaea` red / red "!" · share `#e0f3f8` teal / user · schema drift `#fdf3e3` amber / gray "SYS" · model retrain `#e8f5ec` green / "SYS". Footer: centered "Load more" outlined button (34px).

### ➕ REQUIRED ADDITION: link Activity from Home
The current Home has no route to the activity page (and neither does the mockup's home explicitly — add one). Recommended: a "View all activity →" link in the Home header row, next to the date stamp, styled like the other widget header links:
```html
<a href="/app/activity" style="font-size:12px;font-weight:600;color:#2563eb;text-decoration:none">View all activity →</a>
```
Alternative/additional placement: a link at the bottom of the Notifications drawer ("View all activity →") since notifications and activity overlap. At minimum one discoverable entry point must exist.

## ✅ Workspace Home /app — close match, remaining deltas (lines 24–246)

Structure, sidebar (Home/Create/Artifacts · DATA · INTELLIGENCE · Team/Admin/Billing/Settings/Collapse), topbar, hero input, and 3-column widget grid all match. Remaining gaps:

1. **Notification bell shows a red "0" badge.** Badge must be hidden when count is 0 (mockup badge pattern only renders with unread > 0): `min-width:15px;height:15px;background:#dc2626;...;border:2px solid #fff`.
2. **Data health panel values aren't color-coded.** Mockup: healthy values green `#15803d`, problem values amber `#b45309`, all mono-font (`Sources healthy 11/12` green, `Schema drift 1 table` amber, `PII flags 2 open` amber). Current shows plain dark text. Ring color should also track score (current shows green at 76; mockup ring at 92 uses `stroke:#15803d` — define thresholds, e.g. amber < 85).
3. **Awaiting review widget:** mockup has a large amber count (`font-size:18px;color:#b45309`) in the header, colored dot bullets per item (`#7c3aed` DEF, `#dc2626` PII, `#b45309` DRIFT), mono type tags right-aligned, and the "Open review queue →" link at the BOTTOM (current puts it in the header, no count, no dots).
4. **Recently viewed rows lack mini chart thumbnails** — mockup prefixes each row with a 34×16 inline SVG sparkline/bar/donut.
5. **Usage & cost:** mockup shows a w/w delta in green mono (`−8% w/w`) and a 7-bar mini bar chart SVG under the number. Current has neither (text "0.74% of plan" is fine to keep as caption).
6. **Recent artifact cards:** mockup previews include skeleton KPI-bar rows above varied chart types (line/bars/donut); current shows three identical line charts. Also card timestamps mono 9.5px.
7. **Empty states** (current: "No runs in flight", "Quiet — nothing firing", "Suggestions appear as the platform learns your data") — not defined in mockup; keep, but style captions as 12.5px `#64748b`.

## ⚠️ Notifications drawer — exists, missing patterns (lines 370–440)

Current has header (Mark all read, ✕) and All/Unread/Mentions pills. Missing:

1. **Background scrim:** mockup dims the app behind the drawer: `background:rgba(15,23,42,.28)`. Current shows no dimming.
2. **Drawer spec:** width 420px, `border-left:1px solid #e4e8ef; box-shadow:-16px 0 48px rgba(15,23,42,.18)`.
3. **Date group headers:** mono letterspaced `TODAY / YESTERDAY / EARLIER` (9.5px `#94a3b8`).
4. **Unread row treatment:** `background:#f8faff;border-left:2px solid #2563eb` + blue dot (7px) at right.
5. **Row anatomy:** 28px tinted icon tile per type (alert red, mention teal "@", build-success green check, governance purple shield, freshness amber clock, team blue person, models green trend) + body 12.5px + mono caption (`12m ago · Daily revenue guard`).
6. **Unread pill count styling:** count in red mono inside the pill (`font-size:9.5px;color:#dc2626`), only shown when > 0 — current shows "Unread · 0".
7. Empty state "Nothing yet" is fine; consider adding "View all activity →" footer link (see Activity section).


---

<!-- ============ CHAPTER: 11 - Create Workbench Diff.md ============ -->

# 11 — Create Workbench (/app/create): Mockup vs Current UI

Mockup source: `Create Workbench.dc.html` (line numbers reference that file) — one screen, **5 interactive states**: 1 Prompt → 2 Clarify → 3 Plan → 4 Building → 5 Canvas
Reference screenshots (in `screenshots/`): `11-create-mockup-prompt.png`, `11-create-mockup-building.png`, `11-create-mockup-canvas.png`, `11-create-current-prompt.png`, `11-create-current-canvas.png`
Status: The skeleton of the loop EXISTS (prompt → plan → build → dashboard, chat column, inspector tabs) but nearly every surface is a rough draft of the mockup: Clarify state absent, Building state has no live event log/PII banner/run metadata, Canvas lacks the toolbar/filters/formatting/tables/narrative, and the inspector shows raw debug values instead of editing controls.

---

## ✅ KEEP (intentional deviation from mockup, per Leo)

**The collapsed icon-only sidebar in the current workbench stays.** The mockup removes the sidebar entirely inside the workbench; the current build collapses it to icons — this is the preferred behavior. Everything else below should move toward the mockup.

Also already present and roughly right: chat column with user bubble + plan card + Approve & Build, GOVERNED pill, autosaved stamp, stage pills that complete green, KPI card row, CONTRACT ✓ pills on sections, inspector tab strip, "Why this chart?" explainer.

---

## 1. Session topbar — PARTIAL (lines 48–64)

Current: keeps the workspace topbar (search bar) and pushes GOVERNED/autosaved/"Open artifact ↗" into the canvas header.
Mockup: dedicated 56px session topbar:
```html
<span style="font-size:13.5px;font-weight:600;color:#0f172a">Q3 revenue target risk</span>
<span style="font-family:'IBM Plex Mono',monospace;font-size:9.5px;color:#94a3b8">session · a4f2-9c · sample_retail + q3_targets.xlsx</span>
<span style="...background:#e8f5ec;color:#15803d">● GOVERNED</span>
<!-- right: "autosaved 12s ago" mono · Versions (outlined 32px) · Share (filled #2563eb) · avatar -->
```
Missing in current: **session title + mono session metadata**, **Versions button**, **Share button** (mockup has both at top right of every state).

## 2. State 2 · Clarify — MISSING ENTIRELY (lines 84–106)

Current flow jumps straight from prompt to "PROPOSED PLAN". Mockup inserts one clarifying question with tappable chips before the plan:
```html
<span style="font-size:13px;color:#0f172a">How should I define <strong>"miss the target"</strong>? This changes which locations get flagged.</span>
<span style="font-family:'IBM Plex Mono',monospace;font-size:9.5px;color:#94a3b8">● confidence 0.62 — worth confirming</span>
<!-- chips: "Any amount below" · ">5% below" · ">10% below" (blue outlined 27px) · "Not sure" (dashed) · "Use recommended" (filled #2563eb) -->
```
Also missing: mono status lines under the user bubble (`✓ matched 2 sources · orders, q3_targets.xlsx` / `✓ resolved metric · net_revenue v4 (governed)`, 10.5px, checks `#15803d`) and the center-canvas dashed skeleton with "Your dashboard will assemble here once the plan is approved" (lines 222–233).

## 3. State 3 · Plan card — PARTIAL (lines 108–136)

Current has GOAL/METRIC/GRAIN/TIME RANGE/OUTPUT/HORIZON/ACCESS + Approve & Build. Gaps vs mockup:

- Header should be **"Review your plan"** on `#f8faff` with blue card border `#c7d9f8` (current: "PROPOSED PLAN" plain label), gaining a `✓ APPROVED` pill after approval (current shows separate chat bubbles "Plan approved…" / "DONE Build complete" — keep, but add the pill).
- Missing rows: **DIMENSIONS** (`location, region, week`), **FORECAST** (`8-week horizon · backtested`), **SOURCES** (`sample_retail (5 tables) · q3_targets.xlsx`).
- **Every row gets an ✎ edit affordance** (`color:#94a3b8;cursor:pointer`) — current rows are static.
- METRICS values render as mono blue chips: `<span style="font-family:'IBM Plex Mono',monospace;font-size:11px;color:#1d4ed8">net_revenue</span>`.
- Footer: Approve & Build (filled) + **Edit plan** (outlined) + **Cancel** (right-aligned gray) — current has only Approve & Build.
- ACCESS copy: mockup "2 PII columns excluded (masked)" pattern; current "No PII restrictions apply to this plan" is fine when true.

## 4. State 4 · Building — PARTIAL, most substance missing (lines 235–276)

Current: stage pills only. Mockup adds, in order:

1. **Header block**: "Building your dashboard" (16px/600) + mono run metadata `run · 8842 · started 09:40:12 · elapsed 01:47`, and right-aligned **`▶ SKIP TO RESULT`** pill (`border:1px solid #c7d9f8;background:#f8faff;color:#1d4ed8;mono 10.5px`).
2. **Stage pills — states and stages differ.** Mockup has 9 stages (Understanding request · Validating metrics · Planning dashboard · Building data · Running queries · Generating charts · Training model · Reviewing output · Assembling dashboard) with THREE visual states: done green (`background:#e8f5ec;border:1px solid #b7e0c3;color:#15803d` + ✓), **active blue with SVG spinner** (`background:#eff4ff;border:#c7d9f8;color:#1d4ed8`), pending gray (`background:#fff;border:#e4e8ef;color:#94a3b8`). Current has 7 different stage names, all-done-green only, with a lightning glyph. Align names + add active/pending states.
3. **Amber PII banner** (current has it? — screenshot shows it in mockup only; if data has masked columns show):
```html
<div style="display:flex;align-items:center;gap:11px;background:#fdf3e3;border:1px solid #f2ddb0;border-radius:9px;padding:11px 14px">
  <!-- warning svg #b45309 --><span style="font-size:12.5px;color:#7a4a10"><strong>2 columns masked.</strong> customers.email and customers.zip4 are excluded pending PII review — results are unaffected.</span>
</div>
```
4. **Live event log card — MISSING** (lines 260–274): header "Live event log" + mono "friendly view"; timestamped rows (mono 10.5px time gutter, 56px wide), human copy with mono inline identifiers (`GOLD.REV_LOC_WK_V1`, `q3_targets.xlsx`, `LightGBM (MAPE 4.1%)`); current/latest row in blue with blinking `▌`; footer collapsible **"Show technical detail (admin)"**.
5. Chat column simultaneously streams mono checkmarks: `✓ plan approved · pipeline started` / `✓ gold table · GOLD.REV_LOC_WK_V1` / `✓ 6 queries validated · read-only · 412ms` / `● training forecast model · window 3/5▌`.

## 5. State 5 · Canvas — PARTIAL, heavy gaps (lines 278–379)

Current has: KPI row, one line chart with CONTRACT ✓, second collapsed section. Missing/wrong:

1. **Canvas toolbar (44px) — MISSING**: zoom `− 100% +`, fit, present ▶, device toggle (desktop/tablet/mobile segmented control, active dark), refresh, export, download, share, comment, lineage, audit-log icons; right side mono `v14 · saved` + **stacked collaborator avatars** (22px, overlapping −7px, 2px white borders).
2. **Filters bar (40px) — MISSING**: mono `FILTERS` label + removable blue chips + dashed add:
```html
<span style="display:inline-flex;align-items:center;gap:6px;height:24px;padding:0 10px;border-radius:999px;background:#eff4ff;border:1px solid #c7d9f8;color:#1d4ed8;font-family:'IBM Plex Mono',monospace;font-size:10.5px">Q3 2026<span style="color:#94a3b8;cursor:pointer">✕</span></span>
<span style="...border:1px dashed #d4d9e1;color:#64748b">+ Add filter</span>
```
3. **Data formatting is raw.** Current: "TOTAL (WINDOW) 46,139", "Timeseries Ci", "dimension_breakdown". Mockup: human titles ("Revenue vs target · weekly, all locations") and formatted values (`$4.82M`, `−6.2% vs target` in red `#dc2626`, `7 / 42` amber, `4.1%` green). KPI card pattern: mono label 9px letterspaced → mono 22px value → mono 10.5px colored delta caption. **Section titles must never leak snake_case.**
4. **KPI semantics**: mockup 4 cards each carry a colored context line (red/amber/green/gray). Current cards have value only.
5. **Main chart anatomy**: y-axis mono labels, gridlines, actual (solid `#2563eb` 2.5px) vs forecast (dashed) vs target (gray dashed), CI polygon `rgba(37,99,235,.08)`, "today" divider line + label, legend row (`— actual · -- forecast ±CI · -- target`).
6. **Section selection pattern — MISSING**: selected card gets `border:2px solid #2563eb;box-shadow:0 8px 24px rgba(37,99,235,.13)` + mono "selected" tag + dashed-underline editable title + **floating dark toolbar** hovering above (lines 333–340): `background:#0f172a;border-radius:8px` with Rename · Bar ▾ · Top 8 −/+ · vs target ● · Week ▾ · ⠿ drag handle.
7. **At-risk locations table — MISSING** (lines 352–360): header row mono letterspaced on `#fafbfc`; rows 38px with mono numerics; GAP column colored (`−11.8%` red / `−7.4%` amber); RISK pills HIGH (`#fdeaea`/`#dc2626`) / MED (`#fdf3e3`/`#b45309`); header meta "7 rows".
8. **"What's driving the forecast" — MISSING** (lines 362–371): horizontal feature bars in a blue ramp (`foot_traffic` 88% `#2563eb` → `weather_idx` 31% `#93c5fd`), mono right-aligned labels, footer link `model card · rev_loc_v2 →`.
9. **Narrative card — MISSING** (lines 372–375): title + mono "editable" dashed tag; body 12.5px with mono inline numbers and bolded region names.
10. **Diverging bar section** ("Target gap by region"): colored by severity (red/amber/blue), mono value labels signed and colored.

## 6. Inspector — WRONG CONTENT (lines 383–449)

Current tabs: Design · Data · Pipeline · Insights · Share · Vers(ions). Mockup tabs: **Design · Data · Pipeline · Lineage · Model · Comments · Share** (Design active with `border-bottom:2px solid #2563eb`). Versions belongs in the session topbar, not a tab; add Lineage/Model/Comments.

Current Design tab shows raw read-only key/values (`SECTION timeseries_ci / MARK line / FORMAT currency`) — that's debug output, not the mockup's editing panel. Required contents in order:
1. `SELECTED` mono label + chip `section_04 · bar` (`#eff4ff`/`#1d4ed8`).
2. **Title** text input (32px).
3. **Metric / Dimension** dropdowns side-by-side (mono values, metric in blue).
4. **Chart type picker**: 6 icon tiles 34px (bar/line/area/scatter/treemap/table), selected `border:2px solid #2563eb;background:#f8faff`.
5. **Time grain** dropdown + **Compare vs target** toggle (34×20 blue pill, mono green "ON").
6. Validation pills: `CONTRACT PASSED` · `SQL VALIDATED` (green mono).
7. Collapsible **"Why this chart?"** — keep current copy idea but use mockup's plain-English rationale ("Gap-to-target is a signed comparison across 5 categories — a diverging bar makes the over/under split legible at a glance."). **Remove the internal spec citation "(§5.3)" — internal references must not be user-visible.**
8. **REPLACE WITH…** suggestion cards (2-up, mini SVG preview + label: "Heatmap by state", "Table + sparklines") — current has similar cards; style per mockup (`border:1px solid #e4e8ef;border-radius:8px;padding:9px 10px`, hover blue).

## 7. Chat column polish (lines 68–174)

- Agent messages need the 24px dark logo tile beside bubbles (`border-radius:4px 13px 13px 13px`).
- Input bar: attachment chip row (`q3_targets.xlsx ✕` mono on `#f1f5f9`) + "+" button + placeholder "Ask a follow-up or refine…" + paperclip + 28px blue send square. Current placeholder "Ask a business question..." + Build button — after the first build the input becomes a refine box, per mockup.
- Done state: agent summary bubble with bold findings + follow-up chips ("Why is Northeast down?", "Add promo overlay") — current "Build complete." bubble should become this.

## 8. Prompt state (from earlier review — still applies)

Quoted-question template cards with color-coded eyebrows (FORECAST `#2563eb` · PREDICTIVE `#7c3aed` · VARIANCE `#b45309` · ANOMALY `#0e7490`), sparkle heading "Ask a question or choose a template", source selector row (`● sample_retail · snowflake` + "Use sample data" + "Pick fields visually"), SUGGESTED chips in chat column, RECENT PROMPTS list.

---

## Priority order

1. Clarify state (chips + confidence) — the "asks once instead of guessing" behavior is a headline product claim.
2. Canvas: human formatting (no snake_case titles, currency/percent values), toolbar, filters bar, selection + floating toolbar.
3. Building: live event log, run metadata, active/pending pill states, SKIP TO RESULT, PII banner.
4. Inspector: replace debug values with editing controls; fix tab set; remove §5.3 internal citation.
5. Canvas content sections: at-risk table, feature importance, narrative.
6. Plan card: missing rows, ✎ edits, Edit plan/Cancel, APPROVED pill.
7. Session topbar (title, session meta, Versions, Share). Keep collapsed sidebar.


---

<!-- ============ CHAPTER: 12 - Inspector Panels & Overlays Diff.md ============ -->

# 12 — Inspector Panels & Overlays: Mockup vs Current UI

Mockup source: `Inspector Panels.dc.html` (line numbers reference that file) — **7 panels**: Data/Trust contract · Pipeline audit · Insight panel · Share modal · Version history · Comments drawer · Inline comment popover
Reference screenshots (in `screenshots/`): `12-inspector-mockup-1.png` (Data, Pipeline, Insights, Share), `12-inspector-mockup-2.png` (Versions, Comments, Popover), `12-inspector-current-design.png`, `12-inspector-current-data.png`, `12-inspector-current-pipeline.png`, `12-inspector-current-insights.png`, `12-inspector-current-share.png`, `12-inspector-current-versions.png`
Status: All six current tabs exist but each is a raw/debug version of its mockup panel; Comments (drawer + inline popover) missing entirely; plus one reported layout bug.

---

## 🐛 BUG (user-reported): tab strip overflows the panel

The "Versions" tab renders as "Versi…" **sticking out past the panel edge**. Fixes, in combination:
1. Use the mockup tab spec — it fits 6 tabs in a 340px panel: `padding:7px 8px; font-size:11px; gap:2px`, active `font-weight:600;color:#1d4ed8;border-bottom:2px solid #2563eb`.
2. **Remove "Versions" from the tab strip entirely** — in the mockup, version history opens from the **Versions button in the session topbar** (see doc 11 §1), not an inspector tab. Mockup tab set: `Design · Data · Filters · Pipeline · Lineage · Model` (+ Comments/Share reached via toolbar icons/modal).
3. Container must apply `overflow:hidden` on the strip regardless.

## 1. Data tab (trust contracts) — restructure (lines 28–78)

Current: cards named `kpi_row` / `timeseries_ci` / `forecast` with ROWS/COLUMNS/ACTUAL/PREDICTED and a raw mono dump `GATE RESULTS data_contract:PASS…`. Mockup:

- Intro line: "Per-component trust contracts — what the data promised, and whether it delivered." (11.5px `#64748b`).
- **Accordion card per dashboard component with a HUMAN name + chart type**: "Revenue vs target · line", "Target gap by region · bar", "At-risk locations · table", "Forecast panel · model". No snake_case.
- Status pill per card: `PASSED` green / `1 WARNING` amber — the warning card also tints its header (`border:#f2ddb0; header background:#fdf9ef`):
```html
<span style="display:inline-flex;height:18px;padding:0 7px;border-radius:999px;background:#e8f5ec;color:#15803d;font-family:'IBM Plex Mono',monospace;font-size:8.5px;font-weight:600">PASSED</span>
```
- Expanded rows (label gray / value mono right): **Row count `546 (exp 500–600)`** ← show expected band, **Nulls · net_revenue `0.0%`**, **Range `$212K – $448K`**, **Freshness `3h ago · SLA 24h`** (green), **Gates `6/6 passed`** (green).
- Replace the raw `gate:PASS` dump with the per-card Gates row; keep detail behind the accordion.

## 2. Pipeline tab — restructure (lines 81–134)

Current: 4 generic step cards (`step 1 · gold_build` …) + raw PASS dump. Mockup:

- **Run header**: mono `RUN 8842 · 9 STAGES · 02:04` + green `ALL GATES ✓` pill.
- **Stage cards with status circles**: 20px round — green ✓, or amber `!` with `1 repair` count (amber mono) for repaired stages; right side mono duration (`31s`, `48s`, `6s`) + chevron.
- **Expandable stage detail** (first card expanded): rows Input / Gate result (`passed · 0 repairs` green) / Output, then a mono technical block on `#f7f8fa`:
```html
<div style="background:#f7f8fa;border:1px solid #eef1f5;border-radius:6px;padding:8px 10px;font-family:'IBM Plex Mono',monospace;font-size:9.5px;line-height:1.6;color:#64748b">metric net_revenue → SUM(oi.qty*oi.unit_price) − refunds<br>dim region → stores.region (fk stores.id)</div>
<span style="font-family:'IBM Plex Mono',monospace;font-size:9px;color:#94a3b8">technical detail · admin only</span>
```
- **"Fork from here" button** per stage (24px outlined) — missing entirely in current.
- Stage names should be the human pipeline stages (Validating metrics, Building data, Running queries, Training model, Assembling dashboard), not internal ids (`gold_build`, `walk_forward`).

## 3. Insights tab — restructure (lines 137–174)

Current: "Scan for insights" button + flat cards with mono tags (`● TREND`, `● WEEKDAY_PATTERN`). Mockup:

- Header: "Insights" + mono `auto-detected · 4` (insights arrive automatically; keep scan button if desired but not as the only path).
- Card anatomy: 24px tinted icon tile + colored mono category + **CONF pill** + rich text + **Investigate** button:
```html
<span style="width:24px;height:24px;border-radius:7px;background:#fdeaea;..."><!-- anomaly icon --></span>
<span style="font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:.06em;color:#dc2626">ANOMALY</span>
<span style="...background:#f1f5f9;color:#334155;font-size:8.5px">CONF 0.94</span>
<span style="font-size:12px;line-height:1.55;color:#334155">Boston — Newbury St revenue dropped <strong>22% w/w</strong> in week 26; no matching promo or holiday pattern.</span>
<span style="...background:#2563eb;color:#fff">Investigate</span>  <!-- top card primary; others outlined -->
```
- Categories: ANOMALY red `#dc2626`/`#fdeaea` · TREND blue `#1d4ed8`/`#eff4ff` · CORRELATION purple `#7c3aed`/`#f3eefe`. Rename `WEEKDAY_PATTERN` → human category (it's a TREND/PATTERN — no snake_case).
- Insight copy should embed bold key numbers, not one-liners.

## 4. Share — replace button with full modal (lines 176–229)

Current: a single "Create public link (7d)" button. Mockup is a 520px **modal**:

- Header: `Share "Q3 revenue target risk"` + mono `artifact · v14 · governed` + ✕.
- **VISIBILITY radio cards** (4): Private — only me / Workspace can view / Workspace can edit / **Public signed link** (selected: `border:2px solid #2563eb;background:#f8faff`, subtitle "Anyone with the token URL · workspace-scoped, revocable").
- **Token URL bar**: mono truncated `analytiq.app/share/tok_9f2ae81cc4…` + blue **Copy link**.
- **DISTRIBUTE grid** (7 tiles, 1fr ×7): Embed · HTML · PDF Export · PNG Export · Slack · Email · Link.
- **Advanced settings** (collapsible card): Expires date dropdown (`Aug 2, 2026` mono) + Scope dropdown (`Interactive`); **Password protect** toggle; checkboxes Allow comments ✓ / Allow drill-through ✓ / Allow data export ☐; red **Revoke link**.

## 5. Versions — replace raw refs with history timeline (lines 231–276)

Current tab shows internal refs (`session_spec v1 233df9cf`, `gold_predictions_ref v1 e5b2a584`…) — **internal hashes leaking to users; remove**. Mockup "Version history" panel (opens from topbar Versions button):

- Header: "Version history" + mono `14 versions`.
- Timeline rows: 26px author avatar + vertical connector; `v14 · current` (12px/600) + mono timestamp `09:41 today`; quoted change summary ("Add narrative + reallocate promo suggestion");
- **Dependency chips** per version (mono 8.5px): `sem v12` blue `#eff4ff` · `gov v8` purple `#f3eefe` · `model rev_loc_v2` teal `#e0f3f8`.
- Non-current rows show **Restore** and **Compare** buttons (24px outlined).

## 6. Comments drawer — MISSING ENTIRELY (lines 278–333)

400px drawer: header "Comments" + pill toggles `Open · 2` (dark active) / `Resolved · 5` (outlined). Thread cards:
- **Section anchor chip**: `§ Target gap by region` (mono 8.5px, `#eff4ff`/`#1d4ed8`) + resolve checkbox top-right.
- Comment rows: 24px avatar, name 12px/600 + mono relative time, body 12px.
- Nested replies indented `padding-left:33px`.
- **AI actions on threads**: `Ask AI to apply` (filled blue 25px) + `Convert to request` (outlined) — this is a signature feature.
- Composer at bottom: "Comment or @mention…" + blue send square.

## 7. Inline comment popover — MISSING ENTIRELY (lines 335–366)

Anchored to a canvas section: selected section gets blue border; a numbered **comment pin** sits on its edge:
```html
<span style="width:26px;height:26px;border-radius:50% 50% 50% 4px;background:#2563eb;border:2.5px solid #fff;box-shadow:0 4px 12px rgba(37,99,235,.4);color:#fff;font-size:10px;font-weight:700">1</span>
```
Popover below (290px, `box-shadow:0 20px 48px rgba(15,23,42,.18)`): comment row (avatar/name/time/body + resolve checkbox) and reply row (own avatar + "Reply…" input + send button).

---

## Priority order

1. Fix tab overflow bug (adopt mockup tab spec; move Versions out of the strip).
2. Kill internal leaks: snake_case component names, `gate:PASS` dumps, ref hashes.
3. Share modal (visibility, token bar, distribute grid, advanced settings).
4. Data tab trust contracts (human names, expected bands, warning states).
5. Pipeline tab (run header, repair states, expandable detail, Fork from here).
6. Comments drawer + inline pin popover (incl. "Ask AI to apply").
7. Version history timeline with dependency chips + Restore/Compare.
8. Insights cards (icons, confidence, Investigate).


---

<!-- ============ CHAPTER: 13 - Artifacts Library & Detail Diff.md ============ -->

# 13 — Artifacts Library & Detail: Mockup vs Current UI

Mockup source: `Artifacts Library.dc.html` (line numbers reference that file) — 3 screens: Library card view /app/artifacts · Table view ?view=table · Artifact Detail /app/artifacts/:id
Reference screenshots (in `screenshots/`): `13-artifacts-mockup.png` (all 3 mockup frames), `13-artifacts-current-cards.png`, `13-artifacts-current-table.png`, `13-artifacts-current-detail.png`
Status: All three surfaces exist but diverge structurally: "Cards" view renders as a list with a 14-button action row per item; the filter rail/folders are missing; the table lacks half the mockup columns; detail page has no tabs and leaks model internals onto the main view.

---

## 1. Library — card view (lines 25–189)

### Structural gaps

1. **Filter rail (220px) — MISSING**: mono `FILTERS` label + checkboxes (Created by me ✓, Shared with me, Predictive, Has warnings, Public links, Needs review) + divider + `FOLDERS` list with mono counts (Revenue 8 · Operations 5 · Customer 4 · Finance 6, active folder blue/600).
2. **"Cards" view isn't cards.** Current renders a vertical list of rows. Mockup: 3-column grid of preview cards:
```html
<a style="background:#fff;border:1px solid #e4e8ef;border-radius:11px;overflow:hidden" style-hover="border-color:#c7d9f8;box-shadow:0 10px 28px rgba(15,23,42,.08)">
  <div style="background:#f7f8fa;border-bottom:1px solid #eef1f5;padding:14px"><!-- skeleton KPI bars + chart SVG --></div>
  <div style="padding:13px 15px">
    <span style="font-size:13.5px;font-weight:600;color:#0f172a">Q3 Revenue Target Risk</span><span>⋯</span>
    <!-- pills row: type + health, right: owner avatar 20px + mono age -->
  </div>
</a>
```
3. **Per-row action-button overload.** Current shows ~14 buttons per item (Open, Preview, Insights, Link, Embed, Activity, Monitor, Opportunities, Replay, Explain, Provenance, Share, Schedule, ✕). Mockup exposes ZERO inline buttons — the whole card opens the artifact; everything else lives behind the **⋯ overflow menu**. This is the single biggest cleanup on this page.
4. **Pill system**: type pills PREDICTIVE (`#f3eefe`/`#7c3aed`) · DASHBOARD (`#eff4ff`/`#1d4ed8`) · PUBLIC LINK (`#e0f3f8`/`#0e7490`); health pills `● HEALTHY` green · `● 2 WARNINGS` amber · `● NEEDS REVIEW` red. Current has PREDICTIVE + `DQ PASS` + bare score numbers ("82") — map DQ to the health pill vocabulary and put the score in the pill (table view) or keep ● HEALTHY (cards).
5. **Dashed "new" card** at end of grid: `border:1.5px dashed #d4d9e1; + icon tile; "New dashboard from a question"` → links to workbench.
6. **Header**: mockup `Artifacts <mono>23</mono>` + breadcrumb; toolbar = inline filter input (260px, "Filter by name, tag, owner…"), Cards/Table segmented toggle (active dark `#0f172a`), single `+ New dashboard` primary button.
7. **Extra toolbar buttons not in mockup**: "ROI report", "Sandbox", "Health dashboard" — either remove or relocate (not part of this screen's design). "New analysis" → "New dashboard".
8. **Search leaks internals**: placeholder "Deep search (titles + metric names, FTS)…" in mono — replace with the standard filter input; "FTS" is implementation vocabulary. Also two stacked search inputs + two dropdowns duplicate the rail filters — collapse into rail + single filter input.
9. Header copy: "Workspace artifacts / 5 saved analyses · shareable with your team" → "Artifacts" + count per mockup.

## 2. Library — table view (lines 191–239)

Current columns: TITLE · TYPE · DQ · MAPE · OWNER(email) · CREATED(raw timestamp). Mockup columns:

```
TITLE ↓ · OWNER · TYPE · DATA HEALTH · LAST REFRESHED · SHARE · TAGS · ⋯
grid-template-columns: 2fr .9fr .9fr 1fr 1fr .9fr 1fr 44px · rows 46px · header 38px mono on #fafbfc
```
- **TITLE** sortable with blue ↓ indicator.
- **OWNER**: 22px avatar + first name (current: raw email `analyst@acme.com`).
- **TYPE**: mono lowercase colored text (`predictive` purple, `dashboard` blue, `monitor` teal).
- **DATA HEALTH**: scored pill `● 96` green / `● 81` amber / `● 64` red (thresholds by color) — current has un-scored `PASS` pill + separate bare MAPE column.
- **LAST REFRESHED**: relative mono (`2h ago`, `1d ago`) — current shows raw `2026-07-04 21:43:28` timestamps.
- **SHARE**: mono `workspace` / `private` / `public link` (teal when public) — MISSING in current.
- **TAGS**: small mono chips (`rev` `q3` on `#f1f5f9`) — MISSING in current.
- **⋯ row menu** — MISSING in current.

## 3. Artifact Detail (lines 241–307)

Current: standalone preview page (title + CENTERPIECE tag, Export, View all artifacts, 3 KPI cards, one big chart, mono internals footer). Mockup structure:

### Header block (lines 245–263)
```html
<span style="font-family:'IBM Plex Mono',monospace;font-size:10.5px;color:#94a3b8">artifacts / revenue / <span style="color:#334155">q3-revenue-target-risk</span></span>
<h1 style="margin:0;font-size:20px;font-weight:600;color:#0f172a;cursor:text" style-hover="border-color:#c7d9f8">Q3 Revenue Target Risk</h1>  <!-- editable, dashed underline on hover -->
<!-- pills: ● HEALTHY 96 (green) · PREDICTIVE (purple) · v14 (blue) -->
<div>DK avatar · Dana Kim · refreshed 2h ago · daily 06:00 PT</div>
```
Actions: **Open in workbench** · **Duplicate** · **Export** · **Share** (filled). Current has Export + "View all artifacts" only — missing Open in workbench, Duplicate, Share; missing health/version pills, owner/refresh line, breadcrumb, editable title.

### Tab strip — MISSING entirely (lines 264–273)
`Dashboard (active, blue underline) · Insights · Pipeline · Lineage · Model · Versions · Sharing · Activity` — 12.5px, `padding:9px 12px`. The current page's footer internals belong under these tabs:
- `MODEL ID xgb-locrev-v1`, `FEATURE MANIFEST 34 features` → **Model** tab
- `DQ GATE STATUS` → **Pipeline** tab
- `SOURCE LINEAGE fact_revenue x dim_loc` → **Lineage** tab
Remove the raw strip from the Dashboard tab; `fact_revenue x dim_loc` and `xgb-locrev-v1` are internals that shouldn't sit on the default view. Also remove/rename the `CENTERPIECE` tag (internal layout vocabulary).

### Dashboard tab content (lines 275–305)
4 KPI cards (mono 22px values with colored context lines) + 2-col grid: "Revenue vs target · weekly" line chart (forecast split, CI band, target dashed) and "Target gap by region" diverging bars. Current has KPI cards (good, formatted!) + one chart; add the second section and match the KPI context-line color coding.

---

## Priority order

1. Card view: replace list with 3-col card grid; collapse the 14-button row into card click + ⋯ menu.
2. Add filter rail + folders; single filter input; remove "Deep search/FTS" leak.
3. Table view: add DATA HEALTH score pills, SHARE, TAGS, relative times, avatar+name owners, sort indicator, ⋯.
4. Detail: add tab strip; move model/lineage internals off the main view; add Open in workbench/Duplicate/Share; pills + refresh line + breadcrumb.
5. Decide fate of ROI report / Sandbox / Health dashboard buttons (not in mockup).


---

<!-- ============ CHAPTER: 14 - Artifact Sharing Screens (MISSING ENTIRELY).md ============ -->

# 14 — Artifact Sharing Screens: ❌ ALL 4 MISSING ENTIRELY

**Status: None of these four screens exist in the current build (user-confirmed). Build from scratch.**
Mockup source: `Artifact Sharing.dc.html` (line numbers reference that file)
Reference screenshots (in `screenshots/`): `14-sharing-mockup-viewer.png`, `14-sharing-mockup-expired.png`, `14-sharing-mockup-present.png`, `14-sharing-mockup-embed.png`. No current-UI screenshots — nothing exists.

These are the delivery surfaces for the product's "shareable artifacts" pillar: the public viewer, its expired state, embed configuration, and present mode.

---

## Screen 1 — Public Artifact Viewer (/share/:token, lines 25–75) — NO app shell

Standalone page for external viewers. Structure top to bottom:

**Brand bar (54px):**
```html
<span style="width:24px;height:24px;border-radius:7px;background:#7c3aed;color:#fff;...">AR</span>
<span style="font-size:13.5px;font-weight:600;color:#0f172a">Acme Retail Analytics</span>
<span style="width:1px;height:20px;background:#e4e8ef"></span>
<span style="font-size:13px;color:#64748b">Ops Risk Monitor</span>
<span style="...background:#e8f5ec;color:#15803d">● DATA 3H OLD</span>
<!-- right: mono "read-only · expires Aug 2" + outlined "Request access" button (32px) -->
```
Note: uses the **workspace's branding** (purple AR tile from onboarding branding step), not AnalytIQ's.

**Viewer filter bar (42px):** mono `FILTERS` + permitted filter chips (`last 30 days ▾`, `region: all ▾` — blue tint, interactive) + right mono caption `viewer filters permitted · no editing`.

**Dashboard body** (`padding:26px 90px` on `#f4f5f8`): 3 KPI cards (OPEN RISKS 12 amber / 3 critical red · SLA COMPLIANCE 97.2% / +0.8pt m/m green · MEAN TIME TO RESOLVE 6.4h / −1.1h m/m green — mono 23px values), then grid `1.5fr 1fr`: "Risk events · daily" bar chart (blue bars with amber/red severity bars) + "Top risk sources" horizontal bars (cold chain red 82% · carrier delay amber 64% · stockout blue 46% · labor gap light-blue 31%).

**Footer (44px):** centered logo mark 14px + mono `Powered by AnalytIQ`.

## Screen 2 — Expired token state (/share/:token, lines 78–93)

Same brand bar (48px), then centered empty state:
```html
<span style="width:56px;height:56px;border-radius:16px;background:#fdf3e3;..."><!-- amber clock svg #b45309 --></span>
<h2 style="margin:0;font-size:19px;font-weight:600;color:#0f172a">This share link has expired</h2>
<span style="font-size:13px;line-height:1.6;color:#64748b">The link to <strong>Ops Risk Monitor</strong> expired on Aug 2, 2026, or was revoked by the workspace owner.</span>
<span style="...height:36px;background:#2563eb;border-radius:8px;color:#fff">Request a new link</span>
```

## Screen 3 — Embed Preview (/app/artifacts/:id/embed, lines 95–158)

Two-column layout `1.35fr 1fr`:

**Left — Live preview** on `#f7f8fa`: header "Live preview" + mono `16:9 · iframe`; a fake browser frame (30px chrome bar with two dots + URL pill `acme-portal.example.com/analytics` in mono 8.5px) containing a mini version of the dashboard (3 KPI tiles, bar chart, centered "Powered by AnalytIQ" footer).

**Right — Embed settings:**
1. **Embed code** dark block with floating Copy button:
```html
<div style="background:#0b1220;border-radius:9px;padding:12px 14px;position:relative">
  <code style="font-family:'IBM Plex Mono',monospace;font-size:10.5px;line-height:1.7;color:#93c5fd">&lt;iframe src="https://analytiq.app/embed/tok_9f2ae81cc4" width="100%" height="480" frameborder="0"&gt;&lt;/iframe&gt;</code>
  <span style="position:absolute;top:9px;right:9px;...background:rgba(255,255,255,.1);color:#e2e8f0">Copy</span>
</div>
```
2. **Token scope** checkboxes: Read-only data ✓ · Viewer filters ✓ · Drill-through ☐ · Data export ☐.
3. **Expires** (mono `Oct 1, 2026`) + **Refresh** (`On load`) dropdowns side by side.
4. **Allowed domains** chip input: `acme-portal.example.com ✕`, `*.acmeretail.com ✕` (blue mono pills) + "Add domain…" ghost.
5. **Save embed settings** primary button.

## Screen 4 — Present Mode (/app/artifacts/:id/present, lines 161–199) — full-screen, chrome-free

Dark stage `background:#0b1220`:
- **Slide header**: section title 24px/600 `#f8fafc` + right mono `section 2 / 6` (`#64748b`).
- **Chart panel**: `background:#0f1729;border:1px solid rgba(255,255,255,.09);border-radius:14px;padding:26px 30px` — large SVG (actual `#3b82f6` 3.5px, forecast `#60a5fa` dashed, target `#64748b` dashed, CI polygon `rgba(37,99,235,.15)`, "now" divider) + mono legend row.
- **Floating control pill** (bottom center):
```html
<div style="position:absolute;bottom:22px;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:4px;background:rgba(15,23,41,.92);border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:6px 8px;box-shadow:0 12px 40px rgba(2,6,23,.5)">
  <!-- ‹ prev · mono "2 / 6" · next › · divider · "Notes" toggle (active bg rgba(255,255,255,.08)) · ✕ exit -->
</div>
```
- **Presenter notes drawer** (bottom, toggled): `background:rgba(11,18,32,.97);border-top:1px solid rgba(255,255,255,.1)`; mono label `PRESENTER NOTES · AUTO-GENERATED NARRATIVE`; body 14px `#cbd5e1` with mono inline numbers — "Q3 tracks at $4.82M against a $5.14M target. The divergence starts in week 27 and concentrates in Northeast… reallocating promo budget from West could close roughly 40% of the gap."

---

## Build notes

- /share/:token must render **without any app shell or auth**, gated only by token validity; expired/revoked tokens fall through to Screen 2.
- Workspace branding (logo tile, name, accent) comes from the branding settings in onboarding/admin — same tokens drive viewer, embed preview, and email digests.
- Entry points to wire: Share modal (doc 12 §4) → public link → Screen 1; Embed tile → Screen 3; canvas toolbar present ▶ (doc 11 §7) and Solutions page "See present mode" → Screen 4.


---

<!-- ============ CHAPTER: 15 - Governance Diff.md ============ -->

# 15 — Governance: Mockup vs Current UI

Mockup source: `Governance.dc.html` (line numbers reference that file) — **4 screens**: Overview /app/governance · Human Review Queue /app/governance/review · Definition Review /app/governance/review/:id · Data Quality Rules /app/governance/rules
Reference screenshots (in `screenshots/`): `15-governance-mockup.png` (all 4 mockup frames), `15-governance-current-1.png`, `15-governance-current-2.png`
Status: **The current build is one "Governance ops" utility page** — a raw manifest table with WARN labels plus bare configuration inputs. None of the mockup's 4 screens exist as designed: no overview KPIs, no human review queue, no definition-diff review, no rules table + editor. This area needs to be split into 4 routed screens and rebuilt.

---

## What exists today (map to mockup)

The current page mixes fragments of several mockup screens into one:
- Manifest table (`categories WARN health 60`…) + "Roll back to v1.0.0" → belongs to **Manifest Versions** (/app/governance/manifests, Governance Lineage.dc.html — separate screen, not yet reviewed)
- CONFIGURATION raw inputs (`Set health threshold`, `Set SLA (h)`, `Set contract`) and CUSTOM DQ TESTS (`physical table`, `amount > 0 · col IS NOT NULL`, Add test/Run all) → should become the mockup's **Data Quality Rules** screen (§4)
- DRIFT ("No schema drift recorded") and LINEAGE stubs → Drift belongs in the **Review Queue** (§2); Lineage is its own screen (/app/governance/lineage)

The raw-input pattern (naked text boxes + "Set X" buttons, mono placeholders like `required cols, comma-sep`) is developer tooling, not the designed UI. Everything below replaces it.

## 1. Governance Overview (/app/governance) — MISSING (lines 26–49)

Header: breadcrumb + H1 "Governance" + right amber pill `6 ITEMS AWAITING REVIEW` (`#fdf3e3`/`#b45309`).

**KPI card grid** (4 cols, clickable, each links to its area):
```html
<a href="/app/governance/review" style="border:1px solid #e4e8ef;border-radius:10px;padding:16px 18px;display:flex;flex-direction:column;gap:6px" style-hover="border-color:#c7d9f8;box-shadow:0 6px 18px rgba(15,23,42,.06)">
  <span style="font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:.08em;color:#94a3b8">TABLES BLOCKED</span>
  <span style="font-family:'IBM Plex Mono',monospace;font-size:24px;font-weight:600;color:#dc2626">1</span>
  <span style="font-size:11.5px;color:#64748b">wms_events · contract failure</span>
</a>
```
Cards: TABLES BLOCKED 1 (red) · REVIEW ITEMS 6 (amber, "2 high priority") · PII FLAGS 2 (amber) · FRESHNESS BREACHES 1 (red) · SCHEMA DRIFT 3 (amber, "2 auto-adapted · 1 review") · CONTRACT FAILURES · 7D 4 (neutral, "all repaired automatically") · **WORKSPACE HEALTH TREND** span-2 card: 92 green + inline sparkline SVG (`stroke:#15803d`).

## 2. Human Review Queue (/app/governance/review) — MISSING (lines 52–106)

**Tab row with counts**: `All · 6` (active) · Definitions · 1 · Metric conflicts · 1 · PII · 2 · Leakage · 0 · Bridge tables · 1 · Drift · 1. Right: **Bulk approve** + **Assign ▾** outlined buttons.

**Queue table** (grid `26px 2.4fr 1fr .9fr .9fr 1.1fr`, rows 50px, mono header on `#fafbfc`): checkbox · ITEM (bold title + mono context line) · TYPE pill · CONFIDENCE (mono, colored: <0.7 amber, ≥0.85 green) · ASSIGNEE avatar · ACTIONS.

Type pills: `CONFLICT` purple `#f3eefe`/`#7c3aed` · `PII` red `#fdeaea`/`#dc2626` · `BRIDGE` teal `#e0f3f8`/`#0e7490` · `DRIFT` amber `#fdf3e3`/`#b45309`.

Per-row actions:
```html
<span style="...background:#e8f5ec;color:#15803d">Accept</span>
<span style="...border:1px solid #d4d9e1;color:#334155">Edit</span>
<span style="...border:1px solid #f4c7c7;color:#dc2626">Reject</span>
```
Rows: `"active_customer" defined 2 ways` (CONFLICT, 0.58, "affects 14 dashboards") · `PII suspected · customers.zip4` (PII, 0.94) · `Bridge table recommended · orders ↔ promotions` (BRIDGE, 0.87, "est. inflation ×3.2") · `Schema drift · orders.discount_pct FLOAT → STRING` (DRIFT, 0.99, "3 artifacts affected").

## 3. Definition Review — diff view (/app/governance/review/:id) — MISSING (lines 109–153)

The flagship governance screen. Structure:

**Header**: "Metric conflict · `active_customer`" (metric name mono blue) + amber pill `CONFIDENCE 0.58 · NEEDS HUMAN`; subcopy "Two live definitions detected. Choose one, edit, or merge — every affected artifact re-validates on approve."; right mono `queued 2d ago · assigned MO`.

**Side-by-side diff** (2 cols):
- LEFT — `CURRENT · SEMANTIC v11` + gray pill `IN USE · 9 DASHBOARDS`. Plain-English definition card with **red highlights** on the differing terms (`background:#fdeaea;color:#b91c1c;border-radius:4px;padding:1px 5px`): "…trailing **90 days**, excluding **cancelled orders**." + light mono SQL block.
- RIGHT — `PROPOSED · AI FROM FINANCE USAGE` (blue) + pill `SEEN IN 5 QUERIES`, column bg `#f8faff`. Definition card (blue border) with **green highlights**: "…trailing **60 days**, excluding **cancellations and full refunds**." + **dark SQL block** with green-highlighted diff tokens:
```html
<div style="background:#0b1220;border-radius:8px;padding:10px 12px;font-family:'IBM Plex Mono',monospace;font-size:10px;line-height:1.7;color:#93c5fd">COUNT(DISTINCT customer_id)<br>WHERE order_ts >= DATEADD(day,<span style="color:#4ade80">-60</span>,now)<br>AND is_cancelled = FALSE <span style="color:#4ade80">AND refund_pct &lt; 1.0</span></div>
```

**Evidence + Final definition row** (grid `1.4fr 1fr`): EVIDENCE narrative ("Finance ran 5 ad-hoc queries in June… median 41 days.") + affected-artifact chips (`Churn Risk — Enterprise`, `Exec Weekly`, `+12 more`); FINAL DEFINITION (EDITABLE) text box.

**Action bar** (on `#fafbfc`): green **"Approve — re-validate 14 dashboards"** (`background:#15803d`) · outlined "Request changes" · red text "Reject proposal" · right mono `decision recorded in audit log`.

## 4. Data Quality Rules (/app/governance/rules) — replace raw config inputs (lines 156–194)

Two-panel layout `1.6fr 1fr`:

**Left — rules table**: header "Quality rules 24" + `+ Add rule` primary; columns RULE / TYPE / THRESHOLD / ON (grid `1.8fr 1fr .9fr .6fr`, rows 44px, selected row `#f8faff`). Rows: `orders · pk uniqueness` (primary key, 100%) · `orders.net_amount · null cap` (null threshold, < 0.5%) · `pos feed · freshness` (freshness SLA, ≤ 1h) · `order_items · row count band` (row count, ±15% d/d) · `aov distribution drift` (drift (PSI), < 0.2, toggled OFF). ON column = 30×17 toggle (`#2563eb` on / `#cbd5e1` off).

**Right — Edit rule panel** (on `#fafbfc`): Rule type dropdown ("Primary key uniqueness") with mono helper line `pk · null threshold · freshness SLA · row count · distribution drift · PII · custom test`; Target (`orders.order_id` mono) + Threshold (`100%`) side by side; **Custom test (optional)** dark SQL block (`SELECT COUNT(*) = COUNT(DISTINCT order_id) FROM orders`) + mono caption `admin only · runs read-only`; **"Block artifacts on failure"** toggle; Save rule (filled) + Cancel.

This replaces the current CONFIGURATION/CUSTOM DQ TESTS raw inputs 1:1 — same capabilities, designed form.

---

## Priority order

1. Split the single ops page into the 4 routed screens.
2. Review Queue + Definition Review diff — the "human in the loop" flow is a core product claim and fully absent.
3. Overview KPI cards (entry point + at-a-glance state).
4. Rules table + editor replacing raw config inputs.
5. Move manifest list/rollback to the Manifest Versions screen (will be covered with Governance Lineage).


---

<!-- ============ CHAPTER: 16 - Lineage, Manifests & Pre-Agg (MISSING ENTIRELY).md ============ -->

# 16 — Lineage Graph, Manifest Versions & Pre-Aggregation: ❌ ALL 3 MISSING ENTIRELY

**Status: None of these three screens exist in the current build (user-confirmed).** The current "Governance ops" page has empty DRIFT/LINEAGE stubs and a raw manifest table — see doc 15 for the mapping; this doc is the build spec.
Mockup source: `Governance Lineage.dc.html` (line numbers reference that file)
Reference screenshot (in `screenshots/`): `16-lineage-mockup.png` (all 3 frames). No current-UI screenshots — nothing exists.

---

## Screen 1 — Lineage Graph (/app/governance/lineage, lines 26–152)

Interactive DAG canvas on `#f7f8fa` with a dot-grid background:
```html
<svg><defs><pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="1.5" cy="1.5" r="1.2" fill="#dfe3ea"></circle></pattern></defs><rect width="100%" height="100%" fill="url(#dots)"></rect></svg>
```

**Node taxonomy** (6 types, each a white card with a type glyph + mono label; legend pinned top-left):
| Type | Glyph | Accent |
|---|---|---|
| source | square `#0e7490` | — |
| table | square `#64748b` | — |
| metric | circle `#2563eb` | name in blue for governed |
| gold | diamond (`transform:rotate(45deg)`) `#b45309` | amber border `#f2ddb0` |
| model | ring `border:2px solid #7c3aed` | purple border `#e7dbfb`, name purple |
| artifact | square `#15803d` | green border `#b7e0c3` |

Node pattern:
```html
<div style="width:160px;background:#fff;border:1px solid #e4e8ef;border-radius:9px;padding:10px 12px;box-shadow:0 3px 10px rgba(15,23,42,.05)">
  <span style="display:flex;align-items:center;gap:7px"><span style="width:8px;height:8px;border-radius:2px;background:#64748b"></span><span style="font-family:'IBM Plex Mono',monospace;font-size:8.5px;letter-spacing:.06em;color:#94a3b8">TABLE</span></span>
  <span style="font-family:'IBM Plex Mono',monospace;font-size:11.5px;font-weight:600;color:#0f172a">orders</span>
</div>
```
Selected node: `border:2px solid #2563eb; box-shadow:0 6px 18px rgba(37,99,235,.15)`, label `TABLE · SELECTED` in blue.

**Edges**: cubic-bézier SVG paths; default `stroke:#cbd5e1 1.6px`; the selected node's downstream path highlighted `stroke:#2563eb 2.4px`; indirect/inferred edges dashed.

Demo graph: sources (prod_pos, q3_targets.xlsx, shopify_orders) → tables (stores, **orders** selected, targets_q3, order_items, web_orders) → metrics (net_revenue v4, target_gap_pct) → gold REV_LOC_WK_V1 + model rev_loc_v2 → artifact "Q3 Target Risk".

**Controls** (bottom-left floating bar): zoom − 82% + · divider · Auto-layout · Export ↓.

**Node details side panel** (300px, right, opens on select — lines 130–150): header `orders` + ✕; rows Type `table · prod_pos` / Health `96 / 100` green / Rows `1,204,318` / Downstream `2 metrics · 1 gold · 2 artifacts` / Freshness `18m · SLA 1h` green; divider; **IMPACT IF BROKEN** list with colored dots (blue "net_revenue v4 → 14 dashboards", amber "GOLD.REV_LOC_WK_V1 refresh", red "2 alerts · daily revenue guard"); footer button "Open table detail →" (`#f8faff`/`#c7d9f8`/`#1d4ed8`).

## Screen 2 — Manifest Versions (/app/governance/manifests, lines 155–179)

Replaces the current raw manifest table + "Roll back to v1.0.0" button. Versions table (grid `.9fr 1.1fr 1fr 1fr .8fr`, header mono on `#fafbfc`): VERSION · GENERATED · STATUS · CHANGES · expand/collapse.

Rows: **v12** (Jul 2 · 03:00, `REVIEW REQUIRED` amber pill, "3 schema · 1 metric", expanded, row bg `#f8faff`) · v11 (`ACTIVE` green, "1 schema") · v10 (`SUPERSEDED` gray, "6 schema · 2 metric").

**Expanded diff** (on `#fbfcff`) — change rows with typed chips:
```html
<span style="...background:#e8f5ec;color:#15803d">+ ADD</span><span style="font-family:'IBM Plex Mono',monospace;font-size:10.5px;color:#334155">dimension store_format on stores (confidence 0.91)</span>
<span style="...background:#fdf3e3;color:#b45309">~ MOD</span> orders.discount_pct semantic type ratio → text (drift)
<span style="...background:#fdeaea;color:#dc2626">− DEL</span> metric gross_margin_v1 (superseded by v2)
```
Actions inside expansion: **Approve v12** (filled) + **Rollback to v11** (outlined).

## Screen 3 — Pre-Aggregation Recommendations (/app/governance/preaggregations, lines 182–232)

Header: "Recommended rollups" + **Auto-materialize** toggle (off `#cbd5e1`).

**Recommendation cards** — per card:
- Mono rollup name (`agg_rev_store_week`) + value pill (`HIGH VALUE` green / `MEDIUM` blue) + right mono `hits 61% of queries`.
- Rationale line: "Weekly revenue by store — pattern seen in 42 dashboard queries this month."
- Two metric bars: **est. speedup** (green fill, `8.6×` label) and **est. cost** (blue fill, `$4/mo`):
```html
<span style="font-family:'IBM Plex Mono',monospace;font-size:9.5px;color:#64748b;width:88px">est. speedup</span>
<div style="flex:1;height:9px;border-radius:999px;background:#eef1f5;overflow:hidden"><span style="display:block;width:86%;height:100%;background:#15803d"></span></div>
<span style="font-family:'IBM Plex Mono',monospace;font-size:10.5px;font-weight:600;color:#15803d">8.6×</span>
```
- Actions: high-value card gets filled **Approve & materialize** + Dismiss; medium gets outlined-blue **Approve** + Dismiss.

**Footer**: "Monthly cost ceiling" + `$50` mono input + mono caption `current spend $15/mo`.

---

## Build notes

- Lineage entry points: sidebar Governance, canvas toolbar lineage icon (doc 11), inspector Lineage tab (doc 12), artifact detail Lineage tab (doc 13) — all should deep-link to this graph with the relevant node preselected.
- The "IMPACT IF BROKEN" panel is the governance selling point of the graph — prioritize it over graph aesthetics.
- Manifest approve/rollback actions must record to the audit log (consistent with doc 15's "decision recorded in audit log").


---

<!-- ============ CHAPTER: 17 - Semantic Layer (MISSING ENTIRELY).md ============ -->

# 17 — Semantic Layer (9 screens): ❌ ALL MISSING ENTIRELY

**Status: None of these screens exist in the current build (user-confirmed). Build from scratch.** The sidebar has a "Semantic Layer" item, but the designed surfaces behind it are absent.
Mockup sources: `Semantic Overview.dc.html` · `Semantic Metrics.dc.html` · `Semantic Tools.dc.html`
Reference screenshots (in `screenshots/`): `17-semantic-mockup-1.png` (Overview, Explores, Explore Detail), `17-semantic-mockup-2.png` (Metrics Catalog, Metric Detail, Dimensions), `17-semantic-mockup-3.png` (Field Picker, Join Paths, Derived Tables).

---

## A. Semantic Overview (/app/semantic) — Semantic Overview.dc.html lines 26–50

Header: breadcrumb + H1 "Semantic layer"; right: blue pill `MANIFEST v11 ACTIVE` (`#eff4ff`/`#1d4ed8`) + outlined **Regenerate** button.

Clickable KPI cards (same pattern as Governance overview — mono label / 24px mono value / caption): EXPLORES 6 (all healthy) · METRICS 48 (44 governed · 4 draft) · DIMENSIONS 112 (6 categories) · JOIN PATHS 19 (caption amber "1 blocked m:n") · CONFLICTS 1 amber (active_customer ×2 → links to review queue) · VERSION v11 (amber "v12 pending review" → manifests) · ACCESS POLICIES span-2 ("4 RLS policies" + "region-scoped viewers · finance-only margin metrics" → RLS admin).

## B. Explores List (/app/semantic/explores) — lines 52–82

Table grid `1.7fr .8fr .9fr 1.1fr .9fr .9fr 1fr`, rows 48px: EXPLORE (bold name + mono table composition, e.g. "Revenue / orders + order_items + stores") · METRICS · DIMENSIONS · ACCESS (stacked 20px avatars + `+9` counter chip) · HEALTH (scored pill `● 96` green / `● 84` amber) · CONFIDENCE (mono, colored `0.95` green / `0.71` amber) · USED BY (`14 dashboards`). Rows: Revenue, Customer, Inventory.

## C. Explore Detail (/app/semantic/explores/:id) — lines 84–118

Header: breadcrumb `semantic / explores / revenue`, H1 "Revenue" + `● HEALTHY 96` pill + mono `3 tables · confidence 0.95`; right primary **"Analyze this explore"** → workbench.
Tabs: `Metrics · 14` (active) · `Dimensions · 31` · `Joins · 4` · Access · `Artifacts · 14` · Versions.
Metrics tab table (grid `1.4fr 2fr .8fr .8fr .9fr`): METRIC (mono blue link) · DEFINITION (plain English, ellipsized) · FORMAT (`$ USD`, `%`) · VERSION (`v4`) · USED BY. Rows: net_revenue · aov · target_gap_pct.

## D. Metrics Catalog (/app/semantic/metrics) — Semantic Metrics.dc.html lines 25–70

Header: "Metrics 48" + search "Search metrics…" + primary **+ Calculated metric**.
Table grid `1.3fr 1.9fr .7fr .7fr .9fr .8fr .7fr .6fr .5fr`: METRIC · DEFINITION · AGG (`SUM`/`COUNT D`/`RATIO`/`AVG` mono) · FORMAT · SOURCE · CONFIDENCE (pill, green ≥0.9 / amber low / gray —) · OWNER avatar · USED BY · VER.

Special row states:
- **Conflict row** tinted `background:#fdf9ef` with inline chip:
```html
<span style="display:inline-flex;height:16px;padding:0 6px;border-radius:4px;background:#fdf3e3;color:#b45309;font-family:'IBM Plex Mono',monospace;font-size:8px;font-weight:600">×2 CONFLICT</span>
```
- **Deprecated row**: all values gray `#94a3b8`, chip `DEPRECATED` (`#f1f5f9`/`#64748b`), definition "Superseded by aov v2".

## E. Metric Detail (/app/semantic/metrics/:id) — lines 73–131

Header: mono H2 `net_revenue` + pills `GOVERNED · v4` (green) + `CONF 0.95` (blue); right outlined **Propose change**.
Two columns (left `1.35fr`, right on `#fafbfc`):
- LEFT: **PLAIN-ENGLISH DEFINITION** ("…The single source of truth for 'revenue' everywhere in the workspace."); **SQL EXPRESSION** with `ADMIN ONLY` chip and dark block:
```html
<div style="background:#0b1220;border-radius:9px;padding:12px 14px;font-family:'IBM Plex Mono',monospace;font-size:10.5px;line-height:1.7;color:#93c5fd">SUM(oi.qty * oi.unit_price<br>  - oi.line_discount) - COALESCE(r.refund_amt, 0)</div>
```
then 3-col facts: AGGREGATION SUM · FORMAT $ USD · 2dp · ALLOWED FILTERS time · region · channel.
- RIGHT: **LINEAGE** chip chain `orders → net_revenue (blue) → GOLD ×3 (amber)`; **USED BY · 14** artifact names + "+10 more"; **TESTS** pills `NON-NEGATIVE ✓` `RECONCILES GL ✓`; **VERSIONS** mini-changelog (v4 refunds included · Jun 20 / v3 line discounts · May 2).

## F. Dimensions Catalog (/app/semantic/dimensions) — lines 133–165

Collapsible category list with counts: Date 18 (expanded: `order_week 0.98`, `fiscal_quarter 0.96` — mono rows with green confidence) · Geography 14 · Category 26 · Boolean 21 · ID 19 · Text 14. Expanded category header on `#f8faff`.

## G. Visual Field Picker (/app/semantic/field-picker) — Semantic Tools.dc.html

Three-panel: **Dimensions** rail (search + checkbox groups DATE/GEOGRAPHY/CATEGORY; selected rows tinted) · **center**: SELECTED chip row (`order_week ✕ · region ✕ · Σ net_revenue ✕ · Σ target_gap_pct ✕`), **cardinality warning banner** (amber):
```html
<span style="font-size:11.5px;color:#7a4a10"><strong>Heads up:</strong> region × week × 42 stores is fine, but adding <span mono>store_name</span> would create 2,184 series — consider a Top-N.</span>
```
live **Preview** table (mono caption `100-row cap · 64ms`, colored gap values), and centered primary **"Analyze this →"** (goes to workbench) · **Measures** rail (search + REVENUE EXPLORE / CUSTOMER EXPLORE groups; selected measure shows a "7d trend" sparkline preview).

## H. Join Path Manager (/app/semantic/joins) — Semantic Tools.dc.html

Header "Join paths 19" + amber pill `1 BLOCKED`. Rows: `orders n:1 → stores` (mono cardinality chip) · `inflation ×1.0` + `SAFE` green pill; blocked row tinted amber: `orders m:n ✕ promotions`, `est. inflation ×3.2` + `BLOCKED` red pill + explainer "Many-to-many would fan out revenue. Bridge table fixes the grain." + primary **"Recommend bridge table"**; `orders 1:n → returns` with `FAN-OUT RISK` amber pill.

## I. Derived Tables editor (/app/semantic/derived-tables, admin) — Semantic Tools.dc.html

Header: mono `drv_weekly_promo_lift` + `GOVERNED` pill; right primary **Publish**. Left: dark SQL editor (`SQL · ADMIN ONLY` + green `✓ validated`; syntax-tinted SELECT). Right column: **Schedule** dropdown (`daily · 04:00 PT`), **Governance tags** chips (`revenue`, `promo`, dashed `+ tag`), **Lineage preview** chip chain (`orders + order_items → drv_weekly_promo_lift`), outlined **"Test run · dry"**. Below: ALL DERIVED TABLES list (grid: name · schedule · STATUS pill `FRESH` green / `STALE 2D` amber · GOVERNANCE pill `GOVERNED` blue / `DRAFT`).


---

<!-- ============ CHAPTER: 18 - Models & Model Ops (MISSING ENTIRELY).md ============ -->

# 18 — Predictive Models & Model Ops (6 screens): ❌ ALL MISSING ENTIRELY

**Status: None of these screens exist in the current build (user-confirmed). Build from scratch.** The sidebar has a "Models" item but no designed surfaces behind it.
Mockup sources: `Models.dc.html` · `Models Ops.dc.html`
Reference screenshots (in `screenshots/`): `18-models-mockup-1.png` (Models Overview, Training Run Detail, Model Card), `18-models-mockup-2.png` (Leaderboard, Feature Manifest, Retrain Center).

---

## A. Models Overview (/app/models) — Models.dc.html

Header: breadcrumb + H1 "Predictive models"; right outlined **"Retrain center →"**.
KPI cards: PROMOTED 8 · TRAINING RUNS · 30D 31 · FAILED 2 · RETRAIN DUE 3 · CHAMP/CHALLENGER 2 · PREDICTION TABLES 11.

Models table (MODEL · PURPOSE · STATUS · LAST TRAINED · ACCURACY · ACTIONS):
- Model cell: mono blue name + mono caption (`rev_loc_v2` / `LightGBM · weekly grain`).
- STATUS pills: `CHAMPION` green · `DRIFT 0.31` amber · `RUN FAILED` red.
- ACCURACY: `MAPE 4.1%` / `AUC 0.89` mono; failed = "—".
- ACTIONS: outlined Retrain + Card; drifted row gets primary **"Retrain now"**; failed row gets **"View logs"**.
Rows: rev_loc_v2 (Revenue forecast, CHAMPION, today 09:41) · churn_risk_v3 (Churn scoring, CHAMPION) · inventory_demand_v1 (Demand forecast, DRIFT 0.31) · sla_breach_v2 (SLA prediction, RUN FAILED).

## B. Training Run Detail (/app/models/runs/:id) — Models.dc.html

Header: mono `run 8842 · rev_loc` + pills `COMPLETED` / `PROMOTED` + right mono `today 09:41 · 48s`.
Tabs: **Summary** (active) · Backtest windows · Candidates · Features · Leakage · Logs.
Summary tab: 3 stat cards — CHAMPION **LightGBM** ("beats prior by 0.8pt") · BACKTEST MAPE **4.1%** ("5 rolling windows") · LEAKAGE CHECKS **14/14 ✓** ("2 features dropped"). Then **"Backtest error by window"** bar chart (5 windows, later windows darker blue). Bottom: dark mono log block:
```
09:41:22 window 3/5 · lgbm mape=0.041 · xgb mape=0.046
09:41:38 dropped feature future_promo_flag · leakage risk HIGH
09:41:47 promotion gate passed · champion=lgbm_v2
09:41:48 model card generated · card_8842
```

## C. Model Card (/app/models/:id) — Models.dc.html

Header: icon tile + mono `rev_loc_v2` + pills `PROMOTED · CHAMPION` (green) + `NO OVERFIT`; mono caption `card_8842 · LightGBM · trained today 09:41`; right outlined **Retrain**.
Left column: PURPOSE ("Forecast weekly net revenue per location, 8-week horizon, to flag target misses early."), TARGET `net_revenue` / ALGORITHM `LightGBM`, TRAINING DATA (`3,486 rows · 104 wks`) / FEATURES (`12 used · 2 dropped`), metric tiles MAPE 4.1% · MAE $4.9K · RMSE $7.2K.
Right column: **FEATURE IMPORTANCE** horizontal purple bars (foot_traffic → weather_idx); **SHAP SUMMARY · TOP DRIVER DIRECTION** dot plot (blue/red dots per feature); **LINKED ARTIFACTS** "Q3 Target Risk · Exec Weekly · +2".

## D. Model Leaderboard (/app/models/runs/:id/leaderboard) — Models Ops.dc.html

Left: "Candidate leaderboard · run 8842" + caption "ranked by mean MAPE across 5 backtest windows" + `windows: mean ▾` control. Table RANK · CANDIDATE · MAPE (±band) · MAE · TRAIN TIME · SELECT (radio): #1 LightGBM `CHAMPION` pill, 4.1% ±0.4, $4.9K, 18s, selected · #2 XGBoost 4.6% ±0.5 · #3 Prophet 5.8% ±0.7 · #4 Ridge 7.2% ±0.9, 3s. Footer: primary **Promote champion** + outlined **Override champion…**.

Right: **"Trade-off · LightGBM vs XGBoost"** scatter (error vs cost/run, labeled points) + **WHY LIGHTGBM WON** explainer card ("Best error on 4 of 5 windows, stable across holiday weeks, and 25% cheaper per training run than XGBoost. Ridge is fast but underfits promo interactions.") + mono footnote:
```
promotion gate: champion must beat incumbent by ≥0.5pt MAPE on ≥3 windows ✓
```

## E. Feature Manifest Viewer (/app/models/features/:id) — Models Ops.dc.html

Header: "Feature manifest · rev_loc_v2" + right mono `12 used · 2 dropped`.
Table FEATURE · ENCODING · IMPUTATION · LEAKAGE RISK · IMPORTANCE · STATUS:
- `foot_traffic_7d` (mono blue) · rolling mean · ffill · `LOW` green · purple importance bar · `APPROVED` green pill.
- Dropped row tinted red: `~~future_promo_flag~~` (struck through) · boolean · — · `HIGH` red · — · `DROPPED` red pill.
- `weather_idx` · bucketed · median · `MEDIUM` amber · small bar · `REVIEW` amber pill.

## F. Retrain Center (/app/models/retrain) — Models Ops.dc.html

Filter pills with counts: `All · 5` (active dark) · Scheduled · 2 · Drift · 2 · Failed · 1.
Rows (status dot + mono model name + mono reason + right action):
- `inventory_demand_v1` — amber dot — `drift-triggered · PSI 0.31 > 0.25` — primary **Retrain now**
- `churn_risk_v3` — amber dot — `drift-triggered · label shift detected` — **Retrain now**
- `rev_loc_v2` — blue dot — `scheduled · weekly Sun 03:00` — right mono `next in 2d`
- `sla_breach_v2` — red dot — red text `failed · training data gate: label nulls 4%` — outlined **View logs**

---

## Build notes

- Model Card is linked from: workbench inspector Model tab (doc 12), artifact detail Model tab (doc 13), "What's driving the forecast" card (doc 11), and Product marketing page. It's the trust surface for predictions — prioritize it with Models Overview.
- Leaderboard promotion gate copy must match Product page stage 4 claims (doc 03).
- Retrain triggers (drift/PSI, label shift, schedule) surface in notifications (doc 10) and activity feed.


---

<!-- ============ APPENDIX: Screenshot Index ============ -->

# Screenshot Index

Naming convention: `NN-page-mockup[-N].png` and `NN-page-current[-N].png`, where NN matches the diff document number.

## Expected files (from screenshots shared in chat so far)

| Filename | Contents | Referenced by |
|---|---|---|
| 01-landing-mockup-1.png | Mockup landing page, top half (nav → use cases grid) | 01 - Landing Page Diff.md |
| 01-landing-mockup-2.png | Mockup landing page, bottom half (use cases → footer) | 01 - Landing Page Diff.md |
| 01-landing-current.png | CURRENT landing page (skeleton version) | 01 - Landing Page Diff.md |
| 02-pricing-mockup.png | Mockup pricing page (full) | 02 - Pricing Page Diff.md |
| 02-pricing-current.png | CURRENT pricing page (cards only) | 02 - Pricing Page Diff.md |
| 07-docs-mockup.png | Mockup docs Quickstart article | 07 - Docs Page (MISSING ENTIRELY).md |
| 08-auth-mockup-1.png | Mockup auth: Login, Register steps 1/3/4, Forgot password, Verify email (6 screens) | 08 - Auth Flow Diff.md |
| 08-auth-mockup-2.png | Mockup auth: SSO callback signing-in + no-workspace-access | 08 - Auth Flow Diff.md |
| 08-auth-current-signin.png | CURRENT Sign in (inside app shell) | 08 - Auth Flow Diff.md |
| 08-auth-current-register.png | CURRENT Create account (inside app shell) | 08 - Auth Flow Diff.md |
| 09-onboarding-mockup-1.png | Mockup onboarding: Workspace Setup wizard + Choose Starting Mode | 09 - Onboarding Flow (MISSING ENTIRELY).md |
| 09-onboarding-mockup-2.png | Mockup onboarding: Dataset Health Preview + Template Picker | 09 - Onboarding Flow (MISSING ENTIRELY).md |
| 10-home-mockup-1.png | Mockup: Workspace Home + Recent Activity page | 10 - App Home & Activity Diff.md |
| 10-home-mockup-2.png | Mockup: Notifications right-drawer over Home | 10 - App Home & Activity Diff.md |
| 10-home-current.png | CURRENT Workspace Home | 10 - App Home & Activity Diff.md |
| 10-home-current-notifications.png | CURRENT notifications drawer (open, empty) | 10 - App Home & Activity Diff.md |
| 11-create-mockup-prompt.png | Mockup workbench — Prompt state | 11 - Create Workbench Diff.md |
| 11-create-mockup-building.png | Mockup workbench — Building state (event log, stage pills) | 11 - Create Workbench Diff.md |
| 11-create-mockup-canvas.png | Mockup workbench — Canvas state (toolbar, inspector) | 11 - Create Workbench Diff.md |
| 11-create-current-prompt.png | CURRENT Create — prompt page | 11 - Create Workbench Diff.md |
| 11-create-current-canvas.png | CURRENT Create — post-build canvas (collapsed sidebar = keep) | 11 - Create Workbench Diff.md |
| 12-inspector-mockup-1.png | Mockup: Data contract, Pipeline audit, Insight panel, Share modal | 12 - Inspector Panels & Overlays Diff.md |
| 12-inspector-mockup-2.png | Mockup: Version history, Comments drawer, Inline comment popover | 12 - Inspector Panels & Overlays Diff.md |
| 12-inspector-current-design.png | CURRENT inspector Design tab | 12 - Inspector Panels & Overlays Diff.md |
| 12-inspector-current-data.png | CURRENT inspector Data tab | 12 - Inspector Panels & Overlays Diff.md |
| 12-inspector-current-pipeline.png | CURRENT inspector Pipeline tab | 12 - Inspector Panels & Overlays Diff.md |
| 12-inspector-current-insights.png | CURRENT inspector Insights tab | 12 - Inspector Panels & Overlays Diff.md |
| 12-inspector-current-share.png | CURRENT inspector Share tab | 12 - Inspector Panels & Overlays Diff.md |
| 12-inspector-current-versions.png | CURRENT inspector Versions tab (overflow bug visible) | 12 - Inspector Panels & Overlays Diff.md |
| 13-artifacts-mockup.png | Mockup: library card view + table view + artifact detail | 13 - Artifacts Library & Detail Diff.md |
| 13-artifacts-current-cards.png | CURRENT artifacts "Cards" view (renders as list) | 13 - Artifacts Library & Detail Diff.md |
| 13-artifacts-current-table.png | CURRENT artifacts Table view | 13 - Artifacts Library & Detail Diff.md |
| 13-artifacts-current-detail.png | CURRENT artifact detail (Net Revenue Forecast) | 13 - Artifacts Library & Detail Diff.md |
| 14-sharing-mockup-viewer.png | Mockup: Public Artifact Viewer /share/:token | 14 - Artifact Sharing Screens (MISSING ENTIRELY).md |
| 14-sharing-mockup-expired.png | Mockup: expired share token state | 14 - Artifact Sharing Screens (MISSING ENTIRELY).md |
| 14-sharing-mockup-present.png | Mockup: Present Mode (dark stage + notes) | 14 - Artifact Sharing Screens (MISSING ENTIRELY).md |
| 14-sharing-mockup-embed.png | Mockup: Embed Preview + settings | 14 - Artifact Sharing Screens (MISSING ENTIRELY).md |
| 15-governance-mockup.png | Mockup: Overview + Review Queue + Definition Review + Quality Rules | 15 - Governance Diff.md |
| 15-governance-current-1.png | CURRENT "Governance ops" page (manifest table) | 15 - Governance Diff.md |
| 15-governance-current-2.png | CURRENT "Governance ops" page (config/DQ/drift/lineage sections) | 15 - Governance Diff.md |
| 16-lineage-mockup.png | Mockup: Lineage Graph + Manifest Versions + Pre-Aggregation | 16 - Lineage, Manifests & Pre-Agg (MISSING ENTIRELY).md |
| 17-semantic-mockup-1.png | Mockup: Semantic Overview + Explores List + Explore Detail | 17 - Semantic Layer (MISSING ENTIRELY).md |
| 17-semantic-mockup-2.png | Mockup: Metrics Catalog + Metric Detail + Dimensions Catalog | 17 - Semantic Layer (MISSING ENTIRELY).md |
| 17-semantic-mockup-3.png | Mockup: Visual Field Picker + Join Paths + Derived Tables | 17 - Semantic Layer (MISSING ENTIRELY).md |
| 18-models-mockup-1.png | Mockup: Models Overview + Training Run Detail + Model Card | 18 - Models & Model Ops (MISSING ENTIRELY).md |
| 18-models-mockup-2.png | Mockup: Leaderboard + Feature Manifest + Retrain Center | 18 - Models & Model Ops (MISSING ENTIRELY).md |

Pages 03–06 (Product, Solutions, Templates, Security) have no current-UI screenshot — those pages don't exist in the current build. Mockup screenshots can be added as `03-product-mockup.png`, etc.

**Note:** These images were shared inline in chat and must be saved into this folder manually (drag them in with these names), or re-sent as file attachments so they can be filed automatically. All future screenshot pairs will be filed here automatically when attached.
