# 10 — App Home, Activity & Notifications: Mockup vs Current UI

Mockup source: `App Home.dc.html` (line numbers reference that file) — 3 screens: Workspace Home /app, Recent Activity /app/activity, Notifications drawer /app/notifications
Reference screenshots (in `screenshots/`): `10-home-mockup-1.png` (Home + Activity), `10-home-mockup-2.png` (Notifications drawer), `10-home-current.png`, `10-home-current-notifications.png`
Status: **Home is the closest match so far** — layout, sidebar, and widget grid are structurally right. But the **Recent Activity page (/app/activity) is MISSING ENTIRELY (user-confirmed)**, and there is **no link to it anywhere**. Notifications drawer exists but is missing several patterns.

---

## ❌ Recent Activity page (/app/activity) — MISSING ENTIRELY (lines 248–368)

Full app-shell page, content column `max-width:1000px`. Must be built:

**Header:** breadcrumb mono `acme-retail / activity` + H1 "Recent activity" (21px/600).

**Filter row:** pill tabs (All active dark, then Builds · Governance · Data · Sharing) + right-aligned date-range picker:
```html
<span style="display:inline-flex;align-items:center;height:30px;padding:0 13px;border-radius:999px;background:#0f172a;color:#fff;font-size:12.5px;font-weight:600">All</span>
<span style="...border:1px solid #d4d9e1;background:#fff;color:#47516b;font-weight:500">Builds</span>
<span style="margin-left:auto;...font-family:'IBM Plex Mono',monospace;font-size:11px">Jun 26 → Jul 3 ▾</span>
```

**Timeline card** (white, `padding:6px 22px`): each row = icon tile (28px, tinted per event type) with a 1px vertical connector line below it, rich text, mono metadata line, mono timestamp, 26px actor avatar:
```html
<div style="display:flex;gap:14px;padding:15px 0;border-bottom:1px solid #eef1f5">
  <div style="display:flex;flex-direction:column;align-items:center">
    <span style="width:28px;height:28px;border-radius:8px;background:#eff4ff;..."><!-- event icon --></span>
    <span style="flex:1;width:1px;background:#eef1f5;margin-top:6px"></span>
  </div>
  <div style="flex:1;display:flex;flex-direction:column;gap:3px">
    <span style="font-size:13px;color:#334155"><strong style="color:#0f172a;font-weight:600">Dana Kim</strong> built <a style="color:#2563eb;font-weight:500">Q3 Revenue Forecast</a> from a prompt</span>
    <span style="font-family:'IBM Plex Mono',monospace;font-size:10.5px;color:#94a3b8">pipeline 9/9 stages passed · model v2 promoted</span>
  </div>
  <span style="font-family:'IBM Plex Mono',monospace;font-size:10.5px;color:#94a3b8">09:12</span>
  <span style="width:26px;height:26px;border-radius:50%;background:#0e7490;color:#fff;font-size:9.5px;font-weight:700">DK</span>
</div>
```
Event types shown (icon tint / avatar): build `#eff4ff` blue / user · governance approval `#f3eefe` purple / user · alert fired `#fdeaea` red / red "!" · share `#e0f3f8` teal / user · schema drift `#fdf3e3` amber / gray "SYS" · model retrain `#e8f5ec` green / "SYS". Footer: centered "Load more" outlined button (34px).

### ➕ REQUIRED ADDITION: link Activity from Home
The current Home has no route to the activity page (and neither does the mockup's home explicitly — add one). Recommended: a "View all activity →" link in the Home header row, next to the date stamp, styled like the other widget header links:
```html
<a href="/app/activity" style="font-size:12px;font-weight:600;color:#2563eb;text-decoration:none">View all activity →</a>
```
Alternative/additional placement: a link at the bottom of the Notifications drawer ("View all activity →") since notifications and activity overlap. At minimum one discoverable entry point must exist.

## ✅ Workspace Home /app — close match, remaining deltas (lines 24–246)

Structure, sidebar (Home/Create/Artifacts · DATA · INTELLIGENCE · Team/Admin/Billing/Settings/Collapse), topbar, hero input, and 3-column widget grid all match. Remaining gaps:

1. **Notification bell shows a red "0" badge.** Badge must be hidden when count is 0 (mockup badge pattern only renders with unread > 0): `min-width:15px;height:15px;background:#dc2626;...;border:2px solid #fff`.
2. **Data health panel values aren't color-coded.** Mockup: healthy values green `#15803d`, problem values amber `#b45309`, all mono-font (`Sources healthy 11/12` green, `Schema drift 1 table` amber, `PII flags 2 open` amber). Current shows plain dark text. Ring color should also track score (current shows green at 76; mockup ring at 92 uses `stroke:#15803d` — define thresholds, e.g. amber < 85).
3. **Awaiting review widget:** mockup has a large amber count (`font-size:18px;color:#b45309`) in the header, colored dot bullets per item (`#7c3aed` DEF, `#dc2626` PII, `#b45309` DRIFT), mono type tags right-aligned, and the "Open review queue →" link at the BOTTOM (current puts it in the header, no count, no dots).
4. **Recently viewed rows lack mini chart thumbnails** — mockup prefixes each row with a 34×16 inline SVG sparkline/bar/donut.
5. **Usage & cost:** mockup shows a w/w delta in green mono (`−8% w/w`) and a 7-bar mini bar chart SVG under the number. Current has neither (text "0.74% of plan" is fine to keep as caption).
6. **Recent artifact cards:** mockup previews include skeleton KPI-bar rows above varied chart types (line/bars/donut); current shows three identical line charts. Also card timestamps mono 9.5px.
7. **Empty states** (current: "No runs in flight", "Quiet — nothing firing", "Suggestions appear as the platform learns your data") — not defined in mockup; keep, but style captions as 12.5px `#64748b`.

## ⚠️ Notifications drawer — exists, missing patterns (lines 370–440)

Current has header (Mark all read, ✕) and All/Unread/Mentions pills. Missing:

1. **Background scrim:** mockup dims the app behind the drawer: `background:rgba(15,23,42,.28)`. Current shows no dimming.
2. **Drawer spec:** width 420px, `border-left:1px solid #e4e8ef; box-shadow:-16px 0 48px rgba(15,23,42,.18)`.
3. **Date group headers:** mono letterspaced `TODAY / YESTERDAY / EARLIER` (9.5px `#94a3b8`).
4. **Unread row treatment:** `background:#f8faff;border-left:2px solid #2563eb` + blue dot (7px) at right.
5. **Row anatomy:** 28px tinted icon tile per type (alert red, mention teal "@", build-success green check, governance purple shield, freshness amber clock, team blue person, models green trend) + body 12.5px + mono caption (`12m ago · Daily revenue guard`).
6. **Unread pill count styling:** count in red mono inside the pill (`font-size:9.5px;color:#dc2626`), only shown when > 0 — current shows "Unread · 0".
7. Empty state "Nothing yet" is fine; consider adding "View all activity →" footer link (see Activity section).
