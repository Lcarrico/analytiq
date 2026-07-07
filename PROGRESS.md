# AnalytIQ Gap-Closure Program — Progress

**Current position:** UI Parity & Build-Out Program (PRD v1.0) · PROGRAM COMPLETE (R30–R36) — 52/52 lead-owned stories; R34 (12 marketing stories) on the junior's parallel track  ← ACTIVE PROGRAM (see bottom section)
**Historical:** Backend R1–R7 + UI1–UI5 complete · 221 backend tests green at that point

## Release 1 — Platform Foundation ✅
- [x] R1S1E1-US1 Auth register/login/me + hashed tokens
- [x] R1S1E1-US2 Bearer identity resolution w/ legacy header compat
- [x] R1S1E2-US1 Resource-level ACLs (restrict-only)
- [x] R1S2E3-US1 Secrets provider abstraction + platform status
- [x] R1S2E4-US1 Job queue abstraction (SQLite fallback worker)
- [x] R1S2E5-US1 Object storage abstraction (filesystem fallback)
- [x] R1S2E6-US1 Structured request logs + latency metrics + email outbox
- [x] R1S2E7-US1 Full-text workspace search (FTS5 fallback)

## Release 2 — Ingestion & Connectivity ✅
- [x] R2S1E1-US1 File upload ingestion (CSV/XLSX auto-profiled)
- [x] R2S1E2-US1 Google Sheets connector (low-trust + null warnings)
- [x] R2S2E1-US1 Webhook ingest (tokened capability URL)
- [x] R2S2E2-US1 REST API source connector (poll + scheduler)
- [x] R2S2E3-US1 dbt project import (models → explores, tests → signals)
- [x] R2S2E4-US1 MySQL/DuckDB/Redshift/Databricks connectors + UI flip

## Release 3 — Governance & Semantic Depth ✅
- [x] R3S1E1-US1 Health trend history + alert thresholds
- [x] R3S1E2-US1 Per-table freshness SLA configuration
- [x] R3S1E3-US1 Schema drift alerting
- [x] R3S1E4-US1 Data contract enforcement (BLOCK + pipeline 409)
- [x] R3S1E5-US1 Custom DQ test authoring (safe expression subset)
- [x] R3S2E1-US1 Lineage edges + DAG endpoint w/ downstream artifacts
- [x] R3S2E2-US1 Date + geo hierarchy auto-detection
- [x] R3S2E3-US1 Calculated metrics + metric formats
- [x] R3S2E4-US1 Explore-level access control (planner filtering)
- [x] R3S2E5-US1 Artifact dependency / impact tracking
- [x] R3S2E6-US1 PDTs + pre-aggregation recommendations

## Release 4 — Sessions & Feature Engineering ✅
- [x] R4S1E1-US1 Session history, forking, templates
- [x] R4S1E2-US1 Streaming session messages (PRD SSE protocol + replay)
- [x] R4S1E3-US1 Pipeline step audit trail + related suggestions
- [x] R4S2E1-US1 Temporal features (lags/rolling/streaks) + holiday calendars
- [x] R4S2E2-US1 Encodings, rolling-median imputation, collinearity selection
- [x] R4S2E3-US1 Leakage HITL confirmation + reviewed custom features

## Release 5 — Model Training Upgrade ✅
- [x] R5S1E1-US1 Multi-candidate families (seasonal-trend/ridge-lite/naive) + ensemble
- [x] R5S1E2-US1 Seeded random search + RMSE/directional accuracy + stability gate
- [x] R5S1E3-US1 Permutation importance + SHAP-lite → gold.model_insights + concentration gate
- [x] R5S2E1-US1 Champion/challenger with >5% auto-promotion
- [x] R5S2E2-US1 Drift monitoring on refresh + one-click retrain
- [x] R5S2E3-US1 Model card completion (target_type, duration, lineage) + notify

## Release 6 — Artifact Interactivity ✅
- [x] R6S1E1-US1 gold.predictions/forecast tables + paginated gold query API (TTL cache)
- [x] R6S1E2-US1 Eight-panel artifact + validator panel-set check
- [x] R6S2E1-US1 Unified filter state + click-to-drill drawer + CSV export
- [x] R6S2E2-US1 Annotations (overlays + is_annotated_event) + metric alert subscriptions
- [x] R6S2E3-US1 Per-panel export, dark mode, print CSS, responsive, versions panel, repair loop (≤2), branding

## Release 7 — Sharing, Embeds & Workspace Polish ✅
- [x] R7S1E1-US1 Owner role + password-optional public share links (hourly snapshot, view counts)
- [x] R7S1E2-US1 HS256 embed tokens (allowed_origins, no elevation, cross-workspace gold access)
- [x] R7S2E1-US1 Favorites, tags, list filters, artifact activity feed
- [x] R7S2E2-US1 Timezone-aware cron schedules + SVG thumbnails
- [x] R7S2E3-US1 Proactive insight detection (anomaly/trend/weekday + drill-in) + workspace health dashboard artifact

## Verification
- Full regression: 221 tests green (multiple consecutive runs)
- Zero-key boot: 155 routes, every platform service in local fallback mode
- Story logs in `tests/logs/` (r<release>s<sprint>_<epic>_<timestamp>.log)

## Blockers
- None.

## UI Gap-Closure Program
- [x] UI1 API client + auth plumbing + Account screen
- [x] UI2 Platform admin screen
- [x] UI3 Governance depth (Governance ops screen)
- [x] UI4 Models screen
- [x] UI5 Sessions & artifacts polish (S06 suggestions/fork, S08 audit cards, S10 search/favorites/insights/links/embed/activity/health-dashboard)

---

# Evolution Program (Architecture v2.1 Parts XVII–XVIII)

**Current position:** Release 13 · Sprint 13.1 · Epic E1 (Automatic Benchmark Library) · R13S1E1-US1
**Suite:** 541 backend tests green · 57 UI tests green (sharded) · client build green · zero-key boot verified (8 services local)
**Blockers:** none

Plan: `RELEASE_PLAN.md` → "Evolution Program" section (Releases 8–14, all 35
Part XVII enhancements mapped to stories).

## Phase 0–2 — Recon, Plan, Test Infrastructure ✅
- [x] Recon: baseline 221 green; 35 enhancements classified (30 missing, 5 partial)
- [x] Release plan extended (R8–R14, dependency-ordered per §18.4)
- [x] Playwright UI harness: `tests/ui/` + `playwright.config.mjs` + `npm run test:ui`
  (boots zero-key server, fresh temp DB, SIM_DELAY_SCALE=0, logs to
  `tests/logs/ui_*.log`, screenshot+trace on failure)
- [x] Restored lost `python server/app.py` entry point; Flask now serves
  `client/dist` (one-process zero-key boot)

## Release 8 — Graph Substrate ✅
- [x] R8S1E1-US1 Unified Artifact Store: immutable content-addressed store + pipeline chain + provenance API/panel
- [x] R8S1E2-US1 Caching hierarchy: 4 version-keyed layers, gold API on query layer, S12 panel
- [x] R8S2E3-US1 DAG execution: content-addressed nodes, edge-contract gates, cached re-runs, unified lineage/execution graph + UI badges

## Release 9 — Execution Engine ✅
- [x] R9S1E1-US1 Cost-aware orchestration: ladder cache→template→small→frontier, ACL-scoped cache identity, telemetry + S12 panel
- [x] R9S1E2-US1 Parallel execution: viz_specs branch, wave executor + worker pool, budget endpoint, join-barrier gates (root-caused cross-session cache gate bug)
- [x] R9S1E3-US1 Event-driven execution: platform_events + trigger registry, targeted recompute via content addressing, drift→retrain job, investigation stubs, S12 feed
- [x] R9S2E4-US1 Meta-orchestrator: deterministic grain arbitration, deduped systemic-failure triage + admin email, priority queue sweep, checkpoint-skip refusal (409, audited)
- [x] R9S2E5-US1 Multi-agent collaboration: consultation bus + semantic responder, viz consults for metric format mid-run, SSE + audit first-class, S12 feed
- [x] R9S2E6-US1 Sandbox mode: namespaced UAS + salted node hashes (no cache cross-seeding), hidden from prod list/search, gate-gated promotion (409 on BLOCK), S10 toggle/badge/promote
- [x] R9S2E7-US1 Autonomous optimization: slow-SQL/index/cache-key/M2M-join proposals (deduped, index-aware), admin-only decisions, provably never auto-applied, S12 review panel

## Session stop note (2026-07-03, sixth update)
Releases 8–12 complete — 27 of 35 Part XVII enhancements implemented,
stopped green. Nothing half-decided; next story is R13S1E1-US1 (Automatic
Benchmark Library) with final ACs in RELEASE_PLAN.md. Release-12
adaptations: ROI cost model = matched dispatch telemetry + 0.001/DAG-node
compute constant (documented in server/roi.py); ROI/health reports follow
the R7 native-artifact pattern (eight-panel template + embedded section).

