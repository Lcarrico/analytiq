# Spec-Driven Development Program — Execution Prompt

Copy-paste this entire document as the task prompt whenever an AI agent is given a specification document (PRD, checklist, RFC, design doc, gap list) and asked to develop against it. It defines the exact process to follow, the artifacts to maintain, and the quality gates that may never be skipped.

## Objective

Convert the supplied specification document into a structured, executable delivery plan (Releases → Sprints → Epics → User Stories → Acceptance Criteria → Tasks), then implement it one user story at a time using a strict test-driven loop, covering **both backend and frontend** for every story that touches the UI. At every moment — including if the session ends abruptly — the repository must be fully green, fully runnable, and `PROGRESS.md` must tell a newcomer exactly where things stand in under 30 seconds of reading.

## Phase 0 — Recon (always first, never skipped)

1. Read the actual codebase before the spec. Architecture notes (`CLAUDE.md`/`README`), the main entry points, the module layout, the existing tests, and the front-end structure if one exists. The spec describes intent; the code is ground truth.
2. Read the spec end-to-end and build a numbered feature inventory — every discrete capability the document promises. Look especially for a "comprehensive feature list" or acceptance-criteria sections; they are the canonical source.
3. Diff inventory vs. reality. Classify every item: `missing` / `partial` / `done` / `N/A in this stack`. This gap list is the input to Phase 1.
4. Record environment adaptations up front. If the spec assumes infrastructure the project doesn't have (different database, cloud services, queues, auth providers), decide the local equivalent NOW and write it down. Rule of thumb: implement the real behavior, swap the substrate. Never write tests against stubs of infrastructure that doesn't exist.
5. Verify the toolchain sees your edits. Before trusting any test run, confirm the interpreter/bundler is reading current sources (beware stale bytecode caches, mounted-filesystem sync lag, build caches). Add permanent guards in the test harness (e.g. redirect `__pycache__`, disable bytecode writes, syntax-parse files after batch edits).
6. Confirm UI test tooling is installed and runnable (Playwright preferred; Selenium acceptable if the project already standardizes on it). If neither is present, install and wire it up in this phase — not mid-story — so every subsequent story that touches a screen has a working harness from day one.
7. **Verify the plan tree exists and is complete before doing anything else.** Check the repo root for `RELEASE_PLAN.md` and `PROGRESS.md`. Walk the full hierarchy — Release → Sprint → Epic → Feature → User Story — end to end:
   * If either document is entirely missing, generate it fresh as a new checklist document (per the formats in Phase 1 and Phase 4) before continuing to any other phase.
   * If either document exists but is incomplete or inconsistent — a Release with no Sprints, a Sprint with no Epics, an Epic with no User Stories, a spec feature with no corresponding node anywhere in the tree — treat this as a gap in its own right: fix and regenerate the missing portion of the tree (using the gap list from step 3 to fill it in) before elaborating Tasks/Subtasks or starting the execution loop.
   * Do not proceed to Task/Subtask generation (Phase 1a) or the Execution Loop (Phase 3) against a tree with holes in it. The tree must be structurally complete — every Feature traceable to a Release/Sprint/Epic/User Story — before task generation begins.

## Phase 1 — The Plan (`RELEASE_PLAN.md` at repo root)

**`RELEASE_PLAN.md` and `PROGRESS.md` must always exist.** If either is missing at the start of a session, generate it before doing anything else, following the exact structures below (and the checkbox-first, nested style shown in the worked example at the end of this document — Release → Milestone → Sprint → Epic → Feature/User Story → Acceptance Criteria → Tasks → Subtasks, everything as literal `- [ ]` checkboxes, not prose bullets). Treat both files as living documents: every phase of this process reads and writes them, and a session should never end with one stale relative to the other.

Organize the entire gap list into:

