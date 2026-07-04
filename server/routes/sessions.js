/**
 * sessions.js — analysis sessions
 */
const express = require('express');
const { db }  = require('../db');
const router  = express.Router();

// GET /api/sessions/:id
router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM sessions WHERE id=?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
});

// POST /api/sessions
router.post('/', (req, res) => {
  const {
    connectionId, runId, metric = 'Net Revenue', grain = 'Location · Day',
    horizon = 14, training_start = '2023-01-01', training_end = '2023-12-31',
  } = req.body;

  if (!metric) return res.status(400).json({ error: 'metric is required' });

  const result = db.prepare(`
    INSERT INTO sessions (connection_id, run_id, metric, grain, horizon, training_start, training_end, status)
    VALUES (?,?,?,?,?,?,?,?)
  `).run(connectionId || null, runId || null, metric, grain, horizon, training_start, training_end, 'pending');

  const session = db.prepare('SELECT * FROM sessions WHERE id=?').get(result.lastInsertRowid);
  res.status(201).json(session);
});

// PATCH /api/sessions/:id
router.patch('/:id', (req, res) => {
  const { status } = req.body;
  db.prepare('UPDATE sessions SET status=? WHERE id=?').run(status, req.params.id);
  res.json(db.prepare('SELECT * FROM sessions WHERE id=?').get(req.params.id));
});

module.exports = router;
