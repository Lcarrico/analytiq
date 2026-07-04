# 01 — Landing Page: Mockup vs Current UI

Mockup source: `Marketing Landing.dc.html` (line numbers reference that file)
Reference screenshots (in `screenshots/`): `01-landing-mockup-1.png` (top half), `01-landing-mockup-2.png` (bottom half), `01-landing-current.png` (current UI)
Status: Current page is a skeleton — ~70% of mockup sections missing entirely; existing sections diverge in font, color, and copy.

---

## 0. Global / Typography

**Current:** Default system font throughout, all-white page.
**Mockup:** IBM Plex Sans (body) + IBM Plex Mono (eyebrows, stats, labels). Biggest "feel" difference on every section.

```html
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<!-- page wrapper -->
font-family:'IBM Plex Sans',sans-serif
```

## 1. Nav (64px header)

Current: text-only logo, single "Pricing" link, "Login". Mockup differences:

- **Logo has an SVG mark** (dark rounded square with 3 blue bars) before the wordmark:
```html
<svg width="24" height="24" viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#0f172a"></rect><rect x="5.5" y="12" width="3.2" height="6.5" rx="1.2" fill="#60a5fa"></rect><rect x="10.4" y="8.5" width="3.2" height="10" rx="1.2" fill="#3b82f6"></rect><rect x="15.3" y="5" width="3.2" height="13.5" rx="1.2" fill="#2563eb"></rect></svg>
<span style="font-size:16px;font-weight:700;color:#0f172a;letter-spacing:-.01em">Analyt<span style="color:#2563eb">IQ</span></span>
```
- **Six center nav links**, 13.5px/500, color `#47516b`, gap 28px: Product, Solutions, Templates, Pricing, Security, Docs.
- Right side: "Log in" (not "Login") + "Start free" (not "Start Free"):
```html
<a style="display:inline-flex;align-items:center;height:36px;padding:0 16px;background:#2563eb;color:#fff;font-size:13.5px;font-weight:600;border-radius:8px">Start free</a>
```
- Container: `height:64px; padding:0 40px; border-bottom:1px solid #e4e8ef`.

## 2. Hero — biggest visual gap

Current: white background, generic H1, one button, near-empty dark terminal card. Mockup is a **dark navy hero** with a fully populated product simulation:

- Wrapper: `background:#0b1220; grid-template-columns:1.02fr .98fr; gap:56px; padding:84px 64px 88px` plus a blue radial glow:
```html
<div style="position:absolute;inset:0;background:radial-gradient(600px 320px at 78% 18%, rgba(37,99,235,.16), transparent 70%)"></div>
```
- **Eyebrow** (missing entirely): mono, letterspaced, blue dot:
```html
<div style="font-family:'IBM Plex Mono',monospace;font-size:11px;font-weight:600;letter-spacing:.14em;color:#60a5fa">
  <span style="width:6px;height:6px;border-radius:50%;background:#60a5fa"></span>CONVERSATIONAL ANALYTICS
</div>
```
- **Headline copy is different.** Mockup: "Ask a question.\nWatch the dashboard\nbuild itself." at `font-size:52px;line-height:1.06;letter-spacing:-.025em;color:#f8fafc`. Current: "A business question in. A governed dashboard out." — dark text on white.
- **Subcopy** (`16.5px, #94a3b8, max-width:470px`): "AnalytIQ turns plain-English questions into governed, shareable dashboards — validated metrics, predictive models, and a full audit trail. No SQL, no backlog."
- **Three CTAs**, current has one. Missing:
```html
<a style="height:44px;padding:0 22px;border:1px solid rgba(255,255,255,.22);color:#e2e8f0;font-size:14.5px;font-weight:600;border-radius:9px">Book a demo</a>
<a style="font-size:14px;font-weight:500;color:#60a5fa">View a sample dashboard →</a>
```
- Primary CTA: `height:44px;padding:0 22px;background:#2563eb;color:#fff;font-size:14.5px;font-weight:600;border-radius:9px` (hover `#1d4ed8`).
- **Stat strip:** current is uppercase/plain; mockup is lowercase mono with white bold values: `4 min question → artifact · 100% queries validated · 0 raw rows sent to an LLM` (`font-size:11.5px;color:#64748b`, values `#e2e8f0`).
- **Product preview panel:** current is a mostly empty dark box with 3 text lines. Mockup (lines 71–107) is a full simulated build: window chrome with 3 dots + `analytiq · create` + green **LIVE BUILD** pill; blue user chat bubble ("Which locations will miss their Q3 revenue target?"); 4 mono status lines with green checks; **3 KPI cards** (Q3 FORECAST $4.82M / AT-RISK LOCATIONS 7/42 / MODEL MAPE 4.1%); SVG line chart (actual vs target vs at-risk forecast) with legend; "Ask a follow-up…" input with blue arrow button.

