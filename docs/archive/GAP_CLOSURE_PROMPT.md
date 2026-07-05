# AnalytIQ Gap-Closure Program — Execution Prompt

This document is the cleaned, executable version of the plan to close the PRD gap list using the new managed-tool stack (Supabase, Vercel, Railway, Upstash, Cloudflare R2, Infisical, Better Stack, Resend, Meilisearch/Typesense, Clerk). It replaces the ad-hoc instructions from chat. Nothing in this file has been executed yet — it defines the process to run in a future session.

## Objective

Convert the annotated PRD gap list into a structured, executable delivery plan (Releases → Sprints → Epics → User Stories → Acceptance Criteria → Tasks), then implement it story-by-story using a strict TDD loop, with every managed-tool integration backed by a local/offline fallback so the app stays 100% runnable in an isolated sandbox with zero external credentials.

## Required reading before starting

1. `F:\workspace\analytiq\CLAUDE.md` — architecture notes
2. `server/app.py` — full Flask + SQLite backend
3. `client/src/screens/` and `client/src/components/` — existing frontend
4. The annotated gap list + tool mapping already established (Supabase Auth/RLS, Upstash Redis+QStash, Cloudflare R2, Infisical, Better Stack, Resend, Meilisearch/Typesense, Clerk, Railway/Vercel)

Note: `ANALYTIQ_MASTER_CHECKLIST.md`'s old Sprint N numbering is no longer used as the source of truth — this program defines its own Release/Sprint/Epic numbering from scratch.

## Phase 1 — Build the hierarchy document

Organize every item from the annotated gap list into:

- **Release** — a coherent, shippable milestone (e.g., "Auth & Data Foundation," "Ingestion & Connectors," "Model Training Upgrade," "Artifact Interactivity," "Sharing & Embed Security"). Group by dependency and theme, not by original PRD section number.
- **Sprint** — a 1–2 week slice within a release.
- **Epic** — a feature cluster within a sprint (roughly one PRD bullet-group, e.g., "Lineage DAG Visualization," "SHAP Explainability," "Public Share Links").

For every Epic that maps to a tool swap, record: the tool, and the required local fallback (see below).

Save the result as `RELEASE_PLAN.md` in the repo root.

## Phase 2 — Break Epics into User Stories

Loop through every Epic in `RELEASE_PLAN.md`. For each one, write user stories in standard form:

> As a [role], I want [capability], so that [value].

Append stories under their parent Epic in the same file.

## Phase 3 — Acceptance criteria & tasks per story

For every user story, write:

- **Acceptance criteria** (Given/When/Then or bullet form) — observable, testable conditions for "done."
- **Tasks** — concrete implementation steps specific enough to drive the TDD loop below.

## Phase 4 — Execution loop (one user story at a time)

Complete each user story fully — tests green, no regressions, fallback verified, log written, progress file updated — before starting the next one. Do not create tasks for the next story until the current one is confirmed working.

Per story:

1. Read the story's acceptance criteria and tasks from `RELEASE_PLAN.md`.
2. Identify what's missing or incomplete in `server/app.py` (or the relevant module) relative to the story.
3. Write failing test(s) in `tests/test_<release-slug>_<sprint-slug>_<epic-slug>.py`.
4. Run → confirm RED.
5. Implement the feature. For any managed-tool integration, implement a local/offline fallback (in-memory, SQLite-backed, or filesystem-backed) that activates automatically whenever the corresponding env var/API key is absent.
6. Run → confirm GREEN.
7. Run full regression (`pytest tests/`).
8. Fix any regressions before proceeding.
9. Log to `tests/logs/<story-id>_<timestamp>.log` and console.
10. Update `PROGRESS.md`, mark the story complete, move to the next.

## Test infrastructure (set up once, before Phase 4 begins)

- `tests/conftest.py`:
  - Fixture creating a fresh temp-file SQLite DB per test (never touches `analytiq.db`)
  - Fixture running `init_db()` from `server/app.py` to set up schema
  - Flask test client fixture
  - Hook that writes all output to `tests/logs/` with timestamped filenames, mirrored to console
- `tests/logs/` folder created
- `pytest` installed in the venv

## Local fallback requirement (mandatory for every tool-swapped item)

For each new managed tool referenced in the plan — Supabase Auth, Supabase Realtime, Postgres RLS, Upstash Redis/QStash, Cloudflare R2, Infisical, Better Stack, Resend, Meilisearch/Typesense, Clerk:

- Detect the required env vars/keys at startup.
- If present → use the real integration.
- If absent → fall back to an equivalent local implementation already in the app's spirit (SQLite tables, Fernet-encrypted local secrets, daemon threads, filesystem storage, simple substring search, console/log-based "email," etc.).
- Document which mode is active next to each Epic in `RELEASE_PLAN.md`.
- End state: the entire app must run start-to-finish in an isolated local sandbox with no external accounts, keys, or network access.

## Progress tracking

Maintain `PROGRESS.md` at the repo root, updated after every completed user story:

- `[x]` done / `[ ]` pending per story
- Current position (release / sprint / epic / story)
- Any blockers

This file is the single source of truth for "how far we've gotten" across sessions.

## Definition of done (per user story)

- All new tests GREEN
- All prior tests still GREEN (no regressions)
- Feature implemented server-side (+ frontend if the story requires a UI change)
- Local fallback implemented and verified to work with zero external keys configured
- Log file written
- `PROGRESS.md` updated

## Scope notes

- Frontend automated testing: skip. Backend/server-side tests are mandatory for every story.
- Work through releases in dependency order. There's no fixed stopping point — go as far as the session allows, but always leave the repo fully green and fully runnable at whatever point you stop.
