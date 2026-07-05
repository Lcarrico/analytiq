// R30S3E8-US1 (UI) — forbidden-vocabulary gate (PRD §5.1). Source-level:
// kill-strings may not appear in any client/src string literal or JSX text
// (comments are stripped — they are not user-visible). The allowed-until
// ledger lists the leaks that legitimately remain, each owned by the story
// that retires its surface; the assertion is EXACT EQUALITY in both
// directions, so a fixed leak with a stale ledger entry also fails.
// DOM-level absences per surface are owned by the per-story specs
// (r30s1_detail, r30s2_canvas, r30s3_contracts, r30s3_pipeline).
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const REPO = process.env.BOOT_PY
  ? path.dirname(path.dirname(path.dirname(path.resolve(process.env.BOOT_PY))))
  : process.cwd();

const KILL = ['PBKDF2', 'Agent memory', 'CENTERPIECE', 'gate:PASS', '(§', 'Deep search'];

// file → [kill-string, owning story that retires it]
const ALLOWED_UNTIL = {
  // S11 pruned 2026-07-05 — R31S1E1 shipped the standalone auth and stripped
  // the settings screen
  'screens/S12_Platform.jsx': [['(§', 'R36S2E4']],   // retires with admin security screens
};

const stripComments = (src) => src
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^\s*\/\/.*$/gm, '')
  .replace(/([^:'"])\/\/(?![^'"\n]*['"`]).*$/gm, '$1');

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(d => {
    const p = path.join(dir, d.name);
    if (d.isDirectory()) return walk(p);
    return /\.(jsx|js)$/.test(d.name) ? [p] : [];
  });
}

test('§5.1 kill-list: detected leaks exactly equal the allowed-until ledger', async () => {
  const root = path.join(REPO, 'client', 'src');
  const found = [];
  for (const file of walk(root)) {
    const relFile = path.relative(root, file).replace(/\\/g, '/');
    const clean = stripComments(fs.readFileSync(file, 'utf8'));
    for (const k of KILL) {
      if (clean.includes(k)) found.push(`${relFile} :: ${k}`);
    }
  }
  const allowed = Object.entries(ALLOWED_UNTIL)
    .flatMap(([f, list]) => list.map(([k]) => `${f} :: ${k}`));
  expect(found.sort(), 'leak set drifted from the allowed-until ledger — either a new '
    + 'leak landed, or a fixed leak left a stale ledger entry (prune it and cite the story)')
    .toEqual(allowed.sort());
});
