# AnalytIQ — UI Product Requirements Document

**Version:** 3.0 (Release 3)
**Status:** Draft for review
**Scope:** Visual design, layout, and UI implementation only. Backend, pipeline, and data-engineering behavior are out of scope for this document.

---

## 1. Purpose

AnalytIQ is a conversational analytics workbench: users type a business question, watch a dashboard build in a live canvas, and get a shareable dashboard artifact. This document specifies the **layout and visual composition of every screen** in the product — what's on screen, where it sits, how it's arranged, and how it behaves visually.

### 1.1 Visual product principle

The interface should read as **"Claude Design for dashboards"**: a chat column drives generation, a live canvas shows the artifact taking shape, and a right-hand panel shows supporting detail. Every screen in this document follows a documented layout pattern — no screen should be designed ad hoc.

### 1.2 How to read each screen entry

Every screen below follows the same template:

- **Layout:** the visual structure — grid, columns, panel arrangement, responsive behavior.
- **Elements:** the concrete UI components on that layout.
- **States:** notable visual states (empty, loading, error) where relevant.

---

## 2. Global layout system

### 2.1 App shell (applies to all `/app/*` screens)

**Layout:** Fixed left sidebar (240px) + fixed top bar (64px) + fluid main content area. Optional right-hand contextual drawer (360–420px) slides in over or beside main content depending on viewport width.

**Elements:**
- Left sidebar: workspace logo/mark at top, primary nav icons + labels (Home, Create, Artifacts, Data, Semantic Layer, Models, Alerts, Admin), collapse toggle at bottom.
- Top bar: workspace switcher (dropdown, left-aligned next to sidebar), global search (center, expands on focus), notification bell with badge count, help icon, profile avatar with dropdown (right-aligned).
- Main content: scrolls independently of shell; page title + breadcrumb sits at top of content area.
- Right drawer: appears as an overlay on tablet/mobile widths, as a persistent third column on desktop widths ≥1440px.

**States:** sidebar can collapse to icon-only rail (64px); top bar search expands into a full-width overlay with recent/suggested results on focus.

### 2.2 Typography, color, and component conventions

- Card-based content blocks throughout (rounded corners, subtle border, soft shadow on hover).
- Status uses a consistent color/badge language: green = healthy/passed, amber = warning/needs review, red = blocked/failed, gray = not applicable.
- Tables use sticky headers and support column sort, row hover highlight, and a persistent filter bar above the table.
- Every list view supports a card/table view toggle where noted.

---

## 3. Public marketing site

### 3.1 Landing Page — `/`

**Layout:** Full-width single-column scroll, sections stacked vertically, each section max-width contained (~1200px) and centered.

**Elements (top to bottom):**
- Sticky top nav bar: logo, nav links (Product, Solutions, Templates, Pricing, Security, Docs), Login link, primary "Start Free" button.
- Hero section: two-column split — left: headline + subhead + CTA buttons (Start Free, Book Demo, View Sample Dashboard) stacked vertically; right: animated product preview panel showing a mock chat-to-dashboard sequence.
- "Why not normal BI?" section: side-by-side comparison table/card pair (traditional BI vs. AnalytIQ).
- Value proposition row: 4-column card grid (Governed metrics, Predictive models, Shareable artifacts, No SQL), each card with icon, title, one-line description.
- Use case grid: 5–6 card tiles in a responsive grid (3 columns desktop, 1 column mobile), each with a small illustrative chart thumbnail.
- Trust/security strip: horizontal band with logo-style badges/icons (governance, encryption, audit).
- Footer CTA band: centered headline + two buttons.
- Standard footer: multi-column link groups + social icons.

### 3.2 Product Page — `/product`

**Layout:** Vertical scroll with a horizontal step-tracker visualization pinned near the top, followed by stacked detail sections, one per step.

**Elements:**
- Horizontal stepper graphic across the top showing the stage sequence as connected nodes (visual only — click scrolls to that section).
- Per-stage section: alternating left/right image-text layout (screenshot or diagram on one side, description on the other), repeating down the page.
- Closing CTA band matching landing page style.

### 3.3 Solutions Pages — `/solutions/executives`, `/solutions/data-teams`, `/solutions/operations`, `/solutions/finance`, `/solutions/sales`, `/solutions/customer-success`

**Layout:** Shared template — hero band, then a 3–5 card template gallery grid, then a testimonial/quote band, then footer CTA.

**Elements:**
- Persona-specific hero (headline + illustration).
- Template card grid (3 columns desktop): each card shows a dashboard thumbnail, title, and one-line use case.
- Optional secondary row of feature callouts (icon + short text, 3-column grid).

### 3.4 Templates Gallery — `/templates`

**Layout:** Left filter rail (category checkboxes) + right responsive card grid (3–4 columns).

