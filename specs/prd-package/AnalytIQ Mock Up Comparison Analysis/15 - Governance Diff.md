# 15 — Governance: Mockup vs Current UI

Mockup source: `Governance.dc.html` (line numbers reference that file) — **4 screens**: Overview /app/governance · Human Review Queue /app/governance/review · Definition Review /app/governance/review/:id · Data Quality Rules /app/governance/rules
Reference screenshots (in `screenshots/`): `15-governance-mockup.png` (all 4 mockup frames), `15-governance-current-1.png`, `15-governance-current-2.png`
Status: **The current build is one "Governance ops" utility page** — a raw manifest table with WARN labels plus bare configuration inputs. None of the mockup's 4 screens exist as designed: no overview KPIs, no human review queue, no definition-diff review, no rules table + editor. This area needs to be split into 4 routed screens and rebuilt.

---

## What exists today (map to mockup)

The current page mixes fragments of several mockup screens into one:
- Manifest table (`categories WARN health 60`…) + "Roll back to v1.0.0" → belongs to **Manifest Versions** (/app/governance/manifests, Governance Lineage.dc.html — separate screen, not yet reviewed)
- CONFIGURATION raw inputs (`Set health threshold`, `Set SLA (h)`, `Set contract`) and CUSTOM DQ TESTS (`physical table`, `amount > 0 · col IS NOT NULL`, Add test/Run all) → should become the mockup's **Data Quality Rules** screen (§4)
- DRIFT ("No schema drift recorded") and LINEAGE stubs → Drift belongs in the **Review Queue** (§2); Lineage is its own screen (/app/governance/lineage)

The raw-input pattern (naked text boxes + "Set X" buttons, mono placeholders like `required cols, comma-sep`) is developer tooling, not the designed UI. Everything below replaces it.

## 1. Governance Overview (/app/governance) — MISSING (lines 26–49)

Header: breadcrumb + H1 "Governance" + right amber pill `6 ITEMS AWAITING REVIEW` (`#fdf3e3`/`#b45309`).

**KPI card grid** (4 cols, clickable, each links to its area):
```html
<a href="/app/governance/review" style="border:1px solid #e4e8ef;border-radius:10px;padding:16px 18px;display:flex;flex-direction:column;gap:6px" style-hover="border-color:#c7d9f8;box-shadow:0 6px 18px rgba(15,23,42,.06)">
  <span style="font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:.08em;color:#94a3b8">TABLES BLOCKED</span>
  <span style="font-family:'IBM Plex Mono',monospace;font-size:24px;font-weight:600;color:#dc2626">1</span>
  <span style="font-size:11.5px;color:#64748b">wms_events · contract failure</span>
</a>
```
Cards: TABLES BLOCKED 1 (red) · REVIEW ITEMS 6 (amber, "2 high priority") · PII FLAGS 2 (amber) · FRESHNESS BREACHES 1 (red) · SCHEMA DRIFT 3 (amber, "2 auto-adapted · 1 review") · CONTRACT FAILURES · 7D 4 (neutral, "all repaired automatically") · **WORKSPACE HEALTH TREND** span-2 card: 92 green + inline sparkline SVG (`stroke:#15803d`).

## 2. Human Review Queue (/app/governance/review) — MISSING (lines 52–106)

**Tab row with counts**: `All · 6` (active) · Definitions · 1 · Metric conflicts · 1 · PII · 2 · Leakage · 0 · Bridge tables · 1 · Drift · 1. Right: **Bulk approve** + **Assign ▾** outlined buttons.

**Queue table** (grid `26px 2.4fr 1fr .9fr .9fr 1.1fr`, rows 50px, mono header on `#fafbfc`): checkbox · ITEM (bold title + mono context line) · TYPE pill · CONFIDENCE (mono, colored: <0.7 amber, ≥0.85 green) · ASSIGNEE avatar · ACTIONS.

Type pills: `CONFLICT` purple `#f3eefe`/`#7c3aed` · `PII` red `#fdeaea`/`#dc2626` · `BRIDGE` teal `#e0f3f8`/`#0e7490` · `DRIFT` amber `#fdf3e3`/`#b45309`.

