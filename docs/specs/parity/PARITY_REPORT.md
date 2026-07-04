# Design-Parity Scoreboard

Generated from `tests/ui/parity/parity.spec.js` (inventory extracted from
`docs/specs/mockups` — 95 frames). This is the live gap tracker for the
R21–R29 program: a frame flips ✅ when its story lands.

**2 full parity · 82 partial · 3 route missing · 8 context frames** (of 95)

| Frame | State | First gaps |
|---|---|---|
| App Home › #home | 🟡 gaps | missing component: "● HEALTHY"; missing component: "HIGH"; missing component: "MED"; link source missing: "Margin variance by SKU training model st" → /app/crea |
| App Home › #activity | 🟡 gaps | route /app/activity should not 404; missing component: "Recent activity"; missing component: "All"; missing component: "SYS"; missing component: "Load more"; li |
| App Home › #notifications | ❌ route missing | route /app/notifications should not 404; missing component: "Mark all read"; missing component: "All"; missing component: "TODAY"; missing component: "High aler … +2 |
| Artifact Sharing › #public-viewer | 🟡 gaps | missing component: "AR"; missing component: "Acme Retail Analytics"; missing component: "Request access"; missing component: "Top risk sources"; link source mis |
| Artifact Sharing › #expired | 🟡 5 gaps | missing component: "AR"; missing component: "Acme Retail Analytics"; missing component: "This share link has expired"; missing component: "Ops Risk Monitor"; mi |
| Artifact Sharing › #embed | ❌ route missing | route /app/artifacts/:id/embed should not 404; missing component: "Live preview"; missing component: "Embed settings"; missing component: "Embed code"; missing  … +4 |
| Artifact Sharing › #present | ❌ route missing | route /app/artifacts/:id/present should not 404 |
| Artifacts Library › #library | 🟡 gaps | missing component: "Revenue"; missing component: "+ New dashboard"; missing component: "● HEALTHY"; missing component: "Ops Risk Monitor"; missing component: "P |
| Artifacts Library › #library-table | 🟡 2 gaps | missing component: "Ops Risk Monitor"; missing component: "Sales Pipeline Health" |
| Artifacts Library › #artifact-detail | 🟡 gaps | route /app/artifacts/:id should not 404; missing component: "PREDICTIVE"; missing component: "Open in workbench"; missing component: "Duplicate"; missing compon |
| Create Workbench › #create | 🟡 gaps | missing component: "Versions"; missing component: "Share"; missing component: "\"; missing component: "Use recommended"; missing component: "Review your plan";  |
| Inspector Panels › #data-contract | ◌ context frame | story-spec coverage |
| Inspector Panels › #pipeline-audit | ◌ context frame | story-spec coverage |
| Inspector Panels › #insights | ◌ context frame | story-spec coverage |
| Inspector Panels › #share-panel | ◌ context frame | story-spec coverage |
| Inspector Panels › #versions | ◌ context frame | story-spec coverage |
| Inspector Panels › #comments-drawer | ◌ context frame | story-spec coverage |
| Inspector Panels › #comment-popover | ◌ context frame | story-spec coverage |
| Data Detail › #source-detail | 🟡 gaps | missing component: "● CONNECTED"; missing component: "Sync now"; missing component: "Health"; missing component: "Open issues"; missing tab: Overview; missing t |
| Data Detail › #table-detail | 🟡 gaps | missing component: "Business definition"; missing component: "on time"; missing component: "Downstream"; missing component: "Quality gates"; missing component:  |
| Data Import › #upload | 🟡 gaps | missing component: "Replace"; missing component: "Table name"; missing component: "PII"; missing component: "Add to workspace"; link source missing: "Add to wor |
| Data Import › #webhook | 🟡 6 gaps | missing component: "Endpoint URL"; missing component: "Copy"; missing component: "Signing secret"; missing component: "Send test event"; missing component: "Exp |
| Data Import › #rest-api | 🟡 gaps | missing component: "Connection"; missing component: "Endpoint URL"; missing component: "Method"; missing component: "Auth"; missing component: "Headers"; missin |
| Data Import › #dbt | 🟡 gaps | missing component: "Import dbt project"; missing component: "Import to semantic layer"; link source missing: "Import to semantic layer" → /app/semantic |
| Data Sources › #sources | 🟡 gaps | missing component: "Data sources"; missing component: "+ Add source"; missing component: "● CONNECTED"; missing component: "STATIC"; missing component: "● FAILI |
| Data Sources › #connect | 🟡 gaps | missing component: "Connect a source"; missing component: "Snowflake"; missing component: "BigQuery"; missing component: "Databricks SQL"; missing component: "R |
| Data Sources › #wizard | 🟡 gaps | missing component: "Scope & tables"; missing component: "Connection verified"; missing component: "Choose schemas & tables"; missing component: "Database"; miss |
| Governance Lineage › #lineage | 🟡 gaps | missing component: "stores"; missing component: "Auto-layout"; missing component: "Export ↓"; missing component: "Open table detail →"; link source missing: "Op |
| Governance Lineage › #manifests | 🟡 8 gaps | missing component: "REVIEW REQUIRED"; missing component: "collapse ▴"; missing component: "+ ADD"; missing component: "~ MOD"; missing component: "− DEL"; missi … +2 |
| Governance Lineage › #preagg | 🟡 7 gaps | missing component: "Recommended rollups"; missing component: "HIGH VALUE"; missing component: "Approve & materialize"; missing component: "Dismiss"; missing com … +1 |
| Governance › #gov-overview | ✅ full parity | — |
| Governance › #review-queue | 🟡 9 gaps | missing component: "Bulk approve"; missing component: "Assign ▾"; missing component: "CONFLICT"; missing component: "Accept"; missing component: "Edit"; missing … +3 |
| Governance › #review-detail | 🟡 4 gaps | missing component: "Metric conflict ·"; missing component: "cancellations and full refunds"; missing component: "Request changes"; missing component: "Reject pr |
| Governance › #rules | 🟡 10 gaps | missing component: "Quality rules"; missing component: "+ Add rule"; missing component: "aov distribution drift"; missing component: "Edit rule"; missing compon … +4 |
| Semantic Metrics › #metrics-catalog | 🟡 2 gaps | missing component: "+ Calculated metric"; missing component: "DEPRECATED" |
| Semantic Metrics › #metric-detail | 🟡 4 gaps | missing component: "Propose change"; missing component: "ADMIN ONLY"; missing component: "NON-NEGATIVE ✓"; missing component: "RECONCILES GL ✓" |
| Semantic Metrics › #dimensions | 🟡 6 gaps | missing component: "Date"; missing component: "Geography"; missing component: "Category"; missing component: "Boolean"; missing component: "ID"; missing compone |
| Semantic Overview › #sem-overview | 🟡 1 gaps | missing component: "Regenerate" |
| Semantic Overview › #explores | 🟡 3 gaps | missing component: "Revenue"; missing component: "Customer"; missing component: "Inventory" |
| Semantic Overview › #explore-detail | 🟡 gaps | missing component: "Revenue"; missing component: "Analyze this explore"; missing component: "aov"; missing tab: Access; missing tab: Versions; link source missi |
| Semantic Tools › #field-picker | 🟡 gaps | missing component: "Dimensions"; missing component: "Heads up:"; missing component: "Preview"; missing component: "Analyze this →"; missing component: "Measures |
| Semantic Tools › #joins | 🟡 5 gaps | missing component: "Join paths"; missing component: "SAFE"; missing component: "BLOCKED"; missing component: "Recommend bridge table"; missing component: "FAN-O |
| Semantic Tools › #derived | 🟡 7 gaps | missing component: "GOVERNED"; missing component: "Publish"; missing component: "Schedule"; missing component: "Governance tags"; missing component: "Lineage pr … +1 |
| Gold Contracts › #gold-tables | ✅ full parity | — |
| Gold Contracts › #gold-detail | 🟡 gaps | missing component: "Query in warehouse"; missing component: "Quality gates"; missing component: "Row count band"; missing component: "PASS"; missing component:  |
| Gold Contracts › #query-contracts | 🟡 3 gaps | missing component: "SAFE ✓"; missing component: "VALID ✓"; missing component: "REPAIRED" |
| Gold Contracts › #data-contracts | 🟡 2 gaps | missing component: "ENFORCED"; missing component: "BLOCKING NOW" |
| Models Ops › #leaderboard | 🟡 6 gaps | missing component: "LightGBM"; missing component: "CHAMPION"; missing component: "XGBoost"; missing component: "Prophet"; missing component: "Ridge"; missing co |
| Models Ops › #features | 🟡 6 gaps | missing component: "LOW"; missing component: "APPROVED"; missing component: "HIGH"; missing component: "DROPPED"; missing component: "MEDIUM"; missing component |
| Models Ops › #retrain | 🟡 2 gaps | missing component: "Retrain now"; missing component: "View logs" |
| Models › #models-overview | 🟡 gaps | missing component: "Predictive models"; missing component: "Retrain center →"; missing component: "CHAMPION"; missing component: "Retrain"; missing component: " |
| Models › #run-detail | 🟡 gaps | missing component: "Summary"; missing component: "LightGBM"; missing component: "Backtest error by window"; missing tab: Summary; missing tab: Backtest windows; |
| Models › #model-card | 🟡 2 gaps | missing component: "NO OVERFIT"; missing component: "Retrain" |
| Alerts › #alerts-center | 🟡 5 gaps | missing component: "+ Create alert"; missing component: "Daily revenue vs forecast guard"; missing component: "● FIRING"; missing component: "Returns spike anom |
| Alerts › #create-alert | 🟡 9 gaps | missing component: "Create alert"; missing component: "Watch"; missing component: "Condition"; missing component: "Check frequency"; missing component: "Owner"; … +3 |
| Alerts › #alert-detail | 🟡 5 gaps | missing component: "Daily revenue vs forecast guard"; missing component: "● FIRING"; missing component: "Edit"; missing component: "Delete"; missing component:  |
| Billing › #plan | 🟡 gaps | missing component: "Billing & usage"; missing component: "Plan & seats"; missing component: "Business plan"; missing component: "ACTIVE"; missing component: "Se |
| Billing › #usage | 🟡 gaps | missing component: "Token usage — current cycle"; missing component: "Export CSV"; missing component: "Cost analytics →"; missing component: "Daily consumption" |
| Billing › #invoices | 🟡 10 gaps | missing component: "DEFAULT"; missing component: "Add payment method"; missing component: "Download all"; missing component: "OPEN"; missing component: "PDF ↓"; … +4 |
| Collaboration › #comments-inbox | 🟡 gaps | missing component: "JR"; missing component: "Jon Reyes"; link source missing: "Ops Risk Monitor ↗" → /share/:token |
| Collaboration › #invite | 🟡 gaps | missing component: "Invite members"; missing component: "Emails"; missing component: "Role"; missing component: "Explore access"; missing component: "Artifact a |
| Collaboration › #team | 🟡 7 gaps | missing component: "+ Invite"; missing component: "OWNER"; missing component: "ACTIVE"; missing component: "DATA STEWARD"; missing component: "ANALYST"; missing … +1 |
| Admin Security › #audit | 🟡 4 gaps | missing component: "Export CSV/JSON"; missing component: "INFO"; missing component: "NOTICE"; missing component: "WARN" |
| Admin Security › #secrets | 🟡 4 gaps | missing component: "Secrets & credentials"; missing component: "HEALTHY"; missing component: "Rotate"; missing component: "STALE" |
| Admin Security › #sharing-gov | 🟡 3 gaps | missing component: "Sharing rules"; missing component: "Public links allowed"; missing component: "Save rules" |
| Admin Security › #rls | 🟡 9 gaps | missing component: "Policies"; missing component: "+ Policy"; missing component: "Revenue"; missing component: "ON"; missing component: "Margin"; missing compon … +3 |
| Admin Usage › #usage-analytics | 🟡 4 gaps | missing component: "Usage & cost"; missing component: "Export"; missing component: "Top users by consumption"; missing component: "Cost by workspace area" |
| Admin › #admin-overview | 🟡 2 gaps | missing component: "Workspace administration"; missing component: "ENFORCED" |
| Admin › #roles | 🟡 3 gaps | missing component: "Roles & permissions"; missing component: "+ Custom role"; missing component: "SENSITIVE" |
| Admin › #sso | 🟡 9 gaps | missing component: "Single sign-on"; missing component: "● ENFORCED"; missing component: "Identity provider SSO URL"; missing component: "Entity ID"; missing co … +3 |
| Admin › #branding | 🟡 10 gaps | missing component: "Workspace branding"; missing component: "Logo"; missing component: "Accent"; missing component: "Font"; missing component: "Theme scope"; mi … +4 |
| Auth › #login | 🟡 gaps | missing component: "Log in"; missing component: "Email"; missing component: "Password"; missing component: "Continue with Google"; missing component: "Continue  |
| Auth › #register | 🟡 6 gaps | missing component: "Account"; missing component: "Create your account"; missing component: "Full name"; missing component: "Work email"; missing component: "Pas |
| Auth › #register-3 | 🟡 7 gaps | missing component: "Role"; missing component: "What best describes you?"; missing component: "Business User"; missing component: "Analyst"; missing component: " … +1 |
| Auth › #register-4 | 🟡 gaps | missing component: "Kickoff"; missing component: "Invite teammates"; missing component: "Choose your first path"; missing component: "Start with sample data"; m |
| Auth › #forgot | 🟡 5 gaps | missing component: "Reset password"; missing component: "Email"; missing component: "Send reset link"; missing component: "Check your email"; missing component: |
| Auth › #verify | 🟡 2 gaps | missing component: "Verify your email"; missing component: "Resend email" |
| Auth › #sso | 🟡 1 gaps | missing component: "Signing you in…" |
| Auth › #sso-error | 🟡 2 gaps | missing component: "No workspace access"; missing component: "Contact your admin" |
| Settings › #profile | 🟡 6 gaps | missing component: "Upload avatar"; missing component: "Full name"; missing component: "Email"; missing component: "Default workspace"; missing component: "Chan |
| Settings › #preferences | 🟡 7 gaps | missing component: "Default date range"; missing component: "Dashboard theme"; missing component: "Chart density"; missing component: "Comfortable"; missing com … +1 |
| Settings › #api-keys | 🟡 5 gaps | missing component: "API keys"; missing component: "+ Create key"; missing component: "ci-exports"; missing component: "Revoke"; missing component: "portal-embed |
| Settings › #help | 🟡 gaps | missing component: "How can we help?"; missing component: "Getting started"; missing component: "Understanding health scores"; missing component: "Why was my ch |
| Errors › #errors | ◌ context frame | story-spec coverage |
| Onboarding › #workspace-wizard | 🟡 11 gaps | missing component: "Make it yours"; missing component: "Logo"; missing component: "acme-mark.svg"; missing component: "Accent color"; missing component: "Font"; … +5 |
| Onboarding › #start-mode | 🟡 gaps | missing component: "Where's your data?"; missing component: "FASTEST"; missing component: "Use sample data"; missing component: "Upload a file"; missing compone |
| Onboarding › #source-health | 🟡 6 gaps | missing component: "Here's what we found in"; missing component: "Safe to analyze"; missing component: "daily"; missing component: "HEALTHY"; missing component: |
| Onboarding › #template-picker | 🟡 gaps | missing component: "Recommended for your data"; missing component: "Revenue Trend + Forecast"; link source missing: "Revenue Trend + Forecast You have transa" → |
| Marketing Docs › #docs | 🟡 gaps | missing component: "Start free"; missing component: "Quickstart"; missing component: "Use sample data"; missing component: "Approve & Build"; missing component: |
| Marketing Landing › #landing | 🟡 gaps | missing component: "CONVERSATIONAL ANALYTICS"; missing component: "Book a demo"; missing component: "LIVE BUILD"; missing component: "WHY NOT NORMAL BI?"; missi |
| Marketing Pricing › #pricing | 🟡 gaps | missing component: "Annual"; missing component: "Start trial"; missing component: "Talk to sales"; missing component: "Questions"; missing component: "What coun |
| Marketing Product › #product | 🟡 gaps | missing component: "Start free"; missing component: "HOW IT WORKS"; missing component: "Understand"; missing component: "Review your plan"; missing component: " |
| Marketing Security › #security | 🟡 8 gaps | missing component: "Start free"; missing component: "SECURITY & GOVERNANCE"; missing component: "No raw data to LLMs"; missing component: "Read-only warehouse a … +2 |
| Marketing Solutions › #solutions | 🟡 gaps | missing component: "Start free"; missing component: "FOR EXECUTIVES"; missing component: "See present mode"; missing component: "GOVERNED"; missing component: " |
| Marketing Templates › #templates | 🟡 5 gaps | missing component: "Start free"; missing component: "All templates"; missing component: "Operational Risk Monitor"; missing component: "Sales Pipeline Health";  |

