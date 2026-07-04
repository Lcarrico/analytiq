# 09 — Onboarding Flow (/onboarding/*): ❌ ALL 4 SCREENS MISSING ENTIRELY

**Status: No onboarding exists in the current build (user-confirmed). All four screens must be built from scratch.**
Mockup source: `Onboarding.dc.html` (line numbers reference that file)
Reference screenshots (in `screenshots/`): `09-onboarding-mockup-1.png` (Workspace Setup + Choose Starting Mode), `09-onboarding-mockup-2.png` (Dataset Health + Template Picker). No current-UI screenshots — nothing exists.

Flow order: Register step 4 → **Workspace Setup wizard** → **Choose Starting Mode** → **Dataset Health Preview** → **Template Picker** → Workspace Home.

---

## Screen 1 — Workspace Setup Wizard, branding step (/onboarding/workspace, lines 25–110)

Standalone centered card (same auth shell: `#f2f4f8` bg, radial glow, centered logo). Card 760px, `padding:30px 34px`.

**Progress header** (5-step wizard; mockup shows step 5):
```html
<div style="display:flex;justify-content:space-between;font-family:'IBM Plex Mono',monospace;font-size:10.5px;color:#94a3b8"><span>WORKSPACE SETUP</span><span>STEP 5 / 5 · BRANDING</span></div>
<div style="height:5px;border-radius:999px;background:#eef1f5;overflow:hidden"><span style="display:block;width:92%;height:100%;background:#2563eb;border-radius:999px"></span></div>
```
H1 "Make it yours" 20px/600 + "Branding applies to dashboards, share pages and email digests. You can change it anytime."

**Left column (form):**
- Logo dropzone: `border:1.5px dashed #c7d9f8;background:#f8faff;border-radius:10px` with 38px purple avatar tile "AR", filename "acme-mark.svg", mono caption "4.2 KB · drop to replace".
- Accent color swatches: 30px rounded squares — `#7c3aed` (selected: `border:2px solid #fff;outline:2px solid #7c3aed`), `#2563eb`, `#0e7490`, `#15803d`, `#b45309`, `#0f172a`, plus dashed "+" custom swatch.
- Font select (38px, "IBM Plex Sans"), then Timezone ("PT (UTC−8)") + Currency ("USD $") side by side.

**Right column — live preview** (rebrands in real time with chosen accent): mini dashboard with header (22px "AR" tile + "Acme Retail Analytics" + purple Share button), 3 KPI tiles (REVENUE $1.92M / ORDERS 48.1K / AOV $39.90, mono), purple area chart (`stroke:#7c3aed; fill:rgba(124,58,237,.1)`), caption `applies to: dashboards · share pages · email digests`.

**Footer:** "← Back" left; "Skip for now" (`#94a3b8`) + "Finish setup →" (filled 38px) right.

## Screen 2 — Choose Starting Mode (/onboarding/start, lines 112–155)

Centered page: H1 "Where's your data?" 24px/600 + "Pick a starting point — you can add more sources later." Then **5 cards** in a row (`repeat(5,188px); gap:14px`), each: 36px icon chip + title 14px/600 + subtitle 11.5px.

Selected card (Use sample data) has 2px blue border, glow, and a FASTEST pill:
```html
<a style="background:#fff;border:2px solid #2563eb;border-radius:12px;padding:20px 16px;box-shadow:0 8px 24px rgba(37,99,235,.1);position:relative">
  <span style="position:absolute;top:10px;right:10px;font-family:'IBM Plex Mono',monospace;font-size:8.5px;font-weight:600;letter-spacing:.06em;color:#15803d;background:#e8f5ec;border-radius:999px;padding:2px 7px">FASTEST</span>
```
Cards: **Use sample data** ("Retail dataset, preloaded and profiled") · **Upload a file** ("CSV, XLSX, Parquet — typed & profiled") · **Connect warehouse** ("Snowflake, BigQuery, Databricks, Redshift") · **Import dbt project** ("Models & tests become semantic candidates") · **REST API / Webhook** ("Poll an endpoint or receive pushed events").

