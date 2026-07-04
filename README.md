# AnalytIQ MVP

Full-stack agentic analytics platform. Ask a business question in plain English → get a backtested, governed, shareable predictive dashboard.

## Stack

| Layer    | Tech                                                  |
|----------|-------------------------------------------------------|
| Frontend | React 18 + Vite 5 + Recharts                          |
| Backend  | Python / Flask                                        |
| Database | PostgreSQL via `psycopg2` (connection pool)            |
| Realtime | Server-Sent Events (SSE) for live progress            |

## Prerequisites

- Python ≥ 3.10
- Node.js ≥ 18 + npm ≥ 9
- PostgreSQL ≥ 14

## Quick start

```bash
# 0. Create the PostgreSQL database
createdb analytiq_dev

# 1. Python dependencies
pip install -r server/requirements.txt

# 2. Node dependencies (React + Vite + Recharts)
npm install                        # root (installs concurrently)
npm install --workspace=client     # React + Vite + Recharts

# 3. Start both servers
npm run dev
```

Open **http://localhost:5173**

- Python API runs on **:3001**
- Vite dev server on **:5173** (proxies `/api/*` to Flask automatically)

## Or run servers individually

```bash
# Terminal 1
python server/app.py

# Terminal 2
npm run dev --workspace=client
```

## Demo data

On first launch Flask auto-seeds the database with:
- 1 Snowflake connection
- 1 completed governance run (47 tables, 183 definitions)
- 3 workspace artifacts (the first has full chart data)

Navigate to any screen immediately — no need to run the full flow first.

## Full user flow

```
Screen 01  Workspace home       → "Start your first analysis"
Screen 02  Connect data source  → pick Snowflake, enter credentials
Screen 03  Governance run       → live SSE progress (4 steps)
Screen 04  Table health         → DQ gate badges, health bars
Screen 05  Semantic review      → accept / edit / reject definitions
Screen 06  Conversational       → chat + metric cards + sparklines
Screen 07  Spec confirmation    → plain-English summary before run
Screen 08  Pipeline execution   → live SSE log (4 steps + log lines)
Screen 09  Dashboard artifact ★ → KPI row + CI chart + lineage footer
Screen 10  Artifact list        → share modal (Viewer / Editor / Owner)
```

## API reference

| Method | Path                           | Description                    |
|--------|--------------------------------|--------------------------------|
| GET    | /api/health                    | Health check                   |
| GET    | /api/connections               | List connections               |
| POST   | /api/connections               | Create connection              |
| POST   | /api/governance/run            | Start governance (→ SSE runId) |
| GET    | /api/governance/stream/:id     | SSE progress stream            |
| GET    | /api/governance/:id            | Get run state                  |
| GET    | /api/tables/:runId             | Cataloged tables               |
| GET    | /api/semantic/:runId           | Semantic definitions           |
| PATCH  | /api/semantic/:id              | Accept / edit / reject         |
| POST   | /api/sessions                  | Create analysis session        |
| POST   | /api/pipeline/run              | Start pipeline (→ SSE runId)   |
| GET    | /api/pipeline/stream/:id       | SSE progress + log stream      |
| GET    | /api/pipeline/:id              | Get run state                  |
| GET    | /api/artifacts                 | List artifacts                 |
| POST   | /api/artifacts                 | Save artifact                  |
| GET    | /api/artifacts/:id/chart       | Chart data + KPIs              |
| GET    | /api/artifacts/:id/shares      | List shares                    |
| POST   | /api/artifacts/:id/shares      | Add share                      |
| DELETE | /api/artifacts/:id/shares/:sid | Remove share                   |

## Database

PostgreSQL database: `analytiq_dev` (default).
Set `DATABASE_URL` to override (e.g. `postgresql://user:pass@host/db`).

To reset to demo data, drop and recreate the database:

```bash
dropdb analytiq_dev
createdb analytiq_dev
python server/app.py   # re-seeds on next start
```

## Docker deployment

```bash
docker compose up --build
```

Open **http://localhost** — nginx serves the client and proxies `/api/*` to Flask.

To stop and remove containers:

```bash
docker compose down
```

To also wipe the database volume:

```bash
docker compose down -v
```

## Environment

```bash
PORT=3001                                        # Flask port (default 3001)
DATABASE_URL=postgresql://localhost/analytiq_dev  # PostgreSQL DSN (default)
```
