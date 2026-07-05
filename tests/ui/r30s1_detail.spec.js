// R30S1E4-US1 (UI) — Artifact Detail `Artifacts Library.dc.html` Frame 03:
// header block (breadcrumb, editable h1, pills, meta line, 4 actions), 8-tab
// strip routed via ?tab=, Dashboard tab = KPIs + 2 chart sections and NOTHING
// else (model/gate/lineage internals live on their tabs; CENTERPIECE dead),
// Share stub trigger (canonical modal = R30S3E4), Open-in-workbench resumes
// the session. Library card/row/Open all land here. S10 is tombstoned.
import { test, expect } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const css = (loc, prop) => loc.evaluate((el, p) => getComputedStyle(el)[p], prop);
const REPO = process.env.BOOT_PY
  ? path.dirname(path.dirname(path.dirname(path.resolve(process.env.BOOT_PY))))
  : process.cwd();

async function seedArtifact(request, title) {
  const sess = await (await request.post('/api/sessions', { data: { metric: 'Net Revenue' } })).json();
  const run = await (await request.post('/api/pipeline/run', { data: { sessionId: sess.id } })).json();
  await expect.poll(async () => (await (await request.get(`/api/pipeline/${run.runId}`)).json()).status,
                    { timeout: 20_000 }).toBe('done');
  const art = await (await request.post(`/api/sessions/${sess.id}/save_artifact`,
    { data: { title } })).json();
  return { art, sessId: sess.id };
}

test('header block: crumb, editable title, pills, meta, actions', async ({ page, request }) => {
  const title = `Detail Hdr ${Date.now() % 1e6}`;
  const { art } = await seedArtifact(request, title);

  await page.goto(`/app/artifacts/${art.id}`);

  // breadcrumb `artifacts / <folder> / <slug>` in mono
  const crumb = page.getByTestId('detail-crumb');
  await expect(crumb).toContainText('artifacts /');
  expect(await css(crumb, 'fontFamily')).toContain('Mono');

  // editable h1: hover affordance + rename persists through PATCH + reload
  const h1 = page.getByTestId('detail-title');
  await expect(h1).toHaveText(title);
  await h1.click();
  const input = page.getByTestId('detail-title-input');
  await expect(input).toBeVisible();
  await input.fill(`${title} v2`);
  await input.press('Enter');
  await expect(page.getByTestId('detail-title')).toHaveText(`${title} v2`);
  await page.reload();
  await expect(page.getByTestId('detail-title')).toHaveText(`${title} v2`);

  // pills: health + type + version
  await expect(page.getByTestId('detail-health-pill')).toContainText('HEALTHY');
  await expect(page.getByTestId('detail-type-pill')).toHaveText('PREDICTIVE');
  await expect(page.getByTestId('detail-version-pill')).toContainText('v1');

  // meta line: owner avatar+name · relative refresh
  const meta = page.getByTestId('detail-meta');
  await expect(meta).toContainText('Analyst');
  await expect(meta).toContainText(/(just now|\d+[mhd] ago)/);

  // actions
  for (const t of ['detail-open-workbench', 'detail-duplicate', 'detail-export', 'detail-share']) {
    await expect(page.getByTestId(t)).toBeVisible();
  }
});

test('8-tab strip routes via ?tab=; internals live off the Dashboard tab', async ({ page, request }) => {
  const title = `Detail Tabs ${Date.now() % 1e6}`;
  const { art } = await seedArtifact(request, title);

  await page.goto(`/app/artifacts/${art.id}`);
  const strip = page.getByTestId('detail-tabs');
  for (const t of ['Dashboard', 'Insights', 'Pipeline', 'Lineage', 'Model',
                   'Versions', 'Sharing', 'Activity']) {
    await expect(strip.getByRole('tab', { name: t })).toBeVisible();
  }

  // Dashboard tab: 4 KPI cards + 2 chart sections…
  await expect(page.getByTestId('detail-kpis').locator('[data-testid="kpi-card"]')).toHaveCount(4);
  await expect(page.getByTestId('section-trend').locator('svg').first()).toBeVisible();
  await expect(page.getByTestId('section-gap').locator('svg').first()).toBeVisible();

  // …and NONE of the leaked internals (PRD ch13 §3 / §5.1)
  const body = await page.locator('body').innerText();
  for (const leak of ['CENTERPIECE', 'MODEL ID', 'FEATURE MANIFEST', 'SOURCE LINEAGE',
                      'xgb-locrev', 'fact_revenue', 'gate:']) {
    expect(body.toUpperCase().includes(leak.toUpperCase()), `leak "${leak}" on Dashboard tab`).toBe(false);
  }

  // tab click routes via ?tab= and renders its panel
  await strip.getByRole('tab', { name: 'Pipeline' }).click();
  await expect(page).toHaveURL(/tab=pipeline/);
  await expect(page.getByTestId('tab-pipeline')).toBeVisible();

  // deep link straight to a tab
  await page.goto(`/app/artifacts/${art.id}?tab=model`);
  await expect(page.getByTestId('tab-model')).toBeVisible();
  await expect(page.getByTestId('detail-kpis')).toHaveCount(0);
});

test('share stub, workbench resume, duplicate, library entry', async ({ page, request }) => {
  const title = `Detail Act ${Date.now() % 1e6}`;
  const { art, sessId } = await seedArtifact(request, title);

  // library card click lands on the detail route
  await page.goto('/app/artifacts');
  await page.getByPlaceholder('Filter by name, tag, owner…').fill(title);
  await page.locator(`[data-testid="artifact-row-${art.id}"]`).getByTestId('card-title').click();
  await expect(page).toHaveURL(new RegExp(`/app/artifacts/${art.id}$`));

  // share trigger opens the interim modal (canonical modal = R30S3E4)
  await page.getByTestId('detail-share').click();
  await expect(page.getByText('Share artifact')).toBeVisible();
  await page.getByRole('button', { name: 'Close' }).click();

  // duplicate → navigates to the copy's detail page
  await page.getByTestId('detail-duplicate').click();
  await expect(page).not.toHaveURL(new RegExp(`/app/artifacts/${art.id}$`));
  await expect(page).toHaveURL(/\/app\/artifacts\/\d+$/);

  // open in workbench resumes the owning session
  await page.goto(`/app/artifacts/${art.id}`);
  await page.getByTestId('detail-open-workbench').click();
  await expect(page).toHaveURL(new RegExp(`/app/create/${sessId}$`));
});

test('S10 is tombstoned: no imports remain in client/src', async () => {
  let out = '';
  try {
    out = execFileSync('grep', ['-rn', "from './screens/S10_Artifacts'",
      path.join(REPO, 'client', 'src')], { encoding: 'utf8' });
  } catch { /* grep exit 1 = no matches = pass */ }
  expect(out.trim(), 'S10_Artifacts is still imported').toBe('');
});
