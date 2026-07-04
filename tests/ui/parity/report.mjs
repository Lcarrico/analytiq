// PAR-1 — turn Playwright JSON results for parity.spec.js into the
// design-parity scoreboard (docs/specs/parity/PARITY_REPORT.md).
import fs from 'node:fs';

const files = process.argv.slice(2);
const frames = new Map(); // title → {tests: [{kind, ok, missing[]}]}

for (const f of files) {
  const data = JSON.parse(fs.readFileSync(f, 'utf8'));
  const walk = suite => {
    for (const s of suite.suites || []) walk(s);
    for (const spec of suite.specs || []) {
      const frame = suite.title?.includes('›') ? suite.title : spec.titlePath?.[0] || suite.title;
      const key = suite.title || 'unknown';
      if (!frames.has(key)) frames.set(key, []);
      const missing = [];
      let ok = true, skipped = false;
      for (const t of spec.tests || []) {
        for (const r of t.results || []) {
          if (r.status === 'skipped') skipped = true;
          if (r.status !== 'passed') ok = false;
          for (const e of r.errors || []) {
            const msg = (e.message || '').replace(/\u001b\[[\d;]*m/g, '');
            const m = msg.match(/(missing component: "[^"]*"|missing tab: [^\n]+|link source missing: "[^"]*" \u2192 \S+|flow broken: "[^"]*"[^\n]*|route \S+ should not 404)/);
            if (m) missing.push(m[1].trim());
          }
        }
      }
      frames.get(key).push({ name: spec.title, ok, skipped, missing });
    }
  };
  for (const s of data.suites || []) walk(s);
}

let full = 0, partial = 0, absent = 0, ctx = 0;
const lines = [];
for (const [frame, tests] of frames) {
  if (tests.every(t => t.skipped)) { ctx++; lines.push(`| ${frame} | ◌ context frame | story-spec coverage |`); continue; }
  const miss = tests.flatMap(t => t.missing);
  const allOk = tests.every(t => t.ok);
  if (allOk) { full++; lines.push(`| ${frame} | ✅ full parity | — |`); }
  else if (miss.length && miss.length <= (tests.find(t => t.name.startsWith('components'))?.missing.length ?? 0) && miss.length < 500) {
    const n = miss.length;
    const state = miss.some(m => m.includes('404')) ? '❌ route missing' : `🟡 ${n} gaps`;
    if (state.startsWith('❌')) absent++; else partial++;
    lines.push(`| ${frame} | ${state} | ${miss.slice(0, 6).map(m => m.replace(/\|/g, '·')).join('; ').slice(0, 160)}${n > 6 ? ` … +${n - 6}` : ''} |`);
  } else {
    partial++;
    lines.push(`| ${frame} | 🟡 gaps | ${miss.slice(0, 6).join('; ').slice(0, 160)} |`);
  }
}

console.log(`# Design-Parity Scoreboard

Generated from \`tests/ui/parity/parity.spec.js\` (inventory extracted from
\`docs/specs/mockups\` — 95 frames). This is the live gap tracker for the
R21–R29 program: a frame flips ✅ when its story lands.

**${full} full parity · ${partial} partial · ${absent} route missing · ${ctx} context frames** (of ${frames.size})

| Frame | State | First gaps |
|---|---|---|
${lines.join('\n')}
`);
