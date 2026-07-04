# 11 — Create Workbench (/app/create): Mockup vs Current UI

Mockup source: `Create Workbench.dc.html` (line numbers reference that file) — one screen, **5 interactive states**: 1 Prompt → 2 Clarify → 3 Plan → 4 Building → 5 Canvas
Reference screenshots (in `screenshots/`): `11-create-mockup-prompt.png`, `11-create-mockup-building.png`, `11-create-mockup-canvas.png`, `11-create-current-prompt.png`, `11-create-current-canvas.png`
Status: The skeleton of the loop EXISTS (prompt → plan → build → dashboard, chat column, inspector tabs) but nearly every surface is a rough draft of the mockup: Clarify state absent, Building state has no live event log/PII banner/run metadata, Canvas lacks the toolbar/filters/formatting/tables/narrative, and the inspector shows raw debug values instead of editing controls.

---

## ✅ KEEP (intentional deviation from mockup, per Leo)

**The collapsed icon-only sidebar in the current workbench stays.** The mockup removes the sidebar entirely inside the workbench; the current build collapses it to icons — this is the preferred behavior. Everything else below should move toward the mockup.

Also already present and roughly right: chat column with user bubble + plan card + Approve & Build, GOVERNED pill, autosaved stamp, stage pills that complete green, KPI card row, CONTRACT ✓ pills on sections, inspector tab strip, "Why this chart?" explainer.

---

## 1. Session topbar — PARTIAL (lines 48–64)

Current: keeps the workspace topbar (search bar) and pushes GOVERNED/autosaved/"Open artifact ↗" into the canvas header.
Mockup: dedicated 56px session topbar:
```html
<span style="font-size:13.5px;font-weight:600;color:#0f172a">Q3 revenue target risk</span>
<span style="font-family:'IBM Plex Mono',monospace;font-size:9.5px;color:#94a3b8">session · a4f2-9c · sample_retail + q3_targets.xlsx</span>
<span style="...background:#e8f5ec;color:#15803d">● GOVERNED</span>
<!-- right: "autosaved 12s ago" mono · Versions (outlined 32px) · Share (filled #2563eb) · avatar -->
```
Missing in current: **session title + mono session metadata**, **Versions button**, **Share button** (mockup has both at top right of every state).

## 2. State 2 · Clarify — MISSING ENTIRELY (lines 84–106)

Current flow jumps straight from prompt to "PROPOSED PLAN". Mockup inserts one clarifying question with tappable chips before the plan:
```html
<span style="font-size:13px;color:#0f172a">How should I define <strong>"miss the target"</strong>? This changes which locations get flagged.</span>
<span style="font-family:'IBM Plex Mono',monospace;font-size:9.5px;color:#94a3b8">● confidence 0.62 — worth confirming</span>
<!-- chips: "Any amount below" · ">5% below" · ">10% below" (blue outlined 27px) · "Not sure" (dashed) · "Use recommended" (filled #2563eb) -->
```
Also missing: mono status lines under the user bubble (`✓ matched 2 sources · orders, q3_targets.xlsx` / `✓ resolved metric · net_revenue v4 (governed)`, 10.5px, checks `#15803d`) and the center-canvas dashed skeleton with "Your dashboard will assemble here once the plan is approved" (lines 222–233).

## 3. State 3 · Plan card — PARTIAL (lines 108–136)

Current has GOAL/METRIC/GRAIN/TIME RANGE/OUTPUT/HORIZON/ACCESS + Approve & Build. Gaps vs mockup:

- Header should be **"Review your plan"** on `#f8faff` with blue card border `#c7d9f8` (current: "PROPOSED PLAN" plain label), gaining a `✓ APPROVED` pill after approval (current shows separate chat bubbles "Plan approved…" / "DONE Build complete" — keep, but add the pill).
- Missing rows: **DIMENSIONS** (`location, region, week`), **FORECAST** (`8-week horizon · backtested`), **SOURCES** (`sample_retail (5 tables) · q3_targets.xlsx`).
- **Every row gets an ✎ edit affordance** (`color:#94a3b8;cursor:pointer`) — current rows are static.
- METRICS values render as mono blue chips: `<span style="font-family:'IBM Plex Mono',monospace;font-size:11px;color:#1d4ed8">net_revenue</span>`.
- Footer: Approve & Build (filled) + **Edit plan** (outlined) + **Cancel** (right-aligned gray) — current has only Approve & Build.
- ACCESS copy: mockup "2 PII columns excluded (masked)" pattern; current "No PII restrictions apply to this plan" is fine when true.