* Release — a coherent, shippable milestone-set. Order by dependency, not by spec section number (foundation → data → domain logic → UX → polish). Platform concerns (auth, storage, queues, observability) come first because everything else leans on them.
* Milestone — a named grouping of sprints within a release that represents a demoable capability slice (e.g. "Connectors & Governance Foundation"). Each milestone has its own Milestone Success Criteria checklist (observable, testable outcomes — not restatements of epic titles).
* Sprint — a 1–2 week slice within a milestone, with a one-line Sprint Goal and a Sprint Completion Checklist (all P0 stories complete, blocking defects resolved, backend suite green, UI suite green, demo-ready increment produced, milestone accepted).
* Epic — one feature cluster (roughly one spec bullet-group), recorded under a Sprint.
* Feature / User Story — the individual capability, in the `US-<Feature-ID>-<n>` or `R<r>S<s>E<e>-US<n>` ID style (pick one convention and use it consistently across `RELEASE_PLAN.md`, `PROGRESS.md`, test files, and log files, so the ID is greppable end-to-end).

For each epic/feature record:

* The managed tool / external dependency it maps to, and the mandatory local fallback (see Fallback Rule below).
* Acceptance criteria per story: observable, testable, numeric where possible ("returns 409 with `{error, pending_reviews}`", not "handles errors gracefully"). Each AC line is its own `- [ ]` checkbox.
* Whether the story has a UI-visible surface. If yes, its ACs must include user-observable UI behavior (what renders, what's clickable, what state changes are visible) in addition to any API contract — not just "screen loads."
* A Test Plan section separating out backend/integration test cases from UI/E2E test cases (see "Backend vs. UI test separation" below), a Definition of Done, Story Dependencies, and Agent Notes (guidance for the implementing agent: determinism constraints, data-minimization/security rules, what must never be sent to an LLM, etc.) — matching the worked example's structure.

### Backend vs. UI test separation (mandatory in every story's checklist)

Every User Story's checklist must visibly separate backend-layer verification from UI-layer verification so a reader can tell at a glance which layer is covered and which isn't yet. Within each story's Tasks/Test Plan, group items under two explicit sub-headers (or clearly tagged checkbox prefixes):

* **Backend/API** — unit tests, integration tests against the real interface, DB-level contract checks, security/negative-path tests.
* **UI/E2E** — Playwright/Selenium tests against rendered behavior, covering the story's UI-observable ACs.

A story with no UI surface may omit the UI/E2E group entirely, but must say so explicitly (`UI/E2E: N/A — no user-facing surface`) rather than leaving it blank, so it's clear the omission was a decision and not an oversight.

Task elaboration is just-in-time: fully detail tasks only for the release you are about to execute. Later releases keep final ACs but get their task breakdowns when a story enters the loop. Never plan tasks for story N+1 before story N is confirmed done.

Every story is implemented as a full vertical slice: backend and frontend land together, not in separate "backend release" / "frontend release" passes. A story is not done if the API exists but no screen exposes it, or if a screen calls an endpoint that doesn't exist yet.

## Phase 1a — Full-Tree Task & Subtask Generation

Before entering the Execution Loop, walk the **entire existing plan tree** — every Release, every Sprint, every Epic, every Feature, every User Story already recorded in `RELEASE_PLAN.md` (not just the release about to be executed) — and generate a thorough list of Tasks and Subtasks for each User Story. This is a documentation pass, not an implementation pass: no code is written in this phase.

For each User Story:

* Break its Acceptance Criteria into concrete Tasks (the discrete units of work needed to satisfy the AC set: e.g. schema/migration change, backend endpoint, domain-logic module, frontend component/screen wiring, test scaffolding, fallback wiring). Tag or group each Task under **Backend/API** or **UI/E2E** (per the separation rule in Phase 1) so the two layers stay distinguishable at the task level, not just the test-plan level.
* Break each Task into Subtasks where the work has more than one meaningful step (e.g. a backend endpoint Task might subtask into: request/response schema, route handler, DB query helper, error-path handling, negative-path test, happy-path test). Render every Task and Subtask as a nested `- [ ]` checkbox, matching the worked example's indentation style (Task as a top-level checkbox under the story, Subtasks indented beneath it).
* Explicitly include, as their own Tasks where applicable: RED test authoring (backend and UI, each tagged to its layer), Fallback Rule wiring for any external dependency touched, and the verification gate items (build/compile, full regression, log write, progress update) — so the task list mirrors the Definition of Done, not just the feature work.
* Record this breakdown under each User Story's entry in `RELEASE_PLAN.md` (nested beneath the story, not in `PROGRESS.md` — `PROGRESS.md` stays one-line-per-story per Phase 4's rules).

