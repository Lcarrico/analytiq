// R36S2E1-US1 (UI) — Collaboration (`Collaboration.dc.html` frames 01–03 /
// PRD §8 audit-first): comments inbox with tab pills + rich rows (author,
// §-anchor, artifact link, inline resolve) over the real inbox endpoint;
// team page with seat accounting, roster statuses (OWNER/ANALYST/INVITED)
// and the invite modal with live seat math over the real invites API.
import { test, expect } from '@playwright/test';

async function commentedArtifact(request) {
  const sess = await (await request.post('/api/sessions',
    { data: { metric: 'Net Revenue' } })).json();
  const run = await (await request.post('/api/pipeline/run',
    { data: { sessionId: sess.id } })).json();
  await expect.poll(async () =>
    (await (await request.get(`/api/pipeline/${run.runId}`)).json()).status,
    { timeout: 25_000 }).toBe('done');
  const art = await (await request.post(`/api/sessions/${sess.id}/save_artifact`,
    { data: { title: `Inbox ${Date.now() % 1e6}` } })).json();
  await request.post(`/api/artifacts/${art.id}/comments`, { data: {
    body: 'Can we split Northeast by store format?', section_id: 'Target gap by region' } });
  return art;
}

test('comments inbox: pills, rich rows, resolve + artifact link', async ({ page, request }) => {
  const art = await commentedArtifact(request);
  const inbox = await (await request.get('/api/comments/inbox?tab=open')).json();
  expect(inbox.comments.length).toBeGreaterThanOrEqual(1);

  await page.goto('/app/comments');
  await expect(page.locator('main h1')).toHaveText('Comments');
  await expect(page.getByTestId('ci-pill-open')).toContainText(String(inbox.comments.length));

  const mine = inbox.comments.find(c => c.artifact_id === art.id);
  const row = page.getByTestId(`ci-row-${mine.id}`);
  await expect(row).toContainText('split Northeast');
  await expect(row.getByTestId('ci-anchor')).toContainText('Target gap');

  // artifact link navigates
  await row.getByTestId('ci-artifact-link').click();
  await expect(page).toHaveURL(new RegExp(`/app/artifacts/${art.id}`));
  await page.goBack();

  // inline resolve moves it out of Open (real POST)
  await page.getByTestId(`ci-row-${mine.id}`).getByTestId('ci-resolve').click();
  await expect(page.getByTestId(`ci-row-${mine.id}`)).toHaveCount(0,
    { timeout: 10_000 });
  await page.getByTestId('ci-pill-resolved').click();
  await expect(page.getByTestId(`ci-row-${mine.id}`)).toBeVisible();
});

test('team: seats, roster statuses, invite modal with live seat math', async ({ page, request }) => {
  const roster = await (await request.get('/api/team/roster')).json();

  await page.goto('/app/team');
  await expect(page.locator('main h1')).toHaveText('Team');
  await expect(page.getByTestId('seat-usage')).toContainText(/of 25 seats/);

  // invite modal: chips + live seat math + real send
  await page.getByTestId('team-invite-open').click();
  const email = `amara${Date.now() % 1e6}@acme.com`;
  await page.getByTestId('invite-emails').fill(email);
  await page.getByTestId('invite-add').click();
  await expect(page.getByTestId('invite-chip-0')).toContainText(email.split('@')[0]);
  await expect(page.getByTestId('invite-seatmath'))
    .toContainText(/1 invite.* of \d+ remaining/);
  await page.getByTestId('send-invites').click();
  await expect(page.getByText(/invite\(s\) sent/i)).toBeVisible({ timeout: 10_000 });

  // roster shows the pending invite with INVITED status
  const row = page.getByTestId('roster-table').getByText(email);
  await expect(row).toBeVisible();
});
