'use strict';

const express = require('express');
const db      = require('../db');
const { computeStats, computeQuestions } = require('./stats-helpers');

const router = express.Router();

// ── GET /api/stats ─────────────────────────────────────────────────────────────
// Aggregate submission stats. Supports ?gender=all|male|female
router.get('/', (req, res) => {
  res.json(computeStats(req.query));
});

// ── GET /api/stats/questions ───────────────────────────────────────────────────
// Per-question answer distribution. Supports ?gender=all|male|female
router.get('/questions', (req, res) => {
  res.json(computeQuestions(req.query));
});

// ── GET /api/stats/export ──────────────────────────────────────────────────────
// CSV download of all submissions. Raw answers array is intentionally omitted
// to keep the export lightweight; axis scores and party IDs tell the story.
router.get('/export', (_req, res) => {
  const rows = db.prepare('SELECT * FROM submissions ORDER BY created_at DESC').all();

  const header = [
    'id', 'created_at', 'survey_version', 'is_female', 'language',
    'score_first', 'score_second', 'score_third', 'score_fourth',
    'party_first', 'party_second', 'party_third', 'party_fourth'
  ].join(',');

  const csvRows = [header];

  for (const row of rows) {
    let scores, parties;
    try {
      scores  = JSON.parse(row.axis_scores);
      parties = JSON.parse(row.recommended_parties);
    } catch { continue; }

    csvRows.push([
      JSON.stringify(row.id),
      JSON.stringify(row.created_at),
      JSON.stringify(row.survey_version),
      row.is_female ? 1 : 0,
      JSON.stringify(row.language || 'he'),
      scores[0], scores[1], scores[2], scores[3],
      JSON.stringify(parties[0]),
      JSON.stringify(parties[1]),
      JSON.stringify(parties[2]),
      JSON.stringify(parties[3])
    ].join(','));
  }

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="submissions.csv"');
  res.send(csvRows.join('\n'));
});

module.exports = router;
