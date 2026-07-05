# AnalytIQ — Claude Code Prompts (status ledger)

This file started as an ordered backlog of self-contained build prompts. Most have
since shipped through the sprint/release programs tracked in `RELEASE_PLAN.md` and
`PROGRESS.md`, so it now serves as a **status ledger**. The original prompt texts
are archived in `docs/archive/prompts/` (`p05`–`p15`) for reference.

| # | Prompt | Status | Where it landed |
|---|--------|--------|-----------------|
| 1 | Real Snowflake connection & introspection | Partial | `server/warehouse.py` is the dialect-aware source layer; PostgreSQL sources introspect for real (`_introspect_postgres`), Snowflake/BigQuery connectors validate + fall back to the deterministic simulation. |
| 2 | LLM-powered semantic definition extraction | Superseded | The semantic layer is deterministic by design: builder + validator in `server/semantic_layer.py`, human review queue + definition diff (R32S1), evolution proposals with admin decisions (R10S2/R32S2). No LLM calls in the product. |
| 3 | Real ML pipeline execution | Shipped (simulated compute) | `server/modeler.py`, `splits.py`, `training.py` — gold tables with grain/fan-out/leakage checks, temporal splits, trials, walk-forward backtests, model cards, registry + champion promotion. Deterministic engines rather than real training jobs. |
| 4 | Multi-tenancy — org isolation | Not started | Single-workspace demo; roles exist (admin/analyst/viewer) but no org scoping. Revisit after the R30–R36 program. |
| 5 | Migrate SQLite → PostgreSQL | Rolled back / not planned | The app runs SQLite (WAL) via `DATABASE_PATH`. PostgreSQL remains supported as a **source connector**, not as the app database. |
| 6 | Encrypted credential storage | Shipped | Fernet encryption at rest (`CREDENTIAL_ENCRYPTION_KEY`), `server/secrets_store.py`. |
| 7 | Rate limiting | Shipped | `flask-limiter` on sensitive endpoints; Redis storage when `REDIS_URL` is set, in-memory otherwise. |
| 8 | Email notifications | Shipped | `server/email_service.py` via Resend; logs to stdout when `RESEND_API_KEY` is unset (zero-key boot). |
| 9 | Audit logging | Shipped | `audit_logs` table, append-only via triggers; `log_action()` used across every mutating endpoint; surfaced in Activity + admin views. |
| 10 | Stripe billing integration | Shipped | Billing endpoints + `subscriptions` table; UI at `/app/billing`. Requires Stripe keys to go live. |
| 11 | Docker & deployment config | Shipped | `server/Dockerfile` (gunicorn), `client/Dockerfile` (nginx), `docker-compose.yml` (SQLite volume). |
| 12 | Artifact scheduling & auto-refresh | Shipped | `artifact_schedules` + croniter; schedule surfaces in the artifact library. |
| 13 | Export & download | Partial | Self-contained HTML artifacts download/share today; PDF/PNG/Slack/Email tiles are honestly disabled and owned by R33S2 (sharing formats). |
| 14 | Additional data connectors | Partial | Snowflake, PostgreSQL, BigQuery, CSV upload paths in `warehouse.py`; more connectors deferred. |
| 15 | Search, filter & pagination on artifacts | Shipped | Library rail filters, search index (`server/search.py`), table view + pagination (R30S1). |

**Adding new work:** don't append prompts here — add stories to `RELEASE_PLAN.md`
(the active program runs R33–R36) and let the TDD loop in `PROGRESS.md` track them.