**Elements:**
- Filter rail: category chips/checkboxes (Revenue, Churn, Operations, Sales, Marketing, Inventory, SLA).
- Search bar above the grid.
- Template cards: thumbnail preview image, title, short description, "Use this template" button on hover.
- Card grid entries: Revenue Forecast, Location Performance, Customer Churn Risk, Operational Risk Monitor, Sales Pipeline Health, Margin Variance, Marketing Spend Efficiency, Inventory Demand Forecast, SLA Breach Predictor, Anomaly Monitor.

### 3.5 Pricing Page — `/pricing`

**Layout:** 4-column pricing table (responsive to stacked cards on mobile), sticky comparison header row.

**Elements:**
- Billing toggle (monthly/annual) above the table.
- Four plan cards: Starter, Team, Business, Enterprise — each with price, feature checklist (checkmark/dash icons), and a CTA button.
- Expandable full feature-comparison table below the cards.
- FAQ accordion at the bottom.

### 3.6 Security & Governance Page — `/security`

**Layout:** Two-column layout — left: sticky in-page nav (jump links); right: stacked content sections.

**Elements:**
- Section list with icon + heading + short paragraph for each: no raw data to LLM, read-only warehouse access, deterministic validation gates, PII detection, audit logs, row-level security, signed embed tokens, workspace-scoped artifacts.
- Trust badge row near the top (compliance/certification icons).

### 3.7 Docs / Learn — `/docs`

**Layout:** Classic docs layout — left nav tree (collapsible sections), center content column, right-hand "on this page" mini table of contents.

**Elements:**
- Search bar pinned above the left nav.
- Content pages: Quickstart, Connect Snowflake, Upload CSV/XLSX, Build first dashboard, Share dashboard, Understand health scores, Semantic layer concepts, Predictive model basics, Admin/security guide.

---

## 4. Authentication & account creation

### 4.1 Login — `/login`

**Layout:** Centered single-column card (max-width ~420px) on a full-bleed background.

**Elements:** Email/password fields, primary "Log in" button, divider, SSO buttons (Google, Microsoft, Enterprise SSO), "Use magic link" toggle, footer links (Forgot password, Create account, Privacy/security).

### 4.2 Register — `/register`

**Layout:** Centered card with a horizontal step progress indicator at the top (4 steps).

**Elements:**
- Step 1: name/email/password fields.
- Step 2: company/workspace name field.
- Step 3: role selection as a 4-option button group (Business User, Analyst, Data Admin, Executive).
- Step 4: optional invite-teammates input (email chips) + "Choose first path" card selector (Sample dataset / Connect warehouse / Upload file).
- Back/Continue buttons pinned to the bottom of the card.

### 4.3 Forgot Password — `/forgot-password`

**Layout:** Centered single-field card matching login card width.

**Elements:** Email input, submit button, confirmation state (checkmark icon + "check your email" message replacing the form).

### 4.4 Email Verification — `/verify-email`

**Layout:** Centered card, icon-led.

**Elements:** Large icon (envelope/checkmark), status message, "Resend email" text button.

### 4.5 SSO Callback — `/sso/callback`

**Layout:** Centered card, minimal — mostly a transient loading state that resolves to either redirect or an error card.

**Elements:** Spinner + "Signing you in…" text (transient); error state swaps to icon + message + "Contact your admin" button for: organization not enabled, no workspace access, session expired.

---

## 5. First-run onboarding

### 5.1 Workspace Setup Wizard — `/onboarding/workspace`

**Layout:** Centered card with a horizontal progress bar (not stepper dots) at the top; single field group visible per step.

**Elements:** Workspace name input, company size dropdown, primary use case selector (card choices), timezone/currency dropdowns, branding step (logo upload dropzone, color swatch picker, font dropdown) with a live preview chip showing the branding applied to a mock header.

### 5.2 Choose Starting Mode — `/onboarding/start`

**Layout:** Centered grid of large selectable cards (2x2 or 5 across on wide screens).

**Elements:** Cards for Use Sample Data, Upload a File, Connect Warehouse, Import dbt Project, Connect REST API/Webhook — each with icon, title, one-line description; selecting a card advances the flow.

### 5.3 First Dataset Health Preview — `/onboarding/source-health`

**Layout:** Full-width content with a summary banner at top and a table below.

**Elements:** "Safe to analyze" badge banner (green/amber), summary stat row (tables found, health score, PII warnings, freshness status), table of detected tables with per-row status badges, "Continue" button fixed at bottom.

### 5.4 First Dashboard Template Picker — `/onboarding/templates`

**Layout:** Centered card grid, similar visual pattern to the Templates Gallery but limited to 3–4 recommended cards.

**Elements:** Recommendation cards with a short rationale line under each title (e.g., "You have transaction dates + revenue — try Revenue Trend"), "Skip and start from scratch" link below the grid.

---

## 6. Home & workspace

### 6.1 Workspace Home — `/app`

**Layout:** App shell + main content as a responsive masonry/grid of widget cards (2–3 columns desktop, 1 column mobile). Hero input bar spans full width at the top of content.

