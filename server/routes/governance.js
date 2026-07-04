/**
 * governance.js
 * POST /api/governance/run   → start a new governance run
 * GET  /api/governance/:id   → get run state
 * GET  /api/governance/stream/:id → SSE progress stream
 */
const express = require('express');
const { db }  = require('../db');
const router  = express.Router();

// In-memory SSE client registry: runId → Set<res>
const clients = new Map();

function send(runId, data) {
  const set = clients.get(String(runId));
  if (!set) return;
  const msg = `data: ${JSON.stringify(data)}\n\n`;
  for (const res of set) {
    try { res.write(msg); } catch (_) {}
  }
}

// ── Seed tables & definitions for a new governance run ──
const TABLES_SEED = [
  { name:'fact_revenue',   schema_name:'CORE',    health_score:98, freshness:'2h ago',  row_count:'4.2M',  pk:'pass',nul:'pass',frs:'pass',pii:'pass',rmin:'pass',ml:1 },
  { name:'dim_location',   schema_name:'CORE',    health_score:94, freshness:'6h ago',  row_count:'12.8K', pk:'pass',nul:'pass',frs:'pass',pii:'pass',rmin:'pass',ml:1 },
  { name:'fact_sessions',  schema_name:'CORE',    health_score:87, freshness:'1h ago',  row_count:'2.1M',  pk:'pass',nul:'warn',frs:'pass',pii:'pass',rmin:'pass',ml:1 },
  { name:'dim_customer',   schema_name:'CORE',    health_score:71, freshness:'3d ago',  row_count:'84.2K', pk:'pass',nul:'warn',frs:'warn',pii:'flag',rmin:'pass',ml:0 },
  { name:'staging_events', schema_name:'STAGING', health_score:90, freshness:'30m ago', row_count:'890K',  pk:'warn',nul:'pass',frs:'pass',pii:'pass',rmin:'pass',ml:1 },
  { name:'raw_clickstream',schema_name:'RAW',     health_score:44, freshness:'12d ago', row_count:'124',   pk:'fail',nul:'warn',frs:'fail',pii:'pass',rmin:'fail',ml:0 },
];

const DEFS_SEED = [
  { type:'Metric',    name:'Net Revenue',         def:'Total revenue after refunds and discounts, aggregated daily per location.',   conf:0.71, explore:'Revenue'         },
  { type:'Metric',    name:'Conversion Rate',      def:'Percentage of sessions that resulted in at least one purchase.',              conf:0.64, explore:'Revenue'         },
  { type:'Dimension', name:'Location Tier',        def:'Operational tier classification assigned to a physical location.',            conf:0.68, explore:'Location Perf.'  },
  { type:'Metric',    name:'Avg Session Duration', def:'Mean time in seconds a user spent in an active session.',                    conf:0.59, explore:'Engagement'      },
  { type:'Dimension', name:'Customer Segment',     def:'Behavioral segment label assigned to a customer by the ML pipeline.',        conf:0.73, explore:'Customer'        },
];

const STEP_DELAYS = [2000, 3000, 4000, 2500]; // ms per step

function simulateGovernance(runId) {
  let step = 0;

  function advance() {
    if (step >= 4) {
      // Mark complete
      db.prepare(`UPDATE governance_runs SET status='done', current_step=4, completed_at=datetime('now') WHERE id=?`).run(runId);

      // Insert tables & definitions
      const insT = db.prepare(`
        INSERT INTO cataloged_tables (run_id, name, schema_name, health_score, freshness, row_count, pk_gate, null_gate, freshness_gate, pii_gate, row_min_gate, ml_ready)
        VALUES (@run_id,@name,@schema_name,@health_score,@freshness,@row_count,@pk,@nul,@frs,@pii,@rmin,@ml)
      `);
      const insD = db.prepare(`
        INSERT INTO semantic_definitions (run_id, type, name, definition, confidence, explore, status)
        VALUES (?,?,?,?,?,?,?)
      `);
      db.transaction(() => {
        for (const t of TABLES_SEED) insT.run({ run_id: runId, ...t });
        for (const d of DEFS_SEED)   insD.run(runId, d.type, d.name, d.def, d.conf, d.explore, 'pending');
      })();

      db.prepare(`UPDATE governance_runs SET tables_count=47, definitions_count=183, low_confidence_count=12 WHERE id=?`).run(runId);

      send(runId, { step: 4, status: 'done' });

      // Close all SSE connections after a short delay
      setTimeout(() => {
        const set = clients.get(String(runId));
        if (set) { for (const r of set) { try { r.end(); } catch (_) {} } }
        clients.delete(String(runId));
      }, 500);
      return;
    }

    step++;
    db.prepare('UPDATE governance_runs SET current_step=?, status=? WHERE id=?').run(step, 'running', runId);
    send(runId, { step, status: 'running' });

    setTimeout(advance, STEP_DELAYS[step - 1] || 2000);
  }

  // Kick off first step
  setTimeout(advance, 800);
}

// ── POST /api/governance/run ────────────────────────────
router.post('/run', (req, res) => {
  const { connectionId } = req.body;
  if (!connectionId) return res.status(400).json({ error: 'connectionId required' });

  const conn = db.prepare('SELECT id FROM connections WHERE id=?').get(connectionId);
  if (!conn) return res.status(404).json({ error: 'Connection not found' });

  const result = db.prepare(`
    INSERT INTO governance_runs (connection_id, status, current_step) VALUES (?,?,?)
  `).run(connectionId, 'running', 0);

  const runId = result.lastInsertRowid;

  // Start background simulation
  simulateGovernance(runId);

  res.status(201).json({ runId });
});

// ── GET /api/governance/stream/:id (SSE) ───────────────
router.get('/stream/:id', (req, res) => {
  const runId = req.params.id;

  // SSE headers
  res.setHeader('Content-Type',  'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection',    'keep-alive');
  res.flushHeaders();

  // Register client
  if (!clients.has(String(runId))) clients.set(String(runId), new Set());
  clients.get(String(runId)).add(res);

  // Send current state immediately
  const run = db.prepare('SELECT * FROM governance_runs WHERE id=?').get(runId);
  if (run) res.write(`data: ${JSON.stringify({ step: run.current_step, status: run.status })}\n\n`);

  // If already done, close
  if (run?.status === 'done') {
    setTimeout(() => { try { res.end(); } catch (_) {} }, 200);
    return;
  }

  // Heartbeat
  const hb = setInterval(() => { try { res.write(':ping\n\n'); } catch (_) {} }, 15000);

  req.on('close', () => {
    clearInterval(hb);
    const set = clients.get(String(runId));
    if (set) set.delete(res);
  });
});

// ── GET /api/governance/:id ─────────────────────────────
router.get('/:id', (req, res) => {
  const run = db.prepare('SELECT * FROM governance_runs WHERE id=?').get(req.params.id);
  if (!run) return res.status(404).json({ error: 'Not found' });
  res.json(run);
});

module.exports = router;
