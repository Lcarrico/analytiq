/**
 * tables.js — cataloged tables for a governance run
 */
const express = require('express');
const { db }  = require('../db');
const router  = express.Router();

// GET /api/tables/:runId
router.get('/:runId', (req, res) => {
  const rows = db.prepare('SELECT * FROM cataloged_tables WHERE run_id=? ORDER BY health_score DESC').all(req.params.runId);
  res.json(rows);
});

module.exports = router;
