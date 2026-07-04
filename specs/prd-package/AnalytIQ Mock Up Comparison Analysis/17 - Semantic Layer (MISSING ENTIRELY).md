# 17 — Semantic Layer (9 screens): ❌ ALL MISSING ENTIRELY

**Status: None of these screens exist in the current build (user-confirmed). Build from scratch.** The sidebar has a "Semantic Layer" item, but the designed surfaces behind it are absent.
Mockup sources: `Semantic Overview.dc.html` · `Semantic Metrics.dc.html` · `Semantic Tools.dc.html`
Reference screenshots (in `screenshots/`): `17-semantic-mockup-1.png` (Overview, Explores, Explore Detail), `17-semantic-mockup-2.png` (Metrics Catalog, Metric Detail, Dimensions), `17-semantic-mockup-3.png` (Field Picker, Join Paths, Derived Tables).

---

## A. Semantic Overview (/app/semantic) — Semantic Overview.dc.html lines 26–50

Header: breadcrumb + H1 "Semantic layer"; right: blue pill `MANIFEST v11 ACTIVE` (`#eff4ff`/`#1d4ed8`) + outlined **Regenerate** button.

Clickable KPI cards (same pattern as Governance overview — mono label / 24px mono value / caption): EXPLORES 6 (all healthy) · METRICS 48 (44 governed · 4 draft) · DIMENSIONS 112 (6 categories) · JOIN PATHS 19 (caption amber "1 blocked m:n") · CONFLICTS 1 amber (active_customer ×2 → links to review queue) · VERSION v11 (amber "v12 pending review" → manifests) · ACCESS POLICIES span-2 ("4 RLS policies" + "region-scoped viewers · finance-only margin metrics" → RLS admin).

## B. Explores List (/app/semantic/explores) — lines 52–82

Table grid `1.7fr .8fr .9fr 1.1fr .9fr .9fr 1fr`, rows 48px: EXPLORE (bold name + mono table composition, e.g. "Revenue / orders + order_items + stores") · METRICS · DIMENSIONS · ACCESS (stacked 20px avatars + `+9` counter chip) · HEALTH (scored pill `● 96` green / `● 84` amber) · CONFIDENCE (mono, colored `0.95` green / `0.71` amber) · USED BY (`14 dashboards`). Rows: Revenue, Customer, Inventory.

## C. Explore Detail (/app/semantic/explores/:id) — lines 84–118

Header: breadcrumb `semantic / explores / revenue`, H1 "Revenue" + `● HEALTHY 96` pill + mono `3 tables · confidence 0.95`; right primary **"Analyze this explore"** → workbench.
Tabs: `Metrics · 14` (active) · `Dimensions · 31` · `Joins · 4` · Access · `Artifacts · 14` · Versions.
Metrics tab table (grid `1.4fr 2fr .8fr .8fr .9fr`): METRIC (mono blue link) · DEFINITION (plain English, ellipsized) · FORMAT (`$ USD`, `%`) · VERSION (`v4`) · USED BY. Rows: net_revenue · aov · target_gap_pct.

## D. Metrics Catalog (/app/semantic/metrics) — Semantic Metrics.dc.html lines 25–70

Header: "Metrics 48" + search "Search metrics…" + primary **+ Calculated metric**.
Table grid `1.3fr 1.9fr .7fr .7fr .9fr .8fr .7fr .6fr .5fr`: METRIC · DEFINITION · AGG (`SUM`/`COUNT D`/`RATIO`/`AVG` mono) · FORMAT · SOURCE · CONFIDENCE (pill, green ≥0.9 / amber low / gray —) · OWNER avatar · USED BY · VER.

Special row states:
- **Conflict row** tinted `background:#fdf9ef` with inline chip:
```html
<span style="display:inline-flex;height:16px;padding:0 6px;border-radius:4px;background:#fdf3e3;color:#b45309;font-family:'IBM Plex Mono',monospace;font-size:8px;font-weight:600">×2 CONFLICT</span>
```
- **Deprecated row**: all values gray `#94a3b8`, chip `DEPRECATED` (`#f1f5f9`/`#64748b`), definition "Superseded by aov v2".