Panel shell:
```html
<div style="width:100%;background:#0f1729;border:1px solid rgba(255,255,255,.1);border-radius:14px;box-shadow:0 24px 60px rgba(2,6,23,.6);overflow:hidden">
```
LIVE BUILD pill:
```html
<span style="margin-left:auto;display:inline-flex;align-items:center;gap:5px;font-family:'IBM Plex Mono',monospace;font-size:9.5px;font-weight:600;letter-spacing:.06em;color:#4ade80;background:rgba(74,222,128,.1);border:1px solid rgba(74,222,128,.25);border-radius:999px;padding:2px 8px"><span style="width:4px;height:4px;border-radius:50%;background:#4ade80"></span>LIVE BUILD</span>
```
Chat bubble:
```html
<div style="max-width:78%;background:#2563eb;color:#eef4ff;font-size:12.5px;line-height:1.45;padding:9px 13px;border-radius:12px 12px 3px 12px">Which locations will miss their Q3 revenue target?</div>
```
KPI card example:
```html
<div style="background:#111c31;border:1px solid rgba(255,255,255,.07);border-radius:8px;padding:9px 10px">
  <div style="font-family:'IBM Plex Mono',monospace;font-size:8.5px;letter-spacing:.08em;color:#64748b">Q3 FORECAST</div>
  <div style="font-family:'IBM Plex Mono',monospace;font-size:16px;font-weight:600;color:#f1f5f9;margin-top:3px">$4.82M</div>
  <div style="font-family:'IBM Plex Mono',monospace;font-size:9.5px;color:#f87171;margin-top:2px">−6.2% vs target</div>
</div>
```
Chart (full SVG at lines 93–103): actual `#3b82f6` solid 2.5px, target `#60a5fa` dashed, at-risk forecast `#f87171` dashed, area fill `rgba(37,99,235,.18)`, vertical "now" divider.
Follow-up input:
```html
<div style="display:flex;align-items:center;gap:8px;border:1px solid rgba(255,255,255,.1);border-radius:9px;padding:9px 12px;font-size:12px;color:#64748b">Ask a follow-up…<span style="margin-left:auto;display:inline-flex;width:22px;height:22px;border-radius:6px;background:#2563eb;align-items:center;justify-content:center"><!-- arrow svg --></span></div>
```

## 3. "Why not normal BI" section — MISSING entirely

Lines 113–144. Centered eyebrow + H2 + two-column comparison. Left card "Traditional BI" on `#fafbfc` with gray ✕ rows; right card "AnalytIQ" with blue border `#c7d9f8` and glow `box-shadow:0 8px 28px rgba(37,99,235,.08)`, green ✓ rows.

