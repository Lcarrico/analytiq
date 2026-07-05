# AnalytIQ Gap-Closure Program — Release Plan

> Source of truth for the gap-closure program (supersedes ANALYTIQ_MASTER_CHECKLIST.md
> sprint numbering). Hierarchy: Release → Sprint → Epic → User Story → AC → Tasks.
>
> **Fallback rule (mandatory):** every managed-tool epic detects its env keys at
> startup; keys present → real integration; keys absent → local fallback
> (SQLite / filesystem / daemon thread / console). The app must run end-to-end
> with zero external credentials.
>
> Story IDs: `R<release>S<sprint>E<epic>-US<n>`. Test files:
> `tests/test_r<release>s<sprint>_<epic-slug>.py`.

---

## Release 1 — Platform Foundation (identity, secrets, jobs, storage, search, observability)

### Sprint 1.1 — Identity & Access

#### Epic E1 — Auth service & identity middleware
Tool: Clerk / Supabase Auth (`CLERK_SECRET_KEY` / `SUPABASE_URL`+`SUPABASE_ANON_KEY`)
Fallback: SQLite `users` table (PBKDF2-hashed passwords) + opaque bearer API tokens. **Active mode: fallback (no keys).**

- **R1S1E1-US1** — As a workspace member, I want to register/login and receive a bearer token, so that API access is authenticated instead of header-trusted.
  - AC: `POST /api/auth/register {email, password, role?}` → 201 with user id; duplicate email → 409; weak/missing input → 400.
  - AC: `POST /api/auth/login` → 200 `{token, user}` on valid credentials; 401 otherwise. Tokens are opaque, stored hashed, expire after 24h.
  - AC: Passwords stored only as salted PBKDF2 hashes — never plaintext, never logged.
  - AC: `GET /api/auth/me` with `Authorization: Bearer <token>` returns the user; invalid/expired token → 401.
  - AC: Auth events audited (`auth.registered`, `auth.login`, `auth.login_failed`).
  - Tasks: `server/authn.py` (hashing, token mint/verify, provider detection); `users`+`api_tokens` tables; routes; audit.
- **R1S1E1-US2** — As the platform, I want request identity resolution to prefer bearer tokens while keeping the legacy `X-User-Role` header working, so that existing clients and tests don't break.
  - AC: With a valid bearer token, `current_role()`/`g.user_email` come from the user record; `X-User-Role` is ignored when a token is present.
  - AC: Without a token, legacy header behavior is unchanged (absent header = admin, dev mode).
  - AC: `require_role` failures include the resolved identity source in the 403 payload.
  - Tasks: `before_request` identity resolver; wire `g.user_email`/`g.org_id`; keep header compat path.

#### Epic E2 — Resource-level ACLs (ABAC-lite)
Tool: Supabase Postgres RLS. Fallback: SQLite `resource_acls` table enforced in app layer. **Active mode: fallback.**

- **R1S1E2-US1** — As an owner, I want per-resource ACLs (user → role on artifact/explore/session) that can restrict but never expand workspace defaults, so that sensitive resources are locked down.
  - AC: `PUT /api/acl/<rtype>/<rid>` (owner/admin) sets `[{principal, role}]`; `GET` returns them.
  - AC: A viewer-granted user can read but not mutate the resource even if workspace role is analyst (restrict-only semantics).
  - AC: A user absent from a restricted resource's ACL gets 403 on read; unrestricted resources keep workspace defaults.
  - AC: ACL changes audited.
  - Tasks: `resource_acls` table; `check_acl(rtype, rid)` helper; enforce on artifact get/mutate; audit.

### Sprint 1.2 — Platform Services

#### Epic E3 — Secrets provider abstraction
Tool: Infisical (`INFISICAL_TOKEN`). Fallback: current Fernet-encrypted SQLite columns via a `secrets_store` module. **Active mode: fallback.**

- **R1S2E3-US1** — As the platform, I want all credential encrypt/decrypt to flow through a provider interface, so that a managed secrets store can be swapped in without touching call sites.
  - AC: `secrets_store.put/get/delete(name)` round-trips values; values encrypted at rest; provider reports `mode` (`infisical`|`local`).
  - AC: With no `INFISICAL_TOKEN`, local mode activates automatically; `GET /api/platform/status` reports each service's active mode.
  - AC: Existing connection credential flows keep passing (regression).
  - Tasks: `server/secrets_store.py`; `secrets` table; platform-status endpoint scaffold.

#### Epic E4 — Job queue abstraction
Tool: Upstash Redis + QStash (`UPSTASH_REDIS_REST_URL`). Fallback: SQLite `jobs` table + daemon-thread worker. **Active mode: fallback.**

- **R1S2E4-US1** — As the platform, I want a generic enqueue/claim/complete job API used by training and refresh work, so that background work is durable and inspectable.
  - AC: `jobs.enqueue(kind, payload)` persists a queued job; worker claims it (status `running`) and completes/fails it with timestamps and error text.
  - AC: `GET /api/platform/jobs?kind=` lists jobs with status; jobs survive across connections (SQLite-durable).
  - AC: Failed handlers record `error` and don't crash the worker; a retry re-enqueues up to `max_retries`.
  - Tasks: `server/jobs.py` (registry of handlers, worker loop, enqueue/claim atomically); route; wire training to it later (non-breaking).

#### Epic E5 — Object storage abstraction
Tool: Cloudflare R2 (`R2_ACCOUNT_ID`+keys). Fallback: filesystem `storage/` dir (SQLite metadata). **Active mode: fallback.**

- **R1S2E5-US1** — As the platform, I want artifact HTML persisted through a storage interface returning a stable URI, so that object storage can replace DB blobs transparently.
  - AC: `storage.put(key, bytes)` → `{uri, size, sha256}`; `storage.get(key)` returns identical bytes; `storage.delete` removes.
  - AC: Artifact render writes through the interface; `artifact_files` keeps working (DB row retains html for compat, plus `storage_uri`).
  - AC: Local mode stores under `storage/artifacts/`; mode surfaced in `/api/platform/status`.
  - Tasks: `server/storage.py`; hook into render/save/refresh paths; status wiring.

#### Epic E6 — Observability & email outbox
Tool: Better Stack (`LOGTAIL_TOKEN`) + Resend (exists). Fallback: SQLite `service_logs` + `email_outbox`. **Active mode: fallback.**

- **R1S2E6-US1** — As an operator, I want structured request logs with latency and an email outbox, so that behavior is observable and messages are inspectable offline.
  - AC: Every API request logs `{method, path, status, duration_ms, user}` to `service_logs`; `GET /api/platform/logs?limit=` returns recent entries.
  - AC: `send_email` writes an `email_outbox` row (`to, subject, status sent|queued`) in all modes; with no RESEND key the status is `queued` (dev) and nothing external is attempted.
  - AC: Latency P50/P95 summary available at `GET /api/platform/metrics` computed from `service_logs`.
  - Tasks: request hooks (`before/after_request` timing); outbox table + hook in `send_email`; metrics endpoint.

#### Epic E7 — Search service
Tool: Meilisearch/Typesense (`MEILI_HOST`). Fallback: SQLite FTS5 index. **Active mode: fallback.**

- **R1S2E7-US1** — As a member, I want full-text workspace search across artifact names, descriptions, and metric names, so that I can find artifacts by content.
  - AC: `GET /api/search?q=` returns ranked artifact hits matching title OR metric/definition names linked via the artifact's session lineage.
  - AC: Index updates on artifact create/save/delete; empty q → 400.
  - AC: FTS5 fallback used when `MEILI_HOST` absent; mode in `/api/platform/status`.
  - Tasks: `server/search.py` (FTS5 virtual table + sync hooks); route; hooks in artifact mutations.

---

## Release 2 — Ingestion & Connectivity

### Sprint 2.1 — File & Sheet Ingestion
#### Epic E1 — File upload ingestion (CSV/XLSX)
Fallback-only epic (no managed tool).
- **R2S1E1-US1** — As an analyst, I want to upload a CSV/XLSX and get it auto-profiled into a workspace table, so that file data enters governance like any source.
  - AC: `POST /api/uploads` (multipart) parses CSV (and XLSX via openpyxl if available → else 415), writes rows to `src_upload_<slug>`, returns profile (per-column stats + semantic types).
  - AC: Upload registers a `connections` row of type `file` and an `ingestion_profiles` row; malformed file → 400.
  - Tasks: upload route; csv sniffing; write-through to SQLite; reuse `profiler`.
#### Epic E2 — Google Sheets connector (low-trust)
- **R2S1E2-US1** — As an analyst, I want to register a sheet URL treated as a low-trust CSV source with automatic null-rate warnings, so that ad-hoc data is usable but flagged.
  - AC: type `gsheet` connection validates URL shape; profiling marks `trust: low` and any column with null_pct > 5 gets a warning entry.
  - Tasks: connector mapping + validation; low-trust flag in profile.

### Sprint 2.2 — Programmatic Sources
#### Epic E1 — Webhook ingest
- **R2S2E1-US1** — As a producer system, I want a per-connection webhook endpoint accepting JSON POSTs appended to an events table, so that streaming sources flow in.
  - AC: `POST /api/ingest/webhook/<token>` (per-connection secret token) appends payload rows; bad token → 404; non-JSON → 400; rows queryable.
  - Tasks: `webhook_events` table; token mint on connection create (type `webhook`); route.
#### Epic E2 — REST API source connector (polled)
- **R2S2E2-US1** — As an admin, I want to register an API source (URL, auth header, schedule) that the scheduler polls into a table, so that API data is ingested continuously.
  - AC: type `rest_api` connection stores config; a manual `POST /api/connections/<id>/poll` fetch (or simulated fixture when offline) appends rows + records a poll log; scheduler_loop picks up due polls.
  - Tasks: config fields; poll route with offline fixture; scheduler hook.
#### Epic E3 — dbt project import
- **R2S2E3-US1** — As a data engineer, I want to upload a dbt `manifest.json` and get explores + test-derived quality signals, so that existing models seed the semantic layer.
  - AC: `POST /api/integrations/<id>/dbt_import` parses nodes → cubes appended to semantic schema (new version); dbt tests map to gate warnings; invalid manifest → 400.
  - Tasks: parser; semantic merge + version bump; gate mapping.
#### Epic E4 — Additional warehouse connectors (MySQL/DuckDB/Redshift/Databricks)
- **R2S2E4-US1** — As an admin, I want the remaining PRD connectors registrable with validated configs and simulated test/introspection contracts, so that the connector matrix is complete in the demo stack.
  - AC: each type has required-field validation, masked credentials, test endpoint contract (simulated offline), and UI availability flips to live.
  - Tasks: `CONNECTOR_REQUIRED_FIELDS` + `_map_connection_fields` entries; S02 config forms.

---

## Release 3 — Governance & Semantic Depth

### Sprint 3.1 — Governance Operations
#### Epic E1 — Health trend history + thresholds
- **R3S1E1-US1** — AC: every governance run appends `health_history` rows per table; `GET /api/tables/<run>/history?table=` returns the series; configurable threshold (`PUT /api/governance/thresholds`) generates an alert row + outbox email when crossed.
#### Epic E2 — Freshness SLA configuration
- **R3S1E2-US1** — AC: per-table SLA (`PUT /api/tables/sla`) persisted; DQ freshness rule evaluates against configured SLA instead of static heuristic; violation → WARN + alert.
#### Epic E3 — Schema drift alerting
- **R3S1E3-US1** — AC: manifest save compares fingerprints; on change writes `drift_alerts` row + email; `GET /api/integrations/<id>/drift` lists alerts.
#### Epic E4 — Data contracts
- **R3S1E4-US1** — AC: admins define required columns/SLAs per table; contract violation forces dq BLOCK and pipeline 409 with contract details.
#### Epic E5 — Custom test authoring (dbt-style expressions)
- **R3S1E5-US1** — AC: `POST /api/dq/tests {table, expression}` accepts a safe expression subset (`col op literal`, `IS NOT NULL`), compiles to SQL, runs in Stage-0 gate evaluation with PASS/FAIL results; invalid expressions → 400 (no SQL injection possible).

### Sprint 3.2 — Semantic Depth
#### Epic E1 — Lineage DAG
- **R3S2E1-US1** — AC: manifests populate `lineage_edges` from join inference + gold/artifact lineage; `GET /api/lineage/<connection>` returns nodes+edges incl. downstream artifacts; UI renders an SVG DAG.
#### Epic E2 — Hierarchies (date + geo)
- **R3S2E2-US1** — AC: cube builder emits `hierarchy` entries (`year>quarter>month>week>day` on time dims; `region>city` style on geo names).
#### Epic E3 — Calculated metrics + formats
- **R3S2E3-US1** — AC: `POST /api/semantic/<ws>/metrics/calculated {name, expr}` validates arithmetic over existing measures → new measure (minor bump); `format` (currency/percent/duration) persisted and applied in artifact KPI rendering.
#### Epic E4 — Explore-level access control
- **R3S2E4-US1** — AC: explore ACLs restrict who can use an explore in planning; planner excludes restricted explores for the caller; 403 on direct explore edit without grant. (Builds on R1S1E2.)
#### Epic E5 — Artifact dependency tracking
- **R3S2E5-US1** — AC: semantic version bump response lists artifacts whose lineage references changed cubes; `GET /api/semantic/<ws>/impacts?from=&to=`.
#### Epic E6 — PDTs + pre-aggregation recommendations
- **R3S2E6-US1** — AC: admin-defined SQL derived tables materialize on schedule with lineage; recommendation endpoint suggests summary tables from `service_logs` query patterns.

---

## Release 4 — Sessions & Feature Engineering

### Sprint 4.1 — Session Experience
#### Epic E1 — Session history + forking + templates
- **R4S1E1-US1** — AC: `GET /api/sessions` lists sessions w/ spec + artifact links; `POST /api/sessions/<id>/fork {overrides}` creates a new session + spec v1 linked to parent; templates CRUD (admin) and `POST /api/sessions/from_template/<id>`.
#### Epic E2 — Streaming session messages
- **R4S1E2-US1** — AC: `POST /api/sessions/<id>/message` streams SSE `planning → agent_start → (dq_gate|human_required)* → agent_complete` and terminal `artifact_ready|error`; events persisted to `session_events` for replay.
#### Epic E3 — Step audit trail + related suggestions
- **R4S1E3-US1** — AC: pipeline records labelled step cards (`input_schema`, `output_schema`, plain-English description) queryable per run; after completion `GET /api/sessions/<id>/suggestions` returns 3–5 follow-ups derived from spec similarity.

### Sprint 4.2 — Feature Engineering (Stage 3)
#### Epic E1 — Temporal features + holidays
- **R4S2E1-US1** — AC: feature engineer generates lags (1/3/7/14/28), rolling mean/std (7/14/28), streaks, and `is_holiday` (built-in US federal list + uploadable calendar); features land in the gold table and enriched manifest (`enrichment_status: enriched`, minor bump).
#### Epic E2 — Encodings, imputation, selection
- **R4S2E2-US1** — AC: one-hot ≤10 cardinality, frequency encoding above; rolling-median imputation for measures, mode+indicator for dims; collinearity pruning (|r|>0.95) and cap of 200 features with MI-style ranking; all decisions recorded in the manifest.
#### Epic E3 — Leakage HITL + custom features
- **R4S2E3-US1** — AC: HOLD-classified features require `POST /api/modeler/leakage/confirm` before training (409 otherwise); custom feature expressions (safe subset) can be registered, reviewed, and applied.

