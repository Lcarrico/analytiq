# AnalytIQ

Full-stack agentic analytics platform. Ask a business question in plain English → get a backtested, governed, shareable predictive dashboard.

| Layer     | Tech                                                        |
|-----------|-------------------------------------------------------------|
| Frontend  | React 18 + Vite 5 + Recharts + react-router (`client/`)     |
| Backend   | Python / Flask, single app + ~45 domain modules (`server/`) |
| Database  | **SQLite** (WAL) — zero setup, auto-created + demo-seeded   |
| Realtime  | Server-Sent Events for live governance/pipeline progress    |
| Tests     | pytest (~440 backend) + Playwright (~150 UI)                |

Everything runs locally with **no API keys and no external services** — email, auth,
queue, search, storage, etc. all boot in local mode.

---

## 1. First-time setup

Prerequisites: **Python ≥ 3.10**, **Node.js ≥ 18** (npm ≥ 9). No database server needed.

```bash
git clone <repo-url> analytiq
cd analytiq

# Python dependencies (a venv is recommended)
python -m venv .venv
# Windows:  .venv\Scripts\activate      macOS/Linux:  source .venv/bin/activate
pip install -r server/requirements.txt

# Node dependencies (root tooling + client workspace)
npm install
npm install --workspace=client
```

That's it. The SQLite database (`analytiq.db`) is created and seeded with demo data
(a connection, a completed governance run, sample artifacts) the first time the
server starts — you can click around every screen immediately.

## 2. Development — run the two servers independently

Use **two terminals** so you can restart the Flask server without killing Vite
(and vice versa). This is the recommended workflow:

```bash
# Terminal 1 — Flask API on http://localhost:3001
python server/app.py         # (activate the venv first)

# Terminal 2 — Vite dev server on http://localhost:5173
npm run dev:client
```

Open **http://localhost:5173**. Vite proxies `/api/*` to Flask automatically
(SSE streams included), and hot-reloads the client on every save. Restart
Terminal 1 whenever you change server code; the client keeps running.

Convenience alternatives:

```bash
npm run dev             # both servers in one terminal via concurrently
npm run dev:server      # just Flask, via npm (same as python server/app.py)
npm run dev:server:win  # Windows: uses .venv\Scripts\python.exe explicitly
start_dev.bat           # Windows double-click helper (runs npm run dev)
```

## 3. Testing

Both suites are kept at 100% green — run them before every push.

### Backend (pytest)

```bash
python -m pytest tests/                  # full regression (~440 tests, fast)
python -m pytest tests/test_sprint3.py   # a single file
python -m pytest tests/ -k "dq_rules"    # by keyword
```

Each test gets a **fresh temp-file SQLite DB** (never your `analytiq.db`), near-zero
simulation delays, and mirrors results into `tests/logs/` (gitignored).

### UI (Playwright)

The UI suite runs against the **built** client, served together with a fresh API by
`tests/ui/boot_server.py` on port 3111 — so always build first:

```bash
npx playwright install chromium    # once per machine
npm run build                      # REQUIRED before UI tests after client changes
npm run test:ui                    # full suite (~150 tests)
npx playwright test r32s2_semantic # a single spec file
```

Notes:
- Failure traces/screenshots land in `test-results/` (gitignored).
- `tests/ui/r30s3_vocab.spec.js` is a **source gate**: it scans `client/src` for
  banned internal vocabulary (snake_case ids, hashes, § citations, stray emoji) per
  PRD §5.1. If it fails after your change, fix the copy — don't edit the ledger
  without an owning story.

### Lint

```bash
npm run lint:tokens     # eslint over client/src (design-token discipline)
```

## 4. Building for production

```bash
npm run build           # → client/dist/ (self-contained static bundle)
```

Flask serves the API only; in production nginx (or any static host) serves
`client/dist/` and proxies `/api/*` to Flask. A ready-made setup exists:

```bash
docker compose up --build    # nginx on :80 + gunicorn API, SQLite on a volume
docker compose down          # stop (add -v to also wipe the database volume)
```

