// Mirrors every UI suite run to tests/logs/ui_<scope>_<timestamp>.log
// (same convention as the backend conftest logging hook).
import fs from 'node:fs';
import path from 'node:path';

export default class LogReporter {
  onBegin(config, suite) {
    const ts = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
    const files = new Set(suite.allTests().map(t => path.basename(t.location.file)));
    const scope = files.size === 1
      ? [...files][0].replace(/\.spec\.(js|mjs|ts)$/, '')
      : 'regression';
    const dir = path.resolve('tests/logs');
    fs.mkdirSync(dir, { recursive: true });
    this.file = path.join(dir, `ui_${scope}_${ts}.log`);
    this.lines = [`UI suite start ${new Date().toISOString()} — ${suite.allTests().length} tests`];
  }
  onTestEnd(test, result) {
    this.lines.push(`${result.status.toUpperCase().padEnd(8)} ${test.title} (${result.duration}ms)`);
    for (const err of result.errors || []) {
      this.lines.push(`  ERROR: ${(err.message || '').split('\n').slice(0, 6).join('\n  ')}`);
    }
  }
  onEnd(result) {
    this.lines.push(`UI suite ${result.status} ${new Date().toISOString()}`);
    fs.writeFileSync(this.file, this.lines.join('\n') + '\n');
    console.log(`\n[log-reporter] wrote ${this.file}`);
  }
}
