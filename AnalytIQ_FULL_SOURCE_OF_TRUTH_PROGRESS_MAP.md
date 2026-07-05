# AnalytIQ Full Source of Truth — Consolidated Progress Map

**Generated:** 2026-07-04 / 2026-07-05 source snapshot · **Refreshed:** 2026-07-05 (post-R32 close)  
**Purpose:** One consolidated operating document for AnalytIQ progress, scope, delivery status, release hierarchy, sprint hierarchy, epic hierarchy, verification gates, and remaining work.  
**Canonical active position:** **UI Parity & Build-Out Program (PRD v1.0) · R33 · Sprint R33S1 · Epic E1 (models) · R33S1E1-US1 — Models overview**.  
**Latest known suite state:** **backend 440/440 · UI 153/153 · build + lint green** after RELEASE R32 closed (2026-07-05).  
**Current blocker status:** **None recorded.**  

---

## 1. Source Authority & Reconciliation Rules

This consolidation is not a new plan invented from scratch. It reconciles the uploaded source files into one source of truth.

### 1.1 Source documents used

| Source file | Role in this consolidation | Authority level |
|---|---|---|
| `RELEASE_PLAN.md` | Structural source of truth: Release → Sprint → Epic → User Story → AC → Tasks. Defines fallback rules, story IDs, release maps, and future sequencing. | Highest for hierarchy and intended scope. |
| `PROGRESS.md` | Status source of truth: completed stories, current active story, latest regressions, zero-key boot notes, blockers, adaptations, session stop notes. | Highest for status. |
| `GAP_CLOSURE_PROMPT.md` | Execution-method source: strict TDD loop, managed-tool fallback rule, logging, progress update discipline. | Highest for process. |
| `GAP_ANALYSIS_UI_PRD_v3_AND_EVOLUTION.md` | Gap-analysis source: where the old workspace was deficient against UI PRD v3.0, mockups, and Architecture v2.1 evolution roadmap. | Highest for gap rationale. |
| `AnalytIQ_UI_PRD.md` | Product UI scope source: all screen families, routes, and visual composition requirements. | Highest for UI product requirements. |
| `UI_MOCKUP_ANALYSIS.md` | Mockup-extraction source: exact design system, route map, and file-by-file frame analysis of the `.dc.html` mockups. | Highest for visual anatomy and frame inventory. |
| `GAP_ANALYSIS_DESIGN_PARITY_CHECKLIST.md` | Exact-design conversion checklist: tokens, typography, geometry, icons, visual diff expectations, R21+ design parity scope. | Highest for design parity Definition of Done. |
| `PLAN.md` | Committed UI build plan and design language summary: fonts, tokens, shell, buttons, badges, tables, screens checklist. | Supporting design contract. |
| `PARITY_REPORT.md` | Live parity scoreboard from `tests/ui/parity/parity.spec.js`: frame status and first detected gaps. | Highest for PAR-1 frame scoreboard snapshot. |

### 1.2 Reconciliation decisions

1. **`RELEASE_PLAN.md` defines the hierarchy; `PROGRESS.md` defines whether each item is complete.** If a release is still labeled "pending" in the plan but marked complete in progress, progress wins for status.
2. **The active program is R30–R36.** Earlier `R21–R29` design-parity numbering was partially executed, partially retired, and then replanned into the canonical **UI Parity & Build-Out Program R30–R36**.
3. **R21 is complete.** R22 is closed early: only workspace home shipped; remaining R22 scope was transferred into R30/R31.
4. **R13/R14 evolution completion had a label incident.** Some completion work was delivered under stray `R21/R22` labels and later reconciled back to R13/R14.
5. **R15–R20 UI-PRD Gap Program is complete at demo-grade parity, but several final-polish UI surfaces remain in R30–R36.** This is not a contradiction: R15–R20 made the product structurally functional; R30–R36 is the final PRD/mockup parity pass.
6. **Deferred does not mean forgotten.** Deferred items from earlier UI-gap closure are remapped into R30–R36 where appropriate.
7. **Zero-key boot remains a non-negotiable global rule.** Every managed-tool integration must run with local fallback when external credentials are absent.

---

## 2. Executive State of the Program

### 2.1 Program status dashboard

| Program slice | Releases / scope | Status | Notes |
|---|---:|---|---|
| Backend Gap-Closure Foundation | R1–R7 | ✅ Complete | 221 backend tests green at that milestone; zero-key boot verified. |
| First UI Surfacing Pass | UI1–UI5 | ✅ Complete | Surfaced backend R1–R7 in Account, Platform, Governance, Models, Sessions/Artifacts. |
| Evolution Program | R8–R14 | ✅ Complete | 35 Architecture Part XVII enhancements mapped; R8–R12 complete; R13/R14 reconciled complete. |
| UI-PRD Gap Program | R15–R20 | ✅ Complete | Router, shell, workbench, contracts, people layer, distribution, enterprise demo-grade parity. |
| Design-System & Shell Parity | R21 | ✅ Complete | Tokens, primitives, icons, sidebar/topbar/page chrome, notifications drawer. |
| Core App Screens | R22 | ⚠️ Closed early / superseded | Workspace home delivered; activity/artifacts/detail transferred into R30/R31. |
| UI Parity & Build-Out | R30–R36 | 🔥 Active | R30, R31, R32 closed. 32 stories complete out of 64 planned final-program stories — program halfway. |
| Current active story | R33S1E1-US1 | 🔥 Active | Models overview (`/app/models`, replaces S14) in the Prediction & Distribution release. |

### 2.2 Current active execution point

```text
AnalytIQ
└─ UI Parity & Build-Out Program — PRD v1.0
   └─ Release R33 — PRD Phase 4: Prediction & Distribution
      └─ Sprint R33S1 — Models & model ops
         └─ Epic R33S1E1 — Models overview
            └─ Story R33S1E1-US1 — ACTIVE
```

### 2.3 Latest verified suite status

| Check | Latest status |
|---|---:|
| Backend regression | 440 / 440 green |
| UI regression | 153 / 153 green |
| Build | Green |
| Token lint wall | Green |
| Latest closed story | R32S2E3-US1 Field picker + join paths + derived tables |
| Latest closed sprint | R32S2 closed: 3/3 stories |
| Latest closed release | R32 CLOSED 2026-07-05 — zero-key boot passed, 8 services local, client shell 200 |
| R33 overall | 0/9 stories complete (just starting) |
| R30–R36 overall | 32/64 stories complete — program halfway |

---

## 3. Global Operating Principles

### 3.1 Mandatory fallback rule

Every managed-tool integration follows this rule:

```text
If environment keys are present → use the real integration.
If keys are absent → automatically use local fallback.
The application must run end-to-end with zero external credentials.
```

Fallbacks include SQLite, filesystem storage, daemon-thread workers, console/outbox dispatch, in-process cache, and local/provider stubs.

### 3.2 Execution loop

Every story follows the same strict delivery loop:

1. Read story acceptance criteria and tasks from `RELEASE_PLAN.md`.
2. Identify backend/frontend gaps.
3. Write failing tests first.
4. Confirm RED.
5. Implement the story with local fallback support.
6. Confirm GREEN.
7. Run full regression.
8. Fix regressions before moving on.
9. Log the story result.
10. Update `PROGRESS.md`.
11. Do not begin the next story until the current story is fully green.

### 3.3 Design parity Definition of Done

Every UI story must obey the design system extracted from mockups:

- Tokens only: no legacy `C` palette in touched files.
- IBM Plex Sans for UI text; IBM Plex Mono for numbers, routes, badges, labels, code, timestamps.
- Exact geometry: shell, cards, tables, buttons, inputs, badges, panels, and drawers match mockup dimensions.
- SVG line icons only; no emoji chrome.
- Geometric SVG charts only; no chart library for parity mockup surfaces.
- Correct hover/active/selected/empty/loading states.
- Cross-links map to real routes.
- Existing `data-testid` hooks preserved or migrated.
- Full backend + UI regression stays green.
- Parity screenshots/checks update where relevant.

### 3.4 Product visual principle

AnalytIQ should read as **"Claude Design for dashboards"**: chat drives generation, a live canvas shows the artifact taking shape, and an inspector panel explains design, data trust, pipeline audit, insights, sharing, comments, and versions.

---

## 4. Consolidated Program Spine

