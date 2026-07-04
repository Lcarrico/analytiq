// R18 (UI) — live bell + notifications drawer; team roster + invites + seats.
import { test, expect } from '@playwright/test';

test('mention raises the bell badge; drawer lists it; mark-all clears', async ({ page, request }) => {
  const sess = await (await request.post('/api/sessions', { data: { metric: 'Net Revenue' } })).json();
  const run = await (await request.post('/api/pipeline/run', { data: { sessionId: sess.id } })).json();
  await expect.poll(async () => (await (await request.get(`/api/pipeline/${run.runId}`)).json()).status,
                    { timeout: 20_000 }).toBe('done');
  const art = await (await request.post(`/api/sessions/${sess.id}/save_artifact`,
    { data: { title: `Bell ${Date.now()}` } })).json();
  await request.post(`/api/artifacts/${art.id}/comments`,
    { data: { body: 'Ping @admin@acme.com — check the dip', section_id: 'timeseries_ci' } });

  await page.goto('/app');
  await expect(page.getByTestId('bell-count')).not.toHaveText('0');
  await page.getByTestId('bell').click();
  const drawer = page.getByTestId('notifications-drawer');
  await expect(drawer).toBeVisible();
  await expect(drawer.getByText(/mentioned you/).first()).toBeVisible();
  await drawer.getByTestId('mark-all-read').click();
  await expect(page.getByTestId('bell-count')).toHaveText('0');
});

test('team page invites members and shows seat usage', async ({ page }) => {
  await page.goto('/app/team');
  await expect(page.getByTestId('seat-usage')).toContainText(/of 25 seats/);
  const email = `invitee${Date.now() % 1e6}@acme.com`;
  await page.getByTestId('invite-emails').fill(email);
  await page.getByTestId('send-invites').click();
  await expect(page.getByText('1 invite(s) sent.')).toBeVisible();
  const row = page.getByTestId('roster-table').getByText(email);
  await expect(row).toBeVisible();
});
