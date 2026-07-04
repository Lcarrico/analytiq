// NOTE (R15S1E2): wizard sidebar replaced by the PRD shell — nav selectors updated.
// R8S1E1-US1 (UI) — artifact provenance panel backed by the Unified Artifact
// Store. Drives the same session→pipeline→save flow the app uses, then
// asserts the user-visible provenance chain on the All Artifacts screen.
import { test, expect } from '@playwright/test';

async function makeArtifact(request, title) {
  const sess = await (await request.post('/api/sessions', { data: { metric: 'Net Revenue' } })).json();
  const run = await (await request.post('/api/pipeline/run', { data: { sessionId: sess.id } })).json();
  await expect.poll(async () => {
    const r = await (await request.get(`/api/pipeline/${run.runId}`)).json();
    return r.status;
  }, { timeout: 20_000 }).toBe('done');
  const art = await (await request.post(`/api/sessions/${sess.id}/save_artifact`, { data: { title } })).json();
  return art;
}

test('artifact provenance panel lists the UAS stage chain', async ({ page, request }) => {
  const title = `Provenance UI ${Date.now()}`;
  const art = await makeArtifact(request, title);

  await page.goto('/app');   // R23: '/' is the marketing landing
  await page.getByTestId('app-sidebar').getByRole('link', { name: 'Artifacts', exact: true }).click();
  const row = page.locator(`[data-testid="artifact-row-${art.id}"]`);
  await expect(row).toBeVisible();

  await row.getByTestId('provenance-btn').click();
  const panel = page.getByTestId('uas-provenance');
  await expect(panel).toBeVisible();
  for (const t of ['session_spec', 'dashboard_plan', 'gold_predictions_ref',
                   'gold_forecast_ref', 'artifact_html_ref']) {
    await expect(panel.getByText(t, { exact: false })).toBeVisible();
  }
  // versions are shown alongside types (common-schema surface)
  await expect(panel.getByText(/v\d+/).first()).toBeVisible();
});
