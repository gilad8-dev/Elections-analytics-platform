'use strict';

const express        = require('express');
const { v4: uuidv4 } = require('uuid');
const db             = require('../db');

const router = express.Router();

// ── Valid answer indices ───────────────────────────────────────────────────────
// 0=strongly-agree  1=agree  2=neutral  3=disagree  4=strongly-disagree
// -1=not answered (treated as neutral in scoring; kept for fidelity)
const VALID_ANSWERS    = new Set([0, 1, 2, 3, 4, -1]);
const EXPECTED_ANSWERS = 52;
const EXPECTED_AXES    = 4;

const SURVEY_VERSION_RE = /^[\w.\-]{1,30}$/;
const PARTY_ID_RE       = /^[\w\-]{1,60}$/;
const VALID_LANGUAGES   = new Set(['he', 'ar', 'ru']);

function validate(body) {
  const { surveyVersion, answers, axisScores, recommendedParties, isFemale, language } = body;

  if (typeof surveyVersion !== 'string' || !SURVEY_VERSION_RE.test(surveyVersion)) {
    return 'Invalid surveyVersion';
  }
  if (!Array.isArray(answers) || answers.length !== EXPECTED_ANSWERS) {
    return `answers must be an array of ${EXPECTED_ANSWERS} elements`;
  }
  for (const a of answers) {
    if (!Number.isInteger(a) || !VALID_ANSWERS.has(a)) {
      return 'answers contains an invalid value';
    }
  }
  if (!Array.isArray(axisScores) || axisScores.length !== EXPECTED_AXES) {
    return `axisScores must be an array of ${EXPECTED_AXES} numbers`;
  }
  for (const s of axisScores) {
    if (typeof s !== 'number' || !Number.isFinite(s) || s < 0 || s > 100) {
      return 'axisScores values must be finite numbers in [0, 100]';
    }
  }
  if (!Array.isArray(recommendedParties) || recommendedParties.length !== EXPECTED_AXES) {
    return `recommendedParties must be an array of ${EXPECTED_AXES} strings`;
  }
  for (const p of recommendedParties) {
    if (typeof p !== 'string' || !PARTY_ID_RE.test(p)) {
      return 'recommendedParties contains an invalid value';
    }
  }
  if (typeof isFemale !== 'boolean') {
    return 'isFemale must be a boolean';
  }
  if (language !== undefined && !VALID_LANGUAGES.has(language)) {
    return 'Invalid language';
  }
  return null;
}

// ── Prepared statements ────────────────────────────────────────────────────────
const insertSub = db.prepare(`
  INSERT INTO submissions
    (id, created_at, survey_version, answers, axis_scores, recommended_parties, is_female, language)
  VALUES
    (?, ?, ?, ?, ?, ?, ?, ?)
`);

// ── POST /api/submit ───────────────────────────────────────────────────────────
router.post('/', (req, res) => {
  const error = validate(req.body);
  if (error) return res.status(400).json({ error });

  const { surveyVersion, answers, axisScores, recommendedParties, isFemale, language } = req.body;
  const lang = language || 'he';

  try {
    insertSub.run(
      uuidv4(),
      new Date().toISOString().slice(0, 10),
      surveyVersion,
      JSON.stringify(answers),
      JSON.stringify(axisScores),
      JSON.stringify(recommendedParties),
      isFemale ? 1 : 0,
      lang
    );
    res.status(201).json({ ok: true });
  } catch (err) {
    console.error('[submit] DB error:', err.message);
    res.status(500).json({ error: 'Failed to save submission' });
  }
});

module.exports = router;