## 4. State 4 · Building — PARTIAL, most substance missing (lines 235–276)

Current: stage pills only. Mockup adds, in order:

1. **Header block**: "Building your dashboard" (16px/600) + mono run metadata `run · 8842 · started 09:40:12 · elapsed 01:47`, and right-aligned **`▶ SKIP TO RESULT`** pill (`border:1px solid #c7d9f8;background:#f8faff;color:#1d4ed8;mono 10.5px`).
2. **Stage pills — states and stages differ.** Mockup has 9 stages (Understanding request · Validating metrics · Planning dashboard · Building data · Running queries · Generating charts · Training model · Reviewing output · Assembling dashboard) with THREE visual states: done green (`background:#e8f5ec;border:1px solid #b7e0c3;color:#15803d` + ✓), **active blue with SVG spinner** (`background:#eff4ff;border:#c7d9f8;color:#1d4ed8`), pending gray (`background:#fff;border:#e4e8ef;color:#94a3b8`). Current has 7 different stage names, all-done-green only, with a lightning glyph. Align names + add active/pending states.
3. **Amber PII banner** (current has it? — screenshot shows it in mockup only; if data has masked columns show):
```html
<div style="display:flex;align-items:center;gap:11px;background:#fdf3e3;border:1px solid #f2ddb0;border-radius:9px;padding:11px 14px">
  <!-- warning svg #b45309 --><span style="font-size:12.5px;color:#7a4a10"><strong>2 columns masked.</strong> customers.email and customers.zip4 are excluded pending PII review — results are unaffected.</span>
</div>
```
4. **Live event log card — MISSING** (lines 260–274): header "Live event log" + mono "friendly view"; timestamped rows (mono 10.5px time gutter, 56px wide), human copy with mono inline identifiers (`GOLD.REV_LOC_WK_V1`, `q3_targets.xlsx`, `LightGBM (MAPE 4.1%)`); current/latest row in blue with blinking `▌`; footer collapsible **"Show technical detail (admin)"**.
5. Chat column simultaneously streams mono checkmarks: `✓ plan approved · pipeline started` / `✓ gold table · GOLD.REV_LOC_WK_V1` / `✓ 6 queries validated · read-only · 412ms` / `● training forecast model · window 3/5▌`.

## 5. State 5 · Canvas — PARTIAL, heavy gaps (lines 278–379)

Current has: KPI row, one line chart with CONTRACT ✓, second collapsed section. Missing/wrong:

1. **Canvas toolbar (44px) — MISSING**: zoom `− 100% +`, fit, present ▶, device toggle (desktop/tablet/mobile segmented control, active dark), refresh, export, download, share, comment, lineage, audit-log icons; right side mono `v14 · saved` + **stacked collaborator avatars** (22px, overlapping −7px, 2px white borders).
2. **Filters bar (40px) — MISSING**: mono `FILTERS` label + removable blue chips + dashed add:
```html
<span style="display:inline-flex;align-items:center;gap:6px;height:24px;padding:0 10px;border-radius:999px;background:#eff4ff;border:1px solid #c7d9f8;color:#1d4ed8;font-family:'IBM Plex Mono',monospace;font-size:10.5px">Q3 2026<span style="color:#94a3b8;cursor:pointer">✕</span></span>
<span style="...border:1px dashed #d4d9e1;color:#64748b">+ Add filter</span>
```
3. **Data formatting is raw.** Current: "TOTAL (WINDOW) 46,139", "Timeseries Ci", "dimension_breakdown". Mockup: human titles ("Revenue vs target · weekly, all locations") and formatted values (`$4.82M`, `−6.2% vs target` in red `#dc2626`, `7 / 42` amber, `4.1%` green). KPI card pattern: mono label 9px letterspaced → mono 22px value → mono 10.5px colored delta caption. **Section titles must never leak snake_case.**
4. **KPI semantics**: mockup 4 cards each carry a colored context line (red/amber/green/gray). Current cards have value only.
5. **Main chart anatomy**: y-axis mono labels, gridlines, actual (solid `#2563eb` 2.5px) vs forecast (dashed) vs target (gray dashed), CI polygon `rgba(37,99,235,.08)`, "today" divider line + label, legend row (`— actual · -- forecast ±CI · -- target`).
6. **Section selection pattern — MISSING**: selected card gets `border:2px solid #2563eb;box-shadow:0 8px 24px rgba(37,99,235,.13)` + mono "selected" tag + dashed-underline editable title + **floating dark toolbar** hovering above (lines 333–340): `background:#0f172a;border-radius:8px` with Rename · Bar ▾ · Top 8 −/+ · vs target ● · Week ▾ · ⠿ drag handle.
7. **At-risk locations table — MISSING** (lines 352–360): header row mono letterspaced on `#fafbfc`; rows 38px with mono numerics; GAP column colored (`−11.8%` red / `−7.4%` amber); RISK pills HIGH (`#fdeaea`/`#dc2626`) / MED (`#fdf3e3`/`#b45309`); header meta "7 rows".
8. **"What's driving the forecast" — MISSING** (lines 362–371): horizontal feature bars in a blue ramp (`foot_traffic` 88% `#2563eb` → `weather_idx` 31% `#93c5fd`), mono right-aligned labels, footer link `model card · rev_loc_v2 →`.
9. **Narrative card — MISSING** (lines 372–375): title + mono "editable" dashed tag; body 12.5px with mono inline numbers and bolded region names.
10. **Diverging bar section** ("Target gap by region"): colored by severity (red/amber/blue), mono value labels signed and colored.

