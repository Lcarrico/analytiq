# 13 — Artifacts Library & Detail: Mockup vs Current UI

Mockup source: `Artifacts Library.dc.html` (line numbers reference that file) — 3 screens: Library card view /app/artifacts · Table view ?view=table · Artifact Detail /app/artifacts/:id
Reference screenshots (in `screenshots/`): `13-artifacts-mockup.png` (all 3 mockup frames), `13-artifacts-current-cards.png`, `13-artifacts-current-table.png`, `13-artifacts-current-detail.png`
Status: All three surfaces exist but diverge structurally: "Cards" view renders as a list with a 14-button action row per item; the filter rail/folders are missing; the table lacks half the mockup columns; detail page has no tabs and leaks model internals onto the main view.

---

## 1. Library — card view (lines 25–189)

### Structural gaps

1. **Filter rail (220px) — MISSING**: mono `FILTERS` label + checkboxes (Created by me ✓, Shared with me, Predictive, Has warnings, Public links, Needs review) + divider + `FOLDERS` list with mono counts (Revenue 8 · Operations 5 · Customer 4 · Finance 6, active folder blue/600).
2. **"Cards" view isn't cards.** Current renders a vertical list of rows. Mockup: 3-column grid of preview cards:
```html
<a style="background:#fff;border:1px solid #e4e8ef;border-radius:11px;overflow:hidden" style-hover="border-color:#c7d9f8;box-shadow:0 10px 28px rgba(15,23,42,.08)">
  <div style="background:#f7f8fa;border-bottom:1px solid #eef1f5;padding:14px"><!-- skeleton KPI bars + chart SVG --></div>
  <div style="padding:13px 15px">
    <span style="font-size:13.5px;font-weight:600;color:#0f172a">Q3 Revenue Target Risk</span><span>⋯</span>
    <!-- pills row: type + health, right: owner avatar 20px + mono age -->
  </div>
</a>
```
3. **Per-row action-button overload.** Current shows ~14 buttons per item (Open, Preview, Insights, Link, Embed, Activity, Monitor, Opportunities, Replay, Explain, Provenance, Share, Schedule, ✕). Mockup exposes ZERO inline buttons — the whole card opens the artifact; everything else lives behind the **⋯ overflow menu**. This is the single biggest cleanup on this page.
4. **Pill system**: type pills PREDICTIVE (`#f3eefe`/`#7c3aed`) · DASHBOARD (`#eff4ff`/`#1d4ed8`) · PUBLIC LINK (`#e0f3f8`/`#0e7490`); health pills `● HEALTHY` green · `● 2 WARNINGS` amber · `● NEEDS REVIEW` red. Current has PREDICTIVE + `DQ PASS` + bare score numbers ("82") — map DQ to the health pill vocabulary and put the score in the pill (table view) or keep ● HEALTHY (cards).
5. **Dashed "new" card** at end of grid: `border:1.5px dashed #d4d9e1; + icon tile; "New dashboard from a question"` → links to workbench.
6. **Header**: mockup `Artifacts <mono>23</mono>` + breadcrumb; toolbar = inline filter input (260px, "Filter by name, tag, owner…"), Cards/Table segmented toggle (active dark `#0f172a`), single `+ New dashboard` primary button.
7. **Extra toolbar buttons not in mockup**: "ROI report", "Sandbox", "Health dashboard" — either remove or relocate (not part of this screen's design). "New analysis" → "New dashboard".
8. **Search leaks internals**: placeholder "Deep search (titles + metric names, FTS)…" in mono — replace with the standard filter input; "FTS" is implementation vocabulary. Also two stacked search inputs + two dropdowns duplicate the rail filters — collapse into rail + single filter input.
9. Header copy: "Workspace artifacts / 5 saved analyses · shareable with your team" → "Artifacts" + count per mockup.

## 2. Library — table view (lines 191–239)

Current columns: TITLE · TYPE · DQ · MAPE · OWNER(email) · CREATED(raw timestamp). Mockup columns:

```
TITLE ↓ · OWNER · TYPE · DATA HEALTH · LAST REFRESHED · SHARE · TAGS · ⋯
grid-template-columns: 2fr .9fr .9fr 1fr 1fr .9fr 1fr 44px · rows 46px · header 38px mono on #fafbfc
```
- **TITLE** sortable with blue ↓ indicator.
- **OWNER**: 22px avatar + first name (current: raw email `analyst@acme.com`).
- **TYPE**: mono lowercase colored text (`predictive` purple, `dashboard` blue, `monitor` teal).
- **DATA HEALTH**: scored pill `● 96` green / `● 81` amber / `● 64` red (thresholds by color) — current has un-scored `PASS` pill + separate bare MAPE column.
- **LAST REFRESHED**: relative mono (`2h ago`, `1d ago`) — current shows raw `2026-07-04 21:43:28` timestamps.
- **SHARE**: mono `workspace` / `private` / `public link` (teal when public) — MISSING in current.
- **TAGS**: small mono chips (`rev` `q3` on `#f1f5f9`) — MISSING in current.
- **⋯ row menu** — MISSING in current.

## 3. Artifact Detail (lines 241–307)

Current: standalone preview page (title + CENTERPIECE tag, Export, View all artifacts, 3 KPI cards, one big chart, mono internals footer). Mockup structure:

### Header block (lines 245–263)
```html
<span style="font-family:'IBM Plex Mono',monospace;font-size:10.5px;color:#94a3b8">artifacts / revenue / <span style="color:#334155">q3-revenue-target-risk</span></span>
<h1 style="margin:0;font-size:20px;font-weight:600;color:#0f172a;cursor:text" style-hover="border-color:#c7d9f8">Q3 Revenue Target Risk</h1>  <!-- editable, dashed underline on hover -->
<!-- pills: ● HEALTHY 96 (green) · PREDICTIVE (purple) · v14 (blue) -->
<div>DK avatar · Dana Kim · refreshed 2h ago · daily 06:00 PT</div>
```
Actions: **Open in workbench** · **Duplicate** · **Export** · **Share** (filled). Current has Export + "View all artifacts" only — missing Open in workbench, Duplicate, Share; missing health/version pills, owner/refresh line, breadcrumb, editable title.

### Tab strip — MISSING entirely (lines 264–273)
`Dashboard (active, blue underline) · Insights · Pipeline · Lineage · Model · Versions · Sharing · Activity` — 12.5px, `padding:9px 12px`. The current page's footer internals belong under these tabs:
- `MODEL ID xgb-locrev-v1`, `FEATURE MANIFEST 34 features` → **Model** tab
- `DQ GATE STATUS` → **Pipeline** tab
- `SOURCE LINEAGE fact_revenue x dim_loc` → **Lineage** tab
Remove the raw strip from the Dashboard tab; `fact_revenue x dim_loc` and `xgb-locrev-v1` are internals that shouldn't sit on the default view. Also remove/rename the `CENTERPIECE` tag (internal layout vocabulary).

### Dashboard tab content (lines 275–305)
4 KPI cards (mono 22px values with colored context lines) + 2-col grid: "Revenue vs target · weekly" line chart (forecast split, CI band, target dashed) and "Target gap by region" diverging bars. Current has KPI cards (good, formatted!) + one chart; add the second section and match the KPI context-line color coding.

---

## Priority order

1. Card view: replace list with 3-col card grid; collapse the 14-button row into card click + ⋯ menu.
2. Add filter rail + folders; single filter input; remove "Deep search/FTS" leak.
3. Table view: add DATA HEALTH score pills, SHARE, TAGS, relative times, avatar+name owners, sort indicator, ⋯.
4. Detail: add tab strip; move model/lineage internals off the main view; add Open in workbench/Duplicate/Share; pills + refresh line + breadcrumb.
5. Decide fate of ROI report / Sandbox / Health dashboard buttons (not in mockup).
