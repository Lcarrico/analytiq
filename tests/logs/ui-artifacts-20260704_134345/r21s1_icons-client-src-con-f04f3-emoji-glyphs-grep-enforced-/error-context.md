# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: r21s1_icons.spec.js >> client/src contains zero emoji glyphs (grep-enforced)
- Location: tests/ui/r21s1_icons.spec.js:12:5

# Error details

```
Error: emoji/pictograph glyphs remain:
/sessions/pensive-gifted-hawking/mnt/analytiq/client/src/components/BuildCanvas.jsx:119:            Open artifact ↗
/sessions/pensive-gifted-hawking/mnt/analytiq/client/src/components/BuildCanvas.jsx:129:          const icon = st === 'done' ? '✓' : st === 'running' ? '◌' : st === 'blocked' ? '✕' : '·';
/sessions/pensive-gifted-hawking/mnt/analytiq/client/src/components/BuildCanvas.jsx:141:              {nodes[key]?.cached ? <span style={{ fontFamily: MONO }}>⚡</span> : null}
/sessions/pensive-gifted-hawking/mnt/analytiq/client/src/components/BuildCanvas.jsx:188:                <span style={{ fontFamily: MONO, fontSize: 10, color: P.green }}>CONTRACT ✓</span>
/sessions/pensive-gifted-hawking/mnt/analytiq/client/src/components/BuildCanvas.jsx:193:                                   color: P.muted, fontSize: 13 }}>✎</button>
/sessions/pensive-gifted-hawking/mnt/analytiq/client/src/components/Inspector.jsx:84:                    {dc.empty_result ? 'empty' : 'contract ✓'}
/sessions/pensive-gifted-hawking/mnt/analytiq/client/src/components/Shell.jsx:18:    { label: 'Home', icon: '⌂', to: '/app' },
/sessions/pensive-gifted-hawking/mnt/analytiq/client/src/components/Shell.jsx:19:    { label: 'Create', icon: '✦', to: '/app/create' },
/sessions/pensive-gifted-hawking/mnt/analytiq/client/src/components/Shell.jsx:20:    { label: 'Artifacts', icon: '▦', to: '/app/artifacts' },
/sessions/pensive-gifted-hawking/mnt/analytiq/client/src/components/Shell.jsx:23:    { label: 'Data', icon: '⬡', to: '/app/data/sources' },
/sessions/pensive-gifted-hawking/mnt/analytiq/client/src/components/Shell.jsx:24:    { label: 'Semantic Layer', icon: '◈', to: '/app/semantic' },
/sessions/pensive-gifted-hawking/mnt/analytiq/client/src/components/Shell.jsx:25:    { label: 'Gold Tables', icon: '▤', to: '/app/gold' },
/sessions/pensive-gifted-hawking/mnt/analytiq/client/src/components/Shell.jsx:26:    { label: 'Models', icon: '⚗', to: '/app/models' },
/sessions/pensive-gifted-hawking/mnt/analytiq/client/src/components/Shell.jsx:29:    { label: 'Alerts', icon: '◉', to: '/app/alerts' },
/sessions/pensive-gifted-hawking/mnt/analytiq/client/src/components/Shell.jsx:30:    { label: 'Governance', icon: '⛭', to: '/app/governance' },
/sessions/pensive-gifted-hawking/mnt/analytiq/client/src/components/Shell.jsx:33:    { label: 'Team', icon: '◇', to: '/app/team' },
/sessions/pensive-gifted-hawking/mnt/analytiq/client/src/components/Shell.jsx:34:    { label: 'Admin', icon: '⚙', to: '/app/admin/platform' },
/sessions/pensive-gifted-hawking/mnt/analytiq/client/src/components/Shell.jsx:35:    { label: 'Billing', icon: '❖', to: '/app/billing' },
/sessions/pensive-gifted-hawking/mnt/analytiq/client/src/components/Shell.jsx:36:    { label: 'Settings', icon: '○', to: '/app/settings/profile' },
/sessions/pensive-gifted-hawking/mnt/analytiq/client/src/components/Shell.jsx:185:            acme-retail ▾

expect(received).toEqual(expected) // deep equality

- Expected  -  1
+ Received  + 85

- Array []
+ Array [
+   "/sessions/pensive-gifted-hawking/mnt/analytiq/client/src/components/BuildCanvas.jsx:119:            Open artifact ↗",
+   "/sessions/pensive-gifted-hawking/mnt/analytiq/client/src/components/BuildCanvas.jsx:129:          const icon = st === 'done' ? '✓' : st === 'running' ? '◌' : st === 'blocked' ? '✕' : '·';",
+   "/sessions/pensive-gifted-hawking/mnt/analytiq/client/src/components/BuildCanvas.jsx:141:              {nodes[key]?.cached ? <span style={{ fontFamily: MONO }}>⚡</span> : null}",
+   "/sessions/pensive-gifted-hawking/mnt/analytiq/client/src/components/BuildCanvas.jsx:188:                <span style={{ fontFamily: MONO, fontSize: 10, color: P.green }}>CONTRACT ✓</span>",
+   "/sessions/pensive-gifted-hawking/mnt/analytiq/client/src/components/BuildCanvas.jsx:193:                                   color: P.muted, fontSize: 13 }}>✎</button>",
+   "/sessions/pensive-gifted-hawking/mnt/analytiq/client/src/components/Inspector.jsx:84:                    {dc.empty_result ? 'empty' : 'contract ✓'}",
+   "/sessions/pensive-gifted-hawking/mnt/analytiq/client/src/components/Shell.jsx:18:    { label: 'Home', icon: '⌂', to: '/app' },",
+   "/sessions/pensive-gifted-hawking/mnt/analytiq/client/src/components/Shell.jsx:19:    { label: 'Create', icon: '✦', to: '/app/create' },",
+   "/sessions/pensive-gifted-hawking/mnt/analytiq/client/src/components/Shell.jsx:20:    { label: 'Artifacts', icon: '▦', to: '/app/artifacts' },",
+   "/sessions/pensive-gifted-hawking/mnt/analytiq/client/src/components/Shell.jsx:23:    { label: 'Data', icon: '⬡', to: '/app/data/sources' },",
+   "/sessions/pensive-gifted-hawking/mnt/analytiq/client/src/components/Shell.jsx:24:    { label: 'Semantic Layer', icon: '◈', to: '/app/semantic' },",
+   "/sessions/pensive-gifted-hawking/mnt/analytiq/client/src/components/Shell.jsx:25:    { label: 'Gold Tables', icon: '▤', to: '/app/gold' },",
+   "/sessions/pensive-gifted-hawking/mnt/analytiq/client/src/components/Shell.jsx:26:    { label: 'Models', icon: '⚗', to: '/app/models' },",
+   "/sessions/pensive-gifted-hawking/mnt/analytiq/client/src/components/Shell.jsx:29:    { label: 'Alerts', icon: '◉', to: '/app/alerts' },",
+   "/sessions/pensive-gifted-hawking/mnt/analytiq/client/src/components/Shell.jsx:30:    { label: 'Governance', icon: '⛭', to: '/app/governance' },",
+   "/sessions/pensive-gifted-hawking/mnt/analytiq/client/src/components/Shell.jsx:33:    { label: 'Team', icon: '◇', to: '/app/team' },",
+   "/sessions/pensive-gifted-hawking/mnt/analytiq/client/src/components/Shell.jsx:34:    { label: 'Admin', icon: '⚙', to: '/app/admin/platform' },",
+   "/sessions/pensive-gifted-hawking/mnt/analytiq/client/src/components/Shell.jsx:35:    { label: 'Billing', icon: '❖', to: '/app/billing' },",
+   "/sessions/pensive-gifted-hawking/mnt/analytiq/client/src/components/Shell.jsx:36:    { label: 'Settings', icon: '○', to: '/app/settings/profile' },",
+   "/sessions/pensive-gifted-hawking/mnt/analytiq/client/src/components/Shell.jsx:185:            acme-retail ▾",
+   "/sessions/pensive-gifted-hawking/mnt/analytiq/client/src/components/Shell.jsx:199:            🔔<span data-testid=\"bell-count\"",
+   "/sessions/pensive-gifted-hawking/mnt/analytiq/client/src/components/Sidebar.jsx:5:  { id: 1,  label: 'Workspace',      icon: '⌂',  group: null               },",
+   "/sessions/pensive-gifted-hawking/mnt/analytiq/client/src/components/Sidebar.jsx:6:  { id: 2,  label: 'Data sources',   icon: '⬡',  group: '0 · Governance'   },",
+   "/sessions/pensive-gifted-hawking/mnt/analytiq/client/src/components/Sidebar.jsx:7:  { id: 3,  label: 'Governance run', icon: '◎',  group: null               },",
+   "/sessions/pensive-gifted-hawking/mnt/analytiq/client/src/components/Sidebar.jsx:8:  { id: 4,  label: 'Table health',   icon: '✦',  group: null               },",
+   "/sessions/pensive-gifted-hawking/mnt/analytiq/client/src/components/Sidebar.jsx:9:  { id: 13, label: 'Governance ops', icon: '⛭',  group: null               },",
+   "/sessions/pensive-gifted-hawking/mnt/analytiq/client/src/components/Sidebar.jsx:10:  { id: 5,  label: 'Semantic layer', icon: '◈',  group: '1 · Semantic'     },",
+   "/sessions/pensive-gifted-hawking/mnt/analytiq/client/src/components/Sidebar.jsx:11:  { id: 6,  label: 'Analysis',       icon: '⬥',  group: '2 · Analysis'     },",
+   "/sessions/pensive-gifted-hawking/mnt/analytiq/client/src/components/Sidebar.jsx:12:  { id: 7,  label: 'Spec review',    icon: '◇',  group: null               },",
+   "/sessions/pensive-gifted-hawking/mnt/analytiq/client/src/components/Sidebar.jsx:13:  { id: 8,  label: 'Pipeline',       icon: '▶',  group: '3–5 · Pipeline'   },",
+   "/sessions/pensive-gifted-hawking/mnt/analytiq/client/src/components/Sidebar.jsx:14:  { id: 14, label: 'Models',         icon: '⚗',  group: null               },",
+   "/sessions/pensive-gifted-hawking/mnt/analytiq/client/src/components/Sidebar.jsx:15:  { id: 9,  label: 'Dashboard ★',    icon: '✦',  group: '6 · Artifact'     },",
+   "/sessions/pensive-gifted-hawking/mnt/analytiq/client/src/components/Sidebar.jsx:17:  { id: 11, label: 'Account',        icon: '◉',  group: 'Platform'         },",
+   "/sessions/pensive-gifted-hawking/mnt/analytiq/client/src/components/Sidebar.jsx:18:  { id: 12, label: 'Platform',       icon: '⚙',  group: null               },",
+   "/sessions/pensive-gifted-hawking/mnt/analytiq/client/src/components/ui.jsx:141:              {done ? '✓' : i + 1}",
+   "/sessions/pensive-gifted-hawking/mnt/analytiq/client/src/components/ui.jsx:226:const GATE_MAP = { pass: ['green', '✓'], warn: ['amber', '!'], fail: ['red', '✗'], flag: ['purple', 'PII'] };",
+   "/sessions/pensive-gifted-hawking/mnt/analytiq/client/src/components/ui.jsx:324:                             fontSize: 16, color: P.muted, lineHeight: 1 }}>✕</button>",
+   "/sessions/pensive-gifted-hawking/mnt/analytiq/client/src/components/ui.jsx:602:                           fontSize: 16, color: P.muted, lineHeight: 1 }}>✕</button>",
+   "/sessions/pensive-gifted-hawking/mnt/analytiq/client/src/routes.js:1:// R15S1E1: screen ↔ route map (PRD v3 information architecture).",
+   "/sessions/pensive-gifted-hawking/mnt/analytiq/client/src/screens/KitGallery.jsx:129:            <LogLine ts=\"14:02:12\" kind=\"ok\">✓ contract passed — 1,284 rows</LogLine>",
+   "/sessions/pensive-gifted-hawking/mnt/analytiq/client/src/screens/KitGallery.jsx:130:            <LogLine ts=\"14:02:12\" kind=\"error\">✗ dropped feature: leak_risk_col</LogLine>",
+   "/sessions/pensive-gifted-hawking/mnt/analytiq/client/src/screens/Marketing.jsx:64:          <div style={{ marginTop: 8 }}>✓ plan validated · ✓ gold gated · ✓ model promoted</div>",
+   "/sessions/pensive-gifted-hawking/mnt/analytiq/client/src/screens/Marketing.jsx:103:                                      padding: '3px 0' }}>✓ {f}</div>",
+   "/sessions/pensive-gifted-hawking/mnt/analytiq/client/src/screens/S01_Home.jsx:41:          <div style={{ width: 80, height: 80, background: C.primaryLight, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: 36 }}>📊</div>",
+   "/sessions/pensive-gifted-hawking/mnt/analytiq/client/src/screens/S01_Home.jsx:50:              { icon: '🔒', title: 'Credentials stay secure', desc: 'Encrypted at rest and never shared with the LLM layer.' },",
+   "/sessions/pensive-gifted-hawking/mnt/analytiq/client/src/screens/S01_Home.jsx:51:              { icon: '✓',  title: 'Walk-forward backtesting', desc: 'Every model validated on held-out time windows before shipping.' },",
+   "/sessions/pensive-gifted-hawking/mnt/analytiq/client/src/screens/S01_Home.jsx:52:              { icon: '📤', title: 'Shareable artifacts', desc: 'Self-contained dashboards with full lineage metadata.' },",
+   "/sessions/pensive-gifted-hawking/mnt/analytiq/client/src/screens/S02_Connect.jsx:8:  { id: 'snowflake',  name: 'Snowflake',   icon: '❄️',  live: true  },",
+   "/sessions/pensive-gifted-hawking/mnt/analytiq/client/src/screens/S02_Connect.jsx:9:  { id: 'bigquery',   name: 'BigQuery',    icon: '🔵', live: true  },",
+   "/sessions/pensive-gifted-hawking/mnt/analytiq/client/src/screens/S02_Connect.jsx:10:  { id: 'redshift',   name: 'Redshift',    icon: '🔴', live: true  },",
+   "/sessions/pensive-gifted-hawking/mnt/analytiq/client/src/screens/S02_Connect.jsx:11:  { id: 'postgres',   name: 'PostgreSQL',  icon: '🐘', live: true  },",
+   "/sessions/pensive-gifted-hawking/mnt/analytiq/client/src/screens/S02_Connect.jsx:12:  { id: 'databricks', name: 'Databricks',  icon: '⚡', live: true  },",
+   "/sessions/pensive-gifted-hawking/mnt/analytiq/client/src/screens/S02_Connect.jsx:13:  { id: 'dbt',        name: 'dbt Cloud',   icon: '⬡',  live: false },",
+   "/sessions/pensive-gifted-hawking/mnt/analytiq/client/src/screens/S02_Connect.jsx:107:const CONNECTOR_ICON = { snowflake: '❄️', postgres: '🐘', bigquery: '🔵', redshift: '🔴', databricks: '⚡', dbt: '⬡' };",
+   "/sessions/pensive-gifted-hawking/mnt/analytiq/client/src/screens/S02_Connect.jsx:151:            <span style={{ fontSize: 22 }}>{CONNECTOR_ICON[c.type] || '🔌'}</span>",
+   "/sessions/pensive-gifted-hawking/mnt/analytiq/client/src/screens/S02_Connect.jsx:300:          🔒 Credentials submit directly to the secrets manager — never logged, never sent to any agent.",
+   "/sessions/pensive-gifted-hawking/mnt/analytiq/client/src/screens/S02_Connect.jsx:305:            {testResult.ok ? '✓' : '⚠️'} {testResult.message}",
+   "/sessions/pensive-gifted-hawking/mnt/analytiq/client/src/screens/S02_Connect.jsx:311:            ⚠️ {error}",
+   "/sessions/pensive-gifted-hawking/mnt/analytiq/client/src/screens/S02_Connect.jsx:368:          ⚠️ {error}",
+   "/sessions/pensive-gifted-hawking/mnt/analytiq/client/src/screens/S06_Analysis.jsx:213:                  💡 {s_.question}",
+   "/sessions/pensive-gifted-hawking/mnt/analytiq/client/src/screens/S08_Pipeline.jsx:134:                color: l.includes('✓ PASS') ? C.success",
+   "/sessions/pensive-gifted-hawking/mnt/analytiq/client/src/screens/S10_Artifacts.jsx:103:                  <button onClick={() => handleRemove(s.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textTer, fontSize: 14 }}>✕</button>",
+   "/sessions/pensive-gifted-hawking/mnt/analytiq/client/src/screens/S10_Artifacts.jsx:111:          📎 Public links and embed tokens are out of scope for v1 — available in Phase 2.",
+   "/sessions/pensive-gifted-hawking/mnt/analytiq/client/src/screens/S10_Artifacts.jsx:330:            <Btn variant=\"outline\" onClick={makeHealthDashboard}>⚕ Health dashboard</Btn>",
+   "/sessions/pensive-gifted-hawking/mnt/analytiq/client/src/screens/S10_Artifacts.jsx:389:          <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>",
+   "/sessions/pensive-gifted-hawking/mnt/analytiq/client/src/screens/S10_Artifacts.jsx:430:                          ⚕ {health[art.id]}",
+   "/sessions/pensive-gifted-hawking/mnt/analytiq/client/src/screens/S10_Artifacts.jsx:441:                      <span>👤 {art.owner}</span>",
+   "/sessions/pensive-gifted-hawking/mnt/analytiq/client/src/screens/S10_Artifacts.jsx:442:                      <span>🕐 {art.created_at ? new Date(art.created_at).toLocaleDateString('en-US', { dateStyle: 'medium' }) : 'Just now'}</span>",
+   "/sessions/pensive-gifted-hawking/mnt/analytiq/client/src/screens/S10_Artifacts.jsx:443:                      {(art.share_count || 0) > 0 && <span>👥 Shared with {art.share_count}</span>}",
+   "/sessions/pensive-gifted-hawking/mnt/analytiq/client/src/screens/S10_Artifacts.jsx:451:                      {art.favorite ? '★' : '☆'}",
+   "/sessions/pensive-gifted-hawking/mnt/analytiq/client/src/screens/S10_Artifacts.jsx:483:                          setNotice(`⚠️ ${m}`);",
+   "/sessions/pensive-gifted-hawking/mnt/analytiq/client/src/screens/S10_Artifacts.jsx:522:                    <Btn size=\"sm\" variant=\"ghost\"     onClick={() => handleDelete(art.id)}>✕</Btn>",
+   "/sessions/pensive-gifted-hawking/mnt/analytiq/client/src/screens/S10_Artifacts.jsx:575:                        {s.cached && <span style={{ fontSize: 11, fontFamily: MONO, color: '#1a7f37' }}>⚡ from run {s.prior_run_id}</span>}",
+   "/sessions/pensive-gifted-hawking/mnt/analytiq/client/src/screens/S10_Artifacts.jsx:640:                              {!!n.cached && <span data-testid=\"dag-node-cached\" style={{ marginLeft: 5, color: '#1a7f37', fontWeight: 700 }}>⚡ cached</span>}",
+   "/sessions/pensive-gifted-hawking/mnt/analytiq/client/src/screens/S11_Account.jsx:74:          {error && <div style={{ fontSize: 12, color: '#dc2626', fontFamily: FONT }}>⚠️ {error}</div>}",
+   "/sessions/pensive-gifted-hawking/mnt/analytiq/client/src/screens/S11_Account.jsx:100:                    style={{ border: 'none', background: 'none', cursor: 'pointer', color: C.textTer, fontSize: 13 }}>✕</button>",
+   "/sessions/pensive-gifted-hawking/mnt/analytiq/client/src/screens/S12_Platform.jsx:64:                setMsg(`⚠️ ${m}`); }",
+   "/sessions/pensive-gifted-hawking/mnt/analytiq/client/src/screens/S12_Platform.jsx:119:          <Btn size=\"sm\" variant=\"ghost\" onClick={load}>↻ Refresh</Btn>",
+   "/sessions/pensive-gifted-hawking/mnt/analytiq/client/src/screens/S12_Platform.jsx:268:              ✓{t.accepted} ✕{t.dismissed} ·{t.ignored}",
+   "/sessions/pensive-gifted-hawking/mnt/analytiq/client/src/screens/S13_GovernanceOps.jsx:45:                setMsg(`⚠️ ${m}`); }",
+   "/sessions/pensive-gifted-hawking/mnt/analytiq/client/src/screens/S13_GovernanceOps.jsx:108:              <Badge variant=\"default\" xs>contract ⚠</Badge>",
+   "/sessions/pensive-gifted-hawking/mnt/analytiq/client/src/screens/S14_Models.jsx:49:      setMsg(`⚠️ ${m}`);",
+   "/sessions/pensive-gifted-hawking/mnt/analytiq/client/src/screens/S14_Models.jsx:112:          <Btn size=\"sm\" variant=\"ghost\" onClick={load}>↻ Refresh</Btn>",
+ ]
```