```text
DONE
├─ R1–R7      Backend gap closure foundation
├─ UI1–UI5    Initial client surfacing of backend features
├─ R8–R14     Evolution Architecture v2.1 enhancements
├─ R15–R20    UI-PRD gap closure, demo-grade product structure
├─ R21        Exact shell/design-system parity
└─ R22        Workspace home delivered; remainder superseded

DONE (continued)
├─ R30        Core Loop Credibility — CLOSED 18/18 (backend 423/423 · UI 121/121)
├─ R31        First-run journey — CLOSED 5/5 (backend 425/425 · UI 135/135)
└─ R32        Governance & data trust — CLOSED 9/9 (backend 440/440 · UI 153/153)

ACTIVE
└─ R33        Prediction & distribution
   └─ R33S1E1-US1 models overview — next story, no code written yet

PENDING
├─ R34        Marketing site
├─ R35        Data layer surfaces
└─ R36        Gold, alerts, collaboration, admin, billing, settings
```

---

# PART I — Completed Backend Foundation: Releases 1–7

## Release 1 — Platform Foundation ✅

**Release goal:** establish identity, access control, secrets, jobs, storage, observability, email outbox, and search as durable platform foundations.  
**Status:** complete.  
**Verification at foundation milestone:** backend regression green; zero-key boot local services available.

### Sprint 1.1 — Identity & Access

#### Epic E1 — Auth service & identity middleware ✅

**What shipped:**

- Register/login/me API.
- Passwords stored as salted PBKDF2 hashes.
- Opaque bearer API tokens with expiration.
- Auth events audited.
- Request identity resolver prefers bearer token identity over legacy headers.
- Legacy `X-User-Role` compatibility preserved for development/test flows.

**Stories consolidated:**

- `R1S1E1-US1` — Auth register/login/me with hashed tokens.
- `R1S1E1-US2` — Bearer identity resolution with legacy header compatibility.

#### Epic E2 — Resource-level ACLs ✅

**What shipped:**

- Resource ACL table for artifact/explore/session access.
- Restrict-only semantics: ACLs can reduce default workspace access, never expand it.
- Owner/admin ACL update route.
- ACL read enforcement for restricted resources.
- ACL mutations audited.

**Story consolidated:**

- `R1S1E2-US1` — Resource-level ACLs.

### Sprint 1.2 — Platform Services

#### Epic E3 — Secrets provider abstraction ✅

**What shipped:**

- Provider interface for credential encryption/decryption.
- Local encrypted SQLite fallback.
- Managed-tool flip path for Infisical.
- Platform status reports active mode.

**Story consolidated:** `R1S2E3-US1`.

#### Epic E4 — Job queue abstraction ✅

**What shipped:**

- Durable job queue abstraction.
- SQLite fallback jobs table.
- Daemon-thread worker.
- Claim/complete/fail lifecycle.
- Retry behavior and inspectable job list.

**Story consolidated:** `R1S2E4-US1`.

#### Epic E5 — Object storage abstraction ✅

**What shipped:**

- Storage provider interface.
- Filesystem fallback.
- Stable URI + size + sha256 metadata.
- Artifact HTML write-through with compatibility row retained.

**Story consolidated:** `R1S2E5-US1`.

#### Epic E6 — Observability & email outbox ✅

**What shipped:**

- Structured request logging.
- Latency metrics including P50/P95 summaries.
- Email outbox table.
- Local queued mode when Resend credentials are absent.

**Story consolidated:** `R1S2E6-US1`.

#### Epic E7 — Search service ✅

**What shipped:**

- Workspace full-text search.
- SQLite FTS5 fallback.
- Search index updates on artifact mutations.
- Search mode exposed in platform status.

**Story consolidated:** `R1S2E7-US1`.

---

## Release 2 — Ingestion & Connectivity ✅

**Release goal:** make data enter the platform through files, sheets, webhooks, APIs, dbt, and core warehouse connectors.  
**Status:** complete.

### Sprint 2.1 — File & Sheet Ingestion

#### Epic E1 — File upload ingestion ✅

**What shipped:**

- CSV/XLSX upload ingestion.
- Auto-profiled workspace tables.
- Connection registration for uploaded files.
- Ingestion profile persistence.
- Error handling for malformed or unsupported files.

**Story consolidated:** `R2S1E1-US1`.

#### Epic E2 — Google Sheets connector ✅

**What shipped:**

- Google Sheets URL registration.
- Low-trust profile designation.
- Null-rate warnings for ad-hoc sheet data.

**Story consolidated:** `R2S1E2-US1`.

### Sprint 2.2 — Programmatic Sources

#### Epic E1 — Webhook ingest ✅

**What shipped:**

- Tokened webhook capability URL per connection.
- JSON append endpoint.
- Bad-token and non-JSON rejection behavior.

**Story consolidated:** `R2S2E1-US1`.

#### Epic E2 — REST API source connector ✅

**What shipped:**

- REST API source registration.
- Stored URL/auth/schedule configuration.
- Manual poll endpoint.
- Scheduler support.
- Offline fixture behavior.

**Story consolidated:** `R2S2E2-US1`.

#### Epic E3 — dbt project import ✅

**What shipped:**

- dbt manifest import.
- dbt nodes mapped into semantic explores.
- dbt tests mapped into quality signals.
- Manifest validation.

**Story consolidated:** `R2S2E3-US1`.

#### Epic E4 — Additional warehouse connectors ✅

**What shipped:**

- MySQL, DuckDB, Redshift, and Databricks connector registration.
- Required field validation.
- Masked credentials.
- Simulated test/introspection contract.
- UI connector availability flip.

**Story consolidated:** `R2S2E4-US1`.

---

## Release 3 — Governance & Semantic Depth ✅

**Release goal:** deepen governance, quality, lineage, semantic modeling, calculated metrics, and pre-aggregation intelligence.  
**Status:** complete.

### Sprint 3.1 — Governance Operations

#### Epic E1 — Health trend history + thresholds ✅

**What shipped:** health history rows, table history endpoint, configurable thresholds, alert/outbox generation.

#### Epic E2 — Freshness SLA configuration ✅

**What shipped:** per-table freshness SLA persistence, DQ evaluation against configured SLA, violation alerting.

#### Epic E3 — Schema drift alerting ✅

**What shipped:** fingerprint comparison on manifest save, drift alert rows, email notification, drift list endpoint.

#### Epic E4 — Data contracts ✅

**What shipped:** required columns/SLAs, contract violation BLOCK, pipeline 409 contract details.

#### Epic E5 — Custom test authoring ✅

**What shipped:** safe expression subset, SQL compilation, Stage-0 DQ gate execution, invalid expression rejection.

### Sprint 3.2 — Semantic Depth

#### Epic E1 — Lineage DAG ✅

**What shipped:** lineage edges, manifest join inference, gold/artifact downstream lineage endpoint, SVG DAG UI.

#### Epic E2 — Hierarchies ✅

**What shipped:** date and geo hierarchy auto-detection.

#### Epic E3 — Calculated metrics + formats ✅

**What shipped:** arithmetic metric creation over existing measures, semantic minor bump, currency/percent/duration formatting.

#### Epic E4 — Explore-level access control ✅

**What shipped:** explore ACL restrictions, planner filtering, direct edit 403 behavior.

#### Epic E5 — Artifact dependency tracking ✅

**What shipped:** semantic version impact analysis and dependency tracking.

#### Epic E6 — PDTs + pre-aggregation recommendations ✅

**What shipped:** persisted derived tables, scheduled materialization, query-pattern recommendation endpoint.

---

## Release 4 — Sessions & Feature Engineering ✅

**Release goal:** turn one-off pipeline execution into durable sessions with streaming, audit trail, feature engineering, leakage control, and custom features.  
**Status:** complete.

### Sprint 4.1 — Session Experience

#### Epic E1 — Session history, forking, templates ✅

**What shipped:** session list, fork endpoint, templates CRUD, start-from-template flow.

#### Epic E2 — Streaming session messages ✅

**What shipped:** SSE protocol with planning, agent, gate, completion/error events; persisted replay events.

#### Epic E3 — Step audit trail + related suggestions ✅

**What shipped:** pipeline step cards, input/output schemas, plain-English descriptions, suggestion endpoint.

### Sprint 4.2 — Feature Engineering

#### Epic E1 — Temporal features + holidays ✅

**What shipped:** lags, rolling stats, streaks, US federal holidays, uploadable calendars, enriched manifest.

#### Epic E2 — Encodings, imputation, selection ✅

**What shipped:** one-hot/frequency encoding, rolling median/mode imputation, collinearity pruning, feature cap/ranking.

