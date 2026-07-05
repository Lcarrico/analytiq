# AGENTS.md

This file provides guidance to coding agents (Codex, Claude Code, and similar) when working with code in this repository. It mirrors CLAUDE.md — keep the two in sync.

## Commands

```bash
# Install dependencies (first time only)
pip install -r server/requirements.txt   # Flask API + test deps (pytest)
npm install                              # root: concurrently, eslint, Playwright
npm install --workspace=client           # React + Vite + Recharts + react-router

# Development — run the two servers INDEPENDENTLY (preferred: lets you
# restart Flask without killing Vite, and vice versa)
python server/app.py                     # terminal 1 — Flask API on :3001
npm run dev:client                       # terminal 2 — Vite dev server on :5173

npm run dev                              # or: both at once via concurrently
npm run dev:server:win                   # Windows helper (uses .venv\Scripts\python.exe)

# Build client for production (required before running UI tests)
npm run build

# Backend tests (fresh temp SQLite DB per test; logs in tests/logs/, gitignored)
python -m pytest tests/                  # full regression (~440 tests)
python -m pytest tests/test_sprint3.py   # one file

# UI tests (Playwright/chromium against the BUILT client, served by
# tests/ui/boot_server.py on :3111 — always `npm run build` first)
npx playwright install chromium          # once
npm run test:ui                          # full suite (~150 tests)
npx playwright test r32s2_semantic       # one spec (native checkouts)

# Reset database (schema recreated + demo data reseeded on next start)
rm analytiq.db analytiq.db-shm analytiq.db-wal
```

## Architecture

**Stack:** React 18 + Vite (client) | Flask + SQLite (server) | Server-Sent Events for real-time progress

### Request flow

Vite proxies `/api/*` to `http://localhost:3001` in dev. The client calls the Flask API via `client/src/api.js`, which wraps every endpoint. Demo auth: requests default to an admin identity; role gating exists in the UI (`components/roles.jsx`) and via `@require_role` on the server.

### Frontend: react-router routes

`client/src/App.jsx` declares the routes. Standalone (no shell): `/login`, `/register`, `/forgot-password`, `/verify-email`, `/sso/callback`, `/onboarding/*`, `/` marketing pages, `/share/:token` public viewer. Inside the `Shell` layout under `/app`: Home, `create/:sessionId` (Workbench — the ask→plan→build→canvas loop), `artifacts` + `artifacts/:id`, `activity`, `governance` (+ `review`, `review/:id`, `rules`, `lineage`, `manifests`, `preaggregations`), `semantic` (+ `explores`, `explores/:name`, `metrics`, `metrics/:name`, `dimensions`, `field-picker`, `joins`, `derived-tables`), `gold`, `team`, `billing`.

A legacy wizard remnant lives behind `ScreenAt` (`client/src/routes.js` maps paths → screen numbers): S02 Connect, S03 Governance run, S04 Table health, plus S11 Account / S12 Platform / S14 Models until R35/R36 replace them. `context.jsx` (`useApp`) mirrors the active screen number and carries cross-screen ids (`connectionId`, `runId`, `sessionId`, …). Retired screens (S05–S10, S13) are tombstoned files — the mount used for agent development blocks file deletion; see the adaptation ledger in PROGRESS.md.

### Styling

No CSS framework; all styles are inline JS objects. Design tokens live in `client/src/tokens.js` (PRD palette `P`, legacy `C`, fonts `FONT`/`MONO`). Shared primitives (`Btn`, `Badge`, `Card`, `PageHeader`, `Toggle`, `Checkbox`, `Spinner`, `Sparkline`, `Avatar`, …) live in `client/src/components/ui.jsx`. PRD §5.1 bans internal vocabulary in user-visible UI (snake_case ids, gate dumps, hashes, § citations) — enforced by `tests/ui/r30s3_vocab.spec.js`, which scans client source and must stay green; §5.6 allows technical detail only behind explicit admin affordances.

### Backend: single-file routes + domain modules

`server/app.py` (~8.9k lines) holds the schema, routes, and orchestration. Key helpers: `get_db()` (per-request pooled connection), `thread_db()`/`put_db()` (background threads), `one()`/`many()`/`execute()` (no ORM). `init_db()` creates tables (`CREATE TABLE IF NOT EXISTS` + idempotent `ALTER` migrations) and seeds demo data on first launch.

Domain logic lives in ~45 sibling modules — the load-bearing ones: `warehouse.py` (dialect-aware source SQL), `profiler.py`, `pii.py`, `dq.py` (health scoring + settings-aware DQ gate engine), `manifest.py` (versioned governance manifests), `semantic_layer.py` (cube schema builder/validator/semver), `governance_review.py` (evidence-ranked triage), `planner.py` (session planner), `modeler.py` + `splits.py` (gold tables, grain/fan-out/leakage, temporal splits), `feature_manifest.py`, `training.py` (trials, walk-forward backtest, model cards), `artifact_gen.py` (self-contained HTML artifacts + validator), `activity.py` (activity feed projection), `narrative.py`, `knowledge_graph.py`, `feedback_loop.py`.

### Real-time simulation (SSE)

Governance and pipeline runs execute in background daemon threads (`simulate_governance`, `simulate_pipeline`), broadcasting to SSE clients through in-memory `Queue` registries. The client listens with `EventSource`. Simulation timing scales with `SIM_DELAY_SCALE` (tests set it near zero).

### Database

SQLite (default `analytiq.db` at repo root; override with `DATABASE_PATH`), WAL mode, schema inline at the top of `app.py`. 40+ tables covering connections/governance (`governance_runs`, `cataloged_tables`, `semantic_definitions`, `governance_manifests`, `dq_rule_settings`, `dq_custom_tests`, `dq_gate_results`, `freshness_slas`, `data_contracts`), the semantic layer (`semantic_schemas`, `semantic_proposals`, `pdts`), sessions/pipeline (`sessions`, `session_specs`, `pipeline_runs`, `gold_tables`, `feature_manifests` — immutable via trigger), models (`training_jobs`, `model_trials`, `model_cards`, `model_registry`), artifacts (`artifacts`, `artifact_files`, `artifact_shares`, `artifact_schedules`, `chart_data`, `comments`), and platform (`audit_logs` — append-only via triggers, `alerts`, `service_logs`, `subscriptions`, `users`).

Chart data uses a deterministic seeded RNG (`seeded_rng(42)`) mirrored in JS for consistent values. The platform must boot with zero API keys: `/api/platform/status` reports all 8 services (auth/cache/email/logging/queue/search/secrets/storage) in `local` mode.

### Testing

Backend tests in `tests/` (`test_sprint*.py` + `test_r*.py` per program story). `tests/conftest.py` gives each test a fresh temp-file SQLite DB, a Flask test client, near-zero simulation delays, and mirrors results to timestamped logs in `tests/logs/` (gitignored). UI tests in `tests/ui/*.spec.js` run via Playwright against the built client (`playwright.config.mjs`, boot server on :3111). Both suites are expected 100% green after every story — see the program discipline below.

### Program tracking (spec-driven development)

`RELEASE_PLAN.md` is the Release → Sprint → Epic → Story tree for the active "UI Parity & Build-Out Program (PRD v1.0)" (R30–R36, 64 stories; R30–R32 closed, 32/64 done). `PROGRESS.md` mirrors it one line per story with suite counts, holds the **Current position** pointer, session stop notes, and the environment adaptation ledger. Every story: RED test first → implement → full backend + UI regression → tick both files → commit. The PRD package lives in `specs/prd-package/`; mockup frames (the visual authority) in `docs/specs/mockups/*.dc.html`.
