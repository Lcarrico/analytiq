# AnalytIQ — Design-Parity Gap Analysis & Conversion Checklist

**Goal:** convert the `client/` frontend to the **exact foundation, layout, and design** of the UI Requirements mockups (34 `.dc.html` canvas files, 95 labeled frames). This is the execution checklist: Releases → Sprints → Epics → Requirements → User Stories, every item traceable to a specific mockup file, frame anchor, and component.

This document complements (does not replace) `docs/specs/GAP_ANALYSIS_UI_PRD_v3_AND_EVOLUTION.md` (feature/backend gaps). Scope here is **frontend design parity**. Backend deltas are flagged as `DEP:` dependencies only.

---

## 0. How to read this document

**Reference convention** used on every Requirement and Story:
- `Mockup:` `<File>.dc.html` `#<frame-anchor>` `→ <region/component>` — the frame anchor is the `<section id>` / `data-screen-label` in the mockup file. Open the file in a browser and jump to `#anchor`.
- `Spec:` section reference into `UI_MOCKUP_ANALYSIS.md` (§4.x) where the exact dimensions/colors/copy are already extracted.
- `Current:` file(s) in `client/src/` that implement (or must be replaced by) the item.
- `Route:` the URL the frame represents (router already exists; URL = source of truth per R15S1E1).

**ID convention** continues the repo's existing `R<release>S<sprint>E<epic>` markers (code contains R1–R20; see §1.4 for the stray `R23` marker in `Marketing.jsx` which must be reconciled). New work starts at **R21**. Tag every commit/component with its ID in a leading comment, as the codebase already does.

**Checklist semantics:** `- [ ]` unchecked = gap confirmed against the mockup during this analysis (2026-07-04). Check only when the Global Definition of Done (§0.1) passes.

### 0.1 Global Definition of Done — "EXACT design" (applies to every story below)

- [ ] **Tokens only:** all colors/fonts come from `P` in `client/src/tokens.js` (PLAN.md committed palette). Zero references to the legacy `C` palette in the touched files.
- [ ] **Typography roles:** IBM Plex Sans for UI text; IBM Plex Mono for numbers, KPI values, routes, badges, micro-labels (9–11px uppercase, letter-spacing .04–.12em), timestamps, code. Page h1 21px/600 ink (19–20px on 1180-crop headers); card titles 13–15px/600; body 12.5–13px; table numbers mono 12.5px.
- [ ] **Exact geometry:** dimensions copied from the mockup's inline styles (the frame is the spec): cards radius 10 border `#e4e8ef` p20; buttons h34 radius 8 13px/600; inputs h36 radius 8 border `#d4d9e1`; badges pill h20 radius 999 mono 10px/600 uppercase; tables = CSS grid with the frame's exact `grid-template-columns`, header row h36–38 `#fafbfc` mono 10px uppercase `#64748b`, rows h40–48 border-bottom `#eef1f5`, hover `#f8fafc`.
- [ ] **Icons:** 15px stroke SVG line icons (extracted/re-drawn from the mockup frames). **No emoji glyphs anywhere** (current Shell/Sidebar use ⌂ ✦ ▦ 🔔 etc. — all must go).
- [ ] **Charts:** plain geometric SVG only (polyline, rect, dasharray donut, polygon CI band) matching the frame — no chart library.
- [ ] **Cross-links:** every element that links to another frame in the mockup navigates to the equivalent route in the app.
- [ ] **States:** hover/active/empty/loading states present where the mockup shows them (active nav = bg `#e8effc` text `#1d4ed8` w600; selected cards = 2px `#2563eb` border + blue shadow; anomaly rows tinted `#fdf9ef`).
- [ ] **Visual diff:** screen rendered at 1440px wide side-by-side with the mockup frame; spacing/color/type match. (Keep a `docs/specs/parity/` screenshot pair per frame.)
- [ ] **No regressions:** existing `data-testid` hooks preserved or migrated; `python -m pytest tests/` still green (frontend work must not break SSE flows or API contracts).

### 0.2 Canonical component specs (single source: `App Home.dc.html` #home unless noted)

| Component | Exact spec | Mockup source |
|---|---|---|
| App shell grid | `240px 1fr`; sidebar bg `#fbfcfe` border-right `#e4e8ef` | `App Home.dc.html` #home → frame root |
| Sidebar logo row | h64, 22px logo mark (dark square `#0f172a`, 3 ascending bars `#60a5fa #3b82f6 #2563eb`) + "Analyt**IQ**" 14.5px/700, border-bottom `#eef1f5` | #home → aside |
| Sidebar item | h32 radius 6 13px/500 `#47516b`, 15px SVG icon, gap 10; active bg `#e8effc` `#1d4ed8` 600 | #home → aside nav |
| Sidebar groups | top ungrouped (Home/Create/Artifacts) · `DATA` (Data/Semantic Layer/Gold Tables) · `INTELLIGENCE` (Models/Alerts/Governance) · `flex:1` spacer · border-top group (Team/Admin/Billing/Settings) + Collapse row; group label mono 9.5px/600 ls .12em `#94a3b8` p `12px 22px 4px` | #home → aside |
| Topbar | h64 white border-bottom `#e4e8ef` p 0 28: workspace button h36 bordered ("AR" 20px purple `#7c3aed` mark + "Acme Retail" + caret SVG) · centered search pill 520×36 bg `#f7f8fa` radius 999 (search SVG + "Search artifacts, metrics, sources…" + `⌘K` keycap chip white bg) · bell 34px w/ red `#dc2626` badge 15px + 2px white ring · "?" 34px bordered · avatar 34px round `#0e7490` "DK" 12px/700 | #home → topbar |
| Content area | p `28px 32px`; in-page breadcrumb mono 11px `#94a3b8` (`acme-retail / <area>`) above h1 21px/600 | #home → content |
| Notifications drawer | overlay scrim `rgba(15,23,42,.28)`; right panel 420px, shadow `-16px 0 48px rgba(15,23,42,.18)`; header + "Mark all read ✕"; tabs All/Unread·n/Mentions; mono group labels TODAY/YESTERDAY/EARLIER; rows = 28px tinted icon tile + text + time; unread bg `#f8faff` + 2px accent left border + 7px blue dot | `App Home.dc.html` #notifications |
| KPI card | radius 10 p `14px 16px`: mono 9.5px label ls .08em `#94a3b8` → mono 26px/600 ink value → 12px sub | `Governance.dc.html` #gov-overview tiles |
| Status badge | inline-flex h20 p 0 8–11 radius 999, mono 9–10px/600 ls .04em, optional 5px dot; green `#15803d`/`#e8f5ec`, amber `#b45309`/`#fdf3e3`, red `#dc2626`/`#fdeaea`, purple `#7c3aed`/`#f3eefe`, blue `#1d4ed8`/`#eff4ff`, gray `#64748b`/`#f1f5f9` | any frame |
| Grid table | container radius 10 border `#e4e8ef` overflow hidden; header + rows share the frame's `grid-template-columns` | `Data Sources.dc.html` #sources |
| Modal | radius 14, shadow `0 24px 64px rgba(15,23,42,.18)`, title bar p `16px 20px` border-bottom, footer bar `#fafbfc` | `Inspector Panels.dc.html` #share-panel |
| Dark code block | bg `#0b1220` radius 8–9 p `10–12px 12–14px` mono 10–10.5px lh 1.7 `#93c5fd`; keywords `#f472b6`, strings `#4ade80`, errors `#f87171`, timestamps `#64748b` | `Semantic Tools.dc.html` #derived |
| Auth stage | gray `#f2f4f8` stage + radial glow `radial-gradient(420px 260px at 50% 0%, rgba(37,99,235,.08), transparent 70%)`, centered logo, white card radius 14 shadow `0 12px 40px rgba(15,23,42,.08)` | `Auth.dc.html` #login |
| Marketing nav | h64 p 0 40; logo 24px + links 13.5px/500 `#47516b` (active 600 ink); "Log in" + "Start free" h36 primary | `Marketing Landing.dc.html` #landing |
| Dark marketing band | bg `#0b1220`, panel `#0f1729`, border `rgba(255,255,255,.08–.1)`, text `#e2e8f0`/`#94a3b8`, accent link `#60a5fa` | `Marketing Landing.dc.html` hero/footer |

---

## 1. Current-state audit (what exists in `client/` today, 2026-07-04)

### 1.1 Matches or near-matches (keep, then tighten)
- **Router + IA** (`App.jsx`, `routes.js`): react-router with `/app/*`, `/`, `/pricing`, `/share/:token`, workbench `/app/create/:sessionId`, role-gated admin routes. URL = source of truth. ✔ foundation exists; route surface incomplete (see per-release route lists).
- **Shell** (`components/Shell.jsx`, R15S1E2): light 240px sidebar + h64 topbar + ⌘K overlay + bell drawer — right skeleton, wrong details (see R21S2).
- **`P` tokens** (`tokens.js`, R15S2E3): exact PLAN.md palette already present. ✔
- **Newer screens partially on-language:** `Workbench.jsx`+`BuildCanvas.jsx`+`Inspector.jsx` (R16/R17), `GoldCatalog.jsx` (R17), `Team.jsx` (R18), `PublicViewer.jsx` (R19), `Billing.jsx` (R20), `Marketing.jsx` Landing+Pricing ("R23" marker). All are thin slices vs. their mockup frames.

### 1.2 Hard conflicts with the mockup (must be removed/replaced)
- **Legacy `C` palette** (`tokens.js` lines 1–22: `#2d5bd0` primary, `#f4f6fb` bg, gray-scale borders) — used ~260× across `S01–S14`, `NotFound`, `Placeholder`, and all of `components/ui.jsx`.
- **`components/Sidebar.jsx`** — dead dark-sidebar (`#0d1424`) component, unreferenced. Delete.
- **`components/ui.jsx` primitives** — Badge (radius 4, not pill), Btn (radius 6, padding-sized, weight 500 — mockup: h34/radius 8/600), etc. Every primitive needs a parity rewrite (R21S1).
- **Emoji iconography** throughout Shell/legacy screens.
- **Legacy wizard bodies `S01–S14`** — entire screens on the old design language; each is superseded by a specific mockup frame (mapped per release below).
- **Global css** (`App.jsx` style block): body bg `#f4f6fb` (mockup `#f7f8fa`), scrollbar colors from old palette.
- **Housekeeping:** ~120 `vite.config.js.timestamp-*.mjs` junk files and committed `client/dist/` builds — noise that will pollute parity diffs.

