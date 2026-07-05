// R32S1E5-US1 (UI) — Lineage graph (`Governance Lineage.dc.html` frame 01 /
// ch16): dot-grid canvas, kind-typed node cards + 6-part legend, click-to-
// select with downstream highlighting, zoom/auto-layout controls, details
// panel with IMPACT IF BROKEN over live /api/lineage data, and ?node= deep
// links (artifact detail's Lineage tab links in).
import { test, expect } from '@playwright/test';

async function runGovernance(request) {
  const conn = await (await request.post('/api/connections',
    { data: { type: 'snowflake', account: 'd', username: 'd', password: 'd' } })).json();
  const run = await (await request.post('/api/governance/run',
    { data: { connectionId: conn.id } })).json();
  await expect.poll(async () =>
    (await (await request.get(`/api/governance/${run.runId}`)).json()).status,
    { timeout: 20_000 }).toMatch(/done|complete/);
  return { cid: conn.id, runId: run.runId };
}

test('lineage canvas: legend, typed nodes, select -> downstream + impact panel', async ({ page, request }) => {
  const { cid, runId } = await runGovernance(request);
  // accept a metric so the metric kind is on the canvas
  const items = await (await request.get(`/api/reviews/${runId}`)).json();
  const metric = items.find(i => (i.type || '').toLowerCase() === 'metric');
  await request.post(`/api/reviews/items/${metric.id}`, { data: { action: 'accept' } });
  const g = await (await request.get(`/api/lineage/${cid}`)).json();

  await page.goto('/app/governance/lineage');
  await expect(page.locator('main h1')).toHaveText('Lineage graph');

  // legend: all six kinds
  const legend = page.getByTestId('lin-legend');
  for (const k of ['source', 'table', 'metric', 'gold', 'model', 'artifact']) {
    await expect(legend.getByText(k, { exact: true })).toBeVisible();
  }

  // every node from the API renders as a card; edges drawn as svg lines
  await expect(page.locator('[data-testid^="lin-node-"]')).toHaveCount(g.nodes.length);
  expect(await page.locator('[data-testid="lin-edges"] line').count())
    .toBe(g.edges.length);

  // controls: zoom % readout changes, auto-layout present
  await expect(page.getByTestId('lin-zoom')).toHaveText('100%');
  await page.getByTestId('lin-zoom-in').click();
  await expect(page.getByTestId('lin-zoom')).toHaveText('115%');
  await page.getByTestId('lin-zoom-out').click();
  await expect(page.getByTestId('lin-auto-layout')).toBeVisible();

  // select a node with downstream edges -> highlight + details panel
  const root = g.edges.find(e => g.nodes.some(n => n.id === e.from && n.kind === 'table'));
  const rootNode = page.getByTestId(`lin-node-${root.from}`);
  await rootNode.evaluate(el => el.click());   // ledger: domClick near transforms
  await expect(rootNode).toHaveAttribute('data-selected', 'true');
  expect(await page.locator('[data-downstream="true"]').count()).toBeGreaterThanOrEqual(1);

  const detail = page.getByTestId('lin-detail');
  await expect(detail).toBeVisible();
  await expect(detail.getByTestId('lin-detail-type')).toContainText('table');
  await expect(detail.getByTestId('lin-detail-health')).toContainText('/ 100');
  await expect(detail).toContainText('Downstream');
  await expect(detail.getByTestId('lin-impact')).toContainText('IMPACT IF BROKEN');
  // close
  await detail.getByTestId('lin-detail-close').evaluate(el => el.click());
  await expect(detail).toHaveCount(0);
});

test('?node= deep link preselects; artifact detail lineage tab links in', async ({ page, request }) => {
  const { cid } = await runGovernance(request);
  const g = await (await request.get(`/api/lineage/${cid}`)).json();
  const table = g.nodes.find(n => n.kind === 'table');

  await page.goto(`/app/governance/lineage?node=${encodeURIComponent(table.id)}`);
  await expect(page.getByTestId(`lin-node-${table.id}`))
    .toHaveAttribute('data-selected', 'true');
  await expect(page.getByTestId('lin-detail')).toBeVisible();

  // artifact detail -> lineage tab deep-links into the graph
  const sess = await (await request.post('/api/sessions',
    { data: { metric: 'Net Revenue' } })).json();
  const run = await (await request.post('/api/pipeline/run',
    { data: { sessionId: sess.id } })).json();
  await expect.poll(async () =>
    (await (await request.get(`/api/pipeline/${run.runId}`)).json()).status,
    { timeout: 20_000 }).toBe('done');
  const art = await (await request.post(`/api/sessions/${sess.id}/save_artifact`,
    { data: { title: `Lineage Link ${Date.now() % 1e6}` } })).json();
  await page.goto(`/app/artifacts/${art.id}?tab=lineage`);
  const link = page.getByTestId('open-in-lineage');
  await expect(link).toBeVisible();
  await link.click();
  await expect(page).toHaveURL(new RegExp(`/app/governance/lineage\\?node=artifact%3A${art.id}`));
  await expect(page.locator('main h1')).toHaveText('Lineage graph');
});