**Elements:**
- Full-width "Create new dashboard" hero input bar with a large text field and send button, sitting just below the page header.
- Widget cards below, in a grid: Recent artifacts (thumbnail row), Active pipeline runs (progress list), Data health summary (score gauge), Alerts firing (list with severity badges), Suggested analyses (card row), Recently viewed dashboards (thumbnail row), Governance tasks awaiting review (count + list), Usage/cost summary (admins only — chart card).

### 6.2 Recent Activity — `/app/activity`

**Layout:** Single-column vertical timeline, full content width, with a filter bar pinned above it.

**Elements:** Filter/date-range controls at top; timeline entries as rows with icon (by event type), description, timestamp, and actor avatar; infinite scroll or paginated "Load more."

### 6.3 Notifications Center — `/app/notifications`

**Layout:** Single-column list, grouped by date (Today, Yesterday, Earlier), inside the right-drawer pattern or full page depending on entry point.

**Elements:** Tabs or filter chips at top (All, Unread, Mentions); notification rows with icon, message, timestamp, and unread indicator dot; "Mark all read" action top-right.

---

## 7. Create Workbench (flagship screen)

### 7.1 Overall layout — `/app/create`, `/app/create/new`, `/app/create/:sessionId`

**Layout:** Three-column workbench layout.
- **Left column (~320–380px, fixed):** chat panel.
- **Center column (fluid, min ~600px):** live dashboard canvas.
- **Right column (~360px, collapsible):** tabbed inspector panel.

On tablet widths, the right column collapses into a toggleable drawer over the canvas. On mobile widths, the layout becomes a single column with a bottom tab bar to switch between Chat, Canvas, and Inspector.

### 7.2 Left column — Chat panel

**Layout:** Vertically stacked scrollable message thread with a fixed input bar pinned to the bottom.

**Elements:**
- Message thread: user messages right-aligned in filled bubbles, assistant messages left-aligned with an avatar/icon, agent step messages shown as compact gray system-style rows (not full bubbles).
- Inline UI within the thread: suggested prompt chips (horizontal scroll row) shown before first message, multiple-choice answer chips for clarifying questions, a plan-confirmation card (see 7.5) rendered inline in the thread.
- Uploaded context shown as small file chips above the input bar.
- Template selector accessible via a "+" icon next to the input.
- Fixed bottom input bar: expandable textarea, attach icon, send button.

### 7.3 Prompt start state — `/app/create/new`

**Layout:** Center column shows an empty-state layout instead of a canvas: centered content, vertically and horizontally, max-width ~700px.

**Elements:** Large heading ("Ask a question or choose a template"), example prompt cards (3–4, clickable, grid), template card row below, data source selector dropdown, "Use sample data" button, recent prompts list, field-picker shortcut link.

### 7.4 Guided clarification (inline chat component)

**Layout:** Rendered as a chat message with a chip group beneath the assistant's question text.

**Elements:** Question text, 3–5 pill-shaped selectable chips arranged in a wrap row, a subtler "Not sure" chip and "Use recommended" chip visually distinct (outlined vs. filled), small confidence indicator (dot or thin bar) near the question, non-intrusive.

### 7.5 Plan confirmation checkpoint (inline chat card)

**Layout:** Bordered card embedded in the chat thread, full width of the chat column, with labeled rows.

**Elements:** Card header ("Review your plan"), labeled key-value rows (Goal, Metrics, Dimensions, Time range, Filters, Output type, Predicted horizon, Data sources, Access limitations), each row with a small edit-pencil icon, three buttons at the bottom of the card: Approve & Build (primary), Edit Plan (secondary), Cancel (text link).

### 7.6 Live pipeline progress (center column state)

**Layout:** Replaces the canvas area temporarily; vertical stage list at top, live-updating event log below.

**Elements:** Horizontal or vertical row of stage chips (Understanding request, Validating metrics, Planning dashboard, Building data, Running queries, Generating charts, Training model, Reviewing output, Assembling dashboard) — each chip shows a state icon (pending/spinner/check/error); scrolling event log list beneath with friendly one-line messages; inline warning callouts (amber banner with icon) where relevant; a "Show technical detail" collapsible toggle at the bottom.

### 7.7 Dashboard canvas (center column, populated state)

**Layout:** Scrollable canvas area with a fixed toolbar pinned to the top of the column.

**Elements:**
- Toolbar: zoom controls, fit-width toggle, present-mode button, device preview switch (desktop/tablet/mobile icons), refresh icon, save-version icon, export icon, share icon, add-comment icon, view-lineage icon, view-pipeline icon — arranged left-to-right, grouped with dividers.
- Canvas body: KPI row (horizontal card strip at top), followed by a responsive grid of chart sections (line, bar, horizontal bar, area, scatter, heatmap, histogram, table, narrative text block, forecast panel, actual-vs-predicted, model leaderboard, feature importance) — each section is a bordered card, draggable via a handle icon on hover, with a selection outline appearing on click.
- Section titles and labels are directly editable in place (click-to-edit, shown via a text-cursor affordance on hover).
- Empty state (no sections yet): centered placeholder text with a subtle illustration.

