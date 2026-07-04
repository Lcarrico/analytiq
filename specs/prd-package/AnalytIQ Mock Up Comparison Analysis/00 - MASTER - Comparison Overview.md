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