## E. Metric Detail (/app/semantic/metrics/:id) — lines 73–131

Header: mono H2 `net_revenue` + pills `GOVERNED · v4` (green) + `CONF 0.95` (blue); right outlined **Propose change**.
Two columns (left `1.35fr`, right on `#fafbfc`):
- LEFT: **PLAIN-ENGLISH DEFINITION** ("…The single source of truth for 'revenue' everywhere in the workspace."); **SQL EXPRESSION** with `ADMIN ONLY` chip and dark block:
```html
<div style="background:#0b1220;border-radius:9px;padding:12px 14px;font-family:'IBM Plex Mono',monospace;font-size:10.5px;line-height:1.7;color:#93c5fd">SUM(oi.qty * oi.unit_price<br>  - oi.line_discount) - COALESCE(r.refund_amt, 0)</div>
```
then 3-col facts: AGGREGATION SUM · FORMAT $ USD · 2dp · ALLOWED FILTERS time · region · channel.
- RIGHT: **LINEAGE** chip chain `orders → net_revenue (blue) → GOLD ×3 (amber)`; **USED BY · 14** artifact names + "+10 more"; **TESTS** pills `NON-NEGATIVE ✓` `RECONCILES GL ✓`; **VERSIONS** mini-changelog (v4 refunds included · Jun 20 / v3 line discounts · May 2).

## F. Dimensions Catalog (/app/semantic/dimensions) — lines 133–165

Collapsible category list with counts: Date 18 (expanded: `order_week 0.98`, `fiscal_quarter 0.96` — mono rows with green confidence) · Geography 14 · Category 26 · Boolean 21 · ID 19 · Text 14. Expanded category header on `#f8faff`.

## G. Visual Field Picker (/app/semantic/field-picker) — Semantic Tools.dc.html

Three-panel: **Dimensions** rail (search + checkbox groups DATE/GEOGRAPHY/CATEGORY; selected rows tinted) · **center**: SELECTED chip row (`order_week ✕ · region ✕ · Σ net_revenue ✕ · Σ target_gap_pct ✕`), **cardinality warning banner** (amber):
```html
<span style="font-size:11.5px;color:#7a4a10"><strong>Heads up:</strong> region × week × 42 stores is fine, but adding <span mono>store_name</span> would create 2,184 series — consider a Top-N.</span>
```
live **Preview** table (mono caption `100-row cap · 64ms`, colored gap values), and centered primary **"Analyze this →"** (goes to workbench) · **Measures** rail (search + REVENUE EXPLORE / CUSTOMER EXPLORE groups; selected measure shows a "7d trend" sparkline preview).

## H. Join Path Manager (/app/semantic/joins) — Semantic Tools.dc.html

Header "Join paths 19" + amber pill `1 BLOCKED`. Rows: `orders n:1 → stores` (mono cardinality chip) · `inflation ×1.0` + `SAFE` green pill; blocked row tinted amber: `orders m:n ✕ promotions`, `est. inflation ×3.2` + `BLOCKED` red pill + explainer "Many-to-many would fan out revenue. Bridge table fixes the grain." + primary **"Recommend bridge table"**; `orders 1:n → returns` with `FAN-OUT RISK` amber pill.

## I. Derived Tables editor (/app/semantic/derived-tables, admin) — Semantic Tools.dc.html

Header: mono `drv_weekly_promo_lift` + `GOVERNED` pill; right primary **Publish**. Left: dark SQL editor (`SQL · ADMIN ONLY` + green `✓ validated`; syntax-tinted SELECT). Right column: **Schedule** dropdown (`daily · 04:00 PT`), **Governance tags** chips (`revenue`, `promo`, dashed `+ tag`), **Lineage preview** chip chain (`orders + order_items → drv_weekly_promo_lift`), outlined **"Test run · dry"**. Below: ALL DERIVED TABLES list (grid: name · schedule · STATUS pill `FRESH` green / `STALE 2D` amber · GOVERNANCE pill `GOVERNED` blue / `DRAFT`).
