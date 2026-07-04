// NOTE (R15S1E2): wizard sidebar replaced by the PRD shell — nav selectors updated.
// R11S2E3-US1 (UI) — the replay drawer steps through the run's nodes,
// showing cached provenance and gate results.
import { test, expect } from '@playwright/test';

test('replay drawer steps through DAG nodes with cache citations', async ({ page, request }) => {
  const sess = await (await request.post('/api/sessions', { data: { metric: 'Net Revenue' } })).json();
  for (let i = 0; i < 2; i++) {                       // second run → cached nodes
    const run = await (await request.post('/api/pipeline/run', { data: { sessionId: sess.id } })).json();
    await expect.poll(async () => (await (await request.get(`/api/pipeline/${run.runId}`)).json()).status,
                      { timeout: 20_000 }).toBe('done');
  }
  const art = await (await request.post(`/api/sessions/${sess.id}/save_artifact`,
    { data: { title: `Replay UI ${Date.now()}` } })).json();

  await page.goto('/app');   // R23: '/' is the marketing landing
  await page.getByTestId('app-sidebar').getByRole('link', { name: 'Artifacts', exact: true }).click();
  const row = page.locator(`[data-testid="artifact-row-${art.id}"]`);
  await expect(row).toBeVisible();
  await row.getByTestId('replay-btn').click();

  const drawer = page.getByTestId('replay-drawer');
  await expect(drawer).toBeVisible();
  for (const key of ['ingest_profile', 'session_plan', 'gold_build', 'artifact_ready']) {
    await expect(drawer.locator(`[data-testid="replay-step-${key}"]`)).toBeVisible();
  }
  // R21S1E3-US1: emoji retired app-wide; cached marker is now plain text.
  await expect(drawer.getByText(/cached · from run \d+/).first()).toBeVisible();
  await expect(drawer.getByText(/min_training_rows:PASS/).first()).toBeVisible();
});
