# AnalytIQ — Gap Analysis: UI PRD v3.0 + UI Requirements Mockups + Evolution Roadmap vs. Existing Workspace

**Date:** 2026-07-03
**Sources analyzed:**

1. `AnalytIQ_UI_PRD.md` — UI PRD v3.0 (Release 3), 18 sections, ~70 routed screens
2. `AnalytIQ UI Requirements Document.zip` — all 40 files read individually: 33 `.dc.html` mockup boards (~85 screen frames), `PLAN.md` (build checklist + committed design language), `AnalytIQ UI - Screen Directory.html` (bundled hub, same content as `Index.dc.html`), `Index.dc.html`, `export-src/Index Standalone.dc.html`, `support.js` ×2 (design-canvas runtime, no product requirements), `.thumbnail` (landing-page preview image)
3. `AnalytIQ_Architecture_v2_1_with_Evolution_Roadmap.docx` — Parts I–XVIII, incl. Part XV Implementation Roadmap and Part XVII Evolution Roadmap (35 enhancements)
4. Existing workspace: `client/` (14 screens, no router), `server/app.py` (~7,400 lines, ~200 endpoints) + 40 domain modules, `tests/` (13 sprint files + 60 release files R1–R12), `PROGRESS.md` / `RELEASE_PLAN.md`

**Status legend:** ❌ Missing · 🟡 Partial (exists but materially short of the design) · ✅ Present (demo-grade parity)

---

## 0. Current-state snapshot (what exists today)

**Frontend** — a single-page, screen-number-based wizard (no URL router). 14 screens navigated via `context.jsx` state: S01 Home, S02 Connect (5 live warehouse connectors), S03 Governance run (SSE), S04 Table health, S05 Semantic review (+ evolution proposals, ranked review queue, schema diff), S06 Analysis (single-input planning, warm start, KG-related metrics, reuse candidates, fork), S07 Spec confirm, S08 Pipeline (SSE + step audit cards + flagging), S09 Dashboard (Recharts + KPIs + gates + lineage + CSV/JSON export), S10 Artifacts (search, favorites, schedules, member shares, share links, embed tokens, insights, opportunities, explain, health, provenance, replay, ROI, sandbox promote), S11 Account (login/register + agent memory viewer), S12 Platform (ops console: jobs, logs, metrics, cache, dispatches, events, meta-orchestrator, consultations, optimizations, signals, self-improve, branding), S13 Governance ops (manifest versions/rollback, PII approval, thresholds, SLAs, contracts, custom DQ tests, drift, SVG lineage), S14 Models (gold build, custom features + leakage confirm, training, trials, model card, registry, challenger).

**Backend** — Flask + SQLite, far ahead of the frontend. Releases R1–R12 implemented per `PROGRESS.md` and verified against endpoints/tests: auth (register/login/me bearer tokens), restrict-only ACLs, secrets/jobs/storage/search/observability abstractions, file upload + Google Sheets + webhook ingest + REST polling + dbt import, health history/thresholds, freshness SLAs, schema drift alerts, data contracts (BLOCK + 409), custom DQ tests, lineage, hierarchies, calculated metrics, explore ACLs, impact analysis, PDTs, pre-agg recommendations (read-only), session fork/templates/SSE/suggestions, modeler + feature engineering + leakage confirmation, training/trials/promotion/model cards/registry/challenger/retrain, artifact render/refresh/drift/favorites/tags/activity/provenance/annotations/subscriptions/share links/embed tokens/insights/drill, Stripe checkout/portal/webhook stubs, audit log (JSON), branding, holiday calendars — plus most Part XVII systems (UAS, cache hierarchy, DAG, events, cost-aware dispatch, agent bus, meta-orchestrator, sandbox, optimizer, memory, knowledge graph, intent history, adaptive thresholds, semantic evolution, reuse, AI-assisted review, confidence, explainability, replay, diff, dashboard health, opportunities, feedback loop, model monitor, ROI, self-improve).

**Legacy/duplicate code note:** `server/index.js`, `server/db.js`, `server/routes/*`, `server/services/chartData.js` are a superseded Express implementation of the original MVP. Not a design gap, but a cleanup item — two backends in one repo.

**Headline conclusion:** the dominant gap is the **entire PRD v3.0 frontend**. The mockups define ~85 frames across ~70 routes (marketing site, auth, onboarding, app shell, Create Workbench, artifact library/detail/sharing, data & integrations UI, governance suite, semantic suite, models suite, gold/contracts, alerts, collaboration, admin, billing, settings, errors). The existing client is a 14-screen engineering demo of the pipeline with none of the PRD's information architecture. On the backend, most core-pipeline and evolution features exist in demo form, but every feature that involves people and organizations — SSO, workspaces, teams, invites, roles, notifications, comments, alerts management, Slack, RLS, billing/metering — is missing or stubbed.

---

## 1. Global / structural gaps (PRD §2, §18 + PLAN.md design language)

| # | Item | Status | Gap detail |
|---|------|--------|-----------|
| G-1 | URL routing | ❌ | PRD assigns a route to every screen (`/app/*`, `/share/:token`, marketing `/…`). Client has no router at all — navigation is a `screen` integer in context. Deep links, breadcrumbs, back button, shareable URLs all impossible today. |
| G-2 | App shell: fixed 240px sidebar + 64px top bar | 🟡 | A 212px dark wizard sidebar exists. Missing: light sidebar per design language (`#fbfcfe`, grouped nav Home/Create/Artifacts/Data/Semantic Layer/Gold Tables/Models/Alerts/Governance/Team/Admin/Billing/Settings), collapse-to-64px icon rail, top bar entirely (workspace switcher, global ⌘K search with expanding overlay + recent/suggested results, notification bell with badge, help icon, avatar menu), breadcrumbs (`acme-retail / data / sources`), right-hand contextual drawer (360–420px, persistent ≥1440px). |
| G-3 | Design tokens & component conventions | 🟡 | IBM Plex Sans/Mono already used. Missing/divergent: committed palette (`#2563eb` accent, exact border/ink/muted grays, tinted status badge colors), 10px-radius cards, badge pill spec (mono 10px uppercase + dot), table spec (sticky headers, mono numeric cells, filter bar above, hover states), KPI number spec (mono 26px), card/table view toggles on list screens, dark-surface treatment for admin/technical blocks, monospace "admin-only" styling convention. |
| G-4 | Consistent detail-screen pattern (header band + tab bar + tab content) | ❌ | Design uses it for Source, Table, Explore, Metric, Gold Table, Model, Artifact, Alert detail. No screen in the client follows this pattern. |
| G-5 | Consistent list-screen pattern (filter rail/bar + sortable table ⇄ card grid) | ❌ | Only S10 has a basic filter/search bar. No column sorting anywhere, no card/table toggle, no filter rails. |
| G-6 | Modal vs. drawer conventions | 🟡 | One modal (share) exists. No side-drawer component (comments, inspector, lineage details, notifications). |
| G-7 | Responsive behavior | ❌ | PRD: 3-column workbench collapses <1024px to tab-switched single column; tables scroll horizontally with sticky first column <768px; sidebar collapses. Client is desktop-fixed. |
| G-8 | Role-aware UI (admin-only fields, RBAC-gated nav) | ❌ | `X-User-Role` header + ACLs exist server-side, but the UI renders everything for everyone; no admin-only visual treatment (SQL, raw JSON, gate logs). |
| G-9 | Global search UX | 🟡 | Backend FTS exists (`GET /api/search`) and S10 uses it for artifacts. Missing: top-bar ⌘K entry point, full-width overlay, recent/suggested results, cross-entity results (metrics, sources, docs). |
| G-10 | Status color/badge language (green/amber/red/gray) | 🟡 | Ad-hoc badges exist; not the systematic health/PASS/WARN/BLOCK badge language of the mockups. |

---

## 2. Public marketing site (PRD §3; mockups: 7 Marketing boards) — **entire area ❌**

No marketing site exists in the repo (no static site, no routes, no build target).

