# 02 — Pricing Page (/pricing): Mockup vs Current UI

Mockup source: `Marketing Pricing.dc.html` (line numbers reference that file)
Reference screenshots (in `screenshots/`): `02-pricing-mockup.png` (mockup), `02-pricing-current.png` (current UI)
Status: Plan cards exist but with wrong data, wrong styling, and no CTAs. Toggle, comparison table, FAQ, and footer are **missing entirely**. Nav confirms 5 marketing pages still unbuilt.

---

## ⚠️ Data/content errors (not just styling — the numbers are wrong)

| Plan | Current UI says | Mockup says |
|---|---|---|
| Starter | 1 seat | **3 seats · 1 source** |
| Starter | "Dashboards" | **5 artifacts**, plus excluded rows: — Predictive models, — Public share links |
| Team | 5 seats | **10 seats · 3 sources** |
| Team | 1M tokens | **500K tokens/mo** |
| Team | (missing) | **Unlimited artifacts** |
| Business | 5M tokens | **2M tokens/mo · overage $8/100K** |
| Business | "Audit export" | **SSO · RLS · full audit log / Signed embeds + public links / Priority support** |
| Enterprise | "SIEM streaming" | Not in mockup. Mockup: **Unlimited seats & sources / Custom token pools / VPC · private link / 99.9% SLA · DPA · SOC 2 reports / Dedicated success engineer** |

## 1. Nav — same gaps as Landing

Only "Pricing" link; missing logo mark SVG, Product/Solutions/Templates/Security/Docs links, "Log in"/"Start free" casing. See `01 - Landing Page Diff.md` §1 for exact code. On this page, Pricing is the active item: `<span style="color:#0f172a;font-weight:600">Pricing</span>`.

## 2. Page header — wrong headline, missing toggle

Current: plain left-aligned "Pricing" H1, nothing else. Mockup (lines 48–55): centered header block, `padding:56px 64px 22px`:

```html
<h1 style="margin:0;font-size:38px;font-weight:700;letter-spacing:-.02em;color:#0f172a">Pay for answers, not seats you don't use</h1>
<p style="margin:0;font-size:15px;color:#64748b">Every plan includes governed metrics, validation gates, and read-only connections.</p>
```

**Monthly/Annual toggle — MISSING entirely:**
```html
<div style="display:flex;align-items:center;border:1px solid #d4d9e1;border-radius:999px;overflow:hidden;margin-top:6px">
  <span style="display:inline-flex;align-items:center;height:34px;padding:0 17px;background:#fff;color:#64748b;font-size:12.5px;font-weight:500;cursor:pointer">Monthly</span>
  <span style="display:inline-flex;align-items:center;gap:7px;height:34px;padding:0 17px;background:#0f172a;color:#fff;font-size:12.5px;font-weight:600">Annual<span style="display:inline-flex;height:17px;padding:0 7px;border-radius:999px;background:#15803d;font-family:'IBM Plex Mono',monospace;font-size:8.5px;font-weight:600;align-items:center">−20%</span></span>
</div>
```

## 3. Plan cards (lines 57–111)

Grid: `repeat(4,1fr); gap:16px; padding:26px 64px 30px; max-width:1328px`.

Missing from ALL current cards:
- **"/mo" price suffix** — `<span style="font-size:12px;color:#94a3b8">/mo</span>` beside a mono 30px price: `font-family:'IBM Plex Mono',monospace;font-size:30px;font-weight:600`
- **Descriptor line** under price (12px `#64748b`): "Try the loop on one dataset." / "For teams shipping weekly answers." / "Governance for the whole org." / "Scale, isolation, and guarantees."
- **CTA buttons — none exist in current UI.** Mockup has one per card:
```html
<!-- Starter / Team: outlined -->
<a style="display:inline-flex;align-items:center;justify-content:center;height:38px;border:1px solid #d4d9e1;border-radius:9px;color:#0f172a;font-size:13px;font-weight:600">Start free</a>
<!-- Business / Enterprise: filled -->
<a style="display:inline-flex;align-items:center;justify-content:center;height:38px;background:#2563eb;border-radius:9px;color:#fff;font-size:13px;font-weight:600">Start trial</a>  <!-- Enterprise: "Talk to sales" -->
```
- **Excluded-feature rows** (em-dash, grayed) on Starter/Team:
```html
<span style="display:flex;gap:8px;color:#94a3b8"><span style="color:#cbd5e1;font-weight:700">—</span>Predictive models</span>
```
- Feature rows: `12.5px #334155`, check `✓` in `#15803d`, gap 7px; token counts wrapped in mono 11.5px.