#### Epic E3 — Leakage HITL + custom features ✅

**What shipped:** leakage HOLD confirmation, custom feature expression registration/review/application.

---

## Release 5 — Model Training Upgrade ✅

**Release goal:** move from basic modeling to multi-candidate, explainable, lifecycle-managed forecasting/prediction.  
**Status:** complete.

### Sprint 5.1 — Multi-candidate Training

#### Epic E1 — Candidate families + ensemble ✅

**What shipped:** seasonal-trend, ridge-lite, naive/gradient-boost-lite family comparison and ensemble promotion logic.

#### Epic E2 — Random search + full metrics ✅

**What shipped:** seeded search, MAPE/RMSE/directional accuracy, stability gate.

#### Epic E3 — Explainability ✅

**What shipped:** permutation importance, SHAP-lite contribution values, gold model insights, top-feature concentration gate.

### Sprint 5.2 — Lifecycle

#### Epic E1 — Champion/challenger ✅

**What shipped:** challenger tracking and >5% auto-promotion rule.

#### Epic E2 — Drift monitoring + one-click retrain ✅

**What shipped:** rolling MAPE drift comparison, alerting, retrain endpoint, model archive.

#### Epic E3 — Model card completion + async notify ✅

**What shipped:** full model card fields, training duration, registry URI, lineage, job completion notification.

---

## Release 6 — Artifact Interactivity ✅

**Release goal:** make artifacts interactive, explorable, exportable, versioned, branded, responsive, and validated.  
**Status:** complete.

### Sprint 6.1 — Gold API & Full Panel Set

#### Epic E1 — Gold layer query API ✅

**What shipped:** gold predictions/forecast/model insights tables, paginated gold query API, TTL cache.

#### Epic E2 — Eight-panel artifact ✅

**What shipped:** header, KPI row, time series, feature importance, dimension breakdown, forecast, leaderboard, DQ/lineage footer, validator panel-set check.

### Sprint 6.2 — Interactions & Polish

#### Epic E1 — Filters + click-to-drill ✅

**What shipped:** unified JS filter state, cross-filtering, drill drawer, CSV export.

#### Epic E2 — Annotations + alert subscriptions ✅

**What shipped:** artifact annotations, overlay rendering, annotated-event feature, metric alert subscriptions.

#### Epic E3 — Export, theming, responsive, versions, repair ✅

**What shipped:** per-panel CSV/JSON export, dark mode, print CSS, responsive stacking, version history, automated repair loop, branding.

---

## Release 7 — Sharing, Embeds & Workspace Polish ✅

**Release goal:** secure sharing, embed support, ownership, workspace organization, schedules, thumbnails, insights, and health dashboard artifact.  
**Status:** complete.

### Sprint 7.1 — Share Security

#### Epic E1 — Owner role + public links ✅

**What shipped:** owner role, password-optional public links, expiring snapshot links, hourly refresh cap, view counts.

#### Epic E2 — JWT embed tokens + cross-workspace ✅

**What shipped:** HS256 embed tokens, allowed origins, read-only write rejection, cross-workspace scoped gold access.

### Sprint 7.2 — Workspace Polish

#### Epic E1 — Favorites, tags, activity feed ✅

**What shipped:** favorite/tag CRUD, list filters, artifact activity feed.

#### Epic E2 — Timezone cron + thumbnails ✅

**What shipped:** timezone-aware schedules, next-run computation, SVG thumbnails.

#### Epic E3 — Proactive insights + health dashboard ✅

**What shipped:** anomaly/trend/weekday insight detection, drill-in sessions, workspace health dashboard artifact.

---

# PART II — Initial Client Surfacing: UI1–UI5

**Program goal:** expose the completed R1–R7 backend capability through the React client before the full PRD shell conversion.  
**Status:** complete.

| Slice | Status | What it consolidated |
|---|---|---|
| UI1 — API client + auth plumbing + Account screen | ✅ | API wrappers, bearer-token storage, Account screen with register/login/me/logout and role display. |
| UI2 — Platform admin screen | ✅ | Service fallback modes, jobs, logs, latency, email outbox, alerts feed, branding. |
| UI3 — Governance depth | ✅ | Manifest viewer, health history, thresholds, SLAs, contracts, custom DQ tests, drift, lineage. |
| UI4 — Models screen | ✅ | Modeler dry-run/execute/enrich, custom features, leakage confirmation, training jobs, trials, model cards, registry, promotion/retrain. |
| UI5 — Sessions & artifacts polish | ✅ | Session suggestions/fork/templates, audit cards, search, favorites, tags, activity, annotations, subscriptions, share links, embed tokens, insights, health dashboard. |

---

# PART III — Evolution Program: Releases 8–14

**Program goal:** implement the Architecture v2.1 Part XVII/Part XVIII evolution model: graph substrate, orchestration, knowledge layer, trust/explainability, evolution loop, analytics extensions, and ecosystem surfaces.  
**Status:** complete after reconciliation.  
**Important reconciliation note:** Progress originally stopped with R8–R12 complete and R13 next; later progress records R13/R14 completion under stray labels, then reconciles them back into R13/R14.

## Phase 0–2 — Recon, Plan, Test Infrastructure ✅

**What shipped:**

- Baseline regression confirmed.
- 35 Part XVII enhancements classified and mapped.
- Release plan extended from R8 through R14.
- Playwright UI harness added.
- Zero-key server restored; Flask serves client and API in one process.

---

## Release 8 — Graph Substrate ✅

**Release goal:** create the shared graph/store/cache substrate that every later evolution capability relies on.

### Sprint 8.1 — Store & Cache

#### Epic E1 — Unified Artifact Store ✅

**What shipped:**

- Immutable content-addressed artifact store.
- Versioned artifact rows.
- Pipeline output chain registration.
- Provenance API and UI panel.
- Idempotent registration behavior.

#### Epic E2 — Intelligent Caching Hierarchy ✅

**What shipped:**

- Four version-keyed cache layers: semantic, query, spec, artifact.
- Local LRU + SQLite fallback; Redis flip path.
- Gold API wired through query cache.
- Platform cache status panel.

### Sprint 8.2 — DAG Execution

#### Epic E3 — Artifact Dependency Graph execution ✅

**What shipped:**

- Content-addressed DAG nodes.
- Edge-contract gates.
- Cached reruns.
- Unified lineage/execution graph.
- Cached node UI badges.

---

## Release 9 — Execution Engine ✅

**Release goal:** upgrade execution from sequential pipeline behavior to cost-aware, parallel, event-driven, multi-agent, sandbox-aware orchestration.

### Sprint 9.1

#### Epic E1 — Cost-aware orchestration ✅

**What shipped:** cache → template → small → frontier dispatch ladder, ACL-scoped cache identity, dispatch telemetry, platform dispatch panel.

#### Epic E2 — Parallel stage execution ✅

**What shipped:** independent viz_specs branch, wave executor, worker pool, concurrency budget endpoint, join-barrier gates.

#### Epic E3 — Event-driven execution ✅

**What shipped:** platform events, trigger registry, targeted recompute, drift-triggered retrain jobs, investigation stubs, events feed.

### Sprint 9.2

#### Epic E4 — Meta-orchestrator ✅

**What shipped:** deterministic grain arbitration, systemic-failure triage dedupe, priority queue sweep, checkpoint-skip refusal.

#### Epic E5 — Multi-agent collaboration ✅

**What shipped:** consultation bus, semantic responder, viz consults mid-run, SSE/audit first-class events.

#### Epic E6 — Sandbox mode ✅

**What shipped:** sandbox namespace, salted node hashes, no cache cross-seeding, sandbox excluded from production search/list, gate-gated promotion.

#### Epic E7 — Autonomous optimization jobs ✅

**What shipped:** slow-SQL/index/cache-key/M2M proposals, deduped review queue, admin-only decisions, never auto-applied.

---

## Release 10 — Knowledge Layer ✅

**Release goal:** make the platform remember, relate, adapt, evolve, review, and reuse organizational analytics knowledge.

### Sprint 10.1

#### Epic E1 — Persistent agent memory ✅

**What shipped:** PII-gated memory writes, half-life decay, planner prior, explicit turn override, Account memory viewer.

#### Epic E2 — Workspace knowledge graph ✅

**What shipped:** typed KG edges, incremental ingest, related/co-analysis APIs, related chips.

#### Epic E3 — User intent history graph ✅

**What shipped:** question → spec → artifact chain, warm-start hints, empty state for new users.

### Sprint 10.2