| Screen | Route | Status | Required elements (from PRD + mockup) |
|--------|-------|--------|----------------------------------------|
| Landing | `/` | ❌ | Sticky nav; hero with animated chat-to-dashboard live-build preview panel; stat chips (4 min question→artifact, 100% queries validated, 0 raw rows to LLM); "Why not normal BI?" comparison table; 4 value-prop cards; 6 use-case tiles with chart thumbnails; trust/security strip; terminal-style CTA band; multi-column footer (Product/Solutions/Resources/Company) with SOC 2 Type II · GDPR · ISO 27001 badges. |
| Product | `/product` | ❌ | Pinned 5-node stepper (Understand → Validate metrics → Build gold data → Train & backtest → Assemble & share) with click-to-scroll; alternating image/text stage sections each with live mock panels (plan card, validation checklist incl. blocked m:n join, gold gate list, model leaderboard, artifact w/ health badge); closing CTA. |
| Solutions ×6 | `/solutions/{executives,data-teams,operations,finance,sales,customer-success}` | ❌ | Shared template with persona tabs; persona hero; 3-card template gallery per persona; testimonial quote band; 3 feature callouts; CTA. |
| Templates gallery | `/templates` | ❌ | Filter rail (7 categories + type: Predictive/Monitoring/Diagnostic); search; 10 named template cards (Revenue Forecast, Location Performance, Customer Churn Risk, Operational Risk Monitor, Sales Pipeline Health, Margin Variance, Marketing Spend Efficiency, Inventory Demand Forecast, SLA Breach Predictor, Anomaly Monitor) with thumbnails + hover "Use this template". |
| Pricing | `/pricing` | ❌ | Monthly/annual toggle (−20%); 4 plan cards (Starter $0, Team $149, Business $499 "most popular", Enterprise custom) with exact feature checklists; expandable comparison table; FAQ accordion (token definition, limit behavior, data locality, plan switching). |
| Security | `/security` | ❌ | Sticky jump nav; 8 sections (no raw data to LLMs, read-only access, validation gates, PII detection+steward unmask, audit log **incl. SIEM streaming on Enterprise**, RLS with simulator, signed expiring share/embed tokens, workspace scoping); trust badge row. |
| Docs / Learn | `/docs` | ❌ | Docs shell (nav tree, article column, on-this-page TOC, search); ~12 seeded articles (Quickstart, Connect Snowflake, Upload CSV/XLSX, Build first dashboard, Share, Health scores, Semantic layer, Gold tables & contracts, Predictive basics, Roles & permissions, Security guide, Tokens & billing); "Was this helpful?" feedback control. |

**Backend implied by §2:** none strictly (static site), except template gallery metadata + thumbnail assets, docs content store or static docs build, and a demo-booking/contact funnel (external OK).

---

## 3. Authentication & account creation (PRD §4; mockup `Auth.dc.html`, 8 frames)

Current: S11 renders in-app email/password register/sign-in against `/api/auth/*`; tokens in `localStorage`. Everything else below is missing on **both** tiers.

| Screen / feature | Status | Frontend gap | Implied backend gap |
|------------------|--------|--------------|---------------------|
| Login `/login` | 🟡 | Standalone centered-card page w/ full-bleed background; divider; footer links | — (email/password works) |
| SSO buttons (Google, Microsoft, Enterprise SSO) | ❌ | Buttons + provider redirect flow | OAuth (Google/Microsoft) + SAML 2.0/OIDC brokering, domain-based IdP discovery |
| Magic link | ❌ | "Prefer a magic link? Email me a link" toggle | Token issuance + email delivery + one-time login endpoint |
| Register 4-step wizard `/register` | 🟡 | Steps UI: 1 account → 2 company/workspace → 3 role picker (Business User/Analyst/Data Admin/Executive) → 4 invite teammates (email chips) + first-path picker (Sample data / Connect warehouse / Upload file); "Free 14-day trial · no credit card" | Workspace creation at signup; role capture; invites; trial state on org |
| Forgot password `/forgot-password` | ❌ | Form + "check your email" confirmation state (30-min expiry copy) | Reset-token issuance/consumption endpoints + email |
| Email verification `/verify-email` | ❌ | Icon-led card + resend | Verification tokens + resend endpoint + verified flag |
| SSO callback `/sso/callback` | ❌ | Spinner state + 3 error variants (org not enabled, no workspace access, session expired) w/ "Contact your admin" | Callback handling + error taxonomy |

---

## 4. First-run onboarding (PRD §5; mockup `Onboarding.dc.html`, 4 frames) — **entire area ❌**

| Screen | Status | Frontend gap | Implied backend gap |
|--------|--------|--------------|---------------------|
| Workspace setup wizard `/onboarding/workspace` | ❌ | Progress-bar wizard: workspace name, company size, primary use case cards, timezone/currency, branding step (logo dropzone, accent swatches, font) with live preview chip | Workspace settings model (timezone, currency, size, use case). Branding API exists (`/api/branding`) ✅ but is workspace-global with no logo upload asset handling |
| Choose starting mode `/onboarding/start` | ❌ | 5 large cards: Sample data (FASTEST), Upload file, Connect warehouse, Import dbt, REST API/Webhook | All five ingestion paths exist server-side ✅; needs a "load sample dataset" one-shot endpoint (demo seed exists at DB init, not user-invokable per workspace) |
| First dataset health preview `/onboarding/source-health` | ❌ | "Safe to analyze" banner, 4 stat cards (tables/health/PII/freshness), per-table status rows (HEALTHY / PII · n COLS / NULL SPIKE), "profiling completed in Xs" | Governance run output ✅ covers this; needs onboarding-shaped summary endpoint or client aggregation |
| Template picker `/onboarding/templates` | ❌ | 3–4 recommendation cards with rationale lines ("You have transaction dates + revenue — try…"), BEST MATCH badges, skip link | Recommendation engine matching profiled columns → template catalog (template catalog itself also missing; session templates exist but have no matching logic or thumbnails) |

---

## 5. Home & workspace (PRD §6; mockup `App Home.dc.html`, 3 frames)

| Screen | Status | Gap detail |
|--------|--------|-----------|
| Workspace Home `/app` | ❌ | Current S01 is a 4-stat pipeline landing. PRD home: greeting header, full-width hero prompt bar ("Ask a business question… ⏎ build") that starts a Create session, and an 8-widget grid: Recent artifacts (thumbnails), Active pipeline runs (live stage/elapsed), Data health summary (score + 4 sub-stats), Alerts firing (severity + age), Governance tasks awaiting review (count + typed rows), Suggested analyses (add-to-chat chips), Recently viewed, Usage/cost (admin-only). Backend: artifacts/pipelines/health/alerts/reviews all queryable ✅; **recently-viewed tracking ❌, suggested-analyses-for-home ❌ (suggestions are per-session), usage/token summary ❌.** |
| Recent Activity `/app/activity` | ❌ | Workspace-wide timeline w/ filter chips (All/Builds/Governance/Data/Sharing), date range, actor avatars, "Load more". Backend: per-artifact activity ✅ + audit log ✅ exist; **no unified workspace activity feed endpoint** (join of builds/governance/shares/alerts with actor identity). |
| Notifications Center `/app/notifications` | ❌ | Right-drawer + full page; tabs All/Unread(n)/Mentions; date grouping; unread dots; "Mark all read". Backend: **no notifications model at all** (no table, no endpoints, no read state, no mention detection). Email outbox exists but is not an in-app inbox. |

---

## 6. Create Workbench — flagship (PRD §7; mockups `Create Workbench.dc.html` 5-state board + `Inspector Panels.dc.html` 7 frames)

The current flow spreads this across S06 → S07 → S08 → S09 as separate wizard pages. The PRD's single three-column workbench (`/app/create`, `/app/create/new`, `/app/create/:sessionId`) — chat left, live canvas center, inspector right — **does not exist**. This is the largest single build item.