```html
<span style="font-family:'IBM Plex Mono',monospace;font-size:11px;font-weight:600;letter-spacing:.14em;color:#2563eb">WHY NOT NORMAL BI?</span>
<h2 style="margin:0;font-size:34px;font-weight:700;letter-spacing:-.02em;color:#0f172a">Dashboards shouldn't take a sprint</h2>
<p style="margin:0;max-width:560px;font-size:15px;line-height:1.6;color:#64748b">Traditional BI puts an analyst queue between a question and its answer. AnalytIQ puts a governed pipeline there instead.</p>
```
Row pattern: `display:flex;gap:12px;padding:13px 0;border-bottom:1px solid #eef1f5;font-size:14px` with `✕` in `#cbd5e1` / `✓` in `#15803d`. Section: `padding:88px 64px`, grid `1fr 1fr; gap:24px; margin-top:44px`.

Rows — Traditional BI (✕): Weeks of dashboard backlog behind the data team / "Revenue" defined five different ways across tools / Static charts that go stale the week they ship / SQL gatekeeps every follow-up question / Forecasting lives in a separate DS backlog.
Rows — AnalytIQ (✓): A finished dashboard minutes after the question / One governed semantic layer — every metric defined once / Live artifacts with health scores and freshness SLAs / Plain English in, deterministic validated SQL underneath / Forecasts trained, backtested and promoted automatically.

## 4. Value props (4 cards) — present but wrong

Current: plain white cards, no icons, truncated one-liners, on white. Mockup (lines 146–170):

- Band background `#f7f8fa`, top/bottom borders `#e4e8ef`, padding `76px 64px`, grid `repeat(4,1fr); gap:20px`.
- Each card: **34px tinted icon chip** (blue `#eff4ff`, purple `#f3eefe`, teal `#e0f3f8`, green `#e8f5ec`) with inline SVG; title `15.5px/600 #0f172a`; body `13.5px #64748b`, hover `box-shadow:0 6px 20px rgba(15,23,42,.07)`.

```html
<div style="background:#fff;border:1px solid #e4e8ef;border-radius:12px;padding:24px;display:flex;flex-direction:column;gap:12px">
  <span style="width:34px;height:34px;border-radius:9px;background:#eff4ff;display:inline-flex;align-items:center;justify-content:center"><!-- shield-check svg --></span>
  <div style="font-size:15.5px;font-weight:600;color:#0f172a">Governed metrics</div>
  <p style="margin:0;font-size:13.5px;line-height:1.55;color:#64748b">Every chart resolves to one reviewed definition in the semantic layer — never an LLM's guess.</p>
</div>
```
Full mockup copy:
- Governed metrics: "Every chart resolves to one reviewed definition in the semantic layer — never an LLM's guess."
- Predictive models: "Forecasts and risk scores trained per question, backtested, leakage-checked, and promoted with a model card."
- Shareable artifacts: "Dashboards are versioned artifacts — share links, embeds, exports, all scoped by signed tokens."
- No SQL required: "Business users ask in plain English. Admins can always inspect the exact SQL that ran." (icon chip = mono "Aa" in `#15803d`)

## 5. Use Cases section — MISSING entirely

Lines 172–221. Eyebrow `USE CASES`, H2 "Start from a question they already ask" (34px/700), right-aligned "Browse all templates →" (`14px/600 #2563eb`), then **3×2 grid** (`repeat(3,1fr); gap:20px; margin-top:36px`) of clickable cards, each with a decorative 56px SVG chart, title, quoted question, mono category tag:

```html
<a href="Marketing Templates.dc.html" style="text-decoration:none;border:1px solid #e4e8ef;border-radius:12px;padding:22px;display:flex;flex-direction:column;gap:14px;background:#fff">
  <svg viewBox="0 0 240 56" style="width:100%;height:56px"><!-- sparkline art --></svg>
  <div style="font-size:15px;font-weight:600;color:#0f172a">Revenue Forecast</div>
  <div style="font-size:13px;line-height:1.5;color:#64748b">"Where does revenue land this quarter — and what drives the gap?"</div>
  <span style="font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.06em;color:#94a3b8">FINANCE · PREDICTIVE</span>
</a>
```
Hover: `border-color:#c7d9f8; box-shadow:0 8px 24px rgba(15,23,42,.07)`.
Six cards (SVGs at lines 184–214): Revenue Forecast (FINANCE · PREDICTIVE), Customer Churn Risk (CUSTOMER SUCCESS · PREDICTIVE), Operational Risk Monitor (OPERATIONS · ANOMALY), Sales Pipeline Health (SALES · DIAGNOSTIC), Margin Variance (FINANCE · VARIANCE), Inventory Demand Forecast (OPERATIONS · PREDICTIVE).