#### Epic E4 — Adaptive planning ✅

**What shipped:** expertise-conditioned thresholds, admin tunable defaults, inline expert assumptions.

#### Epic E5 — Automatic semantic evolution ✅

**What shipped:** new metric/deprecation/rename/merge proposal engine; admin-only canonical mutation.

#### Epic E6 — AI-assisted governance review ✅

**What shipped:** evidence-ranked triage, conflict flags, authority unchanged, review UI.

#### Epic E7 — Organizational knowledge reuse ✅

**What shipped:** UAS+KG similarity candidates, sandbox exclusion, full spec validation on reuse.

---

## Release 11 — Trust & Explainability ✅

**Release goal:** make every artifact explainable, confidence-aware, replayable, diffable, and health-scored.

### Sprint 11.1

#### Epic E1 — Explainability engine ✅

**What shipped:** lineage/SQL/semantic/bindings/model-card/gate explanation composition, component filter, read-only explain panel.

#### Epic E2 — Confidence propagation ✅

**What shipped:** weighted-minimum confidence model over intent/leakage/MAPE stages, persisted breakdown, low-confidence UI flags.

### Sprint 11.2

#### Epic E3 — Replay/debugger ✅

**What shipped:** read-only DAG replay over stored UAS payloads, cached node source citation, repair attempts retained.

#### Epic E4 — Diff engine ✅

**What shipped:** structural diff across dashboards, semantic schemas, manifests, and model cards; lifecycle summaries.

#### Epic E5 — Health scoring ✅

**What shipped:** five-component dashboard health score: validator, accessibility, KG redundancy, latency, adoption.

---

## Release 12 — Evolution Engine ✅

**Release goal:** detect opportunities, record feedback, mine improvement signals, monitor models, and track ROI.

### Sprint 12.1

#### Epic E1 — Opportunity engine ✅

**What shipped:** anomaly/causal/forecast-gap opportunities, accept-to-session flow, dedupe, no auto-run without confirmation.

#### Epic E2 — Recommendation feedback loop ✅

**What shipped:** accept/dismiss/ignore recording, repeated-dismissal suppression, signal-strengthening release rule, rates API.

### Sprint 12.2

#### Epic E3 — Self-improving loop ✅

**What shipped:** popular metrics, abandoned filters, repeated edits, recurring failure signals, audited routing to consumers.

#### Epic E4 — Continuous model monitoring ✅

**What shipped:** Kendall-tau importance reorder alerts, PSI input drift alerts, retrain triggers.

#### Epic E5 — Automated ROI tracking ✅

**What shipped:** adoption score, dispatch/compute cost model, native ROI artifact.

---

## Release 13 — Analytics & Artifact Extensions ✅ / reconciled

**Release goal:** add benchmark intelligence, visualization experimentation, natural-language artifact editing, and narrative generation.

### Sprint 13.1

#### Epic E1 — Benchmark library ✅

**What shipped:** historical benchmarks from gold, peer/budget/seasonal comparisons only when registered, no fabricated reference sets.

#### Epic E2 — Visualization experimentation ✅

**What shipped:** ranked alternate visualization specs, one-click swap through validation path.

### Sprint 13.2

#### Epic E3 — Natural-language artifact editing ✅ / split across later UI surfaces

**Consolidated interpretation:** the capability exists through deterministic layout edit classification and validated semantic-edit rerouting, with major pieces delivered in R16S2E4 and later workbench polish. Final user-facing parity is still refined in R30 workbench/inspector stories.

#### Epic E4 — Narrative generation ✅ / surfaced through R19

**Consolidated interpretation:** deterministic, grounded narrative generation was delivered in R19 Distribution, including three audience variants and traceability to contract values. Present-mode UI remains pending in R33S2E3.

---

## Release 14 — Platform & Ecosystem ✅ / reconciled

**Release goal:** make AnalytIQ extensible and operationally integrated.

### Sprint 14.1

#### Epic E1 — Plugin architecture ✅

**What shipped:** plugin validators, sandboxed declarations, plugin gates, no bypass of built-ins.

#### Epic E2 — Observability dashboard ✅

**What shipped:** native observability artifact over cache, dispatch, repair, and event telemetry.

### Sprint 14.2

#### Epic E3 — Template marketplace ✅

**What shipped:** parameterized plan packaging, semantic re-resolution, validation on apply.

#### Epic E4 — Business process integration ✅

**What shipped:** Slack/Teams/Jira/email outbound actions, console/outbox fallback, audited dispatch.

---

# PART IV — UI-PRD Gap Program: Releases 15–20

**Program goal:** convert the original 14-screen engineering demo into a routed PRD v3.0 product shell with workbench, contracts, people, sharing, enterprise, and billing foundations.  
**Status:** complete at demo-grade parity.  
**Known remaining polish:** moved into R30–R36.

## Release 15 — Foundation ✅

### Sprint 15.1 — Router & shell

#### Epic E1 — URL routing ✅

**What shipped:** react-router, route map over 14 legacy screens, `/` → `/app`, legacy nav shim, deep links, back behavior, 404 page.

#### Epic E2 — App shell ✅

**What shipped:** 240px light sidebar, 13 nav areas, grouped navigation, collapse rail, topbar with workspace chip/search/bell/avatar, breadcrumbs, placeholders.

### Sprint 15.2 — Components & roles

#### Epic E3 — Design tokens + core components ✅

**What shipped:** PLAN palette, StatusBadge, Tabs, Drawer, DataTable, KPI, ViewToggle, sortable S10 table view.

#### Epic E4 — Role-aware rendering ✅

**What shipped:** useRole hook, AdminOnly dark treatment, viewer navigation restrictions, 403 page, admin console preserved.

---

## Release 16 — Create Workbench ✅

### Sprint 16.1 — Workbench flow

#### Epic E1 — Workbench chat ✅

**What shipped:** start state, typed examples, clarification chips, confidence, inline plan card, access limitations, Approve & Build.

#### Epic E2 — Live build ✅

**What shipped:** DAG-driven stage chips, cache/blocked states, autosave chip, canvas KPI strip, SVG timeseries/forecast sections, governed/contract badges.

### Sprint 16.2 — Inspector & canvas edits

#### Epic E3 — Inspector ✅

**What shipped:** Design, Data, Pipeline, Insights, Share, Versions tabs.

#### Epic E4 — Canvas edits ✅

**What shipped:** layout_json sections, layout-vs-semantic edit classifier, versioned edits, rename/reorder toolbar.

---

## Release 17 — Contracts Substrate ✅

### Sprint 17.1 — Component contracts

#### Epic E1 — Per-component query + data contracts ✅

**What shipped:** component data contracts persisted at gold build, pipeline contracts endpoint, gold catalog, Gold Tables screen, inspector Data tab on real contracts.

---

## Release 18 — People Layer ✅

### Sprint 18.1 — Notifications, activity, comments, team

#### Epic E1/E2 — People layer bundle ✅

**What shipped:** notifications inbox, unread count, mention fan-out, alert fan-in, live bell/drawer/mark-all, workspace activity feed, threaded section comments, resolve flow, invite lifecycle, roster, 25-seat accounting, Team page.

---

## Release 19 — Distribution ✅

### Sprint 19.1 — Public, embeds, exports, narrative

#### Epic E1 — Distribution bundle ✅

**What shipped:** grounded narrative engine, three audience variants, `/embed/:token` with origin enforcement, PDF/PNG export, artifact duplicate, public metadata endpoint, branded shell-free `/share/:token` viewer, freshness badge.

**Deferred:** present-mode UI; narrative notes engine is ready and mapped to R33S2E3.

---

## Release 20 — Enterprise ✅

### Sprint 20.1 — Entitlements, metering, RLS, audit, billing

#### Epic E1 — Enterprise bundle ✅

**What shipped:** token metering, cycle rollup, soft thresholds, cap status, plan catalog, entitlement gating, starter public-link block, RLS safe-subset policies, gold read enforcement, simulator, audit severity, CSV/JSON export, Billing page.

---

# PART V — Design-System & Shell Parity: R21–R22

## Release R21 — Design-System & Shell Parity ✅

**Release goal:** match the mockup shell, token system, primitives, iconography, topbar, sidebar, drawer, and content chrome exactly.  
**Status:** complete; all 12 stories delivered.  
**Release regression:** backend 414/414 · UI 72/72 · zero-key boot passed.

### Phase 0–2 — Recon, plan, infrastructure ✅

**What shipped:**

