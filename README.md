# AnalytIQ MVP

A full-stack agentic analytics platform. Ask a business question in plain English → get a backtested, governed, shareable predictive dashboard — no SQL, no Python.

## Stack

| Layer    | Tech                                              |
|----------|---------------------------------------------------|
| Frontend | React 18 + Vite 5 + Recharts                      |
| Backend  | Express.js 4                                      |
| Database | SQLite via `better-sqlite3` (local file, no setup)|
| Realtime | Server-Sent Events (SSE) for live progress        |

## Prerequisites

- Node.js ≥ 18
- npm ≥ 9
- Python / node-gyp (for native `better-sqlite3` compilation)
  - **macOS**: `xcode-select --install`
  - **Windows**: `npm install -g windows-build-tools` (as admin)
  - **Ubuntu/Debian**: `sudo apt install build-essential python3`

## Quick start

```bash
# 1. Install all dependencies
npm install                          # root (installs concurrently)
npm install --workspace=server       # Express + better-sqlite3
npm install --workspace=client       # React + Vite + Recharts

# 2. Start both servers (hot-reload enabled)
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

The server starts on **:3001** and the Vite dev server on **:5173**  
(Vite proxies all `/api/*` requests to the Express server).

## Environment variables (optional)

Copy `.env.example` to `server/.env`:

```
PORT=3001
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

## Demo data

On first launch the server seeds demo data automatically:

- 1 Snowflake connection
- 1 completed governance run (47 tables, 183 definitions)
- 3 workspace artifacts (with chart data for the first)

This lets you jump to any screen immediately without going through the full flow.

## Full user flow

```
Screen 01  Workspace home       → "Start your first analysis"
Screen 02  Connect data source  → pick Snowflake, enter credentials
Screen 03  Governance run       → live SSE progress (4 steps)
Screen 04  Table health         → DQ gate badges, health bars
Screen 05  Semantic review      → accept / edit / reject definitions
Screen 06  Conversational       → chat + metric cards + sparklines
Screen 07  Spec confirmation    → plain-English summary before run
Screen 08  Pipeline execution   → live SSE log (4 steps, real log lines)
Screen 09  Dashboard artifact ★ → KPI row + CI chart + lineage footer
Screen 10  Artifact list        → share modal (Viewer / Editor / Owner)
```

## API reference

| Method | Path                            | Description                      |
|--------|---------------------------------|----------------------------------|
| GET    | /api/health                     | Health check                     |
| GET    | /api/connections                | List connections                 |
| POST   | /api/connections                | Create connection                |
| POST   | /api/governance/run             | Start governance (→ SSE runId)   |
| GET    | /api/governance/stream/:id      | SSE progress stream              |
| GET    | /api/governance/:id             | Get run state                    |
| GET    | /api/tables/:runId              | Cataloged tables                 |
| GET    | /api/semantic/:runId            | Semantic definitions             |
| PATCH  | /api/semantic/:id               | Accept / edit / reject           |
| POST   | /api/sessions                   | Create analysis session          |
| POST   | /api/pipeline/run               | Start pipeline (→ SSE runId)     |
| GET    | /api/pipeline/stream/:id        | SSE progress + log stream        |
| GET    | /api/pipeline/:id               | Get run state                    |
| GET    | /api/artifacts                  | List artifacts                   |
| POST   | /api/artifacts                  | Save artifact                    |
| GET    | /api/artifacts/:id/chart        | Chart data + KPIs                |
| GET    | /api/artifacts/:id/shares       | List shares                      |
| POST   | /api/artifacts/:id/shares       | Add share                        |
| DELETE | /api/artifacts/:id/shares/:sid  | Remove share                     |

## Database

SQLite file: `server/data/analytiq.db`  
Delete it and restart the server to reset to demo data.

## Troubleshooting

**`better-sqlite3` fails to compile**  
→ Run `npm rebuild better-sqlite3 --workspace=server`  
→ Or ensure Python + C++ build tools are installed (see Prerequisites)

**Port conflicts**  
→ Set `PORT=3002` in `server/.env` and update `vite.config.js` proxy target

**SSE not streaming**  
→ Ensure the Vite proxy config has `ws: false` and the browser supports EventSource