## Release 10 — Knowledge Layer ✅
- [x] R10S1E1-US1 Persistent agent memory: PII-gated writes, half-life decay, planner grain prior (explicit turn always wins), spec/dismissal write paths, Account viewer with forget
- [x] R10S1E2-US1 Knowledge graph: 5 typed edge kinds, incremental ingest (artifact/spec/calc-metric), related+co-analysis APIs, S06 related chips
- [x] R10S1E3-US1 Intent history: question→spec→artifact chain recorded per user, non-committal warm-start hints API + S06 banner, empty for new users
- [x] R10S2E4-US1 Adaptive planning: expertise-conditioned threshold (novice +0.05 / expert −0.10, 0.85 base preserved + admin-tunable), mode-scoped plan cache, inline expert assumptions in S06
- [x] R10S2E5-US1 Semantic evolution: new-metric/deprecation/rename/merge proposal engine (deduped, evidence-annotated), admin-only decisions, canonical schema provably never auto-mutates, S05 review queue
- [x] R10S2E6-US1 AI-assisted review: evidence-ranked triage (usage + similarity-to-approved + conflict flags w/ gate ref), deterministic score, authority unchanged, S05 triage panel + /governance/latest deep-link
- [x] R10S2E7-US1 Knowledge reuse: UAS+KG similarity candidates (sandbox excluded, KG-related surface without text overlap), reuse re-runs full spec validation (422 paths), S06 starting-point chips

## Release 11 — Trust & Explainability ✅
- [x] R11S1E1-US1 Explainability engine: composed lineage/SQL/semantic/bindings + model card & gates for predictions, component filter, provably read-only, S10 Explain panel
- [x] R11S1E2-US1 Confidence propagation: weighted-minimum v1 over intent/leakage/MAPE stages, persisted + explain breakdown, low-flag rendered state + S10 badge
- [x] R11S2E3-US1 Replay/debugger: read-only DAG walk w/ stored UAS payloads + gate results, cached nodes cite source run, repair attempts persisted at all render sites (retained when resolved), S10 drawer
- [x] R11S2E4-US1 Diff engine: structural diff (keyed-list matching) across schema/plan/manifest/model-card, semantic lifecycle summary (added/deprecated/redefined), S05 compare chips
- [x] R11S2E5-US1 Health scoring: 5-component composite (validator, aria gate, KG redundancy, p95 latency, adoption), breakdown + workspace rollup APIs, S10 health chips

## Release 12 — Evolution Engine ✅
- [x] R12S1E1-US1 Opportunity engine: post-assembly anomaly/causal/forecast-gap evaluation (insight engine reused by reference), accept→pre-seeded session only (never auto-runs), dedupe, S10 panel
- [x] R12S1E2-US1 Feedback loop: accept/dismiss/ignore recorded across opportunity/semantic/optimization deciders, 3-dismissal suppression w/ >20% signal-strengthening release, rates API + S12 panel
- [x] R12S2E3-US1 Self-improving loop: 4-signal miner (popular/abandoned/repeated-edit/recurring-failure) w/ audited delivery, semantic evolution consumes edit signals, S12 panel
- [x] R12S2E4-US1 Model monitoring: Kendall-tau importance reorder + PSI input drift (alerts even when MAPE fine), drift events → retrain jobs, artifact-scoped route + S10 chips
- [x] R12S2E5-US1 ROI tracking: weighted adoption signals vs dispatch+compute cost model, per-artifact ROI API, report generated as a native eight-panel artifact (own gates), S10 button

---

# UI-PRD Gap Program (PRD v3.0 + mockups)

**Current position:** PROGRAM COMPLETE — all closure steps delivered; deferred list above
**Suite:** see header suite line (single combined suite)
Plan: `RELEASE_PLAN.md` → "UI-PRD Gap Program" (R15–R23 per gap-analysis §22).
Specs pinned in `docs/specs/` (gap analysis, UI PRD, PLAN.md design language).

## Release 15 — Foundation ✅
- [x] R15S1E1-US1 URL routing: react-router, PRD route map over 14 legacy screens, nav(n) shim, deep links + back + 404, '/'→/app
- [x] R15S1E2-US1 App shell: 240px light sidebar (13 areas, groups, collapse rail), topbar (workspace chip, ⌘K search overlay on FTS, bell badge, avatar menu), breadcrumbs, placeholder pages; 27 legacy specs migrated (contract change cited)
- [x] R15S2E3-US1 Tokens + components: PLAN.md palette, StatusBadge/Tabs/Drawer/DataTable/KPI/ViewToggle, S10 sortable table view (pagination-proofed test)
- [x] R15S2E4-US1 Role-aware UI: useRole + AdminOnly dark treatment, viewer loses Admin/Billing/Governance nav + 403 page, admin console intact