- Mockups extracted and verified against checklist.
- Legacy palette/files/timestamp junk audited.
- Numbering reconciled for old artifacts.
- Release plan expanded.
- Test infra re-verified.
- Order-dependent flakes root-caused and fixed.

### Milestone DP-A — Foundation parity ✅

### Sprint R21S1 — Tokens, primitives, iconography

#### Epic R21S1E1 — Single design-token source ✅

**What shipped:** `P` tokens, typography scale, `window.__TOKENS__`, lint wall, junk file cleanup.

#### Epic R21S1E2 — Primitive kit rebuilt ✅

**What shipped:** 22 primitives, `/app/__kit` gallery, computed-style assertions, legacy API compatibility.

#### Epic R21S1E3 — SVG icon set ✅

**What shipped:** 30 frame-extracted stroke icons, shared Logo, zero emoji source enforcement, dead Sidebar deletion.

### Sprint R21S2 — Shell exact parity + global chrome

#### Epic R21S2E1 — Sidebar parity ✅

**What shipped:** frame-accurate groups, labels, logo row, active styles, 64px rail, centered icons, tooltips.

#### Epic R21S2E2 — Topbar parity ✅

**What shipped:** AR chip, 520px search pill, command-key keycap, red-ringed bell, help route, 34px avatar.

#### Epic R21S2E3 — Content chrome + PageHeader pattern ✅

**What shipped:** breadcrumb/page header pattern, content padding, app background, migrated shell specs.

#### Epic R21S2E4 — Notifications drawer parity ✅

**What shipped:** 420px drawer, tabs, day groups, 5-kind tinted tiles, unread styling, backend contract lock.

---

## Release R22 — Core App Screens ⚠️ closed early / superseded

**Release goal:** originally daily-driver core screens.  
**Consolidated status:** only Workspace Home shipped. Remaining work transferred to R30/R31.

### Sprint R22S1 — Workspace home & activity

#### Epic R22S1E1 — Workspace Home rebuild ✅

**What shipped:**

- `/api/home/summary` aggregate.
- Frame-01 home screen.
- Hero prompt route to `/app/create/new?q=...` consumed once by Workbench.
- S01 deleted and `/app` routed to Home.
- Lint grandfathering pruned.

#### Epic R22S1E2 — Recent Activity page 🔁 transferred

**New home:** `R31S2E1`.

### Transferred R22 work

| Retired ID | New ID | Scope |
|---|---|---|
| R22S1E2 | R31S2E1 | Recent Activity page. |
| R22S2E1 | R30S1E2 | Artifact library card view + rail. |
| R22S2E2 | R30S1E3 | Artifact library table view. |
| R22S2E3 | R30S1E4 | Artifact detail. |

---

# PART VI — Active UI Parity & Build-Out Program: R30–R36

**Program goal:** final PRD/mockup parity pass against the canonical PRD v1.0/UI parity plan.  
**Current status:** active.  
**Total planned stories:** 64.  
**Completed so far:** 32 (R30 + R31 + R32 fully closed).  
**Active story:** R33S1E1-US1.

## Release R30 — PRD Phase 1: Core Loop Credibility ✅ complete

**Release goal:** make the product spine demo-honest: pricing facts, artifacts library/detail, Create Workbench, inspector panels, share/version/comment overlays, wizard retirement, and vocabulary cleanup.  
**R30 status:** 18/18 stories complete. **Release regression + zero-key boot:** backend 423/423 · UI 121/121 · 8 services local, client shell 200 (2026-07-05).  

### Milestone UP-A — The product spine is demo-honest

**Success condition:** all 18 R30 stories green; backend/UI regression green; zero-key boot recorded; PAR-1 flips for Artifacts Library, Create Workbench states, and Inspector Panels.

### Sprint R30S1 — Pricing data hotfix + Artifacts surfaces ✅ complete

#### Epic R30S1E1 — Pricing data hotfix ✅

**What shipped:** PRD ch02 plan facts live on `/pricing`; 3-test pricing data lock remains green through future R34 pricing restyle.

#### Epic R30S1E2 — Library card view + filter rail ✅

**What shipped:** artifact library card view, filter rail, per-card overflow menu, ROI/Sandbox/Health overflow ruling, FTS leak removed, legacy specs migrated.

#### Epic R30S1E3 — Library table view ✅

**What shipped:** Frame-02 table columns, owner avatar/name, scored health pill, relative times, share/tags/menu, sort indicator, `?view=table` persistence.

#### Epic R30S1E4 — Artifact Detail ✅

**What shipped:** `/app/artifacts/:id`, eight routed tabs, editable title with PATCH rename/audit/reindex, internals distributed to Model/Pipeline/Lineage tabs, S10 tombstoned.

**Sprint gate:** backend 419/419 · UI 97/97.

### Sprint R30S2 — Create Workbench ✅ complete

#### Epic R30S2E1 — Workbench chrome & session topbar ✅

**What shipped:** 56px session topbar, title/meta/GOVERNED/autosaved/Versions/Share/avatar, workspace topbar replaced on create routes, rail forced 64px.

#### Epic R30S2E2 — Chat column: clarify → plan → build → done ✅

**What shipped:** status lines, Review-your-plan card, metric chips, edit pencils, APPROVED pill, clarify chips, agent tiles, follow-ups, refine composer.

#### Epic R30S2E3 — Center states + canvas + section select ✅

**What shipped:** start/empty/building states, 9 stage chips, PII banner, live event log, toolbar, filters, human chart titles, KPIs, legends, today divider, selected-section border, floating toolbar.

#### Epic R30S2E4 — Inspector Design tab + tab strip ✅

**What shipped:** dense ruled tab strip, Design/Data/Pipeline/Lineage/Model/Comments/Share tabs, design editing panel, chart picker, target toggle, validation pills, Replace-With section, overflow fix.

**Sprint gate:** backend 419/419 · UI 110/110.

### Sprint R30S3 — Inspector panels & overlays ✅ complete

#### Epic R30S3E1 — Data trust contracts panel ✅

**What shipped:** human-named trust accordions, PASS/WARNING pills, tinted warning headers, Rows/Range/Query/Freshness/Gates rows, raw gate dump removed.

#### Epic R30S3E2 — Pipeline audit panel ✅

**What shipped:** RUN header, ALL GATES pill, human stage cards, status circles, repair labels, Input/Gate result/Output rows, admin technical block, real Fork-from-here session fork.

#### Epic R30S3E3 — Insights panel ✅

**What shipped:** tinted insight tiles, mono confidence pills, category chips (anomaly/trend/correlation), rich finding copy with bold values, Investigate button seeds a workbench planning turn from `drill_question`.

#### Epic R30S3E4 — Share modal ✅

**What shipped:** canonical 520px modal, 4 visibility cards, real signed-link minting + Copy, 7-tile distribution grid (Embed/HTML/Link live), advanced expires/password/checkboxes, real Revoke via a new expiry-based endpoint; interim modal removed.

#### Epic R30S3E5 — Version history panel ✅

**What shipped:** topbar-opened drawer over the real `artifact_files` timeline, human dependency chips (zero hashes), append-only Restore endpoint, `?version` query drives Compare.

#### Epic R30S3E6 — Comments drawer + inline pins ✅

**What shipped:** 400px drawer with Open/Resolved counts, §-anchor chips, nested replies, real create/reply/resolve over the R18 comments API, Ask-AI-to-apply seeds the refine composer, numbered pins + reply popover on anchored sections; canvas toolbar selection-drop bug fixed.

#### Epic R30S3E7 — Legacy wizard retirement ✅

**What shipped:** S06–S09 tombstoned, named routes redirect (quick/confirm/run → workbench start, result → library), four planning surfaces (warm-start hints, KG-related, assumptions line, reuse candidates) ported into the chat, 5 specs migrated with citations.

#### Epic R30S3E8 — Forbidden vocabulary enforcement ✅

**What shipped:** source-level §5.1 kill-list gate with comment stripping, exact-equality allowed-until ledger; caught and ledgered 3 extra leaks (§ citations in S05/S11/S12; stale ledger entries also fail).

### R30 close-out ✅ complete

- R30S3 sprint regression: backend 423/423 · UI 121/121 (vocabulary suite gating from here).
- R30 release regression + zero-key boot: backend 423/423 · UI 121/121 · boot PASSED — 8 services local, client shell 200 (2026-07-05).
- **RELEASE R30 CLOSED (18/18 stories).**

---

## Release R31 — PRD Phase 2: First-Run Journey ✅ complete

