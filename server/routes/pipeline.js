/**
 * pipeline.js
 * POST /api/pipeline/run          → start pipeline
 * GET  /api/pipeline/:id          → get run state
 * GET  /api/pipeline/stream/:id   → SSE progress
 */
const express  = require('express');
const { db }   = require('../db');
const { generateChartData } = require('../services/chartData');
const router   = express.Router();

// SSE registry
const clients = new Map();

function send(runId, data) {
  const set = clients.get(String(runId));
  if (!set) return;
  const msg = `data: ${JSON.stringify(data)}\n\n`;
  for (const res of set) { try { res.write(msg); } catch (_) {} }
}

const LOG_LINES = [
  { step:1, line:'[INFO] Gold table: fact_revenue × dim_location · grain=location_day' },
  { step:1, line:'[INFO] 12,847 rows · 34 features · time-based split verified' },
  { step:1, line:'[DQ]  PK uniqueness: ✓ PASS' },
  { step:1, line:'[DQ]  Key null rate < 5%: ✓ PASS (max 1.2%)' },
  { step:1, line:'[INFO] Leakage scan: clean (no future-date features)' },
  { step:2, line:'[INFO] XGBoost training started · n_estimators=500 · max_depth=6' },
  { step:2, line:'[INFO] Train split: 8,993 rows (Jan–Sep 2023)' },
  { step:2, line:'[INFO] Val split:   1,927 rows (Oct 2023)' },
  { step:2, line:'[INFO] Test split:  1,927 rows (Nov–Dec 2023)' },
  { step:3, line:'[INFO] Fold 1/5 → MAPE 7.4%' },
  { step:3, line:'[INFO] Fold 2/5 → MAPE 8.1%' },
  { step:3, line:'[INFO] Fold 3/5 → MAPE 9.8%' },
  { step:3, line:'[INFO] Fold 4/5 → MAPE 8.3%' },
  { step:3, line:'[INFO] Fold 5/5 → MAPE 7.9%' },
  { step:3, line:'[INFO] Validation MAPE 8.9% < 15.0% threshold: ✓ PASS' },
  { step:3, line:'[INFO] Overfit check: test 9.1% ≤ val 8.9% × 1.2: ✓ PASS' },
  { step:4, line:'[INFO] Writing 12,847 predictions → gold.net_revenue_preds_v1' },
  { step:4, line:'[DQ]  Distribution gate: ✓ PASS (KS p=0.42)' },
  { step:4, line:'[INFO] Generating self-contained dashboard artifact...' },
  { step:4, line:'[DONE] Pipeline complete · 3m 41s · model_id=xgb-locrev-v1' },
];

const STEP_DELAYS = [3000, 5000, 4500, 2500]; // ms

function simulatePipeline(runId) {
  let step = 0;
  const allLog = [];

  function sendLogsForStep(s, cb) {
    const lines = LOG_LINES.filter(l => l.step === s);
    let i = 0;
    function next() {
      if (i >= lines.length) { cb(); return; }
      allLog.push(lines[i].line);
      db.prepare('UPDATE pipeline_runs SET log_entries=? WHERE id=?').run(JSON.stringify(allLog), runId);
      send(runId, { step: s, status: 'running', log: allLog });
      i++;
      setTimeout(next, 280);
    }
    next();
  }

  function advance() {
    if (step >= 4) {
      // Generate and store chart data
      const chartRows = generateChartData(runId);
      const ins = db.prepare(`
        INSERT INTO chart_data (pipeline_run_id, day_index, date, actual, predicted, ci_low, ci_high, is_forecast)
        VALUES (@pipeline_run_id,@day_index,@date,@actual,@predicted,@ci_low,@ci_high,@is_forecast)
      `);
      db.transaction(rows => { for (const r of rows) ins.run(r); })(chartRows);

      db.prepare(`UPDATE pipeline_runs SET status='done', current_step=4, mape=8.9, features_count=34, rows_count=12847, completed_at=datetime('now') WHERE id=?`).run(runId);
      db.prepare('UPDATE pipeline_runs SET log_entries=? WHERE id=?').run(JSON.stringify(allLog), runId);

      send(runId, { step: 4, status: 'done', log: allLog });

      setTimeout(() => {
        const set = clients.get(String(runId));
        if (set) { for (const r of set) { try { r.end(); } catch (_) {} } }
        clients.delete(String(runId));
      }, 500);
      return;
    }

    step++;
    db.prepare('UPDATE pipeline_runs SET current_step=?, status=? WHERE id=?').run(step, 'running', runId);

    sendLogsForStep(step, () => {
      setTimeout(advance, STEP_DELAYS[step - 1] || 2000);
    });
  }

  setTimeout(advance, 600);
}

// ── POST /api/pipeline/run ──────────────────────────────
router.post('/run', (req, res) => {
  const { sessionId } = req.body;
  if (!sessionId) return res.status(400).json({ error: 'sessionId required' });

  const sess = db.prepare('SELECT id FROM sessions WHERE id=?').get(sessionId);
  if (!sess) return res.status(404).json({ error: 'Session not found' });

  // Update session status
  db.prepare("UPDATE sessions SET status='running' WHERE id=?").run(sessionId);

  const result = db.prepare(`
    INSERT INTO pipeline_runs (session_id, status, current_step, log_entries)
    VALUES (?,?,?,?)
  `).run(sessionId, 'running', 0, '[]');

  const runId = result.lastInsertRowid;
  simulatePipeline(runId);

  res.status(201).json({ runId });
});

// ── GET /api/pipeline/stream/:id (SSE) ─────────────────
router.get('/stream/:id', (req, res) => {
  const runId = req.params.id;

  res.setHeader('Content-Type',  'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection',    'keep-alive');
  res.flushHeaders();

  if (!clients.has(String(runId))) clients.set(String(runId), new Set());
  clients.get(String(runId)).add(res);

  // Send current state immediately
  const run = db.prepare('SELECT * FROM pipeline_runs WHERE id=?').get(runId);
  if (run) {
    const log = JSON.parse(run.log_entries || '[]');
    res.write(`data: ${JSON.stringify({ step: run.current_step, status: run.status, log })}\n\n`);
  }

  if (run?.status === 'done') {
    setTimeout(() => { try { res.end(); } catch (_) {} }, 200);
    return;
  }

  const hb = setInterval(() => { try { res.write(':ping\n\n'); } catch (_) {} }, 15000);
  req.on('close', () => {
    clearInterval(hb);
    const set = clients.get(String(runId));
    if (set) set.delete(res);
  });
});

// ── GET /api/pipeline/:id ───────────────────────────────
router.get('/:id', (req, res) => {
  const run = db.prepare('SELECT * FROM pipeline_runs WHERE id=?').get(req.params.id);
  if (!run) return res.status(404).json({ error: 'Not found' });
  res.json({ ...run, log_entries: JSON.parse(run.log_entries || '[]') });
});

module.exports = router;