## 5. Everyday recipes

```bash
# Reset the database (schema + demo data recreated on next server start)
rm analytiq.db analytiq.db-shm analytiq.db-wal        # Windows: del analytiq.db*

# Slow down / speed up the simulated governance & pipeline runs
SIM_DELAY_SCALE=0 python server/app.py                 # instant (like tests)

# Point the server at a different database file
DATABASE_PATH=/tmp/scratch.db python server/app.py
```

Environment variables are **all optional** — copy `.env.example` to `.env` if you
want email (Resend), Stripe, Redis rate-limit storage, or credential encryption
keys. With nothing set, `/api/platform/status` reports all 8 platform services in
`local` mode and everything still works.

## 6. Project structure

```
analytiq/
├─ client/                 # React app (Vite)
│  └─ src/
│     ├─ App.jsx           # all routes (see CLAUDE.md for the route map)
│     ├─ api.js            # every API call goes through here
│     ├─ tokens.js         # design tokens (P palette, FONT/MONO)
│     ├─ components/       # ui.jsx kit, Shell, BuildCanvas, Inspector, …
│     └─ screens/          # one file per surface (Home, Workbench, Artifacts,
│                          #   Governance*, Semantic*, …; retired screens are
│                          #   tombstoned rather than deleted — see PROGRESS.md)
├─ server/
│  ├─ app.py               # schema + routes + orchestration (single file)
│  ├─ *.py                 # ~45 domain modules (dq, manifest, semantic_layer,
│  │                       #   modeler, training, artifact_gen, …)
│  └─ requirements.txt
├─ tests/
│  ├─ test_*.py            # backend suite (pytest, conftest gives fresh DBs)
│  └─ ui/*.spec.js         # Playwright suite + boot_server.py
├─ docs/
│  ├─ specs/mockups/       # *.dc.html frames — the visual source of truth
│  └─ archive/             # historical prompts, gap analyses, old spec docs
├─ specs/prd-package/      # the active PRD + supporting audit documents
├─ RELEASE_PLAN.md         # program tree: releases → sprints → epics → stories
├─ PROGRESS.md             # per-story progress, current position, stop notes
├─ CLAUDE.md / AGENTS.md   # deep architecture guide for humans + coding agents
└─ playwright.config.mjs
```

## 7. How this repo is being built (read before contributing)

Development follows a **spec-driven TDD program** ("UI Parity & Build-Out Program",
R30–R36, 64 stories — R30–R32 complete). The loop for every story:

1. Read the story in `RELEASE_PLAN.md` and its mockup frame in `docs/specs/mockups/`.
2. Write a failing test first (backend and/or UI spec).
3. Implement until green, then run **both full suites**.
4. Tick the story in `RELEASE_PLAN.md` + `PROGRESS.md` (with suite counts) and commit.

`PROGRESS.md` always says where work stopped and what's next — start there when
picking the project up. Honest-UI rule: features are never faked to pass tests;
unsupported affordances ship disabled with a tooltip naming the story that owns them.

## 8. Troubleshooting

- **Port already in use** — Flask holds :3001, Vite :5173, the UI-test server :3111.
  Kill strays (`npx kill-port 3001` or Task Manager) and rerun.
- **UI tests fail with stale-looking pages** — you changed the client but didn't
  rebuild. `npm run build`, then `npm run test:ui`.
- **`ModuleNotFoundError` starting the server** — the venv isn't active or deps
  are stale: `pip install -r server/requirements.txt`.
- **Weird `git status` after pulling** (hundreds of phantom changes) — this repo is
  sometimes driven through a synced mount by coding agents; run `git reset` (no
  flags) once to rebuild your local index. A few zero-byte scratch files
  (`t.spec.js`, `pw.config.mjs`, `_sync_probe.txt`) may linger on old checkouts —
  they're gitignored and safe to delete.
- **Database acting strange** — delete `analytiq.db*` and restart; it reseeds.
