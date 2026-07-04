# AnalytIQ — Claude Code Prompts

Ordered roughly by priority. Each prompt is self-contained and safe to run independently.

---

## 1. Real Snowflake connection & schema introspection

```
In server/app.py, replace the simulated governance run with a real Snowflake
introspection. When POST /api/governance/run is called:

1. Use the stored credentials (account, username, password, warehouse,
   database_name, schema_name) to open a real Snowflake connection via the
   snowflake-connector-python package.
2. Run SHOW TABLES IN SCHEMA <database>.<schema> to get the real table list.
3. For each table, query SHOW COLUMNS to get column metadata, then run a
   lightweight DQ scan:
   - SELECT COUNT(*) for row count
   - CHECK uniqueness on the first primary-key-like column (lowest null rate)
   - CHECK max(updated_at or equivalent) for freshness if the column exists
   - FLAG any column whose name contains 'email', 'ssn', 'phone', 'dob' as PII
4. Derive health_score (0–100) from the gate results.
5. Persist real rows into cataloged_tables, replacing the DEMO_TABLES seed.
6. Add snowflake-connector-python to server/requirements.txt.
7. Keep the SSE streaming interface (broadcast_gov) exactly as-is — just
   replace the sleep-based simulation with real async progress events.
```

---

## 2. LLM-powered semantic definition extraction

```
In server/app.py, replace the 5 hardcoded DEMO_DEFS with real LLM-generated
semantic definitions. After a governance run completes:

1. For each cataloged table, collect: table name, schema name, column names
   and types, and up to 3 sample rows (SELECT * FROM table LIMIT 3).
2. Batch these into groups of 10 tables and send to the Anthropic API
   (claude-haiku-4-5-20251001 for cost) with a prompt asking it to:
   - Identify metrics (aggregatable numeric columns) vs dimensions (categorical)
   - Write a one-sentence business definition for each
   - Return a confidence score 0.0–1.0 based on how clear the column naming is
3. Parse the structured JSON response and insert rows into semantic_definitions.
4. Add anthropic to server/requirements.txt.
5. Store the ANTHROPIC_API_KEY in .env and load it via os.environ — never
   hardcode it.
```

---

## 3. Real ML pipeline execution

```
In server/app.py, replace simulate_pipeline() with a real training run.
When POST /api/pipeline/run is called:

1. Load the training data by querying the gold table identified during
   governance (fact_revenue or equivalent) joined to the grain dimension.
2. Use pandas + scikit-learn to:
   - Engineer time features: day-of-week, week-of-year, lag_7, lag_14,
     rolling_mean_7, rolling_std_7
   - Train an XGBRegressor (n_estimators=500, max_depth=6, learning_rate=0.05)
     with an 80/10/10 train/val/test time split
   - Compute MAPE on the test set
   - Generate 14-day forecasts with a simple bootstrap CI (resample residuals
     100×, take 10th/90th percentile)
3. Persist predictions into chart_data table.
4. Stream real progress via broadcast_pipe as each step completes.
5. Add xgboost, scikit-learn, pandas to server/requirements.txt.
6. Keep the log format identical to the existing PIPE_LOGS structure so the
   frontend (S08_Pipeline.jsx) requires no changes.
```

---

## 4. Multi-tenancy — org isolation

```
Add multi-tenant data isolation to server/app.py and the SQLite schema.

1. Add an organizations table: id, name, slug, created_at.
2. Add a users table: id, org_id, email, role (admin|member), created_at.
3. Add org_id FK to: connections, governance_runs, sessions, artifacts,
   artifact_shares. Do NOT add it to cataloged_tables or pipeline_runs —
   those already chain through their parent FKs.
4. Write a get_current_org() helper that reads org_id from the JWT claims
   (once auth is wired up) or from a request header X-Org-Id for now.
5. Add WHERE org_id = get_current_org() to every SELECT in every route.
6. Add org_id = get_current_org() to every INSERT.
7. Write a migration function that runs ALTER TABLE … ADD COLUMN org_id
   if the column doesn't exist, so existing dev DBs aren't broken.
8. Seed a default org (id=1, slug='demo') so all existing demo data still
   works with org_id=1.
```

---

## 5. Migrate from SQLite to PostgreSQL

```
Replace the SQLite backend with PostgreSQL so the app can handle concurrent
writes in production.

1. Add psycopg2-binary to server/requirements.txt.
2. Replace the sqlite3 connection helpers (get_db, thread_db, execute, one,
   many) with psycopg2 equivalents that use a connection pool
   (psycopg2.pool.ThreadedConnectionPool, min=2, max=10).
3. Read the DSN from DATABASE_URL env var; fall back to
   postgresql://localhost/analytiq_dev for local development.
4. Convert SQLite-specific syntax: datetime('now') → NOW(),
   INTEGER PRIMARY KEY AUTOINCREMENT → SERIAL PRIMARY KEY,
   PRAGMA statements → remove them (PostgreSQL handles this natively).
5. Update .env.example with DATABASE_URL=postgresql://user:pass@host/db.
6. Keep the schema creation logic (init_db) so it still runs CREATE TABLE IF
   NOT EXISTS on startup.
7. Update the README with `createdb analytiq_dev` as a setup step.
```