**Release goal:** make the first user path real: standalone auth, register wizard, onboarding, home polish, and activity.  
**Status:** complete. **Release regression + zero-key boot:** backend 425/425 · UI 135/135 · 8 services local, shell 200 (2026-07-05).

### Milestone UP-B — Register → onboard → live home

**Success condition:** 8 auth screens, 4 onboarding screens, activity page, home polish, no auth-surface leakage of internal PBKDF2/agent-memory language. — met.

### Sprint R31S1 — Auth & onboarding ✅ complete (3/3)

#### Epic R31S1E1 — Standalone auth shell + login + register wizard ✅

**What shipped:** standalone `/login` + `/register`: 420px card on `#f2f4f8` stage, labeled fields, forgot link, 3 SSO buttons, magic-link box, 4-step wizard (strength meter, role cards, invite chips, first-path rows) driving the real register→login flow; S11 rewritten (PBKDF2/agent-memory/§ citation leaks dead, vocab ledger pruned ×3); R10 memory surface kept behind the §5.6 admin affordance with a payload-shape fix.

#### Epic R31S1E2 — Auth secondary states ✅

**What shipped:** forgot-password (form → sent), verify-email, SSO callback signing-in auto-advance, no-workspace-access red variant.

#### Epic R31S1E3 — Onboarding ×4 ✅

**What shipped:** branding wizard with live-preview swatches persisting through `PUT /api/branding`; 5 starting-mode cards; source-health preview over the real profiling path (connection → governance run → cataloged tables, latest-run reuse); data-aware template picker seeding the workbench; register → onboarding flow wired.

**Sprint gate:** backend 423/423 · UI 132/132.

### Sprint R31S2 — Home & activity completion ✅ complete (2/2)

#### Epic R31S2E1 — Recent Activity page ✅

**What shipped:** `server/activity.py` typed projection over `audit_logs` (kind buckets, cursor pagination, entity links); `/app/activity` page with filter pills, timeline anatomy, Load more; View-all links in Home header and drawer footer.

#### Epic R31S2E2 — Home polish deltas ✅

**What shipped:** bell badge unmounts at zero (r15s1/r18s1 contracts migrated), health values state-colored + donut threshold, review widget amber count/dot bullets/bottom link, viewed thumbs, usage week-over-week delta + 7-bar chart from a new server daily series.

**Sprint gate:** backend 425/425 · UI 135/135. **RELEASE R31 CLOSED (5/5 stories).**

---

## Release R32 — PRD Phase 3: Governance & Data Trust ✅ complete

**Release goal:** split governance and semantic trust surfaces into designed routes and retire raw S13/S05 experiences.  
**Status:** complete. **Release regression + zero-key boot:** backend 440/440 · UI 153/153 · 8 services local, client shell 200 (2026-07-05).

### Milestone UP-C — Trust surfaces at parity

**Success condition:** Governance ops split into designed routes, semantic layer's nine screens live, S13/S05 retired or redirected. — met.

### Sprint R32S1 — Governance ✅ complete (6/6)

#### Epic R32S1E1 — Governance overview KPI tiles ✅

**What shipped:** new `/api/governance/summary` aggregate over the real substrate; overview KPI cards, amber pill, span-2 health-trend sparkline; ops-page leaks absent.

#### Epic R32S1E2 — Human review queue ✅

**What shipped:** typed tab counts, bulk approve, checkbox table, TYPE pills, colored confidence, real Accept/Edit/Reject over the reviews API with server audits; `governanceLatest` `run_id` shape fixed workspace-wide.

#### Epic R32S1E3 — Definition-review diff ✅

**What shipped:** `GovernanceDiff.jsx` (`/app/governance/review/:id`, CURRENT vs PROPOSED with derived expression block, evidence + affected chips, editable final definition, approve → accept/edit + reject, audited); queue name-cell deep-links; `GET /api/reviews/items/<id>` (+404).

#### Epic R32S1E4 — DQ rules master-detail ✅

**What shipped:** `GovernanceRules.jsx` (`/app/governance/rules` master-detail, typed pills, live toggles, editor with type dropdown + admin SQL + block-on-failure); `GET/PUT /api/dq/rules` merged catalog + settings (audited); engine honors disable → SKIPPED + block up/downgrade; run skips disabled tests. Replaces S13's raw config 1:1.

#### Epic R32S1E5 — Lineage graph ✅

**What shipped:** `GovernanceLineage.jsx` (`/app/governance/lineage` dot-grid canvas, 6-kind legend/columns, zoom/auto-layout, downstream BFS highlight, detail panel with IMPACT IF BROKEN, `?node=` deep links); `/api/lineage` grew source/metric/model nodes + row_count.

#### Epic R32S1E6 — Manifest versions + pre-aggregation recommendations ✅

**What shipped:** `GovernanceManifests.jsx` (status pills REVIEW REQUIRED/ACTIVE/SUPERSEDED, expandable +ADD/~MOD/−DEL diffs via `?diffs=1`, Approve → review queue, real audited Rollback) + `GovernancePreagg.jsx` (value pills, hit share, demo-derived speedup/cost + $50 ceiling; materialize/dismiss deferred to R36S1); S13 retired (tombstone, routes live under `/app/governance/*`).

**Sprint gate:** backend 433/433 · UI 145/145.

### Sprint R32S2 — Semantic layer ✅ complete (3/3)

#### Epic R32S2E1 — Semantic overview + explores + explore detail ✅

**What shipped:** `Semantic.jsx` (overview KPI cards + MANIFEST pill + real Regenerate/generate; explores table with health/confidence/used-by; explore detail with 6 tabs + "Analyze this explore" `?q=` seed); `GET /api/semantic/<ws>/summary` + `/explores`; S05 retired (tombstone) with all panels rehomed to the overview (evolution proposals R10S2E5, evidence triage R10S2E6, schema compare R11S2E4); vocab ledger S05 entry pruned; S03/S04 route to `/app/semantic`.

#### Epic R32S2E2 — Metrics catalog + metric detail + dimensions ✅

**What shipped:** `SemanticCatalog.jsx` — metrics catalog (searchable, ×2 CONFLICT amber rows → review diff deep link, DEPRECATED gray rows from real version diff, "+ Calculated metric" real POST), metric detail (plain-English definition, §5.6 ADMIN ONLY dark SQL, lineage chips, live DQ-test chips, versions), dimensions catalog (7-way categorizer, collapsible groups, confidence); `GET /api/semantic/<ws>/conflicts`.

#### Epic R32S2E3 — Field picker + joins + derived tables ✅

**What shipped:** `SemanticTools.jsx` — field picker (3-panel, chips, live `100-row cap · Nms` preview via new `DEP` `POST /api/semantic/<ws>/preview` seeded-deterministic + cardinality warning + `?q=` handoff), join paths (SAFE/FAN-OUT RISK from real `join_type`; builder null-note; bridge CTA prefills derived editor; sim fk gains `null_pct` 4.1 → real left join; manifests now carry `null_pct`), derived tables (dark SQL, real `dry_run` on POST pdts, publish, FRESH/STALE).

**Sprint gate:** backend 440/440 · UI 153/153.

### R32 close-out ✅ complete

- Release regression + zero-key boot recorded, PAR-1 flips: Governance ×4 · Governance Lineage ×3 · Semantic ×9.
- **RELEASE R32 CLOSED (2026-07-05): backend 440/440 · UI 153/153 · zero-key boot all 8 services local · client shell 200 · 32/64 stories — program halfway.**

---

## Release R33 — PRD Phase 4: Prediction & Distribution 🔥 active

**Release goal:** polish model operations and artifact distribution: models, training, cards, leaderboard, sharing, embed, present mode, and errors.  
**Status:** active — first story in flight, no R33 code written yet (clean seam).

### Milestone UP-D — Models trusted, artifacts delivered

**Success condition:** six model surfaces live over existing model APIs; sharing surfaces reach parity; error template variants complete.

### Sprint R33S1 — Models & model ops

#### Epic R33S1E1 — Models overview 🔥 active (R33S1E1-US1 is the current story)

**Planned outcome:** six KPI cards, model table, champion/drift/run-failed pills, per-state actions.

**Recon done (2026-07-05):** frames in `Models.dc.html` (6 KPI cards + status-typed table with per-state actions); substrate = training jobs/trials/promote (`app.py` ~5782–5849), registry models/challenger (~5944–6035), model_cards (~6037), insights (~6052). Plan is an aggregate `GET /api/models/overview`, RED-first, then the screen. Replaces legacy S14.

