// R30S1E3-US1 (UI) — Artifacts Library Frame 02 table view: exact column set
// TITLE(sort)/OWNER avatar+name/TYPE mono/DATA HEALTH scored pill/LAST
// REFRESHED relative/SHARE/TAGS chips/⋯, grid 2fr .9fr .9fr 1fr 1fr .9fr 1fr
// 44px, rows h46 → artifact, ?view=table persists across reload. The ⋯ menu
// is the same per-artifact menu as the card view (Reconciliation (d)).
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

test('frame 02 columns, scored health pill, owner, relative time, share, tags', async ({ page, request }) => {
  const title = `Tbl ${Date.now() % 1e6}`;
  const art = await seedArtifact(request, title);
  await request.put(`/api/artifacts/${art.id}/tags`, { data: { tags: ['rev', 'q3'] } });
  const expected = (await (await request.get(`/api/artifacts/${art.id}/health`)).json()).score;

  await page.goto('/app/artifacts?view=table');
  const table = page.getByTestId('artifacts-table');
  await expect(table).toBeVisible();

  // exact 8-track grid, 44px ⋯ column
  const tracks = (await css(page.getByTestId('artifacts-table-head'), 'gridTemplateColumns')).split(' ');
  expect(tracks.length).toBe(8);
  expect(tracks[7]).toBe('44px');

  // header labels (sortable TITLE renders as a button)
  for (const h of ['Title', 'Owner', 'Type', 'Data health', 'Last refreshed', 'Share', 'Tags']) {
    await expect(table.getByRole('button', { name: new RegExp(`^${h}`) })).toBeVisible();
  }

  const row = page.getByTestId(`table-row-${art.id}`);
  await expect(row).toBeVisible();
  expect(await row.evaluate(el => el.offsetHeight)).toBe(46);

  // OWNER: 22px avatar + capitalized first name (not a raw email)
  const owner = row.getByTestId('owner-cell');
  await expect(owner).toContainText('Analyst');
  await expect(owner).not.toContainText('@');
  expect(await owner.locator('[data-testid="avatar"]').evaluate(el => el.offsetWidth)).toBe(22);

  // TYPE: mono lowercase colored text
  const type = row.getByTestId('type-cell');
  await expect(type).toHaveText('predictive');
  expect(await css(type, 'color')).toBe('rgb(124, 58, 237)');
  expect(await css(type, 'fontFamily')).toContain('Mono');

  // DATA HEALTH: scored pill carrying the API's number (kit 90/70 thresholds)
  const pill = row.getByTestId('health-cell').locator('[data-testid="status-badge"]');
  await expect(pill).toContainText(String(expected));
  await expect(pill.locator('[data-testid="badge-dot"]')).toBeVisible();

  // LAST REFRESHED: relative mono, never a raw timestamp
  const ts = row.getByTestId('refreshed-cell');
  await expect(ts).toHaveText(/^(just now|\d+[mhd] ago)$/);
  expect(await css(ts, 'fontFamily')).toContain('Mono');

  // SHARE: private (fresh artifact, no shares yet)
  await expect(row.getByTestId('share-cell')).toHaveText('private');

  // TAGS: mono chips
  const tags = row.getByTestId('tags-cell');
  await expect(tags.getByText('rev', { exact: true })).toBeVisible();
  await expect(tags.getByText('q3', { exact: true })).toBeVisible();

  // ⋯ opens the same per-artifact menu (Delete present, Reconciliation (d))
  await row.getByTestId('card-menu-trigger').click();
  await expect(page.getByTestId('card-menu')).toBeVisible();
  await expect(page.getByTestId('card-menu').getByText('Delete')).toBeVisible();
});

test('TITLE sorts with an indicator; ?view=table persists across reload', async ({ page, request }) => {
  const stamp = Date.now() % 1e6;
  await seedArtifact(request, `BBB Tbl ${stamp}`);
  await seedArtifact(request, `AAA Tbl ${stamp}`);

  await page.goto('/app/artifacts');
  await expect(page.getByTestId('artifacts-grid')).toBeVisible();
  await page.getByTestId('view-toggle-table').click();
  await expect(page.getByTestId('artifacts-table')).toBeVisible();
  await expect(page).toHaveURL(/view=table/);

  // sort asc → indicator appears on the Title header
  await page.getByTestId('artifacts-table').getByRole('button', { name: /^Title/ }).click();
  await expect(page.getByTestId('artifacts-table').getByRole('button', { name: /^Title ↑/ })).toBeVisible();

  // survives a full reload via the URL param
  await page.reload();
  await expect(page.getByTestId('artifacts-table')).toBeVisible();
  await expect(page.getByTestId('artifacts-grid')).toHaveCount(0);

  // back to cards clears the param
  await page.getByTestId('view-toggle-cards').click();
  await expect(page.getByTestId('artifacts-grid')).toBeVisible();
  await expect(page).not.toHaveURL(/view=table/);
});