---

## Release 5 — Model Training Upgrade

### Sprint 5.1 — Multi-candidate Training
#### Epic E1 — Candidate families + ensemble
- **R5S1E1-US1** — AC: trainer evaluates ≥3 families (seasonal-trend, ridge-lite closed-form, gradient-boost-lite) on the same folds; if top-2 within 3% an averaged ensemble is evaluated and promoted when >1% better; leaderboard records family + params + time.
#### Epic E2 — Random search + full metrics
- **R5S1E2-US1** — AC: seeded random search (default 30 trials, prunable) replaces the fixed grid; folds record MAPE, RMSE, directional accuracy; stability gate (worst window ≤1.5× mean) enforced in promotion.
#### Epic E3 — Explainability
- **R5S1E3-US1** — AC: permutation importances + per-row contribution values (SHAP-lite) computed for promoted models, stored in `gold.model_insights`; PII columns excluded; top-10 concentration promotion gate active.

### Sprint 5.2 — Lifecycle
#### Epic E1 — Champion/challenger
- **R5S2E1-US1** — AC: registering a challenger tracks rolling comparison vs champion; auto-promotion when challenger better by >5% over the window; audited.
#### Epic E2 — Drift monitoring + one-click retrain
- **R5S2E2-US1** — AC: each refresh computes rolling 30d MAPE vs validation baseline; >50% worse → drift alert; persistent (7d) → retrain endpoint reuses spec with advanced date range; old model archived.
#### Epic E3 — Model card completion + async notify
- **R5S2E3-US1** — AC: card gains `target_type`, `top_features`, per-window RMSE/directional, `training_duration_seconds`, registry URI, lineage.source_tables; job completion emails via outbox.

---

## Release 6 — Artifact Interactivity

### Sprint 6.1 — Gold API & Full Panel Set
#### Epic E1 — Gold layer query API
- **R6S1E1-US1** — AC: `GET /api/gold/<ws>/<table>?page=&per_page=&filter_col=&filter_val=` paginated + token/member auth + 5-min cache (jobs/Redis fallback: in-process TTL cache); writes `gold.predictions`/`gold.forecast`/`gold.model_insights` at pipeline completion.
#### Epic E2 — Eight-panel artifact
- **R6S1E2-US1** — AC: artifact contains header bar, KPI row, time series+CI, feature importance bars, dimension breakdown, forecast panel (7/14/30 horizon selector), trial leaderboard, DQ/lineage footer; validator updated to require all eight.

### Sprint 6.2 — Interactions & Polish
#### Epic E1 — Filters + click-to-drill
- **R6S2E1-US1** — AC: unified JS filter state cross-filters panels; click → cross-filter, second click → drill drawer with grain rows + CSV export (inline data, no external calls).
#### Epic E2 — Annotations + alert subscriptions
- **R6S2E2-US1** — AC: `POST /api/artifacts/<id>/annotations` (grain key, timestamp, text) rendered as overlays; `is_annotated_event` exposed to training; `POST /api/artifacts/<id>/subscriptions {metric, threshold}` evaluated on refresh → outbox email w/ deep link.
#### Epic E3 — Export, theming, responsive, versions, repair
- **R6S2E3-US1** — AC: per-panel CSV/JSON export buttons + print CSS; dark mode via `prefers-color-scheme` custom properties; <768px stacking media query; version-history panel; validator failures trigger ≤2 automated repair cycles; workspace branding (logo/color/font) applied.

---

## Release 7 — Sharing, Embeds & Workspace Polish

### Sprint 7.1 — Share Security
#### Epic E1 — Owner role + public links
- **R7S1E1-US1** — AC: Owner role (delete/re-share) enforced; `POST /api/artifacts/<id>/share_links {password?, expires_in}` → tokenized public URL serving a snapshot (≤1 refresh/hour), password-gated when set, view_count tracked.
#### Epic E2 — JWT embed tokens + cross-workspace
- **R7S1E2-US1** — AC: HS256 embed tokens (workspace secret) scoped to one artifact w/ `allowed_origins` enforced on gold API; read_only tokens rejected for writes; cross-workspace recipients access only gold endpoints.

### Sprint 7.2 — Workspace Polish
#### Epic E1 — Favorites, tags, activity feed
- **R7S2E1-US1** — AC: favorite/tag CRUD reflected in list filters; `GET /api/artifacts/<id>/activity` shows views/shares/forks/annotations/subscriptions with actor+timestamp.
#### Epic E2 — Timezone cron + thumbnails
- **R7S2E2-US1** — AC: schedules accept `timezone`; next_run computed in that zone; artifact list serves generated SVG thumbnails.
#### Epic E3 — Proactive insights + health dashboard
- **R7S2E3-US1** — AC: post-artifact insight scan (anomalies/trends/correlations on gold data) surfaces dismissible insights w/ drill-in sessions; built-in workspace health dashboard generated as an AnalytIQ artifact.

---

## Execution log conventions
- Tests: `tests/test_r<R>s<S>_<epic-slug>.py`; one file may cover several stories in the same epic.
- Logs: `tests/logs/<file-or-story>_<timestamp>.log` via conftest hook.
- After each story: full `pytest tests/` regression must be green; update `PROGRESS.md`.

> Note: Release 1 epics carry full task breakdowns. For Releases 2–7, task
> breakdowns are elaborated just-in-time when a story enters the execution
> loop (per Phase 4 rule: no tasks for the next story until the current one
> is confirmed working). Acceptance criteria above are final.

---

# UI Gap-Closure Program (client)

Backend R1–R7 logic surfaced in the React client. Verification per story:
esbuild compile of every touched file (frontend unit tests out of scope per
program rules). Stories:

- **UI1** — API client completion (every R1–R7 endpoint wrapped in `api.js`),
  bearer-token plumbing (localStorage + Authorization header), Account screen
  (register/login/me/logout, role display), sidebar entry.
- **UI2** — Platform screen: service fallback modes, jobs, request logs +
  latency metrics, email outbox, alerts feed, workspace branding form.
- **UI3** — Governance depth on Table Health: manifest viewer (versions,
  rollback, PII approval), health-history sparklines, threshold/SLA/contract
  forms, custom DQ tests (create + run), drift alerts, lineage view.
- **UI4** — Models screen: modeler dry-run/execute/enrich, custom features +
  leakage confirmation, training jobs + trial leaderboard, model card with
  gates/top features, promote / challenger / retrain, registry.
- **UI5** — Sessions & artifacts polish: streaming session messages +
  suggestions + history/fork/templates (S06), pipeline step cards + flagging
  (S08), workspace search, favorites/tags, activity, annotations,
  subscriptions, share links, embed tokens, insights + health dashboard (S10).

---
---

# Evolution Program (Architecture v2.1, Parts XVII–XVIII)

> Spec: `AnalytIQ_Architecture_v2_1_with_Evolution_Roadmap.docx` Part XVII (35
> rated enhancements) + Part XVIII (seven-system target model). Releases 8–14
> below cover all 35, sequenced by the dependency rule in §18.4: Unified
> Artifact Store + Intelligent Caching → DAG Execution → everything else.
> Story IDs continue `R<r>S<s>E<e>-US<n>`. Backend tests
> `tests/test_r<r>s<s>_<slug>.py`; UI tests `tests/ui/r<r>s<s>_<slug>.spec.js`.
>
> **Program-wide environment adaptations** (Phase 0 decisions — see also
> PROGRESS.md Adaptation ledger):
> - No LLM endpoints in this stack: every "agent" is a deterministic/heuristic
>   engine, as in R1–R7. Cost-aware routing simulates the model-tier ladder
>   and records real telemetry rows.
> - No Redis: caching hierarchy is a provider interface — Redis when
>   `REDIS_URL` set, else in-process LRU + SQLite persistence.
> - Playwright browsers CDN is blocked in sandbox: chromium binary comes from
>   `@sparticuz/chromium` (npm) via `executablePath`.
> - Zero-key boot: Flask serves `client/dist` when present so one process
>   serves app + API with no external services.
> - UI stories add `data-testid` hooks to touched screens (none existed).

## Enhancement → Story map (all 35)

| § | Enhancement | Rating | Story |
|---|---|---|---|
| 17.3.2 | Unified Artifact Store | 9.5 | R8S1E1-US1 |
| 17.7.3 | Intelligent Caching Hierarchy | 9.0 | R8S1E2-US1 |
| 17.2.1 | Artifact Dependency Graph (DAG) Execution | 10 | R8S2E3-US1 |
| 17.2.2 | Cost-Aware Orchestration | 10 | R9S1E1-US1 |
| 17.2.5 | Parallel Stage Execution | 9.2 | R9S1E2-US1 |
| 17.2.4 | Event-Driven Execution | 9.5 | R9S1E3-US1 |
| 17.2.7 | Meta-Orchestrator Agent | 9.2 | R9S2E4-US1 |
| 17.2.3 | Multi-Agent Collaboration Model | 9.8 | R9S2E5-US1 |
| 17.2.8 | Simulation / Sandbox Mode | 9.1 | R9S2E6-US1 |
| 17.2.9 | Autonomous Optimization Jobs | 9.1 | R9S2E7-US1 |
| 17.3.1 | Persistent Agent Memory | 10 | R10S1E1-US1 |
| 17.3.3 | Workspace Knowledge Graph | 9.5 | R10S1E2-US1 |
| 17.3.5 | User Intent History Graph | 8.7 | R10S1E3-US1 |
| 17.2.6 | Adaptive Planning Agent | 9.2 | R10S2E4-US1 |
| 17.3.4 | Automatic Semantic Evolution | 9.4 | R10S2E5-US1 |
| 17.3.7 | AI-Assisted Governance Review | 8.6 | R10S2E6-US1 |
| 17.3.6 | Organizational Knowledge Reuse | 8.7 | R10S2E7-US1 |
| 17.5.1 | Explainability Engine | 9.7 | R11S1E1-US1 |
| 17.5.2 | Confidence Propagation | 9.6 | R11S1E2-US1 |
| 17.5.3 | Artifact Replay / Debugger | 9.3 | R11S2E3-US1 |
| 17.5.4 | Artifact Diff Engine | 8.9 | R11S2E4-US1 |
| 17.5.5 | Dashboard Health Scoring | 8.9 | R11S2E5-US1 |
| 17.4.1 | Opportunity Engine | 10 | R12S1E1-US1 |
| 17.4.3 | Recommendation Feedback Loop | 8.8 | R12S1E2-US1 |
| 17.4.2 | Self-Improving Platform Loop | 9.8 | R12S2E3-US1 |
| 17.4.4 | Continuous Model Monitoring | 8.6 | R12S2E4-US1 |
| 17.4.5 | Automated ROI Tracking | 8.3 | R12S2E5-US1 |
| 17.6.1 | Automatic Benchmark Library | 9.4 | R13S1E1-US1 |
| 17.6.2 | Intelligent Visualization Experimentation | 8.5 | R13S1E2-US1 |
| 17.6.3 | Natural-Language Artifact Editing | 8.5 | R13S2E3-US1 |
| 17.6.4 | Automatic Narrative Generation | 8.8 | R13S2E4-US1 |
| 17.7.1 | Enterprise Plugin Architecture | 9.3 | R14S1E1-US1 |
| 17.7.2 | Real-Time Observability Dashboard | 9.0 | R14S1E2-US1 |
| 17.7.4 | Template Marketplace | 8.4 | R14S2E3-US1 |
| 17.7.5 | Business Process Integration | 8.3 | R14S2E4-US1 |

Gap classification (Phase 0): all `missing` except partial bases —
17.4.1 (R7 insights), 17.4.4 (R5 MAPE drift), 17.2.9 (R3 pre-agg recs),
17.7.2 (R7 health dashboard + R1 metrics), 17.2.6 (planner exists, no
per-user adaptation). Partial items extend, never duplicate, those bases.

---

## Release 8 — Graph Substrate (UAS, Caching, DAG) — FULL TASK DETAIL

### Sprint 8.1 — Store & Cache

#### Epic E1 — Unified Artifact Store (17.3.2)
Managed tool: none (pure SQLite). Fallback: n/a — native.

- **R8S1E1-US1** — As the platform, I want every pipeline-stage output stored
  as a versioned, content-addressed artifact in one store with a common
  metadata schema, so that lineage, caching, replay, and diff all read one
  substrate.
  - AC: `uas_artifacts` table with exactly the §17.3.2 schema fields:
    `artifact_id` (uuid), `artifact_type`, `version` (int ≥1),
    `content_hash` (sha256 hex), `upstream_artifact_ids` (JSON array),
    `governance_manifest_version`, `semantic_layer_version`,
    `created_by_agent`, `created_at`, plus `workspace_id`, `run_id`,
    `payload_json`. UPDATE/DELETE on rows rejected by trigger (immutable
    append-only; new version = new row).
  - AC: `uas.register(...)` is idempotent: identical payload+context returns
    the existing row (same `artifact_id`, same hash, no new version);
    changed payload under the same logical key → `version`+1, new hash.
    Identical inputs provably identical: hash equality asserted across two
    registrations.
  - AC: pipeline completion registers ≥5 node types with correct upstream
    chains: `session_spec` → `dashboard_plan` → (`gold_predictions_ref`,
    `gold_forecast_ref`) → `artifact_html_ref`; `GET /api/uas/artifacts/<id>`
    returns payload + upstreams; `?type=`/`?run_id=` filters work; unknown
    id → 404.
  - AC: `GET /api/uas/artifacts/<logical>/versions` lists all versions
    newest-first. Existing `/api/artifacts` responses unchanged (view
    semantics; full regression green).
  - AC: registrations audited (`uas.registered`).
  - AC (UI): artifact detail (S10) shows a Provenance panel
    (`data-testid="uas-provenance"`) listing upstream artifact types +
    versions fetched from the UAS API; renders for a freshly generated
    artifact.
  - Tasks: `server/uas.py` (hashing, register/get/list/versions);
    schema + triggers; wire `simulate_pipeline` + artifact save;
    routes; S10 provenance panel; UI test.

#### Epic E2 — Intelligent Caching Hierarchy (17.7.3)
Managed tool: Redis (`REDIS_URL`). Fallback: in-process LRU + SQLite
`cache_entries`. **Active mode: fallback.**

- **R8S1E2-US1** — As the platform, I want independent cache layers
  (semantic resolution, query results, viz specs, rendered artifacts) whose
  keys embed governance-manifest and semantic-layer versions, so that a
  change invalidates the minimum necessary set.
  - AC: `server/cache_hier.py` exposes `get/put(layer, key_parts, value)`
    and `invalidate(layer=None, predicate)`; four layers (`semantic`,
    `query`, `spec`, `artifact`); full key = layer + workspace + key parts +
    gov/sem versions. Provider mode (`redis`|`local`) in
    `/api/platform/status`.
  - AC: semantic-layer version bump invalidates only entries keyed to the
    old semantic version — an entry in the same layer keyed to a different
    workspace and an entry in another layer both survive (asserted).
  - AC: gold query API reads flow through the `query` layer (its existing
    TTL behavior preserved: entries expire ≤5 min); second identical read is
    a hit (hit counter increments, no second warehouse read — asserted via
    counter).
  - AC: `GET /api/platform/cache` → per-layer `{entries, hits, misses,
    hit_rate}`; counters survive across requests.
  - AC (UI): Platform screen (S12) cache panel
    (`data-testid="cache-panel"`) lists the four layers with hit rates.
  - Tasks: module + table; wire gold API reads; status +
    cache endpoints; S12 panel; UI test.