Footer caption (mono 10.5px `#94a3b8`): `All connections are read-only · credentials encrypted at rest`.

## Screen 3 — First Dataset Health Preview (/onboarding/source-health, lines 157–203)

Full-width layout with slim top bar: logo + mono `onboarding · 2 of 3` + right "Exit setup" link.

H1: `Here's what we found in <span mono #2563eb>sample_retail</span>` + "Profiled automatically — nothing was moved or modified. Connections stay read-only."

**Green "Safe to analyze" banner:**
```html
<div style="display:flex;align-items:center;gap:14px;background:#e8f5ec;border:1px solid #b7e0c3;border-radius:10px;padding:14px 18px">
  <!-- 34px green check circle #15803d -->
  <span style="font-size:14.5px;font-weight:600;color:#14532d">Safe to analyze</span>
  <span style="font-size:12.5px;color:#3f6212">8 tables passed validation gates. 2 columns flagged for PII review — they'll be masked until a steward approves.</span>
  <span style="margin-left:auto;font-family:'IBM Plex Mono',monospace;font-size:10.5px;color:#15803d;background:#fff;border:1px solid #b7e0c3;border-radius:999px;padding:4px 10px">HEALTH 94/100</span>
</div>
```

**4 KPI cards** (mono label 9.5px / value 24px / caption 11.5px): TABLES FOUND 8 (2.4M rows total) · HEALTH SCORE 94 green (all gates passed) · PII WARNINGS 2 amber `#b45309` (masked pending review) · FRESHNESS daily (last load 03:00 PT).

**Table** (grid `2.2fr 1fr 1fr 1fr 1.3fr`, header 38px on `#fafbfc`, rows 44px, mono values): orders 1,204,318/24/0.4% HEALTHY · order_items 3,891,442/11/0.1% HEALTHY · customers 412,806/18/1.2% **PII · 2 COLS** (amber pill `#fdf3e3`/`#b45309`) · products 8,912/15/0.0% HEALTHY · stores 42/12/0.0% HEALTHY · inventory_snapshots 988,204/9/2.8% **NULL SPIKE** (amber). Status pill pattern:
```html
<span style="display:inline-flex;align-items:center;gap:5px;height:20px;padding:0 8px;border-radius:999px;background:#e8f5ec;color:#15803d;font-family:'IBM Plex Mono',monospace;font-size:9.5px;font-weight:600;letter-spacing:.04em"><span style="width:5px;height:5px;border-radius:50%;background:#15803d"></span>HEALTHY</span>
```

**Sticky footer bar** (64px, white, top border): mono `profiling completed in 6.2s` left, "Continue →" button right.

## Screen 4 — First Dashboard Template Picker (/onboarding/templates, lines 205–255)

Centered page: H1 "Recommended for your data" + "Based on the tables and columns we profiled in `sample_retail`."

**3 recommendation cards** (`repeat(3,270px)`), each: preview strip on `#f7f8fa` (skeleton KPI bars + SVG chart), title, data-aware rationale, and a match pill:
```html
<span style="font-family:'IBM Plex Mono',monospace;font-size:9.5px;color:#15803d;background:#e8f5ec;border-radius:999px;padding:3px 8px;align-self:flex-start">BEST MATCH · orders, order_items</span>
```
Cards: **Revenue Trend + Forecast** ("You have transaction dates + revenue — try an 8-week forecast." — BEST MATCH green) · **Location Performance** ("42 stores detected — rank against targets and flag laggards." — MATCH · stores, orders, blue `#eff4ff`/`#1d4ed8`) · **Inventory Demand Watch** ("Daily snapshots found — monitor stockout risk by warehouse." — MATCH · inventory_snapshots, blue).

Below grid: "Skip — start from scratch with a blank prompt →" (13px `#64748b`, links to Create Workbench).
