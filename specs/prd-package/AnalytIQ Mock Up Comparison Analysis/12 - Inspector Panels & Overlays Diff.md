# 12 — Inspector Panels & Overlays: Mockup vs Current UI

Mockup source: `Inspector Panels.dc.html` (line numbers reference that file) — **7 panels**: Data/Trust contract · Pipeline audit · Insight panel · Share modal · Version history · Comments drawer · Inline comment popover
Reference screenshots (in `screenshots/`): `12-inspector-mockup-1.png` (Data, Pipeline, Insights, Share), `12-inspector-mockup-2.png` (Versions, Comments, Popover), `12-inspector-current-design.png`, `12-inspector-current-data.png`, `12-inspector-current-pipeline.png`, `12-inspector-current-insights.png`, `12-inspector-current-share.png`, `12-inspector-current-versions.png`
Status: All six current tabs exist but each is a raw/debug version of its mockup panel; Comments (drawer + inline popover) missing entirely; plus one reported layout bug.

---

## 🐛 BUG (user-reported): tab strip overflows the panel

The "Versions" tab renders as "Versi…" **sticking out past the panel edge**. Fixes, in combination:
1. Use the mockup tab spec — it fits 6 tabs in a 340px panel: `padding:7px 8px; font-size:11px; gap:2px`, active `font-weight:600;color:#1d4ed8;border-bottom:2px solid #2563eb`.
2. **Remove "Versions" from the tab strip entirely** — in the mockup, version history opens from the **Versions button in the session topbar** (see doc 11 §1), not an inspector tab. Mockup tab set: `Design · Data · Filters · Pipeline · Lineage · Model` (+ Comments/Share reached via toolbar icons/modal).
3. Container must apply `overflow:hidden` on the strip regardless.

## 1. Data tab (trust contracts) — restructure (lines 28–78)

Current: cards named `kpi_row` / `timeseries_ci` / `forecast` with ROWS/COLUMNS/ACTUAL/PREDICTED and a raw mono dump `GATE RESULTS data_contract:PASS…`. Mockup:

- Intro line: "Per-component trust contracts — what the data promised, and whether it delivered." (11.5px `#64748b`).
- **Accordion card per dashboard component with a HUMAN name + chart type**: "Revenue vs target · line", "Target gap by region · bar", "At-risk locations · table", "Forecast panel · model". No snake_case.
- Status pill per card: `PASSED` green / `1 WARNING` amber — the warning card also tints its header (`border:#f2ddb0; header background:#fdf9ef`):
```html
<span style="display:inline-flex;height:18px;padding:0 7px;border-radius:999px;background:#e8f5ec;color:#15803d;font-family:'IBM Plex Mono',monospace;font-size:8.5px;font-weight:600">PASSED</span>
```
- Expanded rows (label gray / value mono right): **Row count `546 (exp 500–600)`** ← show expected band, **Nulls · net_revenue `0.0%`**, **Range `$212K – $448K`**, **Freshness `3h ago · SLA 24h`** (green), **Gates `6/6 passed`** (green).
- Replace the raw `gate:PASS` dump with the per-card Gates row; keep detail behind the accordion.

## 2. Pipeline tab — restructure (lines 81–134)

Current: 4 generic step cards (`step 1 · gold_build` …) + raw PASS dump. Mockup:

- **Run header**: mono `RUN 8842 · 9 STAGES · 02:04` + green `ALL GATES ✓` pill.
- **Stage cards with status circles**: 20px round — green ✓, or amber `!` with `1 repair` count (amber mono) for repaired stages; right side mono duration (`31s`, `48s`, `6s`) + chevron.
- **Expandable stage detail** (first card expanded): rows Input / Gate result (`passed · 0 repairs` green) / Output, then a mono technical block on `#f7f8fa`:
```html
<div style="background:#f7f8fa;border:1px solid #eef1f5;border-radius:6px;padding:8px 10px;font-family:'IBM Plex Mono',monospace;font-size:9.5px;line-height:1.6;color:#64748b">metric net_revenue → SUM(oi.qty*oi.unit_price) − refunds<br>dim region → stores.region (fk stores.id)</div>
<span style="font-family:'IBM Plex Mono',monospace;font-size:9px;color:#94a3b8">technical detail · admin only</span>
```
- **"Fork from here" button** per stage (24px outlined) — missing entirely in current.
- Stage names should be the human pipeline stages (Validating metrics, Building data, Running queries, Training model, Assembling dashboard), not internal ids (`gold_build`, `walk_forward`).

## 3. Insights tab — restructure (lines 137–174)

Current: "Scan for insights" button + flat cards with mono tags (`● TREND`, `● WEEKDAY_PATTERN`). Mockup:

