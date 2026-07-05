// R30S3E3-US1 (UI) — Insights panel (`Inspector Panels.dc.html` #insight-panel)
// on the artifact detail page: auto-detected mono header, tinted icon tiles,
// colored mono categories (never snake_case), rich copy, Investigate buttons
// that seed a new workbench planning turn from the insight's drill question.
import { test, expect } from '@playwright/test';

const css = (loc, prop) => loc.evaluate((el, p) => getComputedStyle(el)[p], prop);

async function seedArtifact(request, title) {
  const sess = await (await request.post('/api/sessions', { data: { metric: 'Net Revenue' } })).json();
  const run = await (await request.post('/api/pipeline/run', { data: { sessionId: sess.id } })).json();
  await expect.poll(async () => (await (await request.get(`/api/pipeline/${run.runId}`)).json()).status,
                    { timeout: 20_000 }).toBe('done');
  return (await (await request.post(`/api/sessions/${sess.id}/save_artifact`,
    { data: { title } })).json());
}

test('insight cards: header, tiles, human categories, Investigate → workbench', async ({ page, request }) => {
  const art = await seedArtifact(request, `Insight Art ${Date.now() % 1e6}`);
  await page.goto(`/app/artifacts/${art.id}?tab=insights`);

  const tab = page.getByTestId('tab-insights');
  const header = tab.getByTestId('insights-header');
  await expect(header).toContainText(/auto-detected · \d+/);
  expect(await css(header, 'fontFamily')).toContain('Mono');

  const cards = tab.locator('[data-testid^="insight-card-"]');
  await expect(cards.first()).toBeVisible();

  // tinted icon tile + colored mono category, never snake_case
  await expect(cards.first().getByTestId('insight-tile')).toBeVisible();
  const cat = cards.first().getByTestId('insight-category');
  expect(await css(cat, 'fontFamily')).toContain('Mono');
  const cats = await tab.locator('[data-testid="insight-category"]').allInnerTexts();
  for (const c of cats) expect(c.includes('_'), `snake_case category "${c}"`).toBe(false);

  // Investigate seeds the workbench planning turn
  await cards.first().getByTestId('insight-investigate').click();
  await expect(page).toHaveURL(/\/app\/create\//);
  await expect(page.getByTestId('plan-card').or(page.getByTestId('clarify-chips')).first())
    .toBeVisible({ timeout: 15_000 });
});