### 1.3 Missing entirely (no code)
Auth (8 frames), Onboarding (4), Activity page, Notifications page-pattern, Artifact Detail, Sharing (expired/embed/present), Data connect/wizard/import/detail frames, Governance queue/diff/rules/lineage/manifests/preagg as designed, Semantic explores/metrics/dimensions/tools as designed, Models run-detail/card/leaderboard/features/retrain as designed, Gold detail/query-contracts/data-contracts, Alerts center/create/detail, Comments inbox + invite modal, Admin overview/roles/SSO/branding/security×4/usage, Billing usage+invoices frames, Settings 4 frames, Errors 8-variant set, Marketing product/solutions/templates/security/docs.

### 1.4 Numbering note
`Marketing.jsx` carries an out-of-sequence `// R23` header comment. This plan assigns Marketing parity to **R29**; when R29 lands, update that marker (R29S1E1) so the ledger stays linear.

---

# RELEASE R21 — Design-System & Shell Parity (the foundation everything else sits on)

> Outcome: one token source, one primitive kit, one shell — all byte-matching the mockup. After R21, every later screen is assembly, not invention.

## Sprint R21S1 — Tokens, primitives, iconography

### Epic R21S1E1 — Single design-token source
**Mockup:** all files (committed language) · **Spec:** `UI_MOCKUP_ANALYSIS.md` §2 · **Current:** `client/src/tokens.js`

Requirements:
- R21S1E1-REQ1 — `P` is the only palette export; add missing tokens observed in frames: board label `#5b6478`, sidebar item `#47516b`, row-faint `#f3f5f9`, selected-row `#f8faff`, table-header bg `#fafbfc`, anomaly washes `#fdf9ef`/`#fdf6f6`, code colors (`#93c5fd #f472b6 #4ade80 #f87171`), green border `#b7e0c3`, amber border `#f2ddb0`, amber-dark text `#7a4a10`, gray bars `#cbd5e1`, auth stage `#f2f4f8`, marketing accent-on-dark `#60a5fa`.
- R21S1E1-REQ2 — Delete `C` after R21–R29 migrations; interim: mark `C` `@deprecated`, fail CI on new imports.
- R21S1E1-REQ3 — Typography scale constants (fs/weight/ls per role) so screens don't hand-type sizes.

User stories:
- [x] **R21S1E1-US1** As a developer, I import every color from one `P` object that includes all values used by any mockup frame, so no screen ever hex-codes ad hoc. *(AC: grep finds no hex literals in screens except via tokens; token names map 1:1 to §0.2 table.)*
- [x] **R21S1E1-US2** As a developer, I get lint/CI failure when importing `C`, so the legacy palette can't leak back. *(AC: ESLint `no-restricted-imports` rule on `C`.)*
- [x] **R21S1E1-US3** Chore: remove `vite.config.js.timestamp-*.mjs` + `client/dist/` from git; add to `.gitignore`. *(Keeps parity diffs clean.)*

### Epic R21S1E2 — Primitive kit rebuilt to frame specs
**Mockup:** components across all frames · **Spec:** §0.2 table + `UI_MOCKUP_ANALYSIS.md` §2 · **Current:** `client/src/components/ui.jsx` (Badge, Btn, Card, PageHeader, Steps, Sparkline, Spinner, GateDot, HealthBar, StatusBadge, Tabs, Drawer, KpiNumber, ViewToggle, DataTable)

