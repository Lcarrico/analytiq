// NOTE (R15S1E2): wizard sidebar replaced by the PRD shell — nav selectors updated.
// R8S2E3-US1 (UI) — execution DAG surfaced on the artifact provenance panel;
// a re-run of the same spec shows cached node badges (lineage = execution).
import { test, expect } from '@playwright/test';

async function runSession(request, sid) {
  const run = await (await request.post('/api/pipeline/run', { data: { sessionId: sid } })).json();
  await expect.poll(async () => (await (await request.get(`/api/pipeline/${run.runId}`)).json()).status,
                    { timeout: 20_000 }).toBe('done');
  return run.runId;
}

test('provenance panel renders execution DAG; re-run shows cached badges', async ({ page, request }) => {
  const sess = await (await request.post('/api/sessions', { data: { metric: 'Net Revenue' } })).json();
  await runSession(request, sess.id);
  await runSession(request, sess.id);          // second run → cached nodes
  const art = await (await request.post(`/api/sessions/${sess.id}/save_artifact`,
    { data: { title: `DAG UI ${Date.now()}` } })).json();

  await page.goto('/app');   // R23: '/' is the marketing landing
  await page.getByTestId('app-sidebar').getByRole('link', { name: 'Artifacts', exact: true }).click();
  const row = page.locator(`[data-testid="artifact-row-${art.id}"]`);
  await expect(row).toBeVisible();
  await row.getByTestId('provenance-btn').click();

  const dagPanel = page.getByTestId('dag-panel');
  await expect(dagPanel).toBeVisible();
  for (const key of ['ingest_profile', 'session_plan', 'gold_build',
                     'model_train', 'walk_forward', 'artifact_ready']) {
    await expect(dagPanel.locator(`[data-testid="dag-node-${key}"]`)).toBeVisible();
  }
  await expect(dagPanel.locator('[data-testid="dag-node-cached"]').first()).toBeVisible();
});