# Test source

```ts
  1  | // R21S1E3-US1 (UI) — SVG icon set replaces every emoji glyph; icons.jsx
  2  | // exports the 15px stroke set extracted from App Home.dc.html.
  3  | import { test, expect } from '@playwright/test';
  4  | import { execFileSync } from 'node:child_process';
  5  | import path from 'node:path';
  6  | import fs from 'node:fs';
  7  | 
  8  | const REPO = process.env.BOOT_PY
  9  |   ? path.dirname(path.dirname(path.dirname(path.resolve(process.env.BOOT_PY))))
  10 |   : process.cwd();
  11 | 
  12 | test('client/src contains zero emoji glyphs (grep-enforced)', async () => {
  13 |   // Emoji / pictograph / dingbat / misc-symbol ranges + the specific glyphs
  14 |   // the legacy chrome used (⌂ ✦ ▦ ⬡ ◈ ▤ ⚗ ◉ ⛭ ◇ ⚙ ❖ ○ 🔔 ❄️ 🐘 🔵 🔴 ⚡ 🔌 ✨ 📊).
  15 |   let out = '';
  16 |   try {
  17 |     out = execFileSync('grep', ['-rnP',
  18 |       '[\\x{1F300}-\\x{1FAFF}]|[\\x{2600}-\\x{27BF}]|[\\x{2B00}-\\x{2BFF}]|[\\x{25A0}-\\x{25FF}]|[\\x{2190}-\\x{21FF}]|[\\x{2300}-\\x{23FF}]',
  19 |       '--include=*.jsx', '--include=*.js',
  20 |       path.join(REPO, 'client', 'src')], { encoding: 'utf8' });
  21 |   } catch (e) {
  22 |     // grep exit 1 = no matches = what we want
  23 |     out = String(e.stdout || '');
  24 |   }
  25 |   const hits = out.split('\n').filter(Boolean)
  26 |     // arrows in copy strings like "Re-scan →" are allowed by the checklist
  27 |     // (frames use → in copy); everything else is not.
  28 |     .filter(l => !/→|←|↑|↓|⏎|✕|✓|✗|✎|…|·/.test(l) || /[\u{1F300}-\u{1FAFF}]|[☀-➿]|[⬀-⯿]|[■-◿]/u.test(l));
> 29 |   expect(hits, `emoji/pictograph glyphs remain:\n${hits.slice(0, 20).join('\n')}`).toEqual([]);
     |                                                                                    ^ Error: emoji/pictograph glyphs remain:
  30 | });
  31 | 
  32 | test('icons.jsx exports the sidebar/topbar set and the shared Logo', async () => {
  33 |   const src = fs.readFileSync(path.join(REPO, 'client', 'src', 'components', 'icons.jsx'), 'utf8');
  34 |   for (const name of ['Home', 'Create', 'Artifacts', 'Data', 'Semantic', 'Gold',
  35 |                       'Models', 'Alerts', 'Governance', 'Team', 'Admin', 'Billing',
  36 |                       'Settings', 'Search', 'Bell', 'Help', 'Caret', 'Close',
  37 |                       'Check', 'Warning', 'Lock', 'External', 'Copy', 'Eye', 'Filter']) {
  38 |     expect(src.includes(`${name}:`) || src.includes(`function ${name}`),
  39 |            `icon ${name} missing`).toBe(true);
  40 |   }
  41 |   expect(src).toContain('export function Logo');
  42 | });
  43 | 
  44 | test('sidebar items render 15px stroke SVGs, not text glyphs', async ({ page }) => {
  45 |   await page.goto('/app');
  46 |   const sidebar = page.getByTestId('app-sidebar');
  47 |   const homeLink = sidebar.getByRole('link', { name: 'Home', exact: true });
  48 |   await expect(homeLink.locator('svg')).toBeVisible();
  49 |   const [w, h] = await homeLink.locator('svg').evaluate(el =>
  50 |     [el.getAttribute('width'), el.getAttribute('height')]);
  51 |   expect(w).toBe('15');
  52 |   expect(h).toBe('15');
  53 | });
  54 | 
```