### 7.8 Inline comment mode

**Layout:** Activated by clicking a chart section; a small floating comment composer anchors to the selected section (popover, not full drawer).

**Elements:** Popover with a text input, submit button, and a list of existing comments on that section stacked above the input, each with author avatar, timestamp, and resolve checkbox.

### 7.9 Direct canvas edit mode

**Layout:** Triggered by selecting a section; a lightweight floating toolbar appears above the selected section.

**Elements:** Icon toolbar for quick actions (rename, change chart type via dropdown, adjust Top-N via stepper, toggle comparison switch, change time grain dropdown, reorder via drag handles, edit narrative text inline); global filter bar pinned above the canvas grid showing active filter chips with an "Add filter" button.

### 7.10 Right column — Inspector panel

**Layout:** Fixed-width column with a horizontal tab bar at the top and scrollable tab content below.

**Elements:** Tab bar: Design, Data, Filters, Pipeline, Lineage, Model, Comments, Share. Each tab renders a scrollable content pane (details below).

#### 7.10.1 Component Inspector (Design tab, section selected)

**Layout:** Stacked form-style fields within the tab pane.

**Elements:** Chart title field, metric dropdown, dimension dropdown, chart type selector (icon grid), filter list, time grain dropdown, comparison toggle, status badges (data contract, validation), expandable "Why this chart?" text block, "Replace with…" suggestion cards.

#### 7.10.2 Trust / Data Contract panel (Data tab)

**Layout:** List of collapsible per-component cards.

**Elements:** Each card shows component name, status badge, and expandable detail rows (row count, null counts, numeric ranges, freshness, warnings, gates passed) — presented as a simple label/value list, not raw JSON.

#### 7.10.3 Pipeline Audit panel (Pipeline tab)

**Layout:** Vertical stepper of stage cards, collapsible.

**Elements:** Stage cards each with a status icon, stage name, and an expand chevron revealing input/output summary, gate result badge, and repair-attempt count; a "View technical detail" toggle per card reveals raw detail (visually de-emphasized, monospace block, admin-only); "Fork from here" button on each card.

#### 7.10.4 Insight panel (surfaced within canvas or a dedicated tab)

**Layout:** Card list, one card per insight.

**Elements:** Each card: insight type icon (anomaly/trend/outlier/correlation), short description, confidence badge, "Investigate" button.

#### 7.10.5 Share panel (Share tab / Share modal)

**Layout:** Modal dialog (or Share tab content), sectioned top-to-bottom: visibility, distribution, advanced settings.

**Elements:**
- Visibility radio group: Private, Workspace can view, Workspace can edit, Public signed link.
- Distribution row of icon buttons: Embed, Export HTML, Export PDF, Export PNG, Send to Slack, Send to email, Copy link.
- Advanced settings (collapsible section): expiration date picker, password field toggle, scope dropdown (read-only/interactive/admin), permission checkboxes (allow comments, allow drill-through, allow data export), "Revoke link" button (destructive style, red text).

#### 7.10.6 Version History

**Layout:** Vertical timeline list within a panel or modal.

**Elements:** Each version row: timestamp, creator avatar, short prompt summary, tag chips (semantic version, governance version, feature version, model card ID), "Restore" and "Compare" buttons appearing on row hover.

---

## 8. Artifact library & viewing

### 8.1 Artifacts Library — `/app/artifacts`

**Layout:** Left filter rail (collapsible) + main content with a view-toggle (card grid / table) and a filter/search bar above it.

**Elements:** Filter rail checkboxes (Created by me, Shared with me, Predictive, Has warnings, Public links, Needs review); card view: thumbnail, title, owner avatar, type badge, health badge; table view: sortable columns for Title, Owner, Type, Data health, Last refreshed, Last viewed, Share status, Tags, Folder, and a row action menu (kebab icon).

### 8.2 Artifact Detail — `/app/artifacts/:id`

**Layout:** Full-width header band (title, owner, actions) followed by a horizontal tab bar, then tab content that reuses the canvas layout from the Create Workbench for the Dashboard tab.

**Elements:** Header: title (editable), owner avatar, status badges, action buttons (Share, Export, Duplicate). Tabs: Dashboard, Insights, Pipeline, Lineage, Model, Versions, Sharing, Activity — each reusing the corresponding panel layout described in Section 7.10 where applicable.

### 8.3 Public Artifact Viewer — `/share/:token`

**Layout:** No app shell — full-bleed page with a slim branded header bar and the dashboard canvas centered below, max-width contained.

**Elements:** Header bar: workspace logo/branding, freshness badge, optional "Request access" button (top-right). Canvas: read-only rendering of chart sections, filter controls visible only if permitted (a filter bar mirrors the canvas toolbar but stripped of edit icons). Footer: minimal "Powered by AnalytIQ" mark. Expired-token state: centered icon + message replacing the canvas entirely.