---

## 6. Encrypted credential storage

```
Warehouse credentials (Snowflake account, username, password) are stored
plaintext in the database. Fix this.

1. Add cryptography to server/requirements.txt.
2. Generate a CREDENTIAL_ENCRYPTION_KEY (Fernet key) and add it to .env.
3. Write encrypt(plaintext) and decrypt(ciphertext) helpers using
   cryptography.fernet.Fernet.
4. In POST /api/connections, encrypt username and password before INSERT.
5. In the governance route, decrypt them before opening the Snowflake
   connection.
6. Never return the decrypted password in any GET /api/connections response —
   return a masked placeholder like "••••••••" instead.
7. Add CREDENTIAL_ENCRYPTION_KEY to .env.example with instructions to
   generate one via: python -c "from cryptography.fernet import Fernet;
   print(Fernet.generate_key().decode())"
```

---

## 7. Rate limiting

```
Add per-IP rate limiting to the Flask API to prevent abuse.

1. Add flask-limiter and redis to server/requirements.txt.
2. Initialize a Limiter with key_func=get_remote_address and a Redis storage
   backend (REDIS_URL env var, fallback to in-memory for dev).
3. Apply limits:
   - POST /api/connections: 10/minute
   - POST /api/governance/run: 5/minute
   - POST /api/pipeline/run: 5/minute
   - All other routes: 120/minute (global default)
4. Return 429 with a JSON body { "error": "Rate limit exceeded",
   "retry_after": <seconds> } on breach.
5. Add REDIS_URL to .env.example.
```

---

## 8. Email notifications

```
Send transactional emails when key events occur. Use the Resend API
(resend.com) — it has a generous free tier and a clean Python SDK.

1. Add resend to server/requirements.txt.
2. Read RESEND_API_KEY and FROM_EMAIL from env vars.
3. Write a send_email(to, subject, html) helper that calls resend.Emails.send.
   If RESEND_API_KEY is not set, log the email to stdout instead (dev mode).
4. Send emails on these events:
   - Governance run complete → email the connection owner: subject
     "Governance complete — N tables cataloged", body includes health summary.
   - Pipeline run complete → email the session owner: subject
     "Your forecast is ready", body includes MAPE and a link to the artifact.
   - Artifact shared → email the new collaborator: subject
     "[Name] shared an artifact with you", body includes artifact title and role.
5. Trigger each send in a daemon thread so it never blocks the API response.
6. Add RESEND_API_KEY and FROM_EMAIL to .env.example.
```

---

## 9. Audit logging

```
Add an immutable audit log so enterprise buyers can see who did what.

1. Add an audit_logs table to the schema:
   id, org_id, user_email, action, resource_type, resource_id, metadata (JSON),
   created_at. No UPDATE or DELETE ever touches this table.
2. Write a log_action(action, resource_type, resource_id, metadata={}) helper
   that inserts a row. Read user_email and org_id from Flask g (populated by
   the auth middleware).
3. Call log_action for every mutating operation:
   - "connection.created" / "connection.deleted"
   - "governance.started" / "governance.completed"
   - "semantic.accepted" / "semantic.edited" / "semantic.rejected"
   - "pipeline.started" / "pipeline.completed"
   - "artifact.created" / "artifact.deleted"
   - "share.added" / "share.removed"
4. Add GET /api/audit-logs?resource_type=&resource_id=&limit=50 route that
   returns logs filtered by org_id (current org only, never cross-tenant).
```

---

## 10. Stripe billing integration

```
Add subscription billing so you can charge customers. Use Stripe Checkout
for simplicity — no custom payment UI needed.

1. Add stripe to server/requirements.txt.
2. Read STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET from env.
3. Add a subscriptions table: id, org_id, stripe_customer_id,
   stripe_subscription_id, plan (free|pro|enterprise), status, current_period_end.
4. Add these routes:
   - POST /api/billing/checkout — create a Stripe Checkout session for the
     'pro' price ID (read STRIPE_PRO_PRICE_ID from env), return { url }.
   - POST /api/billing/portal — create a Stripe Customer Portal session, return { url }.
   - POST /api/billing/webhook — verify Stripe signature, handle
     checkout.session.completed (activate subscription) and
     customer.subscription.deleted (downgrade to free).
5. Add a plan_gate(required_plan) decorator. Apply it to:
   - POST /api/pipeline/run — require 'pro'
   - POST /api/governance/run with >3 tables — require 'pro'
6. Add STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRO_PRICE_ID to
   .env.example.
```

---

## 11. Docker & deployment config

