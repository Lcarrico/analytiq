# AnalytIQ — UI Build Plan

Every page from PRD v3.0 + billing/token pages. Check `[x]` = built & verified.
Presentation: each `.dc.html` is a canvas board of labeled screen frames (1440px app/marketing frames; smaller for auth/panels). Sidebar + nav links cross-link files so the whole set browses like a prototype.

## Design language (committed — reference for every file)

- **Fonts:** IBM Plex Sans (UI), IBM Plex Mono (numbers, routes, badges, labels, code).
  `https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap`
- **Board canvas:** bg `#e9ebef`, padding 48, frames gap 56. Frame: bg `#fff`, border `1px #d8dce3`, radius 12, shadow `0 4px 20px rgba(15,23,42,.07)`, overflow hidden. Frame label above (mono 11px `#5b6478`): `NN · Screen Name · /route`. Each frame wrapper: `id` + `data-screen-label`.
- **App tokens:** bg `#f7f8fa`; surface `#fff`; borders `#e4e8ef` (strong `#d4d9e1`, row `#eef1f5`); ink `#0f172a`; body `#334155`; muted `#64748b`; faint `#94a3b8`; accent `#2563eb` (hover `#1d4ed8`, soft `#eff4ff`, border `#c7d9f8`); green `#15803d`/`#e8f5ec`; amber `#b45309`/`#fdf3e3`; red `#dc2626`/`#fdeaea`; purple `#7c3aed`/`#f3eefe`; cyan `#0e7490`/`#e0f3f8`.
- **Dark surfaces** (marketing hero/footer, terminals, admin-technical blocks): bg `#0b1220`, panel `#0f1729`, border `rgba(255,255,255,.08)`, text `#e2e8f0`, muted `#94a3b8`.
- **Chart palette:** `#2563eb #0ea5e9 #7c3aed #d97706 #059669`; gray bars `#cbd5e1`.
- **Shell:** sidebar 240px bg `#fbfcfe` border-right; logo row h64; group labels mono 10px uppercase `#94a3b8`; item 13px/500 `#47516b` h32 radius 6; active bg `#e8effc` color `#1d4ed8` weight 600. Topbar h64 white border-bottom: workspace switcher, center search (520px pill), bell+badge, help, avatar. Content padding 28 32; breadcrumb mono 11px muted; title 21px/600 ink.
- **Cards** radius 10 border `#e4e8ef` padding 20. **Buttons** h34 radius 8 13px/600: primary accent/white; secondary white border strong; ghost accent text; destructive red text. **Inputs** h36 radius 8 border strong 13px; label 12px/600 `#334155`.
- **Badges:** pill h20 px8, mono 10px/600 uppercase tracking .04em, dot 5px, tinted bg per status (green=healthy/passed, amber=warning, red=blocked/failed, gray=n/a `#f1f5f9`/`#64748b`).
- **Tables:** header row bg `#fafbfc` mono 10.5px uppercase `#64748b` tracking .05em; rows 13px h44 border-bottom row-color, hover `#f8fafc`; numbers mono 12.5px. Filter bar above (search input + chips). Grid via `display:grid` with column template per table.
- **KPI numbers** mono 26px/600 ink; delta chips mono 11px green/red.
- Charts drawn as simple geometric SVG only (polyline sparklines, rect bars, tinted-square heatmaps, dasharray donuts). Imagery = striped placeholder + mono note.
- Logo: 22px rounded square `#0f172a` w/ 3 ascending bars (`#60a5fa #3b82f6 #2563eb`) + wordmark "Analyt**IQ**" (IQ in accent).
- Helmet on every file: `<meta name="design_doc_mode" content="canvas">` + Plex fonts + `body{margin:0}` `*{box-sizing:border-box}` resets only. All styling inline.

**Sidebar href map:** Home→`App Home.dc.html` · Create→`Create Workbench.dc.html` · Artifacts→`Artifacts Library.dc.html` · Data→`Data Sources.dc.html` · Semantic Layer→`Semantic Overview.dc.html` · Gold Tables→`Gold Contracts.dc.html` · Models→`Models.dc.html` · Alerts→`Alerts.dc.html` · Governance→`Governance.dc.html` · Team→`Collaboration.dc.html` · Admin→`Admin.dc.html` · Billing→`Billing.dc.html` · Settings→`Settings.dc.html`. Marketing nav → marketing files; Login→`Auth.dc.html`; Start Free→`Auth.dc.html#register`. Hub: `Index.dc.html`.

