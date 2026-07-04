// R22S1E1-US1/US2/US3 (UI) — /app is App Home.dc.html Frame 01: greeting row,
// hero prompt bar, 8 live widgets; hero ⏎ seeds a workbench session; the
// legacy wizard landing (S01) is retired.
import { test, expect } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';

const css = (loc, prop) => loc.evaluate((el, p) => getComputedStyle(el)[p], prop);
const REPO = process.env.BOOT_PY
  ? path.dirname(path.dirname(path.dirname(path.resolve(process.env.BOOT_PY))))
  : process.cwd();

async function seedArtifact(request, title) {
  const sess = await (await request.post('/api/sessions', { data: { metric: 'Net Revenue' } })).json();
  const run = await (await request.post('/api/pipeline/run', { data: { sessionId: sess.id } })).json();
  await expect.poll(async () => (await (await request.get(`/api/pipeline/${run.runId}`)).json()).status,
                    { timeout: 20_000 }).toBe('done');
  return (await (await request.post(`/api/sessions/${sess.id}/save_artifact`,
    { data: { title } })).json());
}

test('/app renders the frame: greeting, hero bar, all 8 widgets', async ({ page, request }) => {
  const title = `Home Recent ${Date.now() % 1e6}`;
  await seedArtifact(request, title);
  await page.goto('/app');

  // greeting row
  await expect(page.getByTestId('breadcrumbs')).toContainText('acme-retail / home');
  await expect(page.locator('main h1')).toContainText(/^Good morning,/);
  const date = page.getByTestId('home-date');
  await expect(date).toBeVisible();
  expect(await css(date, 'fontFamily')).toContain('Mono');

  // hero prompt bar (signature): accent-soft border, r12, sparkle, keycap, CTA
  const hero = page.getByTestId('hero-prompt');
  await expect(hero).toBeVisible();
  expect(await css(hero, 'borderColor')).toBe('rgb(199, 217, 248)');
  expect(await css(hero, 'borderRadius')).toBe('12px');
  await expect(hero.locator('svg').first()).toBeVisible();
  await expect(hero.getByTestId('hero-keycap')).toHaveText('⏎ build');
  const create = hero.getByTestId('hero-create');
  expect(await create.evaluate(el => el.offsetHeight)).toBe(40);

  // 8 widgets, exact frame titles
  const grid = page.getByTestId('home-widgets');
  expect(await css(grid, 'gridTemplateColumns')).toContain(' ');
  for (const t of ['Recent artifacts', 'Data health', 'Active pipeline runs',
                   'Alerts firing', 'Awaiting review', 'Suggested analyses',
                   'Recently viewed', 'Usage & cost']) {
    await expect(grid.getByText(t, { exact: true })).toBeVisible();
  }
  // live data: the seeded artifact shows in Recent artifacts (it also shows
  // under Recently viewed — same substrate — so scope to the recents widget)
  await expect(page.getByTestId('home-widget-recents').getByText(title)).toBeVisible();
  // donut svg in Data health
  await expect(page.getByTestId('home-health-donut').locator('svg')).toBeVisible();
  // links per frame
  await expect(grid.getByText('View library →')).toBeVisible();
  await expect(grid.getByText('Usage & limits →')).toBeVisible();
  // parity evidence (US-plan): docs/specs/parity/home/app.png @1440
  await page.setViewportSize({ width: 1440, height: 1100 });
  const dir = path.join(REPO, 'docs', 'specs', 'parity', 'home');
  fs.mkdirSync(dir, { recursive: true });
  await page.screenshot({ path: path.join(dir, 'app.png'), fullPage: true });

  await grid.getByText('View library →').click();
  await expect.poll(() => new URL(page.url()).pathname).toBe('/app/artifacts');
});

test('hero ⏎ seeds a workbench session with the question', async ({ page }) => {
  await page.goto('/app');
  const q = 'Forecast net revenue for the next 14 days by location';
  await page.getByTestId('hero-input').fill(q);
  await page.getByTestId('hero-input').press('Enter');
  await expect.poll(() => new URL(page.url()).pathname + new URL(page.url()).search)
    .toContain('/app/create/new?q=');
  // workbench consumed the seed as the first user message
  await expect(page.getByText(q).first()).toBeVisible();
  // and planning proceeds (plan card or clarification appears)
  await expect(page.getByTestId('plan-card').or(page.getByTestId('clarify-chips')).first())
    .toBeVisible({ timeout: 15_000 });
});

test('legacy S01 wizard landing is retired', async ({ page }) => {
  await page.goto('/app');
  // legacy S01 rendered a "Start new analysis" wizard CTA — must be gone
  await expect(page.getByTestId('hero-prompt')).toBeVisible();
  await expect(page.locator('text=Connect your data warehouse')).toHaveCount(0);
});