| # | Element | Status | Gap detail |
|---|---------|--------|-----------|
| 7.2 | Chat panel (thread + fixed input) | ❌ | No message thread UI. Needed: user bubbles right / assistant left, compact gray agent-step rows, suggested prompt chips, uploaded-context file chips above input, "+" template selector, expandable textarea + attach + send. Backend: SSE session messages ✅ (`POST /sessions/:id/message` streams), session events persisted ✅. **File attach into a session (e.g. `q3_targets.xlsx` joined mid-conversation) ❌** — uploads create connections, not session context. |
| 7.3 | Prompt start state `/app/create/new` | 🟡 | S06 has input + warm start + recent sessions. Missing: centered empty-state layout, 4 typed example prompt cards (FORECAST/PREDICTIVE/VARIANCE/ANOMALY), template card row, data-source selector dropdown, "Use sample data", field-picker shortcut link. |
| 7.4 | Guided clarification chips | ❌ | Inline multiple-choice chips (3–5 options) + "Not sure" + "Use recommended" + confidence indicator (e.g. 0.62). Backend: planner returns plan in one shot; intent-confidence exists internally, **clarifying-question turn protocol (ask-one-question-below-0.85) not surfaced via API events**. Adaptive threshold endpoints ✅. |
| 7.5 | Plan confirmation card | 🟡 | S07 is a full-page spec form. PRD wants an inline chat card with labeled rows (Goal, Metrics, Dimensions, Time range, Filters, Output type, Predicted horizon, Data sources, **Access limitations — masked PII surfaced to user**) each with edit-pencil, plus Approve & Build / Edit plan / Cancel. Access-limitations row has no backing data in the plan payload today. |
| 7.6 | Live pipeline progress in-canvas | 🟡 | S08 has SSE stages + step cards. Missing: the 9 named stage chips (Understanding request → … → Assembling dashboard) as chip row with per-chip state icons, friendly one-line event log, inline amber PII-mask warning callouts, "Show technical detail (admin)" collapse, "Skip to result". |
| 7.7 | Dashboard canvas | ❌ | S09 is a static report page. PRD canvas: toolbar (zoom, fit width, present, device preview, refresh, save version, export, share, comment, view lineage, view pipeline); KPI strip; responsive grid of **13 section types** (line, bar, horizontal bar, area, scatter, heatmap, histogram, table, narrative text, forecast panel ±CI, actual-vs-predicted, model leaderboard, feature importance); drag handles + selection outline; click-to-edit titles; empty state. Recharts renders ~3 chart types today. |
| 7.8 | Inline comment mode | ❌ | Section-anchored popover composer w/ existing-comment stack + resolve. **No comments backend** (see §15). |
| 7.9 | Direct canvas edit mode | ❌ | Floating per-section toolbar: rename, chart-type dropdown, Top-N stepper, comparison toggle, time-grain dropdown, reorder drag, inline narrative editing; global filter bar w/ chips + "Add filter". **No artifact-edit endpoints** — artifacts are render-once outputs; no section model mutations, no filter re-execution API. |
| 7.10 | Inspector panel (8 tabs: Design/Data/Filters/Pipeline/Lineage/Model/Comments/Share) | ❌ | Nothing equivalent. Per-tab gaps: |
| 7.10.1 | Design tab | ❌ | Title/metric/dimension/chart-type icon grid/time grain/comparison controls, contract + SQL-validated badges, "Why this chart?" explainer, "Replace with…" suggestion cards (backend for chart-choice rationale + alternates ❌ — ties to Evolution #31). |
| 7.10.2 | Data / trust contract tab | 🟡 | Per-component collapsible cards: row count vs expected band, nulls, ranges, freshness, gates. Data exists in pipeline results/provenance ✅ but there is **no per-component data-contract record** exposed (see Query/Data contracts, §13). |
| 7.10.3 | Pipeline audit tab | 🟡 | S08 step cards ✅ + flag ✅ + replay ✅. Missing: in-artifact placement, per-stage gate badges + repair counts, admin-only monospace technical detail, **"Fork from here" per stage card** (session fork ✅ exists but only whole-session, not from a step). |
| 7.10.4 | Insight panel | 🟡 | Insights scan/list/dismiss/drill ✅ (S10 buttons). Missing: card UI with type icons (anomaly/trend/outlier/correlation), confidence badges, Investigate flow into a pre-seeded session (drill endpoint exists — needs UI). |
| 7.10.5 | Share panel/modal | 🟡 | Backend: member shares ✅, public signed links (expiry, password-capable) ✅, embed tokens ✅. Missing UI: visibility radio group (Private/Workspace view/Workspace edit/Public link), distribution row (Embed, HTML, PDF ❌, PNG ❌, **Slack ❌**, email, copy link), advanced (expiration picker, password, scope dropdown, allow comments/drill-through/data-export checkboxes, revoke). Missing backend: **PDF + PNG export, Slack send, per-link permission flags (comments/drill/export), scope levels**. |
| 7.10.6 | Version history | 🟡 | UAS versioning ✅ (`/api/uas/artifacts/:uid/versions`), diff engine ✅. Missing: version timeline UI w/ tag chips (sem v/gov v/feature v/model card), **Restore endpoint + Compare view for assembled artifacts**. |

---

## 7. Artifact library & viewing (PRD §8; mockups `Artifacts Library`, `Artifact Sharing`)

| Screen | Status | Gap detail |
|--------|--------|-----------|
| Artifacts Library `/app/artifacts` | 🟡 | S10 has search/filters/favorites. Missing: left filter rail (Created by me / Shared with me / Predictive / Has warnings / Public links / Needs review) + **Folders with counts ❌ (no folder model at all)**; card grid with thumbnails + type/health badges ⇄ sortable table toggle (columns incl. Data health score, Last refreshed, Last viewed ❌ — no view tracking, Share status, Tags ✅, Folder ❌); kebab row menus; "+ New dashboard" entry. Thumbnails: endpoint exists ✅, UI uses placeholder art. |
| Artifact Detail `/app/artifacts/:id` | ❌ | Header band (editable title ❌, owner, badges, Open-in-workbench/Duplicate ❌/Export/Share) + 8 tabs (Dashboard, Insights, Pipeline, Lineage, Model, Versions, Sharing, Activity) reusing §7.10 panels. Duplicate-artifact endpoint ❌. |
| Public viewer `/share/:token` | 🟡 | `GET /api/public/<token>` serves artifact ✅ (rate-limited, hashed token). Missing: branded slim-header viewer page (workspace logo, "DATA 3H OLD" freshness badge, expiry/read-only note, **Request access button ❌**), permitted viewer filters, "Powered by AnalytIQ" footer, styled expired/revoked state page, password-entry gate UI. |
| Embed preview `/app/artifacts/:id/embed` | ❌ | Split iframe-preview + settings form (embed code w/ copy, token scope checkboxes incl. viewer filters/drill-through/data export, expiry, **allowed-domains chip list — backend stores nothing per-token about origins**, refresh mode). Embed token creation ✅; **no `/embed/:token` render route, no Origin/domain enforcement**. |
| Present mode `/app/artifacts/:id/present` | ❌ | Full-screen chrome-free canvas, auto-hiding control bar, section prev/next, presenter-notes drawer fed by narrative text (**narrative generation ❌**, Evolution #25). |

---

## 8. Data & integrations (PRD §9; mockups `Data Sources`, `Data Import`, `Data Detail`)

Backend is largely ✅ here (R2/R3); the designed UI mostly ❌.

| Screen | Status | Gap detail |
|--------|--------|-----------|
| Sources list `/app/data/sources` | 🟡 | S02 lists connections as cards. Missing table view w/ columns: type, status badge, health mini-gauge, last sync, **freshness SLA state (met/at risk/breached)** ✅ data exists, owner ❌ (no per-source owner), table count, issues badge; row-click → detail. |
| Add source `/app/data/connect` | 🟡 | S02 has 5 warehouse cards + inert dbt tile. Design wants a 12-connector logo grid: Snowflake ✅, BigQuery ✅, Databricks ✅, Redshift ✅, Postgres ✅, MySQL 🟡 (backend registrable, no UI), DuckDB 🟡 (same), CSV/XLSX/Parquet 🟡 (upload API ✅, no UI), REST API 🟡 (API ✅, no UI), Webhook 🟡 (API ✅, no UI), dbt 🟡 (API ✅, no UI), Google Sheets 🟡 (API ✅, no UI); search bar; "Request a connector" link ❌. |
| Connector setup wizard `/app/data/connect/:type` | 🟡 | S02 has a flat credential form + test. Missing: 4-step left-rail wizard (Credentials → Scope & tables → Freshness SLA → Health check), searchable schema/table checklist tree w/ per-schema PII-likely flags, "n of m selected", SLA input step, run-health-check step. Backend: scope selection at connect ❌ (governance profiles everything), SLA config ✅ (separate endpoint). |
| File upload flow `/app/data/upload` | ❌ | Dropzone → schema preview table w/ **editable per-column type dropdowns ❌** + PII badges → table name input → profiling stat cards → confirm. Upload + auto-profile ✅ backend; column-type override ❌. |
| REST API connector `/app/data/api` | ❌ | Two-column form (endpoint, method, auth type, headers KV list, pagination, poll interval, JSON path) + live "Test response" pane + ingest preview table. Backend: register + poll ✅; **test-response preview endpoint ❌, pagination/JSON-path config ❌ (flat fetch), OAuth 2.0 auth type ❌** (arch §3.1 lists API key/OAuth2/Bearer). |
| Webhook connector `/app/data/webhook` | ❌ | Generated endpoint URL + copy, masked signing secret + reveal, expected payload schema block, "Send test event", recent-events table w/ status + failure reason. Backend: tokened ingest + events table ✅; **signing-secret verification ❌, payload schema validation + failure reasons ❌, test-event sender ❌.** |
| dbt import `/app/data/dbt` | ❌ | Repo-connect step (GitHub URL) + model checklist + mapping table (dbt model → semantic candidate dropdowns) + inherited-tests badges + failing-test indicator. Backend: manifest.json upload ✅; **git repo fetch ❌, selective model mapping ❌.** |
| Source detail `/app/data/sources/:id` | 🟡 | S13 exposes manifest/drift/history/lineage as one ops page. Design: header band + **9 tabs** (Overview, Tables, Health, Schema Drift, PII, Freshness, Lineage, Sync Logs ❌ — no sync-log capture, Settings) with stat cards, health trend chart, open-issues list. |
| Table detail `/app/data/tables/:id` | ❌ | Header + two-column: **editable business definition ❌ (definitions exist, no per-table edit UI/endpoint)**, health-trend sparkline ✅ data, columns table (null rate ✅, semantic type ✅, confidence ✅, PII risk ✅, drift annotation ✅), freshness card ✅ data, downstream artifacts list ✅ (lineage), gate badges ✅ data. Pure UI + one PATCH endpoint. |

---

## 9. Governance & data quality (PRD §10; mockups `Governance`, `Governance Lineage`)

| Screen | Status | Gap detail |
|--------|--------|-----------|
| Governance overview `/app/governance` | ❌ | Card grid: Tables blocked, Review items (n + priority), PII flags, Freshness breaches, Schema drift (auto-adapted vs review split), Contract failures 7d ("all repaired automatically" — repair counting ✅ partial), workspace health-trend sparkline. All data exists across endpoints; needs an aggregation endpoint or client composition + the screen itself. |
| Human review queue `/app/governance/review` | 🟡 | S05 shows a ranked review list ✅ (AI-assisted ranking ✅). Missing: filter tabs by type (Definitions / Metric conflicts / PII / Leakage / Bridge tables / Drift) — **leakage + bridge-table review items never enter this queue** (leakage confirm lives in S14; bridge recommendations aren't queue items), bulk approve, assignee avatars (**no assignment model**), inline Accept/Edit/Reject ✅ per-item actions exist. |
| Definition review detail `/app/governance/review/:id` | ❌ | Split-screen current-vs-proposed **diff view with SQL + prose + highlighted deltas**, confidence badge, evidence panel (usage evidence ✅ partially via governance_review ranking), affected-artifacts chips (✅ impacts data), editable final definition, Approve (re-validate n dashboards) / Request changes ❌ (no state) / Reject. |
| Data quality rules `/app/governance/rules` | 🟡 | Backend: thresholds ✅, SLA rules ✅, contracts ✅, custom tests ✅ + run-all ✅ (S13 exposes raw forms). Missing: unified rules table (name/type/threshold/**status toggle ❌ — rules can't be disabled**), side-panel rule editor w/ 7 rule types incl. distribution drift (PSI) ✅ + row-count band ✅ + PII rule type 🟡, "Block artifacts on failure" toggle ✅ (contracts), admin-only styling. |
| Lineage graph `/app/governance/lineage` | 🟡 | S13 renders a small SVG DAG ✅. Missing: full-canvas interactive graph, 8 node types incl. **share links + alerts as nodes ❌**, click-to-highlight up/downstream, floating zoom/layout/export controls (**export-graph ❌**), node details side panel w/ "IMPACT IF BROKEN" list ✅ (impacts data exists) + open-detail links. Arch §11.4 additionally requires **downstream bulk-notify owners ❌ and schema-change what-if simulation ❌** (impacts endpoint covers semantic-version impacts only). |
| Manifest versions `/app/governance/manifests` | 🟡 | Versions + rollback + diff ✅ (S13 + `/api/diff`). Missing: designed table (status badges ACTIVE/REVIEW REQUIRED/SUPERSEDED, review-required flag, schema-change counts), expandable ADD/MOD/DEL diff rows, **Approve manifest action ❌** (no approval state on manifests). |
| Pre-aggregation recommendations `/app/governance/preaggregations` | 🟡 | Recommendations endpoint ✅ (GET only). Missing UI entirely; missing backend: **Approve & materialize ❌, dismiss ❌, auto-materialize toggle ❌, monthly cost ceiling ❌, est. speedup/cost fields ❌, invalidation on manifest major bump ❌** (arch §3.5). |

---

## 10. Semantic layer (PRD §11; mockups `Semantic Overview`, `Semantic Metrics`, `Semantic Tools`)

| Screen | Status | Gap detail |
|--------|--------|-----------|
| Overview `/app/semantic` | ❌ | 7 stat cards (Explores, Metrics governed/draft split, Dimensions by category, Join paths + blocked count, Conflicts, Version + pending, Access policies) + manifest-version badge + Regenerate button (generate ✅ exists). |
| Explores list `/app/semantic/explores` | ❌ | Table: business name + source tables, metric/dimension counts, access avatar stack, health badge, confidence, used-by dashboards count. Explore CRUD/ACL ✅ backend; counts/usage rollup ❌. |
| Explore detail `/app/semantic/explores/:id` | ❌ | Header band + 6 tabs (Metrics, Dimensions, Joins, Access, Artifacts using, Version history) + "Analyze this explore" CTA. |
| Metrics catalog `/app/semantic/metrics` | 🟡 | S05 lists run definitions w/ accept/edit/reject. Missing: catalog table (agg, format ✅, source, confidence badge, owner ❌, used-by count ❌, version ✅), **conflict badges (×2 CONFLICT) ❌ in UI (conflict detection exists in review queue)**, deprecated badge ❌ (no deprecation state), row actions resolve-duplicate/deprecate ❌, "+ Calculated metric" ✅ backend / ❌ UI. |
| Metric detail `/app/semantic/metrics/:id` | ❌ | Plain-English definition block, admin-only SQL block, aggregation/format/allowed filters (**allowed_filter_dimensions not modeled**), lineage mini-diagram, used-by list, version history, **metric tests (NON-NEGATIVE, RECONCILES GL) ❌**, "Propose change" flow ❌. |
| Dimensions catalog `/app/semantic/dimensions` | ❌ | Category-grouped accordion (Date/Geography/Category/Boolean/ID/Text) w/ per-dimension confidence. Hierarchies ✅ backend. |
| Join path manager `/app/semantic/joins` | ❌ | Join rows w/ type icons, inflation factors, SAFE/FAN-OUT RISK/BLOCKED badges, **"Recommend bridge table" action ❌** (m:n blocking ✅ in schema builder; no bridge workflow), estimated inflation ❌. |
| Visual field picker `/app/semantic/field-picker` | ❌ | Three-column picker (dimensions tree / selected tray + **100-row preview table** / measures by explore), hover tooltips w/ definitions + **7-day sparklines**, live fan-out & cardinality warning banner, "Analyze This" → session. Backend: **preview-query endpoint ❌, field-level sparkline endpoint ❌, live fan-out estimation ❌** (arch §4.3 requires all three). |
| Derived tables `/app/semantic/derived-tables` | 🟡 | PDTs ✅ (create/list/refresh, schedule). Missing: list UI w/ freshness status (FRESH/STALE) ✅ data, full-screen editor (admin-only SQL pane w/ validation ✅ partial, metadata form, governance tags ❌, lineage preview ✅ data, dry-run "Test run" ❌, Publish state ❌ draft/governed lifecycle). |

---

## 11. Predictive modeling (PRD §12; mockups `Models`, `Models Ops`)

Backend R4/R5 ✅ is strong; the designed screens are ❌.

| Screen | Status | Gap detail |
|--------|--------|-----------|
| Models overview `/app/models` | 🟡 | S14 is session-scoped. Missing: workspace-wide summary cards (Promoted, Training runs 30d, Failed, **Retrain due**, Champ/challenger count, Prediction tables count) + all-models table (status incl. DRIFT score badge ✅ data, last trained, accuracy, per-row Retrain/Card/View-logs actions). |
| Training run detail `/app/models/runs/:id` | 🟡 | Data exists (jobs, trials, features, leakage results, logs?). Missing: header + **7 tabs** (Summary, Backtest windows w/ per-window error bars ✅ data, Candidates, Feature manifest, Leakage checks, Promotion decision, **Logs console ❌ — no per-run training log capture endpoint**). |
| Model card `/app/models/:id` | 🟡 | Model card data + SHAP-lite ✅. Missing: two-column card page (purpose/target/algorithm/training-data stats, MAPE/MAE/RMSE cards, overfit badge ✅ data, promotion badge, Retrain button) + feature-importance bar chart + **SHAP summary chart** + linked-artifacts list. |
| Model leaderboard `/app/models/runs/:id/leaderboard` | 🟡 | Trials ✅, promote ✅, challenger ✅. Missing: ranked table UI w/ select radios, **Override champion flow (promotion-gate copy: beat incumbent ≥0.5pt on ≥3 windows)**, trade-off comparison drawer + "why X won" narrative ✅ partial (trade_off_summary in arch; check exposure), **window-comparison toggle (mean vs per-window)**. |
| Feature manifest viewer `/app/models/features/:id` | 🟡 | Manifests ✅ (list/patch). Missing table UI: derivation tooltips, encoding, imputation, leakage badge, importance mini-bars, dropped flag, approval status. |
| Retrain center `/app/models/retrain` | 🟡 | Retrain + drift monitor ✅. Missing: queue UI w/ filter chips (Scheduled ❌ — **no scheduled retrains**, Drift ✅, Manual ✅, Failed ✅), trigger-reason rows (PSI value, label shift ✅ via model_monitor), per-row Retrain now. |

---

## 12. Gold layer & contracts (PRD §13; mockup `Gold Contracts`)

| Screen | Status | Gap detail |
|--------|--------|-----------|
| Gold tables `/app/gold` | 🟡 | Gold tables exist per session (`/api/modeler/gold/:sessionId`). Missing: **workspace-wide gold catalog endpoint + screen** (name, session, grain, version, creator, rows, gate status, linked model/artifact, warehouse location). |
| Gold table detail `/app/gold/:id` | ❌ | Header (IMMUTABLE badge ✅ trigger exists, "Query in warehouse") + 7 tabs (Overview, Schema, Quality gates — named gates like Row count band / Grain uniqueness / **Revenue reconciliation ❌** / Null contract / Time coverage / PII scan, Lineage, Artifacts, Feature manifest, Query contracts). |
| Query contracts `/app/contracts/queries` | ❌ | Admin table per component: expected shape, SQL safety badge, execution status incl. REPAIRED, row limit vs cap, time-filter check, result-shape validation. **Backend has no per-component query-contract records** (arch §7.2 schema) — queries run inside pipeline simulation without persisted contracts. |
| Data contracts `/app/contracts/data` | 🟡 | Table-level contracts ✅ (required fields, SLA, BLOCK). Missing: admin screen (failure counts 30d, blocking-now state, affected-artifacts expandable list) and **per-component post-execution data contracts** (arch §7.3: actual columns, null/distinct counts, ranges, sample rows, empty_result) which also gate §7.10.2. |

---

## 13. Alerts & subscriptions (PRD §14; mockup `Alerts.dc.html`)

| Item | Status | Gap detail |
|------|--------|-----------|
| Alerts center `/app/alerts` | 🟡 | `GET /api/alerts` returns system-generated alert rows (health/drift/freshness) and S12 lists them raw. Missing: dedicated screen, filter chips by 7 alert types, status (FIRING/OK/MUTED), last-triggered, **mute toggles ❌**. |
| Create alert `/app/alerts/new` | ❌ | Wizard: metric/artifact selector, condition builder (operator + value, e.g. `< forecast −8%`, by-dimension scope), check frequency, delivery channels (email ✅ outbox / **Slack ❌**), **mute rules (max n per dimension per 24h) ❌**, owner selector. Backend: per-artifact threshold subscriptions ✅ (`POST /artifacts/:id/subscriptions`) but **no standalone alert-rule CRUD, no percent-change WoW/MoM operators, no dimension-scoped conditions, no frequency config**. |
| Alert detail `/app/alerts/:id` | ❌ | Trigger-history timeline w/ delivery status per channel (**delivery tracking ❌**), trigger-logic summary, subscribers list, linked artifacts, mute 24h/edit/delete. Arch §10.7 also requires **mute for 1/7/30 days from the notification itself ❌** and deep links pre-filtered to the triggering dimension ❌. |

---

## 14. Collaboration (PRD §15; mockup `Collaboration.dc.html`) — **entire area ❌ (frontend + backend)**

| Item | Status | Gap detail |
|------|--------|-----------|
| Comments inbox `/app/comments` | ❌ | Tabs (Assigned to me / Open / Resolved / Mentioned me), comment rows w/ artifact link chips. **No comments model anywhere** (annotations exist but are data-point notes, not threaded discussion). |
| Artifact comments drawer | ❌ | Threaded replies, chart-section-anchored groups, resolve toggles, @mentions, **"Convert to generation request" and "Ask AI to apply"** actions (design's chat-loop tie-in). |
| Team members `/app/team` | ❌ | Roster table (name/avatar, role, workspace access, last active, invite status), seat usage ("18 of 25 seats"). **No users-list/roster endpoint, no last-active tracking, no seat model.** |
| Invite members `/app/team/invite` | ❌ | Email-chip multi-invite, role dropdown, explore-access multi-select (explore ACLs ✅ exist to attach to), artifact-access multi-select, admin toggle, remaining-seat counter. **No invitation model (tokens, pending state, emails).** |

---

## 15. Admin & enterprise control plane (PRD §16; mockups `Admin`, `Admin Security`, `Admin Usage`)

| Screen | Status | Gap detail |
|--------|--------|-----------|
| Admin overview `/app/admin` | ❌ | 9 stat cards (Users, Roles, Integrations w/ credential-expiring flag, Governance backlog, Audit events 24h, Token usage %, Security warnings, Active share links, SSO status). Data partially derivable; several sources missing (users count, token metering, security-warning synthesis). |
| Roles & permissions `/app/admin/roles` | ❌ | Matrix: 7 roles × 9 permissions w/ SENSITIVE markers, custom roles ("+ Custom role"), changes audit-logged. **Backend has only header-role + restrict-only ACLs — no role registry, no permission matrix, no custom roles.** |
| SSO settings `/app/admin/sso` | ❌ | SAML 2.0 fields (IdP URL, entity ID, X.509 cert), OIDC alternative, domain verification w/ status, default-role dropdown, session lifetime, "Test login", ENFORCED state. **No SSO backend.** |
| Workspace branding `/app/admin/branding` | 🟡 | Branding API ✅ + S12 form ✅. Missing: designed two-column live-preview page (dashboard header / share page / email digest previews), logo upload asset pipeline, theme scope selector (artifact/share/email). |
| Secrets & credentials `/app/admin/secrets` | 🟡 | Secrets provider ✅ + encrypted storage ✅. Missing: admin table UI (masked credential, rotation date, last used ❌ not tracked, failure badge, permissions summary) + **Rotate action ❌ + rotation policy (audit mock shows automatic 90-day rotation) ❌**. |
| Usage & cost analytics `/app/admin/usage` | ❌ | Rendered *as a native dashboard*: KPI row (pipeline runs ✅ derivable, **LLM calls / tokens ❌ — no token metering anywhere**, warehouse query time 🟡 latency logs exist), artifact views over time (**no view tracking**), training-cost trend ❌, top-users-by-consumption table ❌, cost-by-area donut ❌. Arch §14.2 requires **LLM call logging w/ token counts + 90-day prompt retention ❌**. |
| Audit log `/app/admin/audit` | 🟡 | Append-only audit rows + `GET /api/audit-logs` (resource/action filters) ✅. Missing: screen w/ event-type/actor/**date-range/severity ❌ (no severity column)** filters, **Export CSV/JSON ❌**, event naming taxonomy (`model.promote`, `share.create`, `auth.failed` w/ lockout events ❌ — no failed-login tracking/lockout). |
| Sharing governance `/app/admin/sharing` | ❌ | Org policy panel: public-links allowed toggle, **max link expiration, embed allowed-domains registry, external-viewers toggle, cross-workspace sharing toggle, permitted token scopes** — none enforced server-side today (links/tokens are created without policy checks). |
| Row-level security `/app/admin/rls` | ❌ | Policy table (explore, rule expression, ON/DRAFT status) + **"Test as user" simulator** rendering a dashboard as that user (region-filtered, margin hidden, PII masked). **No RLS engine, no policy model, no impersonated preview** (arch §14.1 RLS pass-through also unimplemented — flagged only in PII masking). |

---

## 16. Billing & tokens (mockup `Billing.dc.html` — added scope beyond PRD §17; marketing Pricing implies same)

| Item | Status | Gap detail |
|------|--------|-----------|
| Plan & seats `/app/billing` | ❌ | Stripe checkout/portal/webhook endpoints exist as stubs (org has `stripe_customer_id`/`stripe_subscription_id`). Missing: plan page (current plan card, renewal, seats used/total w/ per-extra-seat price, included-token meter w/ projection, current-cycle line items, plan-comparison grid w/ Downgrade/Upgrade/Talk-to-sales), **plan catalog + entitlements model (Starter/Team/Business/Enterprise feature gating — e.g. predictive models and public links off on Starter)**. |
| Token usage & limits `/app/billing/usage` | ❌ | Cycle meter w/ projection, **consumption by capability (generation/validation/insights/profiling) ❌**, daily consumption chart, top consumers (incl. "Scheduled refreshes" as a system consumer), **soft alert thresholds (50/75/90%) w/ admin email+Slack ❌, hard cap at 90% pausing new builds (viewing stays free) ❌, pay-as-you-go overage $8/100K ❌**. No token accounting exists at all. |
| Invoices & payment `/app/billing/invoices` | ❌ | Payment-method cards (default/remove/add: card, ACH, invoice-on-enterprise), invoice table w/ status + **PDF downloads**, billing contact + tax ID, invoice settings (email invoices, usage breakdown, PO number). |

---

## 17. Settings, help & errors (PRD §17; mockups `Settings`, `Errors`)

| Item | Status | Gap detail |
|------|--------|-----------|
| User settings `/app/settings/profile` | 🟡 | S11 covers login only. Missing: avatar upload ❌ (no user avatar model), name/email edit ❌, change-password ❌ (and "managed by SSO" state), **notification preference toggles ❌ (alert deliveries / mentions / weekly digest — digest itself ❌)**, default workspace ❌. |
| Personal preferences `/app/settings/preferences` | ❌ | Default date range, dashboard theme, chart density, **technical-detail visibility toggle** (pairs with admin-only blocks), **prompt-style dropdown (clarify vs recommended vs always-confirm — backend adaptive threshold ✅ exists to wire to)**. No user-preferences store. |
| API keys `/app/settings/api-keys` | ❌ | Named keys w/ **scopes (e.g. `artifacts:read`, `export`, `embed:sign`), expiry, last-used, revoke** + creation modal. Auth tokens exist but are session logins, not scoped API keys. |
| Help center `/app/help` | ❌ | Category nav + article search + article cards + persistent "Contact support" widget. No help content system. |
| Error pages | ❌ | 8 designed variants (404, 403, token expired, workspace not found, artifact unavailable, **pipeline failed w/ "Retry from stage N"**, connector failed w/ open-connector CTA, data access denied w/ RLS explanation). Client has no error routes/states; API 404/500 handlers exist. |

---

## 18. Consolidated backend gaps implied by the UI design

Everything the mockups/PRD render that has **no supporting backend today**, deduplicated:

**Identity & org**
1. SSO: SAML 2.0 + OIDC config, domain verification, enforcement, default role, session lifetime, test-login; Google/Microsoft OAuth login. (PRD 4.1/16.3)
2. Magic-link login; forgot/reset password; email verification; failed-login tracking + lockout (audit mock `auth.failed … locked 15m`).
3. Multi-workspace model: workspace CRUD, membership, switcher data, default workspace, cross-workspace sharing controls; almost everything is hardcoded `default`/single-org today.
4. Team roster + last-active tracking; invitation lifecycle (token, pending, resend, seat check); seats model.
5. Role registry + permission matrix (7 built-in roles, custom roles, SENSITIVE permissions), replacing header-trusted roles.
6. User profile (name, avatar asset), notification preferences, personal preferences store; weekly digest job.
7. Scoped API keys (scopes, expiry, last-used, revoke).

**Collaboration & messaging**
8. Comments: threads, replies, section anchoring, resolve state, @mentions, assignment; inbox queries; "convert to generation request" / "ask AI to apply" bridge into sessions.
9. Notifications: model + unread state + mention fan-out + mark-all-read + bell badge counts; grouping by day.
10. Slack integration (alert delivery, share-to-Slack, digest) — zero Slack code exists; email exists via outbox/Resend only.
11. Workspace-wide activity feed (typed events joined across builds/governance/sharing/team).

**Alerts**
12. Alert-rule CRUD independent of artifacts: condition builder (operators incl. % change WoW/MoM), dimension scope, check frequency, owner; mute rules (per-dimension caps, quiet hours, 1/7/30-day mutes); delivery tracking per channel; trigger-history persistence; deep links pre-filtered to triggering dimension. Today: system alert rows + per-artifact threshold subscriptions only.

**Sharing & distribution**
13. Embed render route (`/embed/:token`) + server-side `allowed_origins` enforcement + per-token domain allowlist storage; public-viewer page serving w/ password gate + branded shell + request-access flow.
14. Per-link/token permission flags: allow comments, drill-through, data export; scope levels (read-only/interactive/admin); org-level sharing policy enforcement (max expiry, domains, external viewers, permitted scopes).
15. PDF and PNG export (HTML/CSV/JSON exist); "Export graph" for lineage.
16. Artifact duplicate; artifact version restore + version compare; recently-viewed + view-count tracking (also feeds ROI weights and library "Last viewed" column).
17. Folders for artifacts.

**Data & governance plumbing**
18. Connector-scope selection (schema/table checklist) at setup; per-source owner; sync logs.
19. REST source: test-response preview, pagination config, JSON-path mapping, OAuth 2.0 auth.
20. Webhook: signing-secret verification, payload-schema validation w/ failure reasons, send-test-event.
21. dbt: git-repo connect, selective model→explore mapping.
22. Upload: per-column type overrides before commit.
23. Editable business definitions on tables/columns (PATCH) with review trail.
24. Rule enable/disable state; "Request changes" state on reviews; review assignment.
25. Pre-agg lifecycle: approve/materialize/dismiss, auto-materialize, cost ceiling, ROI estimates, invalidation on major manifest bump.
26. Bridge-table recommendation workflow (from blocked m:n → steward queue → generated bridge).
27. Field-picker support: capped preview query endpoint, per-measure 7-day sparkline, live fan-out/cardinality warnings.
28. Metric extras: allowed-filter dimensions, metric tests, deprecation state, owner, propose-change flow.
29. Workspace-wide gold catalog + gold detail (incl. reconciliation gate); per-component **query contracts** and post-execution **data contracts** persisted and queryable (arch §7.2/§7.3) — prerequisite for Inspector Data tab and Contracts screens.
30. Governance-manifest approval state.

**Commercial**
31. Token metering (per capability, per user, per system job), plan catalog + entitlement gating, soft thresholds + hard cap + overage billing, invoices + payment methods + PDF, billing contact/tax/PO. Stripe stubs exist; the metering/entitlement layer does not.

**Ops**
32. Audit: severity, date-range/actor filters, CSV/JSON export, SIEM streaming (Enterprise); event taxonomy alignment.
33. Secret rotation action + policy + last-used/failure tracking.
34. Training-run log capture + console endpoint; scheduled retrains (cron per model).

---

## 19. Evolution Roadmap (Architecture Part XVII) — all 35 enhancements vs. workspace

Backend status verified against modules/endpoints/tests; UI status against the 14 screens. "UI per design" means the surface the mockups/PRD imply (mostly the Platform/Workbench/Admin screens).

| # | Enhancement (rating) | Backend | UI | Gap notes |
|---|----------------------|---------|----|-----------|
| 1 | Artifact DAG execution (10) | ✅ `dag.py`, content-addressed nodes, `/pipeline/:run/dag` | 🟡 raw JSON-ish view | No DAG visualization per node/edge with cache-hit badges. |
| 2 | Persistent agent memory (10) | ✅ `agent_memory.py` (+PII gate, decay) | 🟡 S11 list/delete | No per-preference-category management, no "memory informed this plan" surfacing in chat. |
| 3 | Opportunity Engine (10) | ✅ `opportunity.py`, evaluate/accept/dismiss | 🟡 S10 buttons | No opportunity cards panel below artifact; no accept→new-session UX. |
| 4 | Cost-aware orchestration (10) | ✅ `orchestrator.py` cost ladder + dispatch telemetry | 🟡 S12 dispatch list | No cost/latency annotations surfaced per pipeline run; no tier-routing visibility in workbench. |
| 5 | Multi-agent collaboration (9.8) | ✅ `agent_bus.py` consultations logged | 🟡 S12 list | Not shown as first-class events in pipeline progress UI. |
| 6 | Self-improving platform (9.8) | ✅ `self_improve.py` signal routing | 🟡 S12 signals + run button | No signal→consumer visualization; scheduled background run ❌ (manual trigger only). |
| 7 | Explainability Engine (9.7) | ✅ `/artifacts/:id/explain` composition | 🟡 S10 button dumps JSON | PRD-level "explain affordance on every number/chart/prediction" ❌; no explain drawer w/ lineage→SQL→bindings→model card. |
| 8 | Confidence propagation (9.6) | ✅ `confidence.py`, artifact columns | ❌ | Low-confidence visual flag state on dashboards ❌; per-stage breakdown popover ❌. |
| 9 | Event-driven execution (9.5) | ✅ `events.py` + `/platform/events` | 🟡 S12 emit/list | No trigger-rule management UI (schema-change→recompute, drift→retrain, business events). |
| 10 | Unified Artifact Store (9.5) | ✅ `uas.py` (+versions) | ❌ | No store browser; no version chips on artifacts. |
| 11 | Workspace knowledge graph (9.5) | ✅ `knowledge_graph.py`, related/co-analysis, rebuild | 🟡 S06 related chips | No graph explorer; "other teams analyze this" ❌ (single-user demo). |
| 12 | Automatic semantic evolution (9.4) | ✅ `semantic_evolution.py` + proposals approve/reject | ✅ S05 panel | Merge-candidate detection into AI-review flow 🟡 (proposals exist; merge class present but thin). |
| 13 | Automatic benchmark library (9.4) | ❌ (only `popular_metric` signal routed toward it) | ❌ | No benchmark reference sets, no historical/peer/budget/seasonality comparisons on metrics. |
| 14 | Enterprise plugin architecture (9.3) | ❌ | ❌ | No extension points, validator/mark/model-trainer registries. |
| 15 | Artifact replay/debugger (9.3) | ✅ `/pipeline/:run/replay` (failed attempts retained) | 🟡 S10 button | No step-through debugger UI with per-node intermediate artifacts. |
| 16 | Parallel stage execution (9.2) | ✅ (R9S1, concurrency budget `PUT /platform/concurrency`) | 🟡 | No per-workspace concurrency admin UI beyond raw endpoint. |
| 17 | Adaptive planning agent (9.2) | ✅ threshold endpoints + intent-history input | ❌ | Novice/expert behavior not visible in any chat UI (no chat UI); per-user tuning screen ❌. |
| 18 | Meta-orchestrator (9.2) | ✅ `meta_orchestrator.py` decisions/override/reprioritize | 🟡 S12 | Platform-level alert on repeated repair exhaustion not surfaced as notification (no notifications). |
| 19 | Simulation/sandbox mode (9.1) | ✅ sandbox namespace + promote | 🟡 S10 toggle+promote | No sandbox workspace switcher/badging per design conventions. |
| 20 | Autonomous optimization jobs (9.1) | ✅ `optimizer.py` proposals + approve/reject | ✅ S12 panel | Periodic scheduling ❌ (manual scan). |
| 21 | Real-time observability dashboard (9.0) | 🟡 logs/metrics/cache/jobs endpoints | 🟡 S12 console | Not delivered "as a native AnalytIQ artifact"; no DAG-node latency/token/cost panels (no token telemetry). |
| 22 | Intelligent caching hierarchy (9.0) | ✅ `cache_hier.py` 4 layers | 🟡 S12 stats | Fine — surfacing only. |
| 23 | Artifact diff engine (8.9) | ✅ `diff_engine.py` 4 kinds | 🟡 S05 schema diff only | Dashboard-version side-by-side visual diff ❌. |
| 24 | Dashboard health scoring (8.9) | ✅ `dashboard_health.py` 5 components | 🟡 S10 button | No workspace quality board; no redundancy-vs-KG flagging surfaced. |
| 25 | Automatic narrative generation (8.8) | ❌ | ❌ | Needed by canvas narrative blocks, presenter notes, exec digests, solutions-page "Monday 8am digest". |
| 26 | Recommendation feedback loop (8.8) | ✅ `feedback_loop.py` (3-dismissal suppression) | 🟡 S12 acceptance rates | OK demo parity. |
| 27 | User intent history graph (8.7) | ✅ `intent_history.py` + warm start | ✅ S06 warm-start chips | OK demo parity. |
| 28 | Organizational knowledge reuse (8.7) | ✅ `knowledge_reuse.py` + apply-candidate | ✅ S06 reuse chips | Re-validation on apply 🟡 verify. |
| 29 | Continuous model monitoring (8.6) | ✅ `model_monitor.py` (importance/input drift) | 🟡 S10/S14 buttons | No monitoring dashboard; drift→event→retrain automation 🟡 (event exists; scheduler ❌). |
| 30 | AI-assisted governance review (8.6) | ✅ `governance_review.py` ranked queue | ✅ S05 | OK demo parity. |
| 31 | Intelligent viz experimentation (8.5) | ❌ | ❌ | Also required by Inspector "Replace with…" suggestion cards. |
| 32 | Natural-language artifact editing (8.5) | ❌ | ❌ | Core to Create Workbench follow-up loop ("Why is Northeast down?", "Add promo overlay") and §7.9 edits; artifacts are immutable render outputs today. |
| 33 | Template marketplace (8.4) | 🟡 session templates CRUD | ❌ | No parameterized plan re-resolution across workspaces, no packaging/sharing, no gallery. |
| 34 | Automated ROI tracking (8.3) | ✅ `roi.py` weighted signals + report | 🟡 S10 button | View-signal is thin (share-link views only; no in-app view tracking); ROI "delivered as native artifact" 🟡. |
| 35 | Business process integration (8.3) | ❌ | ❌ | No outbound Jira/Slack/Teams/email workflow triggers from insights/alerts; no outbound-credential model. |

**Summary:** 26/35 have backend implementations (mostly demo-grade with local fallbacks), 9 are absent (#13, #14, #21-as-artifact, #25, #31, #32, #33-marketplace-form, #35, plus scheduled automation for #6/#20/#29). **UI surfaces for nearly all 35 are missing or raw-console-grade** — the mockups' polished surfaces (explain drawers, confidence flags, opportunity cards, DAG viewer, observability artifact) are unbuilt.

---

## 20. Architecture v2.1 core-pipeline deltas (Parts I–XIV, beyond the UI)

Implementation-implied gaps that the UI design assumes but the current engine handles differently:

| Area | Arch requirement | Current state |
|------|------------------|---------------|
| Chart rendering | Vega-Lite v5 specs, schema-validated, Vega-Embed at render, no inline data, CSS-var theming, config-only colors (Part VIII) | Recharts in-app; artifacts are self-contained HTML w/ **inline SVG + baked-in data** — violates no-data-embedding + regenerability; no Vega-Lite anywhere. |
| Critic & repair (Stage 8) | Skeptical critic agent + targeted repair instructions + repair-loop limits (Part X.10.1–10.3) | **No critic stage** (0 references). Repair loops exist for DQ/queries only. |
| Artifact runtime | Data fetched at load from gold API, skeleton loaders, per-panel error cards + retry, dark mode auto, aria labels, <250KB, 680px embed compliance, `window.__analytiq_state` + cross-filtering + drill-through drawer w/ CSV + URL-hash drill state (Part VIII.8.5, X.10.4–10.5) | Static baked artifact; drill endpoints exist server-side (insight drill), but no cross-filter/drill-drawer runtime, no skeletons/error cards/dark mode in artifact, no post-assembly validator ruleset. |
| Human checkpoints | 3 mandatory checkpoints incl. mid-pipeline `human_required` SSE pauses w/ decision cards (Part II.2.2, XII.12.4) | Plan confirm exists (S07); low-confidence review exists pre-pipeline; **medium-leakage hold is a separate manual call, not a pipeline pause**; no `human_required` SSE decision cards. |
| Streaming protocol | 10 event types incl. `session_planning`, `repair_cycle`, `background_insights/suggestions`, `pipeline_error` w/ remediation (XII.12.4) | Core subset implemented (`planning/agent_start/dq_gate/human_required*/agent_complete/artifact_ready`); repair/background/insight event classes 🟡. |
| Query layer | Warehouse proxy w/ credential injection, dialect-aware SQL, 120s limit, row limits 10k/50k/100, Redis cache w/ freshness-keyed TTL (Part VII) | Simulated warehouse (SQLite), dialect layer ✅ (`warehouse.py`), local cache ✅; real proxy/credentials/limits ❌ by design (demo). |
| Real agents | 14 Claude-powered agents (XII.12.1) | Entire agent layer is deterministic simulation — acceptable for demo, but every "agent prompt" in Parts III–X is unimplemented against a real LLM. |
| Insight detection | 4 statistical classes w/ 60s SLA, dismissal-resurface rule (+20% signal) (V.5.5) | Insight scan ✅ (classes 🟡 verify coverage), 60s async delivery + resurfacing rule ❌. |
| Suggestions | 5 typed follow-ups, health<60 suppression (V.5.6) | Suggestions ✅; type taxonomy + suppression 🟡. |
| Annotations | Right-click creation w/ grain capture, 5 categories, marker rendering on charts, show/hide toggle, ML feature injection offer (X.10.6) | API ✅ (create/list); **chart marker rendering, categories UI, ML-injection offer ❌**. |
| Refresh & drift | Cron refresh w/ timezone, pause; health-drop pause + owner notify; one-click retrain w/ archived predecessor (XI.11.3) | Schedules ✅, drift ✅, retrain ✅; refresh-pause on source-health drop + owner notification 🟡 (no notifications). |
| Model training | Optuna search, SMOTE, ONNX/MLflow registry, async >1M rows w/ email+Slack notify (IX, XIII) | scikit-style training ✅ w/ walk-forward ✅, trials ✅, registry table ✅; Optuna/SMOTE/ONNX/async-notify ❌ (demo-scale). |
| AuthN/AuthZ | OAuth 2.0 PKCE, 1h access + 30d rotating refresh tokens, ABAC (XIV.14.1) | Static bearer tokens, restrict-only ACLs; no refresh rotation, no ABAC. |
| Performance targets | P50/P95/P99 table (XIII.13.3) | Untested — no load/perf harness. |
| Observability | OpenTelemetry traces, ELK logs, per-run trace_id (XIII.13.2) | Structured request logs + latency ✅ local; no tracing. |

---

## 21. Features implied by other features (verification pass — items not explicit as screens but required for the documents to hold together)

These surfaced from the final cross-read of all three sources and the mockups' data details:

1. **Session file-context uploads** — the workbench mock attaches `q3_targets.xlsx` inside a session and joins it against warehouse data ("42/42 locations matched"). Requires session-scoped file ingestion + auto-join matching, distinct from connection-level uploads. ❌
2. **PII exclusions surfaced in plans** — plan card row "ACCESS: 2 PII columns excluded (masked)" implies plan payloads carry masked-column disclosure; also mid-build amber callouts naming masked columns and steward-ping when a question *needs* those fields (Docs quickstart). ❌
3. **Steward ping loop** — "a steward is pinged" (Docs) ⇒ notification + review-queue item triggered from a session. ❌
4. **Autosave + governed badge in workbench top bar** ("autosaved 12s ago", GOVERNED, session id chip). ❌
5. **Per-section contract badges on canvas** ("CONTRACT ✓" on chart cards) ⇒ per-component data-contract lookups at render (§18-29). ❌
6. **"What's driving the forecast" strip** — feature chips + link to model card on the forecast section ⇒ per-artifact model-card affordance. 🟡 (data exists; surface ❌)
7. **Editable narrative synced with versions** — narrative block is user-editable ("Cite the flagship closure date" comment → edit) ⇒ narrative is content, versioned with the artifact, and comment-addressable. ❌
8. **Seat math across features** — invite modal shows "2 of 7 remaining seats · manage seats" linking billing ⇒ seats are enforced at invite time and surfaced from the plan (§16 + §14 coupling). ❌
9. **Token attribution to scheduled refreshes** — billing "Top consumers" lists "⚙ Scheduled refreshes" ⇒ metering must attribute system jobs, not just users. ❌
10. **Plan-based feature gating in UI** — pricing/billing plan checklists (e.g. Starter lacks predictive models + public links; Team lacks SSO/RLS/audit export) ⇒ entitlement checks in both API and nav rendering. ❌
11. **Trial state** — register promises a 14-day trial ⇒ trial countdown/expiry behavior. ❌
12. **Workspace switcher with multiple memberships** (top bar) ⇒ users↔workspaces many-to-many + per-workspace roles. ❌
13. **Search shortcut ⌘K + recent/suggested results** in every app frame. ❌
14. **Unread badge counts** on the bell in every frame ⇒ cheap unread-count endpoint. ❌
15. **Freshness badges on shared surfaces** — public viewer "DATA 3H OLD" ⇒ freshness computation exposed to tokenized viewers. 🟡
16. **Request-access flow** from public viewer + RLS-denied error page ⇒ access-request objects + owner notification + grant path. ❌
17. **"Fork from here" per pipeline stage** (Inspector audit + arch §6.4) ⇒ step-scoped session forking (whole-session fork exists). 🟡
18. **Insight "Investigate" → pre-seeded session** (PRD 7.10.4 + arch §5.5) — drill endpoint exists; needs UX + spec pre-seed verification. 🟡
19. **Suggested analyses on Home "+" chips** ⇒ workspace-level (not session-level) suggestion source. ❌
20. **Weekly digest email** (settings toggle + solutions-page "Monday 8am digest") ⇒ digest generator using narrative engine (#25) + scheduler. ❌
21. **Holiday/calendar joins** — feature engineering `is_holiday via calendar join` ⇒ calendars ✅ exist (`/api/calendars`); wiring into feature engineering 🟡.
22. **Present-mode notes come from narrative** — presenter notes labeled "auto-generated narrative" ⇒ #25 is a dependency of §8.5 present mode. ❌
23. **Champion override audit event** — arch §9.5: overrides logged as first-class audit events ⇒ audit taxonomy entry + UI copy. 🟡
24. **Bulk owner notification on lineage impact** (arch §11.4) ⇒ notifications + bulk email fan-out. ❌
25. **Rate-limited public gold API** — arch §11.2: 100 req/hr per artifact on share links (limiter exists globally at 60/min for public route — per-artifact quota ❌). 🟡
26. **View-count tracking on share links** — ✅ implemented (schema `view_count` + increment on public view); surfacing in admin "Active share links" and library "Last viewed" ❌; per-user in-app recently-viewed still ❌.
27. **Manifest major-version bump → dependent artifact owner notification** (arch §3.3 schema-fingerprint gate). 🟡 (drift alerts exist; owner notify ❌)
28. **"Needs review" artifact library filter** implies artifact-level review state distinct from health. ❌
29. **Device preview + fit-width + zoom persistence** on canvas toolbar ⇒ per-user canvas view state. ❌
30. **SIEM streaming (Enterprise)** from marketing security page ⇒ audit-event webhook/stream export. ❌
31. **Changelog page** (marketing footer "Changelog") ⇒ publishable release notes page. ❌
32. **Legal/company pages** (footer: About, Careers, Contact, Legal; SOC 2/ISO/GDPR claims pages). ❌
33. **`design_doc_mode` canvas boards are prototypes only** — `support.js`/`export-src` confirm the deliverable is HTML boards, not componentized code: no reusable React implementation of the design system exists anywhere yet. ❌

---

## 22. Prioritized closure sequence (suggested)

1. **Foundation (unblocks everything):** React Router + app shell (sidebar/topbar/drawer) + design tokens/components per PLAN.md design language (badges, tables, cards, tabs, modals/drawers) + role-aware rendering.
2. **Flagship:** Create Workbench 3-column (chat thread over existing SSE, canvas w/ 13 section types, inspector tabs) + plan-confirmation card + clarification chips + canvas edit endpoints (#7.9, Evolution #32).
3. **Contracts substrate:** persist per-component query/data contracts (arch §7.2/7.3) — prerequisite for Inspector Data tab, Contracts screens, per-section badges.
4. **People layer:** notifications, comments, team/invites/seats, roles matrix — largest pure-backend hole; nearly every mock frame references avatars/mentions/counts.
5. **Distribution:** public viewer page, embed route + origin enforcement, PDF/PNG export, present mode (needs narrative #25), sharing-governance policies.
6. **Enterprise:** SSO, RLS + simulator, audit export/severity/SIEM, secrets rotation, usage/cost + token metering + billing UI (Stripe wiring exists).
7. **Design-surface the Evolution backend:** explain drawer, confidence flags, opportunity cards, DAG/replay viewers, observability-as-artifact — high demo value, backend already done.
8. **Remaining evolution absences:** narrative generation (#25), benchmarks (#13), viz experimentation (#31), NL editing (#32), plugins (#14), process integration (#35), marketplace (#33).

---

*Generated 2026-07-03 by cross-reading `AnalytIQ_UI_PRD.md`, all 40 files in `AnalytIQ UI Requirements Document.zip`, `AnalytIQ_Architecture_v2_1_with_Evolution_Roadmap.docx` (Parts I–XVIII), and the full `client/` + `server/` + `tests/` tree.*