- Header: "Insights" + mono `auto-detected · 4` (insights arrive automatically; keep scan button if desired but not as the only path).
- Card anatomy: 24px tinted icon tile + colored mono category + **CONF pill** + rich text + **Investigate** button:
```html
<span style="width:24px;height:24px;border-radius:7px;background:#fdeaea;..."><!-- anomaly icon --></span>
<span style="font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:.06em;color:#dc2626">ANOMALY</span>
<span style="...background:#f1f5f9;color:#334155;font-size:8.5px">CONF 0.94</span>
<span style="font-size:12px;line-height:1.55;color:#334155">Boston — Newbury St revenue dropped <strong>22% w/w</strong> in week 26; no matching promo or holiday pattern.</span>
<span style="...background:#2563eb;color:#fff">Investigate</span>  <!-- top card primary; others outlined -->
```
- Categories: ANOMALY red `#dc2626`/`#fdeaea` · TREND blue `#1d4ed8`/`#eff4ff` · CORRELATION purple `#7c3aed`/`#f3eefe`. Rename `WEEKDAY_PATTERN` → human category (it's a TREND/PATTERN — no snake_case).
- Insight copy should embed bold key numbers, not one-liners.

## 4. Share — replace button with full modal (lines 176–229)

Current: a single "Create public link (7d)" button. Mockup is a 520px **modal**:

- Header: `Share "Q3 revenue target risk"` + mono `artifact · v14 · governed` + ✕.
- **VISIBILITY radio cards** (4): Private — only me / Workspace can view / Workspace can edit / **Public signed link** (selected: `border:2px solid #2563eb;background:#f8faff`, subtitle "Anyone with the token URL · workspace-scoped, revocable").
- **Token URL bar**: mono truncated `analytiq.app/share/tok_9f2ae81cc4…` + blue **Copy link**.
- **DISTRIBUTE grid** (7 tiles, 1fr ×7): Embed · HTML · PDF Export · PNG Export · Slack · Email · Link.
- **Advanced settings** (collapsible card): Expires date dropdown (`Aug 2, 2026` mono) + Scope dropdown (`Interactive`); **Password protect** toggle; checkboxes Allow comments ✓ / Allow drill-through ✓ / Allow data export ☐; red **Revoke link**.

## 5. Versions — replace raw refs with history timeline (lines 231–276)

Current tab shows internal refs (`session_spec v1 233df9cf`, `gold_predictions_ref v1 e5b2a584`…) — **internal hashes leaking to users; remove**. Mockup "Version history" panel (opens from topbar Versions button):

- Header: "Version history" + mono `14 versions`.
- Timeline rows: 26px author avatar + vertical connector; `v14 · current` (12px/600) + mono timestamp `09:41 today`; quoted change summary ("Add narrative + reallocate promo suggestion");
- **Dependency chips** per version (mono 8.5px): `sem v12` blue `#eff4ff` · `gov v8` purple `#f3eefe` · `model rev_loc_v2` teal `#e0f3f8`.
- Non-current rows show **Restore** and **Compare** buttons (24px outlined).

## 6. Comments drawer — MISSING ENTIRELY (lines 278–333)

400px drawer: header "Comments" + pill toggles `Open · 2` (dark active) / `Resolved · 5` (outlined). Thread cards:
- **Section anchor chip**: `§ Target gap by region` (mono 8.5px, `#eff4ff`/`#1d4ed8`) + resolve checkbox top-right.
- Comment rows: 24px avatar, name 12px/600 + mono relative time, body 12px.
- Nested replies indented `padding-left:33px`.
- **AI actions on threads**: `Ask AI to apply` (filled blue 25px) + `Convert to request` (outlined) — this is a signature feature.
- Composer at bottom: "Comment or @mention…" + blue send square.

## 7. Inline comment popover — MISSING ENTIRELY (lines 335–366)

Anchored to a canvas section: selected section gets blue border; a numbered **comment pin** sits on its edge:
```html
<span style="width:26px;height:26px;border-radius:50% 50% 50% 4px;background:#2563eb;border:2.5px solid #fff;box-shadow:0 4px 12px rgba(37,99,235,.4);color:#fff;font-size:10px;font-weight:700">1</span>
```
Popover below (290px, `box-shadow:0 20px 48px rgba(15,23,42,.18)`): comment row (avatar/name/time/body + resolve checkbox) and reply row (own avatar + "Reply…" input + send button).

---

## Priority order

1. Fix tab overflow bug (adopt mockup tab spec; move Versions out of the strip).
2. Kill internal leaks: snake_case component names, `gate:PASS` dumps, ref hashes.
3. Share modal (visibility, token bar, distribute grid, advanced settings).
4. Data tab trust contracts (human names, expected bands, warning states).
5. Pipeline tab (run header, repair states, expandable detail, Fork from here).
6. Comments drawer + inline pin popover (incl. "Ask AI to apply").
7. Version history timeline with dependency chips + Restore/Compare.
8. Insights cards (icons, confidence, Investigate).