### 8.4 Embed Preview — `/app/artifacts/:id/embed`

**Layout:** Split layout — left: live iframe preview panel; right: settings form.

**Elements:** Left: bordered iframe frame at a fixed aspect ratio showing the embedded dashboard. Right: embed code text block (copy button), token scope checkboxes, expiration date picker, allowed-domains input (chip list), interaction permission toggles.

### 8.5 Present Mode — `/app/artifacts/:id/present`

**Layout:** Full-screen, chrome-free — canvas fills the viewport edge-to-edge.

**Elements:** Minimal floating control bar (auto-hides, appears on mouse move) with exit, next/previous section navigation arrows, and a presenter-notes toggle that opens a bottom drawer showing narrative insight text.

---

## 9. Data & integrations

### 9.1 Data Sources List — `/app/data/sources`

**Layout:** Table view, full width, with an "Add source" button top-right and a filter/search bar above the table.

**Elements:** Table columns: connection icon + name, Type, Status badge, Health score (mini gauge), Last sync, Freshness SLA, Owner, Table count, Issues badge; row click opens Source Detail.

### 9.2 Add Data Source — `/app/data/connect`

**Layout:** Card grid, similar visual pattern to the Templates Gallery.

**Elements:** Connector logo cards (Snowflake, BigQuery, Databricks SQL, Redshift, Postgres, MySQL, DuckDB, CSV/XLSX/Parquet, REST API, Webhook, dbt, Google Sheets), search/filter bar above the grid.

### 9.3 Connector Setup Wizard — `/app/data/connect/:type`

**Layout:** Centered card with a vertical step list on the left (visited/current/upcoming states) and the active step's form on the right.

**Elements:** Form fields per step (account URL, warehouse, database, schema, role, credentials), a "Test connection" button with inline success/failure state, schema/table checklist selector (searchable tree), freshness SLA input, "Run health check" button, Back/Continue footer buttons.

### 9.4 File Upload Flow — `/app/data/upload`

**Layout:** Centered wizard card with a horizontal progress bar; drag-and-drop dropzone as the first step.

**Elements:** Dropzone with upload icon and drag target styling; schema preview table (auto-detected column types, editable dropdowns per column); table-name input; profiling results screen (stat cards for row count, health, PII flags); "Add to workspace" confirmation button.

### 9.5 REST API Connector — `/app/data/api`

**Layout:** Two-column form — left: connection fields; right: live response preview panel.

**Elements:** Left: endpoint URL, auth type dropdown, headers key-value list, method selector, pagination settings, polling schedule input, response format selector, JSON path mapping fields. Right: "Test response" button and a formatted JSON preview pane; ingest preview table below.

### 9.6 Webhook Connector — `/app/data/webhook`

**Layout:** Single column, top section for configuration, bottom section for a live events table.

**Elements:** Generated endpoint URL (copy field), secret (masked field with reveal toggle), payload schema preview, "Send test event" button, events table below (timestamp, status, payload preview, failure reason column).

### 9.7 dbt Import — `/app/data/dbt`

**Layout:** Two-step wizard — left step list, right content pane; final step shows a mapping table.

**Elements:** Repo connect form, project/model checklist selector, mapping table (dbt model/description → semantic candidate) with editable rows, inherited-tests indicator badges.

### 9.8 Source Detail — `/app/data/sources/:id`

**Layout:** Header band (source name, status, actions) + horizontal tab bar + tab content.

**Elements:** Tabs: Overview, Tables, Health, Schema Drift, PII, Freshness, Lineage, Sync Logs, Settings — each rendering a relevant table or stat-card layout consistent with other detail screens.

### 9.9 Table Detail — `/app/data/tables/:id`

**Layout:** Header band + two-column body (left: main detail list; right: a compact side panel for downstream usage).

**Elements:** Left: business definition text block, health trend sparkline, columns table (name, null rate, semantic type, confidence, PII risk). Right: freshness stat card, downstream artifacts list, gate-failure badges.

---

## 10. Governance & data quality

### 10.1 Governance Overview — `/app/governance`

**Layout:** Grid of summary cards (2–4 columns) at top, each linking to its respective sub-screen.

**Elements:** Cards: Tables blocked, Review items, PII flags, Freshness SLA breaches, Schema drift, Data contract failures, Health score trend (sparkline card).

### 10.2 Human Review Queue — `/app/governance/review`

**Layout:** Table/list view with filter tabs at top (by review type) and bulk-action toolbar.

**Elements:** Filter tabs (Definitions, Metric conflicts, PII, Leakage risk, Bridge tables, Schema drift); table rows with item summary, confidence badge, assignee avatar, and inline Accept/Edit/Reject action icons; row click opens Definition Review Detail.

### 10.3 Definition Review Detail — `/app/governance/review/:id`

**Layout:** Split-screen diff view — left: current definition; right: AI-proposed definition, with visual diff highlighting.

