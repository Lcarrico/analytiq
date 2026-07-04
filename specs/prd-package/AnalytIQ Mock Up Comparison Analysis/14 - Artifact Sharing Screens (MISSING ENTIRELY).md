# 14 — Artifact Sharing Screens: ❌ ALL 4 MISSING ENTIRELY

**Status: None of these four screens exist in the current build (user-confirmed). Build from scratch.**
Mockup source: `Artifact Sharing.dc.html` (line numbers reference that file)
Reference screenshots (in `screenshots/`): `14-sharing-mockup-viewer.png`, `14-sharing-mockup-expired.png`, `14-sharing-mockup-present.png`, `14-sharing-mockup-embed.png`. No current-UI screenshots — nothing exists.

These are the delivery surfaces for the product's "shareable artifacts" pillar: the public viewer, its expired state, embed configuration, and present mode.

---

## Screen 1 — Public Artifact Viewer (/share/:token, lines 25–75) — NO app shell

Standalone page for external viewers. Structure top to bottom:

**Brand bar (54px):**
```html
<span style="width:24px;height:24px;border-radius:7px;background:#7c3aed;color:#fff;...">AR</span>
<span style="font-size:13.5px;font-weight:600;color:#0f172a">Acme Retail Analytics</span>
<span style="width:1px;height:20px;background:#e4e8ef"></span>
<span style="font-size:13px;color:#64748b">Ops Risk Monitor</span>
<span style="...background:#e8f5ec;color:#15803d">● DATA 3H OLD</span>
<!-- right: mono "read-only · expires Aug 2" + outlined "Request access" button (32px) -->
```
Note: uses the **workspace's branding** (purple AR tile from onboarding branding step), not AnalytIQ's.

**Viewer filter bar (42px):** mono `FILTERS` + permitted filter chips (`last 30 days ▾`, `region: all ▾` — blue tint, interactive) + right mono caption `viewer filters permitted · no editing`.

**Dashboard body** (`padding:26px 90px` on `#f4f5f8`): 3 KPI cards (OPEN RISKS 12 amber / 3 critical red · SLA COMPLIANCE 97.2% / +0.8pt m/m green · MEAN TIME TO RESOLVE 6.4h / −1.1h m/m green — mono 23px values), then grid `1.5fr 1fr`: "Risk events · daily" bar chart (blue bars with amber/red severity bars) + "Top risk sources" horizontal bars (cold chain red 82% · carrier delay amber 64% · stockout blue 46% · labor gap light-blue 31%).

**Footer (44px):** centered logo mark 14px + mono `Powered by AnalytIQ`.

## Screen 2 — Expired token state (/share/:token, lines 78–93)

Same brand bar (48px), then centered empty state:
```html
<span style="width:56px;height:56px;border-radius:16px;background:#fdf3e3;..."><!-- amber clock svg #b45309 --></span>
<h2 style="margin:0;font-size:19px;font-weight:600;color:#0f172a">This share link has expired</h2>
<span style="font-size:13px;line-height:1.6;color:#64748b">The link to <strong>Ops Risk Monitor</strong> expired on Aug 2, 2026, or was revoked by the workspace owner.</span>
<span style="...height:36px;background:#2563eb;border-radius:8px;color:#fff">Request a new link</span>
```

## Screen 3 — Embed Preview (/app/artifacts/:id/embed, lines 95–158)

Two-column layout `1.35fr 1fr`:

**Left — Live preview** on `#f7f8fa`: header "Live preview" + mono `16:9 · iframe`; a fake browser frame (30px chrome bar with two dots + URL pill `acme-portal.example.com/analytics` in mono 8.5px) containing a mini version of the dashboard (3 KPI tiles, bar chart, centered "Powered by AnalytIQ" footer).

**Right — Embed settings:**
1. **Embed code** dark block with floating Copy button:
```html
<div style="background:#0b1220;border-radius:9px;padding:12px 14px;position:relative">
  <code style="font-family:'IBM Plex Mono',monospace;font-size:10.5px;line-height:1.7;color:#93c5fd">&lt;iframe src="https://analytiq.app/embed/tok_9f2ae81cc4" width="100%" height="480" frameborder="0"&gt;&lt;/iframe&gt;</code>
  <span style="position:absolute;top:9px;right:9px;...background:rgba(255,255,255,.1);color:#e2e8f0">Copy</span>
</div>
```
2. **Token scope** checkboxes: Read-only data ✓ · Viewer filters ✓ · Drill-through ☐ · Data export ☐.
3. **Expires** (mono `Oct 1, 2026`) + **Refresh** (`On load`) dropdowns side by side.
4. **Allowed domains** chip input: `acme-portal.example.com ✕`, `*.acmeretail.com ✕` (blue mono pills) + "Add domain…" ghost.
5. **Save embed settings** primary button.

## Screen 4 — Present Mode (/app/artifacts/:id/present, lines 161–199) — full-screen, chrome-free

Dark stage `background:#0b1220`:
- **Slide header**: section title 24px/600 `#f8fafc` + right mono `section 2 / 6` (`#64748b`).
- **Chart panel**: `background:#0f1729;border:1px solid rgba(255,255,255,.09);border-radius:14px;padding:26px 30px` — large SVG (actual `#3b82f6` 3.5px, forecast `#60a5fa` dashed, target `#64748b` dashed, CI polygon `rgba(37,99,235,.15)`, "now" divider) + mono legend row.
- **Floating control pill** (bottom center):
```html
<div style="position:absolute;bottom:22px;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:4px;background:rgba(15,23,41,.92);border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:6px 8px;box-shadow:0 12px 40px rgba(2,6,23,.5)">
  <!-- ‹ prev · mono "2 / 6" · next › · divider · "Notes" toggle (active bg rgba(255,255,255,.08)) · ✕ exit -->
</div>
```
- **Presenter notes drawer** (bottom, toggled): `background:rgba(11,18,32,.97);border-top:1px solid rgba(255,255,255,.1)`; mono label `PRESENTER NOTES · AUTO-GENERATED NARRATIVE`; body 14px `#cbd5e1` with mono inline numbers — "Q3 tracks at $4.82M against a $5.14M target. The divergence starts in week 27 and concentrates in Northeast… reallocating promo budget from West could close roughly 40% of the gap."

---

## Build notes

- /share/:token must render **without any app shell or auth**, gated only by token validity; expired/revoked tokens fall through to Screen 2.
- Workspace branding (logo tile, name, accent) comes from the branding settings in onboarding/admin — same tokens drive viewer, embed preview, and email digests.
- Entry points to wire: Share modal (doc 12 §4) → public link → Screen 1; Embed tile → Screen 3; canvas toolbar present ▶ (doc 11 §7) and Solutions page "See present mode" → Screen 4.