This applies retroactively to the whole tree, including stories already marked done in `PROGRESS.md` (backfill their Task/Subtask breakdown for documentation completeness) and stories not yet started (their breakdown becomes the checklist the Execution Loop works through). If a Task/Subtask breakdown already exists for a story, review it against current ACs and repair gaps rather than duplicating it.

Note: this generates the checklist of Tasks/Subtasks up front for the whole tree; the "just-in-time" rule in Phase 1 still governs when a release's stories actually get *executed*, and Task elaboration for a story may be refined further at the moment it enters the loop (step 1 of Phase 3) if the up-front breakdown needs adjustment given the current state of the code.

## Fallback Rule (mandatory for every external integration)

* Detect required env vars/keys at startup: present → real integration; absent → equivalent local implementation (embedded DB tables, filesystem storage, in-process workers, hand-rolled crypto primitives, console/DB "outbox" email, FTS instead of a search service).
* Expose a single `GET /platform/status`-style endpoint reporting each service's active mode.
* End state invariant: the entire app runs start-to-finish in an isolated sandbox with zero external accounts, keys, or network access — and there is a boot-check that proves it.

## Phase 2 — Test Infrastructure (once, before any story)

### Backend

* Isolated, disposable state per test: fresh temp-file database (never the dev database), sandboxed storage/temp dirs via env override, schema created by the app's own init function.
* App test client fixture + a raw DB-handle fixture.
* Logging hooks: every run mirrors results to `tests/logs/<story-or-scope>_<timestamp>.log` (test name, PASS/FAIL, full failure output) in addition to the console. Log filename derives from the test file name so story ↔ log mapping is automatic.
* Determinism kit: seeded RNG everywhere randomness exists; a `wait_until(predicate, timeout)` helper instead of `sleep()`; background simulation delays monkeypatched to ~0 in tests.
* Belt-and-braces safety: even background threads that outlive a test must never touch real data (module-level fallback paths pointing at temp dirs).

### Frontend / UI (Playwright, or Selenium if the project already standardizes on it)

* Set up the UI test runner once, at the framework level, before any story starts: `tests/ui/` (or the project's equivalent), config for headless CI runs plus headed local debugging, and a single command to run the full UI suite (e.g. `npm run test:ui`).
* Every UI test runs against the app booted in its zero-key fallback mode (see Fallback Rule) with a fresh seeded backend — never against shared dev data, never against a real external service.
* Determinism is mandatory, not optional, for UI tests specifically because they are the most flake-prone layer:
  * Never assert on hardcoded `sleep()`/`waitForTimeout()`. Use the framework's built-in auto-waiting plus explicit `waitFor`/`expect(...).toBeVisible()`-style condition waits keyed to real state changes (network response, DOM element, SSE message received).
  * Seed the backend with known, fixture-driven data per test (via API calls or DB fixtures) so assertions can target exact values, not "something appeared."
  * Stabilize anything nondeterministic in the UI itself for test purposes: freeze/mock timestamps and relative-time displays, use the same seeded RNG as the backend for any client-side randomness, disable animations/transitions in the test environment so element visibility isn't racing CSS.
  * Isolate test runs: each test gets its own browser context (or equivalent) and its own backend test database/session, so tests can run in parallel without cross-contamination.
  * Tests select elements via stable test hooks (`data-testid` or equivalent), never brittle CSS/text selectors that break on copy changes.
* Logging hooks mirror backend behavior: every UI suite run writes to `tests/logs/ui_<story-or-scope>_<timestamp>.log`, and on failure captures a screenshot + trace (Playwright trace viewer or Selenium equivalent) saved alongside the log so failures are debuggable without rerunning.
* A UI test suite that is green only sometimes is red — the same flake policy from Phase 3 applies here, and flakes are root-caused (almost always a missing deterministic wait or unseeded data), never papered over with retries or increased timeouts.

## Phase 3 — Execution Loop (one story at a time, no exceptions)

For each story, in order:

1. Read the story's ACs and its Phase 1a Task/Subtask breakdown (elaborate or refine tasks now if the up-front breakdown needs adjustment). If the story has a UI surface, identify both its API-level ACs and its UI-observable ACs before writing any code.
2. Locate the gap in the actual code relative to the ACs — backend and frontend.
3. RED — write failing tests first:
   * Backend: `tests/test_<release><sprint>_<epic-slug>.<ext>`; run them; confirm they fail for the expected reason (an import error is not a valid RED for a behavior test).
   * Frontend: `tests/ui/test_<release><sprint>_<epic-slug>.<ext>` using Playwright/Selenium, covering the story's UI-observable ACs (render, interaction, resulting state change); run them; confirm they fail for the expected reason (element not found because the feature doesn't exist yet, not because of a broken selector or bad setup).