**Elements:** Confidence badge at top, evidence summary panel below the diff, affected metrics/dashboards list (chips), editable text box for the final definition, approval action buttons (Approve, Reject, Request changes) fixed at the bottom.

### 10.4 Data Quality Rules — `/app/governance/rules`

**Layout:** Table of configured rules with an "Add rule" button top-right; rule editor opens as a side panel or modal.

**Elements:** Rule table (name, type, threshold, status toggle); rule editor form: rule type dropdown (primary key, null threshold, freshness SLA, row count, distribution drift, PII, custom test), threshold input, simple expression text field for custom tests, save/cancel buttons.

### 10.5 Lineage Graph — `/app/governance/lineage`

**Layout:** Full-canvas interactive node-link diagram filling the content area, with a floating control panel (zoom, layout, export) in a corner and a details side panel that opens on node click.

**Elements:** Node types visually distinguished by shape/color (sources, tables, semantic metrics, gold tables, models, artifacts, share links, alerts); edges showing directional flow; click-to-highlight downstream/upstream path; details side panel showing selected node's metadata; export-graph button in the control panel.

### 10.6 Manifest Versions — `/app/governance/manifests`

**Layout:** Table view with an expandable row for diffs.

**Elements:** Table columns: version, generated date, status badge, review-required flag, schema changes count; expand row reveals a compare/diff view; "Rollback" button per row.

### 10.7 Pre-Aggregation Recommendations — `/app/governance/preaggregations`

**Layout:** Card list, one card per recommendation.

**Elements:** Each card: recommended table name, query pattern summary, estimated performance gain (bar/stat), estimated cost, status badge, Approve/Materialize button, auto-materialization toggle, cost ceiling input.

---

## 11. Semantic layer

### 11.1 Semantic Layer Overview — `/app/semantic`

**Layout:** Summary card grid at top (matching Governance Overview pattern) linking into sub-screens.

**Elements:** Cards: Explores, Metrics, Dimensions, Join paths, Conflicts, Version, Access policies.

### 11.2 Explores List — `/app/semantic/explores`

**Layout:** Table view.

**Elements:** Columns: business name, metrics count, dimensions count, role access (avatar stack), health badge, confidence, dashboards using it.

### 11.3 Explore Detail — `/app/semantic/explores/:id`

**Layout:** Header band + tab bar + tab content.

**Elements:** Tabs: Metrics, Dimensions, Joins, Access, Artifacts using this explore, Version history — each a table/list consistent with other detail screens.

### 11.4 Metrics Catalog — `/app/semantic/metrics`

**Layout:** Table view with a "Create calculated metric" button top-right.

**Elements:** Columns: metric name, definition (truncated with tooltip), aggregation, format, source, confidence badge, owner avatar, used-by count, version; row actions for resolve-duplicate and deprecate.

### 11.5 Metric Detail — `/app/semantic/metrics/:id`

**Layout:** Header band + two-column body (left: definition detail; right: usage/lineage side panel).

**Elements:** Left: plain-English definition block, SQL expression block (visually de-emphasized, admin-only visibility), aggregation, allowed filters, format. Right: lineage mini-diagram, dashboards-using-this-metric list, version history list, tests list.

### 11.6 Dimensions Catalog — `/app/semantic/dimensions`

**Layout:** Grouped accordion or sectioned list by category.

**Elements:** Section headers (Date, Geography, Category, Boolean, ID, Text), each expanding to a table of dimensions with name, source, and confidence.

### 11.7 Join Path Manager — `/app/semantic/joins`

**Layout:** List/table of join paths with inline warning indicators.

**Elements:** Rows showing source table → target table with a join-type icon; warning badges for blocked many-to-many joins and fan-out risk; "Recommend bridge table" action button on flagged rows; estimated inflation factor shown as a small stat.

### 11.8 Visual Field Picker — `/app/semantic/field-picker`

**Layout:** Three-column layout — left: dimensions tree grouped by hierarchy; center: selected-fields tray + 100-row preview table; right: measures grouped by explore.

**Elements:** Left/right columns: searchable, checkbox-style field lists with hover tooltips showing definitions and 7-day sparklines. Center: selected field chips at top, preview table below (capped at 100 rows), warning banner area for fan-out/high-cardinality/access issues. "Analyze This" primary button fixed at the bottom of the center column.

### 11.9 Derived Tables — `/app/semantic/derived-tables`

**Layout:** Table list + a full-screen editor view for creating/editing a derived table.

**Elements:** List: table name, schedule, status, governance badge. Editor: SQL editor pane (admin-only, syntax highlighted) on the left, metadata form (schedule, governance tags) on the right, lineage preview and "Test run" button below, "Publish" button top-right.

---

## 12. Predictive modeling

### 12.1 Models Overview — `/app/models`

**Layout:** Summary card grid at top + table/list of models below.

**Elements:** Cards: Promoted models, Training runs, Failed models, Retrain recommended, Champion/challenger tests, Prediction tables. Table below: model name, status badge, last trained, accuracy stat, actions.

