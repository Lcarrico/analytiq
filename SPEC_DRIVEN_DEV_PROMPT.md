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

## Phase 1 — The Plan (`RELEASE_PLAN.md` at repo root)

Organize the entire gap list into:

* Release — a coherent, shippable milestone. Order by dependency, not by spec section number (foundation → data → domain logic → UX → polish). Platform concerns (auth, storage, queues, observability) come first because everything else leans on them.
* Sprint — a 1–2 week slice within a release.
* Epic — one feature cluster (roughly one spec bullet-group).
* Story IDs are deterministic and greppable: `R<r>S<s>E<e>-US<n>`. Test files, log files, and progress entries all reuse the ID.

For each epic record:

* The managed tool / external dependency it maps to, and the mandatory local fallback (see Fallback Rule below).
* Acceptance criteria per story: observable, testable, numeric where possible ("returns 409 with `{error, pending_reviews}`", not "handles errors gracefully").
* Whether the story has a UI-visible surface. If yes, its ACs must include user-observable UI behavior (what renders, what's clickable, what state changes are visible) in addition to any API contract — not just "screen loads."

Task elaboration is just-in-time: fully detail tasks only for the release you are about to execute. Later releases keep final ACs but get their task breakdowns when a story enters the loop. Never plan tasks for story N+1 before story N is confirmed done.

Every story is implemented as a full vertical slice: backend and frontend land together, not in separate "backend release" / "frontend release" passes. A story is not done if the API exists but no screen exposes it, or if a screen calls an endpoint that doesn't exist yet.

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

1. Read the story's ACs (and elaborate tasks now if not yet done). If the story has a UI surface, identify both its API-level ACs and its UI-observable ACs before writing any code.
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
9. Log written (automatic via hooks, backend and UI both) and `PROGRESS.md` updated — tick the story, move the Current Position pointer.
10. Only then start the next story.

UI stories are tested exactly like backend stories — RED/GREEN with real Playwright/Selenium assertions against rendered behavior — not skipped as "non-unit-testable." The only allowance for a UI layer with no meaningful automated-test surface (e.g. pure static copy/styling with no interactive behavior) is a compile/build gate; anything a user can click, type into, or observe changing state gets a deterministic UI test. In all cases the verification gate is mandatory: per-file compile/lint checks on every touched file, a full production build at story end, the full Playwright/Selenium UI suite, and the backend regression re-run to prove nothing server-side moved.

## Phase 4 — Progress Tracking (`PROGRESS.md` at repo root)

This file is the single source of truth across sessions. It must be glanceable: current position in the first three lines, everything else scannable checkboxes. Exact format:

```markdown
# <Project> — Progress

**Current position:** Release 2 · Sprint 2.1 · Epic E3 (<name>) · R2S1E3-US1
**Suite:** 187 backend tests green · 42 UI tests green (last full run <timestamp>) · build green
**Blockers:** none

## Release 1 — <Name> ✅
- [x] R1S1E1-US1 <one-line outcome, not a restatement of the AC>
- [x] R1S1E1-US2 <...>

## Release 2 — <Name> (in progress