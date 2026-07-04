# 07 — Docs (/docs): ❌ PAGE MISSING ENTIRELY

**Status: Does not exist in the current build. Build from scratch.**
Mockup source: `Marketing Docs.dc.html` (shows the Quickstart article as the representative layout)
Reference screenshot (in `screenshots/`): `07-docs-mockup.png` (mockup only — no current-UI screenshot exists because the page is unbuilt)

---

## Page structure

1. Docs-specific slim nav (58px) — different from marketing nav
2. Three-column layout: `grid-template-columns:260px 1fr 220px` — nav tree · article · "on this page"

## 1. Docs nav (lines 28–37)

```html
<div style="height:58px;display:flex;align-items:center;gap:20px;padding:0 32px;border-bottom:1px solid #e4e8ef">
  <!-- logo mark 22px + wordmark: Analyt<span style="color:#2563eb">IQ</span> <span style="font-weight:500;color:#94a3b8">Docs</span> -->
  <div style="width:380px;height:34px;display:flex;align-items:center;gap:9px;padding:0 13px;border:1px solid #d4d9e1;border-radius:8px;color:#94a3b8;font-size:12.5px"><!-- magnifier -->Search docs…<span style="margin-left:auto;font-family:'IBM Plex Mono',monospace;font-size:10px;border:1px solid #e4e8ef;border-radius:5px;padding:1px 6px">⌘K</span></div>
  <!-- right: "analytiq.app ↗" link + "Start free" button (34px, #2563eb) -->
</div>
```

## 2. Left nav tree (lines 41–56)

`background:#fbfcfd;border-right:1px solid #e4e8ef;padding:24px 18px`. Mono section labels 9.5px letterspaced `#94a3b8`; items 12.5px `#47516b`, hover `background:#f1f4f9`. Active item:
```html
<span style="padding:7px 12px;border-radius:7px;background:#e8effc;color:#1d4ed8;font-size:12.5px;font-weight:600">Quickstart</span>
```
Tree: **GET STARTED** — Quickstart (active) · Connect Snowflake · Upload CSV / XLSX · Build your first dashboard · Share a dashboard. **CONCEPTS** — Health scores · Semantic layer · Gold tables & contracts · Predictive model basics. **ADMINISTRATION** — Roles & permissions · Security guide · Tokens & billing.

## 3. Article column (lines 60–88)

`padding:36px 56px;max-width:820px`. Breadcrumb mono 10px `#94a3b8`: `DOCS / GET STARTED / QUICKSTART`.

```html
<h1 style="margin:0;font-size:30px;font-weight:700;letter-spacing:-.02em;color:#0f172a">Quickstart: question → dashboard in 4 minutes</h1>
```
Intro paragraph 14.5px/1.7 `#334155`. Section H2s 19px/600 with anchor ids: "1 · Pick your data", "2 · Ask a question", "3 · Approve the plan", "4 · Refine and share".

Key components:
- **Dark terminal block** (§1):
```html
<div style="background:#0b1220;border-radius:10px;padding:14px 16px;font-family:'IBM Plex Mono',monospace;font-size:11px;line-height:1.75;color:#93c5fd">✓ 8 tables profiled · health 94/100<br>✓ 2 PII columns masked pending review<br>→ safe to analyze</div>
```
- **Inline code chip** (§2): `font-family:'IBM Plex Mono';font-size:12.5px;background:#f1f5f9;border-radius:5px;padding:2px 7px`
- **Amber note callout** (§3):
```html
<div style="border:1px solid #f2ddb0;background:#fdf9ef;border-radius:10px;padding:12px 16px;display:flex;gap:10px">
  <!-- warning triangle svg #b45309 -->
  <span style="font-size:13px;line-height:1.6;color:#7a4a10"><strong style="font-weight:600">Note:</strong> masked PII columns are excluded automatically...</span>
</div>
```
- **Button pair** (§4): "Open the workbench" (filled 38px `#2563eb`) + "Security model" (outlined `#d4d9e1`)
- **Article footer** (border-top `#eef1f5`): left "Was this helpful? Yes · No" (links `#2563eb`), right "Next: Connect Snowflake →"

## 4. "On this page" rail (lines 92–98)

`border-left:1px solid #e4e8ef;padding:36px 22px`. Mono label `ON THIS PAGE`. Active item has blue left rule:
```html
<a href="#d-connect" style="font-size:12px;color:#1d4ed8;font-weight:600;text-decoration:none;border-left:2px solid #2563eb;padding-left:10px">Pick your data</a>
<!-- inactive: color:#64748b; border-left:2px solid transparent -->
```
Items: Pick your data · Ask a question · Approve the plan · Refine and share.