4. GREEN — implement. New logic goes in focused modules; the main app file only wires routes/orchestration. Build the corresponding UI (component/screen) alongside the backend, not after. Apply the Fallback Rule to any external dependency touched.
5. Story suite green — backend tests and UI tests both pass for this story.
6. Full regression — the entire backend test suite AND the entire UI test suite, not just the new files.
7. Fix regressions before anything else. If an old test (backend or UI) fails:
   * Code broke → fix the code.
   * The old test encoded an assumption the new feature legitimately changed → update the test with a comment citing the story ID that changed the contract. Never delete or weaken an assertion silently.
8. Flake policy: any intermittent failure gets a root-cause fix in the test (usually a missing `wait_until`/`waitFor` on an async boundary — e.g. "status is done" ≠ "side effects are committed", or "element mounted" ≠ "data loaded"). Rerun the full suite (backend + UI) 2–3× after fixing; a suite that is green only sometimes is red.
9. Log written (automatic via hooks, backend and UI both) and `PROGRESS.md` updated — tick the story, move the Current Position pointer, and mark its Task/Subtask breakdown in `RELEASE_PLAN.md` as complete.
10. Only then start the next story.

### Sprint-close and Release-close regression gates (mandatory, in addition to per-story regression)

Per-story full regression (step 6 above) is not a substitute for the wider checkpoints below — both are required:

* **End of every Sprint:** before ticking a Sprint's Sprint Completion Checklist, run the entire backend suite and the entire UI suite (every test file, not just the sprint's stories) at least once more, back-to-back, and record the combined pass counts and timestamp in both `RELEASE_PLAN.md` (under that Sprint's checklist) and `PROGRESS.md` (Suite line). If anything fails, treat it exactly like a per-story regression failure (Phase 3 step 7/8) before the sprint can be marked complete.
* **End of every Release:** before ticking a Release/Milestone as done, run the same full backend + UI regression once more at the release boundary, plus the zero-key boot check (Fallback Rule) to reconfirm the whole app still starts cold with no external keys. Record the result under the Release's own regression entry in `RELEASE_PLAN.md` and update `PROGRESS.md`'s Milestone Success Criteria / Suite line accordingly.
* Both gates are flake-checked the same way as story-level regression: green only sometimes is red, rerun 2–3× if anything flaked, root-cause rather than retry-and-ignore.
* Neither gate may be skipped because "the individual stories already passed" — the point is to catch cross-story interaction effects that per-story regression can miss.

UI stories are tested exactly like backend stories — RED/GREEN with real Playwright/Selenium assertions against rendered behavior — not skipped as "non-unit-testable." The only allowance for a UI layer with no meaningful automated-test surface (e.g. pure static copy/styling with no interactive behavior) is a compile/build gate; anything a user can click, type into, or observe changing state gets a deterministic UI test. In all cases the verification gate is mandatory: per-file compile/lint checks on every touched file, a full production build at story end, the full Playwright/Selenium UI suite, and the backend regression re-run to prove nothing server-side moved.

## Phase 4 — Progress Tracking (`PROGRESS.md` at repo root)

**`PROGRESS.md`, like `RELEASE_PLAN.md`, must always exist.** If missing, generate it fresh in the format below before continuing any other work (see Phase 0 step 7 and Phase 1).

This file is the single source of truth across sessions. It must be glanceable: current position in the first three lines, everything else scannable checkboxes. Exact format:

```markdown
# <Project> — Progress

**Current position:** Release 2 · Milestone B · Sprint 2.1 · Epic E3 (<name>) · R2S1E3-US1
**Suite:** 187 backend tests green · 42 UI tests green (last full run <timestamp>) · build green
**Blockers:** none

## Release 1 — <Name> ✅
### Milestone A — <Name> ✅
- [x] R1S1E1-US1 <one-line outcome, not a restatement of the AC>
- [x] R1S1E1-US2 <...>

**Sprint 1.1 regression:** backend N/N green · UI N/N green (<timestamp>)
**Release 1 regression + zero-key boot check:** backend N/N green · UI N/N green · boot check passed (<timestamp>)

## Release 2 — <Name> (in progress)
### Milestone B — <Name> (in progress)
- [x] R2S1E1-US1 <...>
- [ ] R2S1E3-US1 <...>   ← next
- [ ] ...

## Adaptation ledger
- Spec says <X>; implemented <Y> because <environment reason>. (story ID)

## Verification
- How to run everything: <commands>
- How to run backend tests only: <command>
- How to run UI tests only (Playwright/Selenium): <command>
- Zero-key boot check: <command> → expected output
```

Rules:

* One story = one checkbox = one line. No nested sub-checklists here — detail (including the Phase 1a Task/Subtask breakdown, and each Milestone's Success Criteria) lives in `RELEASE_PLAN.md`.
* Milestones are recorded as sub-headers within their Release, between the Release header and its stories, so Current Position and completion state are traceable at the Release → Milestone → Sprint → Story granularity.
* Every Sprint and every Release gets its own regression line (per the Sprint-close/Release-close gates in Phase 3) recording backend/UI pass counts, timestamp, and — for Release-close — the zero-key boot check result. A Milestone/Release is not checked off `✅` until its regression line is present and green.
* Update it in the same step that finishes a story, a sprint-close regression, or a release-close regression — never batched later.
* The Suite line reports backend and UI test counts separately so a reader can see both layers are covered at a glance.
* The Adaptation ledger grows whenever reality diverges from the spec; it is the answer to "why doesn't this match the document?"
* When a session must stop: leave Current Position pointing at the next story, both suites green, and a one-line note of anything half-decided.

## Engineering Rules (accuracy multipliers — learned the hard way)

### Editing

* Batch source edits through atomic patch scripts: assert each anchor string occurs exactly once before writing anything; if any anchor fails, write nothing. Half-applied edits are worse than no edits.
* After any batch edit, syntax-parse/compile every touched file before running tests.
* Prefer many small domain modules over growing a monolith; the entry file wires, modules decide. This applies to frontend components too — prefer small, focused components over growing a screen file unboundedly.

### Testing — Backend

* Test through the public interface (HTTP/API), reach into the DB only to verify storage-level contracts (encryption at rest, immutability triggers, hashes).
* Assert contracts, not incidental values: status codes, error shapes (`{error, code, remediation}`), invariants (immutable history, semver bumps, append-only logs). When asserting on computed numbers, derive the expectation or use principled bounds — never copy a number the code produced back into the test.
* Every destructive/gated path needs its negative test (403/404/409/410 and validation 400s), not just the happy path.
* Watch for over-specification: if a "failure" is actually the feature working (e.g. a repair loop retrying before succeeding), loosen the assertion to the real contract and say so in a comment.
* Security-sensitive claims get explicit tests: secrets never in plaintext at rest, never in logs/audit metadata, tokens stored hashed, injection attempts stay parameterized.

### Testing — UI (Playwright / Selenium)

* Test through the rendered interface the way a user experiences it: navigate, click, type, observe — not by reaching into component internals or framework state.
* Assert observable contracts, not incidental markup: visible text/values, element presence/absence, enabled/disabled state, navigation/URL changes, resulting network calls where relevant — never assert on brittle implementation details (internal class names, DOM structure that isn't part of the contract).
* Every UI story needs both its happy path and its negative/edge UI paths covered: validation errors surface in the UI, disabled states while loading, empty states, permission-gated UI elements hidden/shown correctly.
* Cover full user flows for multi-step features (e.g. the app's screen-to-screen wizard flow), not just isolated component renders, whenever a story's AC spans more than one screen.
* Cross-check UI assertions against the same source of truth the backend tests use (seeded fixture data), so a UI test and a backend test asserting on the same feature can never silently disagree.
* Never mark a UI-touching story done without a fresh full UI suite run showing green; a stale "it worked when I checked it manually" is not a pass.

### Design defaults that keep the plan honest

* Versioned things are immutable-append (new version per change) with deterministic bump rules; enforce immutability at the storage layer (triggers/constraints), not just in app code.
* Long operations are jobs with a `queued → running → done|failed` lifecycle, timestamps, bounded retries, and an inspection endpoint. Where the UI surfaces job status, the UI test asserts the visible state transitions, not just the backend lifecycle.
* Everything auditable: one append-only audit log, one generic alerts table, one outbox for notifications — reused by every feature instead of reinventing per epic.
* Deterministic engines (validators, gates, planners) return structured results with stable hashes so identical inputs are provably identical.

### Process discipline

* Never mark a story done with failing tests, partial implementation, or unverified fallbacks — this applies equally to backend and UI. "Done" = new backend tests green + new UI tests green + full backend regression green + full UI regression green + fallback proven with zero keys + log written (backend and UI) + progress updated.
* Scope creep goes to the plan, not the code: discovering missing work mid-story → add a story/epic to `RELEASE_PLAN.md` (with its own Task/Subtask breakdown per Phase 1a) and a `[ ]` line to `PROGRESS.md`, finish the current story first.
* There is no fixed stopping point. Go as far as the session allows, but every stopping point must be a green, runnable, documented state — backend and frontend both.

## Definition of Done (per story) — all nine, every time

1. New backend tests written first and confirmed RED for the right reason.
2. New UI tests (Playwright/Selenium) written first for any user-observable UI change, confirmed RED for the right reason.
3. Implementation makes both GREEN — backend and frontend built together as one vertical slice.
4. Full backend regression GREEN (and stable across a re-run if anything flaked).
5. Full UI regression GREEN (and stable across a re-run if anything flaked).
6. Local fallback implemented and verified with zero external keys.
7. Build/compile gate green for all touched layers (backend and frontend).
8. Log files exist in `tests/logs/` for both backend and UI runs (with screenshot/trace on any UI failure).
9. `PROGRESS.md` ticked (Suite line reflecting both backend and UI counts) and Current Position advanced.

## Reference format

`RELEASE_PLAN.md` should follow the exact nested-checkbox structure demonstrated below (Global Definition of Done → Release → Milestone → Milestone Success Criteria → Sprint → Sprint Goal → Sprint Completion Checklist → Epic → Feature/User Story → Acceptance Criteria → Tasks → Subtasks → Test Plan [Backend/API and UI/E2E separated] → Definition of Done → Story Dependencies → Agent Notes), including a Sprint-level and Release-level regression checklist entry at the close of each:

```markdown
# AnalytIQ Master Development Checklist

> Checkbox-first, LLM-native roadmap for development execution.

---

## Global Definition of Done

- [ ] Code implemented
- [ ] Unit tests added or updated
- [ ] Integration tests added where applicable
- [ ] E2E tests added for critical user flows
- [ ] Error handling implemented
- [ ] Retries/backoff implemented where external services are called
- [ ] Structured logging added
- [ ] Security and privacy implications reviewed
- [ ] Documentation updated
- [ ] Pull request reviewed
- [ ] Merged to main branch

---

# Release 1 - MVP

Phase 1 foundation: connector + governance, semantic layer, session planner, gold table data modeler, XGBoost training with walk-forward backtest, and basic artifact generation (KPI + primary time series). Workspace artifact list and manual sharing.

## Milestone A - Connectors & Governance Foundation

### Milestone Success Criteria
- [ ] Snowflake connector registers and stores credentials encrypted
- [ ] Automated ingestion profiling runs and generates governance_manifest
- [ ] Governance manifest API available and viewable in integration UI

---

## Sprint 1 - Integration & Ingestion APIs

**Sprint Goal:** Expose connector registration, secure credential storage, and sampling/profile pipeline for new integrations.

### Sprint Completion Checklist
- [ ] All P0 stories complete
- [ ] All blocking defects resolved
- [ ] Backend regression suite passing (full run, not just this sprint's stories)
- [ ] UI/E2E regression suite passing (full run, not just this sprint's stories)
- [ ] Demo-ready increment produced
- [ ] Milestone accepted

### Epic: Connectors

#### Requirement / Feature: Snowflake connector implementation

**Feature ID:** `F-001`
**Priority:** `P0`
**Labels:** `backend, data`

**Rationale:** MVP requires a working Snowflake connector as canonical warehouse for Phase 1.

##### User Story
- [ ] US-F-001-01: As a Workspace Admin, I want to register a Snowflake integration and store credentials securely, so that AnalytIQ can connect to the canonical warehouse without exposing secrets and with enforceable RBAC and audit trails.

###### Acceptance Criteria
- [ ] A backend API POST /api/v1/integrations accepts Snowflake connection metadata and returns an integration_id.
- [ ] Credentials are never persisted in plain text; stored encrypted in the configured secrets manager.
- [ ] RBAC enforced server-side: only workspace Admins may create/update integration records.

###### Tasks

**Backend/API**
- [ ] TASK-F-001-01: Implement integrations API endpoints for Snowflake registration and metadata storage
    - [ ] Define schema for POST /api/v1/integrations and GET /api/v1/integrations/{id}
    - [ ] Implement input validation for connection_profile fields
    - [ ] Persist integration metadata without any secrets field
    - [ ] Implement RBAC checks on create/update/delete endpoints
- [ ] TASK-F-001-02: Integrate with secrets manager abstraction (local fallback + managed provider)
    - [ ] Implement local-fallback encrypted store and provider-mode detection
    - [ ] Add unit tests mocking secrets manager responses

**UI/E2E**
- [ ] TASK-F-001-04: Add 'Add Snowflake' UI flow in Integration Management
    - [ ] Build form + client-side validation for connection_profile fields
    - [ ] Wire POST /api/v1/integrations call with progress/result states
    - [ ] Playwright test: full registration flow happy path
    - [ ] Playwright test: validation error and connection-failure states surface in UI

###### Test Plan

**Backend/API**
- [ ] Unit tests for input validation, RBAC checks, controller error paths
- [ ] Integration tests mocking secrets manager and verifying secret_id persistence

**UI/E2E**
- [ ] E2E test in staging: full UI registration flow against a test integration
- [ ] E2E test: RBAC-gated UI elements hidden for non-admin roles

###### Definition of Done
- [ ] POST /api/v1/integrations registers a Snowflake integration and returns integration_id
- [ ] Credentials stored only in secrets manager/local-fallback; DB contains only a reference
- [ ] Backend and UI automated tests pass in CI

###### Story Dependencies
- [ ] None (horizontal: depends on secrets manager being available in target environment)

###### Agent Notes
- Connector registration is deterministic; do not use LLMs for validation logic. Never log or return raw credentials.

---

### Sprint 1 regression
- [ ] Full backend suite green (N/N, <timestamp>)
- [ ] Full UI/E2E suite green (N/N, <timestamp>)

---

## Release 1 regression + close-out
- [ ] Full backend suite green (N/N, <timestamp>)
- [ ] Full UI/E2E suite green (N/N, <timestamp>)
- [ ] Zero-key boot check passed (<command> → expected output)
- [ ] All Milestone Success Criteria checked
```