### 12.2 Training Run Detail — `/app/models/runs/:id`

**Layout:** Header band + tab bar + tab content.

**Elements:** Tabs: Summary, Backtest windows, Candidate models, Feature manifest, Leakage checks, Promotion decision, Logs — each a stat-card or table layout; Logs tab uses a monospace scrollable console-style block.

### 12.3 Model Card — `/app/models/:id`

**Layout:** Two-column layout — left: model metadata and metrics; right: visual explainability charts.

**Elements:** Left: purpose, target metric, algorithm, training data summary, backtest stat cards (MAPE/MAE/RMSE), overfit status badge, promotion status badge, "Retrain" button. Right: feature importance bar chart, SHAP summary chart, linked-artifacts list.

### 12.4 Model Leaderboard — `/app/models/runs/:id/leaderboard`

**Layout:** Ranked table with an expandable comparison drawer.

**Elements:** Table rows for each candidate model (XGBoost, LightGBM, Ridge, Prophet) with rank, key metric, and a "select" radio; "Promote champion" button; "Override champion" secondary action; trade-off summary panel/drawer with a small comparison chart; window-comparison toggle above the table.

### 12.5 Feature Manifest Viewer — `/app/models/features/:id`

**Layout:** Table view.

**Elements:** Columns: feature name, derivation (tooltip), encoding, imputation, leakage risk badge, importance estimate (mini bar), dropped flag, approval status badge.

### 12.6 Retrain Center — `/app/models/retrain`

**Layout:** Tabbed or filter-chip queue view.

**Elements:** Filter chips (Scheduled, Drift-triggered, Manual, Failed); queue table with model name, trigger reason, status, "Retrain now" button per row.

---

## 13. Gold layer & contracts

### 13.1 Gold Tables — `/app/gold`

**Layout:** Table view.

**Elements:** Columns: gold table name, session, grain, version, creator, row count, status badge, linked model/artifact, warehouse location.

### 13.2 Gold Table Detail — `/app/gold/:id`

**Layout:** Header band + tab bar + tab content.

**Elements:** Tabs: Overview, Schema, Quality gates, Lineage, Artifacts, Feature manifest, Query contracts — each a table or stat-card layout matching prior detail screens.

### 13.3 Query Contracts — `/app/contracts/queries`

**Layout:** Table view, admin-only.

**Elements:** Columns: component, expected shape, SQL safety status badge, execution status badge, row limit, time-filter present (check icon), result shape validation badge.

### 13.4 Data Contracts — `/app/contracts/data`

**Layout:** Table view, admin-only.

**Elements:** Columns: required fields (chip list), SLA, contract failures count, blocking status badge, affected artifacts (expandable list).

---

## 14. Alerts & subscriptions

### 14.1 Alerts Center — `/app/alerts`

**Layout:** Table/list view with a filter bar and "Create alert" button top-right.

**Elements:** Filter chips by alert type (Metric threshold, Anomaly, Freshness, Schema drift, Model drift, Data quality, Artifact health); table rows with alert name, type icon, status, last triggered, mute toggle.

### 14.2 Create Alert — `/app/alerts/new`

**Layout:** Vertical form wizard in a centered card.

**Elements:** Metric/artifact selector (searchable dropdown), condition builder (operator + value fields), frequency dropdown, delivery channel checkboxes (email, Slack), mute-rules section, owner selector, Save/Cancel footer buttons.

### 14.3 Alert Detail — `/app/alerts/:id`

**Layout:** Header band + two-column body (left: trigger history list; right: settings panel).

**Elements:** Left: history timeline of triggers with timestamps and delivery status icons. Right: trigger logic summary, subscribers list, linked artifacts, mute/edit/delete action buttons.

---

## 15. Collaboration

### 15.1 Comments Inbox — `/app/comments`

**Layout:** Single-column list with filter tabs at top.

**Elements:** Tabs (Assigned to me, Open, Resolved, Mentioned me); comment rows with author avatar, comment text preview, artifact link chip, resolve checkbox.

### 15.2 Artifact Comments Drawer (embedded component)

**Layout:** Right-side drawer overlay, same width as the Inspector panel.

**Elements:** Threaded comment list (indented replies), inline chart-specific comment groups, resolve toggle per thread, "Convert to generation request" and "Ask AI to apply" buttons on each comment.

### 15.3 Team Members — `/app/team`

**Layout:** Table view with "Invite" button top-right.

**Elements:** Columns: name/avatar, role, workspace access badge, last active, invite status badge.

### 15.4 Invite Members — `/app/team/invite`

**Layout:** Centered form card.

**Elements:** Email chip input (multi-entry), role dropdown, explore-access multi-select, artifact-access multi-select, admin-privilege toggle, Send Invites button.

---

## 16. Admin & enterprise control plane

### 16.1 Admin Overview — `/app/admin`

**Layout:** Summary card grid (2–4 columns).

**Elements:** Cards: Users, Roles, Integrations, Governance backlog, Audit events, Token usage/cost, Security warnings — each linking to its detail screen.