### Sprint 8.2 — DAG Execution

#### Epic E3 — Artifact Dependency Graph execution (17.2.1)
Managed tool: none. Depends on E1+E2.

- **R8S2E3-US1** — As the platform, I want pipeline runs executed as a DAG of
  content-addressed nodes so a re-run recomputes only nodes whose upstream
  state changed, with every existing gate preserved as an edge contract.
  - AC: `dag_nodes` (run_id, node_key, node_type, content_hash, status
    `pending|running|done|failed|blocked`, cached flag, prior_run_id,
    uas_artifact_id, timestamps) + `dag_edges` (run_id, from_key, to_key,
    gate_name, gate_status, gate_detail). Node hash = sha256(canonical
    inputs + upstream hashes + gov/sem versions); deterministic across runs
    and sessions (asserted).
  - AC: pipeline executes by topological walk; first run computes all
    nodes; an identical re-run marks nodes `cached` (outputs served from
    the store — gold rows copied from the content-identical prior run); a
    spec change recomputes the planning node and downstream reachable set
    only — the ingest/profile node stays `cached` (asserted on statuses).
  - AC: deterministic gates attach to edges (`gate_name`, `gate_status`,
    detail) at the same logical boundaries; gate BLOCK halts all true
    descendants (asserted), sibling branches unaffected; pipeline 409
    pre-checks preserved.
  - AC: `GET /api/pipeline/<run_id>/dag` → `{nodes, edges}` with cached
    flags + gate statuses; unknown run → 404. SSE step events and
    `pipeline_steps` rows carry `node_key`.
  - AC: lineage-becomes-execution: `/api/artifacts/<id>/provenance` includes
    the run's DAG (`dag.nodes` + `dag.edges`) alongside the UAS chain.
  - AC (UI, amended in execution): the DAG panel renders on the S10
    provenance panel (`data-testid="dag-panel"`, fed by the unified
    lineage/execution endpoint); cached nodes show a `cached` badge
    (`data-testid="dag-node-cached"`). S08 keeps its step stream, whose SSE
    payloads carry `node_key`.
  - Tasks: `server/dag.py` (hashing, cache plan, edge gates, graph API);
    rework `simulate_pipeline` into node executors (same SSE contract);
    tables; routes; S10 panel; UI tests incl. re-run.

---

## Releases 9–14 — final ACs (task detail just-in-time)

### Release 9 — Execution Engine

#### Sprint 9.1
- **R9S1E1-US1 Cost-aware orchestration (17.2.2)** — AC: every dispatched
  task resolves through the ladder cache→template→small→frontier;
  `task_dispatches` rows record `{task, tier, est_cost, est_latency_ms}`;
  repeat semantic pattern hits `template` tier; identical repeat hits
  `cache` (compute skipped, asserted); novel plan hits `frontier`; cache
  identity includes the caller's effective explore visibility (ACL
  regression); `GET /api/platform/dispatches` aggregates per tier/task.
  UI: S12 dispatch panel (`data-testid="dispatch-panel"`).
- **R9S1E2-US1 Parallel stage execution (17.2.5)** — AC: the graph gains an
  independent `viz_specs` branch joined at `artifact_ready`; independent
  branches execute concurrently (worker pool) under a per-workspace
  concurrency budget (default 4, `PUT /api/platform/concurrency`, validation
  400s); with two 0.5s-instrumented branches, parallel wall-clock < serial
  sum and budget=1 serializes (both asserted); join point evaluates both
  incoming gates before assembly; results identical parallel vs serial
  (gold counts + node hashes asserted).
- **R9S1E3-US1 Event-driven execution (17.2.4)** — AC: `platform_events` +
  trigger registry (`POST/GET /api/platform/events`, missing type → 400);
  `manifest_updated`/`schema_changed` events enqueue targeted recompute jobs
  for affected sessions only (new run completes; unrelated session untouched
  — asserted); webhook ingest emits `data_arrived`; `drift_detected`
  enqueues retrain job; `metric_threshold_breached` opens an
  `opportunity_investigations` stub row (R12 fleshes out); every emit +
  trigger firing audited. Deterministic worker step:
  `POST /api/platform/jobs/drain`. UI: S12 events feed
  (`data-testid="events-panel"`).

#### Sprint 9.2
- **R9S2E4-US1 Meta-orchestrator (17.2.7)** — AC: arbitration of
  conflicting agent outputs by deterministic rules (grain conflict case
  covered); ≥3 repair-exhaustions across runs within window → one
  platform-level alert (not N user failures); queue reprioritization under
  load; human checkpoints cannot be skipped (asserted).
- **R9S2E5-US1 Multi-agent collaboration (17.2.3)** — AC: consultation bus
  `consult(from_agent, to_agent, question)` usable mid-task; viz agent
  consults semantic agent for ambiguous format instead of failing to repair
  (asserted path); every consultation logged as first-class event in the
  stream + audit.
- **R9S2E6-US1 Sandbox mode (17.2.8)** — AC: `sandbox:` namespace branch of
  the graph; sandbox nodes excluded from production UAS indices/search;
  promotion re-runs the full gate set (a gate-failing sandbox artifact
  cannot promote — 409); promotion audited.
- **R9S2E7-US1 Autonomous optimization jobs (17.2.9)** — AC: background job
  mines query cache + DAG telemetry → proposals (slow-SQL rewrite, index/
  partition rec, cache-key restructure) in `optimization_proposals`,
  status `proposed|approved|rejected` — never auto-applied; approval is
  admin-only (403 otherwise); expensive-join proposals cross-reference the
  M2M gate. UI: S12 proposals list with approve/reject.

### Release 10 — Knowledge Layer

#### Sprint 10.1
- **R10S1E1-US1 Persistent agent memory (17.3.1)** — AC: `agent_memory`
  (workspace, user, agent, category, key, value, weight, last_used) covering
  the four §17.3.1 categories; PII-pattern values rejected at write (gate
  reused from Stage 0); planner reads memory as a prior — an explicit
  instruction in the current turn wins (asserted); decay: unused entries
  drop weight below threshold after configurable window and stop
  influencing plans; memory CRUD audited. UI: account/settings memory
  viewer with delete.
- **R10S1E2-US1 Workspace knowledge graph (17.3.3)** — AC: `kg_edges` typed
  edges (§17.3.3 set) populated from sessions/artifacts/gold queries;
  `GET /api/kg/related?metric=` returns related metrics ranked by edge
  weight; co-analysis recommendation endpoint; graph rebuilds
  incrementally on artifact create.
- **R10S1E3-US1 User intent history graph (17.3.5)** — AC: per-user
  investigation sequence recorded (question → spec → artifact chain);
  session start returns warm-start hints (likely intent categories) without
  pre-committing a plan; hints absent for a brand-new user.

#### Sprint 10.2
- **R10S2E4-US1 Adaptive planning (17.2.6)** — AC: intent-confidence
  threshold becomes per-user/per-workspace tunable (default 0.85 preserved);
  novice (short history) gets clarifying question at higher confidence;
  expert (long consistent history) skips redundant clarification with
  assumptions surfaced inline in the spec response.
- **R10S2E5-US1 Automatic semantic evolution (17.3.4)** — AC: proposal
  engine emits new-metric candidates from repeated ad-hoc patterns,
  deprecation candidates (unused ≥ window), rename suggestions, and merge
  candidates (SQL similarity + result correlation ≥ threshold); proposals
  queue to admin review — canonical schema never auto-mutates (asserted).
- **R10S2E6-US1 AI-assisted governance review (17.3.7)** — AC: review queue
  ranked by evidence score (usage frequency + similarity-to-approved +
  conflict flags), each item annotated with all three; approval authority
  unchanged (non-admin 403). UI: S13 queue shows evidence chips.
- **R10S2E7-US1 Organizational knowledge reuse (17.3.6)** — AC: new session
  spec triggers similarity match against prior validated plans (KG + UAS);
  candidate starting points surfaced with similarity score; reused plan
  re-runs all plan validation gates for the new context (asserted).

### Release 11 — Trust & Explainability

#### Sprint 11.1
- **R11S1E1-US1 Explainability engine (17.5.1)** — AC:
  `GET /api/artifacts/<id>/explain?component=` composes (no new
  computation): source tables from manifest, exact SQL from query contract,
  semantic definitions, field bindings; predictions add model card id,
  promotion-criteria results, top feature contributions. UI: explain
  affordance on artifact panels renders all sections.
- **R11S1E2-US1 Confidence propagation (17.5.2)** — AC: documented
  deterministic combination (weighted minimum) over stage confidences
  (intent, leakage, validation MAPE mapped to [0,1]) → `confidence` on the
  assembled artifact + per-stage breakdown retrievable (auditable through
  explain); low confidence (< threshold) is a flagged-but-rendered UI state
  distinct from error. UI test asserts flag visibility.

#### Sprint 11.2
- **R11S2E3-US1 Artifact replay/debugger (17.5.3)** — AC: replay endpoint
  walks a run's DAG nodes in order returning each node's stored UAS payload
  (read-only, no live re-execution); failed repair attempts retained and
  visible even when a later attempt succeeded. UI: replay drawer steps
  through nodes.
- **R11S2E4-US1 Artifact diff engine (17.5.4)** — AC: structural diff
  between any two versions of dashboard/semantic schema/manifest/model card:
  added/removed/changed paths; semantic diff highlights added/deprecated/
  redefined metrics; dashboard diff lists changed components/filters/chart
  types. UI: versions panel gains Compare.
- **R11S2E5-US1 Dashboard health scoring (17.5.5)** — AC: score composed of
  readability (critic rules), accessibility (aria gate), redundancy (KG
  near-duplicate), performance (query latency), usefulness (adoption
  signals); per-dashboard breakdown endpoint; workspace admin rollup. UI:
  health chip on artifact list.

### Release 12 — Evolution Engine

#### Sprint 12.1
- **R12S1E1-US1 Opportunity engine (17.4.1)** — AC: post-assembly evaluation
  produces typed opportunities: anomaly (data-contract stats), causal
  candidate (KG co-analysis, phrased as question), forecast gap (history
  sufficient + no prediction artifact → routed to training on accept);
  accept/dismiss endpoints; accepted forecast gap creates a session;
  nothing auto-generates without confirmation (asserted). Extends R7
  insights (no duplication). UI: opportunities panel with accept/dismiss.
- **R12S1E2-US1 Recommendation feedback loop (17.4.3)** — AC: every
  recommendation (opportunity, semantic proposal, benchmark, suggestion)
  records accept/dismiss/ignore; repeated dismissal (n≥3) of a category
  suppresses it for that user until signal strengthens >20%; acceptance
  rate per type exposed for observability.

#### Sprint 12.2
- **R12S2E3-US1 Self-improving loop (17.4.2)** — AC: background miner emits
  the four §17.4.2 signals (popular metrics, abandoned filters, repeated
  edits, recurring failures) into `platform_signals`, each routed to its
  consumer (benchmarks / planner / semantic evolution / meta-orchestrator)
  with an audit trail proving delivery.
- **R12S2E4-US1 Continuous model monitoring (17.4.4)** — AC: rolling
  feature-importance ranking compared to model-card baseline; significant
  reorder (Kendall-tau below threshold) → review alert even when MAPE is
  fine; input distribution drift (PSI > threshold) detected; both fire
  event-driven retrain triggers (R9S1E3 path).
- **R12S2E5-US1 Automated ROI tracking (17.4.5)** — AC: adoption score per
  artifact from views/shares/exports/subscriptions; cost per artifact from
  dispatch telemetry; ROI report generated as a native AnalytIQ artifact.

### Release 13 — Analytics & Artifact Extensions

#### Sprint 13.1
- **R13S1E1-US1 Benchmark library (17.6.1)** — AC: historical + seasonal
  comparisons computed from existing gold tables (no duplicate path);
  admin-registered reference sets (peer/budget) in the semantic layer
  required for those benchmark types (unregistered → not fabricated,
  asserted); benchmark priority ordered by popularity signal.
- **R13S1E2-US1 Viz experimentation (17.6.2)** — AC: N candidate specs
  generated + ranked (mark-mapping fit + cardinality/density); only
  top-ranked runs full validation; alternates stored as swap options;
  swap endpoint re-validates on activation. UI: swap control on chart
  panel.

#### Sprint 13.2
- **R13S2E3-US1 NL artifact editing (17.6.3)** — AC: edit classifier:
  layout-only edits apply deterministically (no re-validation of data
  path), semantic edits re-route through spec generation + gates; every
  edit creates a new artifact version (history immutable; diff/replay still
  work). UI: edit box on artifact; layout edit visibly moves a panel.
- **R13S2E4-US1 Narrative generation (17.6.4)** — AC: narrative built
  strictly from data contract + confidence score (every sentence's numbers
  traceable — asserted against contract values); audience variants
  (executive/analyst/engineer) differ in lead + detail; attached to
  artifact as a panel.

### Release 14 — Platform & Ecosystem

#### Sprint 14.1
- **R14S1E1-US1 Plugin architecture (17.7.1)** — AC: registries for
  custom DQ validators, model trainers, mark generators; plugins declared
  in manifest, executed sandboxed (restricted namespace, no warehouse
  write, cannot bypass gates — asserted); registered validator appears in
  gate results.
- **R14S1E2-US1 Observability dashboard (17.7.2)** — AC: native artifact
  built by the platform's own pipeline over telemetry tables: DAG node
  latency, dispatch cost, cache hit rates, repair frequency, model quality
  trend, governance queue depth; feeds from the event stream.

#### Sprint 14.2
- **R14S2E3-US1 Template marketplace (17.7.4)** — AC: dashboard-plan
  templates with parameterized semantic refs; applying re-resolves against
  target workspace semantic layer (unresolvable ref → clear 422, not a
  broken artifact); plan gates re-run on application.
- **R14S2E4-US1 Business process integration (17.7.5)** — AC: outbound
  actions (Jira/Slack/Teams/email) triggerable from opportunities + alerts
  via provider interface (console/outbox fallback); scoped revocable
  credentials; every dispatch audited.

---
---

# UI-PRD Gap Program (PRD v3.0 + mockups + gap analysis)

> Spec: `docs/specs/GAP_ANALYSIS_UI_PRD_v3_AND_EVOLUTION.md` (canonical gap
> inventory, §§1–21) sequenced per its §22 closure order. Supporting:
> `docs/specs/AnalytIQ_UI_PRD.md` (screen specs), `docs/specs/PLAN.md`
> (committed design language/tokens), architecture v2.1.
> Story IDs continue `R<r>S<s>E<e>-US<n>`; backend tests
> `tests/test_r<r>s<s>_<slug>.py`, UI tests `tests/ui/r<r>s<s>_<slug>.spec.js`.
>
> **Program adaptations** (Phase 0):
> - The existing 14 wizard screens become route bodies inside the new PRD
>   shell and are progressively replaced; every stop point keeps both suites
>   green. Existing UI-test nav selectors update with story-ID citations when
>   the shell legitimately changes the contract (R15S1E2).
> - No-LLM / no-Redis / Playwright-via-npm adaptations carry over from the
>   Evolution Program ledger.
> - Marketing site (gap §2) is sequenced last (R23): static surfaces, no
>   backend, lowest risk.

## Release map (gap-analysis §22 order)

