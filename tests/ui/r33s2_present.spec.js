// R33S2E3-US1 (UI) — Present mode (`Artifact Sharing.dc.html` frame 04 /
// ch14): full-screen chrome-free dark stage at /app/artifacts/:id/present,
// slide header `section n / m`, per-slide chart panels from real chart
// data, floating control pill, and a presenter-notes drawer fed by the
// narrative engine. Wired from the canvas ▶ Present button.
import { test, expect } from '@playwright/test';

const css = (loc, prop) => loc.evaluate((el, p) => getComputedStyle(el)[p], prop);

async function artifact(request) {
  const sess = await (await request.post('/api/sessions',
    { data: { metric: 'Net Revenue' } })).json();
  const run = await (await request.post('/api/pipeline/run',
    { data: { sessionId: sess.id } })).json();
  await expect.poll(async () =>
    (await (await request.get(`/api/pipeline/${run.runId}`)).json()).status,
    { timeout: 25_000 }).toBe('done');
  return (await (await request.post(`/api/sessions/${sess.id}/save_artifact`,
    { data: { title: `Present ${Date.now() % 1e6}` } })).json());
}

test('present mode: dark stage, slides, control pill, notes drawer', async ({ page, request }) => {
  const art = await artifact(request);
  const narrative = await (await request.get(
    `/api/artifacts/${art.id}/narrative?audience=executive`)).json();

  await page.goto(`/app/artifacts/${art.id}/present`);
  const stage = page.getByTestId('present-stage');
  expect(await css(stage, 'backgroundColor')).toBe('rgb(15, 23, 42)');
  await expect(page.getByTestId('app-sidebar')).toHaveCount(0);   // chrome-free

  // slide header + counter
  await expect(page.getByTestId('present-counter')).toContainText('section 1 /');
  const firstTitle = await page.getByTestId('present-title').innerText();

  // floating control pill: advance
  await page.getByTestId('present-next').click();
  await expect(page.getByTestId('present-counter')).toContainText('section 2 /');
  await expect(page.getByTestId('present-title')).not.toHaveText(firstTitle);
  await expect(page.getByTestId('present-chart').locator('svg')).toBeVisible();
  await page.getByTestId('present-prev').click();
  await expect(page.getByTestId('present-counter')).toContainText('section 1 /');

  // presenter notes drawer from the narrative engine
  await page.getByTestId('present-notes-toggle').click();
  const drawer = page.getByTestId('present-notes');
  await expect(drawer).toContainText('PRESENTER NOTES · AUTO-GENERATED NARRATIVE');
  await expect(drawer).toContainText(narrative.narrative.slice(0, 40));
  await drawer.getByTestId('present-notes-close').click();
  await expect(drawer).toHaveCount(0);

  // exit returns to the artifact
  await page.getByTestId('present-exit').click();
  await expect(page).toHaveURL(new RegExp(`/app/artifacts/${art.id}`));
});

test('canvas Present button opens the stage for the saved artifact', async ({ page }) => {
  // canonical canvas path: ask -> plan -> approve -> canvas autosaves v1
  await page.goto('/app/create/new');
  await page.getByTestId('workbench-input').fill(
    'Forecast net revenue for the next 14 days by location');
  await page.getByTestId('workbench-send').click();
  await expect(page.getByTestId('plan-card')).toBeVisible({ timeout: 15_000 });
  await page.getByTestId('approve-build').click();
  await expect(page.getByTestId('canvas-version')).toContainText(/saved/,
    { timeout: 25_000 });
  const btn = page.getByTestId('present-btn');
  await expect(btn).toBeEnabled();
  await btn.click();
  await expect(page).toHaveURL(/\/app\/artifacts\/\d+\/present$/);
  await expect(page.getByTestId('present-stage')).toBeVisible();
});