### 16.2 Roles & Permissions — `/app/admin/roles`

**Layout:** Matrix table — roles as columns, permissions as rows, checkboxes at intersections.

**Elements:** Role columns (Workspace Owner, Admin, Data Steward, Analyst, Viewer, External Viewer, Developer); permission rows (create dashboards, approve governance definitions, manage semantic layer, view SQL, manage integrations, create share links, public sharing, manage models, export audit logs); checkbox/toggle at each cell.

### 16.3 SSO Settings — `/app/admin/sso`

**Layout:** Form sections stacked vertically in a settings-page layout.

**Elements:** SAML 2.0 configuration fields, OIDC configuration fields, domain verification input with status badge, default-role dropdown, "Test login" button.

### 16.4 Workspace Branding — `/app/admin/branding`

**Layout:** Two-column — left: form controls; right: live preview panel.

**Elements:** Left: logo upload, color swatch pickers, font dropdown, theme selector for artifact/public-share/email. Right: live-updating preview mockups (dashboard header, share page, email template) reflecting current settings.

### 16.5 Secrets & Credentials — `/app/admin/secrets`

**Layout:** Table view, admin-only.

**Elements:** Columns: connector name, credential status (masked), rotation date, last used, failure badge, permissions summary; "Rotate" action per row.

### 16.6 Usage & Cost Analytics — `/app/admin/usage`

**Layout:** Dashboard-style layout reusing the artifact canvas pattern (this screen is itself rendered as a native dashboard).

**Elements:** KPI row (pipeline runs, LLM calls, tokens, warehouse query time), chart sections for artifact views over time, model training cost trend, top users table, cost-by-workspace breakdown chart.

### 16.7 Audit Log — `/app/admin/audit`

**Layout:** Table view with a filter bar and export button.

**Elements:** Filter fields (event type, actor, date range, artifact, data source, severity); table columns matching filters; "Export CSV/JSON" button top-right.

### 16.8 Sharing Governance — `/app/admin/sharing`

**Layout:** Stacked settings sections in a form layout.

**Elements:** Toggles/fields for public links allowed, link expiration maximum, embed allowed domains (chip input), external viewers toggle, cross-workspace sharing toggle, token scopes checklist.

### 16.9 Row-Level Security — `/app/admin/rls`

**Layout:** Two-panel layout — left: policy list; right: "test as user" simulator panel.

**Elements:** Left: policy table (explore, rule, status). Right: user selector dropdown, simulated artifact preview showing filtered data as that user would see it.

---

## 17. Settings & support

### 17.1 User Settings — `/app/settings/profile`

**Layout:** Centered single-column form.

**Elements:** Avatar upload, name field, email field, change-password section, notification preference toggles, default workspace dropdown.

### 17.2 Personal Preferences — `/app/settings/preferences`

**Layout:** Centered single-column form.

**Elements:** Default date range dropdown, default dashboard theme selector, chart density toggle (compact/comfortable), technical-detail visibility toggle, prompt style dropdown.

### 17.3 API Keys — `/app/settings/api-keys`

**Layout:** Table view with "Create key" button top-right.

**Elements:** Columns: key name, scopes (chips), expiry, last used, "Revoke" action; key-creation modal with name field, scope checkboxes, expiry picker.

### 17.4 Help Center — `/app/help`

**Layout:** Two-column — left: category nav; right: article list/search results.

**Elements:** Search bar at top spanning both columns, category list on the left, article cards on the right, "Contact support" button in a persistent corner widget.

### 17.5 Error Pages

**Layout:** Centered single-column, icon-led, consistent across all error types.

**Elements:** Large icon representing the error type, heading, short explanatory message, primary action button (e.g., "Go home," "Contact admin," "Retry") — used for 404, 403, token expired, workspace not found, artifact unavailable, pipeline failed, connector failed, data access denied.

---

## 18. Cross-cutting visual/UI conventions

- **Consistent detail-screen pattern:** every entity detail screen (Source, Table, Explore, Metric, Gold Table, Model, Artifact) uses the same header-band + tab-bar + tab-content structure so users don't relearn navigation between sections.
- **Consistent list-screen pattern:** every list screen offers a filter bar/rail, a sortable table or card-grid toggle, and consistent status badge colors.
- **Modal vs. drawer usage:** transient, single-purpose actions (create alert, invite member, share) use centered modals; contextual, reference-while-working panels (comments, inspector, lineage details) use side drawers so the underlying canvas stays visible.
- **Admin-only visual treatment:** any field or panel visible only to Admin/Developer roles (SQL expressions, raw JSON, secrets) is styled distinctly — monospace font, muted background — so it visually reads as "technical/advanced" even to users who can see it.
- **Responsive behavior:** the three-column Create Workbench and Inspector-drawer pattern collapse to a single-column, tab-switched layout below ~1024px; all data tables become horizontally scrollable with sticky first columns below ~768px.