Requirements (each names its authoritative frame):
- R21S1E2-REQ1 `Badge` → pill h20 radius 999 mono 10px/600 uppercase ls .04em, optional 5px dot, 6 tint variants (`Artifacts Library.dc.html` #artifact-detail → header badges).
- R21S1E2-REQ2 `Btn` → primary/secondary/ghost/destructive; h34 (h36 wizard, h40 hero) radius 8 13px/600; secondary = white + border `#d4d9e1` text `#334155` (`Artifacts Library.dc.html` #artifact-detail → action row).
- R21S1E2-REQ3 `Card` → radius 10 border `#e4e8ef` p20; `KpiCard` variant per §0.2 (`App Home.dc.html` #home → widget grid).
- R21S1E2-REQ4 `DataTable` → CSS-grid recipe: `columns` prop = exact fr-template string from the frame; header h36–38 bg `#fafbfc` mono 10px/600 ls .06em `#64748b`; row h40–48, border `#eef1f5`, hover `#f8fafc`, `tinted` row prop (`Data Sources.dc.html` #sources → sources table).
- R21S1E2-REQ5 `Input`/`Select`/`Textarea`/`FieldLabel` → h36 radius 8 border `#d4d9e1` 13px; label 11–12px/600 `#334155`; mono variant for technical values (`Data Import.dc.html` #rest-api → connection form).
- R21S1E2-REQ6 `Toggle` (34×20 pill, on `#2563eb` off `#cbd5e1`), `Checkbox` (14–15px radius 4, checked accent), `RadioCard` (2px accent border + `#f8faff` selected) (`Alerts.dc.html` #create-alert; `Inspector Panels.dc.html` #share-panel → visibility list).
- R21S1E2-REQ7 `Tabs` → underline style: 12.5px, active 600 `#1d4ed8` + 2px `#2563eb` border-bottom (`Artifacts Library.dc.html` #artifact-detail → 8-tab strip). `FilterChips` count-pill variant (`Governance.dc.html` #review-queue).
- R21S1E2-REQ8 `Avatar` → initials circle 24/26/28/34px; palette DK `#0e7490`, PS `#b45309`, MO `#7c3aed`, SYS `#64748b`; `AvatarStack` (`Semantic Overview.dc.html` #explores → ACCESS column).
- R21S1E2-REQ9 `ProgressBar` h5–10 track `#eef1f5` radius 999 accent fill (+stacked used/projected variant, `Billing.dc.html` #usage); `Meter` h-bar rows with mono right-aligned labels (`Models.dc.html` #model-card → feature importance).
- R21S1E2-REQ10 `CodeBlock` dark + `LogLine` coloring per §0.2 (`Semantic Tools.dc.html` #derived; `Models.dc.html` #run-detail).
- R21S1E2-REQ11 `Modal` per §0.2; `Drawer` right-420px pattern (`App Home.dc.html` #notifications).
- R21S1E2-REQ12 `Sparkline`/`Donut`/`BarRow` SVG helpers matching frame chart idioms (`App Home.dc.html` #home → Data health donut 86px).
- R21S1E2-REQ13 `SectionLabel` mono micro-label (9.5px ls .08–.12em `#94a3b8` uppercase) (`Inspector Panels.dc.html` #share-panel → VISIBILITY/DISTRIBUTE).

User stories:
- [x] **R21S1E2-US1** As a developer, I compose any mockup frame from `ui.jsx` primitives without local style overrides for the standard cases. *(AC: a Storybook-style gallery route `/app/__kit` renders every primitive next to its spec values.)*
- [x] **R21S1E2-US2** As a reviewer, I can visually diff each primitive against its authoritative frame region. *(AC: gallery ↔ frame screenshots in `docs/specs/parity/kit/`.)*
- [x] **R21S1E2-US3** As a developer, legacy `Badge/Btn/...` call sites keep compiling during migration via a temporary compat layer that renders the NEW visuals. *(AC: no screen renders old radius-4 badges after this epic, even before screens are rewritten.)*

### Epic R21S1E3 — SVG icon set (replace all emoji)
**Mockup:** `App Home.dc.html` #home → sidebar/topbar icons (15px, stroke paths); per-frame icons elsewhere · **Current:** emoji in `Shell.jsx` NAV_GROUPS, `Sidebar.jsx`, legacy screens

- R21S1E3-REQ1 — `components/icons.jsx`: Home, Create(✦→spark), Artifacts, Data(db), Semantic(◈→nodes), Gold, Models(scatter), Alerts(bell-dot), Governance(shield), Team, Admin, Billing, Settings, Search, Bell, Help, Caret, Close, Check, Warning, Info, Lock, External, Copy, Eye, Filter, Grid/List toggle glyphs — all 15px stroke, `currentColor`.
- R21S1E3-REQ2 — Logo component: 22px mark + wordmark (already correct in `Shell.jsx` `Logo` — extract to shared, add 24px marketing and 30px hub sizes).

- [x] **R21S1E3-US1** As a user, I never see an emoji glyph in chrome or screens; icons match the mockup line style. *(AC: grep for emoji ranges in `src/` returns none.)*

## Sprint R21S2 — Shell exact parity + global chrome

### Epic R21S2E1 — Sidebar parity
**Mockup:** `App Home.dc.html` #home → `<aside>` · **Spec:** §0.2 rows 1–4 · **Current:** `Shell.jsx` NAV_GROUPS + aside

Requirements:
- R21S2E1-REQ1 — Group structure exactly: ungrouped top (Home, Create, Artifacts) → `DATA` (Data, Semantic Layer, Gold Tables) → `INTELLIGENCE` (Models, Alerts, Governance) → spacer → bottom group with border-top `#eef1f5` (Team, Admin, Billing, Settings) + "Collapse" row. (Current labels "Workspace/Data/Operate/Organization" and Models-under-Data are wrong.)
- R21S2E1-REQ2 — Group label style mono 9.5px/600 ls .12em `#94a3b8`, padding `12px 22px 4px 22px` (current: 10px/.04em/10px-pad).
- R21S2E1-REQ3 — Logo row h64 p 0 20 border-bottom `#eef1f5` (current p 0 16, border `#e4e8ef`).
- R21S2E1-REQ4 — Items: gap 10, 15px SVG icons (R21S1E3), colors per spec; collapse affordance = row with icon, 12px `#94a3b8` (not full-width button with »).
- R21S2E1-REQ5 — Delete dead `components/Sidebar.jsx`.

- [x] **R21S2E1-US1** As a user, the sidebar is pixel-identical to `App Home.dc.html` #home at expanded width, including group order and active state. *(AC: side-by-side diff; active `/app` = Home highlighted bg `#e8effc`.)*
- [x] **R21S2E1-US2** As a user, collapsing to the 64px rail keeps icons centered and tooltips on hover (mockup shows only expanded; rail keeps current behavior but with new icons). 

### Epic R21S2E2 — Topbar parity
**Mockup:** `App Home.dc.html` #home → topbar · **Current:** `Shell.jsx` header

Requirements:
- R21S2E2-REQ1 — Workspace switcher: h36 bordered button = 20px `#7c3aed` "AR" mark + "Acme Retail" 13px/600 + caret SVG (current: text `acme-retail ▾`).
- R21S2E2-REQ2 — Search pill: 520×36 radius 999 bg `#f7f8fa` border `#e4e8ef`, search SVG, placeholder "Search artifacts, metrics, sources…", `⌘K` keycap chip (mono 10px, white bg, bordered) right-aligned inside the pill. Keep the existing ⌘K overlay behavior.
- R21S2E2-REQ3 — Bell: 34px radius-8 hit area, SVG bell, badge = min-width 15px h15 radius 999 bg `#dc2626` mono 9px/600 white with 2px white ring, offset top/right 3px (current: blue badge, emoji bell).
- R21S2E2-REQ4 — Help: 34px bordered square "?" 13.5px/600 `#47516b` (links to `/app/help`).
- R21S2E2-REQ5 — Avatar: 34px circle `#0e7490`, initials 12px/700 (derive 2-letter initials; demo user "DK"). Keep menu behavior.
- R21S2E2-REQ6 — Topbar padding `0 28px`, gap 16.

- [x] **R21S2E2-US1** As a user, the topbar matches the mockup topbar 1:1 (chip, pill, bell, help, avatar) on every `/app` route. *(AC: visual diff vs #home topbar.)*

### Epic R21S2E3 — Content chrome + breadcrumb pattern
**Mockup:** `App Home.dc.html` #home → content column · **Current:** `Shell.jsx` renders global breadcrumbs + `main` p `18px 32px 28px`

- R21S2E3-REQ1 — Content padding `28px 32px`; **remove Shell-level breadcrumb strip**; breadcrumb becomes part of `PageHeader` (mono 11px `#94a3b8`, format `acme-retail / <area>[ / <sub>]`) directly above h1 21px/600, actions right-aligned — per every full-shell frame.
- R21S2E3-REQ2 — Global CSS: body bg `#f7f8fa`; keep font import; scrollbar thumb `#d4d9e1`.

- [x] **R21S2E3-US1** As a user, every page opens with the mockup's header block (breadcrumb → title → actions) instead of a floating shell breadcrumb. *(AC: `PageHeader` API `{crumb, title, count, actions}` used by all rewritten screens.)*

### Epic R21S2E4 — Notifications drawer parity
**Mockup:** `App Home.dc.html` #notifications (Frame 03) · **Spec:** §4.2 Frame 03 · **Current:** `Shell.jsx` bellOpen drawer (380px, flat list)

- R21S2E4-REQ1 — 420px panel, scrim `rgba(15,23,42,.28)`, shadow per spec; header "Notifications" + "Mark all read" + ✕.
- R21S2E4-REQ2 — Tabs All / Unread·n / Mentions (chip style).
- R21S2E4-REQ3 — Time groups TODAY/YESTERDAY/EARLIER (mono 9.5px labels); rows = 28px tinted icon tile (red alert `#fdeaea`, purple mention `#f3eefe`, amber freshness `#fdf3e3`, blue build `#eff4ff`, green success `#e8f5ec`) + title/meta lines + unread dot; unread row bg `#f8faff` + 2px accent left border.
- R21S2E4-REQ4 — `DEP:` notification `kind→icon/tint` mapping + `mention` flag from `/api` (extend `api.notifications()` shape if needed).

- [x] **R21S2E4-US1** As a user, opening the bell shows the mockup drawer exactly, with my unread items grouped and highlighted. *(AC: diff vs #notifications frame; tabs filter client-side.)*

---

# RELEASE R22 — Core App Screens Parity (Home · Activity · Artifacts)

## Sprint R22S1 — Workspace home & activity

### Epic R22S1E1 — Workspace Home rebuild
**Mockup:** `App Home.dc.html` #home (Frame 01) · **Spec:** §4.2 · **Route:** `/app` · **Current:** `screens/S01_Home.jsx` (legacy `C` design — replace entirely)

Requirements:
- R22S1E1-REQ1 — Greeting row: breadcrumb `acme-retail / home` + h1 "Good morning, {firstName}"; right mono date "Fri · Jul 3, 2026 · 09:41 PT" pattern.
- R22S1E1-REQ2 — **Hero prompt bar** (signature): white, border `#c7d9f8`, radius 12, p `8 8 8 18`, shadow `0 6px 24px rgba(37,99,235,.07)`; sparkle SVG; ghost text 14.5px with example question; `⏎ build` keycap; primary Create h40 → `/app/create/new`.
- R22S1E1-REQ3 — Widget grid `repeat(3,1fr)` gap 18, all 8 widgets: Recent artifacts (span 2; 3 mini cards w/ sparkline thumbs + status dot line) · Data health (86px SVG donut "92/100" + 4 stat rows) · Active pipeline runs (progress bars + mono stage/elapsed) · Alerts firing (severity chips + ages) · Awaiting review (chips DEF/PII…) · Suggested analyses ("+" prompts) · Recently viewed · Usage & cost (ADMIN badge, mono KPI, → `/app/billing/usage`).
- R22S1E1-REQ4 — Every widget links to its area exactly as the frame does (library, governance, alerts detail, workbench, billing).
- R22S1E1-REQ5 — `DEP:` `/api` aggregate for widget data (artifacts recents, health, runs, alerts, review queue counts, usage) — compose from existing endpoints where possible.

User stories:
- [x] **R22S1E1-US1** As a user, `/app` is the mockup home: hero prompt + 8 live widgets, not the legacy wizard landing. *(AC: visual diff vs Frame 01; all widget links navigate.)*
- [x] **R22S1E1-US2** As a user, typing in the hero bar and pressing ⏎ starts a workbench session seeded with my question. *(AC: navigates to `/app/create/new?q=…`; Workbench reads the seed.)*

### Epic R22S1E2 — Recent Activity page
**Mockup:** `App Home.dc.html` #activity (Frame 02) · **Spec:** §4.2 · **Route:** `/app/activity` (new) · **Current:** none

- R22S1E2-REQ1 — Content maxw 1000: header block; filter chips All/Builds/Governance/Data/Sharing + mono date-range chip.
- R22S1E2-REQ2 — Timeline card: rows p 15 (icon column w/ connector line, actor-action-object text 13px with 600 spans + mono object refs, meta line, right mono time, avatar 26px).
- R22S1E2-REQ3 — Event types styled per frame: build, metric approval, alert fired, share created, schema drift, retrain (SYS avatar `#64748b`).
- R22S1E2-REQ4 — "Load more" secondary button centered. `DEP:` `/api/activity` feed (audit_logs projection).

- [ ] **R22S1E2-US1** As a user, `/app/activity` shows the workspace timeline exactly as Frame 02, filterable by type. *(AC: diff; chips filter; rows deep-link to their objects.)*

## Sprint R22S2 — Artifacts library & detail

### Epic R22S2E1 — Library card view + filter rail
**Mockup:** `Artifacts Library.dc.html` #library (Frame 01) · **Spec:** §4.5 · **Route:** `/app/artifacts` · **Current:** `screens/S10_Artifacts.jsx` (668 lines legacy — replace)

- R22S2E1-REQ1 — Inner split: filter rail 220px white border-right (FILTERS checkboxes: Created by me/Shared with me/Predictive/Has warnings/Public links/Needs review; divider; FOLDERS with counts) + main p `24 28`.
- R22S2E1-REQ2 — Header: h1 "Artifacts {n}" + inline filter input 260×34 + **Cards/Table segmented toggle** (active segment `#0f172a` white) + "+ New dashboard" primary.
- R22S2E1-REQ3 — Card grid `repeat(3,1fr)` gap 16: artifact card = thumbnail zone `#f7f8fa` p14 (dot strip + chart SVG) + body (title 12.5/600 + ⋯ menu; badge row TYPE chip + health dot/state + owner initials + age). Dashed "+ New dashboard from a question" ghost tile (1.5px dashed, minh 180).
- R22S2E1-REQ4 — Type chips: PREDICTIVE purple, DASHBOARD blue-gray, PUBLIC LINK blue, MONITOR cyan; health: ● HEALTHY green / 2 WARNINGS amber / NEEDS REVIEW amber.

- [ ] **R22S2E1-US1** As a user, the library shows my artifacts as mockup cards with working rail filters and view toggle. *(AC: diff vs Frame 01; filters combine; toggle switches to E2 table.)*

### Epic R22S2E2 — Library table view
**Mockup:** `Artifacts Library.dc.html` #library-table (Frame 02) · **Route:** `/app/artifacts?view=table`

- R22S2E2-REQ1 — `DataTable` columns `2fr .9fr .9fr 1fr 1fr .9fr 1fr 44px`: TITLE↓ / OWNER (avatar+name) / TYPE / DATA HEALTH (dot + mono score) / LAST REFRESHED / SHARE (workspace·private·public link) / TAGS (chips) / ⋯; rows h46 link to detail.

- [ ] **R22S2E2-US1** As a user, table view renders the exact columns/order/styling of Frame 02 and persists via the `?view=table` param. 

### Epic R22S2E3 — Artifact Detail
**Mockup:** `Artifacts Library.dc.html` #artifact-detail (Frame 03) · **Route:** `/app/artifacts/:id` (new) · **Current:** none (S10 has an inline preview only)

- R22S2E3-REQ1 — Header block (white, border-bottom): breadcrumb `artifacts / <folder> / <slug>`; h1 rename-on-hover (dashed underline affordance) + badges `● HEALTHY 96` / `PREDICTIVE` / `v14`; meta line (owner avatar+name · refreshed · schedule); actions Open in workbench / Duplicate / Export / **Share** primary.
- R22S2E3-REQ2 — 8-tab strip: Dashboard · Insights · Pipeline · Lineage · Model · Versions · Sharing · Activity — tabs route to the matching panels (R23S2) / screens.
- R22S2E3-REQ3 — Dashboard tab body: 4 KPI cards + `1.6fr 1fr` chart grid (line-vs-target SVG w/ CI polygon; region gap bar rows w/ red/green mono deltas) rendered from artifact chart data (existing `chart_data`).

- [ ] **R22S2E3-US1** As a user, opening an artifact shows the mockup detail header, tabs, and read-only dashboard. *(AC: diff vs Frame 03; Share opens R23S2E4 modal; "Open in workbench" resumes the session.)*

---

# RELEASE R23 — Flagship Parity: Create Workbench + Inspector Panels

## Sprint R23S1 — Workbench 3-column, 5-state

### Epic R23S1E1 — Workbench chrome & topbar
**Mockup:** `Create Workbench.dc.html` #create · **Spec:** §4.3 · **Route:** `/app/create/:sessionId` · **Current:** `screens/Workbench.jsx` (R16 slice, partial)

- R23S1E1-REQ1 — Workbench topbar h56 (replaces app shell on this route, as in the frame): logo→`/app`, divider, session title block (name 13px/600 + mono id + sources line), green GOVERNED badge, spacer, mono "autosaved {t} ago", Versions secondary, **Share** primary, avatar.
- R23S1E1-REQ2 — Frame body = `350px | flex | 330px` columns (chat / center / inspector), inspector only in canvas state.

- [ ] **R23S1E1-US1** As a user, a session opens in the mockup's chrome (no app sidebar), with autosave + Share/Versions in the topbar. *(AC: diff vs frame topbar.)*

### Epic R23S1E2 — Chat column parity
**Mockup:** #create → chat column · **Current:** Workbench chat (partial: chips + plan card exist)

- R23S1E2-REQ1 — Message styles: user bubble `#2563eb`/`#eef4ff` radius `13 13 4 13`; agent = 24px black logo square + `#f7f8fa` bubble radius `4 13 13 13`.
- R23S1E2-REQ2 — Verification mono lines (`✓ matched 2 sources…`), SUGGESTED chips (start), clarify block w/ confidence line + answer chips, **plan review card** (accent border, header w/ ✓ APPROVED state, rows GOAL→ACCESS each with ✎, footer Approve & Build/Edit/Cancel), build ticker mono lines, done summary + follow-up chips.
- R23S1E2-REQ3 — Composer: attachment chip row + input (+ button, ghost text, mic, 28px send).

- [ ] **R23S1E2-US1** As a user, the chat thread matches every message archetype in the frame across the whole flow. *(AC: state-by-state diff at stages 1–5.)*

### Epic R23S1E3 — Center column: 4 exclusive states
**Mockup:** #create → center · **Current:** `BuildCanvas.jsx` (build+canvas exist, start/empty missing)

- R23S1E3-REQ1 — **Start**: centered 640px; icon; h1 24px "Ask a question or choose a template"; 2×2 template cards (FORECAST/PREDICTIVE/VARIANCE/ANOMALY + example prompts); source picker row + "Use sample data" + "Pick fields visually" → `/app/semantic/field-picker`; RECENT PROMPTS list.
- R23S1E3-REQ2 — **Empty canvas** (clarify/plan): ghost 3×64px grid + caption.
- R23S1E3-REQ3 — **Building**: header (title + mono run/elapsed) + "▶ SKIP TO RESULT" pill; **9 stage chips** exact (done green ✓ / active blue+spinner / pending white); amber PII notice bar; **Live event log** card (friendly rows, mono timestamps, collapsed "Show technical detail (admin)").
- R23S1E3-REQ4 — **Canvas**: toolbar h44 (zoom cluster, fit, present→, view toggle, undo/redo, share, export, lineage→, audit→, mono "v14 · saved", presence avatars); filter bar h40 (FILTERS + chips + "+ Add filter"); dashboard: 4 KPI cards; `1.6fr 1fr` grids; **selected-section state** = 2px accent border + blue shadow + floating dark context toolbar (`Rename · Bar ▾ · Top 8 · −/+ vs target · Week ▾ · ⠿`); at-risk table w/ exact fr-template; driver bars card + "model card →" link; editable narrative card.
- R23S1E3-REQ5 — State machine parity with mockup's DCLogic: stages start→clarify→plan→building→canvas, driven by real session status (existing SSE), cumulative reveals in chat.

- [ ] **R23S1E3-US1** As a user, the center column walks the exact five mockup states as my session progresses, byte-styled per frame. *(AC: diff per state; SKIP TO RESULT works in demo mode.)*
- [ ] **R23S1E3-US2** As a user, clicking a canvas section selects it (accent outline + context toolbar) and binds the inspector Design tab to it.

### Epic R23S1E4 — Inspector column (Design tab)
**Mockup:** #create → inspector · **Current:** `Inspector.jsx` (6 tabs, R16S2E3)

- R23S1E4-REQ1 — Tab strip: Design · Data · Pipeline · Lineage · Model · Comments · Share (7, exact labels/order).
- R23S1E4-REQ2 — Design tab: "SELECTED section_xx · type" chip row; Title input; Metric/Dimension mono selects; chart-type 6-icon grid; Time grain + compare toggle; CONTRACT PASSED/SQL VALIDATED chips; "Why this chart?" expandable rationale; REPLACE WITH… suggestion grid.

- [ ] **R23S1E4-US1** As a user, the Design tab edits the selected section with the exact mockup controls. *(AC: diff; edits round-trip to canvas via existing endpoints.)*

## Sprint R23S2 — Inspector panels & overlays (7 frames)

### Epic R23S2E1 — Data/Trust contract tab
**Mockup:** `Inspector Panels.dc.html` #data-contract · **Spec:** §4.4 panel 1
- R23S2E1-REQ1 — Accordion per dashboard component (PASSED / 1 WARNING badges; expanded rows Row count/Nulls/Range/Freshness/Gates; warning card amber border + `#fdf9ef` header). `DEP:` per-component contracts API (R17S1E1 started).
- [ ] **R23S2E1-US1** Data tab lists each dashboard component's contract exactly as the panel frame.

### Epic R23S2E2 — Pipeline audit tab
**Mockup:** `Inspector Panels.dc.html` #pipeline-audit · **Spec:** §4.4 panel 2
- R23S2E2-REQ1 — Header "RUN nnnn · 9 STAGES · mm:ss / ALL GATES ✓"; stage accordions (✓ circle, duration, Input/Gate/Output rows, dark mono technical block "technical detail · admin only", **Fork from here** button; `!` repaired stage variant).
- [ ] **R23S2E2-US1** Pipeline tab renders the run audit per frame, with admin-only technical blocks honoring the role.

### Epic R23S2E3 — Insights panel
**Mockup:** `Inspector Panels.dc.html` #insights · **Spec:** §4.4 panel 3
- R23S2E3-REQ1 — "Insights · auto-detected n" header; cards = type chip (ANOMALY/TREND/CORRELATION) + mono CONF value + finding + "Investigate" primary (→ seeds a chat follow-up).
- [ ] **R23S2E3-US1** Insights tab matches the frame and Investigate posts the question into chat.

### Epic R23S2E4 — Share modal
**Mockup:** `Inspector Panels.dc.html` #share-panel (520px modal) · **Spec:** §4.4 panel 4
- R23S2E4-REQ1 — VISIBILITY radio-cards (Private / Workspace view / Workspace edit / **Public signed link** selected style); link row + Copy; DISTRIBUTE 7-tile grid (Embed→`/app/artifacts/:id/embed`, HTML, PDF, PNG, Slack, Email, Link); Advanced settings card (Expires + Scope selects, Password toggle, Allow comments/drill-through/export checkboxes, red "Revoke link").
- [ ] **R23S2E4-US1** Share (from workbench topbar, artifact detail, canvas toolbar) opens this exact modal; public link round-trips to `/share/:token`.

### Epic R23S2E5 — Version history panel
**Mockup:** `Inspector Panels.dc.html` #versions · **Spec:** §4.4 panel 5
- R23S2E5-REQ1 — Timeline rows: avatar, `v{n} · current` + time, quoted change summary, dependency chips (`sem v12 · gov v8 · model rev_loc_v2`), Restore/Compare on older rows. `DEP:` UAS versions endpoint (exists per R16S2E3 comment).
- [ ] **R23S2E5-US1** Versions tab lists session versions per frame; Restore triggers existing restore flow.

### Epic R23S2E6 — Comments drawer + inline popover
**Mockup:** `Inspector Panels.dc.html` #comments-drawer + #comment-popover · **Spec:** §4.4 panels 6–7
- R23S2E6-REQ1 — Drawer: header + Open·n/Resolved·n chips; thread cards per section anchor ("§ …"), avatar rows, actions "Ask AI to apply / Convert to request"; composer row.
- R23S2E6-REQ2 — Inline: numbered marker pin (26px, radius `50% 50% 50% 4px`, accent, white ring, blue shadow) anchored to a canvas section + floating 290px popover (comment + resolve checkbox + reply row).
- [ ] **R23S2E6-US1** Comments tab and canvas pins match both frames; resolving syncs counts. `DEP:` comments API (people layer).

---

# RELEASE R24 — Data Layer Parity (Sources · Import · Detail)

## Sprint R24S1 — Sources list, connect, wizard, import flows

### Epic R24S1E1 — Data Sources list
**Mockup:** `Data Sources.dc.html` #sources (Frame 01) · **Spec:** §4.7 · **Route:** `/app/data/sources` · **Current:** `screens/S02_Connect.jsx` (legacy wizard — replace; keep its API wiring)

- R24S1E1-REQ1 — Header "Data sources {n}" + filter input + "+ Add source" → `/app/data/connect`.
- R24S1E1-REQ2 — `DataTable` columns `1.8fr .9fr .9fr 1fr .9fr .9fr .8fr .7fr .8fr`: CONNECTION (icon+name+tech) / TYPE / STATUS (● CONNECTED/FAILING/STATIC) / HEALTH (mono score) / LAST SYNC / SLA (met·at risk·breached) / OWNER / TABLES / ISSUES; rows → source detail.

- [ ] **R24S1E1-US1** As a user, `/app/data/sources` is the mockup table over my real connections. *(AC: diff vs Frame 01; failing row styled like `wms_events`.)*

### Epic R24S1E2 — Add Source connector grid
**Mockup:** #connect (Frame 02, 700px crop) · **Route:** `/app/data/connect`

- R24S1E2-REQ1 — Header "Connect a source / All connections are read-only…" + connector search; grid `repeat(4,1fr)`: 13 tiles (Snowflake→wizard, BigQuery, Databricks SQL, Redshift, Postgres, MySQL, DuckDB, CSV/XLSX/Parquet→upload, REST API→api, Webhook→webhook, dbt→dbt, Google Sheets, dashed "Request a connector →") each icon + name + category chip.

- [ ] **R24S1E2-US1** Connector picker matches the frame; every tile routes to its flow.

### Epic R24S1E3 — Connector setup wizard (Snowflake)
**Mockup:** #wizard (Frame 03, `230px 1fr`) · **Route:** `/app/data/connect/snowflake`

- R24S1E3-REQ1 — Left step rail `#fafbfc` (✓ Credentials / **2 Scope & tables** active `#eff4ff` / 3 Freshness SLA / 4 Health check) + green "Connection verified" card.
- R24S1E3-REQ2 — Scope step: Database/Role mono selects; schema/table tree (filter row + "n of m selected"; schema checkbox rows; indented table rows w/ mono row counts; amber "PII LIKELY" badge); footer ← Back / Test connection / "Continue → Run health check".
- R24S1E3-REQ3 — Wire to existing `/api` connection+governance flow (legacy S02/S03 logic) so Continue kicks the governance run.

- [ ] **R24S1E3-US1** As a user, adding Snowflake walks the mockup wizard and lands in the existing health-check flow. *(AC: diff; SSE run still works.)*

### Epic R24S1E4 — Import flows (upload · webhook · REST · dbt)
**Mockup:** `Data Import.dc.html` #upload/#webhook/#rest-api/#dbt · **Spec:** §4.8 · **Routes:** `/app/data/upload|webhook|api|dbt`

- R24S1E4-REQ1 — **Upload** (720): mono step header + progress; file chip card; Table name mono input; schema preview table `1.4fr 1.1fr 1fr .9fr` w/ type selects, masked PII sample + amber row; 3 stat tiles; footer actions.
- R24S1E4-REQ2 — **Webhook** (680): endpoint copy row; masked signing secret + eye + "Send test event"; dark payload-schema code block; Recent events table (status 400 row + failure reason).
- R24S1E4-REQ3 — **REST** (900, 2-col): connection form (endpoint, method/auth, headers kv + add, pagination/poll, JSON path) | `#fafbfc` response preview dark block + ingest preview mini-table + "Save connector".
- R24S1E4-REQ4 — **dbt** (680): repo chip row (✓ CONNECTED · main); mapping table DBT MODEL/SEMANTIC CANDIDATE ▾/TESTS (INHERITED/FAILING chips); footer count + "Import to semantic layer".

- [ ] **R24S1E4-US1** Each import flow screen matches its frame exactly and submits through existing/new ingestion endpoints. *(AC: 4 visual diffs.)*

## Sprint R24S2 — Source & table detail

### Epic R24S2E1 — Source Detail (Health tab)
**Mockup:** `Data Detail.dc.html` #source-detail · **Spec:** §4.9 · **Route:** `/app/data/sources/:id` · **Current:** parts of `S04_TableHealth.jsx` (replace)

- R24S2E1-REQ1 — Header: 42px cyan connector tile; h1 + mono region + ● CONNECTED / n ISSUES badges; meta line; Sync now/Settings; **9-tab strip** (Overview·Tables·Health·Schema Drift·PII·Freshness·Lineage→`/app/governance/lineage`·Sync Logs·Settings).
- R24S2E1-REQ2 — Health tab: 4 KPI cards; `1.5fr 1fr` 30-day health SVG (annotated) + Open issues card (amber icon tiles + drift/null-spike rows).

- [ ] **R24S2E1-US1** Source detail matches the frame with live health data (existing dq scoring). 

### Epic R24S2E2 — Table Detail
**Mockup:** #table-detail · **Route:** `/app/data/tables/:id`

- R24S2E2-REQ1 — Header: breadcrumb `data / <source> / <table>`; mono h1 + ● HEALTHY 96 / 1 DRIFT; right mono "rows · columns · grain".
- R24S2E2-REQ2 — Body `1.7fr 1fr`: Business definition card (editable prose w/ inline mono field refs + HEALTH TREND sparkline) + column profile table `1.5fr .8fr 1.1fr .9fr .9fr` (COLUMN/NULL RATE/SEMANTIC TYPE/CONFIDENCE/PII RISK; drifted row tinted; `HIGH · MASKED`); right rail: FRESHNESS card, Downstream links card (→ metric/gold/artifacts), Quality gates chips.

- [ ] **R24S2E2-US1** Table detail matches the frame using the profiler output (`profiler.py` columns → semantic type/confidence/PII).

---

# RELEASE R25 — Governance & Semantic Parity

## Sprint R25S1 — Governance (7 frames)

### Epic R25S1E1 — Governance Overview
**Mockup:** `Governance.dc.html` #gov-overview · **Spec:** §4.10 · **Route:** `/app/governance` · **Current:** `S13_GovernanceOps.jsx` + `S03_Governance.jsx` (replace bodies; keep SSE run flow reachable from Data wizard)

- R25S1E1-REQ1 — h1 + amber "n ITEMS AWAITING REVIEW" pill; 6 clickable stat tiles (TABLES BLOCKED / REVIEW ITEMS / PII FLAGS / FRESHNESS BREACHES / SCHEMA DRIFT / CONTRACT FAILURES·7D) + span-2 "WORKSPACE HEALTH TREND" sparkline tile — each deep-linking per frame.

- [ ] **R25S1E1-US1** `/app/governance` is the mockup overview with live counts. *(AC: diff; tiles route.)*

### Epic R25S1E2 — Human Review Queue
**Mockup:** #review-queue · **Route:** `/app/governance/review`
- REQ1 filter chips w/ counts (All/Definitions/Metric conflicts/PII/Leakage/Bridge tables/Drift) + "Bulk approve / Assign ▾"; queue table `26px 2.4fr 1fr .9fr .9fr 1.1fr` (checkbox/ITEM+context line/TYPE chip/CONFIDENCE mono/ASSIGNEE avatar/inline Accept·Edit·Reject).
- [ ] **R25S1E2-US1** Review queue matches the frame over the real queue (semantic conflicts, PII flags, drift).

### Epic R25S1E3 — Definition Review diff
**Mockup:** #review-detail · **Route:** `/app/governance/review/:id`
- REQ1 header (title + CONFIDENCE · NEEDS HUMAN + queue meta); side-by-side `1fr 1fr`: CURRENT (prose card + light SQL block) vs PROPOSED on `#f8faff` (accent prose card + **dark** SQL block); EVIDENCE + FINAL DEFINITION (EDITABLE) row; footer bar `#fafbfc` "Approve — re-validate n dashboards" / Request changes / Reject + audit note.
- [ ] **R25S1E3-US1** Definition conflicts open the exact diff view; Approve triggers re-validation flow.

### Epic R25S1E4 — Data Quality Rules
**Mockup:** #rules · **Route:** `/app/governance/rules`
- REQ1 `1.6fr 1fr` master-detail: rules table (RULE/TYPE/THRESHOLD/ON toggle; selected row `#f8faff`) | editor panel `#fafbfc` (Rule type select + mono helper list, Target/Threshold mono inputs, custom-test dark SQL block "admin only · runs read-only", "Block artifacts on failure" toggle, Save/Cancel).
- [ ] **R25S1E4-US1** Rules screen matches the frame over `dq.py` rules.

### Epic R25S1E5 — Lineage graph
**Mockup:** `Governance Lineage.dc.html` #lineage · **Spec:** §4.11 · **Route:** `/app/governance/lineage`
- REQ1 1280×640 canvas: dot-grid + SVG edges; absolutely-positioned node cards 150–160px (border color by type: table default, metric `#c7d9f8`, gold `#f2ddb0`, model `#e7dbfb`, artifact `#b7e0c3`; selected = 2px accent + blue shadow); zoom/control pill; legend chip row; right 300px details panel (spec rows, IMPACT IF BROKEN, "Open table detail →").
- [ ] **R25S1E5-US1** Lineage renders the mockup graph from real lineage data with a working details panel.

### Epic R25S1E6 — Manifest versions + Pre-agg recommendations
**Mockup:** #manifests + #preagg · **Routes:** `/app/governance/manifests`, `/app/governance/preaggregations`
- REQ1 manifests table `.9fr 1.1fr 1fr 1fr .8fr` w/ expanded diff row on `#fbfcff` (+ADD/~MOD/−DEL lines, Approve/Rollback). REQ2 preagg: recommendation cards (name + HIGH VALUE chip + "hits n% of queries" + speedup/cost meter bars + Approve & materialize/Dismiss) + cost ceiling row. `DEP:` manifest.py versions endpoint; preagg recs API.
- [ ] **R25S1E6-US1** Both frames render exactly over manifest/pre-agg data.

## Sprint R25S2 — Semantic layer (9 frames)

### Epic R25S2E1 — Semantic Overview + Explores
**Mockup:** `Semantic Overview.dc.html` #sem-overview/#explores/#explore-detail · **Spec:** §4.12 · **Routes:** `/app/semantic`, `/app/semantic/explores`, `/app/semantic/explores/:id` · **Current:** `S05_Semantic.jsx` (replace)

- REQ1 overview: h1 + "MANIFEST v11 ACTIVE" + Regenerate; 6 stat tiles + span-2 ACCESS POLICIES tile, all deep-linking (metrics, dimensions, joins, conflicts→review queue, version→manifests, RLS→admin).
- REQ2 explores table `1.7fr .8fr .9fr 1.1fr .9fr .9fr 1fr` (EXPLORE+tables line/METRICS/DIMENSIONS/ACCESS avatar stack/HEALTH/CONFIDENCE/USED BY).
- REQ3 explore detail: header (breadcrumb, h1 + ● badge + mono meta, "Analyze this explore" primary → workbench) + 6-tab strip + metrics table.
- [ ] **R25S2E1-US1** All three frames render exactly over `semantic_layer.py` data.

### Epic R25S2E2 — Metrics catalog + detail + dimensions
**Mockup:** `Semantic Metrics.dc.html` 3 frames · **Spec:** §4.13 · **Routes:** `/app/semantic/metrics`, `/app/semantic/metrics/:id`, `/app/semantic/dimensions`
- REQ1 catalog: header + search + "+ Calculated metric"; 9-col table (conflict row amber w/ "×2 CONFLICT", DEPRECATED row).
- REQ2 metric detail (760): mono h2 + GOVERNED·v4 + CONF chips + "Propose change"; `1.35fr 1fr`: plain-English definition, SQL (ADMIN ONLY) dark block, 3 spec tiles | `#fafbfc` rail: LINEAGE chain, USED BY chips, TESTS, VERSIONS.
- REQ3 dimensions (380): category accordion w/ counts + mono name/confidence rows.
- [ ] **R25S2E2-US1** Metrics surfaces match all three frames; conflict row links to governance diff.

### Epic R25S2E3 — Field picker, joins, derived tables
**Mockup:** `Semantic Tools.dc.html` 3 frames · **Spec:** §4.14 · **Routes:** `/app/semantic/field-picker`, `/app/semantic/joins`, `/app/semantic/derived-tables`
- REQ1 field picker (1280×640, `280px 1fr 280px`): Dimensions pane (grouped mono checklists) | center: SELECTED chip bar, **cardinality guard amber banner**, live Preview table (mono rows, "100-row cap · nn ms"), footer "Analyze this →" h40 → workbench | Measures pane (grouped by explore; selected w/ 64×16 sparkline).
- REQ2 joins (620): rows `orders n:1 → stores · inflation ×1.0 · SAFE`; blocked m:n row amber + explainer + "Recommend bridge table"; FAN-OUT RISK row.
- REQ3 derived tables (620): header + GOVERNED chip + Publish; `1.4fr 1fr` dark SQL editor (syntax colors per §0.2) | rail (Schedule select, tags, lineage preview, "Test run · dry"); bottom mini-table (FRESH/STALE 2D/DRAFT).
- [ ] **R25S2E3-US1** All three tool frames render exactly; field-picker selections seed a workbench session.

---

# RELEASE R26 — Models, Gold & Alerts Parity

## Sprint R26S1 — Models (6 frames)

### Epic R26S1E1 — Models overview
**Mockup:** `Models.dc.html` #models-overview · **Spec:** §4.15 · **Route:** `/app/models` · **Current:** `S14_Models.jsx` (replace)
- REQ1 h1 + "Retrain center →"; 6 KPI tiles; models table `1.6fr 1fr .9fr .9fr .9fr 1fr` (model+algo·grain line / PURPOSE / STATUS chips CHAMPION·DRIFT·RUN FAILED / LAST TRAINED / ACCURACY mono / Retrain·Card actions).
- [ ] **R26S1E1-US1** Overview matches frame over `training.py` models.

### Epic R26S1E2 — Training run detail
**Mockup:** #run-detail (620) · **Route:** `/app/models/runs/:id`
- REQ1 header (run id + COMPLETED·PROMOTED + mono time/duration) + 6 tabs (Summary/Backtest windows/Candidates→leaderboard/Features→manifest/Leakage/Logs); Summary: 3 tiles, backtest bar SVG (W1–W5), **dark training log** w/ colored tokens (green mape, red dropped feature).
- [ ] **R26S1E2-US1** Run detail matches frame incl. log coloring.

### Epic R26S1E3 — Model card
**Mockup:** #model-card (760) · **Route:** `/app/models/:id`
- REQ1 header (purple icon tile, name + PROMOTED·CHAMPION + NO OVERFIT, mono card id/algo/time, Retrain); `1fr 1.1fr`: PURPOSE prose, spec grid, metric tiles MAPE/MAE/RMSE | `#fafbfc`: FEATURE IMPORTANCE meter bars, SHAP beeswarm SVG, LINKED ARTIFACTS chips.
- [ ] **R26S1E3-US1** Model card matches frame over `model_cards` data.

### Epic R26S1E4 — Leaderboard, feature manifest, retrain center
**Mockup:** `Models Ops.dc.html` 3 frames · **Spec:** §4.16 · **Routes:** `/app/models/runs/:id/leaderboard`, `/app/models/features/:id`, `/app/models/retrain`
- REQ1 leaderboard (1180, `1.7fr 1fr`): rank table (#1 CHAMPION row `#f8faff`, ±σ mono) + footer Promote/Override | `#fafbfc` trade-off scatter SVG + "WHY … WON" card + mono promotion-gate line.
- REQ2 feature manifest (720): 6-col table; leakage-dropped row red-tinted `#fdf6f6`.
- REQ3 retrain center (520): filter chips; queue rows (status dot + reason mono + "Retrain now" primary / "View logs" / "next in 2d").
- [ ] **R26S1E4-US1** All three frames match over trials/feature-manifest/retrain data (`model_trials`, `feature_manifests`).

## Sprint R26S2 — Gold & contracts (4 frames) + Alerts (3 frames)

### Epic R26S2E1 — Gold tables + detail
**Mockup:** `Gold Contracts.dc.html` #gold-tables/#gold-detail · **Spec:** §4.17 · **Routes:** `/app/gold`, `/app/gold/:id` · **Current:** `GoldCatalog.jsx` (R17 slice — extend/replace)
- REQ1 list: header w/ mono "immutable per session · versioned · warehouse: ANALYTIQ_GOLD"; 8-col table (GATES n/n ✓ · 1 GATE WARN chips, LINKED refs).
- REQ2 detail: header (amber icon tile, mono h1, "IMMUTABLE · GATES ✓", mono meta, "Query in warehouse") + 7 tabs; Quality-gates tab: 6 gate cards `repeat(3,1fr)` (name + PASS + mono evidence lines).
- [ ] **R26S2E1-US1** Both frames match over `gold_tables` + gate results.

### Epic R26S2E2 — Query & data contracts (admin)
**Mockup:** #query-contracts/#data-contracts · **Routes:** `/app/contracts/queries`, `/app/contracts/data`
- REQ1 query contracts (720): per-component table (EXPECTED SHAPE/SQL SAFETY/ROWS/TIME FILTER/RESULT SHAPE; REPAIRED row amber).
- REQ2 data contracts (560): REQUIRED FIELDS/SLA/FAILURES·30D/BLOCKING rows + mono affected sub-lines; "BLOCKING NOW" red state.
- [ ] **R26S2E2-US1** Both admin contract screens match frames (role-gated).

### Epic R26S2E3 — Alerts center / create / detail
**Mockup:** `Alerts.dc.html` 3 frames · **Spec:** §4.18 · **Routes:** `/app/alerts`, `/app/alerts/new` (modal), `/app/alerts/:id` · **Current:** Placeholder route only
- REQ1 center: type filter chips + "+ Create alert"; table `2fr .9fr .9fr 1fr .7fr` (name + mono condition sub-line, ● FIRING/OK/MUTED·7D states).
- REQ2 create modal (520): Watch select (dot + mono metric), 3-part Condition builder, frequency/owner, Deliver-to checkboxes, Mute-rules card + toggle, footer.
- REQ3 detail (720): header + Mute 24h/Edit/Delete; `1.4fr 1fr` TRIGGER HISTORY (severity value tiles −8/−6/OK) | `#fafbfc` TRIGGER LOGIC mono, SUBSCRIBERS avatars, LINKED ARTIFACTS, MUTE RULES.
- [ ] **R26S2E3-US1** Alerts area replaces the placeholder with all three frames. `DEP:` alerts CRUD API (subscriptions table exists).

---

# RELEASE R27 — Org, Admin, Billing & Settings Parity

## Sprint R27S1 — Collaboration + Admin control plane

### Epic R27S1E1 — Comments inbox, team, invite
**Mockup:** `Collaboration.dc.html` 3 frames · **Spec:** §4.19 · **Routes:** `/app/comments`, `/app/team`, `/app/team/invite` (modal) · **Current:** `Team.jsx` (R18 slice)
- REQ1 inbox (620): filter chips; rows = avatar + "name · age · § section" + text + artifact chip link + resolve checkbox.
- REQ2 team table `1.8fr 1fr 1.2fr 1fr 1fr .5fr` (MEMBER avatar+email / ROLE chips / WORKSPACE ACCESS / LAST ACTIVE / STATUS incl. INVITED·2D / ⋯); header "Team n of m seats" + "+ Invite".
- REQ3 invite modal (480): email chip input, Role + Explore access selects, Artifact access, Admin toggle card, mono seat note → billing link, footer.
- [ ] **R27S1E1-US1** All three collaboration frames match; seat math ties to Billing.

### Epic R27S1E2 — Admin overview + roles matrix
**Mockup:** `Admin.dc.html` #admin-overview/#roles · **Spec:** §4.20 · **Routes:** `/app/admin`, `/app/admin/roles` · **Current:** `S12_Platform.jsx` (replace)
- REQ1 overview (full shell): h1 + "ROLE · WORKSPACE OWNER" badge; **9 stat cards** `repeat(4,1fr)` each mono label+icon / mono-26 value / sub / deep-link (USERS→team, ROLES→#roles, INTEGRATIONS→sources, GOVERNANCE BACKLOG→queue, AUDIT EVENTS→audit, TOKEN USAGE→billing usage, SECURITY WARNINGS→secrets, SHARE LINKS→sharing-gov, SSO→sso).
- REQ2 roles matrix `2.1fr repeat(7,1fr)` (OWNER…DEVELOPER columns; SENSITIVE rows amber: View SQL expressions, Public sharing); header note "Changes apply immediately and are written to the audit log." + "+ Custom role".
- [ ] **R27S1E2-US1** Admin home + matrix match frames; matrix edits hit roles API.

### Epic R27S1E3 — SSO + branding
**Mockup:** #sso/#branding (560 crops) · **Routes:** `/app/admin/sso`, `/app/admin/branding`
- REQ1 SSO: ● ENFORCED badge; read-only gray mono inputs (IdP URL/Entity ID/X.509 truncated); DOMAINS + ✓ VERIFIED; Default role + Session lifetime; Save/Test login/OIDC ▾.
- REQ2 branding: logo dashed drop zone, accent swatches, font + theme-scope selects, **LIVE PREVIEW** twin mini-mocks (dashboard header / email digest), Save.
- [ ] **R27S1E3-US1** Both frames match (visual parity; backend stubs acceptable, flagged `DEP:`).

### Epic R27S1E4 — Admin security (4 frames)
**Mockup:** `Admin Security.dc.html` #audit/#secrets/#sharing-gov/#rls · **Spec:** §4.21 · **Routes:** `/app/admin/audit|secrets|sharing|rls`
- REQ1 audit: mono filter selects + Export CSV/JSON; table `1fr 1fr 2.2fr 1fr .9fr .7fr` w/ dot-namespaced events + WARN severity row.
- REQ2 secrets: "ADMIN · ENCRYPTED AT REST"; table w/ masked mono creds; STALE amber row; failures count; Rotate actions.
- REQ3 sharing governance (440): policy toggles, max-expiration select, domain chips, token-scope checkboxes, Save rules.
- REQ4 RLS (1180, `1fr 1.2fr`): policy list (mono rules, ON/DRAFT) | **"Test as user" simulator**: user select chip, blue summary banner, simulated mini-dashboard w/ "MARGIN HIDDEN" dashed tile + faded filtered-rows note.
- [ ] **R27S1E4-US1** All four security frames match; audit reads real `audit_logs`; RLS simulator renders policy effects.

### Epic R27S1E5 — Usage & cost analytics
**Mockup:** `Admin Usage.dc.html` #usage-analytics (1280) · **Spec:** §4.22 · **Route:** `/app/admin/usage`
- REQ1 slim header h52 ("NATIVE DASHBOARD · ADMIN" chip, blue range pill, refreshed note, Export); 4 KPI cards; combo + area charts; Top-users table (incl. "⚙ Scheduled refreshes" row); cost-by-area meter bars + month total.
- [ ] **R27S1E5-US1** Usage dashboard matches frame (data from token/usage endpoints; `DEP:` usage aggregation API).

## Sprint R27S2 — Billing + Settings

### Epic R27S2E1 — Billing 3 frames
**Mockup:** `Billing.dc.html` #plan/#usage/#invoices · **Spec:** §4.23 · **Routes:** `/app/billing`, `/app/billing/usage`, `/app/billing/invoices` · **Current:** `Billing.jsx` (R20 slice — extend)
- REQ1 plan & seats (full shell): 4-tab strip; current-plan card (plan+ACTIVE, renewal, price block, Seats meter, Tokens meter w/ used+projected, actions) + current-cycle card (line items + VISA chip); plan grid `repeat(4,1fr)` w/ CURRENT PLAN floating badge + dark Enterprise card.
- REQ2 usage: header + Export/Cost analytics→; big TOKENS USED meter card (stacked bar, hard-cap annotation) + 3 KPI cards; daily-consumption bars + BY CAPABILITY meters; **Limits & overage policy card** (threshold segmented, hard-cap toggle, radio cards) + Top consumers.
- REQ3 invoices: payment-method cards (VISA default accent card, AMEX, dashed add) + invoices table `1.1fr 1.3fr 1fr .9fr .8fr 70px` (OPEN/PAID + PDF ↓) + billing-contact + invoice-settings cards.
- [ ] **R27S2E1-US1** All three billing frames match over existing token-metering backend.

### Epic R27S2E2 — Settings 4 frames
**Mockup:** `Settings.dc.html` #profile/#preferences/#api-keys/#help · **Spec:** §4.24 · **Routes:** `/app/settings/profile|preferences|api-keys`, `/app/help` · **Current:** `S11_Account.jsx` (replace)
- REQ1 profile (520): avatar block, name/email inputs, default workspace, SSO-managed password card, NOTIFICATIONS toggles, Save.
- REQ2 preferences (520): date range + theme selects, chart-density segmented, **"Show technical detail" toggle** (drives admin-block visibility app-wide), **Prompt style select**, Save.
- REQ3 API keys (720): "+ Create key"; table (masked mono `aq_live_…`, scopes chips, expiry, Revoke).
- REQ4 help (720): search header w/ mono example queries, `190px 1fr` category nav + article cards, floating dark "Contact support" pill.
- [ ] **R27S2E2-US1** All four settings frames match; technical-detail toggle actually gates admin-only blocks (Inspector/SQL/logs).

---

# RELEASE R28 — Auth, Onboarding, Errors & Sharing Parity

## Sprint R28S1 — Auth (8 frames) + Onboarding (4 frames)

### Epic R28S1E1 — Auth stage + login/register
**Mockup:** `Auth.dc.html` #login/#register/#register-3/#register-4 · **Spec:** §4.25 · **Routes:** `/login`, `/register` (multi-step) · **Current:** none (dev auto-admin via `roles.jsx`)
- REQ1 shared `AuthStage` layout per §0.2 (gray stage + radial glow + centered logo + white card radius 14).
- REQ2 login card (420): email/password, inline "Forgot password?", primary h40, OR divider, Google/Microsoft/Enterprise SSO buttons, dashed magic-link row, footer links.
- REQ3 register step 1 (440): step dots, "Free 14-day trial. No credit card required.", 3 fields, footer nav.
- REQ4 step 3 roles: 2×2 selectable role cards (selected = accent border + ✓ badge; Business User/Analyst/Data Admin/Executive + one-liners).
- REQ5 step 4: teammate chip input + "Choose your first path" cards (sample data selected/warehouse/upload) → "Create workspace" → onboarding.
- [ ] **R28S1E1-US1** Auth flow renders all 4 frames pixel-exact and signs into `/app` (wire to `auth` helper; `DEP:` real auth endpoints optional — demo accepts any).

### Epic R28S1E2 — Forgot / verify / SSO callback states
**Mockup:** #forgot/#verify/#sso/#sso-error · **Routes:** `/forgot-password`, `/verify-email`, `/sso/callback`
- REQ1 forgot: form card + sent-state card (green icon, 30-min note, Resend). REQ2 verify: 64px icon tile + green check overlay + resend. REQ3 SSO loading: spinner + mono idp line; error variant: red glow `rgba(220,38,38,.05)`, "No workspace access", "Contact your admin", mono other-states footnote.
- [ ] **R28S1E2-US1** All four states routed and matching frames.

### Epic R28S1E3 — Onboarding wizard (4 frames)
**Mockup:** `Onboarding.dc.html` 4 frames · **Spec:** §4.26 · **Routes:** `/onboarding/workspace|start|source-health|templates`
- REQ1 branding step (card 760): mono progress header STEP 5/5 + bar; `1fr 1.1fr` form (logo drop, accent, font, TZ/currency) | live-preview mini-dashboard; footer Back/Skip/**Finish setup**.
- REQ2 start-mode: "Where's your data?" + 5 cards `repeat(5,188px)` (sample selected w/ FASTEST badge; others → import flows); mono trust footer.
- REQ3 source health: slim header ("onboarding · 2 of 3", Exit); h1 "Here's what we found in {source}"; **green safety banner** + HEALTH pill; 4 KPI tiles; tables table (PII·2 COLS, NULL SPIKE rows); sticky footer "profiling completed in n s" + Continue.
- REQ4 template picker: "Recommended for your data"; 3 cards w/ data-aware rationale + BEST MATCH; skip link → blank workbench.
- [ ] **R28S1E3-US1** Onboarding walks all four frames wired to real profiling results (existing ingestion profile API).

## Sprint R28S2 — Errors + external sharing surfaces

### Epic R28S2E1 — Error template ×8
**Mockup:** `Errors.dc.html` #errors · **Spec:** §4.27 · **Current:** `NotFound.jsx`, `roles.jsx` Forbidden (legacy styles)
- REQ1 one `ErrorState` component (340×300 pattern: tinted 46px icon tile w/ mono code, 15px/600 title, 12px explainer, action button) + 8 configured variants routed appropriately (404 catch-all, 403 role-block, token expired on `/share`, workspace not found, artifact unavailable, pipeline failed, connector failed, data access denied/RLS).
- [ ] **R28S2E1-US1** Every error state in the app uses the mockup template with cause + reassurance + recovery action.

### Epic R28S2E2 — Public viewer + expired
**Mockup:** `Artifact Sharing.dc.html` #public-viewer/#expired · **Spec:** §4.6 · **Route:** `/share/:token` · **Current:** `PublicViewer.jsx` (R19 slice — extend)
- REQ1 viewer header h54 (workspace mark + name, divider, artifact title, "DATA nH OLD" badge, mono expiry, "Request access"); viewer-filters sub-bar h42; body p `26 90` (KPIs + charts); footer "Powered by AnalytIQ".
- REQ2 expired state (620×440 card) per frame using R28S2E1 iconography.
- [ ] **R28S2E2-US1** Public viewer + expired state match frames; iframe replaced by native render if applicable.

### Epic R28S2E3 — Embed settings + present mode
**Mockup:** #embed/#present · **Routes:** `/app/artifacts/:id/embed`, `/app/artifacts/:id/present`
- REQ1 embed (1100, `1.35fr 1fr`): fake-browser live preview (chrome bar + mini dashboard + powered-by) | settings (dark iframe code block + Copy, token-scope checkboxes, expires/refresh selects, allowed-domains chips, Save).
- REQ2 present (full dark `#0b1220`, chrome-free): centered section slide on `#0f1729` panel; floating bottom control pill ("2 / 6 · Notes · ✕"); presenter-notes drawer (auto-generated narrative w/ mono highlighted figures); keyboard ←/→ paging.
- [ ] **R28S2E3-US1** Embed + present match frames; present reachable from canvas toolbar and artifact detail.

---

# RELEASE R29 — Marketing Site Parity (7 pages)

> Reconcile the stray `// R23` marker in `Marketing.jsx` to R29 IDs when touching those files (§1.4).

## Sprint R29S1 — Shared marketing chrome + Landing/Product/Pricing

### Epic R29S1E1 — Marketing nav + footer components
**Mockup:** `Marketing Landing.dc.html` #landing → nav/footer · **Spec:** §4.28 · **Current:** inline in `Marketing.jsx`
- REQ1 `MarketingNav` per §0.2 (active-page state; links to all 7 routes; Log in / Start free → `/login`, `/register`).
- REQ2 `MarketingFooter` dark 5-column + legal bar "© 2026 … SOC 2 Type II · GDPR · ISO 27001".
- [ ] **R29S1E1-US1** All marketing pages share these two components, matching the frame.

### Epic R29S1E2 — Landing `/`
**Mockup:** #landing (7 sections) · **Current:** `Marketing.jsx` Landing (thin)
- REQ1 dark hero `1.02fr .98fr` (kicker/h1 52px/subhead/CTAs/mono proof row) + **live-build preview window** (title bar, user bubble, mono ticker, dark mini-dashboard, follow-up row); REQ2 "WHY NOT NORMAL BI?" comparison (✕ card vs ✓ accent card); REQ3 4 value-prop cards band; REQ4 6 use-case tiles + "Browse all templates →"; REQ5 dark trust strip; REQ6 CTA band w/ mono terminal tease; REQ7 footer.
- [ ] **R29S1E2-US1** Landing matches all 7 sections of the frame.

### Epic R29S1E3 — Product `/product`
**Mockup:** `Marketing Product.dc.html` #product · **Spec:** §4.29 · **Route:** new
- REQ1 hero ("A governed pipeline, not a chatbot"); **sticky 5-node stepper** anchor-linking stages; 5 alternating `1fr 1.1fr` stage sections w/ exact visuals (plan card / dark validation terminal / gold gate card + row-band SVG / leaderboard card / artifact mock); dark CTA band.
- [ ] **R29S1E3-US1** Product page matches the frame incl. sticky stepper behavior.

### Epic R29S1E4 — Pricing `/pricing`
**Mockup:** `Marketing Pricing.dc.html` #pricing · **Spec:** §4.32 · **Current:** `Marketing.jsx` Pricing (thin)
- REQ1 hero + Monthly/Annual −20% pill toggle; 4 plan cards (MOST POPULAR accent card, dark Enterprise); comparison table `1.6fr 1fr 1fr 1fr 1fr`; FAQ accordion (first item expanded).
- [ ] **R29S1E4-US1** Pricing matches the frame; toggle switches displayed prices.

## Sprint R29S2 — Solutions/Templates/Security/Docs

### Epic R29S2E1 — Solutions `/solutions/:persona`
**Mockup:** `Marketing Solutions.dc.html` #solutions · **Spec:** §4.30
- REQ1 one template, 6 persona routes (executives/data-teams/operations/finance/sales/customer-success); persona tab pills; hero `1.05fr .95fr` w/ dark digest card; STARTING POINTS 3 cards; dark quote band; 3 feature callouts; gray CTA band. Persona content configurable (executives copy from frame; others parameterized).
- [ ] **R29S2E1-US1** All 6 persona routes render the template; executives matches the frame verbatim.

### Epic R29S2E2 — Templates `/templates`
**Mockup:** `Marketing Templates.dc.html` #templates · **Spec:** §4.31
- REQ1 `250px 1fr`: CATEGORY/TYPE filter rail + h1 "Templates 10" + search + 10 template cards (unique thumb SVG each, mono `CATEGORY · TYPE` tags).
- [ ] **R29S2E2-US1** Gallery matches frame; filters work client-side.

### Epic R29S2E3 — Security `/security`
**Mockup:** `Marketing Security.dc.html` #security · **Spec:** §4.33
- REQ1 hero + trust badge chips; `250px 1fr` sticky jump-nav + 8 claim cards (tinted icon tiles, exact titles/copy).
- [ ] **R29S2E3-US1** Security page matches frame; jump nav tracks scroll.

### Epic R29S2E4 — Docs `/docs`
**Mockup:** `Marketing Docs.dc.html` #docs · **Spec:** §4.34
- REQ1 docs nav h58 (logo "AnalytIQ Docs", 380px search, app link, Start free); `260px 1fr 220px` (nav tree w/ 3 groups / Quickstart article w/ h2 anchors + dark terminal + amber note + CTAs + helpful-footer / ON THIS PAGE TOC w/ 2px active border).
- [ ] **R29S2E4-US1** Docs page matches frame; Help Center article cards (R27S2E2) link here.

---

## Appendix A — Traceability matrix (mockup file → release/epic)

| Mockup file | Frames | Epic(s) |
|---|---|---|
| Index.dc.html | hub | — (dev aid only; no app equivalent required) |
| App Home.dc.html | #home / #activity / #notifications | R22S1E1 / R22S1E2 / R21S2E4 |
| Create Workbench.dc.html | #create (5 states) | R23S1E1–E4 |
| Inspector Panels.dc.html | 7 panels | R23S2E1–E6 (Design tab in R23S1E4) |
| Artifacts Library.dc.html | #library / #library-table / #artifact-detail | R22S2E1 / E2 / E3 |
| Artifact Sharing.dc.html | #public-viewer / #expired / #embed / #present | R28S2E2 / E2 / E3 / E3 |
| Data Sources.dc.html | #sources / #connect / #wizard | R24S1E1 / E2 / E3 |
| Data Import.dc.html | #upload / #webhook / #rest-api / #dbt | R24S1E4 |
| Data Detail.dc.html | #source-detail / #table-detail | R24S2E1 / E2 |
| Governance.dc.html | #gov-overview / #review-queue / #review-detail / #rules | R25S1E1 / E2 / E3 / E4 |
| Governance Lineage.dc.html | #lineage / #manifests / #preagg | R25S1E5 / E6 / E6 |
| Semantic Overview.dc.html | #sem-overview / #explores / #explore-detail | R25S2E1 |
| Semantic Metrics.dc.html | #metrics-catalog / #metric-detail / #dimensions | R25S2E2 |
| Semantic Tools.dc.html | #field-picker / #joins / #derived | R25S2E3 |
| Models.dc.html | #models-overview / #run-detail / #model-card | R26S1E1 / E2 / E3 |
| Models Ops.dc.html | #leaderboard / #features / #retrain | R26S1E4 |
| Gold Contracts.dc.html | #gold-tables / #gold-detail / #query-contracts / #data-contracts | R26S2E1 / E1 / E2 / E2 |
| Alerts.dc.html | #alerts-center / #create-alert / #alert-detail | R26S2E3 |
| Collaboration.dc.html | #comments-inbox / #invite / #team | R27S1E1 |
| Admin.dc.html | #admin-overview / #roles / #sso / #branding | R27S1E2 / E2 / E3 / E3 |
| Admin Security.dc.html | #audit / #secrets / #sharing-gov / #rls | R27S1E4 |
| Admin Usage.dc.html | #usage-analytics | R27S1E5 |
| Billing.dc.html | #plan / #usage / #invoices | R27S2E1 |
| Settings.dc.html | #profile / #preferences / #api-keys / #help | R27S2E2 |
| Auth.dc.html | 8 frames | R28S1E1 / E2 |
| Onboarding.dc.html | 4 frames | R28S1E3 |
| Errors.dc.html | 8 variants | R28S2E1 |
| Marketing Landing.dc.html | #landing | R29S1E1 / E2 |
| Marketing Product.dc.html | #product | R29S1E3 |
| Marketing Pricing.dc.html | #pricing | R29S1E4 |
| Marketing Solutions.dc.html | #solutions ×6 routes | R29S2E1 |
| Marketing Templates.dc.html | #templates | R29S2E2 |
| Marketing Security.dc.html | #security | R29S2E3 |
| Marketing Docs.dc.html | #docs | R29S2E4 |

## Appendix B — Legacy retirement ledger (delete when superseded)

- [x] `components/Sidebar.jsx` → deleted (R21S1E3/R21S2E1, 2026-07-04)
- [ ] `tokens.js` `C` palette → delete after R28 (last `C` consumer gone)
- [ ] `S01_Home.jsx` → superseded R22S1E1 · `S10_Artifacts.jsx` → R22S2 · `S02_Connect.jsx` → R24S1 · `S04_TableHealth.jsx` → R24S2 · `S03_Governance.jsx` (run view folds into R24S1E3 wizard + R25S1E1) · `S13_GovernanceOps.jsx` → R25S1 · `S05_Semantic.jsx` → R25S2 · `S14_Models.jsx` → R26S1 · `S12_Platform.jsx` → R27S1 · `S11_Account.jsx` → R27S2E2 · `S06/S07/S08/S09` wizard bodies → absorbed by Workbench states (R23S1E3); delete routes `/app/create/quick|confirm|run|result` from `routes.js` and `WorkbenchGuard` fall-through
- [ ] `Placeholder.jsx` → unused after R26S2E3 (alerts) — delete
- [ ] `routes.js` `SCREEN_ROUTES` numeric map + `context.jsx` `screen` mirror → remove once no screen reads `useApp().screen`