## 6. Trust strip — MISSING

Lines 223–236. Dark band `background:#0b1220;padding:26px 64px`. Mono label `GOVERNED BY DESIGN` (`10.5px, letter-spacing:.14em, #64748b`), five icon+text items in `#94a3b8` mono 11.5px, gap 28px: No raw data to LLMs / Read-only warehouse access / Deterministic validation gates / Row-level security / Full audit logs. Right link `Security →` in `#60a5fa` 12.5px/600. Icons are 12px inline SVGs stroked `#60a5fa`.

## 7. CTA band — MISSING

Lines 238–248. Centered, `padding:96px 64px;background:#fff`:
```html
<div style="font-family:'IBM Plex Mono',monospace;font-size:12px;color:#94a3b8">$ analytiq create <span style="color:#2563eb">"weekly revenue by region, forecast 8 weeks"</span><span style="color:#2563eb">▌</span></div>
<h2 style="margin:0;font-size:38px;font-weight:700;letter-spacing:-.02em;color:#0f172a">Your next dashboard is a sentence away</h2>
```
Buttons: primary "Start free" (`height:46px;padding:0 24px;background:#2563eb;border-radius:9px;font-size:15px/600`) + outlined "See how it works" (`border:1px solid #d4d9e1;color:#0f172a`).

## 8. Footer — current is one line; mockup is a full dark footer

Lines 250–297. `background:#0b1220;padding:56px 64px 40px`, **5-column grid** `1.4fr 1fr 1fr 1fr 1fr; gap:32px`:
- Brand column: logo (mark on `#1e293b`), wordmark `#f1f5f9` with `IQ` in `#60a5fa`, tagline "The conversational analytics workbench. Ask, watch it build, share the artifact." (`12.5px #64748b`), 3 social icon chips 28×28 `border:1px solid rgba(255,255,255,.12); border-radius:7px` (Twitter/LinkedIn/GitHub).
- Link columns PRODUCT / SOLUTIONS / RESOURCES / COMPANY: mono 10px letterspaced headers `#475569`; links 13px `#94a3b8`, hover `#e2e8f0`.
  - PRODUCT: How it works, Templates, Pricing, Create Workbench
  - SOLUTIONS: For executives, For data teams, For finance, For operations
  - RESOURCES: Documentation, Quickstart, Security, Changelog
  - COMPANY: About, Careers, Contact, Legal
- Bottom bar:
```html
<div style="display:flex;justify-content:space-between;align-items:center;margin-top:44px;padding-top:22px;border-top:1px solid rgba(255,255,255,.08);font-family:'IBM Plex Mono',monospace;font-size:11px;color:#475569">
  <span>© 2026 AnalytIQ, Inc.</span>
  <span>SOC 2 Type II · GDPR · ISO 27001</span>
</div>
```
Current page's `SOC 2 TYPE II · GDPR · ISO 27001 — Powered by AnalytIQ` line moves into this bottom bar (right side); "Powered by AnalytIQ" is not in the mockup.

---

## Priority order to close the gap

1. Load IBM Plex Sans/Mono globally.
2. Dark hero (#0b1220) + fully populated product preview panel.
3. Add missing sections: BI comparison, use cases grid, trust strip, CTA band, full footer.
4. Restore full nav (logo mark + 6 links + Log in / Start free).
5. Restyle value-prop cards (icon chips, full copy, #f7f8fa band).
