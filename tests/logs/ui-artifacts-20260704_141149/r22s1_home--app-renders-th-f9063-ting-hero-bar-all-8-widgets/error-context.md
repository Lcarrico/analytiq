# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: r22s1_home.spec.js >> /app renders the frame: greeting, hero bar, all 8 widgets
- Location: tests/ui/r22s1_home.spec.js:17:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByTestId('home-widgets').getByText('Home Recent 307056')
Expected: visible
Error: strict mode violation: getByTestId('home-widgets').getByText('Home Recent 307056') resolved to 2 elements:
    1) <div>Home Recent 307056</div> aka getByTestId('home-widget-recents').getByText('Home Recent')
    2) <span>Home Recent 307056</span> aka getByTestId('home-widget-viewed').getByText('Home Recent')

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByTestId('home-widgets').getByText('Home Recent 307056')

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - complementary [ref=e4]:
    - generic [ref=e6]:
      - img "AnalytIQ" [ref=e7]
      - generic [ref=e12]: AnalytIQ
    - generic [ref=e13]:
      - navigation [ref=e15]:
        - link "Home" [ref=e16] [cursor=pointer]:
          - /url: /app
          - img [ref=e17]
          - text: Home
        - link "Create" [ref=e19] [cursor=pointer]:
          - /url: /app/create
          - img [ref=e20]
          - text: Create
        - link "Artifacts" [ref=e23] [cursor=pointer]:
          - /url: /app/artifacts
          - img [ref=e24]
          - text: Artifacts
      - generic [ref=e27]:
        - generic [ref=e28]: DATA
        - navigation [ref=e29]:
          - link "Data" [ref=e30] [cursor=pointer]:
            - /url: /app/data/sources
            - img [ref=e31]
            - text: Data
          - link "Semantic Layer" [ref=e35] [cursor=pointer]:
            - /url: /app/semantic
            - img [ref=e36]
            - text: Semantic Layer
          - link "Gold Tables" [ref=e41] [cursor=pointer]:
            - /url: /app/gold
            - img [ref=e42]
            - text: Gold Tables
      - generic [ref=e44]:
        - generic [ref=e45]: INTELLIGENCE
        - navigation [ref=e46]:
          - link "Models" [ref=e47] [cursor=pointer]:
            - /url: /app/models
            - img [ref=e48]
            - text: Models
          - link "Alerts" [ref=e51] [cursor=pointer]:
            - /url: /app/alerts
            - img [ref=e52]
            - text: Alerts
          - link "Governance" [ref=e55] [cursor=pointer]:
            - /url: /app/governance
            - img [ref=e56]
            - text: Governance
      - generic [ref=e60]:
        - link "Team" [ref=e61] [cursor=pointer]:
          - /url: /app/team
          - img [ref=e62]
          - text: Team
        - link "Admin" [ref=e67] [cursor=pointer]:
          - /url: /app/admin/platform
          - img [ref=e68]
          - text: Admin
        - link "Billing" [ref=e71] [cursor=pointer]:
          - /url: /app/billing
          - img [ref=e72]
          - text: Billing
        - link "Settings" [ref=e74] [cursor=pointer]:
          - /url: /app/settings/profile
          - img [ref=e75]
          - text: Settings
        - button "Collapse sidebar" [ref=e79] [cursor=pointer]:
          - img [ref=e80]
          - text: Collapse
  - generic [ref=e83]:
    - banner [ref=e84]:
      - button "AR Acme Retail" [ref=e85] [cursor=pointer]:
        - generic [ref=e86]: AR
        - generic [ref=e87]: Acme Retail
        - img [ref=e88]
      - button "Search artifacts, metrics, sources… ⌘K" [ref=e91] [cursor=pointer]:
        - img [ref=e92]
        - generic [ref=e95]: Search artifacts, metrics, sources…
        - generic [ref=e96]: ⌘K
      - generic "Notifications" [ref=e97] [cursor=pointer]:
        - img [ref=e98]
        - generic [ref=e101]: "0"
      - link "?" [ref=e102] [cursor=pointer]:
        - /url: /app/help
      - button "DK" [ref=e104] [cursor=pointer]
    - main [ref=e105]:
      - generic [ref=e106]:
        - generic [ref=e107]:
          - generic [ref=e108]:
            - generic [ref=e109]: acme-retail / home
            - heading "Good morning, Admin" [level=1] [ref=e111]
          - generic [ref=e113]: Sat · Jul 4, 2026 · 14:11
        - generic [ref=e114]:
          - img [ref=e115]
          - textbox "Ask a business question — \"Which locations will miss their Q3 revenue target?\"" [ref=e117]
          - generic [ref=e118]: ⏎ build
          - button "Create" [ref=e119] [cursor=pointer]
        - generic [ref=e120]:
          - generic [ref=e121]:
            - generic [ref=e122]:
              - generic [ref=e123]: Recent artifacts
              - generic [ref=e124] [cursor=pointer]: View library →
            - generic [ref=e126] [cursor=pointer]:
              - img [ref=e128]
              - generic [ref=e130]: Home Recent 307056
              - generic [ref=e131]:
                - generic [ref=e132]: ● HEALTHY
                - generic [ref=e133]: 0m ago
          - generic [ref=e134]:
            - generic [ref=e135]:
              - generic [ref=e136]: Data health
              - generic [ref=e137] [cursor=pointer]: Details →
            - generic [ref=e138]:
              - generic [ref=e140]:
                - img [ref=e141]
                - generic [ref=e144]:
                  - generic [ref=e145]: "100"
                  - generic [ref=e146]: / 100
              - generic [ref=e147]:
                - generic [ref=e148]:
                  - generic [ref=e149]: Sources healthy
                  - generic [ref=e150]: 0/0
                - generic [ref=e151]:
                  - generic [ref=e152]: Freshness SLAs
                  - generic [ref=e153]: met
                - generic [ref=e154]:
                  - generic [ref=e155]: Schema drift
                  - generic [ref=e156]: 0 tables
                - generic [ref=e157]:
                  - generic [ref=e158]: PII flags
                  - generic [ref=e159]: 0 open
          - generic [ref=e160]:
            - generic [ref=e162]: Active pipeline runs
            - text: No runs in flight
          - generic [ref=e163]:
            - generic [ref=e164]:
              - generic [ref=e165]: Alerts firing
              - generic [ref=e166] [cursor=pointer]: All alerts →
            - text: Quiet — nothing firing
          - generic [ref=e167]:
            - generic [ref=e168]:
              - generic [ref=e169]: Awaiting review
              - generic [ref=e170] [cursor=pointer]: Open review queue →
            - text: Queue is clear
          - generic [ref=e171]:
            - generic [ref=e173]: Suggested analyses
            - text: Suggestions appear as the platform learns your data
          - generic [ref=e174]:
            - generic [ref=e176]: Recently viewed
            - generic [ref=e177] [cursor=pointer]:
              - generic [ref=e178]: Home Recent 307056
              - generic [ref=e179]: 0m ago
          - generic [ref=e180]:
            - generic [ref=e181]:
              - generic [ref=e182]: Usage & cost
              - generic [ref=e183]: ADMIN
            - generic [ref=e184]: "0"
            - generic [ref=e185]: tokens this week · 0% of plan
            - text: Usage & limits →
