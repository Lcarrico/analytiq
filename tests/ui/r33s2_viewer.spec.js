// R33S2E1-US1 (UI) — Public viewer parity (`Artifact Sharing.dc.html`
// frames 01–02 / ch14): workspace-brand bar, expiry note + owner mailto,
// viewer filter bar (range slicing is real, client-side over public chart
// data; regional slicing owned by R35), KPI grid + recent-actuals bars
// alongside the artifact frame, Powered-by footer, and the designed
// expired-token card.
import { test, expect } from '@playwright/test';

async function share(request, title) {
  const sess = await (await request.post('/api/sessions',
    { data: { metric: 'Net Revenue' } })).json();
  const run = await (await request.post('/api/pipeline/run',
    { data: { sessionId: sess.id } })).json();
  await expect.poll(async () =>
    (await (await request.get(`/api/pipeline/${run.runId}`)).json()).status,
    { timeout: 25_000 }).toBe('done');
  const art = await (await request.post(`/api/sessions/${sess.id}/save_artifact`,
    { data: { title } })).json();
  const link = await (await request.post(`/api/artifacts/${art.id}/share_links`,
    { data: { expires_in_hours: 24 } })).json();
  return { art, token: link.token || link.url.split('/').pop() };
}

test('viewer parity: brand bar, filters, KPI grid, bars, footer', async ({ page, request }) => {
  await request.put('/api/branding', { data: { logo_text: 'Acme Retail',
                                               primary_color: '#2563eb' } });
  const title = `Parity ${Date.now() % 1e6}`;
  const { token } = await share(request, title);
  const chart = await (await request.get(`/api/public/${token}/chart`)).json();
  expect(chart.rows.length).toBeGreaterThan(40);

  await page.goto(`/share/${token}`);
  const brand = page.getByTestId('viewer-brand');
  await expect(brand).toContainText('Acme Retail');
  await expect(page.getByTestId('viewer-title')).toContainText(title);
  await expect(page.getByTestId('viewer-expiry')).toContainText(/read-only · expires/);

  // filter bar: real range slicing over the public chart data
  const filters = page.getByTestId('viewer-filters');
  await expect(filters).toContainText('viewer filters permitted · no editing');
  await expect(filters.getByTestId('viewer-region')).toBeDisabled();
  const kpi = page.getByTestId('viewer-kpi-avg').getByTestId('vk-value');
  const before = await kpi.innerText();
  await filters.getByTestId('viewer-range').selectOption('all');
  await expect(kpi).not.toHaveText(before);   // different window -> different avg

  // KPI grid ×3 + recent-actuals bars + footer + frame intact
  await expect(page.locator('[data-testid^="viewer-kpi-"]')).toHaveCount(3);
  expect(await page.locator('[data-testid="viewer-bars"] [data-testid^="vbar-"]').count())
    .toBe(7);
  await expect(page.getByTestId('viewer-frame')).toBeVisible();
  await expect(page.getByTestId('viewer-footer')).toContainText('Powered by AnalytIQ');
});

test('expired token: designed card with brand bar + request link', async ({ page, request }) => {
  const title = `Expired ${Date.now() % 1e6}`;
  const { art, token } = await share(request, title);
  await request.post(`/api/artifacts/${art.id}/share_links/revoke`);

  await page.goto(`/share/${token}`);
  const card = page.getByTestId('viewer-expired');
  await expect(card).toContainText('This share link has expired');
  await expect(card).toContainText(title);
  await expect(page.getByTestId('viewer-brand')).toBeVisible();
});