**Business card** (lines 84–96): current has thin blue border and "MOST POPULAR" as inline text inside the card. Mockup: 2px border + glow, and the badge is a floating pill overlapping the top edge:
```html
<div style="border:2px solid #2563eb;border-radius:13px;padding:24px;position:relative;box-shadow:0 16px 40px rgba(37,99,235,.12)">
  <span style="position:absolute;top:-11px;left:20px;display:inline-flex;height:22px;padding:0 11px;border-radius:999px;background:#2563eb;color:#fff;font-family:'IBM Plex Mono',monospace;font-size:9px;font-weight:600;align-items:center;letter-spacing:.06em">MOST POPULAR</span>
```

**Enterprise card** (lines 98–110): current is white like the others. Mockup is **dark navy**:
```html
<div style="border:1px solid #0b1220;border-radius:13px;padding:24px;background:#0b1220">
  <span style="font-size:15px;font-weight:600;color:#f1f5f9">Enterprise</span>
  <!-- price "Custom" in #f1f5f9 mono 30px; descriptor #94a3b8; features #cbd5e1 with ✓ in #4ade80 -->
```

## 4. Comparison table — MISSING entirely

Lines 113–123. Bordered rounded table, 5-col grid `1.6fr 1fr 1fr 1fr 1fr`, 42px rows. Header row on `#fafbfc` in mono 9.5px letterspaced (`COMPARE / STARTER / TEAM / BUSINESS / ENTERPRISE`, Business highlighted `#1d4ed8`):
```html
<div style="display:grid;grid-template-columns:1.6fr 1fr 1fr 1fr 1fr;padding:0 22px;height:42px;align-items:center;background:#fafbfc;border-bottom:1px solid #e4e8ef;font-family:'IBM Plex Mono',monospace;font-size:9.5px;font-weight:600;letter-spacing:.06em;color:#64748b">
```
Rows: Monthly tokens included (100K / 500K / **2M** / custom, mono) · Predictive models + model cards (— ✓ ✓ ✓) · SSO (SAML/OIDC) + row-level security (— — ✓ ✓) · Signed public links + embeds (— `links only` ✓ ✓) · Audit log export · VPC · SLA (— — `audit only` ✓). Partial values are mono 10.5px `#64748b`; ✓ `#15803d`; — `#cbd5e1`.

## 5. FAQ ("Questions") — MISSING entirely

Lines 125–135. Centered H2 22px "Questions", max-width 860px, accordion cards. First item expanded:
```html
<div style="border:1px solid #e4e8ef;border-radius:10px;padding:15px 18px;display:flex;flex-direction:column;gap:8px">
  <div style="display:flex;justify-content:space-between;align-items:center;cursor:pointer"><span style="font-size:13.5px;font-weight:600;color:#0f172a">What counts as a token?</span><!-- chevron-down svg --></div>
  <span style="font-size:13px;line-height:1.6;color:#64748b">Tokens meter the AI planning work — understanding questions, planning dashboards, writing narratives. Viewing dashboards, filtering, and scheduled refreshes of existing artifacts don't consume tokens.</span>
</div>
```
Collapsed items (chevron-right): "What happens when we hit our token limit?" · "Does my data ever leave my warehouse?" · "Can we switch plans or cancel anytime?" Hover: `border-color:#c7d9f8`.

## 6. Footer — MISSING

Current pricing page has no footer at all. Mockup marketing pages share the dark 5-column footer — see `01 - Landing Page Diff.md` §8.

---

## Priority order

1. Fix plan data (seats/tokens/features are factually wrong).
2. Add CTA buttons to every card.
3. Enterprise card → dark navy; Business badge → floating pill + 2px border/glow.
4. Add header headline/subcopy + Monthly/Annual toggle.
5. Add comparison table and FAQ sections.
6. Add shared footer; fix nav; IBM Plex fonts.