## 6. Inspector — WRONG CONTENT (lines 383–449)

Current tabs: Design · Data · Pipeline · Insights · Share · Vers(ions). Mockup tabs: **Design · Data · Pipeline · Lineage · Model · Comments · Share** (Design active with `border-bottom:2px solid #2563eb`). Versions belongs in the session topbar, not a tab; add Lineage/Model/Comments.

Current Design tab shows raw read-only key/values (`SECTION timeseries_ci / MARK line / FORMAT currency`) — that's debug output, not the mockup's editing panel. Required contents in order:
1. `SELECTED` mono label + chip `section_04 · bar` (`#eff4ff`/`#1d4ed8`).
2. **Title** text input (32px).
3. **Metric / Dimension** dropdowns side-by-side (mono values, metric in blue).
4. **Chart type picker**: 6 icon tiles 34px (bar/line/area/scatter/treemap/table), selected `border:2px solid #2563eb;background:#f8faff`.
5. **Time grain** dropdown + **Compare vs target** toggle (34×20 blue pill, mono green "ON").
6. Validation pills: `CONTRACT PASSED` · `SQL VALIDATED` (green mono).
7. Collapsible **"Why this chart?"** — keep current copy idea but use mockup's plain-English rationale ("Gap-to-target is a signed comparison across 5 categories — a diverging bar makes the over/under split legible at a glance."). **Remove the internal spec citation "(§5.3)" — internal references must not be user-visible.**
8. **REPLACE WITH…** suggestion cards (2-up, mini SVG preview + label: "Heatmap by state", "Table + sparklines") — current has similar cards; style per mockup (`border:1px solid #e4e8ef;border-radius:8px;padding:9px 10px`, hover blue).

## 7. Chat column polish (lines 68–174)

- Agent messages need the 24px dark logo tile beside bubbles (`border-radius:4px 13px 13px 13px`).
- Input bar: attachment chip row (`q3_targets.xlsx ✕` mono on `#f1f5f9`) + "+" button + placeholder "Ask a follow-up or refine…" + paperclip + 28px blue send square. Current placeholder "Ask a business question..." + Build button — after the first build the input becomes a refine box, per mockup.
- Done state: agent summary bubble with bold findings + follow-up chips ("Why is Northeast down?", "Add promo overlay") — current "Build complete." bubble should become this.

## 8. Prompt state (from earlier review — still applies)

Quoted-question template cards with color-coded eyebrows (FORECAST `#2563eb` · PREDICTIVE `#7c3aed` · VARIANCE `#b45309` · ANOMALY `#0e7490`), sparkle heading "Ask a question or choose a template", source selector row (`● sample_retail · snowflake` + "Use sample data" + "Pick fields visually"), SUGGESTED chips in chat column, RECENT PROMPTS list.

---

## Priority order

1. Clarify state (chips + confidence) — the "asks once instead of guessing" behavior is a headline product claim.
2. Canvas: human formatting (no snake_case titles, currency/percent values), toolbar, filters bar, selection + floating toolbar.
3. Building: live event log, run metadata, active/pending pill states, SKIP TO RESULT, PII banner.
4. Inspector: replace debug values with editing controls; fix tab set; remove §5.3 internal citation.
5. Canvas content sections: at-risk table, feature importance, narrative.
6. Plan card: missing rows, ✎ edits, Edit plan/Cancel, APPROVED pill.
7. Session topbar (title, session meta, Versions, Share). Keep collapsed sidebar.
