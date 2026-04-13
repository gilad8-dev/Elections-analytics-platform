'use strict';

/**
 * seed.js — Populate data/survey.db with realistic demo submissions.
 *
 * Usage:
 *   node server/seed.js          # seed 500 rows (exits if DB already has data)
 *   node server/seed.js --force  # re-seed even if rows already exist
 *
 * The generated data is entirely synthetic. Axis scores follow a Gaussian
 * distribution around realistic centre-of-spectrum values; party assignments
 * are derived by picking the closest party per axis.
 */

const db             = require('./db');
const { v4: uuidv4 } = require('uuid');

const PARTY_IDS = [
  'party-a', 'party-b', 'party-c', 'party-d', 'party-e',
  'party-f', 'party-g', 'party-h', 'party-i', 'party-j'
];

// Approximate ideology positions for each party on each axis (0–100).
// These mirror the structure in js/parties.js (10 parties × 4 axes).
// Spread across the spectrum so party distributions look realistic.
const PARTY_SCORES = {
  'party-a': [20, 25, 30, 40],
  'party-b': [35, 40, 45, 55],
  'party-c': [50, 50, 50, 50],
  'party-d': [65, 60, 55, 45],
  'party-e': [80, 75, 70, 35],
  'party-f': [25, 65, 35, 70],
  'party-g': [55, 30, 65, 80],
  'party-h': [45, 80, 25, 60],
  'party-i': [70, 45, 80, 25],
  'party-j': [40, 55, 60, 65]
};

const LANGUAGES  = ['he', 'ar', 'ru'];
const LANG_WEIGHTS = [0.75, 0.15, 0.10];

const SEED_COUNT = 500;
const DAYS_BACK  = 90;

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Box-Muller Gaussian random number */
function gaussian(mean, std) {
  let u, v;
  do { u = Math.random(); } while (u === 0);
  do { v = Math.random(); } while (v === 0);
  const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  return mean + std * z;
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

function weightedChoice(choices, weights) {
  const r = Math.random();
  let acc = 0;
  for (let i = 0; i < choices.length; i++) {
    acc += weights[i];
    if (r < acc) return choices[i];
  }
  return choices[choices.length - 1];
}

/** Pick the party whose score on a given axis is closest to the user's score */
function closestParty(axisScore, axisIndex) {
  let best = PARTY_IDS[0];
  let bestDist = Infinity;
  for (const id of PARTY_IDS) {
    const d = Math.abs(PARTY_SCORES[id][axisIndex] - axisScore);
    if (d < bestDist) { bestDist = d; best = id; }
  }
  return best;
}

/** Random date (ISO date string) within the last DAYS_BACK days */
function randomDate() {
  const now  = Date.now();
  const offset = Math.floor(Math.random() * DAYS_BACK * 24 * 60 * 60 * 1000);
  return new Date(now - offset).toISOString().slice(0, 10);
}

/** Axis score means and std-devs — slight variation per axis for realism */
const AXIS_PARAMS = [
  { mean: 52, std: 20 }, // first
  { mean: 48, std: 18 }, // second
  { mean: 55, std: 22 }, // third
  { mean: 50, std: 16 }  // fourth
];

function generateRow() {
  const axisScores = AXIS_PARAMS.map(({ mean, std }) =>
    Math.round(clamp(gaussian(mean, std), 0, 100) * 10) / 10
  );

  const recommendedParties = axisScores.map((score, i) => closestParty(score, i));

  // 52 answers: random valid values from [0,1,2,3,4] (no -1 for simplicity)
  const answers = Array.from({ length: 52 }, () => Math.floor(Math.random() * 5));

  const isFemale  = Math.random() < 0.45 ? 1 : 0;
  const language  = weightedChoice(LANGUAGES, LANG_WEIGHTS);

  return {
    id:                   uuidv4(),
    created_at:           randomDate(),
    survey_version:       '1.3',
    answers:              JSON.stringify(answers),
    axis_scores:          JSON.stringify(axisScores),
    recommended_parties:  JSON.stringify(recommendedParties),
    is_female:            isFemale,
    language
  };
}

// ── Main ─────────────────────────────────────────────────────────────────────

const force = process.argv.includes('--force');

const existingCount = db.prepare('SELECT COUNT(*) AS count FROM submissions').get().count;
if (existingCount > 0 && !force) {
  console.log(`[seed] Database already contains ${existingCount} submission(s). Skipping.`);
  console.log('[seed] Use --force to re-seed (will add on top of existing rows).');
  process.exit(0);
}

const insert = db.prepare(`
  INSERT INTO submissions
    (id, created_at, survey_version, answers, axis_scores, recommended_parties, is_female, language)
  VALUES
    (@id, @created_at, @survey_version, @answers, @axis_scores, @recommended_parties, @is_female, @language)
`);

const seedMany = db.transaction(() => {
  for (let i = 0; i < SEED_COUNT; i++) {
    insert.run(generateRow());
  }
});

seedMany();
console.log(`[seed] Seeded ${SEED_COUNT} demo submissions into data/survey.db`);