```

# Test source

```ts
  1  | // R22S1E1-US1/US2/US3 (UI) — /app is App Home.dc.html Frame 01: greeting row,
  2  | // hero prompt bar, 8 live widgets; hero ⏎ seeds a workbench session; the
  3  | // legacy wizard landing (S01) is retired.
  4  | import { test, expect } from '@playwright/test';
  5  | 
  6  | const css = (loc, prop) => loc.evaluate((el, p) => getComputedStyle(el)[p], prop);
  7  | 
  8  | async function seedArtifact(request, title) {
  9  |   const sess = await (await request.post('/api/sessions', { data: { metric: 'Net Revenue' } })).json();
  10 |   const run = await (await request.post('/api/pipeline/run', { data: { sessionId: sess.id } })).json();
  11 |   await expect.poll(async () => (await (await request.get(`/api/pipeline/${run.runId}`)).json()).status,
  12 |                     { timeout: 20_000 }).toBe('done');
  13 |   return (await (await request.post(`/api/sessions/${sess.id}/save_artifact`,
  14 |     { data: { title } })).json());
  15 | }
  16 | 
  17 | test('/app renders the frame: greeting, hero bar, all 8 widgets', async ({ page, request }) => {
  18 |   const title = `Home Recent ${Date.now() % 1e6}`;
  19 |   await seedArtifact(request, title);
  20 |   await page.goto('/app');
  21 | 
  22 |   // greeting row
  23 |   await expect(page.getByTestId('breadcrumbs')).toContainText('acme-retail / home');
  24 |   await expect(page.locator('main h1')).toContainText(/^Good morning,/);
  25 |   const date = page.getByTestId('home-date');
  26 |   await expect(date).toBeVisible();
  27 |   expect(await css(date, 'fontFamily')).toContain('Mono');
  28 | 
  29 |   // hero prompt bar (signature): accent-soft border, r12, sparkle, keycap, CTA
  30 |   const hero = page.getByTestId('hero-prompt');
  31 |   await expect(hero).toBeVisible();
  32 |   expect(await css(hero, 'borderColor')).toBe('rgb(199, 217, 248)');
  33 |   expect(await css(hero, 'borderRadius')).toBe('12px');
  34 |   await expect(hero.locator('svg').first()).toBeVisible();
  35 |   await expect(hero.getByTestId('hero-keycap')).toHaveText('⏎ build');
  36 |   const create = hero.getByTestId('hero-create');
  37 |   expect(await create.evaluate(el => el.offsetHeight)).toBe(40);
  38 | 
  39 |   // 8 widgets, exact frame titles
  40 |   const grid = page.getByTestId('home-widgets');
  41 |   expect(await css(grid, 'gridTemplateColumns')).toContain(' ');
  42 |   for (const t of ['Recent artifacts', 'Data health', 'Active pipeline runs',
  43 |                    'Alerts firing', 'Awaiting review', 'Suggested analyses',
  44 |                    'Recently viewed', 'Usage & cost']) {
  45 |     await expect(grid.getByText(t, { exact: true })).toBeVisible();
  46 |   }
  47 |   // live data: the seeded artifact shows in Recent artifacts w/ health dot line
> 48 |   await expect(grid.getByText(title)).toBeVisible();
     |                                       ^ Error: expect(locator).toBeVisible() failed
  49 |   // donut svg in Data health
  50 |   await expect(page.getByTestId('home-health-donut').locator('svg')).toBeVisible();
  51 |   // links per frame
  52 |   await expect(grid.getByText('View library →')).toBeVisible();
  53 |   await expect(grid.getByText('Usage & limits →')).toBeVisible();
  54 |   await grid.getByText('View library →').click();
  55 |   await expect.poll(() => new URL(page.url()).pathname).toBe('/app/artifacts');
  56 | });
  57 | 
  58 | test('hero ⏎ seeds a workbench session with the question', async ({ page }) => {
  59 |   await page.goto('/app');
  60 |   const q = 'Forecast net revenue for the next 14 days by location';
  61 |   await page.getByTestId('hero-input').fill(q);
  62 |   await page.getByTestId('hero-input').press('Enter');
  63 |   await expect.poll(() => new URL(page.url()).pathname + new URL(page.url()).search)
  64 |     .toContain('/app/create/new?q=');
  65 |   // workbench consumed the seed as the first user message
  66 |   await expect(page.getByText(q).first()).toBeVisible();
  67 |   // and planning proceeds (plan card or clarification appears)
  68 |   await expect(page.getByTestId('plan-card').or(page.getByTestId('clarify-chips')).first())
  69 |     .toBeVisible({ timeout: 15_000 });
  70 | });
  71 | 
  72 | test('legacy S01 wizard landing is retired', async ({ page }) => {
  73 |   await page.goto('/app');
  74 |   // legacy S01 rendered a "Start new analysis" wizard CTA — must be gone
  75 |   await expect(page.getByTestId('hero-prompt')).toBeVisible();
  76 |   await expect(page.locator('text=Connect your data warehouse')).toHaveCount(0);
  77 | });
  78 | 
```