## Release 16 — Create Workbench ✅
- [x] R16S1E1-US1 Workbench chat: start state + typed examples, clarify chips w/ confidence, inline plan card w/ ACCESS disclosure (plan API gains access_limitations), Approve & Build; single-route mount preserves chat state; legacy quick-plan at /app/create/quick
- [x] R16S1E2-US1 Live build: 7 DAG-driven stage chips (cache ⚡, blocked ✕), auto-save on completion, canvas w/ KPI strip + real SVG timeseries/forecast sections (CONTRACT ✓ chip), GOVERNED badge + autosave chip
- [x] R16S2E3-US1 Inspector: 6 tabs (Design bindings + why-this-chart, Data gates, Pipeline steps, Insights scan/list, Share link, UAS Versions)
- [x] R16S2E4-US1 Canvas edits (Evo #32 slice): layout_json sections, PATCH classify layout vs semantic (semantic re-renders through validated assembly), UAS-versioned, rename/reorder toolbar

## Release 17 — Contracts substrate ✅
- [x] R17S1E1-US1 Per-component query+data contracts persisted at gold_build (arch §7.2/7.3; component_data_contracts to avoid legacy name), /pipeline/:run/contracts + /gold/catalog, Gold Tables screen, Inspector Data tab on real contracts

## Release 18 — People layer ✅
- [x] R18S1E1/E2 Notifications (inbox, unread, mention fan-out, alert fan-in, live bell + drawer + mark-all), workspace activity feed (typed audit join), threaded section-anchored comments w/ resolve + inbox tabs, invite lifecycle (tokened, emailed, 410 on reuse) + roster + 25-seat accounting + Team page

## Release 19 — Distribution ✅
- [x] R19S1E1-US1 Narrative engine (Evo #25: grounded, 3 audiences, deterministic), /embed/:token w/ server-side origin enforcement, PDF (pure-python) + PNG (Pillow) exports, artifact duplicate, /api/public/:token/meta + branded shell-free /share/:token viewer w/ freshness badge. Present-mode deferred (notes engine ready).

## Release 20 — Enterprise ✅
- [x] R20S1E1-US1 Token metering (per-tier token counts on dispatches, cycle rollup by capability/consumer, 50/75/90 soft thresholds + cap status, $8/100K overage figure), plan catalog + entitlement gating (starter blocks public links — 403), RLS policies (safe-subset expressions, enforced on gold reads, simulator), audit severity + CSV/JSON export, Billing page (plan card + live meter)

## Releases 13+14 — Evolution completion ✅ (delivered 2026-07-03 under stray labels “R21/R22”; test files renamed r21s1→r13s1 on 2026-07-04 — see Design-Parity numbering reconciliation)
- [x] Observability as a native artifact (cache/dispatch/repair/event telemetry embedded, own gates)
- [x] Benchmark library #13 (historical from gold; peer/budget/seasonal only when registered — never fabricated)
- [x] Viz experimentation #31 (ranked alternates per §8.3 + one-click swap through the semantic-edit path)
- [x] Plugin validators #14 (declarative row-floor checks joining the walk_forward→artifact_ready edge as plugin:<name> gates — sandboxed, cannot bypass built-ins)
- [x] Business process integration #35 (slack/teams/jira/email outbound actions, console/outbox fallback, audited)
- [x] Template marketplace #33 (package session plan w/ $METRIC parameterization; apply re-resolves + re-validates into a new session)

## Marketing shell ✅ (delivered as legacy “R23”; reconciled to R29 precursor slice — spec file renamed r23s1→r29s1_marketing.spec.js 2026-07-04)
- [x] Landing at '/' (hero, stat chips, value cards, trust strip, Start Free → /app) + /pricing (4 plan cards); 28 specs migrated to /app entry (cited)

## Program state — COMPLETE (demo-grade parity per gap-analysis ✅ definition)
Every §22 closure step delivered as tested vertical slices. Deferred items
(recorded, not silently dropped): present mode UI (narrative engine ready),
SSO pages/backends beyond entitlement flags, onboarding wizard, folders,
recently-viewed tracking, per-link permission flags, secrets rotation UI,
comments drawer UI (API complete), alert-rule builder UI (subscriptions API
exists). Each remains scoped in RELEASE_PLAN.md for future sessions.

## Adaptation ledger (Evolution Program)
- Spec assumes LLM agents; implemented deterministic/heuristic engines (no
  LLM endpoint in stack) — consistent with R1–R7. (program-wide)
- Spec's caching assumes Redis; provider interface with in-process LRU +
  SQLite fallback, `REDIS_URL` flips to real. (R8S1E2)
- Playwright browser CDN blocked in sandbox; chromium binary via
  `@sparticuz/chromium` (npm) + `launchOptions.executablePath`. (Phase 2)
- Workspace mount ~12x slower for the PW runner + forbids file deletion;
  `tests/ui/run_ui.sh` executes from a local workdir and mirrors logs back;
  `vite build` uses `--emptyOutDir=false`. (Phase 2)
- Working-tree `server/app.py` had lost its `__main__` entry block and ended
  in a truncated `finally:`; restored as part of zero-key boot. (Phase 2)
- File edits on sources are applied bash-side (mount sync from the host side
  proved laggy/partial for large files); every batch edit is anchor-asserted
  and syntax-parsed before tests run. (program-wide)

## Verification (Evolution Program)
- Backend: `python -m pytest tests/` (from repo root)
- UI: `npm run test:ui` (sandbox) or `npx playwright test` (native checkout)
- Zero-key boot: `python server/app.py` → serves API + client on :3001,
  `/api/platform/status` all services `local`
- Build: `npm run build`

---

# UI Parity & Build-Out Program (PRD v1.0) — R30–R36

> Retitled 2026-07-04 (was "Design-Parity Program, R21–R29"). R21 + R22S1E1 below are that program's delivered history, kept verbatim; the pending R22S1E2→R29 scope was retired and re-planned as R30–R36 against the canonical PRD — old→new ID map in RELEASE_PLAN.md → "UI Parity & Build-Out Program → Reconciliation (2026-07-04, PRD v1.0)".

**Current position:** PROGRAM COMPLETE (R30–R36) — 52/52 lead-owned stories; R34 (12 marketing stories) on the junior's parallel track  ← next story

> **Session 11 stop note (2026-07-06, RELEASE R35 CLOSED):** 46/64. R34 runs in
> parallel with Leo's junior (handoff brief at the top of the R34 section in
> RELEASE_PLAN — pricing-data lock + vocab gate called out). R35 shipped all 6
> data-layer stories: sources list over a new aggregate; connector grid (S02
> retired, credential drawer rehomes its form map; kit spec now points at a
> permanent legacy-Badge exhibit on /app/__kit); snowflake wizard with REAL
> enforced table scope (connections.scope_json filters the governance catalog)
> + per-table SLAs + live health check; import flows ×4 (upload profiles now
> run the real PII scan; webhook token shown once; dbt manifest → semantic
> schema version); source detail (8 tabs incl 7-day gate tally) and table
> detail (editable audited business definition; lineage "Open table detail"
> flipped live). S03/S04 tombstoned at close-out — the wizard is fully gone.
> Gates: backend 456/456 · UI 177/177 · zero-key boot 8/8 local + shell 200.
> Recurring testid-prefix-collision gotcha (child testids sharing a row's
> prefix) hit twice more — prefer distinct child prefixes. Next: R36S1E1
> gold tables list + detail (frames in `Gold Contracts.dc.html`? check
> mockup ls), then contracts, alerts CRUD DEP, collaboration, admin, billing
> + settings — the final release.

> **Session 10 stop note (2026-07-06, RELEASE R33 CLOSED — one release per the
> user's working rhythm):** 40/64 stories. This session shipped all 8 R33
> stories: the models pillar (overview w/ live KPIs + typed rows + real
> retrain/evaluate/archive; run detail w/ 6 tabs over run truth; model card
> w/ importance + SHAP + linked artifacts; leaderboard + feature-manifest
> viewer [S14 composer rehomed] + retrain center w/ live drift checks) and
> the sharing surfaces (viewer parity w/ real range filters over the new
> token-gated public chart endpoint + designed expired card; embed preview
> w/ persisted settings DEP + origin-enforced tokens; chrome-free present
> mode fed by the narrative engine; error template ×8 wired into 404/403).
> Substrate fixes en route: cross-session physical gold collision
> (session-scoped tables + delete-then-insert), models overview MAPE from
> val/test metrics, narrative payload key alignment. S14 retired. Gates:
> backend 448/448 · UI 166/166 · zero-key boot 8/8 local + shell 200.
> Environment notes: sandbox recycled mid-session (runners + sidecar index
> rebuilt from the ledger); Leo's Windows commit "massive updates" merged
> cleanly underneath (autocrlf=true set repo-local; his git maintenance
> leaves stale locks incl. refs/heads/main.lock — rename-aside works);
> heavy 2-test specs can exceed the 44s wall — split with `-g` per test.
> Next: R34S1E1-US1 MarketingNav + dark footer (`Marketing*.dc.html`
> frames; keep `r30s1_pricing_data` lock green; rename r29s1_marketing spec
> with the owning story).

> **Session 9 stop note (2026-07-05, paused green for GitHub push):** RELEASE R32
> CLOSED — 32/64 stories, program halfway. This session shipped 7 stories:
> R32S1E3 (definition diff), E4 (DQ rules + settings-aware gate engine),
> E5 (lineage graph, 6 node kinds, ?node= deep links), E6 (manifest versions
> + pre-agg; S13 retired) closing sprint R32S1; R32S2E1 (semantic overview /
> explores / detail; S05 retired with evolution-proposals, evidence-triage and
> schema-compare panels rehomed onto the overview; vocab ledger pruned),
> E2 (metrics + dimensions catalogs, conflict/deprecated lifecycle), E3 (field
> picker + DEP seeded preview endpoint, join paths, derived tables w/ dry run)
> closing sprint R32S2 and the release. Gates: backend 440/440 · UI 153/153 ·
> zero-key boot all 8 services local · client shell 200. Tree clean at
> 6835c09 (+ this note). Next: R33S1E1-US1 models overview (`/app/models`,
> replaces S14) — recon done: frames in `Models.dc.html` (6 KPI cards +
> status-typed table w/ per-state actions); substrate = training jobs/trials/
> promote (:5782–5849), registry models/challenger (:5944–6035), model_cards
> (:6037), insights (:6052); plan is an aggregate `GET /api/models/overview`
> RED-first, then the screen. No R33 code written yet — clean seam.
**Spec (canonical):** `specs/prd-package/AnalytIQ Mock Up Comparison Analysis/PRD - AnalytIQ UI Parity & Build-Out.md` (checklist demoted to supporting doc)
**Suite:** 416 backend green · 82 UI green (75 + 7 gating flows) · build + lint green (2026-07-04 20:00Z) · plan: RELEASE_PLAN.md → "UI Parity & Build-Out Program"
**Sprint R21S1 regression:** backend 412/412 · UI 67/67 (2026-07-04 19:05Z)
**Sprint R21S2 regression:** backend 414/414 · UI 72/72 (2026-07-04 19:45Z)
**Release R21 regression + zero-key boot:** backend 414/414 · UI 72/72 · boot check passed — 8 services local, client shell 200 (2026-07-04 19:45Z)
**R22S1E1 story regression:** backend 416/416 · UI 75/75 (2026-07-04 19:20Z)

## Release R21 — Design-System & Shell Parity ✅ (all 12 stories)
**Blockers:** none

Spec: `docs/specs/GAP_ANALYSIS_DESIGN_PARITY_CHECKLIST.md` (2026-07-04) + `UI_MOCKUP_ANALYSIS.md` + 34 `.dc.html` mockups (the frame is the spec).

## Phase 0–2 — Recon, plan, infrastructure
- [x] Recon: mockups extracted & verified against checklist §0.2 (sidebar/topbar markup matches); current-state audit confirmed (legacy `C` in 16 files, 77 junk timestamp files, emoji chrome)
- [x] Numbering reconciled: legacy r21s1/r23s1 artifacts → r13s1/r29s1 (unique grep per program)
- [x] RELEASE_PLAN.md: full R21–R29 tree (releases→milestones→sprints→epics→stories→ACs→tasks/subtasks, backend/UI separated per story)
- [x] Test infra re-verified: backend 412/412 · UI 58/58 ×2 (stable) · build green (2026-07-04; prior header's “541 backend” not reproducible in current tree — 412 collected, noted)
- [x] Order-dependent flakes root-caused after r13 rename: r15s1 back-nav assertion updated to R16S1E1 redirect contract; r16s1 ambiguous-prompt test isolated with a fresh user (adaptive planning R10S2E4 couples threshold to user history)

### Milestone DP-A — Foundation parity ✅
- [x] R21S1E1-US1 P tokens complete (18 frame colors) + T typography scale + window.__TOKENS__ hook
- [x] R21S1E1-US2 eslint no-restricted-imports wall (`npm run lint:tokens`; 18 grandfathered files pinned in config)
- [x] R21S1E1-US3 77 vite timestamp junk files deleted; .gitignore covers dist + timestamps
- [x] R21S1E2-US1 primitive kit rebuilt to §0.2 — 22 primitives + /app/__kit gallery (computed-style asserted)
- [x] R21S1E2-US2 kit parity screenshot captured by the spec (docs/specs/parity/kit/app.png @1440)
- [x] R21S1E2-US3 compat: legacy Badge/Btn APIs render pill/h34 specs (S02 probe; ui.jsx off the lint grandfather list)
- [x] R21S1E3-US1 icons.jsx (30 frame-extracted 15px strokes + shared Logo); zero emoji in src (grep-enforced test); dead Sidebar.jsx deleted; replay/DAG cached-marker copy updated (cited)
- [x] R21S2E1-US1 sidebar parity: frame groups/labels/logo-row/active styles (computed-style asserted vs #home)
- [x] R21S2E1-US2 64px rail keeps centered SVG icons + tooltips
- [x] R21S2E2-US1 topbar parity: AR chip, 520×36 pill + ⌘K keycap, red-ringed bell, help→/app/help, 34px avatar
- [x] R21S2E3-US1 shell breadcrumb strip removed; PageHeader auto-crumb `acme-retail / <area>`; main 28/32; body #f7f8fa (r15 spec migrated, cited)
- [x] R21S2E4-US1 drawer parity: 420px, All/Unread·n/Mentions tabs, day groups, 5-kind tinted tiles, unread wash+border+dot; backend contract locked (kind/created_at/link)

## Release R22 — Core App Screens — closed early 2026-07-04 (remainder superseded by R30–R36, see Reconciliation)
- [x] R22S1E1-US1 workspace home: /api/home/summary aggregate (admin-gated usage) + Frame-01 screen (hero + 8 live widgets, parity shot)
- [x] R22S1E1-US2 hero ⏎ → /app/create/new?q=… consumed once by Workbench planning turn
- [x] R22S1E1-US3 S01 deleted; /app routes to Home; lint grandfather pruned
- Retired → new IDs: R22S1E2→R31S2E1 · R22S2E1→R30S1E2 · R22S2E2→R30S1E3 · R22S2E3→R30S1E4

## Release R30 — PRD Phase 1: Core loop credibility (pending)
### Milestone UP-A — The product spine is demo-honest
- [x] R30S1E1-US1 pricing data hotfix — ch02 facts live on /pricing; 3-test data lock stays green through R34S1E4 (UI 85/85 · backend 416/416, 2026-07-04)
- [x] R30S1E2-US1 library card view + rail; ROI → per-card ⋯, Sandbox/Health → header ⋯ (ruling recorded); FTS leak gone; 13 legacy specs migrated w/ citations (UI 91/91 · backend 416/416, 2026-07-04)
- [x] R30S1E3-US1 library table view — Frame 02 columns (owner avatar+name, scored health pill, relative times, share, tags, ⋯), sort indicator, ?view=table reload-persistent (UI 93/93 · backend 416/416, 2026-07-05)
- [x] R30S1E4-US1 artifact detail — /app/artifacts/:id, 8 routed tabs, editable title (new PATCH rename, audited+reindexed), internals distributed to Model/Pipeline/Lineage tabs, S10 tombstoned (UI 97/97 · backend 419/419, 2026-07-05)
- [x] R30S1 sprint regression: backend 419/419 · UI 97/97 (2026-07-05) — SPRINT R30S1 CLOSED (4/4 stories)
- [x] R30S2E1-US1 workbench chrome — 56px session topbar (title/meta/GOVERNED/autosaved/Versions/Share/avatar) replaces workspace topbar on /app/create/*; rail forced 64px (e); flows migrated w/ citation (UI 100/100 · backend 419/419, 2026-07-05)
- [x] R30S2E2-US1 chat parity — status lines, Review-your-plan card (Dimensions/Forecast/Sources, metric chip, row-edit pencils, Edit/Cancel, APPROVED pill), clarify Not-sure/Use-recommended chips, agent tiles, done follow-ups + refine composer (UI 103/103 · backend 419/419, 2026-07-05)
- [x] R30S2E3-US1 center states start/empty/building (9 stage chips, PII banner, event log) [was R23S1E3 pt1] ✅ (9 display stages ×3 states, run meta, SKIP pill, PII banner, live event log + admin detail; r16s1_canvas migrated)
- [x] R30S2E3-US2 canvas state (toolbar h44, filters h40, human titles, chart anatomy) [was R23S1E3 pt2] ✅ (44px toolbar: zoom/device/present/export/lineage/audit + v·saved; 40px filters bar w/ working Hide-forecast chip; human titles + $ KPIs + legend + today divider)
- [x] R30S2E3-US3 section select (2px blue border + floating dark toolbar) [was R23S1E3-US2] ✅ (selected 2px blue + floating dark toolbar: Rename/chart-type(persisted)/vs-target/Move/⠿) — UI 107/107 · backend 419/419, 2026-07-05
- [x] R30S2E4-US1 inspector Design tab + tab-set ruling; overflow fixed; §5.3 cite gone [was R23S1E4] ✅ (ruled strip Design·Data·Pipeline·Lineage·Model·Comments·Share; dense tabs fit 340px; Design = live editing panel (rename/6-tile picker/vs-target toggle/validation pills/REPLACE-WITH); §5.3 dead; r16s2_inspector migrated — UI 110/110 · backend 419/419, 2026-07-05)
- [x] R30S2 sprint regression recorded: backend 419/419 · UI 110/110 (2026-07-05) — SPRINT R30S2 CLOSED (6/6 stories)
- [x] R30S3E1-US1 data trust contracts panel (expected bands; gate dump gone) [was R23S2E1] ✅ (human-named trust accordions w/ PASSED/1 WARNING pills + tinted warning headers; Rows/Range/Query/Freshness/Gates rows; raw gate:PASS dump dead; r17s1 migrated — UI 111/111 · backend 419/419, 2026-07-05)
- [x] R30S3E2-US1 pipeline audit panel (human stage names; admin block) [was R23S2E2] ✅ (RUN header + ALL GATES pill, stage cards w/ status circles + repair labels, Input/Gate result/Output rows, §5.6 admin-toggle tech block, real Fork-from-here via session fork; r16s2+r17s1 migrated — UI 113/113 · backend 419/419, 2026-07-05)
- [x] R30S3E3-US1 insights panel (tinted tiles, CONF pills, Investigate→chat) [was R23S2E3] ✅ (auto-detected mono header, tinted tiles, colored mono categories — no snake_case, Investigate seeds a workbench planning turn from drill_question — UI 114/114 · backend 419/419, 2026-07-05)
- [x] R30S3E4-US1 share modal 520 (visibility cards, 7-tile distribute, advanced) [was R23S2E4] ✅ (canonical 520px modal: 4 visibility cards, real signed-link minting + Copy, 7-tile distribute (Embed/HTML/Link live), advanced expires/password/checkboxes + real Revoke via new expiry-based endpoint; canonical from detail/workbench/library triggers; interim modal removed — backend 421/421, 2026-07-05)
- [x] R30S3E5-US1 version history (topbar-opened; dependency chips; hash leak gone) [was R23S2E5] ✅ (topbar-opened drawer; real artifact_files timeline; human dep chips, zero hashes; append-only Restore endpoint + ?version html for Compare — UI 116/116 · backend 423/423, 2026-07-05)
- [x] R30S3E6-US1 comments drawer + pins (R18 APIs; contract-lock) [was R23S2E6] ✅ (400px drawer w/ Open/Resolved counts, §-anchor chips, nested replies, real create/reply/resolve over R18 API, Ask-AI-to-apply seeds refine composer + hands off; numbered pins + reply popover on anchored sections; toolbar keeps selection (bug fixed) — UI 117+1skip · backend 423/423, 2026-07-05)
- [x] R30S3E7-US1 wizard retirement (S06–S09 deleted; routes redirect) [was R23S2E7] ✅ (S06–S09 tombstoned; quick/confirm/run→workbench start, result→library; four planning surfaces PORTED to the chat — warm-start hints, KG-related, assumptions line, reuse candidates; 5 specs migrated w/ citations; id-mapped msg updates root-caused — UI 120/120 · backend 423/423, 2026-07-05)
- [x] R30S3E8-US1 forbidden-vocabulary gate (§5.1 kill-list + allowed-until ledger) [NEW] ✅ (source-level §5.1 gate w/ comment stripping; EXACT-EQUALITY vs the allowed-until ledger — found+ledgered 3 extra (§ citations in S05/S11/S12; stale entries fail too)
- [x] R30S3 sprint regression recorded (vocabulary suite gating from here): backend 423/423 · UI 121/121 (2026-07-05) — SPRINT R30S3 CLOSED (8/8)
- [x] R30 release regression + zero-key boot recorded: backend 423/423 · UI 121/121 · boot check PASSED — 8 services local, client shell 200 (2026-07-05) — RELEASE R30 CLOSED (18/18 stories)

## Release R31 — PRD Phase 2: First-run journey (pending)
### Milestone UP-B — Register → onboard → live home
- [x] R31S1E1-US1 standalone auth + register wizard (+PBKDF2-unreachable AC) [was R28S1E1] ✅ (standalone /login + /register: 420px card on #f2f4f8 stage, labeled fields, forgot link, 3 SSO buttons, magic-link box, 4-step wizard w/ strength meter + role cards + invite chips + first-path rows driving the REAL register→login; S11 rewritten (leaks dead, vocab ledger pruned ×3); R10 memory surface kept behind §5.6 admin affordance + payload shape fixed — UI 124/124 · backend 423/423, 2026-07-05)
- [x] R31S1E2-US1 auth states ×4 (forgot/verify/SSO callback ×2) [was R28S1E2] ✅ (forgot-password form→sent, verify-email, SSO signing-in auto-advance, no-workspace-access red variant — UI 128/128 · backend 423/423, 2026-07-05)
- [x] R31S1E3-US1 onboarding ×4 (branding/start-mode/source-health/template picker) [was R28S1E3] ✅ (branding wizard w/ live-preview swatches persisting through PUT /api/branding; 5 starting-mode cards; source-health preview over the REAL profiling path (connection→governance run→cataloged tables, latest-run reuse); data-aware template picker seeding the workbench; register→onboarding flow wired — UI 132/132 · backend 423/423, 2026-07-05)
- [x] R31S1 sprint regression recorded: backend 423/423 · UI 132/132 (2026-07-05) — SPRINT R31S1 CLOSED (3/3)
- [x] R31S2E1-US1 activity page (DEP /api/activity; +View-all links ×2) [was R22S1E2, full carry] ✅ (server/activity.py typed projection over audit_logs — kind buckets, cursor pagination, entity links; /app/activity page w/ filter pills + timeline anatomy + Load more; View-all links in Home header AND drawer footer; ▾ glyph → svg per the emoji gate — UI 134 · backend 425/425, 2026-07-05)
- [x] R31S2E2-US1 home polish deltas (bell-at-zero hidden + r18 contract migrated; ring thresholds; thumbs; usage mini-chart) [NEW, ch10 §2–7] ✅ (bell badge unmounts at zero + r15s1/r18s1 contracts migrated; health values state-colored + donut threshold; review widget amber count/dot bullets/bottom link; viewed thumbs; usage w/w delta + 7-bar chart from new server daily series; captions 12.5 — UI 135/135 · backend 425/425, 2026-07-05)
- [x] R31S2 sprint regression recorded: backend 425/425 · UI 135/135 (2026-07-05) — SPRINT R31S2 CLOSED (2/2)
- [x] R31 release regression + zero-key boot recorded: backend 425/425 · UI 135/135 · boot check PASSED — 8 services local, shell 200 (2026-07-05) — RELEASE R31 CLOSED (5/5 stories)

## Release R32 — PRD Phase 3: Governance & data trust (pending)
### Milestone UP-C — Trust surfaces at parity
- [x] R32S1E1-US1 governance overview KPI tiles (DEP counts aggregate) [was R25S1E1] ✅ (new /api/governance/summary aggregate over the real substrate; overview KPI cards + amber pill + span-2 health-trend sparkline; ops-page leaks absent — UI 136/136 · backend 426/426, 2026-07-05)
- [x] R32S1E2-US1 review queue (tabs+counts, bulk, typed pills, Accept/Edit/Reject) [was R25S1E2] ✅ (typed tab counts, bulk approve, checkbox table, TYPE pills, colored confidence, real Accept/Edit/Reject over the reviews API w/ server audits; governanceLatest run_id shape fixed workspace-wide — UI 137/137 · backend 426/426, 2026-07-05)
- [x] R32S1E3-US1 definition-review diff (side-by-side, dark SQL diff, audit line) [was R25S1E3] — done: GovernanceDiff.jsx (`/app/governance/review/:id`, CURRENT vs PROPOSED w/ derived expression block, evidence + affected chips, editable final def, approve→accept/edit + reject, audited); queue name-cell deep-links; `GET /api/reviews/items/<id>` (+404). BE 427/427, UI 139/139.
- [x] R32S1E4-US1 DQ rules master-detail (replaces S13 raw config 1:1) [was R25S1E4] — done: GovernanceRules.jsx (`/app/governance/rules` master-detail, typed pills, live toggles, editor w/ type dropdown + admin SQL + block-on-failure); `GET/PUT /api/dq/rules` merged catalog + settings (audited); engine honors disable→SKIPPED + block up/downgrade; run skips disabled tests. BE 431/431, UI 141/141.
- [x] R32S1E5-US1 lineage graph (6 node types, downstream highlight, ?node= deep links) [was R25S1E5] — done: GovernanceLineage.jsx (`/app/governance/lineage` dot-grid canvas, 6-kind legend/columns, zoom/auto-layout, downstream BFS highlight, detail panel w/ IMPACT IF BROKEN, `?node=` deep links; ArtifactDetail lineage tab links in); /api/lineage grew source/metric/model nodes + row_count. BE 432/432, UI 143/143.
- [x] R32S1E6-US1 manifest versions + pre-agg recs; S13 retired/redirected [was R25S1E6] — done: GovernanceManifests.jsx (status pills REVIEW REQUIRED/ACTIVE/SUPERSEDED, expandable +ADD/~MOD/−DEL diffs via `?diffs=1`, Approve→review queue, real audited Rollback) + GovernancePreagg.jsx (value pills, hit share, demo-derived speedup/cost + $50 ceiling; materialize/dismiss owned by R36S1); S13 retired (tombstone, routes live under /app/governance/*); Btn now forwards native disabled. BE 433/433, UI 145/145.
- [x] R32S1 sprint regression recorded — full suites green at sprint close: backend 433/433 · UI 145/145 (2026-07-05)
- [x] R32S2E1-US1 semantic overview + explores + explore detail (replaces S05) [was R25S2E1] — done: Semantic.jsx (overview KPI cards + MANIFEST pill + real Regenerate/generate; explores table w/ health/confidence/used-by; explore detail w/ 6 tabs + "Analyze this explore" ?q= seed); `GET /api/semantic/<ws>/summary` + `/explores`; S05 retired (tombstone) w/ ALL panels rehomed to overview (evolution proposals R10S2E5, evidence triage R10S2E6, schema compare R11S2E4); vocab ledger S05 entry pruned; S03/S04 route to /app/semantic. BE 435/435, UI 147/147.
- [x] R32S2E2-US1 metrics catalog + metric detail + dimensions [was R25S2E2] — done: SemanticCatalog.jsx — metrics catalog (searchable, ×2 CONFLICT amber rows → review diff deep link, DEPRECATED gray rows from real version diff, "+ Calculated metric" real POST), metric detail (plain-English def, §5.6 ADMIN ONLY dark SQL, lineage chips, live DQ-test chips, versions), dimensions catalog (7-way categorizer, collapsible groups, confidence); `GET /api/semantic/<ws>/conflicts`. BE 436/436, UI 150/150.
- [x] R32S2E3-US1 field picker + joins + derived tables (DEP bounded preview) [was R25S2E3] — done: SemanticTools.jsx — field picker (3-panel, chips, live `100-row cap · Nms` preview via new DEP `POST /api/semantic/<ws>/preview` seeded-deterministic + cardinality warning + ?q= handoff), join paths (SAFE/FAN-OUT RISK from real join_type; builder null-note; bridge CTA prefills derived editor; sim fk gains null_pct 4.1 → real left join; manifests now carry null_pct), derived tables (dark SQL, real dry_run on POST pdts, publish, FRESH/STALE). BE 440/440, UI 153/153.
- [x] R32S2 sprint regression recorded — backend 440/440 · UI 153/153 (2026-07-05)
- [x] R32 release regression + zero-key boot recorded: backend 440/440 · UI 153/153 · boot check PASSED — 8 services local, client shell 200 (2026-07-05) — RELEASE R32 CLOSED (9/9 stories)

## Release R33 — PRD Phase 4: Prediction & distribution (pending)
### Milestone UP-D — Models trusted, artifacts delivered
- [x] R33S1E1-US1 models overview (KPIs + status pills + per-state actions) [was R26S1E1] — done: Models.jsx (`/app/models` — 6 live KPI cards, typed rows CHAMPION/CHALLENGER/TRAINING/RUN FAILED/ARCHIVED, real Retrain/Evaluate/Archive actions, Card→E3 + View-logs→E2 deep links, retrain-center link owned by E4); `GET /api/models/overview` (KPIs + typed rows, MAPE from val/test metrics); S14 retired (tombstone; deep ops rehome E2/E4). BE 442/442, UI 154/154.
- [x] R33S1E2-US1 training run detail (tabs, stat cards, backtest chart, log) [was R26S1E2] — done: RunDetail (`/app/models/runs/:id` — status pill + duration, 3 stat cards, tabs: backtest fold bars, candidate trials w/ WINNER, immutable feature manifest, leakage scan w/ struck DROPPED rows, dark log from run truth); substrate fix: physical gold tables session-scoped + delete-then-insert (identical specs used to collide → grain block; RED repro in test_r33s1_models). BE 443/443, UI 155/155.
- [x] R33S1E3-US1 model card (metrics tiles, importance bars, SHAP, linked artifacts) [was R26S1E3] — done: ModelCard (`/app/models/:cardId` — registry identity + PROMOTED·CHAMPION + overfit pills, real Retrain, fact rows, MAPE/RMSE/dir-acc tiles [MAE absent in substrate — Agent Note], purple importance bars, SHAP dot plot from stored shap_mean, linked artifacts both ways); model_cards GET enriched w/ registry + linked_artifacts; ArtifactDetail Model tab deep-links. BE 444/444, UI 156/156.
- [x] R33S1E4-US1 leaderboard + feature manifest + retrain center [was R26S1E4] — done: Leaderboard (`/runs/:id/leaderboard` — ranked ±band rows, WINNER pill, error-vs-RMSE scatter [MAE/cost absent — Agent Note], WHY prose + mono gate note from card gates, real Promote + Override→challenger), FeatureManifestViewer (`/features/:id` — derived encoding/imputation, real leakage risk, DROPPED strike-through, S14 composer rehomed w/ real add+review+apply+HOLD-confirm), RetrainCenter (`/retrain` — live pills, drift checks run real model_monitor, failed rows→logs, real Retrain now; Scheduled·0 owned R36S1); `GET /api/models/retrain_queue`; overview link enabled (E1 spec flipped). BE 445/445, UI 159/159.
- [x] R33S1 sprint regression recorded — backend 445/445 · UI 159/159 (2026-07-06); S14 fully retired, all ops rehomed
- [x] R33S2E1-US1 public viewer parity + expired card (diff vs CODE, Reconciliation (c)) [was R28S2E2] — done: PublicViewer parity rewrite (brand bar from workspace branding, expiry note + owner mailto, filter bar w/ REAL range slicing over new token-gated `GET /api/public/<token>/chart` [same 404/410/401 checks], region select owned by R35, KPI grid + recent-actuals bars above the frame, footer, designed expired card w/ Request-a-new-link mailto); meta gains owner_email; R19 testids preserved (spec untouched, green). BE 447/447, UI 161/161.
- [x] R33S2E2-US1 embed preview + settings (DEP embed settings kv) [was R28S2E3a] — done: EmbedPreview (`/app/artifacts/:id/embed` — fake-browser live preview over real signed tokens [preview token allows workspace origin, noted in-UI], dark snippet + Copy, scope checkboxes [read-only locked by design; Viewer filters = real interactive scope; drill/export owned later], expiry select, allowed-domain chips w/ server-side origin enforcement, Save persists + re-mints); DEP `GET/PUT /api/artifacts/:id/embed_settings` (embed_settings table, audited). BE 448/448, UI 162/162.
- [x] R33S2E3-US1 present mode (dark stage + notes drawer) [was R28S2E3b] — done: PresentMode (`/app/artifacts/:id/present`, top-level chrome-free dark stage — 4 data-driven slides [KPIs/trend/forecast±CI/recent bars], `section n / m` header, floating control pill + arrow keys, presenter-notes drawer fed by the real narrative engine, ✕/Esc exit); canvas ▶ Present button live (enabled once the artifact autosaves; r30s2 spec asserted visibility only). Solutions-page wiring lands with R34 marketing. BE 448/448, UI 164/164.
- [x] R33S2E4-US1 error template ×8 [was R28S2E1] — done: ErrorState template ×8 (mono badge · title · copy · one action; board at /app/__errors like __kit); NotFound + Forbidden rewired onto the template (router/roles contracts preserved; 404 action label migrated with the owning story); viewer expired card already shares the voice. BE 448/448, UI 166/166.
- [x] R33S2 sprint regression recorded — backend 448/448 · UI 166/166 (2026-07-06)
- [x] R33 release regression + zero-key boot recorded: backend 448/448 · UI 166/166 · boot check PASSED — 8 services local, client shell 200 (2026-07-06) — **RELEASE R33 CLOSED (8/8 stories)**

## Release R34 — PRD Phase 5: Marketing (pending)

> **Environment note (found 2026-07-06, applies to all of R34):** `playwright.config.mjs`
> launches its browser via `@sparticuz/chromium` (Lambda-only package); on a native
> Windows checkout it extracts a Linux ELF binary that cannot execute, so every
> Playwright UI spec fails with `spawn ENOENT` regardless of what it asserts —
> confirmed pre-existing (unrelated specs fail identically) and out of scope for
> a marketing-content release to fix. Each R34 story still gets a written/updated
> spec for RED/GREEN discipline and future execution, but specs are not run in
> this environment; verification instead relies on `npm run build` + the backend
> `pytest` suite + manual review. Flagged for a separate, scoped fix later.

### Milestone UP-E — Marketing at parity
- [x] R34S1E1-US1 MarketingNav + dark 5-col footer [was R29S1E1] ✅ 2026-07-06 (MarketingNav.jsx + MarketingFooter.jsx; wired into Landing/Pricing; Logo extended w/ markFill/iqColor; spec r34s1_marketing written, not executed — see environment note; backend 467/469, 2 pre-existing unrelated failures — test_pdf_and_png_export ModuleNotFoundError, test_schedule_accepts_timezone assertion, confirmed untouched by this change)
- [x] R34S1E2-US1 landing rebuild (hero preview, BI compare, use cases, trust, CTA) [was R29S1E2] ✅ 2026-07-06 (7 sub-components in Marketing.jsx; hero CTA intentionally points at /app matching nav, not mockup's /register — flagged as a follow-up product decision in tracked_changes.md; backend 467/469, pre-existing failures unchanged)
- [x] R34S1E3-US1 product page (stepper + 5 stages) [was R29S1E3] ✅ 2026-07-06 (new file, data-driven STAGES array w/ reverse-layout flag; caught+fixed a Fragment-key JSX bug before running anything)
- [ ] R34S1E4-US1 pricing restyle (toggle/table/FAQ; r30s1 data lock stays green) [was R29S1E4]
- [ ] R34S1 sprint regression recorded
- [ ] R34S2E1-US1 solutions ×6 · R34S2E2-US1 templates · R34S2E3-US1 security · R34S2E4-US1 docs [was R29S2E1–E4]
- [ ] R34S2 sprint regression recorded
- [ ] R34 release regression + zero-key boot recorded

## Release R35 — Unreviewed: Data layer (audit-first) (pending)
### Milestone UP-F — Data surfaces at parity
- [x] R35S1E1-US1 sources list [was R24S1E1] — done: DataSources (`/app/data/sources` — crumb + live count, filter, + Add source→/app/data/connect, rows w/ typed kind, status dot pill, colored health, last sync, SLA posture [met/at risk/breached], owner, table+issue counts) over new `GET /api/data/sources` aggregate; S02 parked at /app/data/connect (kit spec migrated). BE 450/450, UI 167/167.
- [x] R35S1E2-US1 add-source connector grid [was R24S1E2] — done: ConnectGrid (`/app/data/connect` — 12 typed cards w/ category pills + search + read-only note; snowflake→wizard route, upload/REST/webhook/dbt→import routes, 7 types open a credentials drawer [S02 FORM_CONFIGS rehomed] w/ real POST + field errors; Request-a-connector→team); S02 retired; kit spec → permanent legacy-Badge exhibit on /app/__kit. BE 450/450, UI 169/169.
- [x] R35S1E3-US1 snowflake connector wizard [was R24S1E3] — done: ConnectorWizard (`/app/data/connect/snowflake` — 4-step stepper; real Test connection w/ latency chip [test endpoint now returns latency_ms]; scope picker over new deterministic `POST /api/connections/preview_scope` [schema groups, row counts, PII LIKELY pills, N-of-M counter, filter]; scope REALLY enforced — connections.scope_json + governance sim filters the catalog to selection; per-table SLAs persist; step 4 = the live governance run, polled to done → View source). BE 453/453, UI 170/170.
- [x] R35S1E4-US1 import flows ×4 (upload, REST, webhook, dbt) [was R24S1E4] — done: ImportFlows (`/app/data/import/:kind` ×4 — upload: multipart POST w/ live profiler schema preview [types, null rates, masked samples, PII pills — upload profile now runs the real pii.scan_column], REST: real create + poll ingest w/ record counts, webhook: capability token shown once + real test events → recent-events table [payload-schema validation owned by R36S1, noted], dbt: demo manifest → model mapping w/ INHERITED test counts → real import bumping the semantic schema version). BE 454/454, UI 174/174.
- [x] R35S1 sprint regression recorded — backend 454/454 · UI 174/174 (2026-07-06); S02 retired, wizard scope enforced end-to-end
- [x] R35S2E1-US1 source detail tabs [was R24S2E1] — done: SourceDetail (`/app/data/sources/:id` — status/issues pills, scope·role·owner facts, real Sync now = fresh governance run, 8 tabs: Health [aggregate KPIs incl 7-day gate tally from dq_gate_results + trend + issues], Tables→table detail, Drift, PII [manifest scan, masked], Freshness vs SLA, Lineage→graph, Sync Logs, Settings [scope + disconnect]); `GET /api/data/sources/:id`; sources list name cell deep-links. BE 455, UI 175.
- [x] R35S2E2-US1 table detail (profile, columns, PII flags) [was R24S2E2] — done: TableDetail (`/app/data/tables/:runId/:name` — health pill + profile facts, EDITABLE business definition via audited PATCH DEP [cataloged_tables.description], trend spark, manifest columns w/ null rates/semantic types/masked PII, freshness vs SLA, downstream chips, quality-gate row); `latest` run resolver; lineage "Open table detail" flipped live (owned). S03/S04 wizard remnants tombstoned at close-out (no callers; features live on the new surfaces). BE 456/456, UI 177/177.
- [x] R35S2 sprint regression recorded — backend 456/456 · UI 177/177 (2026-07-06)
- [x] R35 release regression + zero-key boot recorded: backend 456/456 · UI 177/177 · boot check PASSED — 8 services local, client shell 200 (2026-07-06) — **RELEASE R35 CLOSED (6/6 stories)**

## Release R36 — Unreviewed: Gold/Alerts + Org/Admin/Billing/Settings (audit-first) ✅ CLOSED 2026-07-06
### Milestone UP-G — Operate & administer at parity
- [x] R36S1E1-US1 gold list+detail [was R26S2E1] — done: GoldCatalog rewrite (`/app/gold` — modeler gold rows w/ grain/version/gate tallies/linked chips over new `GET /api/gold/tables`; legacy run-outputs section preserved [r17s1 green]) + GoldDetail (`/app/gold/:id` — IMMUTABLE header, 7 tabs: overview, PRAGMA schema, humanized dq_json gates, lineage `?node=gold:` deep link, artifacts, feature-manifest link, query contracts from the run). BE 457/457, UI 178/178.
- [x] R36S1E2-US1 data + query contracts (admin) [was R26S2E2] — done: DataContracts (`/app/contracts/data` — posture rows over new `GET /api/contracts/overview` [required fields, SLA, 30-day failures, ENFORCED vs BLOCKING NOW from manifest violations, affected artifacts, expand] + real composer) + QueryContracts (`/app/contracts/queries` — artifact select → run query_contracts rows, substrate vocab EXECUTED accepted); GoldDetail contracts tab aligned. BE 458/458, UI 180/180.
- [x] R36S1E3-US1 alerts center / create / detail (DEP alerts CRUD) [was R26S2E3] — done: Alerts DEP (`server/alert_rules.py` — deterministic per-kind evaluation vs real substrate [threshold vs series, freshness vs SLA, schema/model drift, artifact health, 3σ anomaly]; alert_rules + alert_triggers tables; CRUD + mute + check-now, all audited; create seeds a real first verdict) + AlertsCenter/AlertDetail (`/app/alerts`, `/app/alerts/:id` — typed pills, live FIRING/OK/MUTED, create drawer, grounded trigger history w/ delivery marks, trigger logic, Mute 24h/Check now/Delete). Last placeholder retired (r15s1_shell migrated: placeholder era over). BE 460/460, UI 181/181 (+1 documented conditional skip). 
- [x] R36S1 sprint regression recorded — backend 460/460 · UI 181/181 (2026-07-06); zero placeholders remain
- [x] R36S2E1-US1 comments inbox + team + invites [was R27S1E1] — done: CommentsInbox (`/app/comments` — Open/Resolved/Mentioned pills w/ counts, rich rows [author avatar, section chip, artifact link, inline resolve] over the real inbox endpoint) + Team rebuild (`/app/team` — seat header [seat-usage contract kept], role/status pills incl INVITED, invite MODAL w/ email chips + live seat math + real send; r18 spec migrated to the modal). BE 460/460, UI 184/184. 
- [x] R36S2E2-US1 admin overview + roles matrix (DEP roles kv) [was R27S1E2] — done: workspace_kv DEP (`_kv_get`/`_kv_put`) + `GET /api/admin/overview` (9 live KPI groups: users/invites, roles, integrations, governance backlog by type, audit 24h, token usage vs cap, security warnings from expiring links, share links, SSO status) + `GET/PATCH /api/admin/roles` (permissions matrix over kv, owner locked, sensitive perms flagged, audited) → AdminOverview (`/app/admin` — 9 navigating cards) + RolesMatrix (`/app/admin/roles` — per-cell toggles, owner column disabled). BE 464/464, UI 181/181.
- [x] R36S2E3-US1 SSO settings + branding admin (DEP settings kv) [was R27S1E3] — done: `GET/PUT /api/admin/sso` + `POST /api/admin/sso/test` (kv-backed SAML settings, https validation, domain verify [instant on the local stack, stated], audited) → AdminSso (`/app/admin/sso` — provider/URL/entity/enforce, domain chips w/ ✓ VERIFIED, test-connection result pill) + AdminBranding (`/app/admin/branding` — name/color over the existing branding API w/ live preview mark). BE 464/464, UI 181/181.
- [x] R36S2E4-US1 admin security ×4 (secrets, audit, sharing gov, RLS simulator) [was R27S1E4] — done: `GET /api/admin/secrets` (masked tails only — raw values never leave the server) + audited `POST .../rotate` (Fernet re-issue), `GET /api/admin/rls` list, `GET/PUT /api/admin/sharing` (rules kv + live link counts) → AdminSecurity (`/app/admin/security` — audit table w/ CSV/JSON export, masked credentials w/ rotate, sharing rules, RLS composer + "test as user" simulator). **S12 retired as a legacy remnant**: § citations stripped (vocab ledger pruned to zero), screen-table mapping removed, `/app/admin/platform` re-routed as a first-class admin-gated console (r13s1 + r15s2 contracts intact); sidebar Admin → `/app/admin` (flows migrated). BE 464/464, UI 181/181.
- [x] R36S2E5-US1 usage & cost dashboard [was R27S1E5] — done: `GET /api/admin/usage` (additive aggregate: pipeline runs + dispatches 30d, tokens vs plan pool, request compute from service_logs, 14-day views/builds series from artifact_activity, top consumers + per-area cost derived from the $8/100k metered rate — cost math asserted in test) → AdminUsage (`/app/admin/usage` — 4 KPI meters, stacked daily bars, consumers/areas tables, est. month total, export; overview tokens card retargeted). BE 465/465, UI 181/181.
- [x] R36S2 sprint regression recorded — backend 465/465 · UI 181/181 across all 96 spec files, 0 failed (2026-07-06); admin pillar complete, vocab ledger empty
- [x] R36S3E1-US1 billing plan/seats + invoices + tokens (DEP seeded invoices) [was R27S2E1] — done: `GET /api/billing/overview` (plan/price/renewal, live seat math from users+invites, cycle line items incl. seat overage + token overage at the metered rate, stripe_configured honest flag) + DEP `GET /api/billing/invoices` (3 demo invoices materialize deterministically once) + `GET /api/billing/payment_methods` (demo visa …4242) → Billing rebuild (`/app/billing` — plan card, seat block, token meter [r20s1 contract kept incl. capability rows], cycle card, 4-plan grid w/ REAL local plan change via PUT, invoices, card on file; checkout stated as key-gated, never faked). BE 467/467 (see sprint gate), UI green.
- [x] R36S3E2-US1 settings ×4 + app-wide technical-detail toggle (DEP prefs kv + API keys) [was R27S2E2] — done: DEPs (`GET/PUT /api/settings/preferences` over workspace_kv; api_keys table + `POST/GET/DELETE /api/keys` hashed-at-rest sha256, raw revealed once, `GET /api/keys/verify` 200/401/**410 on revoked** — all audited) → Settings area (`/app/settings/{profile,preferences,api-keys,help}` — S11 identity card + R10 memory affordance rehomed w/ testids intact [r10s1 + r31s1 green]; **technical-detail toggle flips the R30S3 §5.6 admin blocks app-wide** from role-gated to toggle-gated, default on, off yields a plain-language notice [r15s2 green]; API keys w/ one-time reveal + REVOKED rows; help w/ real destinations). **S11 retired** (tombstone, SCREENS + routes.js pruned). BE 469/469, UI 186/186.
- [x] R36S3 sprint regression recorded — backend 469/469 · UI 186/186 across all 98 spec files, 0 failed (2026-07-06); zero legacy wizard screens remain in SCREENS beyond the R34-owned marketing remnants (S02–S04)
- [x] R36 release regression + zero-key boot recorded — backend 469/469 · UI 186/186 (98 files, 0 failed) · boot: shell 200, 8/8 services local · PAR-1 regenerated: 8 full / 75 partial / 4 route-missing (all 4 signed off: notifications drawer-by-design R30S1 · webhook in R35 connect drawer · /security + /templates R34) / 8 context — **RELEASE R36 CLOSED**
- [x] **PROGRAM CLOSE (R30–R36)** — 52/52 lead-owned stories (R34's 12 delegated, in flight on the junior's track); all gates green; PARITY_REPORT.md regenerated for the R30–R36 program; gating parity (flows.spec PAR-2) 100% green

## Adaptation ledger (UI Parity & Build-Out Program)
- Pending R22S1E2→R29 scope retired & re-planned as R30–R36 per PRD v1.0 + user decisions (a)–(f) — see RELEASE_PLAN Reconciliation block. (Phase 1)
- PRD §8 screenshots/ folder superseded by docs/specs/parity/ + PAR-1 scoreboard; sign-off recorded. (Phase 1)
- PRD ch11 Clarify / ch14 share-viewer "MISSING" claims stale vs code — stories diff against code. (Phase 1)
- Sandbox mount forbids unlink: git lock files mv'd aside pre-commit; tmp_obj warnings cosmetic; S06–S09/S10 "deletion" = tombstone + no-import grep test. (Phase 2+)
- HOST-side file writes truncate on mount sync — ALL source edits bash-side via anchor-asserted python patches; 2026-07-04 truncation incident hit RELEASE_PLAN/PROGRESS tails (planner agent write); reconstructed 2026-07-05 from git + recon + PRD; original R22S1E2 task chain lost, rewritten under R31S2E1. (Phase 1/incident)
- Suites run chunked under the 45s call wall: /tmp/be_chunks.sh + /tmp/ui_chunks.sh (state-file runners, local UI mirror). (Phase 2)
- lint-probe cleanup made mount-safe (overwrite fallback + gitignore). (Phase 2)
- pytest + server requirements reinstalled in fresh sandbox (user site). (Phase 2)
- Repo consolidation (2026-07-05, user request): untracked-from-index tests/logs (326 files incl. traces/screenshots), tests/__pycache__, storage/ runtime artifacts, test-results/, .claude/settings.local.json, root scratch (t.spec.js, pw.config.mjs, _sync_probe.txt, tests/test_probe_tmp.py — disk deletion blocked by mount, now gitignored); .gitignore rewritten to the repo's actual structure; historical root docs + prompts/ + run_prompts.ps1 consolidated into docs/archive/ (absorbing docs/old/, whose root-path index entries were stale phantom deletions — finalized); README rewritten partner-facing (SQLite truth, independent FE/BE dev, both test suites, build/docker); CLAUDE.md + AGENTS.md rewritten to current architecture (router, kit, 46 modules, gates, program pointer); CLAUDE_CODE_PROMPTS.md converted to a status ledger; requirements.txt reorganized + pytest added + requests added; package.json dev:server made portable (dev:server:win keeps the venv path); docker-compose rewritten SQLite-native (was stale Postgres).

## Verification (UI Parity & Build-Out Program)
- Backend: `python3 -m pytest tests/ --ignore=tests/ui` (or chunked: `bash /tmp/be_chunks.sh reset` then repeat)
- UI: `npm run test:ui` (native) / chunked: `bash /tmp/ui_chunks.sh reset` then repeat
- Build: `npm run build` · Lint wall: `npm run lint:tokens` · Parity scoreboard: `npm run test:parity`
- Zero-key boot: `python3 server/app.py` → `/api/platform/status` all `local`

## Session stop note (2026-07-05, UI Parity session 8)
R32S1 E1+E2 shipped: governance overview (new /api/governance/summary
aggregate, KPI cards, awaiting pill, health-trend sparkline) · human review
queue (typed tabs, bulk approve, real Accept/Edit/Reject w/ audits).
Suites at stop: backend 426/426 · UI 137/137 · build + lint green. 25/64.
Next: R32S1E3 definition-review diff (/app/governance/review/:id — the HITL
flagship: side-by-side highlighted definitions, dark SQL diff, evidence,
editable final, "Approve — re-validate N dashboards"; semantic proposals APIs
at app.py ~2463 + review edit action are the substrate), then E4 DQ rules
master-detail (retires S13's raw config), E5 lineage graph (/api/lineage),
E6 manifests+preagg → sprint gate. governanceLatest returns {run_id} not
{id} — already normalized at both call sites.

## Session stop note (2026-07-05, UI Parity session 7)
RELEASE R31 CLOSED — all 5 stories (PRD Phase 2 complete): standalone auth +
register wizard, auth states ×4, onboarding ×4 (real branding/profiling
substrates), activity page (new /api/activity typed projection), home polish
(bell-at-zero, health coding, review anatomy, thumbs, usage series). Gates:
backend 425/425 · UI 135/135 · zero-key boot 8 services local + shell 200.
23/64 stories done; releases R30+R31 fully closed.
Next: RELEASE R32 (PRD Phase 3 — governance & semantic): R32S1E1 governance
overview KPI cards (DEP: counts aggregate if absent — check /api/governance
endpoints first), then queue/diff/rules/lineage/manifests, then R32S2
semantic ×3. S05/S13 retire in this release (their vocab-ledger entries and
eslint grandfather lines go with them).

## Session stop note (2026-07-05, UI Parity session 6)
R31S1 E1+E2 shipped: standalone /login + /register 4-step wizard over the
real auth APIs (S11 stripped — PBKDF2/Agent-memory/§ citations dead, vocab
ledger pruned to S05+S12; R10 memory surface preserved behind the §5.6 admin
affordance w/ payload-shape fix) · forgot-password/verify-email/SSO callback
×2. Suites at stop: backend 423/423 · UI 128/128 · build + lint green.
20/64 stories done. Next: R31S1E3-US1 onboarding ×4 (branding wizard wired to
GET/PUT /api/branding, starting-mode cards, source-health preview over the
profiling substrate, template picker) closes Sprint R31S1 → sprint gate.
Then R31S2 (activity page DEP /api/activity + home polish) closes R31 →
release gate + boot check.

## Session stop note (2026-07-05, UI Parity session 5)
RELEASE R30 CLOSED — all 18 stories (PRD Phase 1 complete): pricing lock,
library cards/table/detail, workbench chrome/chat/center-states/inspector,
trust contracts, pipeline audit, insights, canonical share modal (+revoke
endpoint), versions panel (+versions/restore endpoints), comments drawer +
pins, wizard retirement (R10 surfaces ported into the chat), §5.1 vocabulary
gate (exact-equality ledger). Gates: backend 423/423 · UI 121/121 · zero-key
boot 8 services local + shell 200. 18/64 stories done.
Next: RELEASE R31 (PRD Phase 2) — R31S1E1-US1 standalone auth + register
wizard (kills S11's three ledgered leaks), then auth states, onboarding ×4,
then R31S2 activity page (DEP /api/activity) + home polish. R31 sprints are
marked "task elaboration pending Phase 1a" — elaborate the sprint's task
chains from the epic ACs on pickup, then RED as usual.

## Session stop note (2026-07-05, UI Parity session 4)
R30S2 CLOSED (6/6; gate UI 110/110 · backend 419/419). R30S3 E1–E3 shipped:
trust-contract accordions (raw gate dump dead) · pipeline audit (RUN header,
repair states, §5.6 admin toggle, real session fork) · insights panel on the
detail tab (Investigate seeds the workbench). Suites at stop: backend 419/419
· UI 114/114 · build + lint green. 13/64 stories done.
Next: R30S3E4-US1 (canonical 520px share modal — visibility cards, token URL,
7-tile distribute, advanced settings; share_links + embed token APIs exist),
then E5 versions panel (wb-versions topbar button is wired-disabled), E6
comments drawer + pins (R18 APIs), E7 wizard retirement (S06–S09 tombstones +
redirects + lint-grandfather prune), E8 vocab gate — then the R30 RELEASE gate
+ zero-key boot check. Remaining §5.1 leaks live only in S11 (auth, R31S1E1)
and S13 raw config (R32S1E4) — the E8 ledger lists them allowed-until.

## Session stop note (2026-07-05, UI Parity session 3)
R30S2E3 shipped whole (US1 building telemetry · US2 canvas toolbar/filters/
human formatting · US3 section selection + floating toolbar). Suites at stop:
backend 419/419 · UI 107/107 · build + lint green. 9 of 64 stories done.
Next: R30S2E4-US1 (inspector design tab + tab-set ruling + overflow fix +
§5.3 cite removal) closes Sprint R30S2 → run the sprint gate. Then R30S3
(7 panel epics + vocab gate) closes Release R30 → release gate + zero-key boot.
New env note: this sandbox's Chromium mis-maps PW click coordinates when a
transform:scale ancestor/sibling shares the scroll container — pattern in
tests/ui/r30s2_canvas.spec.js (assert visible+stable, then domClick dispatch);
svg <line> needs count/attr assertions (zero-area box).

## Session stop note (2026-07-05, UI Parity session 2)
Sprint R30S1 CLOSED (4/4: pricing lock · library cards+rail+⋯ · Frame-02
table · artifact detail w/ 8 routed tabs + PATCH rename + S10 tombstone;
gate: backend 419/419 · UI 97/97). R30S2 underway: E1 session topbar +
forced rail (flows migrated) and E2 chat parity (status lines, Review-your-
plan card, clarify chips, agent tiles, follow-ups) both shipped green.
Suites at stop: backend 419/419 · UI 103/103 · build + lint green.
Next story R30S2E3-US1 (center states: building event log + 9 stage chips +
PII banner + SKIP TO RESULT, then US2 canvas toolbar/filters/human formatting
and US3 section-select) — the program's largest story; start it fresh.
Env additions this session: git index relocated OFF the mount
(GIT_INDEX_FILE=/tmp/analytiq.index — mount zero-truncates large index
writes; corrupt index recovered via same-dir rename + reset); root
analytiq.db* untracked + gitignored.

## Session stop note (2026-07-05, UI Parity session 1)
R30S1 E1–E3 shipped green: pricing data hotfix (3-test ch02 lock) · library card
grid + rail + ⋯ menus (13 legacy specs migrated w/ citations; 2 flake classes
root-caused in-screen) · Frame-02 table view (exact columns, reload-persistent
?view=table). Suites at stop: backend 416/416 · UI 93/93 · build + lint green.
Next: R30S1E4-US1 (artifact detail — 8 tabs, internals off Dashboard,
CENTERPIECE kill, S10 tombstone) closes Sprint R30S1 → run the sprint gate.
Truncation incident (see ledger) repaired: both tracking files reconstructed
and re-verified (check_tree green) — trust bash-side reads of these files, and
re-verify tails after any host-side write.
