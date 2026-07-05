// R30S1E1-US1 (UI) — UI Parity & Build-Out Program: pricing DATA hotfix.
// PRD ch02 "Data/content errors" table is the contract: the four plan cards
// must state the mockup's facts (seats/sources/tokens/features) exactly.
// Restyle (layout/toggle/compare/FAQ) is R34S1E4 — this spec is that story's
// data-regression lock and must stay green through the restyle.
import { test, expect } from '@playwright/test';

const CARDS = {
  starter: {
    price: '$0',
    included: ['3 seats · 1 source', '100K tokens', '5 artifacts'],
    excluded: ['Predictive models', 'Public share links'],
  },
  team: {
    price: '$149',
    included: ['10 seats · 3 sources', '500K tokens/mo', 'Unlimited artifacts',
               'Predictive models + model cards', 'Public sharing: links only'],
    excluded: [],
  },
  business: {
    price: '$499',
    included: ['2M tokens/mo · overage $8/100K', 'SSO · RLS · full audit log',
               'Signed embeds + public links', 'Priority support'],
    excluded: [],
  },
  enterprise: {
    price: 'Custom',
    included: ['Unlimited seats & sources', 'Custom token pools', 'VPC · private link',
               '99.9% SLA · DPA · SOC 2 reports', 'Dedicated success engineer'],
    excluded: [],
  },
};

// Factually-wrong strings the old cards shipped — none may survive anywhere
// on /pricing (PRD ch02; Reconciliation (f)).
const RETIRED_SUBSTRINGS = ['SIEM streaming', '1M tokens', '5M tokens', 'Audit export'];
const RETIRED_EXACT_ROWS = ['✓ Dashboards', '✓ 1 seat', '✓ 5 seats', '✓ 25 seats', '✓ Unlimited'];

test('pricing plan cards state the ch02 facts exactly', async ({ page }) => {
  await page.goto('/pricing');
  for (const [key, spec] of Object.entries(CARDS)) {
    const card = page.getByTestId(`plan-${key}`);
    await expect(card, `card plan-${key}`).toBeVisible();
    await expect(card.getByText(spec.price, { exact: true })).toBeVisible();
    for (const f of spec.included) {
      await expect(card.getByText(`✓ ${f}`, { exact: true }),
        `plan-${key} included row "${f}"`).toBeVisible();
    }
    for (const f of spec.excluded) {
      const row = card.getByText(`— ${f}`, { exact: true });
      await expect(row, `plan-${key} excluded row "${f}"`).toBeVisible();
      // visually distinct: faint gray, not the body ink used by included rows
      const color = await row.evaluate(el => getComputedStyle(el).color);
      expect(color, `excluded row "${f}" must be faint (#94a3b8)`).toBe('rgb(148, 163, 184)');
    }
  }
});

test('no retired plan-data strings survive on /pricing', async ({ page }) => {
  await page.goto('/pricing');
  await expect(page.getByTestId('plan-starter')).toBeVisible();
  const body = await page.locator('body').innerText();
  for (const s of RETIRED_SUBSTRINGS) {
    expect(body.includes(s), `retired string "${s}" still on /pricing`).toBe(false);
  }
  for (const s of RETIRED_EXACT_ROWS) {
    await expect(page.getByText(s, { exact: true }),
      `retired feature row "${s}"`).toHaveCount(0);
  }
});

test('Marketing.jsx header marker cites R30S1E1', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const REPO = process.env.BOOT_PY
    ? path.dirname(path.dirname(path.dirname(path.resolve(process.env.BOOT_PY))))
    : process.cwd();
  const src = fs.readFileSync(path.join(REPO, 'client', 'src', 'screens', 'Marketing.jsx'), 'utf8');
  expect(src.split('\n')[0]).toContain('R30S1E1');
});
