/**
 * semantic.js — semantic layer definitions
 */
const express = require('express');
const { db }  = require('../db');
const router  = express.Router();

// GET /api/semantic/:runId
router.get('/:runId', (req, res) => {
  const rows = db.prepare('SELECT * FROM semantic_definitions WHERE run_id=? ORDER BY confidence ASC').all(req.params.runId);
  res.json(rows);
});

// PATCH /api/semantic/:id  { status, definition }
router.patch('/:id', (req, res) => {
  const { status, definition } = req.body;
  const def = db.prepare('SELECT * FROM semantic_definitions WHERE id=?').get(req.params.id);
  if (!def) return res.status(404).json({ error: 'Not found' });

  const updates = [];
  const values  = [];

  if (status) { updates.push('status=?'); values.push(status); }
  if (definition !== undefined) {
    updates.push('definition=?');
    updates.push('confidence=?');
    values.push(definition, 0.96); // manual edits bump confidence
  }

  if (!updates.length) return res.status(400).json({ error: 'Nothing to update' });

  values.push(req.params.id);
  db.prepare(`UPDATE semantic_definitions SET ${updates.join(',')} WHERE id=?`).run(...values);

  const updated = db.prepare('SELECT * FROM semantic_definitions WHERE id=?').get(req.params.id);
  res.json(updated);
});

module.exports = router;