| Release | Closure step | Scope (gap refs) |
|---|---|---|
| R15 | 1 Foundation | Router, app shell, tokens/components, role-aware UI (G-1..G-10) |
| R16 | 2 Flagship | Create Workbench 3-column + clarification chips + plan card + canvas + edit endpoints (§6, Evo #32) |
| R17 | 3 Contracts substrate | Per-component query/data contracts (arch §7.2/7.3), gold catalog + detail, contracts screens, inspector Data tab (§12, §18-29) |
| R18 | 4 People layer | Notifications, comments, team/invites/seats, roles matrix, workspace activity (§5, §14, §18-1..11) |
| R19 | 5 Distribution | Public viewer page, embed route + origin enforcement, PDF/PNG export, present mode + narrative (#25), sharing policies (§7, §18-13..17) |
| R20 | 6 Enterprise | SSO (fallback provider), RLS + simulator, audit severity/export, secrets rotation, token metering + billing (§15, §16, §18-31..33) |
| R21 | 7 Evolution surfacing | Explain drawer, confidence flags, opportunity cards, DAG/replay viewers, observability artifact (§19 UI column) |
| R22 | 8 Evolution absences | Benchmarks #13, viz experimentation #31, plugins #14, process integration #35, marketplace #33 |
| R23 | — | Marketing site + auth pages + onboarding (§2, §3, §4) |

---

## Release 15 — Foundation (FULL TASK DETAIL)

### Sprint 15.1 — Router & shell

#### Epic E1 — URL routing (G-1)
- **R15S1E1-US1** — As a user, I want every screen at a real URL so deep
  links, back button, and shareable locations work.
  - AC: `react-router-dom` mounted; route map: `/app`→S01, `/app/create`→S06,
    `/app/create/confirm`→S07, `/app/create/run`→S08,
    `/app/create/result`→S09, `/app/artifacts`→S10,
    `/app/data/sources`→S02, `/app/data/run`→S03, `/app/data/health`→S04,
    `/app/semantic`→S05, `/app/models`→S14, `/app/governance`→S13,
    `/app/admin/platform`→S12, `/app/settings/profile`→S11; `/` redirects
    to `/app`.
  - AC: direct navigation to `/app/artifacts` renders the artifacts screen
    (UI test); browser back after a nav returns to the previous route (UI
    test); unknown route renders a 404 page per the Errors board (route
    shown in mono, "Back to home" CTA).
  - AC: legacy `nav(n)` context calls still work (mapped to routes) so
    wizard flow S06→S07→S08→S09 keeps functioning; ids
    (sessionId/runId/artifactId) survive navigation.
  - Tasks: add dep; `client/src/routes.jsx` map; context nav shim;
    NotFound screen; update UI-test nav helpers (cite this story).

#### Epic E2 — App shell (G-2, G-9 partial)
- **R15S1E2-US1** — As a user, I want the PRD shell — light sidebar, top
  bar, breadcrumbs — around every `/app/*` screen.
  - AC: 240px sidebar bg `#fbfcfe`, logo row h64, group labels (mono 10px
    uppercase), items per PLAN.md href map (Home, Create, Artifacts, Data,
    Semantic Layer, Gold Tables, Models, Alerts, Governance, Team, Admin,
    Billing, Settings); active item `#e8effc`/`#1d4ed8`; unbuilt areas get
    labeled placeholder pages ("arrives with R<t>").
  - AC: collapse toggle shrinks sidebar to 64px icon rail and back
    (UI test asserts width class change + labels hidden).
  - AC: 64px top bar: workspace chip, centered 520px search pill that opens
    an overlay on focus querying `GET /api/search` and listing hits
    (Enter/hit-click navigates to the artifact), bell icon with count badge
    (0 until R18, `data-testid="bell-count"`), help icon, avatar menu with
    Sign out.
  - AC: breadcrumb line (mono 11px) derived from route segments; page
    renders under content padding 28/32 per tokens.
  - AC: full UI regression updated + green — nav selectors change from
    wizard buttons to sidebar links (contract change cited to this story).
  - Tasks: `Shell.jsx` (sidebar/topbar/breadcrumbs/drawer slot);
    search overlay; sidebar map; spec updates.

### Sprint 15.2 — Components & roles

#### Epic E3 — Design tokens + core components (G-3, G-5, G-6, G-10)
- **R15S2E3-US1** — As a builder, I want the committed tokens and reusable
  Table/Tabs/Drawer/Badge components so every later screen composes them.
  - AC: `tokens.js` exposes the PLAN.md palette (accent `#2563eb`, borders,
    inks, status tints, chart palette); primitives added to `ui.jsx`:
    `StatusBadge` (pill h20, mono 10px uppercase, 5px dot, tinted per
    green/amber/red/gray), `Tabs`, `Drawer` (right 360–420px),
    `DataTable` (sticky header bg `#fafbfc`, mono numeric cells, filter bar
    slot, clickable column sort asc/desc, hover row), `KpiNumber` (mono
    26px), card⇄table `ViewToggle`.
  - AC: S10 artifact list migrates to `DataTable` with sortable Title and
    MAPE columns and a card/table `ViewToggle` — UI test sorts by title and
    asserts order flips; toggle switches layouts.
  - AC: existing badges on S10 render through `StatusBadge` (visual
    contract: uppercase mono + dot).
  - Tasks: tokens; components; S10 migration; UI tests.

#### Epic E4 — Role-aware rendering (G-8)
- **R15S2E4-US1** — As a workspace, I want the UI to respect roles: admin
  sees ops/technical detail, viewers don't.
  - AC: `useRole()` resolves from the logged-in user (legacy dev default =
    admin); sidebar hides Admin, Billing, and Governance groups for role
    `viewer`; `/app/admin/platform` visited as viewer renders a 403 page
    (Errors board variant), not the console.
  - AC: technical blocks (S12 console panels) wrap in an `AdminOnly`
    component — dark monospace treatment for admins, "Administrator access
    required" notice otherwise (UI tests for both roles via seeded users).
  - AC: backend regression untouched (role logic is presentation +
    existing ACL checks).
  - Tasks: role hook; AdminOnly; 403 page; sidebar gating; UI tests
    (register viewer user via API, login through UI).

---

## Releases 16–23 — final ACs (task detail just-in-time)

- **R16 Create Workbench**: 3-column `/app/create/:sessionId` (chat thread
  over existing SSE with bubbles/agent-step rows/prompt chips; canvas with
  KPI strip + section grid incl. forecast/leaderboard/importance panels;
  inspector with Design/Data/Pipeline/Insights/Share/Versions tabs);
  clarification chips (planner one-question turns surfaced via API);
  inline plan-confirmation card (Goal/Metrics/Time range/Output/PII
  disclosure + Approve & Build); start state `/app/create/new` (4 example
  prompt cards, template row, source selector); canvas edit endpoints
  (rename section, chart-type change, Top-N, reorder → new artifact
  version; Evo #32 first slice); autosave chip. Backend: session file
  context (§21-1) deferred to R17 note.
- **R17 Contracts substrate**: `query_contracts` + `data_contracts`
  per-component records persisted during pipeline (arch §7.2/§7.3 fields);
  gold catalog `/app/gold` + detail tabs w/ named gates; contracts screens;
  inspector Data tab consumes per-component contracts; per-section
  CONTRACT ✓ badges on canvas.
- **R18 People layer**: notifications model (unread, mentions, mark-all,
  bell badge, drawer + page); comments (threads, section anchors, resolve,
  @mentions, inbox tabs, assignment); team roster + invitation lifecycle +
  seats; role registry + permission matrix (7 roles × 9 permissions,
  SENSITIVE flags, custom roles) replacing header trust; workspace
  activity feed `/app/activity`; steward-ping loop (§21-3).
- **R19 Distribution**: branded public viewer page (freshness badge,
  password gate, request-access flow); `/embed/:token` render route with
  server-side allowed-origins enforcement + per-token domain allowlist;
  PDF + PNG export; per-link permission flags (comments/drill/export) +
  org sharing policy enforcement; present mode w/ auto-narrative presenter
  notes (Evo #25 narrative engine built here); artifact duplicate +
  version restore; folders; recently-viewed + view tracking.
- **R20 Enterprise**: SSO provider abstraction (SAML/OIDC config CRUD,
  domain verification, test-login; local fallback issuer for zero-key);
  RLS policy model + enforcement in gold API + "test as user" simulator;
  audit severity + date filters + CSV/JSON export + failed-login lockout;
  secrets rotation action/policy/last-used; token metering (per capability
  + system jobs) + plan catalog/entitlement gating + billing screens over
  the Stripe stubs; scoped API keys.
- **R21 Evolution surfacing**: explain drawer (lineage→SQL→bindings→model);
  low-confidence flags + per-stage popover on artifacts; opportunity cards
  panel with accept→session UX; DAG viewer with cache badges; replay
  step-through debugger UI; observability delivered as a native artifact
  w/ dispatch cost + cache hit-rate + repair-frequency panels.
- **R22 Evolution absences**: benchmark library (reference sets +
  historical/seasonal comparisons on metric detail); intelligent viz
  experimentation (ranked alternates + "Replace with…" cards); plugin
  registries (validator/mark/trainer, sandboxed); business process
  integration (outbound Jira/Slack/Teams/email w/ scoped credentials);
  template marketplace (parameterized plans re-resolved cross-workspace).
- **R23 Marketing/auth/onboarding**: static marketing routes per §3 (
  landing/product/solutions/templates/pricing/security/docs shells),
  auth pages (forgot/reset, verify, magic link, SSO callback states —
  backends from R20), onboarding wizard + sample-data one-shot + template
  picker.

---

# Design-Parity Program (exact mockup conversion) — R21–R29 · continued as **UI Parity & Build-Out Program (PRD v1.0) — R30–R36** (pending R22S1E2→R29 scope superseded 2026-07-04 by the PRD-driven program below; R21 + R22S1E1 below remain the delivered history of this program)

**Spec (canonical):** `docs/specs/GAP_ANALYSIS_DESIGN_PARITY_CHECKLIST.md` (2026-07-04 revision, synced from upload)
**Dimensions/copy source:** `UI_MOCKUP_ANALYSIS.md` §2–§4 + the 34 `.dc.html` mockup files (the frame IS the spec; on any conflict the frame wins)
**Goal:** convert `client/` to the exact foundation, layout and design of the UI Requirements mockups (95 frames). Backend deltas only where a story carries a `DEP:` line.

## Numbering reconciliation (2026-07-04, this session)
The checklist assigns new work R21–R29 and asserts code contains R1–R20 (§ "How to read"). Three legacy artifacts collided; renamed to their semantically-correct slots so every `R2x` grep hits exactly one program:
- [x] `tests/test_r21s1_evolution_completion.py` → `tests/test_r13s1_evolution_completion.py` (evolution completion = planned Evolution R13/R14 scope; delivered 2026-07-03 under stray label "R21/R22")
- [x] `tests/ui/r21s1_evolution.spec.js` → `tests/ui/r13s1_evolution.spec.js`
- [x] `tests/ui/r23s1_marketing.spec.js` → `tests/ui/r29s1_marketing.spec.js` (thin marketing shell = precursor slice of R29S1; R29 stories extend this file)
- [ ] `client/src/screens/Marketing.jsx` `// R23` header → `// R29S1` on first touch (checklist §1.4, do inside R29S1E1)
PROGRESS.md legacy section headers annotated to match. No test bodies changed by the rename; header comments cite this reconciliation.

## Program conventions
- Story IDs exactly as in the checklist (`R21S1E1-US1` …). One UI spec file per epic: `tests/ui/r<r>s<s>_<epic-slug>.spec.js`; backend files `tests/test_r<r>s<s>_<slug>.py` only for stories with a `DEP:` line.
- **Backend vs UI separation:** most stories are frontend design-parity slices consuming existing APIs — their Backend/API group states `N/A — consumes existing endpoints (no contract change)` explicitly. Stories with `DEP:` get real backend tasks + tests.
- Parity evidence: `docs/specs/parity/<frame-slug>/` holds `app.png` (Playwright full-page screenshot at 1440px, captured by the epic's spec via `parityShot(page, slug)` helper) — reviewable against the mockup frame opened in a browser. Structural assertions in the tests are the enforceable gate (exact colors, geometry, grid templates, copy); the screenshot pair is the human-review artifact.
- Charts: geometric SVG only; no chart library. Icons: 15px stroke SVG from `components/icons.jsx`; zero emoji.
- Existing `data-testid` hooks preserved or migrated inside the same story that rewrites a screen; every migration cites the story ID in the test diff.
- Legacy retirement follows checklist Appendix B; a legacy file is deleted only in the story that supersedes it, never before its replacement's tests are green.
- **Parity scoreboard (PAR-1):** `npm run test:parity` runs the generated mockup-inventory suite (95 frames from `docs/specs/mockups`) and regenerates `docs/specs/parity/PARITY_REPORT.md`. Non-gating. Every design-parity story's DoD gains: its frame(s) flip to ✅ on the scoreboard before the story is ticked. **Flows (PAR-2):** `tests/ui/flows.spec.js` is the gating navigation-contract suite; each landed story promotes its frame's cross-links from parity.spec.js into it.

## Release R21 — Design-System & Shell Parity (FULL TASK DETAIL)

> Outcome: one token source, one primitive kit, one icon set, one shell — byte-matching `App Home.dc.html`. After R21 every later screen is assembly, not invention.

### Milestone DP-A — Foundation parity
#### Milestone Success Criteria
- [x] All colors/typography flow from `P` + typography constants; CI-greppable: no new `C` imports possible
- [x] `/app/__kit` gallery renders every primitive to checklist §0.2 spec values
- [x] Shell (sidebar/topbar/content chrome/notifications drawer) visually matches `App Home.dc.html` #home / #notifications
- [x] Zero emoji glyphs anywhere in `client/src`
- [x] Full backend + UI regression green; zero-key boot intact

### Sprint R21S1 — Tokens, primitives, iconography
**Sprint Goal:** the design language exists once, as code, at frame fidelity.

#### Sprint Completion Checklist
- [x] All 7 sprint stories complete (US-level DoD each)
- [x] Backend regression full-run green · UI regression full-run green — 412/412 backend · 67/67 UI (2026-07-04 19:05Z)
- [x] Demo increment: `/app/__kit` gallery reviewable

#### Epic R21S1E1 — Single design-token source (`tokens.js`)
Mockup: all files · Spec: UI_MOCKUP_ANALYSIS §2 · Current: `client/src/tokens.js`

- [x] **R21S1E1-US1** — every mockup color importable from `P`; no ad-hoc hex in rewritten screens
  - AC:
    - [ ] `P` gains: `itemInk #47516b`, `boardLabel #5b6478`, `rowFaint #f3f5f9`, `selectedRow #f8faff`, `tableHeadBg #fafbfc`, `anomalyAmber #fdf9ef`, `anomalyRed #fdf6f6`, `greenBorder #b7e0c3`, `amberBorder #f2ddb0`, `amberDark #7a4a10`, `grayBar #cbd5e1`, `authStage #f2f4f8`, `darkAccent #60a5fa`, code colors `codeBlue #93c5fd / codePink #f472b6 / codeGreen #4ade80 / codeRed #f87171`, `sidebarBg #fbfcfe`
    - [ ] `T` typography constants exported (role → {fontSize, fontWeight, letterSpacing, fontFamily}): pageTitle 21/600, cardTitle 13.5/600, body 12.5–13, microLabel mono 9.5/600 ls .08em uppercase, kpi mono 26/600, tableHeader mono 10/600 ls .06em uppercase
    - [ ] Token names map 1:1 to checklist §0.2 table (comment cross-refs)
  - Tasks — Backend/API: N/A — consumes existing endpoints (no contract change)
  - Tasks — UI/E2E:
    - [ ] TASK1 RED: `tests/ui/r21s1_tokens.spec.js` — `/app/__kit` route exposes `window.__TOKENS__` (test hook) and asserts the exact hex values above are present under their names (fails: route/hook absent)
    - [ ] TASK2 Extend `tokens.js` (P additions + `T` scale + §0.2 cross-ref comments); mark `C` `@deprecated` JSDoc
    - [ ] TASK3 Verification gate: client build green; UI story spec green; full suites green
- [x] **R21S1E1-US2** — legacy palette cannot leak back
  - AC:
    - [ ] ESLint flat config with `no-restricted-imports` (named import `C` from tokens) wired as `npm run lint:tokens`; run exits 1 on a probe file importing `C`, 0 on current tree once R21–R29 migrations retire `C` consumers (until then rule scoped to `screens_new/`+rewritten files via overrides list kept in the config)
    - [ ] `tests/ui/r21s1_tokens.spec.js` runs the lint via child_process and asserts both outcomes (probe fixture rejected)
  - Tasks — Backend/API: N/A
  - Tasks — UI/E2E:
    - [ ] TASK1 RED: lint-contract test (probe file rejected; clean file passes)
    - [ ] TASK2 Add eslint devDep + `eslint.config.mjs` + script; document in README testing section
    - [ ] TASK3 Verification gate (build + suites)
- [x] **R21S1E1-US3** — chore: kill parity-diff noise
  - AC:
    - [ ] `client/vite.config.js.timestamp-*.mjs` (77 files) deleted; `client/dist/` untracked; both in `.gitignore`
  - Tasks — Backend/API: N/A
  - Tasks — UI/E2E:
    - [ ] TASK1 Delete junk + extend `.gitignore` (`client/vite.config.js.timestamp-*`, `client/dist/`)
    - [ ] TASK2 Verification: `npm run build` still green (dist regenerated locally, just untracked)

#### Epic R21S1E2 — Primitive kit rebuilt to frame specs (`components/ui.jsx`)
Mockup: per-REQ authoritative frames (checklist R21S1E2-REQ1…13) · Current: `ui.jsx` (legacy Badge/Btn/Card… + R15 P-components)

- [x] **R21S1E2-US1** — compose any frame from primitives without local overrides
  - AC:
    - [ ] `ui.jsx` exports at §0.2 spec: `Badge` (pill h20 r999 mono 10/600 upper ls.04em, dot option, 6 tints), `Btn` (primary/secondary/ghost/destructive; h34 r8 13/600; h36/h40 size variants), `Card`/`KpiCard`, `DataTable` (fr-template string prop, header h36–38 `#fafbfc` mono 10/600 ls.06em, rows h40–48 hover `#f8fafc`, `tinted(row)` prop), `Input/Select/Textarea/FieldLabel` (h36 r8 border `#d4d9e1`, mono variant), `Toggle` 34×20, `Checkbox` 14–15 r4, `RadioCard`, `Tabs` (underline 12.5px active `#1d4ed8` 2px border) + `FilterChips` (count-pill), `Avatar` 24/26/28/34 + `AvatarStack`, `ProgressBar` h5–10 (+stacked) + `Meter`, `CodeBlock` dark + `LogLine`, `Modal` (r14 shadow spec, footer `#fafbfc`), `Drawer` 420, `Sparkline/Donut/BarRow`, `SectionLabel`
    - [ ] `/app/__kit` gallery route renders every primitive beside its §0.2 spec string (dev aid; admin-only not required)
  - Tasks — Backend/API: N/A
  - Tasks — UI/E2E:
    - [ ] TASK1 RED: `tests/ui/r21s1_kit.spec.js` asserts computed styles on gallery exemplars: Badge height 20 + border-radius 999 + mono; Btn primary h34 r8 bg `#2563eb` w600; secondary border `#d4d9e1`; Card r10 border `#e4e8ef` p20; DataTable header bg `#fafbfc` + grid-template-columns passthrough; Input h36 border; Toggle 34×20 on/off colors; Tabs active color+border; Avatar size/bg; Modal radius+footer bg; CodeBlock bg `#0b1220`
    - [ ] TASK2 Implement kit (new primitives + upgrades in place; keep exports' names stable)
      - [ ] Subtask: geometry/type per REQ1–REQ13 with frame cross-ref comments
      - [ ] Subtask: `/app/__kit` gallery page (`screens/KitGallery.jsx`) + route in App.jsx + `window.__TOKENS__` hook
    - [ ] TASK3 Verification gate: story spec green; full UI suite green (legacy screens using upgraded primitives must not break existing tests — visual upgrades allowed, testids kept)
- [x] **R21S1E2-US2** — reviewer can diff each primitive vs its frame region
  - AC:
    - [ ] `parityShot()` helper writes `docs/specs/parity/kit/app.png` (gallery full-page) during the kit spec run; README-parity note explains pairing with mockup frames
  - Tasks — UI/E2E:
    - [ ] TASK1 `tests/ui/helpers.mjs` `parityShot(page, slug)` (1440px viewport, full-page, writes under repo `docs/specs/parity/<slug>/app.png`; mirrored by run_ui.sh copy-back)
    - [ ] TASK2 Wire into kit spec; commit folder README
- [x] **R21S1E2-US3** — legacy call sites keep compiling, render NEW visuals
  - AC:
    - [ ] `Badge` (radius-4 legacy) now renders pill spec at every legacy call site; `Btn` maps legacy `size` md→h34 etc.; no screen renders radius-4 badges (computed-style spot-check on a legacy screen e.g. `/app/data/health`)
    - [ ] Full existing UI suite green unchanged (compat = no API break)
  - Tasks — UI/E2E:
    - [ ] TASK1 RED: computed-style assertion on a legacy screen's Badge/Btn (fails while legacy styles live)
    - [ ] TASK2 Map legacy props (variant names, `xs`, `size`, `outline`) onto new visuals inside the same exports
    - [ ] TASK3 Verification gate: FULL UI regression (this story's blast radius is every screen)

#### Epic R21S1E3 — SVG icon set (replace all emoji)
Mockup: `App Home.dc.html` #home sidebar/topbar icons · Current: emoji in `Shell.jsx`, legacy screens

- [x] **R21S1E3-US1** — no emoji anywhere; icons match frame line style
  - AC:
    - [ ] `components/icons.jsx`: Home, Create, Artifacts, Data, Semantic, Gold, Models, Alerts, Governance, Team, Admin, Billing, Settings, Search, Bell, Help, Caret, Close, Check, Warning, Info, Lock, External, Copy, Eye, Filter, GridView, ListView — 15px viewBox stroke `currentColor` (paths extracted from mockup `<aside>`/topbar SVGs)
    - [ ] Shared `Logo` component (22px shell / 24 marketing / 30 hub sizes) extracted from Shell.jsx
    - [ ] `grep -P` emoji ranges over `client/src` → 0 matches (enforced as a UI test via child_process, so it can't regress)
  - Tasks — Backend/API: N/A
  - Tasks — UI/E2E:
    - [ ] TASK1 RED: emoji-grep test + icons module presence test (gallery renders all icons)
    - [ ] TASK2 Extract SVG paths from `App Home.dc.html` into `icons.jsx`; export `<Icon name size/>` map; replace emoji in Shell (full swap lands with R21S2E1/E2) and legacy screens' chrome-visible emoji (⌂ ✦ ▦ 🔔 ⚙ …) via mechanical substitution
    - [ ] TASK3 Verification gate: full UI suite (legacy screens still pass), build green

### Sprint R21S2 — Shell exact parity + global chrome
**Sprint Goal:** `Shell.jsx` chrome is pixel-faithful to #home; notifications drawer to #notifications.

#### Sprint Completion Checklist
- [x] 5 sprint stories complete · backend 414/414 + UI 72/72 (2026-07-04 19:45Z) · demo: any `/app` route shows parity chrome

#### Epic R21S2E1 — Sidebar parity
- [x] **R21S2E1-US1** — sidebar pixel-identical to #home at expanded width
  - AC:
    - [ ] Groups exactly: top ungrouped (Home/Create/Artifacts) · `DATA` (Data, Semantic Layer, Gold Tables) · `INTELLIGENCE` (Models, Alerts, Governance) · flex spacer · border-top group (Team, Admin, Billing, Settings) + Collapse row
    - [ ] Group label mono 9.5/600 ls .12em `#94a3b8` pad `12px 22px 4px`; logo row h64 pad `0 20` border-bottom `#eef1f5`; items gap 10 w/ 15px SVG icons; active bg `#e8effc` text `#1d4ed8` w600
    - [x] `components/Sidebar.jsx` (dead file) deleted (done early under R21S1E3 zero-emoji AC)
  - Tasks — Backend/API: N/A
  - Tasks — UI/E2E:
    - [ ] TASK1 RED: `tests/ui/r21s2_shell.spec.js` — group order/labels (INTELLIGENCE not Operate; Models under INTELLIGENCE), computed styles (label ls/pad, logo row border color, active item bg/color), icon `<svg>` present per item, Sidebar.jsx import gone (build) 
    - [ ] TASK2 Rewrite Shell aside per frame; delete dead component; migrate r15s1_shell.spec.js expectations that legitimately changed (cite R21S2E1-US1)
    - [ ] TASK3 Verification: full UI suite; role-gating (viewer loses Admin/Billing/Governance) must survive — keep `ADMIN_AREA_LABELS` behavior + its tests
- [x] **R21S2E1-US2** — 64px rail keeps centered icons + tooltips
  - AC: collapse row toggles rail; icons centered; `title` tooltips; state per current behavior (mockup shows expanded only — rail carries new icons)
  - Tasks — UI/E2E: TASK1 RED rail assertions (width 64, svg centered) → TASK2 implement → TASK3 gate

#### Epic R21S2E2 — Topbar parity
- [x] **R21S2E2-US1** — topbar 1:1 with #home on every `/app` route
  - AC:
    - [ ] Workspace switcher h36 bordered: 20px `#7c3aed` "AR" mark + "Acme Retail" 13/600 + caret SVG
    - [ ] Search pill 520×36 r999 bg `#f7f8fa` border, search SVG + "Search artifacts, metrics, sources…" + `⌘K` keycap chip (mono 10, white bg, bordered) inside right; existing overlay behavior kept
    - [ ] Bell 34px hit area, SVG bell, badge min-w15 h15 r999 `#dc2626` mono 9/600 white + 2px white ring; Help "?" 34px bordered → `/app/help`; Avatar 34px `#0e7490` initials 12/700 (derive from user email/name; demo "DK"); padding `0 28px` gap 16
  - Tasks — Backend/API: N/A
  - Tasks — UI/E2E: TASK1 RED (computed styles: badge bg #dc2626 + ring, pill radius/bg/placeholder text, chip text `⌘K`, avatar bg/initials, workspace chip content) → TASK2 rewrite header (keep `data-testid` topbar/bell/bell-count/global-search/avatar-menu) → TASK3 gate incl. search-overlay + notifications tests

#### Epic R21S2E3 — Content chrome + PageHeader pattern
- [x] **R21S2E3-US1** — every page opens with breadcrumb→title→actions block (no shell breadcrumb strip)
  - AC:
    - [ ] Shell: content padding `28px 32px`; global breadcrumb strip removed; body bg `#f7f8fa`; scrollbar thumb `#d4d9e1`
    - [ ] `PageHeader` API `{crumb, title, count, actions}` renders mono 11px `#94a3b8` crumb (`acme-retail / <area>`) above h1 21/600; legacy screens keep rendering (their old PageHeader signature mapped) — shell-level `data-testid="breadcrumbs"` moves into PageHeader so existing tests keep a target (contract change cited where copy shifts from `app / …` to `acme-retail / …`)
  - Tasks — Backend/API: N/A
  - Tasks — UI/E2E: TASK1 RED (no `breadcrumbs` node directly under topbar; PageHeader crumb format on `/app/artifacts`; main padding) → TASK2 implement + migrate affected legacy specs w/ story-ID comments → TASK3 gate (full UI)

#### Epic R21S2E4 — Notifications drawer parity
- [x] **R21S2E4-US1** — bell opens the #notifications drawer exactly
  - AC:
    - [ ] 420px panel, scrim `rgba(15,23,42,.28)`, shadow `-16px 0 48px rgba(15,23,42,.18)`; header "Notifications" + "Mark all read" + ✕
    - [ ] Tabs All / Unread·n / Mentions (chip style, client-side filter); groups TODAY/YESTERDAY/EARLIER (mono 9.5 labels)
    - [ ] Rows: 28px tinted icon tile by kind (alert `#fdeaea` red / mention `#f3eefe` purple / freshness `#fdf3e3` amber / build `#eff4ff` blue / success `#e8f5ec` green) + title/meta + right time; unread bg `#f8faff` + 2px accent left border + 7px dot
    - [ ] `DEP:` `/api/notifications` rows expose `kind` mappable to the 5 tiles + `mention` flag + `created_at` for grouping — extend response if missing (backward-compatible)
  - Tasks — Backend/API:
    - [ ] TASK1 RED: `tests/test_r21s2_notifications.py` — notifications API returns `kind`,`mention`,`created_at` per row (seed via existing fan-out paths); mark-all-read unchanged
    - [ ] TASK2 Implement projection in `server/app.py` notifications route (or confirm fields already present → convert test to contract lock)
  - Tasks — UI/E2E:
    - [ ] TASK3 RED: drawer width/scrim/tabs/group-labels/tile tints/unread treatment
    - [ ] TASK4 Rebuild drawer in Shell on new primitives (Drawer/Badge/SectionLabel)
    - [ ] TASK5 Verification gate: r18 people tests (bell/mark-all-read) still green; full suites; sprint-close regression recorded

#### Sprint R21S1+R21S2 regression (sprint-close gate)
- [x] Full backend suite green (S1: 412/412 @19:05Z · S2: 414/414 @19:45Z)
- [x] Full UI suite green (S1: 67/67 @19:05Z · S2: 72/72 @19:45Z)

### Release R21 close-out
- [x] Release regression: backend 414/414 · UI 72/72 back-to-back (2026-07-04 19:45Z)
- [x] Zero-key boot check: cold start on :3001, 8 services `local`, /app → 200
- [x] Milestone DP-A success criteria all checked

## Release R22 — Core App Screens Parity (Home · Activity · Artifacts) — **closed early 2026-07-04: remainder superseded by R30–R36 (see Reconciliation in the UI Parity & Build-Out Program section)**

### Milestone DP-B — Daily-driver screens — superseded 2026-07-04 (open criteria transferred: activity → UP-B/R31S2E1, artifacts → UP-A/R30S1E2..E4)
#### Milestone Success Criteria
- [x] `/app` = mockup home (hero prompt + 8 live widgets) — delivered by R22S1E1; `/app/activity` timeline live → transferred to R31S2E1
- Artifacts library cards/table/detail → transferred to R30S1E2/E3/E4 (incl. `S10_Artifacts.jsx` retirement); `S01_Home.jsx` retired ✓ (R22S1E1-US3)

### Sprint R22S1 — Workspace home & activity — closed with E1 delivered; E2 transferred to R31S2E1
**Sprint Goal:** the two ambient screens users see all day are frame-exact and data-live.
#### Sprint Completion Checklist
- [x] R22S1E1 stories complete (3/3) · story regression recorded 416/416 backend · 75/75 UI (2026-07-04 19:20Z) — no separate sprint-close gate run; remainder superseded

#### Epic R22S1E1 — Workspace Home rebuild (`/app`, replaces S01_Home)
- [x] **R22S1E1-US1** — `/app` is Frame 01: greeting row (crumb `acme-retail / home`, h1 "Good morning, {firstName}", right mono date), hero prompt bar (border `#c7d9f8` r12 shadow spec, sparkle SVG, ghost example, `⏎ build` keycap, Create h40), widget grid `repeat(3,1fr)` gap 18 with all 8 widgets (Recent artifacts span-2 w/ sparkline thumbs; Data-health 86px donut + 4 stat rows; Active runs w/ progress+mono stage; Alerts firing severity chips; Awaiting review chips; Suggested analyses "+" prompts; Recently viewed; Usage & cost ADMIN-badged mono KPI → `/app/billing/usage`); every widget deep-links per frame
  - `DEP:` `GET /api/home/summary` aggregate (compose existing: artifacts recents+health, pipeline runs, alerts/subscriptions, review-queue counts, usage rollup) — additive endpoint
  - Tasks — Backend/API: [ ] RED `tests/test_r22s1_home.py` (summary shape: recents[], health{score,components}, runs[], alerts[], review_counts{}, usage{tokens,pct}; ACL: usage block admin-only) → [ ] implement aggregation in `server/app.py` reusing existing queries → [ ] negative test (viewer gets no usage block)
  - Tasks — UI/E2E: [ ] RED `tests/ui/r22s1_home.spec.js` (hero styles/keycap; 8 widgets present w/ exact titles; donut svg; links navigate; legacy wizard landing gone) → [ ] rebuild `screens/Home.jsx` on kit; retire `S01_Home.jsx` (route swap; keep old file until spec green, then delete + cite) → [ ] parityShot `home` → [ ] gate: full suites
- [x] **R22S1E1-US2** — hero ⏎ starts seeded workbench session
  - AC: typing + Enter → `/app/create/new?q=…`; Workbench consumes seed into first user message (existing session start API)
  - Tasks — UI/E2E: [ ] RED (type→Enter→URL has q; workbench chat shows seeded question) → [ ] implement (Home input + Workbench `useSearchParams` seed) → [ ] gate
- [x] **R22S1E1-US3** *(added: retirement)* — S01 deleted; `/app` route serves new Home only; no `useApp().screen===1` reads remain
  - Tasks — UI/E2E: [ ] grep-test no `S01_Home` import → [ ] delete file + routes cleanup → [ ] full regression

> **R22 closed early (2026-07-04).** Delivered: R22S1E1-US1/US2/US3 (recorded above + in PROGRESS.md, story regression 416/416 backend · 75/75 UI). Remainder retired → new IDs: R22S1E2→R31S2E1 · R22S2E1→R30S1E2 · R22S2E2→R30S1E3 · R22S2E3→R30S1E4 (full mapping in the Reconciliation block below). No R22 release-close gate was run; the superseding releases carry their own gates.

---
---

# UI Parity & Build-Out Program (PRD v1.0) — R30–R36

**Spec (canonical):** `specs/prd-package/AnalytIQ Mock Up Comparison Analysis/PRD - AnalytIQ UI Parity & Build-Out.md` (v1.0, 2026-07-04). Part I = global rules (§4 design system, §5.1 forbidden vocabulary, §6 phasing, §7 global ACs, §8 open items); Part II ch00–18 = per-area build specs (each chapter + its cited `.dc.html` lines are the contract).
**Dimensions/copy source:** the 34 `.dc.html` mockups pinned at `docs/specs/mockups/` (the frame IS the spec; on any conflict the frame wins — PRD Part I §3).
**Supporting (demoted):** `docs/specs/GAP_ANALYSIS_DESIGN_PARITY_CHECKLIST.md` + `UI_MOCKUP_ANALYSIS.md` remain as dimension/copy cross-reference only — the PRD supersedes them as spec.
**Goal:** every reviewed mockup screen at its designed route with designed layout/states/copy; zero user-visible internal vocabulary (PRD §5.1); pricing/plan data factually correct (PRD §7). Backend deltas only where a story carries a `DEP:` line.
**Sequencing:** releases R30–R34 = PRD §6 Phases 1–5 in order; R35–R36 = remaining old-plan scope in PRD-unreviewed areas (PRD §8: audit-first), kept in old-plan order. Design-system application + de-leaking are continuous (PRD §6).

## Reconciliation (2026-07-04, PRD v1.0)

Decisions of record for this restructure:
- **(a) Canonical spec change:** the PRD above is now the spec of record; the design-parity checklist is demoted to supporting doc (dimension shorthand). Where PRD chapter and checklist disagree, PRD chapter wins; where PRD and the mockup frame disagree, the frame wins.
- **(b) Screenshots open item resolved:** PRD §8's `screenshots/` folder requirement is superseded by the existing `docs/specs/parity/` evidence system + PAR-1 scoreboard (parityShot pairs per frame) — sign-off recorded here; no manual screenshot placement work is scheduled.
- **(c) Stale-vs-code PRD claims:** PRD ch11's "Clarify state missing" and ch14's "/share/:token MISSING ENTIRELY" are stale against current code (clarify chips shipped in R16S1E1; `PublicViewer` at `/share/:token` shipped in R19). The affected stories (R30S2E2, R33S2E1–E3) diff against CURRENT CODE, not the PRD's absence claims.
- **(d) Artifacts extras ruling (user decision):** the "ROI report" / "Sandbox" / "Health dashboard" buttons on the artifacts page are RELOCATED behind the per-artifact ⋯ overflow menu — PRD §8 open item resolved 2026-07-04. Enforced as an AC of R30S1E2-US1.
- **(e) Workbench rail KEPT:** the collapsed 64px icon-only sidebar inside the Create Workbench stays (PRD-approved deviation, Part I §2 + ch11). R30S2E1 is amended accordingly (the old R23S1E1 "no app sidebar on this route" AC is dropped).
- **(f) Pricing data pull-forward:** the ch02 plan-data factual errors are fixed in R30S1E1 (new story) per PRD §6 Phase-5 note ("quick correctness win to pull forward") + §7; the visual restyle stays in R34S1E4, which gains a data-regression AC citing R30S1E1.
- **Retired-ID grep (verified 2026-07-04):** no code or test cites a retired pending ID. `tests/` matches are only the completed-era files (`test_r22s1_home.py`, `tests/ui/r22s1_home.spec.js` — R22S1E1 history, untouched) plus `tests/ui/r29s1_marketing.spec.js`, whose header cites the legacy "R29S1 precursor slice" (delivered marketing shell, not a pending story) — that file is renamed `r34s1_marketing.spec.js` on first touch inside R34S1E2 (rename-only, header cites this block). `client/src/screens/Marketing.jsx`'s `// R23` header marker is now updated on first touch in **R30S1E1** (was planned for R29S1E1).

### Old → new story-ID map (all old pending IDs retired)
| Old (retired) | New | Notes |
|---|---|---|
| — (new story) | R30S1E1-US1 | pricing data hotfix — pull-forward per (f) |
| R22S2E1-US1 | R30S1E2-US1 | library card view + rail; gains ⋯-relocation AC per (d) |
| R22S2E2-US1 | R30S1E3-US1 | library table view |
| R22S2E3-US1 | R30S1E4-US1 | artifact detail; internals moved off Dashboard tab (ch13) |
| R23S1E1-US1 | R30S2E1-US1 | AMENDED: keep collapsed rail per (e) |
| R23S1E2-US1 | R30S2E2-US1 | chat/clarify/plan — diff vs code per (c) |
| R23S1E3-US1 | R30S2E3-US1 + -US2 | split: start/empty/building states · canvas state |
| R23S1E3-US2 | R30S2E3-US3 | canvas section-select |
| R23S1E4-US1 | R30S2E4-US1 | AMENDED: tab-set ruling recorded before RED |
| R23S2E1-US1 | R30S3E1-US1 | data trust contracts panel |
| R23S2E2-US1 | R30S3E2-US1 | pipeline audit panel |
| R23S2E3-US1 | R30S3E3-US1 | insights panel |
| R23S2E4-US1 | R30S3E4-US1 | share modal (canonical) |
| R23S2E5-US1 | R30S3E5-US1 | version history (opens from topbar; ref-hash leak removed) |
| R23S2E6-US1 | R30S3E6-US1 | comments drawer + pins |
| R23S2E7-US1 | R30S3E7-US1 | wizard retirement |
| — (new story) | R30S3E8-US1 | forbidden-vocabulary gate (PRD §5.1) |
| R28S1E1-US1 | R31S1E1-US1 | AMENDED: PBKDF2/Agent-memory-unreachable AC |
| R28S1E2-US1 | R31S1E2-US1 | auth states ×4 |
| R28S1E3-US1 | R31S1E3-US1 | onboarding ×4 |
| R22S1E2-US1 | R31S2E1-US1 | activity page — full ACs/DEP/tasks carried verbatim; + View-all-links AC |
| — (new story) | R31S2E2-US1 | home polish deltas (ch10 §2–7) |
| R25S1E1..E6-US1 | R32S1E1..E6-US1 | governance, order preserved; E6 gains S13 retirement AC |
| R25S2E1..E3-US1 | R32S2E1..E3-US1 | semantic layer |
| R26S1E1..E4-US1 | R33S1E1..E4-US1 | models & model ops |
| R28S2E2-US1 | R33S2E1-US1 | public viewer parity + expired card — diff vs code per (c) |
| R28S2E3-US1 | R33S2E2-US1 + E3-US1 | split: embed preview page · present mode |
| R28S2E1-US1 | R33S2E4-US1 | error-page template ×8 |
| R29S1E1..E4-US1 | R34S1E1..E4-US1 | marketing chrome/landing/product/pricing-restyle; E4 gains data-regression AC per (f) |
| R29S2E1..E4-US1 | R34S2E1..E4-US1 | solutions/templates/security/docs |
| R24S1E1..E4-US1 | R35S1E1..E4-US1 | data layer — PRD §8 audit-first task added |
| R24S2E1..E2-US1 | R35S2E1..E2-US1 | source detail · table detail |
| R26S2E1-US1 | R36S1E1-US1 | gold list + detail |
| R26S2E2-US1 | R36S1E2-US1 | data + query contracts screens |
| R26S2E3-US1 | R36S1E3-US1 | alerts ×3 (`DEP:` alerts CRUD) |
| R27S1E1..E5-US1 | R36S2E1..E5-US1 | collab / admin+roles / SSO+branding / security×4 / usage |
| R27S2E1-US1 | R36S3E1-US1 | billing ×3 |
| R27S2E2-US1 | R36S3E2-US1 | settings ×4 incl. technical-detail toggle flip |

## Program conventions (carried unchanged from the Design-Parity Program)
- Story IDs `R<r>S<s>E<e>-US<n>`; one UI spec file per epic `tests/ui/r<r>s<s>_<epic-slug>.spec.js`; backend test files `tests/test_r<r>s<s>_<slug>.py` only for stories with a `DEP:` line; stories without backend work state `N/A — consumes existing endpoints (no contract change)`.
- Parity evidence: `parityShot(page, slug)` → `docs/specs/parity/<slug>/app.png` @1440; structural test assertions are the enforceable gate, screenshots the human-review pair.
- Charts geometric SVG only (no chart library); icons 15px stroke SVG from `components/icons.jsx`; zero emoji.
- `data-testid` hooks preserved or migrated inside the story that rewrites a screen, citing the story ID in the test diff; legacy files deleted only in the story that supersedes them (Appendix-B timing), never before replacement tests are green.
- **PAR-1 scoreboard:** every parity story's DoD includes its frame(s) flipping ✅ on `npm run test:parity` before the story is ticked. **PAR-2:** landed stories promote their frame's cross-links from parity.spec.js into gating `tests/ui/flows.spec.js`.
- **NEW (PRD §5.1):** from the R30S3 sprint close onward, the forbidden-vocabulary suite (R30S3E8) gates the whole app; leaks in not-yet-rebuilt legacy screens are enumerated in the suite's ledger as `allowed-until <story-ID>` and each entry is deleted by that story.
- Task elaboration: FULL task/subtask detail for R30 (next to execute). R31–R36 carry final ACs/Touches/Dependencies; task chains stay compressed and are elaborated just-in-time (Phase 1a backfill) — compressed sprints are marked `<!-- task elaboration pending Phase 1a -->`. Exception: R31S2E1 keeps its full carried task chain (was fully elaborated as R22S1E2).

## Release R30 — PRD Phase 1: Core Loop Credibility (FULL TASK DETAIL)

> PRD §6 Phase 1 (ch11 workbench + ch12 inspector + ch13 artifacts) + the ch02 pricing-data pull-forward (Reconciliation (f)). Outcome: the demo spine — pricing facts, library, detail, workbench, inspector — is frame-faithful and leak-free.

### Milestone UP-A — The product spine is demo-honest
#### Milestone Success Criteria
- [ ] Pricing plan data matches the PRD ch02 table exactly (regression-locked for R34)
- [ ] Artifacts library cards/table/detail match frames over real artifacts; ROI/Sandbox/Health live only in ⋯ menus (d); legacy S10 retired
- [ ] Workbench = 3-column 5-state frame with rail kept (e); inspector tab-set per recorded ruling; share modal canonical; wizard S06–S09 retired
- [ ] Forbidden-vocabulary suite (PRD §5.1) gating with an explicit allowed-until ledger

### Sprint R30S1 — Pricing data hotfix + Artifacts surfaces (PRD ch02 data · ch13)
**Sprint Goal:** the factually wrong numbers and the most-visited library surfaces are fixed first.
#### Sprint Completion Checklist
- [ ] 4 stories complete · full backend+UI regression green (recorded) · demo: /pricing facts → library cards → table → detail

#### Epic R30S1E1 — Pricing data hotfix (pull-forward)
Mockup: `Marketing Pricing.dc.html` lines 57–123 · PRD: ch02 "Data/content errors" table + Part I §6 Phase-5 note + §7 · Current: `client/src/screens/Marketing.jsx` `PLANS` (Starter "1 seat/Dashboards", Team "5 seats/1M tokens", Business "25 seats/5M tokens/Audit export", Enterprise "SIEM streaming" — all factually wrong)

- [x] **R30S1E1-US1** — the four plan cards state the mockup's facts; restyle waits for R34S1E4 ✅ 2026-07-04 (spec r30s1_pricing_data ×3 green · UI 85/85 · backend 416/416)
  - AC:
    - [ ] Plan data exactly matches the ch02 table: **Starter $0** — `3 seats · 1 source` · `100K tokens` · `5 artifacts` · excluded `— Predictive models` · excluded `— Public share links`; **Team $149** — `10 seats · 3 sources` · `500K tokens/mo` · `Unlimited artifacts` · `Predictive models + model cards` · `Public sharing: links only`; **Business $499** — `2M tokens/mo · overage $8/100K` · `SSO · RLS · full audit log` · `Signed embeds + public links` · `Priority support`; **Enterprise Custom** — `Unlimited seats & sources` · `Custom token pools` · `VPC · private link` · `99.9% SLA · DPA · SOC 2 reports` · `Dedicated success engineer`
    - [ ] Excluded rows render visibly distinct from included rows (em-dash grayed prefix acceptable pre-restyle); none of the retired strings remain anywhere on /pricing: "SIEM streaming", "Dashboards", "1M tokens", "5M tokens", "1 seat", "5 seats", "25 seats", "Audit export"
    - [ ] Visual restyle explicitly OUT of scope (R34S1E4 owns layout/toggle/table/FAQ) — this story asserts data only
    - [ ] `Marketing.jsx` `// R23` header marker → `// R30S1E1 (program R30–R36)` (Reconciliation)
  - Tasks — Backend/API: N/A — consumes existing endpoints (no contract change)
  - Tasks — UI/E2E:
    - [ ] TASK1 RED: `tests/ui/r30s1_pricing_data.spec.js` — /pricing renders every exact plan string above and none of the retired strings (fails against current PLANS)
    - [ ] TASK2 Rewrite `PLANS` (tuple shape may gain an `excluded` flag per row); update header marker
    - [ ] TASK3 Verification gate: story spec green; full backend+UI suites green
  - Test Plan — Backend/API: none · UI/E2E: exact-string presence + retired-string absence per card (this spec becomes R34S1E4's data-regression lock — it must stay green through the restyle)
  - Touches: `client/src/screens/Marketing.jsx`, `tests/ui/r30s1_pricing_data.spec.js`
  - Story Dependencies: none
  - DoD: story spec + full regression green · PAR-1: no frame flip claimed (data-only; the `Marketing Pricing` frame flips in R34S1E4)

#### Epic R30S1E2 — Library card view + filter rail (`/app/artifacts`, replaces S10 body)
Mockup: `Artifacts Library.dc.html` Frame 01 · PRD: ch13 §1 (incl. §1.7 extras ruling (d)) · Current: `S10_Artifacts.jsx` — single-column list, ~14 inline buttons incl. `⊙ ROI report`/`⧉ Sandbox`/`Health dashboard` (S10_Artifacts.jsx:325–331), "Deep search (titles + metric names, FTS)…" input (S10_Artifacts.jsx:347 — §5.1 leak)

- [x] **R30S1E2-US1** — Frame 01 card grid at parity (carried from R22S2E1-US1 + Reconciliation (d)) ✅ 2026-07-04 (spec r30s1_library ×6 green · UI 91/91 · backend 416/416 · parityShot docs/specs/parity/artifacts-library/library.png)
  - Agent Notes (R30S1E2-US1, 2026-07-04):
    - ⋯ placement ruling: api.roiReport()/healthDashboard() are workspace-level and sandbox flips the whole list — ROI kept per-artifact per decision (d) wording; Sandbox view + Health dashboard → header-level ⋯. Asserted by r30s1_library "⋯ menus own…".
    - Migrated w/ citation: r8s1_uas, r8s2_dag, r9s1_parallel, r9s2_sandbox, r11s1_explain, r11s2_replay, r12s1_opportunity, r12s2_monitor, r12s2_roi (+seed), r15s1_router (marker swap), r15s2_components (placeholder swap), r11s1_confidence + r11s2_health (health-pill vocabulary replaces raw DQ/score chips; numeric pill returns in R30S1E3 table).
    - Root-caused flakes fixed in-screen: health fetch batched to one commit; duplicate mount fetch removed; full spinner only before first data (refetches keep grid mounted).
    - Legacy R8–R12 panels (provenance/DAG/replay/explain/monitor/opportunities) render inside the owning card with original testids; ShareModal interim (canonical modal = R30S3E4). "Public links" rail facet matches explicit flags only until share state lands in the list payload (R30S3E4).
  - AC:
    - [ ] 220px filter rail: FILTERS checkboxes Created by me / Shared with me / Predictive / Has warnings / Public links / Needs review; divider; FOLDERS list w/ counts; main p `24 28`
    - [ ] Header: h1 "Artifacts {n}" + SINGLE filter input 260×34 + Cards/Table segmented toggle (active `#0f172a` white) + "+ New dashboard" primary; the "Deep search … FTS" input is REMOVED (leak ledger entry closed)
    - [ ] Card grid `repeat(3,1fr)` gap 16: thumb zone `#f7f8fa` p14 dot strip + chart SVG; body title 12.5/600 + ⋯ overflow trigger; badge row TYPE/health/owner/age
    - [ ] Type chips PREDICTIVE purple / DASHBOARD blue-gray / PUBLIC LINK blue / MONITOR cyan; health ● HEALTHY / 2 WARNINGS / NEEDS REVIEW
    - [ ] ⋯ overflow menu replaces the ~14 inline button rows; **decision AC (Reconciliation (d), PRD §8 open item resolved 2026-07-04):** "ROI report", "Sandbox view", "Health dashboard" are reachable ONLY via ⋯ menus (per-artifact ⋯ for ROI report; if Sandbox/Health prove workspace-level, a header-level ⋯ is the allowed placement — record the ruling in Agent Notes), never as inline toolbar buttons; all three handlers keep working (ROI generates a native artifact, sandbox view toggles, health dashboard creates)
    - [ ] Dashed ghost tile "+ New dashboard from a question" (1.5px dashed, min-h 180) → workbench
    - [ ] Combined rail filters narrow the grid; toggle switches views
  - Tasks — Backend/API: N/A — existing list API has favorites/tags/filters (R7S2E1); rail filters map client-side or via existing query params
  - Tasks — UI/E2E:
    - [ ] TASK1 RED: `tests/ui/r30s1_library.spec.js` — rail structure; combined filters narrow the grid; toggle switches views; ghost tile → workbench; chips/tints; ⋯ menu(s) contain ROI/Sandbox/Health while the page body renders NO inline instance of them; "FTS" absent from rendered DOM
    - [ ] TASK2 Rebuild as `screens/Artifacts.jsx` (cards) keeping S10 testids where semantically same; migrate favorites/insights/links/embed/activity affordances into frame placements (cite moves); wire ⋯ items to the existing ROI/sandbox/health handlers
    - [ ] TASK3 parityShot `artifacts-library`
    - [ ] TASK4 Verification gate: full suites incl. r15s2 table-view tests migration (cite this story)
  - Test Plan — Backend/API: none · UI/E2E: TASK1 assertions (rail/grid/toggle/ghost/⋯-relocation/leak-absence)
  - Touches: `client/src/screens/Artifacts.jsx` (new), `client/src/routes.jsx`, `client/src/screens/S10_Artifacts.jsx` (kept until R30S1E4 deletes it), `tests/ui/r30s1_library.spec.js`
  - Story Dependencies: none (independent of R30S1E1)
  - DoD: story spec + full regression green · PAR-1: `Artifacts Library` Frame 01 flips ✅

#### Epic R30S1E3 — Library table view
Mockup: `Artifacts Library.dc.html` Frame 02 · PRD: ch13 §2 · Current: R15S2 DataTable view (wrong columns, no scored health pill)

- [ ] **R30S1E3-US1** — table view at parity (carried from R22S2E2-US1)
  - AC:
    - [ ] DataTable grid `2fr .9fr .9fr 1fr 1fr .9fr 1fr 44px`: TITLE (sort ↓ indicator) / OWNER avatar+name / TYPE mono chip / DATA HEALTH ● scored pill (e.g. `● 96 HEALTHY`) / LAST REFRESHED relative / SHARE / TAGS chips / ⋯
    - [ ] Rows h46 → detail route; `?view=table` persists across reload; ⋯ menu identical to card view (incl. relocated extras per (d))
  - Tasks — Backend/API: N/A — consumes existing endpoints (no contract change)
  - Tasks — UI/E2E:
    - [ ] TASK1 RED: `tests/ui/r30s1_library_table.spec.js` — exact column template via computed grid-template-columns; sort arrow on TITLE; url-param persistence; scored health pill content; relative timestamp format
    - [ ] TASK2 Implement over kit DataTable inside `Artifacts.jsx`
    - [ ] TASK3 Verification gate: story spec + full suites
  - Test Plan — Backend/API: none · UI/E2E: TASK1 assertions
  - Touches: `client/src/screens/Artifacts.jsx`, `tests/ui/r30s1_library_table.spec.js`
  - Story Dependencies: R30S1E2-US1 (shares screen + toggle)
  - DoD: story spec + full regression green · PAR-1: `Artifacts Library` Frame 02 flips ✅

#### Epic R30S1E4 — Artifact Detail (`/app/artifacts/:id`, new)
Mockup: `Artifacts Library.dc.html` Frame 03 · PRD: ch13 §3 (tab distribution; CENTERPIECE kill) · Current: S09_Dashboard.jsx wizard result view (`Centerpiece` badge at S09_Dashboard.jsx:95) + S10 detail affordances mixing model/DQ/lineage internals into one surface

- [ ] **R30S1E4-US1** — detail page at parity (carried from R22S2E3-US1 + ch13 de-leak)
  - AC:
    - [ ] Header block: breadcrumb `artifacts / <folder> / <slug>`; h1 editable title (rename-on-hover dashed affordance); pills ● HEALTHY 96 / PREDICTIVE / v14; meta line owner · refreshed · schedule; actions Open in workbench / Duplicate / Export / Share (primary)
    - [ ] 8-tab strip Dashboard·Insights·Pipeline·Lineage·Model·Versions·Sharing·Activity, routed via `?tab=`
    - [ ] Dashboard tab = 4 KPI cards + `1.6fr 1fr` chart sections (line-vs-target w/ CI polygon; region gap bars w/ signed mono deltas) from existing `chart_data` — and NOTHING else: model internals render on the Model tab, DQ/gate results on the Pipeline tab, lineage on the Lineage tab (moved OFF Dashboard)
    - [ ] "CENTERPIECE" tag removed — the new detail surface never renders it (S09's own instance dies with S09 in R30S3E7; ledger)
    - [ ] Share opens the canonical modal (R30S3E4 — until then a stub asserting the trigger); Open-in-workbench resumes the artifact's session id
  - Tasks — Backend/API: N/A — artifact fetch/duplicate/versions/health/insights routes exist (R6/R7/R11/R12)
  - Tasks — UI/E2E:
    - [ ] TASK1 RED: `tests/ui/r30s1_detail.spec.js` — header anatomy incl. rename affordance; tab strip + `?tab=` routing; Dashboard tab contains KPIs+charts and does NOT contain model/gate/lineage internals nor "CENTERPIECE"; Share trigger; workbench resume
    - [ ] TASK2 Build `screens/ArtifactDetail.jsx` + route; distribute internals to their tabs (Model/Pipeline/Lineage consume the same existing APIs)
    - [ ] TASK3 parityShot `artifact-detail`
    - [ ] TASK4 Verification gate: full suites; then delete `S10_Artifacts.jsx` (Appendix-B timing) with citation + grep-test no `S10_Artifacts` import remains
  - Test Plan — Backend/API: none · UI/E2E: TASK1 assertions + post-delete grep
  - Touches: `client/src/screens/ArtifactDetail.jsx` (new), `client/src/screens/Artifacts.jsx`, `client/src/routes.jsx`, delete `client/src/screens/S10_Artifacts.jsx`, `tests/ui/r30s1_detail.spec.js`
  - Story Dependencies: R30S1E2-US1 (list → detail links)
  - DoD: story spec + full regression green · PAR-1: `Artifacts Library` Frame 03 flips ✅
### Sprint R30S2 — Create Workbench (PRD ch11)
**Sprint Goal:** `/app/create/:id` is the flagship frame at fidelity — stories diff against CODE (clarify chips exist per Reconciliation (c)), not the PRD's stale absence claims.
#### Sprint Completion Checklist
- [ ] 6 stories complete · full regression green (recorded) · demo: question→clarify→plan→build→canvas→section edit

#### Epic R30S2E1 — Workbench chrome & session topbar
Mockup: `Create Workbench.dc.html` session chrome · PRD: ch11 chrome + Part I §2 approved deviation (e) · Current: `Workbench.jsx` R16 chrome

- [ ] **R30S2E1-US1** — session chrome (carried from R23S1E1-US1, **AMENDED: keep the rail**)
  - AC:
    - [ ] **Amendment (Reconciliation (e)):** the collapsed 64px icon rail STAYS on this route (approved deviation — the mockup removes the sidebar entirely; we keep the rail, collapsed by default, expandable); the old "no app sidebar on this route" AC is void
    - [ ] Dedicated 56px session topbar: logo→/app, divider, title block (session name 13/600 + mono session id + sources line), green GOVERNED pill, spacer, mono "autosaved {t} ago", Versions secondary btn (opens R30S3E5 panel; until then a stub asserting the trigger), Share primary, avatar
    - [ ] Body columns `350px | flex | 330px` (measured beside the 64px rail)
  - Tasks — Backend/API: N/A — consumes existing endpoints (no contract change)
  - Tasks — UI/E2E:
    - [ ] TASK1 RED: `tests/ui/r30s2_workbench.spec.js` — h56 topbar; rail PRESENT at 64px collapsed (deviation assertion); GOVERNED pill/autosave mono/Versions/Share/avatar; 3-col widths
    - [ ] TASK2 Refit `Workbench.jsx` chrome (+ Shell rail behavior on this route)
    - [ ] TASK3 Verification gate: r16 workbench tests migrated w/ citations; full suites
  - Test Plan — Backend/API: none · UI/E2E: TASK1 assertions
  - Touches: `client/src/screens/Workbench.jsx`, `client/src/components/Shell.jsx`, `tests/ui/r30s2_workbench.spec.js`
  - Story Dependencies: none
  - DoD: story spec + full regression green · PAR-1: workbench chrome frame flips ✅

#### Epic R30S2E2 — Chat column: clarify → plan → build → done
Mockup: `Create Workbench.dc.html` chat frames · PRD: ch11 chat (Clarify "missing" claim is STALE — diff vs code (c)) · Current: R16 chat — clarify chips exist; plan card lacks frame anatomy; no status lines/attachments row

- [ ] **R30S2E2-US1** — chat parity (carried from R23S1E2-US1)
  - AC:
    - [ ] User bubble `#2563eb`/`#eef4ff` r`13 13 4 13` with mono verification/status lines beneath; agent messages open with a 24px agent logo tile + `#f7f8fa` r`4 13 13 13` bubble; SUGGESTED chips row
    - [ ] Clarify frame styling per frame (chips already exist — style/confidence treatment is the delta; diff against CODE not PRD)
    - [ ] Plan review card: "Review your plan" header; GOAL/DIMENSIONS/FORECAST/SOURCES/ACCESS rows each with ✎ edit affordance; footer Approve & Build / Edit plan / Cancel; ✓ APPROVED pill state (accent border) after approval
    - [ ] Build ticker mono lines during run; done-state summary message + follow-up chips
    - [ ] Composer: attachments row + chips, + button, ghost placeholder, mic, 28px send
  - Tasks — Backend/API: N/A — consumes existing endpoints (plan/clarify/SSE APIs from R16/R4)
  - Tasks — UI/E2E:
    - [ ] TASK1 RED: `tests/ui/r30s2_chat.spec.js` — per-archetype assertions across a staged flow (drive a real session via API; SSE states): bubble styles, status lines, clarify treatment, plan card rows + ✎ + footer + APPROVED flip, done summary + chips, composer anatomy
    - [ ] TASK2 Restyle chat renderers in `Workbench.jsx` (split `ChatColumn` component if needed)
    - [ ] TASK3 Verification gate: full suites (r16 chat specs migrated w/ citations)
  - Test Plan — Backend/API: none · UI/E2E: TASK1 staged-flow assertions
  - Touches: `client/src/screens/Workbench.jsx` (chat renderers), `tests/ui/r30s2_chat.spec.js`
  - Story Dependencies: R30S2E1-US1 (chrome/layout)
  - DoD: story spec + full regression green · PAR-1: chat frames flip ✅

#### Epic R30S2E3 — Center states (start/empty/building · canvas · section-select)
Mockup: `Create Workbench.dc.html` center frames · PRD: ch11 states + §5.1/§5.2 formatting · Current: R16 build view; snake_case section titles (`Timeseries Ci` fallback at BuildCanvas.jsx:162 — §5.1 leak)

- [ ] **R30S2E3-US1** — pre-canvas states: Start, Empty, Building (carried from R23S1E3-US1, split)
  - AC:
    - [ ] Start (640px): icon, h1 24, 2×2 template cards FORECAST/PREDICTIVE/VARIANCE/ANOMALY, source picker + sample-data + field-picker link, RECENT PROMPTS
    - [ ] Empty: ghost 3×64 grid + caption
    - [ ] Building: header + run meta + SKIP TO RESULT pill; 9 exact stage chips ×3 pill states (done ✓ / active spinner / pending); amber PII notice banner; live event log card w/ mono timestamps + collapsed technical detail expandable (admin-only affordance per PRD §5.1 rule 6)
    - [ ] State machine driven by real session status (existing SSE), cumulative chat reveals; states mutually exclusive
  - Tasks — Backend/API: N/A — consumes existing endpoints (no contract change)
  - Tasks — UI/E2E:
    - [ ] TASK1 RED: `tests/ui/r30s2_states.spec.js` — state-by-state over a routed real run (SKIP works in demo); stage-chip tri-state; PII banner; event log anatomy; admin-only collapse hidden for viewer (role test)
    - [ ] TASK2 Implement in `Workbench.jsx` + split state components
    - [ ] TASK3 parityShots per state → TASK4 gate: full suites
  - Test Plan — Backend/API: none · UI/E2E: TASK1 per-state assertions
  - Touches: `client/src/screens/Workbench.jsx`, `client/src/components/BuildCanvas.jsx`, `tests/ui/r30s2_states.spec.js`
  - Story Dependencies: R30S2E1-US1, R30S2E2-US1 (chat reveals)
  - DoD: story spec + full regression green · PAR-1: start/empty/building frames flip ✅
- [ ] **R30S2E3-US2** — canvas state (carried from R23S1E3-US1, split)
  - AC:
    - [ ] Toolbar h44: zoom/fit/present/device-view/refresh/export/download/share/comment/lineage/audit icons + mono `v{n} · saved` + stacked presence avatars
    - [ ] Filters bar h40: FILTERS label, removable filter chips, `+ Add`
    - [ ] Human formatting everywhere (PRD §5.1/§5.2): NO snake_case section titles — the `Timeseries Ci` fallback (BuildCanvas.jsx:162) is killed; humanized titles from layout metadata; KPI cards gain colored context caption lines; currency/percent formatting per §5.2
    - [ ] Chart anatomy: CI band polygon, today divider line, legend; dashed skeleton sections pre-approval
    - [ ] 4 KPI + `1.6fr 1fr` chart grids; at-risk table exact fr template w/ GAP column colored + RISK pills; "What's driving the forecast" driver bars + model card link; editable narrative card
  - Tasks — Backend/API: N/A — consumes existing endpoints (no contract change)
  - Tasks — UI/E2E:
    - [ ] TASK1 RED: `tests/ui/r30s2_canvas.spec.js` — toolbar/filter-bar anatomy; humanized titles ("Timeseries Ci" absent from DOM); KPI context lines; CI band + today divider + legend nodes; at-risk table + RISK pills; driver bars + model-card link; narrative editable
    - [ ] TASK2 Rebuild `BuildCanvas.jsx` sections (toolbar/filters/sections/table/drivers/narrative)
    - [ ] TASK3 parityShot `workbench-canvas` → TASK4 gate: full suites
  - Test Plan — Backend/API: none · UI/E2E: TASK1 assertions
  - Touches: `client/src/components/BuildCanvas.jsx`, `client/src/screens/Workbench.jsx`, `tests/ui/r30s2_canvas.spec.js`
  - Story Dependencies: R30S2E3-US1
  - DoD: story spec + full regression green · PAR-1: canvas frame flips ✅ · leak ledger: BuildCanvas.jsx:162 entry closed
- [ ] **R30S2E3-US3** — canvas section select (carried from R23S1E3-US2)
  - AC:
    - [ ] Click a section → 2px accent outline + blue shadow; floating dark context toolbar (Rename · Bar ▾ · Top 8 · −/+ vs target · Week ▾ · ⠿ drag handle)
    - [ ] Selection binds the Inspector Design tab (SELECTED chip updates — contract with R30S2E4)
  - Tasks — Backend/API: N/A — consumes existing endpoints (no contract change)
  - Tasks — UI/E2E:
    - [ ] TASK1 RED: click→outline+toolbar; inspector SELECTED chip updates; toolbar actions round-trip via existing PATCH endpoints
    - [ ] TASK2 Implement selection state + floating toolbar → TASK3 gate: full suites
  - Test Plan — Backend/API: none · UI/E2E: TASK1 assertions
  - Touches: `client/src/components/BuildCanvas.jsx`, `client/src/components/Inspector.jsx`, `tests/ui/r30s2_canvas.spec.js` (same epic file — section-select cases appended)
  - Story Dependencies: R30S2E3-US2
  - DoD: story spec + full regression green

#### Epic R30S2E4 — Inspector Design tab + tab strip (tab-set ruling)
Mockup: `Create Workbench.dc.html` (canvas frame's inspector strip = AUTHORITY for the in-workbench tab set) + `Inspector Panels.dc.html` (each panel's contents) · PRD: ch11 lists Design·Data·Pipeline·Lineage·Model·Comments·Share; ch12 lists Design·Data·Filters·Pipeline·Lineage·Model — the chapters CONFLICT · Current: `Inspector.jsx` 6 tabs w/ strip overflow bug; "(§5.3)" spec citation at Inspector.jsx:69 (§5.1 leak)

- [ ] **R30S2E4-US1** — Design tab + strip (carried from R23S1E4-US1, **AMENDED: ruling first**)
  - AC:
    - [ ] **Amendment (tab-set ruling):** FIRST task — open both mockup files; the `Create Workbench.dc.html` canvas frame's inspector strip is the authority for the in-workbench tab set; `Inspector Panels.dc.html` frames define each panel's contents; record the ruled tab set + order in this story's Agent Notes BEFORE writing the RED test; the RED test asserts the ruled set
    - [ ] Tab-strip overflow bug fixed (all tabs visible/reachable at 330px inspector width); Versions is NOT a tab — it moved to the session topbar (R30S2E1)
    - [ ] Design tab: SELECTED chip row (bound to canvas selection); Title input; Metric/Dimension mono dropdowns; 6-tile chart-type picker; time grain select; compare toggle; validation pills (CONTRACT PASSED / SQL VALIDATED); "Why this chart?" plain-English expandable — the "(§5.3)" citation is REMOVED (leak ledger entry closed); REPLACE WITH… cards grid
    - [ ] Controls round-trip via existing PATCH endpoints — semantic edits re-render the canvas through validated assembly (R16S2E4 path)
  - Tasks — Backend/API: N/A — consumes existing endpoints (no contract change)
  - Tasks — UI/E2E:
    - [ ] TASK1 Ruling: inspect both frames, record tab set in Agent Notes (pre-RED)
    - [ ] TASK2 RED: `tests/ui/r30s2_inspector_design.spec.js` — ruled tab order; no overflow (all tabs clickable); Design controls anatomy; round-trip re-render; "(§5.3)"/"§" citation absent from panel DOM
    - [ ] TASK3 Refit `Inspector.jsx` strip + Design tab
    - [ ] TASK4 Verification gate: full suites (r16 inspector specs migrated w/ citations)
  - Test Plan — Backend/API: none · UI/E2E: TASK2 assertions
  - Touches: `client/src/components/Inspector.jsx`, `tests/ui/r30s2_inspector_design.spec.js`
  - Story Dependencies: R30S2E3-US3 (selection binding)
  - DoD: story spec + full regression green · PAR-1: inspector Design frame flips ✅ · leak ledger: Inspector.jsx:69 entry closed

### Sprint R30S3 — Inspector panels & overlays (PRD ch12)
**Sprint Goal:** every inspector surface = its panel frame; the §5.1 vocabulary gate turns on at sprint close.
#### Sprint Completion Checklist
- [ ] 8 stories complete · full regression green (recorded) · wizard retirement done · forbidden-vocabulary suite GATING from this close onward

#### Epic R30S3E1 — Data trust contracts panel
Mockup: `Inspector Panels.dc.html` data frame · PRD: ch12 data tab (+ §5.2 expected bands) · Current: Inspector Data tab renders raw contract dump

- [ ] **R30S3E1-US1** — Data/Trust tab at parity (carried from R23S2E1-US1)
  - AC:
    - [ ] Accordion per component with HUMAN names + chart-type subtitle (no snake_case ids); PASSED / 1 WARNING pills per accordion
    - [ ] Expanded: Row count / Nulls / Range / Freshness rows with expected bands per §5.2 (`546 (exp 500–600)`); warning card amber border + `#fdf9ef` header tint
    - [ ] Gates render as a styled row (named gates + status pills) — the raw `gate:PASS` dump is REMOVED (§5.1)
  - Tasks — Backend/API:
    - [ ] TASK1 contract-lock test on `/pipeline/:run/contracts` fields consumed (tests/test_r30s3_panels.py; no contract change expected — lock only)
  - Tasks — UI/E2E:
    - [ ] TASK2 RED: `tests/ui/r30s3_datatrust.spec.js` — accordion anatomy; human names; expected-band format; warning tint; no `gate:` dump text in DOM
    - [ ] TASK3 Implement over contracts API (R17S1E1) → TASK4 gate: full suites
  - Test Plan — Backend/API: contract lock · UI/E2E: TASK2 assertions
  - Touches: `client/src/components/Inspector.jsx`, `tests/test_r30s3_panels.py`, `tests/ui/r30s3_datatrust.spec.js`
  - Story Dependencies: R30S2E4-US1 (tab strip)
  - DoD: story spec + full regression green · PAR-1: data panel frame flips ✅
#### Epic R30S3E2 — Pipeline audit panel
Mockup: `Inspector Panels.dc.html` pipeline frame · PRD: ch12 pipeline tab (§5.1 human stage names) · Current: raw step list w/ pipeline step ids

- [ ] **R30S3E2-US1** — Pipeline tab at parity (carried from R23S2E2-US1)
  - AC:
    - [ ] Header "RUN nnnn · 9 STAGES · mm:ss" + ALL GATES ✓ pill
    - [ ] Stage cards: ✓ circle, HUMAN stage names (no `gold_build`/`walk_forward`), duration, repair counts (`!` repaired variant); expandable detail Input/Gate/Output; dark mono block ADMIN-ONLY (role-gated now; flips to technical-detail toggle in R36S3E2 — cite); Fork from here action
  - Tasks — Backend/API: N/A — consumes existing endpoints (no contract change)
  - Tasks — UI/E2E:
    - [ ] TASK1 RED: `tests/ui/r30s3_pipeline.spec.js` — header/pill; human names (step-id strings absent); repaired variant; admin block hidden for viewer (role test); Fork triggers existing fork API
    - [ ] TASK2 Implement → TASK3 gate: full suites
  - Test Plan — UI/E2E: TASK1 assertions
  - Touches: `client/src/components/Inspector.jsx`, `tests/ui/r30s3_pipeline.spec.js`
  - Story Dependencies: R30S2E4-US1
  - DoD: story spec + full regression green · PAR-1: pipeline panel frame flips ✅
#### Epic R30S3E3 — Insights panel
Mockup: `Inspector Panels.dc.html` insights frame · PRD: ch12 insights tab · Current: plain list over insights API

- [ ] **R30S3E3-US1** — Insights panel at parity (carried from R23S2E3-US1)
  - AC:
    - [ ] Header "Insights · auto-detected n"; cards with tinted icon tiles + category color per type chip ANOMALY/TREND/CORRELATION; mono CONF pills; rich finding copy w/ bold numbers; Investigate primary per card → seeds a chat follow-up
  - Tasks — Backend/API: N/A — consumes existing insights API (R7/R12)
  - Tasks — UI/E2E:
    - [ ] TASK1 RED: `tests/ui/r30s3_insights.spec.js` — header count; tile tints/category colors; CONF pill; bolded numbers present; Investigate posts into the chat thread
    - [ ] TASK2 Implement → TASK3 gate: full suites
  - Test Plan — UI/E2E: TASK1 assertions
  - Touches: `client/src/components/Inspector.jsx`, `tests/ui/r30s3_insights.spec.js`
  - Story Dependencies: R30S2E2-US1 (chat seeding)
  - DoD: story spec + full regression green · PAR-1: insights panel frame flips ✅
#### Epic R30S3E4 — Share modal (canonical)
Mockup: `Inspector Panels.dc.html` + `Artifact Sharing.dc.html` share frame · PRD: ch12 share modal · Current: link-only Share tab (R16)

- [ ] **R30S3E4-US1** — 520px share modal (carried from R23S2E4-US1)
  - AC:
    - [ ] VISIBILITY radio-cards Private / Workspace view / Workspace edit / Public signed link (selected style per frame); token URL bar + Copy
    - [ ] DISTRIBUTE 7-tile grid: Embed → embed preview (R33S2E2; until then routes to existing embed settings), HTML, PDF, PNG, Slack, Email, Link
    - [ ] Advanced: Expires + Scope selects, Password toggle, Allow comments/drill/export checkboxes, red Revoke
    - [ ] Opens from workbench topbar, artifact detail, and canvas toolbar; public link round-trips to `/share/:token`; revoke → 410
  - Tasks — Backend/API: N/A — share links API exists (R7S1E1, R19/R20 exports)
  - Tasks — UI/E2E:
    - [ ] TASK1 RED: `tests/ui/r30s3_share.spec.js` — modal anatomy ×3 open points; round-trip; revoke 410
    - [ ] TASK2 Build `components/ShareModal.jsx`, swap the three triggers → TASK3 gate: full suites
  - Test Plan — UI/E2E: TASK1 assertions
  - Touches: `client/src/components/ShareModal.jsx` (new), `client/src/components/Inspector.jsx`, `client/src/screens/Workbench.jsx`, `client/src/screens/ArtifactDetail.jsx`, `tests/ui/r30s3_share.spec.js`
  - Story Dependencies: R30S1E4-US1, R30S2E1-US1 (triggers exist)
  - DoD: story spec + full regression green · PAR-1: share modal frame flips ✅
#### Epic R30S3E5 — Version history panel
Mockup: `Inspector Panels.dc.html` versions frame · PRD: ch12 versions (§5.1 ref-hash kill) · Current: Versions tab w/ UAS refs incl. hashes (`session_spec v1 233df9cf` style)

- [ ] **R30S3E5-US1** — versions timeline (carried from R23S2E5-US1)
  - AC:
    - [ ] Opens from the session TOPBAR Versions button (R30S2E1), not a tab; timeline rows: avatar + connector line, `v{n} · current` + time, quoted change summary, dependency chips `sem v12 · gov v8 · model rev_loc_v2`, Restore/Compare actions
    - [ ] Ref-hash leak REMOVED: no content-hash strings user-visible (§5.1)
  - Tasks — Backend/API: N/A — consumes existing UAS versions endpoint
  - Tasks — UI/E2E:
    - [ ] TASK1 RED: `tests/ui/r30s3_versions.spec.js` — topbar-opened; row anatomy + dependency chips; restore triggers existing flow; no 8-hex-hash pattern in DOM
    - [ ] TASK2 Implement p