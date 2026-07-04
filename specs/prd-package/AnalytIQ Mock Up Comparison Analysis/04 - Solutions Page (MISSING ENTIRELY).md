# 04 — Solutions Pages (/solutions/*): ❌ PAGE MISSING ENTIRELY

**Status: Does not exist in the current build. Build from scratch.**
Reference screenshot (in `screenshots/`): `04-solutions-mockup.png` if added — no current-UI screenshot exists because the page is unbuilt
Mockup source: `Marketing Solutions.dc.html`. One shared template covers **6 routes**: /solutions/executives · /data-teams · /operations · /finance · /sales · /customer-success (mockup shows the Executives variant).

---

## Page structure

1. Shared marketing nav (Solutions active)
2. Persona tab pills (centered)
3. Persona hero (text + dark digest card)
4. "Starting points" template cards (3)
5. Dark quote band
6. Three feature callouts
7. Gray CTA band

## 1. Persona tabs (lines 47–55)

Centered pill row, `padding:22px 40px 0`. Active = dark fill; inactive = outlined:
```html
<span style="display:inline-flex;align-items:center;height:32px;padding:0 15px;border-radius:999px;background:#0f172a;color:#fff;font-size:12.5px;font-weight:600">Executives</span>
<span style="...;border:1px solid #d4d9e1;color:#47516b;font-weight:500">Data teams</span>
```
Tabs: Executives · Data teams · Operations · Finance · Sales · Customer success.

## 2. Hero (lines 57–74)

Grid `1.05fr .95fr; gap:56px; padding:52px 64px 60px; max-width:1328px`.

Text side:
```html
<span style="font-family:'IBM Plex Mono',monospace;font-size:11px;font-weight:600;letter-spacing:.14em;color:#2563eb">FOR EXECUTIVES</span>
<h1 style="margin:0;font-size:38px;font-weight:700;letter-spacing:-.02em;line-height:1.12;color:#0f172a">Answers before the meeting, not after the sprint</h1>
<p style="margin:0;max-width:480px;font-size:15px;line-height:1.65;color:#64748b">Ask the question you'd ask your analyst. Get a governed dashboard with a forecast and a plain-English narrative — in minutes, with an audit trail your data team trusts.</p>
```
CTAs: "Start free" (filled 42px) + "See present mode" (outlined).

Visual side — dark digest card:
```html
<div style="background:#0b1220;border-radius:14px;padding:20px;box-shadow:0 20px 50px rgba(2,6,23,.35)">
  <!-- header: "Monday 8am digest" (#e2e8f0 12.5px/600) + "auto-generated" (mono 9px #64748b) -->
  <!-- narrative 12.5px #94a3b8 with inline highlights: $4.82M mono #f1f5f9, "Northeast" #f87171, "+3.9%" #4ade80 -->
  <!-- SVG trend chart with forecast split -->
  <!-- pills: GOVERNED (green tint) · MAPE 4.1% (blue tint) -->
</div>
```

## 3. Starting points (lines 76–93)

Mono label `STARTING POINTS FOR EXECUTIVES` (10.5px `#94a3b8`), 3-col grid, gap 18px. Card = SVG preview strip on `#f7f8fa` + text block:
```html
<a style="border:1px solid #e4e8ef;border-radius:12px;overflow:hidden" style-hover="border-color:#c7d9f8;box-shadow:0 10px 28px rgba(15,23,42,.08)">
  <div style="background:#f7f8fa;border-bottom:1px solid #eef1f5;padding:14px"><svg .../></div>
  <div style="padding:14px 16px"><span style="font-size:14px;font-weight:600;color:#0f172a">Exec Weekly Revenue</span><span style="font-size:12px;color:#64748b">Trend + forecast + one narrative paragraph.</span></div>
</a>
```
Cards: Exec Weekly Revenue · Board Pack KPIs ("The 8 numbers the board asks about, always fresh.") · Risk & Exceptions Brief ("What broke, what's drifting, who owns it.")

## 4. Quote band (lines 95–105)

`padding:56px 64px;background:#0b1220`, centered max-width 860px. Blue quote mark (mono 22px `#2563eb`), quote 21px/500 `#e2e8f0`:
> "I stopped asking for decks. I ask AnalytIQ on Sunday night and walk into Monday's exec meeting with the answer — and the receipts."

Attribution: purple avatar circle "RM" (`background:#7c3aed`), name "Rosa Martínez" (`#f1f5f9` 13px/600), role mono 10px `#64748b` "COO · national retail chain".

## 5. Feature callouts (lines 107–124)

3-col grid of bordered cards (`padding:20px;border-radius:12px`), each: 32px tinted icon chip + title 14.5px/600 + body 12.5px `#64748b`:
- **Present mode** (blue chip `#eff4ff`): "Full-screen sections with auto-generated speaker notes."
- **Alerts that matter** (red chip `#fdeaea`): "One Slack ping when a region drifts off target — not fifty."
- **Numbers that reconcile** (green chip `#e8f5ec`): "Every figure traces to one governed definition. No dueling decks."

## 6. CTA band (lines 126–129)

`padding:60px 64px;background:#f7f8fa;border-top:1px solid #e4e8ef`, centered:
```html
<h2 style="margin:0;font-size:28px;font-weight:700;letter-spacing:-.02em;color:#0f172a">Bring one real question. That's the demo.</h2>
```
Buttons: "Start free" (filled 44px) + "Book a demo" (outlined `#d4d9e1`).
