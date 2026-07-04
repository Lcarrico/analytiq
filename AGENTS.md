# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Commands

```bash
# Install dependencies (first time only)
pip install -r server/requirements.txt
npm install                        # installs concurrently at root
npm install --workspace=client     # installs React + Vite + Recharts

# Run both servers together
npm run dev

# Run individually
python server/app.py               # Flask API on :3001
npm run dev --workspace=client     # Vite dev server on :5173

# Build client for production
npm run build

# Run backend tests (fresh temp SQLite DB per test; logs in tests/logs/)
python -m pytest tests/                 # full regression
python -m pytest tests/test_sprintN.py  # one sprint

# Reset database (schema recreated on next start)
rm analytiq.db analytiq.db-shm analytiq.db-wal
```

## Architecture

**Stack:** React 18 + Vite (client) | Flask + SQLite (server) | Server-Sent Events for real-time progress

### Request flow

Vite proxies `/api/*` to `http://localhost:3001` in dev. The client calls the Flask API via `client/src/api.js`, which wraps all endpoints. No auth layer exists — this is a demo/MVP.

### Frontend: screen-based navigation (no router)

The app is a 10-screen wizard. Navigation state lives in `client/src/context.jsx` (`AppProvider`), which holds:
- `screen` (1–10) — which screen is shown
- `connectionId`, `runId` (governance), `sessionId`, `pipelineRunId`, `artifactId` — IDs carried across screens

`App.jsx` renders the active screen component from the `SCREENS` map. Screens navigate by calling `nav(n)` or `update({ screen: n, someId: x })` from `useApp()`.

Screens follow the user flow:
```
S01 Home → S02 Connect → S03 Governance (SSE) → S04 Table Health
→ S05 Semantic Review → S06 Analysis Chat → S07 Confirm
→ S08 Pipeline (SSE) → S09 Dashboard → S10 Artifacts
```

### Styling

No CSS framework. All styles are inline JavaScript objects. Design tokens are in `client/src/tokens.js` (colors as `C`, fonts as `FONT`/`MONO`). Shared UI primitives (`Badge`, `Btn`, `Card`, `PageHeader`, `Steps`, `Spinner`, `Sparkline`, `HealthBar`, `GateDot`) live in `client/src/components/ui.jsx`.

### Backend: single-file Flask app

All backend logic is in `server/app.py`. Key patterns:
- `get_db()` — per-request connection from pool via Flask `g`
- `thread_db()` — connection from pool for background threads (governance/pipeline simulations)
- `put_db()` — return connection to pool (used by background threads)
- `one()`, `many()`, `execute()` — thin query helpers; no ORM
- `init_db()` auto-seeds demo data on first launch if the DB is empty

### Real-time simulation (SSE)

Governance and pipeline runs are simulated in background daemon threads (`simulate_governance`, `simulate_pipeline`). Progress is broadcast to SSE clients via in-memory `Queue` registries (`_gov_clients`, `_pipe_clients`). The client opens an `EventSource` connection and listens for step/status updates.

### Database

SQLite database (default: `analytiq.db` at repo root, override via `DATABASE_PATH` env var). Connections via `sqlite3` with WAL mode. Schema is defined inline in `SCHEMA` (top of `app.py`) and created via `CREATE TABLE IF NOT EXISTS` on startup. Tables: `connections`, `governance_runs`, `cataloged_tables`, `semantic_definitions`, `governance_manifests`, `ingestion_profiles`, `semantic_schemas`, `session_specs`, `sessions`, `gold_tables`, `feature_manifests` (immutable via trigger), `training_jobs`, `model_cards`, `model_trials`, `model_registry`, `pipeline_runs`, `artifacts`, `artifact_files`, `artifact_shares`, `artifact_schedules`, `chart_data`, `dq_gate_results`, `subscriptions`, `audit_logs` (append-only via triggers).

### Server modules

`server/app.py` holds routes and orchestration. Domain logic lives in sibling modules: `warehouse.py` (dialect-aware SQL layer), `profiler.py` (ingestion column profiling), `pii.py` (PII detection), `dq.py` (health scoring + DQ gate engine), `manifest.py` (versioned governance manifests), `semantic_layer.py` (cube schema builder/validator/semver), `planner.py` (session planner agent), `modeler.py` + `splits.py` (gold table generation, grain/fan-out/leakage checks, temporal splits), `feature_manifest.py`, `training.py` (trials, walk-forward backtest, model cards), `artifact_gen.py` (self-contained HTML artifacts + validator).

### Testing

Backend tests live in `tests/` (`test_sprint1.py` … `test_sprint13.py`, one file per roadmap sprint). `tests/conftest.py` gives each test a fresh temp-file SQLite DB (never `analytiq.db`), a Flask test client, and mirrors results to timestamped logs in `tests/logs/`. Simulation delays are monkeypatched near-zero. Frontend tests are intentionally not included.

Chart data uses a deterministic seeded RNG (`seeded_rng(42)`) that mirrors the JS implementation for consistent values.
