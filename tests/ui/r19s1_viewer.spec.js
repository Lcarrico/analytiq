// R19S1E1 (UI) — branded public viewer: slim header, freshness badge,
// iframe'd artifact, no app shell.
import { test, expect } from '@playwright/test';

test('share link opens the branded read-only viewer', async ({ page, request }) => {
  const sess = await (await request.post('/api/sessions', { data: { metric: 'Net Revenue' } })).json();
  const run = await (await request.post('/api/pipeline/run', { data: { sessionId: sess.id } })).json();
  await expect.poll(async () => (await (await request.get(`/api/pipeline/${run.runId}`)).json()).status,
                    { timeout: 20_000 }).toBe('done');
  const title = `Public ${Date.now() % 1e6}`;
  const art = await (await request.post(`/api/sessions/${sess.id}/save_artifact`,
    { data: { title } })).json();
  const link = await (await request.post(`/api/artifacts/${art.id}/share_links`,
    { data: { expires_in_hours: 24 } })).json();
  const token = link.token || link.url.split('/').pop();

  await page.goto(`/share/${token}`);
  const viewer = page.getByTestId('public-viewer');
  await expect(viewer).toBeVisible();
  await expect(page.getByTestId('viewer-title')).toContainText(title);
  await expect(page.getByTestId('freshness-badge')).toContainText(/data \d+h old/i);
  await expect(page.getByTestId('viewer-frame')).toBeVisible();
  await expect(page.getByTestId('app-sidebar')).toHaveCount(0);   // shell-free
});
