# Design-Parity Scoreboard

Generated from `tests/ui/parity/parity.spec.js` (inventory extracted from
`docs/specs/mockups` — 95 frames). This is the live gap tracker for the
R30–R36 program: a frame flips ✅ when its story lands.

**8 full parity · 75 partial · 4 route missing · 8 context frames** (of 95)

| Frame | State | First gaps |
|---|---|---|
| Admin Security › #audit | 🟡 3 gaps | missing component: "INFO"; missing component: "NOTICE"; missing component: "WARN" |
| Admin Security › #secrets | 🟡 3 gaps | missing component: "HEALTHY"; missing component: "Rotate"; missing component: "STALE" |
| Admin Security › #sharing-gov | ✅ full parity | — |
| Admin Security › #rls | 🟡 6 gaps | missing component: "+ Policy"; missing component: "Revenue"; missing component: "Margin"; missing component: "Customer"; missing component: "Inventory"; missing |
| Admin Usage › #usage-analytics | 🟡 1 gaps | missing component: "Top users by consumption" |
| Alerts › #alerts-center | 🟡 4 gaps | missing component: "Daily revenue vs forecast guard"; missing component: "● FIRING"; missing component: "Returns spike anomaly watch"; missing component: "● OK" |
| Alerts › #create-alert | 🟡 9 gaps | missing component: "Create alert"; missing component: "Watch"; missing component: "Condition"; missing component: "Check frequency"; missing component: "Owner"; … +3 |
| Alerts › #alert-detail | 🟡 4 gaps | missing component: "Daily revenue vs forecast guard"; missing component: "● FIRING"; missing component: "Edit"; missing component: "OK" |
| Admin › #admin-overview | 🟡 1 gaps | missing component: "ENFORCED" |
| Admin › #roles | 🟡 1 gaps | missing component: "+ Custom role" |
| Admin › #sso | 🟡 4 gaps | missing component: "● ENFORCED"; missing component: "✓ VERIFIED"; missing component: "Default role for new users"; missing component: "Session lifetime" |
| Admin › #branding | 🟡 5 gaps | missing component: "Logo"; missing component: "Font"; missing component: "Theme scope"; missing component: "Dashboard header"; missing component: "View dashboar |
| App Home › #home | 🟡 gaps | missing component: "● HEALTHY"; missing component: "HIGH"; missing component: "MED"; link source missing: "Margin variance by SKU training model st" → /app/crea |
| App Home › #activity | 🟡 gaps | missing component: "SYS"; missing component: "Load more"; link source missing: "Daily revenue vs forecast" → /app/alerts/:id; link source missing: "Ops Risk Mon |
| App Home › #notifications | ❌ route missing | route /app/notifications should not 404; missing component: "Mark all read"; missing component: "All"; missing component: "TODAY"; missing component: "High aler … +2 |
| Auth › #login | 🟡 gaps | flow broken: "Log in" should reach /app |
| Auth › #register | ✅ full parity | — |
| Auth › #register-3 | 🟡 6 gaps | missing component: "Role"; missing component: "What best describes you?"; missing component: "Business User"; missing component: "Analyst"; missing component: " |
| Auth › #register-4 | 🟡 gaps | missing component: "Kickoff"; missing component: "Invite teammates"; missing component: "Choose your first path"; missing component: "Start with sample data"; m |
| Auth › #forgot | 🟡 2 gaps | missing component: "Check your email"; missing component: "Resend email" |
| Auth › #verify | ✅ full parity | — |
| Auth › #sso | ✅ full parity | — |
| Auth › #sso-error | 🟡 2 gaps | missing component: "No workspace access"; missing component: "Contact your admin" |
| Semantic Overview › #sem-overview | ✅ full parity | — |
| Semantic Overview › #explores | 🟡 3 gaps | missing component: "Revenue"; missing component: "Customer"; missing component: "Inventory" |
| Semantic Overview › #explore-detail | 🟡 gaps | missing component: "Revenue"; missing component: "Analyze this explore"; missing component: "aov"; missing tab: Access; missing tab: Versions; link source missi |
| Semantic Tools › #field-picker | 🟡 gaps | missing component: "Heads up:"; missing component: "Analyze this →"; link source missing: "Analyze this →" → /app/create |
| Semantic Tools › #joins | 🟡 4 gaps | missing component: "SAFE"; missing component: "BLOCKED"; missing component: "Recommend bridge table"; missing component: "FAN-OUT RISK" |
| Semantic Tools › #derived | 🟡 3 gaps | missing component: "Governance tags"; missing component: "Lineage preview"; missing component: "DRAFT" |
| Settings › #profile | 🟡 7 gaps | missing component: "Upload avatar"; missing component: "Full name"; missing component: "Email"; missing component: "Default workspace"; missing component: "Pass … +1 |
| Settings › #preferences | 🟡 5 gaps | missing component: "Default date range"; missing component: "Dashboard theme"; missing component: "Chart density"; missing component: "Prompt style"; missing co |
| Settings › #api-keys | 🟡 3 gaps | missing component: "+ Create key"; missing component: "ci-exports"; missing component: "portal-embed" |
| Settings › #help | 🟡 gaps | route /app/help should not 404; missing component: "How can we help?"; missing component: "Getting started"; missing component: "Understanding health scores"; m |
| Artifact Sharing › #public-viewer | 🟡 gaps | missing component: "AR"; missing component: "Acme Retail Analytics"; missing component: "Request access"; missing component: "Top risk sources"; link source mis |
| Artifact Sharing › #expired | 🟡 5 gaps | missing component: "AR"; missing component: "Acme Retail Analytics"; missing component: "This share link has expired"; missing component: "Ops Risk Monitor"; mi |
| Artifact Sharing › #embed | 🟡 9 gaps | missing component: "Live preview"; missing component: "Embed settings"; missing component: "Embed code"; missing component: "Copy"; missing component: "Token sc … +3 |
| Artifact Sharing › #present | ✅ full parity | — |
| Artifacts Library › #library | 🟡 gaps | missing component: "● HEALTHY"; missing component: "Ops Risk Monitor"; missing component: "Sales Pipeline Health"; missing component: "● NEEDS REVIEW"; link sou |
| Artifacts Library › #library-table | 🟡 2 gaps | missing component: "Ops Risk Monitor"; missing component: "Sales Pipeline Health" |
| Artifacts Library › #artifact-detail | 🟡 gaps | missing component: "PREDICTIVE"; missing component: "Open in workbench"; missing component: "Duplicate"; missing component: "Export"; missing component: "Share" |
| Billing › #plan | 🟡 gaps | missing component: "Plan & seats"; missing component: "Business plan"; missing component: "Add seats"; missing component: "Manage →"; missing component: "Downgr |
| Billing › #usage | 🟡 gaps | route /app/billing/usage should not 404; missing component: "Token usage — current cycle"; missing component: "Export CSV"; missing component: "Cost analytics → |
| Billing › #invoices | 🟡 8 gaps | missing component: "Add payment method"; missing component: "Download all"; missing component: "OPEN"; missing component: "PDF ↓"; missing component: "Billing c … +2 |
| Collaboration › #comments-inbox | 🟡 gaps | missing component: "JR"; missing component: "Jon Reyes"; link source missing: "Ops Risk Monitor ↗" → /share/:token |
| Collaboration › #invite | 🟡 gaps | route /app/team/invite should not 404; missing component: "Invite members"; missing component: "Emails"; missing component: "Role"; missing component: "Explore  |
| Collaboration › #team | 🟡 6 gaps | missing component: "OWNER"; missing component: "ACTIVE"; missing component: "DATA STEWARD"; missing component: "ANALYST"; missing component: "Amara Torres"; mis |
| Create Workbench › #create | 🟡 gaps | missing component: "DK"; missing component: "\"; missing component: "Use recommended"; missing component: "Review your plan"; missing component: "✓ APPROVED"; m |
| Data Detail › #source-detail | 🟡 gaps | missing component: "● CONNECTED"; missing component: "Sync now"; missing component: "Health"; missing component: "Open issues"; missing tab: Overview; missing t |
| Data Detail › #table-detail | 🟡 gaps | route /app/data/tables/:id should not 404; missing component: "Business definition"; missing component: "on time"; missing component: "Downstream"; missing comp |
| Data Import › #upload | 🟡 gaps | route /app/data/upload should not 404; missing component: "Replace"; missing component: "Table name"; missing component: "PII"; missing component: "Add to works |
| Data Import › #webhook | ❌ route missing | route /app/data/webhook should not 404; missing component: "Endpoint URL"; missing component: "Copy"; missing component: "Signing secret"; missing component: "S … +1 |
| Data Import › #rest-api | 🟡 gaps | route /app/data/api should not 404; missing component: "Connection"; missing component: "Endpoint URL"; missing component: "Method"; missing component: "Auth";  |
| Data Import › #dbt | 🟡 gaps | route /app/data/dbt should not 404; missing component: "Import dbt project"; missing component: "Import to semantic layer"; link source missing: "Import to sema |
| Data Sources › #sources | 🟡 gaps | missing component: "● CONNECTED"; missing component: "STATIC"; missing component: "● FAILING"; link source missing: "prod_pos · Snowflake warehouse ● CONNECT" → |
| Data Sources › #connect | 🟡 gaps | link source missing: "CSV / XLSX / Parquet FILE UPLOAD" → /app/data/upload; link source missing: "{ } REST API POLL" → /app/data/api; link source missing: "Webh |
| Data Sources › #wizard | 🟡 gaps | missing component: "Connection verified"; missing component: "Choose schemas & tables"; missing component: "Role"; missing component: "SALES"; missing component |
| Errors › #errors | ◌ context frame | story-spec coverage |
| Gold Contracts › #gold-tables | ✅ full parity | — |
| Gold Contracts › #gold-detail | 🟡 gaps | missing component: "Query in warehouse"; missing component: "Quality gates"; missing component: "Row count band"; missing component: "PASS"; missing component:  |
| Gold Contracts › #query-contracts | 🟡 3 gaps | missing component: "SAFE ✓"; missing component: "VALID ✓"; missing component: "REPAIRED" |
| Gold Contracts › #data-contracts | 🟡 2 gaps | missing component: "ENFORCED"; missing component: "BLOCKING NOW" |
| Governance Lineage › #lineage | 🟡 gaps | missing component: "stores"; missing component: "Open table detail →"; link source missing: "Open table detail →" → /app/data/tables/:id |
| Governance Lineage › #manifests | 🟡 8 gaps | missing component: "REVIEW REQUIRED"; missing component: "collapse ▴"; missing component: "+ ADD"; missing component: "~ MOD"; missing component: "− DEL"; missi … +2 |
| Governance Lineage › #preagg | 🟡 4 gaps | missing component: "HIGH VALUE"; missing component: "Approve & materialize"; missing component: "Dismiss"; missing component: "MEDIUM" |
| Governance › #gov-overview | ✅ full parity | — |
| Governance › #review-queue | 🟡 6 gaps | missing component: "Assign ▾"; missing component: "CONFLICT"; missing component: "Accept"; missing component: "PII"; missing component: "BRIDGE"; missing compon |
| Governance › #review-detail | 🟡 4 gaps | missing component: "Metric conflict ·"; missing component: "cancellations and full refunds"; missing component: "Request changes"; missing component: "Reject pr |
| Governance › #rules | 🟡 5 gaps | missing component: "aov distribution drift"; missing component: "Edit rule"; missing component: "Target"; missing component: "Save rule"; missing component: "Ca |
| Inspector Panels › #data-contract | ◌ context frame | story-spec coverage |
| Inspector Panels › #pipeline-audit | ◌ context frame | story-spec coverage |
| Inspector Panels › #insights | ◌ context frame | story-spec coverage |
| Inspector Panels › #share-panel | ◌ context frame | story-spec coverage |
| Inspector Panels › #versions | ◌ context frame | story-spec coverage |
| Inspector Panels › #comments-drawer | ◌ context frame | story-spec coverage |
| Inspector Panels › #comment-popover | ◌ context frame | story-spec coverage |
| Onboarding › #workspace-wizard | 🟡 3 gaps | missing component: "Logo"; missing component: "Font"; missing component: "Live preview" |
| Onboarding › #start-mode | 🟡 gaps | missing component: "Where's your data?"; link source missing: "Upload a file CSV, XLSX, Parquet — typed" → /app/data/upload; link source missing: "Connect wareh |
| Onboarding › #source-health | 🟡 2 gaps | missing component: "Here's what we found in"; missing component: "NULL SPIKE" |
| Onboarding › #template-picker | 🟡 gaps | link source missing: "Revenue Trend + Forecast You have transa" → /app/create; link source missing: "Inventory Demand Watch Daily snapshots f" → /app/create; li |
| Marketing Docs › #docs | 🟡 gaps | route /docs should not 404; missing component: "Start free"; missing component: "Quickstart"; missing component: "Use sample data"; missing component: "Approve  |
| Marketing Landing › #landing | 🟡 gaps | missing component: "CONVERSATIONAL ANALYTICS"; missing component: "Book a demo"; missing component: "LIVE BUILD"; missing component: "WHY NOT NORMAL BI?"; missi |
| Marketing Pricing › #pricing | 🟡 gaps | missing component: "Annual"; missing component: "Start trial"; missing component: "Talk to sales"; missing component: "Questions"; missing component: "What coun |
| Marketing Product › #product | 🟡 gaps | route /product should not 404; missing component: "Start free"; missing component: "HOW IT WORKS"; missing component: "Understand"; missing component: "Review y |
| Marketing Security › #security | ❌ route missing | route /security should not 404; missing component: "Start free"; missing component: "SECURITY & GOVERNANCE"; missing component: "No raw data to LLMs"; missing c … +3 |
| Marketing Solutions › #solutions | 🟡 gaps | route /solutions/executives should not 404; missing component: "Start free"; missing component: "FOR EXECUTIVES"; missing component: "See present mode"; missing |
| Marketing Templates › #templates | ❌ route missing | route /templates should not 404; missing component: "Start free"; missing component: "All templates"; missing component: "Operational Risk Monitor"; missing com |
| Models Ops › #leaderboard | 🟡 6 gaps | missing component: "LightGBM"; missing component: "CHAMPION"; missing component: "XGBoost"; missing component: "Prophet"; missing component: "Ridge"; missing co |
| Models Ops › #features | 🟡 6 gaps | missing component: "LOW"; missing component: "APPROVED"; missing component: "HIGH"; missing component: "DROPPED"; missing component: "MEDIUM"; missing component |
| Models Ops › #retrain | 🟡 2 gaps | missing component: "Retrain now"; missing component: "View logs" |
| Models › #models-overview | 🟡 4 gaps | missing component: "Card"; missing component: "Retrain now"; missing component: "RUN FAILED"; missing component: "View logs" |
| Models › #run-detail | 🟡 gaps | missing component: "Summary"; missing component: "LightGBM"; missing component: "Backtest error by window"; missing tab: Summary; missing tab: Backtest windows; |
| Models › #model-card | 🟡 2 gaps | missing component: "NO OVERFIT"; missing component: "Retrain" |
| Semantic Metrics › #metrics-catalog | 🟡 1 gaps | missing component: "DEPRECATED" |
| Semantic Metrics › #metric-detail | 🟡 4 gaps | missing component: "Propose change"; missing component: "ADMIN ONLY"; missing component: "NON-NEGATIVE ✓"; missing component: "RECONCILES GL ✓" |
| Semantic Metrics › #dimensions | 🟡 5 gaps | missing component: "Date"; missing component: "Geography"; missing component: "Boolean"; missing component: "ID"; missing component: "Text" |