```
Make the app deployable. Create production-ready Docker config.

1. Create server/Dockerfile:
   - Base image: python:3.12-slim
   - WORKDIR /app
   - COPY requirements.txt and pip install --no-cache-dir
   - COPY the rest of server/
   - EXPOSE 3001
   - CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:3001", "--timeout", "120",
     "--worker-class", "gthread", "--threads", "4", "app:app"]
   - Add gunicorn to requirements.txt

2. Create client/Dockerfile:
   - Base image: node:20-alpine for build stage
   - npm ci && npm run build
   - Second stage: nginx:alpine, copy dist/, add nginx.conf that serves
     index.html for all routes (SPA fallback) and proxies /api/ to the
     Flask container.

3. Create docker-compose.yml at the repo root with services:
   - db: postgres:16-alpine, volume for data, env POSTGRES_DB/USER/PASSWORD
   - api: builds server/Dockerfile, env DATABASE_URL pointing to db service,
     depends_on db
   - web: builds client/Dockerfile, ports 80:80, depends_on api

4. Add .dockerignore files to both server/ and client/.

5. Update README with: docker compose up --build
```

---

## 12. Artifact scheduling & auto-refresh

```
Let users schedule artifact refreshes so dashboards don't go stale.

1. Add a schedules table: id, artifact_id, org_id, cron_expr
   (e.g. "0 6 * * 1" = every Monday at 6am), next_run_at, last_run_at,
   enabled (bool), created_at.

2. Add routes:
   - GET /api/artifacts/:id/schedule — get current schedule
   - PUT /api/artifacts/:id/schedule — upsert schedule (body: { cron_expr })
   - DELETE /api/artifacts/:id/schedule — disable

3. Add a scheduler thread that starts with the app (threading.Thread, daemon=True).
   Every 60 seconds it queries for schedules WHERE next_run_at <= NOW()
   AND enabled = true, then for each:
   - Looks up the artifact → its pipeline_run → its session
   - Calls the pipeline run logic to retrain and regenerate chart_data
   - Updates the artifact's pipeline_run_id to the new run
   - Computes next_run_at using croniter (add to requirements.txt)
   - Sends the "forecast is ready" email notification

4. In S10_Artifacts.jsx, add a schedule button next to each artifact that
   calls the schedule API with a simple dropdown: Daily / Weekly / Monthly.
```

---

## 13. Export & download

```
Add export capabilities to the dashboard artifact screen (S09_Dashboard.jsx).

1. Add a server route: GET /api/artifacts/:id/export?format=csv|json
   - csv: returns the chart_data rows as a CSV file (Content-Disposition:
     attachment; filename="artifact-<id>.csv")
   - json: returns the full artifact JSON including kpis and chart_data rows

2. In S09_Dashboard.jsx, add an Export dropdown button next to the existing
   action buttons with options: "Download CSV", "Download JSON", "Copy PNG".

3. For "Copy PNG", use the browser's html2canvas library loaded from CDN to
   screenshot the chart container div and copy it to the clipboard via the
   Clipboard API. Show a "Copied!" toast on success.

4. For CSV and JSON, trigger a file download by creating a temporary <a>
   element with href pointing to the export API URL and clicking it.
```

---

## 14. Additional data connectors

```
Implement real connectors for BigQuery and PostgreSQL to match the "Coming
soon" tiles already shown in S02_Connect.jsx.

For BigQuery:
1. Add google-cloud-bigquery to requirements.txt.
2. Accept these form fields: project_id, dataset_id, credentials_json
   (the service account JSON key — store encrypted, same as Snowflake creds).
3. In the governance route, detect conn.type === 'bigquery' and use the
   BigQuery client to run INFORMATION_SCHEMA.COLUMNS queries instead of
   Snowflake's SHOW COLUMNS.

For PostgreSQL:
1. psycopg2-binary is already in requirements.txt (added in task #5).
2. Accept: host, port, database, username, password, schema.
3. Use information_schema.tables and information_schema.columns for
   catalog introspection.

In S02_Connect.jsx:
4. Remove live: false from bigquery and postgres connector entries.
5. Make the form fields dynamic based on the selected connector type —
   BigQuery shows project_id + credentials_json upload; Postgres shows
   host/port/database/username/password/schema.
```

---

## 15. Search, filter & pagination on artifact list

```
The artifact list in S10_Artifacts.jsx will break as data grows.
Add search, filtering, and pagination.

Server (GET /api/artifacts):
1. Accept query params: q (title search), type (Predictive|Descriptive),
   dq_status (pass|warn), page (default 1), per_page (default 20).
2. Build the WHERE clause dynamically from present params.
3. Return { items: [...], total: N, page: P, per_page: 20 } instead of a
   bare array.

Client (S10_Artifacts.jsx):
4. Add a search input at the top that debounces 300ms before calling the API.
5. Add Type and DQ Status filter dropdowns next to the search input.
6. Add pagination controls at the bottom: Previous / Page N of M / Next.
7. Reset to page 1 whenever search or filters change.
8. Update api.js — getArtifacts() should accept { q, type, dq_status, page }
   and append them as URL search params.
```

