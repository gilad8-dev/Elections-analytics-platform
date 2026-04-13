/**
 * scoring.js – Pure Scoring Engine
 *
 * No side effects. All functions take explicit arguments and return values.
 * Safe to unit-test independently.
 *
 * Selection key → numerical score mapping per question:
 *
 *   Normal question  (inverted: false, default):
 *     'strongly-agree'    →  +question.x   (xi)
 *     'agree'             →  +question.y   (yi)
 *     'neutral'           →   0
 *     'disagree'          →  -question.y   (-yi)
 *     'strongly-disagree' →  -question.x   (-xi)
 *
 *   Inverted question (inverted: true):
 *     All values are negated — agreeing moves the score LEFT instead of RIGHT.
 *     The x/y magnitudes still represent how much the answer matters.
 *
 * Note on MAX/MIN: for any question, whether normal or inverted, the max
 * possible axis contribution is always +x and the min is always -x.
 * Therefore the axis range calculation is unaffected by inversion.
 */

/**
 * Maps a selection key to the numerical score for a given question.
 * Handles inversion transparently.
 *
 * @param {string|null} selection – user's selection key, or null
 * @param {{ x: number, y: number, inverted: boolean }} question – question object
 * @returns {number}
 */
function getAnswerScore(selection, question) {
  var raw;
  switch (selection) {
    case 'strongly-agree':    raw =  question.x; break;
    case 'agree':             raw =  question.y; break;
    case 'neutral':           raw =  0;          break;
    case 'disagree':          raw = -question.y; break;
    case 'strongly-disagree': raw = -question.x; break;
    default:                  raw =  0;          break; // null / unknown
  }
  return question.inverted ? -raw : raw;
}

/**
 * Computes the 0–100 score for a single axis.
 *
 * Formula:
 *   MAX_i  = Σ xi  for all questions in axis  (each q's max contribution = +xi)
 *   MIN_i  = Σ -xi for all questions in axis  (each q's min contribution = -xi)
 *   RANGE_i = MAX_i - MIN_i                   (unaffected by inversion)
 *   rawSum  = Σ getAnswerScore(answer[i], question[i])
 *   shifted = rawSum - MIN_i
 *   score   = (shifted / RANGE_i) * 100   → [0, 100]
 *
 * Boundary verification (with any mix of normal/inverted questions):
 *   "all right" answers (agree with normal, disagree with inverted) → score = 100
 *   "all left"  answers (disagree with normal, agree with inverted) → score = 0
 *
 * @param {Array<string|null>} answers   – 52-element answers array (0-indexed)
 * @param {Array<object>}      questions – full QUESTIONS array
 * @param {string}             axisName  – 'first'|'second'|'third'|'fourth'
 * @returns {number} score in [0, 100] as a double
 */
function calculateAxisScore(answers, questions, axisName) {
  const axisQuestions = questions.filter(function(q) {
    return q.axis === axisName;
  });

  var MAX = 0;
  var MIN = 0;
  axisQuestions.forEach(function(q) {
    MAX += q.x;
    MIN -= q.x;
  });

  var RANGE = MAX - MIN; // always > 0 given valid question weights

  var rawSum = 0;
  axisQuestions.forEach(function(q) {
    rawSum += getAnswerScore(answers[q.id - 1], q);
  });

  var shifted = rawSum - MIN;
  var score   = (shifted / RANGE) * 100;

  return score; // double in [0, 100]
}

/**
 * Computes scores for all four axes.
 *
 * @param {Array<string|null>} answers   – 52-element answers array (0-indexed)
 * @param {Array<object>}      questions – full QUESTIONS array
 * @returns {{ first: number, second: number, third: number, fourth: number }}
 */
function calculateAllScores(answers, questions) {
  return {
    first:  calculateAxisScore(answers, questions, 'first'),
    second: calculateAxisScore(answers, questions, 'second'),
    third:  calculateAxisScore(answers, questions, 'third'),
    fourth: calculateAxisScore(answers, questions, 'fourth')
  };
}
