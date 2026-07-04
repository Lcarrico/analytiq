# 03 — Product Page (/product): ❌ PAGE MISSING ENTIRELY

**Status: This page does not exist in the current build. Everything below must be built from scratch.**
Mockup source: `Marketing Product.dc.html` (line numbers reference that file)
Reference screenshot (in `screenshots/`): `03-product-mockup.png` if added — no current-UI screenshot exists because the page is unbuilt

---

## Page structure (top to bottom)

1. Shared marketing nav (Product active) — see `01 - Landing Page Diff.md` §1. Active item: `<span style="color:#0f172a;font-weight:600">Product</span>`
2. Centered page header
3. Sticky 5-step stepper (anchor nav)
4. Five alternating stage sections (text + visual card, zebra `#fff`/`#f7f8fa`)
5. Dark CTA band

## 1. Page header (lines 48–52)

```html
<span style="font-family:'IBM Plex Mono',monospace;font-size:11px;font-weight:600;letter-spacing:.14em;color:#2563eb">HOW IT WORKS</span>
<h1 style="margin:0;font-size:40px;font-weight:700;letter-spacing:-.02em;color:#0f172a">A governed pipeline, not a chatbot</h1>
<p style="margin:0;max-width:620px;font-size:15.5px;line-height:1.6;color:#64748b">Every question runs through nine deterministic stages. The LLM plans; validated SQL and gates do the work. Click a stage to jump to it.</p>
```
Container: `padding:68px 64px 28px; text-align:center`.

## 2. Sticky stepper (lines 54–67)

`position:sticky;top:0;background:#fff;z-index:2; padding:26px 64px 56px`. Five anchor steps joined by 2px `#e4e8ef` connector lines. Step 1 active (filled), 2–5 inactive (outlined):

```html
<!-- active -->
<a href="#stage-understand"><span style="width:34px;height:34px;border-radius:50%;background:#2563eb;color:#fff;display:inline-flex;align-items:center;justify-content:center;font-family:'IBM Plex Mono',monospace;font-size:12px;font-weight:600">1</span><span style="font-size:11.5px;font-weight:600;color:#0f172a">Understand</span></a>
<!-- inactive -->
<span style="width:34px;height:34px;border-radius:50%;border:2px solid #c7d9f8;background:#f8faff;color:#1d4ed8;...">2</span>
```
Labels: Understand · Validate metrics · Build gold data · Train & backtest · Assemble & share.

## 3. Stage sections (lines 69–174)

All: `padding:34px 64px`, inner `max-width:1200px; grid 2-col; gap:56px; align-items:center`. Text side has eyebrow (`STAGE N · NAME`, mono 10.5px `#2563eb`), H2 27px/700, body 14.5px `#64748b`, optional mono footnote `#94a3b8`.

**Stage 1 · UNDERSTAND** (bg `#f7f8fa`): H2 "Your question becomes a reviewable plan". Visual = white card with chat bubble + plan review card:
```html
<div style="border:1px solid #c7d9f8;border-radius:9px;padding:11px 13px;background:#f8faff">
  <span style="font-size:11.5px;font-weight:600;color:#0f172a">Review your plan</span>
  <span style="font-family:'IBM Plex Mono',monospace;font-size:9.5px;line-height:1.8;color:#64748b">GOAL    flag locations >5% below target<br>METRICS net_revenue · target_gap_pct<br>SOURCES sample_retail + q3_targets.xlsx</span>
  <!-- Approve & Build (filled) + Edit (outlined) mini buttons -->
</div>
```
Footnote: `no raw data touches the LLM · plan is auditable JSON`.

**Stage 2 · VALIDATE** (bg `#fff`, visual left): H2 "Deterministic gates, not vibes". Visual = dark `#0b1220` terminal card, mono 11px log lines: ✓ green `#4ade80`, blocked join in red `#f87171` with `BLOCKED` tag, indented steward note. Link "Security & governance model →" to /security.

**Stage 3 · BUILD** (bg `#f7f8fa`): H2 "An immutable gold table per answer". Visual = white card: pipeline chips `orders + targets → GOLD.REV_LOC_WK_V1` (gold chip `#fdf9ef`/`#b45309`), four green gate pills (`ROW BAND ✓`, `GRAIN UNIQUE ✓`, `RECONCILES GL ✓`, `NULL CONTRACT ✓` — `background:#e8f5ec;color:#15803d;border-radius:999px;font-size:9px` mono), and an SVG progress bar "3,486 / 3,600 expected rows · within band ✓". Footnote: `GOLD.REV_LOC_WK_V1 · 3,486 rows · gates 6/6 ✓`.

**Stage 4 · PREDICT** (bg `#fff`, visual left): H2 "Forecasts earn their place". Visual = leaderboard card: header row `candidate leaderboard · 5-window backtest` / `leakage 14/14 ✓`; three horizontal bars — LightGBM 4.1% (green `#15803d`, winner), XGBoost 4.6% (`#93c5fd`), Prophet 5.8% (`#cbd5e1`); footnote `promotion gate: beat incumbent by ≥0.5pt on ≥3 windows ✓ · model card generated`.

**Stage 5 · SHIP** (bg `#f7f8fa`): H2 "A living artifact, not a screenshot". Two CTAs: "See the workbench" (filled) + "Sharing views" (outlined). Visual = mini dashboard card: 3 KPI tiles (Q3 FORECAST $4.82M / AT-RISK 7/42 / HEALTH 96 · v14), SVG trend chart with forecast split, three pills: `● HEALTHY` (green), `SIGNED LINK` (blue `#eff4ff`/`#1d4ed8`), `MODEL CARD` (purple `#f3eefe`/`#7c3aed`).

## 4. CTA band (lines 176–183)

```html
<div style="padding:72px 64px;background:#0b1220;text-align:center">
  <h2 style="margin:0;font-size:32px;font-weight:700;letter-spacing:-.02em;color:#f8fafc">Watch it build your first dashboard</h2>
  <!-- "Start free" filled #2563eb 44px + "Browse templates" outlined rgba(255,255,255,.22) -->
</div>
```
