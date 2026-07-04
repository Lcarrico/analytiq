# 05 — Templates Gallery (/templates): ❌ PAGE MISSING ENTIRELY

**Status: Does not exist in the current build. Build from scratch.**
Mockup source: `Marketing Templates.dc.html`
Reference screenshot (in `screenshots/`): `05-templates-mockup.png` if added — no current-UI screenshot exists because the page is unbuilt

---

## Page structure

1. Shared marketing nav (Templates active)
2. Two-column layout: 250px filter rail + template grid
3. Grid header (title + count + search) and 3-column card grid (10 templates)

## 1. Layout shell (line 47)

```html
<div style="display:grid;grid-template-columns:250px 1fr;gap:0">
```

## 2. Filter rail (lines 48–68)

`border-right:1px solid #e4e8ef;padding:30px 26px`. Mono section labels (`CATEGORY`, `TYPE` — 10px letterspaced `#94a3b8`), checkbox rows 13px. Checked state = filled blue box with white check:
```html
<label style="display:flex;align-items:center;gap:9px;font-size:13px;color:#0f172a;font-weight:600;cursor:pointer">
  <span style="width:15px;height:15px;border-radius:4px;background:#2563eb;display:inline-flex;align-items:center;justify-content:center"><svg width="9" height="9" viewBox="0 0 9 9"><path d="m2 4.5 2 2 3-3.5" fill="none" stroke="#fff" stroke-width="1.4" stroke-linecap="round"></path></svg></span>All templates
</label>
<!-- unchecked: <span style="width:15px;height:15px;border-radius:4px;border:1.5px solid #cbd5e1"></span>, text #334155 -->
```
CATEGORY: All templates (checked) · Revenue · Churn · Operations · Sales · Marketing · Inventory · SLA. Divider `height:1px;background:#eef1f5`. TYPE: Predictive · Monitoring · Diagnostic.

## 3. Grid header (lines 72–75)

```html
<h1 style="margin:0;font-size:24px;font-weight:700;letter-spacing:-.015em;color:#0f172a">Templates <span style="font-family:'IBM Plex Mono',monospace;font-size:13px;font-weight:500;color:#94a3b8">10</span></h1>
<!-- search: 300px × 36px, border #d4d9e1, radius 9, placeholder "Search templates…" with magnifier svg -->
```

## 4. Template cards (lines 76–127)

3-col grid, gap 16px. Card = SVG preview on `#f7f8fa` strip + text block; hover `border-color:#c7d9f8; box-shadow:0 10px 28px rgba(15,23,42,.08)`:
```html
<div style="border:1px solid #e4e8ef;border-radius:12px;overflow:hidden;cursor:pointer">
  <div style="background:#f7f8fa;border-bottom:1px solid #eef1f5;padding:13px"><svg viewBox="0 0 320 58" style="width:100%;height:58px"><!-- preview art --></svg></div>
  <div style="padding:13px 15px;display:flex;flex-direction:column;gap:4px">
    <span style="font-size:13.5px;font-weight:600;color:#0f172a">Revenue Forecast</span>
    <span style="font-size:11.5px;line-height:1.5;color:#64748b">Weekly trend + 8-week forecast vs target.</span>
    <span style="font-family:'IBM Plex Mono',monospace;font-size:9px;color:#94a3b8;margin-top:3px">REVENUE · PREDICTIVE</span>
  </div>
</div>
```

All 10 templates (name / description / tag — SVG art defined at cited lines):
1. Revenue Forecast — "Weekly trend + 8-week forecast vs target." — REVENUE · PREDICTIVE (line 79)
2. Location Performance — "Rank stores vs target; flag laggards." — REVENUE · DIAGNOSTIC (line 84)
3. Customer Churn Risk — "Score accounts by 60-day churn probability." — CHURN · PREDICTIVE (line 89)
4. Operational Risk Monitor — "Heatmap of drift across sites and lines." — OPERATIONS · MONITORING (line 94)
5. Sales Pipeline Health — "Coverage, stage velocity, stale-deal flags." — SALES · DIAGNOSTIC (line 99)
6. Margin Variance — "SKU/supplier drivers of gross margin leaks." — REVENUE · VARIANCE (line 104)
7. Marketing Spend Efficiency — "Channel ROAS with diminishing-returns curve." — MARKETING · DIAGNOSTIC (line 109)
8. Inventory Demand Forecast — "Stockout risk by SKU and warehouse." — INVENTORY · PREDICTIVE (line 114)
9. SLA Breach Predictor — "Which shipments/tickets will miss SLA next." — SLA · PREDICTIVE (line 119)
10. Anomaly Monitor — "Baseline-aware spikes on any metric." — OPERATIONS · MONITORING (line 124)