#### Epic R33S1E2 — Training run detail ⏳

**Planned outcome:** Summary/Backtest/Candidates/Features/Leakage/Logs tabs, stat cards, backtest bar chart, dark log.

#### Epic R33S1E3 — Model card ⏳

**Planned outcome:** purpose, target, algorithm, data, metrics, importance bars, SHAP visualization, linked artifacts.

#### Epic R33S1E4 — Leaderboard + feature manifest + retrain center ⏳

**Planned outcome:** ranked candidates, scatter/tradeoff view, promotion gate footnotes, feature status rows, retrain reason queue.

### Sprint R33S2 — Sharing surfaces + errors

#### Epic R33S2E1 — Public viewer parity + expired card ⏳

**Planned outcome:** branded viewer bar, filters, KPI grid, charts, Powered-by footer, expired-token card.

#### Epic R33S2E2 — Embed preview + settings ⏳

**Planned outcome:** browser-frame preview, embed code block/copy, scope checkboxes, expiration/refresh/domain settings, persistence dependency.

#### Epic R33S2E3 — Present mode ⏳

**Planned outcome:** dark stage, section counter, chart panel, floating controls, narrative presenter-notes drawer.

#### Epic R33S2E4 — Error template ×8 ⏳

**Planned outcome:** 404, 403, token expired, workspace not found, artifact unavailable, pipeline failed, connector failed, data access denied.

---

## Release R34 — PRD Phase 5: Marketing Site ⏳ pending

**Release goal:** complete the public marketing surfaces at mockup parity while preserving pricing data correctness.  
**Status:** pending.

### Milestone UP-E — Marketing at parity

**Success condition:** seven marketing pages at designed routes; shared nav/footer; pricing data lock green.

### Sprint R34S1 — Shared chrome + Landing + Product + Pricing restyle

#### Epic R34S1E1 — MarketingNav + footer ⏳

**Planned outcome:** logo/nav links/Login/Start Free, dark five-column footer, legal bar.

#### Epic R34S1E2 — Landing rebuild ⏳

**Planned outcome:** dark hero, live-build preview, BI comparison, value props, use cases, trust strip, CTA, terminal visual.

#### Epic R34S1E3 — Product page ⏳

**Planned outcome:** sticky stepper and five alternating stage sections.

#### Epic R34S1E4 — Pricing restyle ⏳

**Planned outcome:** monthly/annual toggle, plan cards, popular/enterprise visual treatment, comparison table, FAQ; R30 pricing lock remains green.

### Sprint R34S2 — Solutions + Templates + Security + Docs

#### Epic R34S2E1 — Solutions ×6 ⏳

**Planned outcome:** six persona routes with shared solution template.

#### Epic R34S2E2 — Templates gallery ⏳

**Planned outcome:** filter rail, grid header, search, 10 template cards.

#### Epic R34S2E3 — Security page ⏳

**Planned outcome:** compliance pills, sticky jump nav, tinted security sections.

#### Epic R34S2E4 — Docs page ⏳

**Planned outcome:** docs nav, quickstart article, terminal block, amber callout, on-this-page rail.

---

## Release R35 — Data Layer Surfaces ⏳ pending

**Release goal:** complete Data & Integrations screens at parity, audit-first.  
**Status:** pending.

### Milestone UP-F — Data surfaces at parity

### Sprint R35S1 — Sources, connect grid, wizard, imports

#### Epic R35S1E1 — Sources list ⏳

**Planned outcome:** sources list route with audit-first mockup verification, filters, statuses, row anatomy.

#### Epic R35S1E2 — Add-source connector grid ⏳

**Planned outcome:** connector grid for available source types.

#### Epic R35S1E3 — Snowflake connector wizard ⏳

**Planned outcome:** connector setup wizard pattern for Snowflake.

#### Epic R35S1E4 — Import flows ×4 ⏳

**Planned outcome:** file upload, REST API, webhook, dbt import flows over R2 connector substrate.

### Sprint R35S2 — Source & table detail

#### Epic R35S2E1 — Source detail tabs ⏳

**Planned outcome:** source detail header/tabs, status, sync/health/open issues, overview/contracts/history.

#### Epic R35S2E2 — Table detail ⏳

**Planned outcome:** table profile, columns, PII flags, business definition, downstream, quality gates.

---

## Release R36 — Gold, Alerts, Org, Admin, Billing & Settings ⏳ pending

**Release goal:** complete the operator/admin surfaces: gold tables, contracts, alerts, collaboration, admin, billing, settings, and technical-detail toggle.  
**Status:** pending.

### Milestone UP-G — Operate & administer at parity

### Sprint R36S1 — Gold & contracts + Alerts

#### Epic R36S1E1 — Gold tables list + detail ⏳

**Planned outcome:** gold table list and detail route at parity.

#### Epic R36S1E2 — Data contracts + query contracts screens ⏳

**Planned outcome:** designed admin screens for data/query contracts.

#### Epic R36S1E3 — Alerts center/create/detail ⏳

**Planned outcome:** alerts CRUD dependency, trigger history, alerts list, create form, alert detail.

### Sprint R36S2 — Collaboration + Admin control plane

#### Epic R36S2E1 — Comments inbox + team members + invite members ⏳

**Planned outcome:** comments inbox, team roster, member invites.

#### Epic R36S2E2 — Admin overview + roles matrix ⏳

**Planned outcome:** admin overview and roles/permissions matrix, roles key-value dependency, audit row.

#### Epic R36S2E3 — SSO settings + workspace branding admin ⏳

**Planned outcome:** SSO settings, workspace branding admin, workspace settings KV where needed.

#### Epic R36S2E4 — Admin security ×4 ⏳

**Planned outcome:** secrets, audit log, sharing governance, RLS simulator.

#### Epic R36S2E5 — Usage & cost dashboard ⏳

**Planned outcome:** usage/cost analytics over billing usage endpoint.

### Sprint R36S3 — Billing + Settings

#### Epic R36S3E1 — Billing plan/seats/invoices/payment/token meters ⏳

**Planned outcome:** billing plan and seats, invoices, payment methods, token usage meters, seeded demo endpoints where Stripe stubs are insufficient.

#### Epic R36S3E2 — Settings ×4 + technical-detail toggle ⏳

**Planned outcome:** profile, preferences, API keys, help center, app-wide technical-detail toggle so admin-gated technical blocks become explicit-toggle-gated.

---

# PART VII — PRD & Mockup Surface Map

## 7.1 UI PRD screen families

The UI PRD defines the following product surface families:

| Family | Routes / surfaces |
|---|---|
| Public marketing | `/`, `/product`, `/solutions/*`, `/templates`, `/pricing`, `/security`, `/docs` |
| Authentication | `/login`, `/register`, `/forgot-password`, `/verify-email`, `/sso/callback` |
| Onboarding | `/onboarding/workspace`, `/onboarding/start`, `/onboarding/source-health`, `/onboarding/templates` |
| Home/workspace | `/app`, `/app/activity`, `/app/notifications` |
| Create Workbench | `/app/create`, `/app/create/new`, `/app/create/:sessionId` |
| Artifacts | `/app/artifacts`, `/app/artifacts/:id`, `/share/:token`, `/app/artifacts/:id/embed`, `/app/artifacts/:id/present` |
| Data & integrations | `/app/data/sources`, `/app/data/connect`, `/app/data/connect/:type`, `/app/data/upload`, `/app/data/api`, `/app/data/webhook`, `/app/data/dbt`, source/table details |
| Governance | `/app/governance`, review, review detail, rules, lineage, manifests, preaggregations |
| Semantic layer | overview, explores, metrics, dimensions, joins, field picker, derived tables |
| Models | overview, run detail, model card, leaderboard, features, retrain center |
| Gold/contracts | gold tables, gold detail, query contracts, data contracts |
| Alerts | alerts center, create alert, alert detail |
| Collaboration | comments inbox, artifact comments drawer, team members, invite members |
| Admin | overview, roles, SSO, branding, secrets, usage, audit, sharing governance, RLS |
| Settings/support | profile, preferences, API keys, help, error pages |

## 7.2 Mockup inventory and parity scoreboard snapshot

The mockup package contains 34 `.dc.html` boards and approximately 95 labeled frames. `docs/specs/parity/PARITY_REPORT.md` (generated from `tests/ui/parity/parity.spec.js`) recorded, as of its last generation (2026-07-04, pre-R30):

```text
2 full parity
82 partial
3 route missing
8 context frames
95 total frames
```

