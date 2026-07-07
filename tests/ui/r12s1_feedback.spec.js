// NOTE (R15S1E2): wizard sidebar replaced by the PRD shell — nav selectors updated.
// R12S1E2-US1 (UI) — acceptance rates per recommendation type are visible
// on the platform screen.
import { test, expect } from '@playwright/test';

test('platform screen shows recommendation acceptance rates', async ({ page, request }) => {
  await request.post('/api/feedback', {
    data: { rec_type: 'benchmark', rec_id: 1, decision: 'accept', category: 'historical' } });
  await request.post('/api/feedback', {
    data: { rec_type: 'benchmark', rec_id: 2, decision: 'dismiss', category: 'historical' } });

  // R36S2E4: sidebar Admin lands on the workspace overview; the platform
  // console (these panels' home) is directly routed — same nav as r13s1.
  await page.goto('/app/admin/platform');
  const panel = page.getByTestId('feedback-panel');
  await expect(panel).toBeVisible();
  const row = panel.getByTestId('fb-benchmark');
  await expect(row).toBeVisible();
  await expect(row.getByText('50%')).toBeVisible();
});