Per-row actions:
```html
<span style="...background:#e8f5ec;color:#15803d">Accept</span>
<span style="...border:1px solid #d4d9e1;color:#334155">Edit</span>
<span style="...border:1px solid #f4c7c7;color:#dc2626">Reject</span>
```
Rows: `"active_customer" defined 2 ways` (CONFLICT, 0.58, "affects 14 dashboards") · `PII suspected · customers.zip4` (PII, 0.94) · `Bridge table recommended · orders ↔ promotions` (BRIDGE, 0.87, "est. inflation ×3.2") · `Schema drift · orders.discount_pct FLOAT → STRING` (DRIFT, 0.99, "3 artifacts affected").

## 3. Definition Review — diff view (/app/governance/review/:id) — MISSING (lines 109–153)

The flagship governance screen. Structure:

**Header**: "Metric conflict · `active_customer`" (metric name mono blue) + amber pill `CONFIDENCE 0.58 · NEEDS HUMAN`; subcopy "Two live definitions detected. Choose one, edit, or merge — every affected artifact re-validates on approve."; right mono `queued 2d ago · assigned MO`.

**Side-by-side diff** (2 cols):
- LEFT — `CURRENT · SEMANTIC v11` + gray pill `IN USE · 9 DASHBOARDS`. Plain-English definition card with **red highlights** on the differing terms (`background:#fdeaea;color:#b91c1c;border-radius:4px;padding:1px 5px`): "…trailing **90 days**, excluding **cancelled orders**." + light mono SQL block.
- RIGHT — `PROPOSED · AI FROM FINANCE USAGE` (blue) + pill `SEEN IN 5 QUERIES`, column bg `#f8faff`. Definition card (blue border) with **green highlights**: "…trailing **60 days**, excluding **cancellations and full refunds**." + **dark SQL block** with green-highlighted diff tokens:
```html
<div style="background:#0b1220;border-radius:8px;padding:10px 12px;font-family:'IBM Plex Mono',monospace;font-size:10px;line-height:1.7;color:#93c5fd">COUNT(DISTINCT customer_id)<br>WHERE order_ts >= DATEADD(day,<span style="color:#4ade80">-60</span>,now)<br>AND is_cancelled = FALSE <span style="color:#4ade80">AND refund_pct &lt; 1.0</span></div>
```

**Evidence + Final definition row** (grid `1.4fr 1fr`): EVIDENCE narrative ("Finance ran 5 ad-hoc queries in June… median 41 days.") + affected-artifact chips (`Churn Risk — Enterprise`, `Exec Weekly`, `+12 more`); FINAL DEFINITION (EDITABLE) text box.

**Action bar** (on `#fafbfc`): green **"Approve — re-validate 14 dashboards"** (`background:#15803d`) · outlined "Request changes" · red text "Reject proposal" · right mono `decision recorded in audit log`.

## 4. Data Quality Rules (/app/governance/rules) — replace raw config inputs (lines 156–194)

Two-panel layout `1.6fr 1fr`:

**Left — rules table**: header "Quality rules 24" + `+ Add rule` primary; columns RULE / TYPE / THRESHOLD / ON (grid `1.8fr 1fr .9fr .6fr`, rows 44px, selected row `#f8faff`). Rows: `orders · pk uniqueness` (primary key, 100%) · `orders.net_amount · null cap` (null threshold, < 0.5%) · `pos feed · freshness` (freshness SLA, ≤ 1h) · `order_items · row count band` (row count, ±15% d/d) · `aov distribution drift` (drift (PSI), < 0.2, toggled OFF). ON column = 30×17 toggle (`#2563eb` on / `#cbd5e1` off).

**Right — Edit rule panel** (on `#fafbfc`): Rule type dropdown ("Primary key uniqueness") with mono helper line `pk · null threshold · freshness SLA · row count · distribution drift · PII · custom test`; Target (`orders.order_id` mono) + Threshold (`100%`) side by side; **Custom test (optional)** dark SQL block (`SELECT COUNT(*) = COUNT(DISTINCT order_id) FROM orders`) + mono caption `admin only · runs read-only`; **"Block artifacts on failure"** toggle; Save rule (filled) + Cancel.

This replaces the current CONFIGURATION/CUSTOM DQ TESTS raw inputs 1:1 — same capabilities, designed form.

---

## Priority order

1. Split the single ops page into the 4 routed screens.
2. Review Queue + Definition Review diff — the "human in the loop" flow is a core product claim and fully absent.
3. Overview KPI cards (entry point + at-a-glance state).
4. Rules table + editor replacing raw config inputs.
5. Move manifest list/rollback to the Manifest Versions screen (will be covered with Governance Lineage).
