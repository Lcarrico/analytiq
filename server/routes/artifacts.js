/**
 * artifacts.js — saved dashboard artifacts, chart data, shares
 */
const express = require('express');
const { db }  = require('../db');
const { computeKPIs } = require('../services/chartData');
const router  = express.Router();

// GET /api/artifacts
router.get('/', (_req, res) => {
  const rows = db.prepare(`
    SELECT a.*, COUNT(s.id) as share_count
    FROM artifacts a
    LEFT JOIN artifact_shares s ON s.artifact_id = a.id
    GROUP BY a.id
    ORDER BY a.created_at DESC
  `).all();
  res.json(rows);
});

// GET /api/artifacts/:id
router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM artifacts WHERE id=?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
});

// POST /api/artifacts
router.post('/', (req, res) => {
  const {
    title, type = 'Predictive', mape, owner = 'analyst@acme.com',
    dq_status = 'pass', pipeline_run_id,
  } = req.body;

  if (!title) return res.status(400).json({ error: 'title required' });

  const result = db.prepare(`
    INSERT INTO artifacts (title, type, mape, owner, dq_status, pipeline_run_id)
    VALUES (?,?,?,?,?,?)
  `).run(title, type, mape || null, owner, dq_status, pipeline_run_id || null);

  const art = db.prepare('SELECT * FROM artifacts WHERE id=?').get(result.lastInsertRowid);
  res.status(201).json(art);
});

// GET /api/artifacts/:id/chart
router.get('/:id/chart', (req, res) => {
  const art = db.prepare('SELECT * FROM artifacts WHERE id=?').get(req.params.id);
  if (!art) return res.status(404).json({ error: 'Not found' });

  if (!art.pipeline_run_id) {
    // Return empty chart for non-predictive artifacts
    return res.json({ rows: [], kpis: { avgActual: 0, mape: 0, forecast14Avg: 0 } });
  }

  const rows = db.prepare(`
    SELECT * FROM chart_data WHERE pipeline_run_id=? ORDER BY day_index ASC
  `).all(art.pipeline_run_id);

  const kpis = computeKPIs(rows);
  res.json({ rows, kpis });
});

// GET /api/artifacts/:id/shares
router.get('/:id/shares', (req, res) => {
  const rows = db.prepare(`
    SELECT * FROM artifact_shares WHERE artifact_id=? ORDER BY shared_at DESC
  `).all(req.params.id);
  res.json(rows);
});

// POST /api/artifacts/:id/shares
router.post('/:id/shares', (req, res) => {
  const { email, role = 'Viewer' } = req.body;
  if (!email) return res.status(400).json({ error: 'email required' });

  const art = db.prepare('SELECT id FROM artifacts WHERE id=?').get(req.params.id);
  if (!art) return res.status(404).json({ error: 'Artifact not found' });

  const result = db.prepare(`
    INSERT INTO artifact_shares (artifact_id, email, role) VALUES (?,?,?)
  `).run(req.params.id, email, role);

  const share = db.prepare('SELECT * FROM artifact_shares WHERE id=?').get(result.lastInsertRowid);
  res.status(201).json(share);
});

// DELETE /api/artifacts/:id/shares/:shareId
router.delete('/:id/shares/:shareId', (req, res) => {
  db.prepare('DELETE FROM artifact_shares WHERE id=? AND artifact_id=?').run(req.params.shareId, req.params.id);
  res.status(204).end();
});

// DELETE /api/artifacts/:id
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM artifact_shares WHERE artifact_id=?').run(req.params.id);
  db.prepare('DELETE FROM artifacts WHERE id=?').run(req.params.id);
  res.status(204).end();
});

module.exports = router;
