# 06 — Security Page (/security): ❌ PAGE MISSING ENTIRELY

**Status: Does not exist in the current build. Build from scratch.**
Mockup source: `Marketing Security.dc.html`
Reference screenshot (in `screenshots/`): `06-security-mockup.png` if added — no current-UI screenshot exists because the page is unbuilt

---

## Page structure

1. Shared marketing nav (Security active)
2. Left-aligned header with compliance badge pills
3. Two-column body: sticky "ON THIS PAGE" jump nav (250px) + 8 security section cards

## 1. Header (lines 47–56)

`padding:56px 64px 30px; max-width:1328px`:
```html
<span style="font-family:'IBM Plex Mono',monospace;font-size:11px;font-weight:600;letter-spacing:.14em;color:#2563eb">SECURITY &amp; GOVERNANCE</span>
<h1 style="margin:0;font-size:38px;font-weight:700;letter-spacing:-.02em;color:#0f172a;max-width:720px">Built so your data team says yes</h1>
```
Compliance pills (30px, mono 10.5px `#334155`, green icons `#15803d`):
```html
<span style="display:inline-flex;align-items:center;gap:7px;height:30px;padding:0 13px;border:1px solid #e4e8ef;border-radius:999px;font-family:'IBM Plex Mono',monospace;font-size:10.5px;color:#334155"><!-- shield svg -->SOC 2 Type II</span>
```
Pills: SOC 2 Type II · ISO 27001 · GDPR / CCPA · AES-256 at rest · TLS 1.3.

## 2. Sticky jump nav (lines 59–70)

`position:sticky;top:24px`, mono label `ON THIS PAGE`. Active link filled:
```html
<a href="#sec-llm" style="padding:8px 12px;border-radius:7px;font-size:12.5px;font-weight:600;color:#1d4ed8;background:#eff4ff;text-decoration:none">No raw data to LLMs</a>
<!-- inactive: font-weight:500;color:#47516b, hover background:#f1f4f9 -->
```
Items: No raw data to LLMs · Read-only access · Validation gates · PII detection · Audit logs · Row-level security · Signed embed tokens · Workspace scoping.

## 3. Section cards (lines 73–129)

Stacked, gap 14px. Pattern: bordered card, 38px tinted icon chip + title 15.5px/600 + body 13.5px `#64748b`:
```html
<div id="sec-llm" style="border:1px solid #e4e8ef;border-radius:12px;padding:22px 26px;display:flex;gap:18px">
  <span style="width:38px;height:38px;border-radius:11px;background:#eff4ff;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0"><!-- icon svg --></span>
  <div style="display:flex;flex-direction:column;gap:6px">
    <span style="font-size:15.5px;font-weight:600;color:#0f172a">No raw data ever reaches an LLM</span>
    <p style="margin:0;font-size:13.5px;line-height:1.65;color:#64748b">Models see schemas, governed definitions, and aggregate result shapes — never row-level data. Answer generation runs on statistical summaries computed inside your warehouse boundary.</p>
  </div>
</div>
```

All 8 cards (title / chip tint / body summary):
1. **No raw data ever reaches an LLM** — blue `#eff4ff` — schemas & aggregates only, summaries computed inside warehouse boundary.
2. **Read-only warehouse access** — green `#e8f5ec` — dedicated read-only role; gold tables written only to isolated schema.
3. **Deterministic validation gates** — blue — SQL safety analysis + shape/contract checks; failures repair or halt.
4. **PII detected, masked, human-reviewed** — amber `#fdf3e3` — flagged on ingestion, masked by default, steward unmask logged.
5. **Every action in the audit log** — purple `#f3eefe` — builds/approvals/shares/exports/permissions; CSV/JSON export; SIEM streaming on Enterprise.
6. **Row-level security with a simulator** — teal `#e0f3f8` — policies scope every query; admins preview as any user.
7. **Signed, expiring share & embed tokens** — blue — expiration, password, domain allow-list, instant revocation.
8. **Workspace-scoped everything** — green — cross-workspace access off by default.
