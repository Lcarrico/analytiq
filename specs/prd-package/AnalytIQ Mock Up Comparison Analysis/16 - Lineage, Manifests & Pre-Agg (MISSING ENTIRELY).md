# 16 — Lineage Graph, Manifest Versions & Pre-Aggregation: ❌ ALL 3 MISSING ENTIRELY

**Status: None of these three screens exist in the current build (user-confirmed).** The current "Governance ops" page has empty DRIFT/LINEAGE stubs and a raw manifest table — see doc 15 for the mapping; this doc is the build spec.
Mockup source: `Governance Lineage.dc.html` (line numbers reference that file)
Reference screenshot (in `screenshots/`): `16-lineage-mockup.png` (all 3 frames). No current-UI screenshots — nothing exists.

---

## Screen 1 — Lineage Graph (/app/governance/lineage, lines 26–152)

Interactive DAG canvas on `#f7f8fa` with a dot-grid background:
```html
<svg><defs><pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="1.5" cy="1.5" r="1.2" fill="#dfe3ea"></circle></pattern></defs><rect width="100%" height="100%" fill="url(#dots)"></rect></svg>
```

**Node taxonomy** (6 types, each a white card with a type glyph + mono label; legend pinned top-left):
| Type | Glyph | Accent |
|---|---|---|
| source | square `#0e7490` | — |
| table | square `#64748b` | — |
| metric | circle `#2563eb` | name in blue for governed |
| gold | diamond (`transform:rotate(45deg)`) `#b45309` | amber border `#f2ddb0` |
| model | ring `border:2px solid #7c3aed` | purple border `#e7dbfb`, name purple |
| artifact | square `#15803d` | green border `#b7e0c3` |

Node pattern:
```html
<div style="width:160px;background:#fff;border:1px solid #e4e8ef;border-radius:9px;padding:10px 12px;box-shadow:0 3px 10px rgba(15,23,42,.05)">
  <span style="display:flex;align-items:center;gap:7px"><span style="width:8px;height:8px;border-radius:2px;background:#64748b"></span><span style="font-family:'IBM Plex Mono',monospace;font-size:8.5px;letter-spacing:.06em;color:#94a3b8">TABLE</span></span>
  <span style="font-family:'IBM Plex Mono',monospace;font-size:11.5px;font-weight:600;color:#0f172a">orders</span>
</div>
```
Selected node: `border:2px solid #2563eb; box-shadow:0 6px 18px rgba(37,99,235,.15)`, label `TABLE · SELECTED` in blue.

**Edges**: cubic-bézier SVG paths; default `stroke:#cbd5e1 1.6px`; the selected node's downstream path highlighted `stroke:#2563eb 2.4px`; indirect/inferred edges dashed.

Demo graph: sources (prod_pos, q3_targets.xlsx, shopify_orders) → tables (stores, **orders** selected, targets_q3, order_items, web_orders) → metrics (net_revenue v4, target_gap_pct) → gold REV_LOC_WK_V1 + model rev_loc_v2 → artifact "Q3 Target Risk".

**Controls** (bottom-left floating bar): zoom − 82% + · divider · Auto-layout · Export ↓.

**Node details side panel** (300px, right, opens on select — lines 130–150): header `orders` + ✕; rows Type `table · prod_pos` / Health `96 / 100` green / Rows `1,204,318` / Downstream `2 metrics · 1 gold · 2 artifacts` / Freshness `18m · SLA 1h` green; divider; **IMPACT IF BROKEN** list with colored dots (blue "net_revenue v4 → 14 dashboards", amber "GOLD.REV_LOC_WK_V1 refresh", red "2 alerts · daily revenue guard"); footer button "Open table detail →" (`#f8faff`/`#c7d9f8`/`#1d4ed8`).

## Screen 2 — Manifest Versions (/app/governance/manifests, lines 155–179)

Replaces the current raw manifest table + "Roll back to v1.0.0" button. Versions table (grid `.9fr 1.1fr 1fr 1fr .8fr`, header mono on `#fafbfc`): VERSION · GENERATED · STATUS · CHANGES · expand/collapse.

Rows: **v12** (Jul 2 · 03:00, `REVIEW REQUIRED` amber pill, "3 schema · 1 metric", expanded, row bg `#f8faff`) · v11 (`ACTIVE` green, "1 schema") · v10 (`SUPERSEDED` gray, "6 schema · 2 metric").

**Expanded diff** (on `#fbfcff`) — change rows with typed chips:
```html
<span style="...background:#e8f5ec;color:#15803d">+ ADD</span><span style="font-family:'IBM Plex Mono',monospace;font-size:10.5px;color:#334155">dimension store_format on stores (confidence 0.91)</span>
<span style="...background:#fdf3e3;color:#b45309">~ MOD</span> orders.discount_pct semantic type ratio → text (drift)
<span style="...background:#fdeaea;color:#dc2626">− DEL</span> metric gross_margin_v1 (superseded by v2)
```
Actions inside expansion: **Approve v12** (filled) + **Rollback to v11** (outlined).

## Screen 3 — Pre-Aggregation Recommendations (/app/governance/preaggregations, lines 182–232)

Header: "Recommended rollups" + **Auto-materialize** toggle (off `#cbd5e1`).

**Recommendation cards** — per card:
- Mono rollup name (`agg_rev_store_week`) + value pill (`HIGH VALUE` green / `MEDIUM` blue) + right mono `hits 61% of queries`.
- Rationale line: "Weekly revenue by store — pattern seen in 42 dashboard queries this month."
- Two metric bars: **est. speedup** (green fill, `8.6×` label) and **est. cost** (blue fill, `$4/mo`):
```html
<span style="font-family:'IBM Plex Mono',monospace;font-size:9.5px;color:#64748b;width:88px">est. speedup</span>
<div style="flex:1;height:9px;border-radius:999px;background:#eef1f5;overflow:hidden"><span style="display:block;width:86%;height:100%;background:#15803d"></span></div>
<span style="font-family:'IBM Plex Mono',monospace;font-size:10.5px;font-weight:600;color:#15803d">8.6×</span>
```
- Actions: high-value card gets filled **Approve & materialize** + Dismiss; medium gets outlined-blue **Approve** + Dismiss.

**Footer**: "Monthly cost ceiling" + `$50` mono input + mono caption `current spend $15/mo`.

---

## Build notes

- Lineage entry points: sidebar Governance, canvas toolbar lineage icon (doc 11), inspector Lineage tab (doc 12), artifact detail Lineage tab (doc 13) — all should deep-link to this graph with the relevant node preselected.
- The "IMPACT IF BROKEN" panel is the governance selling point of the graph — prioritize it over graph aesthetics.
- Manifest approve/rollback actions must record to the audit log (consistent with doc 15's "decision recorded in audit log").