**Staleness note:** this snapshot predates the R30, R31, and R32 story landings recorded above (32/64 stories, three full release closes with PAR-1 flips cited in each release's close-out). The frame counts above are known to undercount current parity — re-run `npm run test:parity` for a live scoreboard before quoting exact numbers.

Interpretation:

- The product has substantial route/surface coverage; R30–R32 closed out a large share of the PAR-1 gaps in Home/Activity, Artifacts, Workbench/Inspector, Governance, and Semantic frames (see each release's close-out for the specific flips).
- R33–R36 are organized to flip the remaining frames (Models, Sharing/Present, Marketing, Data, Gold/Alerts/Admin/Billing) by product area.
- Context frames such as inspector panels are story-spec coverage rather than independent routes.

---

# PART VIII — Known Deferrals, Remaps, and Open Dependencies

## 8.1 Deferred items from earlier UI gap closure and where they land

| Deferred item | Current destination |
|---|---|
| Present mode UI | R33S2E3 |
| SSO pages/backends beyond entitlement flags | R31 auth states + R36S2E3 admin SSO |
| Onboarding wizard | R31S1E3 |
| Folders | Not explicit in R30–R36; should be confirmed before program close if still required. |
| Recently-viewed tracking | R31S2E2 home polish, possibly R33/R36 if broader tracking required. |
| Per-link permission flags | R30S3E4 share modal and R33S2 sharing surfaces. |
| Secrets rotation UI | R36S2E4 admin security. |
| Comments drawer UI | R30S3E6 and R36S2E1. |
| Alert-rule builder UI | R36S1E3. |

## 8.2 Dependencies called out in pending stories

| Dependency | Used by |
|---|---|
| `/api/activity` typed projection over audit logs | R31S2E1 |
| Governance counts aggregate endpoint if absent | R32S1E1 |
| Bounded read-only preview endpoint | R32S2E3 |
| Embed settings persistence | R33S2E2 |
| Alerts CRUD + seeded trigger history | R36S1E3 |
| Roles key-value + audit row | R36S2E2 |
| Workspace settings key-value | R36S2E3 |
| Seeded invoice/payment endpoints | R36S3E1 |
| Preferences KV + hashed API keys | R36S3E2 |

---

# PART IX — Adaptation Ledger Consolidation

## 9.1 Program-wide architecture adaptations

- No external LLM endpoints are assumed in the implementation stack; deterministic/heuristic engines stand in for agent behavior.
- No Redis requirement in isolated sandbox; local LRU + SQLite persistence is the fallback path.
- Playwright browser CDN is blocked in sandbox; Chromium is provided via npm package.
- Flask serves API + client from one process for zero-key boot.
- Managed-tool integrations activate only when keys exist.

## 9.2 UI parity adaptations and incidents

- R22S1E2→R29 pending scope was retired and replanned into R30–R36.
- PRD screenshots folder was superseded by `docs/specs/parity/` and PAR-1 scoreboard.
- Some gap claims were stale versus code; R30+ stories diff against code before implementation.
- Host-side writes can truncate files on the mount; source edits should be done bash-side via anchor-asserted patches.
- The 2026-07-04 truncation incident affected `RELEASE_PLAN.md`/`PROGRESS.md` tails and was reconstructed from git, recon, and PRD.
- Test suites run chunked in this environment because of call-time limits.
- Repo consolidation (2026-07-05): untracked-from-index `tests/logs/`, `tests/__pycache__`, `storage/` runtime artifacts, `test-results/`, root scratch files; `.gitignore` rewritten to match actual repo structure; historical root docs consolidated into `docs/archive/`; `README.md`/`CLAUDE.md`/`AGENTS.md` rewritten to the current architecture (router, kit, 46 modules, gates, program pointer); `requirements.txt` reorganized (pytest, requests added); `docker-compose` rewritten SQLite-native (was stale Postgres).
- Chromium coordinate quirks require robust Playwright patterns for transformed/scaled ancestors.

---

# PART X — Verification Matrix

## 10.1 Standard checks

| Check | Command / meaning |
|---|---|
| Backend regression | `python3 -m pytest tests/ --ignore=tests/ui` |
| Backend chunked | `bash /tmp/be_chunks.sh reset` then repeat chunks |
| UI regression | `npm run test:ui` or chunked `bash /tmp/ui_chunks.sh reset` |
| Build | `npm run build` |
| Token lint | `npm run lint:tokens` |
| Parity scoreboard | `npm run test:parity` |
| Zero-key boot | `python3 server/app.py` then `/api/platform/status` all local |

## 10.2 Latest recorded milestones

| Milestone | Recorded result |
|---|---|
| R1–R7 backend foundation | 221 backend tests green; zero-key boot local fallback. |
| Evolution R8–R12 stop | 541 backend tests, 57 UI tests, build green, zero-key boot verified. |
| R21 release close | backend 414/414 · UI 72/72 · boot passed. |
| R30 release close | backend 423/423 · UI 121/121 · boot passed, shell 200. |
| R31 release close | backend 425/425 · UI 135/135 · boot passed, shell 200. |
| R32S1 sprint close | backend 433/433 · UI 145/145. |
| R32S2 sprint close / R32 release close | backend 440/440 · UI 153/153 · boot passed, shell 200 — **RELEASE R32 CLOSED, 32/64.** |

---

# PART XI — Immediate Next Execution Packet

## Active story: R33S1E1-US1 — Models overview

### Goal

Build `/app/models` (replacing legacy S14) as the first story of the Prediction & Distribution release: an aggregate overview of model training/registry state at PRD/mockup parity.

### Required scope

- 6 KPI cards summarizing model fleet health.
- Status-typed table with per-state actions (Retrain / Card / Retrain-now / View-logs).
- CHAMPION / DRIFT / RUN FAILED pills.
- New aggregate `GET /api/models/overview` over existing substrate — no new modeling logic, just composition:
  - training jobs/trials/promote (`server/app.py` ~5782–5849)
  - registry models/challenger (~5944–6035)
  - model_cards (~6037)
  - insights (~6052)
- Must not reintroduce internal vocabulary (§5.1 gate is live and will catch it).

### Recommended implementation sequence

1. RED test for `GET /api/models/overview` aggregate shape.
2. Implement the aggregate endpoint over the existing tables/routes (no schema changes expected).
3. RED UI spec for the Models overview screen anatomy per `Models.dc.html`.
4. Build the screen; wire per-state row actions to existing endpoints.
5. Run focused backend + UI tests, then full regression.
6. Update `PROGRESS.md` and this consolidated map; commit.

### Then, in order, closing Sprint R33S1 → Release R33

- R33S1E2 training run detail (tabs, stat cards, backtest chart, log).
- R33S1E3 model card (metrics tiles, importance bars, SHAP, linked artifacts).
- R33S1E4 leaderboard + feature manifest + retrain center.
- Sprint R33S1 regression → Sprint R33S2 (public viewer parity, embed preview/settings, present mode, error template ×8) → Release R33 regression + zero-key boot.

---

# PART XII — Final Source-of-Truth Summary

AnalytIQ has already completed the backend foundation, ingestion, governance, modeling, artifact interactivity, sharing, initial UI surfacing, evolution architecture, demo-grade PRD shell/workbench/contracts/people/distribution/enterprise layers, and exact shell/design-system parity. The active work is the final UI parity/build-out program, R30–R36.

**R30 (Core Loop Credibility), R31 (First-Run Journey), and R32 (Governance & Data Trust) are now fully closed** — 32 of 64 planned stories done, program exactly halfway. Each release closed with a full regression + zero-key boot check: R30 at backend 423/423 · UI 121/121; R31 at backend 425/425 · UI 135/135; R32 at backend 440/440 · UI 153/153 (all 8 platform services local, client shell 200).

The current live position is **R33S1E1-US1 Models overview** — the first story of Release R33 (Prediction & Distribution). Recon is done (mockup frames + substrate endpoints identified); no R33 code has been written yet, so this is a clean seam to start from. After R33 closes, the remaining program moves through the marketing site (R34), data layer surfaces (R35), and gold/alerts/org/admin/billing/settings (R36).

The product is no longer in an architecture-discovery phase. It is in a final mockup/PRD parity execution march, now past the halfway mark. In sitcom terms: the dragon has been tamed, named "DAGathan," taught tasteful typography in R30, sent through orientation and onboarding in R31, passed its compliance audit in R32, and is now being coached on how to predict things without sounding like a robot about it.