## Checklist

### Marketing
- [x] **Marketing Landing.dc.html** — Landing `/` (nav, hero + live-build preview, BI comparison, 4 value cards, 6 use-case tiles, trust strip, CTA band, footer)
- [x] **Marketing Product.dc.html** — Product `/product` (pinned stepper + alternating stage sections, CTA)
- [x] **Marketing Solutions.dc.html** — Solutions template `/solutions/*` (6 persona tabs, hero, template gallery, quote band, feature callouts)
- [x] **Marketing Templates.dc.html** — Templates gallery `/templates` (filter rail + 10 template cards)
- [x] **Marketing Pricing.dc.html** — Pricing `/pricing` (billing toggle, 4 plan cards, comparison table, FAQ)
- [x] **Marketing Security.dc.html** — Security `/security` (sticky jump nav + 8 sections, trust badges)
- [x] **Marketing Docs.dc.html** — Docs `/docs` (nav tree, content, on-this-page TOC)

### Auth & Onboarding
- [x] **Auth.dc.html** — `/login` · `/register` step 1 · `/register` step 4 (roles + first-path) · `/forgot-password` form+sent · `/verify-email` · `/sso/callback` loading+error (8 frames)
- [x] **Onboarding.dc.html** — workspace wizard w/ branding preview · starting-mode cards · source health preview · template picker (4 frames)

### Core app
- [x] **App Home.dc.html** — `/app` widget grid + hero input · `/app/activity` timeline · `/app/notifications` (3 frames)
- [x] **Create Workbench.dc.html** — `/app/create` flagship, interactive 5-state switcher: Start → Clarify → Plan → Building → Canvas (3-col: chat / canvas / inspector)
- [x] **Inspector Panels.dc.html** — Design tab, Data contract, Pipeline audit, Insights, Share, Versions, Comments drawer (panel frames)
- [x] **Artifacts Library.dc.html** — `/app/artifacts` card grid + table view · artifact detail `/app/artifacts/:id` (frames)
- [x] **Artifact Sharing.dc.html** — public viewer `/share/:token` (+expired state) · embed preview · present mode (3 frames)

### Data & integrations
- [x] **Data Sources.dc.html** — sources list · add-source connector grid · connector setup wizard (3 frames)
- [x] **Data Import.dc.html** — file upload flow · REST API connector · webhook connector · dbt import (4 frames)
- [x] **Data Detail.dc.html** — source detail tabs · table detail (2 frames)

### Governance
- [x] **Governance.dc.html** — overview cards · human review queue · definition review diff · quality rules (4 frames)
- [x] **Governance Lineage.dc.html** — lineage graph · manifest versions · pre-aggregation recs (3 frames)

### Semantic layer
- [x] **Semantic Overview.dc.html** — overview cards · explores list · explore detail (3 frames)
- [x] **Semantic Metrics.dc.html** — metrics catalog · metric detail · dimensions catalog (3 frames)
- [x] **Semantic Tools.dc.html** — join path manager · visual field picker · derived tables editor (3 frames)

### Predictive modeling
- [x] **Models.dc.html** — models overview · training run detail · model card (3 frames)
- [x] **Models Ops.dc.html** — leaderboard · feature manifest · retrain center (3 frames)

### Gold layer & contracts
- [x] **Gold Contracts.dc.html** — gold tables · gold detail · query contracts · data contracts (4 frames)

### Alerts
- [x] **Alerts.dc.html** — alerts center · create alert · alert detail (3 frames)

### Collaboration
- [x] **Collaboration.dc.html** — comments inbox · team members · invite members (3 frames)

### Admin & enterprise
- [x] **Admin.dc.html** — admin overview · roles & permissions matrix · SSO settings · workspace branding (4 frames)
- [x] **Admin Security.dc.html** — secrets & credentials · audit log · sharing governance · row-level security (4 frames)
- [x] **Admin Usage.dc.html** — usage & cost analytics dashboard (1 frame)

### Billing (added scope)
- [x] **Billing.dc.html** — plan & seats management · token usage meters + limits · invoices + payment methods (3 frames)

### Settings & misc
- [x] **Settings.dc.html** — profile · preferences · API keys · help center (4 frames)
- [x] **Errors.dc.html** — 404 / 403 / token expired / workspace not found / artifact unavailable / pipeline failed / connector failed / data access denied (1 board)
- [x] **Index.dc.html** — hub linking every screen (build last)
