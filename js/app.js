/**
 * app.js – Application State, Navigation & Rendering
 *
 * Depends on:
 *   QUESTIONS        (questions.js)
 *   calculateAllScores, getAnswerScore  (scoring.js)
 */

/* ============================================================
   SURVEY VERSION
   Bump this string when questions or scoring logic change.
   ============================================================ */
var SURVEY_VERSION = '1.3';

/* ============================================================
   AXIS METADATA
   Labels match the spec exactly (placeholders to be updated).
   ============================================================ */
/* ============================================================
   LANGUAGE SYSTEM
   ============================================================ */

/* Active language code and data — set by switchLanguage() on init */
var _language = DEFAULT_LANGUAGE;
var _langData  = LANGUAGES[DEFAULT_LANGUAGE].data;

/* Return gender-sensitive string: obj may be { male, female } or a plain string */
function LG(obj) {
  if (!obj || typeof obj === 'string') return obj || '';
  return obj[_gender] || obj.male || '';
}

/* Return localized axis text object for a given axis key */
function axisText(axisKey) {
  return _langData.axes[axisKey];
}

/* Return localized party name */
function partyName(party) {
  var pd = _langData.partyData[party.id];
  return pd ? pd.name : party.id;
}

/* Return localized party tooltip */
function partyTooltip(party, tooltipKey) {
  var pd = _langData.partyData[party.id];
  return pd ? pd.tooltip[tooltipKey] : '';
}

/* Apply all static text from _langData to DOM elements */
function applyStaticText() {
  document.title = _langData.page.title;

  /* Landing */
  var el;
  el = document.querySelector('.landing-title');
  if (el) el.textContent = _langData.landing.heading;
  el = document.querySelector('.landing-description');
  if (el) el.textContent = _langData.landing.description;
  el = document.getElementById('btn-start-male');
  if (el) el.textContent = _langData.landing.btn.male;
  el = document.getElementById('btn-start-female');
  if (el) el.textContent = _langData.landing.btn.female;
  el = document.getElementById('btn-skip-male');
  if (el) el.textContent = _langData.landing.btn.skipMale;
  el = document.getElementById('btn-skip-female');
  if (el) el.textContent = _langData.landing.btn.skipFemale;
  el = document.getElementById('btn-skip-to-last-male');
  if (el) el.textContent = _langData.landing.btn.skipToLastMale;
  el = document.getElementById('btn-skip-to-last-female');
  if (el) el.textContent = _langData.landing.btn.skipToLastFemale;

  /* Question page */
  el = document.getElementById('btn-prev');
  if (el) el.textContent = _langData.question.prev;

  /* Answer buttons */
  var answerKeyMap = {
    'strongly-agree':    'stronglyAgree',
    'agree':             'agree',
    'neutral':           'neutral',
    'disagree':          'disagree',
    'strongly-disagree': 'stronglyDisagree'
  };
  document.querySelectorAll('.btn-answer').forEach(function(btn) {
    var key = answerKeyMap[btn.dataset.value];
    if (key) btn.textContent = LG(_langData.answers[key]);
  });

  /* Results */
  el = document.querySelector('.results-title');
  if (el) el.textContent = _langData.results.heading;
  el = document.querySelector('.results-subtitle');
  if (el) el.textContent = _langData.results.subtitle;

  /* Share buttons tooltips */
  el = document.getElementById('share-whatsapp');
  if (el) el.title = _langData.results.share.whatsapp;
  el = document.getElementById('share-instagram');
  if (el) el.title = _langData.results.share.instagram;
  el = document.getElementById('share-x');
  if (el) el.title = _langData.results.share.x;
  el = document.getElementById('share-facebook');
  if (el) el.title = _langData.results.share.facebook;

  /* Share label (default/current gender) */
  el = document.getElementById('share-label');
  if (el) el.textContent = LG(_langData.results.share.label);

  /* Consent label */
  el = document.getElementById('consent-label-text');
  if (el) el.textContent = _langData.results.consent.label;

  /* Restart */
  el = document.getElementById('btn-restart');
  if (el) el.textContent = _langData.results.restart;
}

/* Switch to a new language — updates DOM and HTML attributes */
function switchLanguage(code) {
  if (!LANGUAGES[code]) return;
  _language = code;
  _langData  = LANGUAGES[code].data;
  var htmlEl = document.documentElement;
  htmlEl.setAttribute('lang', code);
  htmlEl.setAttribute('dir',  LANGUAGES[code].dir);
  applyStaticText();
  document.querySelectorAll('.lang-toggle-btn').forEach(function(btn) {
    btn.classList.toggle('active', btn.dataset.lang === code);
  });
  /* Restart landing page entrance animations if we're currently on the landing page */
  var landing = document.getElementById('page-landing');
  if (landing && landing.classList.contains('active')) {
    var animated = landing.querySelectorAll(
      '.landing-title, .landing-description, ' +
      '#btn-start-male, #btn-start-female, ' +
      '#btn-skip-male, #btn-skip-female, ' +
      '#btn-skip-to-last-male, #btn-skip-to-last-female'
    );
    animated.forEach(function(el) { el.style.animation = 'none'; });
    void landing.offsetWidth; /* force reflow so the browser flushes the cancelled animations */
    animated.forEach(function(el) { el.style.animation = ''; });
  }
}

/* AXES_META retains only non-translatable properties (CSS class names) */
var AXES_META = {
  first:  { barClass: 'bar-first'  },
  second: { barClass: 'bar-second' },
  third:  { barClass: 'bar-third'  },
  fourth: { barClass: 'bar-fourth' }
};

var AXES_ORDER = ['first', 'second', 'third', 'fourth'];

var AXIS_EXPANDED_TEXT_COLORS = {
  first:  '#2c5282',  // dark blue — shade of blue axis
  second: '#22543d',  // dark green — shade of green axis
  third:  '#9c4221',  // dark amber — shade of amber axis
  fourth: '#44337a'   // dark purple — shade of purple axis
};

/* ============================================================
   GLOBAL MOUSE POSITION (used for stable hover checks)
   ============================================================ */
var _mouseX = 0, _mouseY = 0;

/* _realMouseActive: true only after genuine mouse movement with no recent touch.
   Cleared on every touchstart. Lets pointerenter/pointerleave hover handlers
   work for real mice while staying completely inert on touch devices — even when
   iOS Safari synthesizes mouse/pointer events after a tap, or when the virtual
   cursor drifts onto a newly-rendered element (which caused the results-page
   auto-open bug and the multi-row-open bug on mobile). */
var _lastTouchTime = 0;
var _realMouseActive = false;

document.addEventListener('touchstart', function() {
  _lastTouchTime = Date.now();
  _realMouseActive = false;
}, { passive: true });

document.addEventListener('mousemove', function(e) {
  _mouseX = e.clientX;
  _mouseY = e.clientY;
  /* iOS fires a synthetic mousemove right after touchend at the tap position.
     Only treat movement as real mouse activity if no touch occurred recently. */
  if (Date.now() - _lastTouchTime > 500) {
    _realMouseActive = true;
  }
}, { passive: true });

/* ============================================================
   APPLICATION STATE
   ============================================================ */
var state = {
  currentQuestionIndex: 0,          // 0-based (0..51)
  answers: new Array(52).fill(null) // null | selection-key string
};

/* Prevents iOS ghost-click (the ~300ms delayed click Safari fires after a tap)
   from registering as an answer on the next question. */
var _navigating = false;

/* Stores the most recently computed scores so share handlers can access them. */
var _lastScores = null;

/* Stores the recommended party ID per axis after results are computed.
   Order matches AXES_ORDER: [first, second, third, fourth]. */
var _lastRecommendedParties = null;

/* Gender selected on the landing page — 'male' | 'female' */
var _gender = 'male';

/* ============================================================
   DOM REFERENCES
   ============================================================ */
var pageLanding  = document.getElementById('page-landing');
var pageQuestion = document.getElementById('page-question');
var pageResults  = document.getElementById('page-results');

var btnStartMale   = document.getElementById('btn-start-male');
var btnStartFemale = document.getElementById('btn-start-female');
var btnPrev      = document.getElementById('btn-prev');
var qText        = document.getElementById('q-text');
var qNumDisplay  = document.getElementById('q-number-display');
var progressFill = document.getElementById('progress-fill');
var answerBtns      = document.querySelectorAll('.btn-answer');
var answerBtnsEl    = document.getElementById('answer-buttons');
var resultsBarsEl   = document.getElementById('results-bars');

/* ============================================================
   PAGE SWITCHING
   ============================================================ */
function showPage(pageId) {
  var allPages = [pageLanding, pageQuestion, pageResults];
  allPages.forEach(function(p) {
    p.classList.remove('active');
  });

  var target = {
    landing:  pageLanding,
    question: pageQuestion,
    results:  pageResults
  }[pageId];

  if (target) {
    target.classList.add('active');
  }

  var langToggle = document.querySelector('.lang-toggle');
  if (langToggle) langToggle.style.display = pageId === 'landing' ? '' : 'none';

  window.scrollTo({ top: 0 });
}

/* ============================================================
   ANIMATION HELPERS
   ============================================================ */
var ANIM_EXIT_MS = 260;

function getContainer(pageEl) {
  return pageEl.querySelector('.container');
}

function animExit(el, cls, cb) {
  el.classList.add(cls);
  el.style.pointerEvents = 'none';
  setTimeout(function() {
    el.classList.remove(cls);
    el.style.pointerEvents = '';
    cb();
  }, ANIM_EXIT_MS);
}

function animEnter(el, cls) {
  void el.offsetWidth; // force reflow so animation restarts
  el.classList.add(cls);
  setTimeout(function() { el.classList.remove(cls); }, 500);
}

var questionBody = document.getElementById('question-body');

/* Slide forward: landing→question or question→question */
function navForwardToQuestion(index) {
  if (pageQuestion.classList.contains('active')) {
    /* Same page — animate only the question body, header/nav stay still */
    animExit(questionBody, 'anim-exit-right', function() {
      updateQuestionDOM(index);
      animEnter(questionBody, 'anim-enter-left');
    });
  } else {
    /* Landing → Question: staggered exit then staggered entrance */
    pageLanding.classList.add('landing-exiting');
    var _lt = document.querySelector('.lang-toggle');
    if (_lt) _lt.classList.add('exiting');
    pageLanding.style.pointerEvents = 'none';
    setTimeout(function() {
      pageLanding.classList.remove('landing-exiting');
      if (_lt) _lt.classList.remove('exiting');
      pageLanding.style.pointerEvents = '';
      updateQuestionDOM(index);
      showPage('question');
      pageQuestion.classList.add('question-entering');
      setTimeout(function() { pageQuestion.classList.remove('question-entering'); }, 900);
    }, 340);
  }
}

/* Slide backward: question→question — animate only the question body */
function navBackwardToQuestion(index) {
  animExit(questionBody, 'anim-exit-left', function() {
    updateQuestionDOM(index);
    animEnter(questionBody, 'anim-enter-right');
  });
}

/* Staggered results entrance */
function navToResults(fromPageId) {
  var fromEl = fromPageId === 'landing' ? pageLanding : pageQuestion;
  var _ltR = fromPageId === 'landing' ? document.querySelector('.lang-toggle') : null;
  if (_ltR) _ltR.classList.add('exiting');
  animExit(getContainer(fromEl), 'anim-exit-scale', function() {
    if (_ltR) _ltR.classList.remove('exiting');
    showResults();                 // makes page display:flex first
    void pageResults.offsetWidth; // force reflow so layout is computed

    var headerEl   = pageResults.querySelector('.results-header');
    var titleEl    = pageResults.querySelector('.results-title');
    var subtitleEl = pageResults.querySelector('.results-subtitle');
    var isDesktop  = window.innerWidth >= 900;

    var containerEl = pageResults.querySelector('.container');

    if (isDesktop && headerEl) {
      /* Lock the header grid row to its exact natural height before the header
         goes position:fixed (which removes it from grid flow and would collapse
         the row, causing the share section to jump at cleanup). */
      var naturalHeaderHeight = headerEl.getBoundingClientRect().height;
      if (containerEl) {
        containerEl.style.gridTemplateRows = naturalHeaderHeight + 'px 1fr auto';
      }
      animResultsHeaderDesktop(headerEl, titleEl, subtitleEl);
    }

    pageResults.classList.add('results-entering');

    setTimeout(function() {
      pageResults.classList.remove('results-entering');
      /* Clear any inline styles left by the JS header animation */
      if (headerEl)   { headerEl.style.cssText   = ''; }
      if (titleEl)    { titleEl.style.cssText     = ''; }
      if (subtitleEl) { subtitleEl.style.cssText  = ''; }
      /* Release the locked grid row — header is back in flow with the same height */
      if (containerEl) { containerEl.style.gridTemplateRows = ''; }
    }, 7000);
  });
}

/*
 * JS-driven header animation for wide desktop.
 * Total duration: ~3500ms
 *   Phase 1  — title fades in at centre         (0 → 630ms)
 *   Phase 1b — subtitle fades in at centre      (900ms → 1450ms)
 *   Hold     — both visible at centre           (630ms → 2250ms)
 *   Phase 3  — whole header slides to top-right (2250ms → 3500ms)
 */
function animResultsHeaderDesktop(headerEl, titleEl, subtitleEl) {
  var rem        = parseFloat(getComputedStyle(document.documentElement).fontSize);
  var finalTop   = Math.round(1.5 * rem);  /* #page-results padding-top  */
  var finalEdge  = Math.round(2   * rem);  /* #page-results padding-left/right */
  var isLTR      = document.documentElement.dir === 'ltr';
  var colWidth   = 220;
  var ww         = window.innerWidth;
  var wh         = window.innerHeight;

  /* "Centre" font sizes — bigger than the final corner sizes */
  var titleBigFont    = '2.6rem';
  var subtitleBigFont = '1.15rem';
  /* Final (corner) font sizes — match the CSS-defined desktop values */
  var titleFinalFont    = '2rem';
  var subtitleFinalFont = '1rem';

  /* Apply big fonts first so getBoundingClientRect measures the centred size */
  titleEl.style.cssText    = 'animation:none;opacity:0;font-size:' + titleBigFont    + ';';
  subtitleEl.style.cssText = 'animation:none;opacity:0;font-size:' + subtitleBigFont + ';';
  void headerEl.offsetWidth; /* reflow with big fonts */

  /* Measure bounds with big fonts in place — exact centre, no guesswork */
  var rect = headerEl.getBoundingClientRect();
  var hcx  = rect.left + rect.width  / 2;
  var hcy  = rect.top  + rect.height / 2;

  /* Translation that brings that centre to the viewport centre */
  var dy = Math.round(wh / 2 - hcy);

  if (isLTR) {
    /* LTR: measure the title's natural (unwrapped) width at the big font size so
       the centred container is exactly wide enough — no text overflow, no drift. */
    titleEl.style.whiteSpace = 'nowrap';
    void titleEl.offsetWidth;
    /* scrollWidth gives true text width even when element is constrained by parent */
    var animColWidth = Math.max(colWidth, titleEl.scrollWidth + 4);
    titleEl.style.whiteSpace = '';

    var centeredLeft = Math.round(ww / 2 - animColWidth / 2);
    headerEl.style.cssText =
      'position:fixed;top:' + finalTop + 'px;left:' + centeredLeft + 'px;' +
      'width:' + animColWidth + 'px;z-index:100;' +
      'animation:none;transform:translateY(' + dy + 'px);';
  } else {
    var dx = Math.round(ww / 2 - hcx);
    headerEl.style.cssText =
      'position:fixed;top:' + finalTop + 'px;right:' + finalEdge + 'px;' +
      'width:' + colWidth + 'px;z-index:100;' +
      'animation:none;transform:translate(' + dx + 'px,' + dy + 'px);';
  }

  titleEl.style.cssText    = 'animation:none;opacity:0;font-size:' + titleBigFont    + ';transition:opacity 0.63s ease-out;';
  subtitleEl.style.cssText = 'animation:none;opacity:0;font-size:' + subtitleBigFont + ';';

  void headerEl.offsetWidth; /* reflow so the initial state paints before any changes */

  /* Phase 1: fade in title at centre */
  titleEl.style.opacity = '1';

  /* Phase 1b: fade in subtitle at centre */
  setTimeout(function() {
    subtitleEl.style.transition = 'opacity 0.55s ease-out';
    subtitleEl.style.opacity = '1';
  }, 900);

  /* Phase 3: slide to corner + shrink font simultaneously */
  setTimeout(function() {
    var ease = '1.25s cubic-bezier(0.42,0,0.58,1)';
    if (isLTR) {
      /* Slide to final corner: animate left, width, and drop the vertical translate */
      headerEl.style.transition = 'transform ' + ease + ', left ' + ease + ', width ' + ease;
      headerEl.style.left       = finalEdge + 'px';
      headerEl.style.width      = colWidth + 'px';
      headerEl.style.transform  = 'translateY(0)';
    } else {
      headerEl.style.transition = 'transform ' + ease;
      headerEl.style.transform  = 'translate(0,0)';
    }
    titleEl.style.transition    = 'opacity 0s, font-size ' + ease;
    subtitleEl.style.transition = 'opacity 0s, font-size ' + ease;
    titleEl.style.fontSize      = titleFinalFont;
    subtitleEl.style.fontSize   = subtitleFinalFont;
  }, 2250);
}

/* Slide back to landing from results */
function navToLanding() {
  animExit(getContainer(pageResults), 'anim-exit-right', function() {
    showPage('landing');
    /* landing CSS entrance animations fire automatically on .active */
  });
}

/* ============================================================
   QUESTION PAGE – RENDER
   ============================================================ */
function updateQuestionDOM(index) {
  /* Keep pointer-events blocked and _navigating true for a brief window after
     the DOM update to absorb any late ghost clicks from the previous tap. */
  setTimeout(function() {
    answerBtnsEl.style.pointerEvents = '';
    _navigating = false;
  }, 100);

  state.currentQuestionIndex = index;

  var question = QUESTIONS[index];
  var num      = index + 1;

  var qEntry = _langData.questions[index];
  qText.textContent               = qEntry ? qEntry[_gender === 'female' ? 'female' : 'male'] : question.text;
  qNumDisplay.textContent         = _langData.question.counter
    .replace('{n}', num)
    .replace('{total}', QUESTIONS.length);
  progressFill.style.width        = ((num / 52) * 100) + '%';
  btnPrev.disabled                = (index === 0);

  var savedAnswer = state.answers[index];
  answerBtns.forEach(function(btn) {
    btn.classList.toggle('selected', btn.dataset.value === savedAnswer);
  });
}

function showQuestion(index) {
  updateQuestionDOM(index);
  showPage('question');
}

/* ============================================================
   ANSWER SELECTION
   ============================================================ */
function handleAnswerSelect(value) {
  if (_navigating) return;
  _navigating = true;
  answerBtnsEl.style.pointerEvents = 'none';

  var index = state.currentQuestionIndex;

  // Persist answer
  state.answers[index] = value;

  // Reflect selected state immediately in UI
  answerBtns.forEach(function(btn) {
    btn.classList.toggle('selected', btn.dataset.value === value);
  });

  // Brief visual pause to show selection highlight, then animate forward.
  // Clear .selected before the exit animation so the frozen buttons don't
  // show the previous answer while the next question slides in.
  setTimeout(function() {
    answerBtns.forEach(function(btn) { btn.classList.remove('selected'); });
    if (index === 51) {
      navToResults('question');
    } else {
      navForwardToQuestion(index + 1);
    }
  }, 150);
}

/* ============================================================
   RESULTS PAGE – BUILD & RENDER
   ============================================================ */
function showResults() {
  var scores = calculateAllScores(state.answers, QUESTIONS); // from scoring.js
  _lastScores = scores; // save for share handlers

  /* --- Compute party distances upfront so per-axis winners are
         available when building each axis block --- */
  var computed = PARTIES.map(function(party) {
    var d = {
      first:  Math.abs(party.scores.first  - scores.first),
      second: Math.abs(party.scores.second - scores.second),
      third:  Math.abs(party.scores.third  - scores.third),
      fourth: Math.abs(party.scores.fourth - scores.fourth)
    };
    d.avg = (d.first + d.second + d.third + d.fourth) / 4;
    return { party: party, dist: d };
  });

  var axisSorted = {};
  AXES_ORDER.forEach(function(axis) {
    axisSorted[axis] = computed.slice().sort(function(a, b) {
      return a.dist[axis] - b.dist[axis];
    });
  });

  // Capture the top recommended party per axis for anonymous submission
  _lastRecommendedParties = AXES_ORDER.map(function(axis) {
    return axisSorted[axis][0].party.id;
  });

  // Clear any previous render
  resultsBarsEl.innerHTML = '';

  AXES_ORDER.forEach(function(axisKey, axisIndex) {
    var meta    = AXES_META[axisKey];
    var ax      = axisText(axisKey);
    var score   = scores[axisKey];
    var rounded = Math.round(score);

    /* --- Axis block wrapper --- */
    var block = document.createElement('div');
    block.className = 'result-axis-block axis-block-' + axisKey;

    /* --- Header row: left-label | axis-title | right-label --- */
    var headerRow = document.createElement('div');
    headerRow.className = 'result-axis-header';

    /* Left label + tooltip */
    var leftLabel = document.createElement('div');
    leftLabel.className = 'result-label label-left has-tooltip';
    leftLabel.appendChild(document.createTextNode(ax.left.label));
    var leftTip = document.createElement('span');
    leftTip.className = 'axis-tooltip';
    leftTip.textContent = ax.left.tooltip;
    leftLabel.appendChild(leftTip);

    /* Axis title (center) */
    var title = document.createElement('div');
    title.className = 'result-axis-title';
    title.textContent = ax.title;

    /* Right label + tooltip */
    var rightLabel = document.createElement('div');
    rightLabel.className = 'result-label label-right has-tooltip';
    rightLabel.appendChild(document.createTextNode(ax.right.label));
    var rightTip = document.createElement('span');
    rightTip.className = 'axis-tooltip';
    rightTip.textContent = ax.right.tooltip;
    rightLabel.appendChild(rightTip);

    headerRow.appendChild(leftLabel);
    headerRow.appendChild(title);
    headerRow.appendChild(rightLabel);

    /* --- Bar row: full-width bar (no side labels) --- */
    var row = document.createElement('div');
    row.className = 'result-bar-row';

    /* Bar outer container */
    var barOuter = document.createElement('div');
    barOuter.className = 'result-bar-outer ' + meta.barClass.replace('bar-', 'bar-bg-');

    /* Colored fill (starts at 0%, animated to score% after mount) */
    var barInner = document.createElement('div');
    barInner.className = 'result-bar-inner ' + meta.barClass;


    /* Score value – centered over the full bar container */
    var scoreEl = document.createElement('span');
    scoreEl.className = 'result-bar-score';
    scoreEl.textContent = rounded;

    scoreEl.classList.add('score-light');

    barOuter.appendChild(barInner);

    /* Wrapper holds barOuter + score; no overflow:hidden so score can overflow the bar */
    var barWrapper = document.createElement('div');
    barWrapper.className = 'result-bar-wrapper';
    barWrapper.appendChild(barOuter);
    barWrapper.appendChild(scoreEl);

    row.appendChild(barWrapper);

    block.appendChild(headerRow);
    block.appendChild(row);

    /* --- Closest party for this axis, shown inline below the bar --- */
    var axisWinner    = axisSorted[axisKey][0];
    var axisProximity = Math.round(100 - axisWinner.dist[axisKey]);
    var axisSecondary = axisSorted[axisKey].slice(1, 3).map(function(entry) {
      return { party: entry.party, proximity: Math.round(100 - entry.dist[axisKey]) };
    });
    block.appendChild(buildAxisPartyMini(axisWinner.party, axisProximity, axisKey, axisSecondary));

    resultsBarsEl.appendChild(block);

    /* Stagger each bar fill in order, matching the axis block entrance timing */
    (function(inner, s, i) {
      /* Each bar loads 0.2s after its own axis block finishes appearing.
         Block finish times: 2.6s, 2.75s, 2.9s, 3.05s → +0.2s = 2.8s, 2.95s, 3.1s, 3.25s */
      setTimeout(function() { inner.style.width = s + '%'; }, 2800 + i * 150);
    }(barInner, score, axisIndex));
  });

  // Reset consent UI for this run
  var consentSection  = document.getElementById('consent-section');
  var consentCheckbox = document.getElementById('consent-checkbox');
  var consentStatus   = document.getElementById('consent-status');
  consentSection.style.display  = '';
  consentCheckbox.checked       = false;
  consentCheckbox.disabled      = false;
  consentStatus.textContent     = '';
  consentStatus.className       = 'consent-status';

  showPage('results');
}

/* ============================================================
   PARTY RECOMMENDATIONS – BUILD & RENDER
   ============================================================ */

/**
 * Builds a single party card DOM element.
 *
 * @param {object} party        – party object from PARTIES
 * @param {number} proximityPct – rounded 0-100 proximity value to display
 * @param {string} tooltipKey   – key into party.tooltips ('general' or axis name)
 * @param {boolean} isTop       – true → large top card, false → small axis card
 * @param {string|null} axisLabel – axis title shown above axis cards, null for top card
 */
function buildPartyCard(party, proximityPct, tooltipKey, isTop, axisLabel) {
  var card = document.createElement('div');
  card.className = 'party-card' + (isTop ? ' party-card-top' : ' party-card-axis');

  /* Axis label (small caps above avatar, axis cards only) */
  if (axisLabel) {
    var axisLabelEl = document.createElement('div');
    axisLabelEl.className = 'party-axis-label';
    axisLabelEl.textContent = axisLabel;
    card.appendChild(axisLabelEl);
  }

  /* Avatar: colored circle with letter fallback; image layered on top if available */
  var avatar = document.createElement('div');
  avatar.className = 'party-avatar';
  avatar.style.background = party.color;

  /* Letter is always present as the base fallback */
  var letter = document.createElement('span');
  letter.textContent = partyName(party).charAt(0);
  avatar.appendChild(letter);

  /* tooltipKey doubles as the image key: 'general' | 'first' | 'second' | 'third' | 'fourth' */
  var imgSrc = party.images && party.images[tooltipKey];
  if (imgSrc) {
    var img = document.createElement('img');
    img.src = imgSrc;
    img.alt = partyName(party);
    img.className = 'party-avatar-img';
    /* On load failure the image hides itself, revealing the letter beneath */
    img.onerror = function() { this.style.display = 'none'; };
    avatar.appendChild(img);
  }
  card.appendChild(avatar);

  /* Party name */
  var nameEl = document.createElement('div');
  nameEl.className = 'party-name';
  nameEl.textContent = partyName(party);

  /* Proximity percentage */
  var proxEl = document.createElement('div');
  proxEl.className = 'party-proximity';
  proxEl.textContent = proximityPct + '%';

  /* Top card: group name + proximity in a flex column so the card can be horizontal */
  if (isTop) {
    var textWrap = document.createElement('div');
    textWrap.className = 'party-top-text';
    textWrap.appendChild(nameEl);
    textWrap.appendChild(proxEl);
    card.appendChild(textWrap);
  } else {
    card.appendChild(nameEl);
    card.appendChild(proxEl);
  }

  /* Hover tooltip */
  var tip = document.createElement('span');
  tip.className = 'party-tooltip';
  tip.textContent = partyTooltip(party, tooltipKey);
  card.appendChild(tip);

  return card;
}

/**
 * Builds a compact party row shown below each axis bar.
 * Two-state: normal shows text only; hover expands to show image + tooltip text.
 *
 * @param {object} party        – party object from PARTIES
 * @param {number} proximityPct – rounded 0-100 proximity value
 * @param {string} axisKey      – axis name used as tooltip and image key
 */
function buildAxisPartyMini(party, proximityPct, axisKey, secondaryParties) {
  secondaryParties = secondaryParties || [];
  var row = document.createElement('div');
  row.className = 'axis-party-row';

  /* Stable hover: use JS enter/leave so CSS :hover doesn't re-fire as the
     box resizes during transition (which causes the expand/collapse jitter).
     Use pointerenter/pointerleave + per-event pointerType check so touch input
     (iOS Safari fires mouseenter on tap, confusing the opacity animation) is
     ignored reliably — unlike a static matchMedia check which can misreport. */
  var _hoverTimer = null;
  var _collapseLocked = false;
  var _lockTimer = null;

  row.addEventListener('pointerenter', function() {
    if (!_realMouseActive) return;
    if (_collapseLocked) return;
    clearTimeout(_hoverTimer);
    row.style.opacity = '0';
    _hoverTimer = setTimeout(function() {
      row.classList.add('tooltip-active');
      row.style.opacity = '1';
    }, 180);
  });

  row.addEventListener('pointerleave', function() {
    if (!_realMouseActive) return;
    clearTimeout(_hoverTimer);
    row.style.opacity = '0';
    _hoverTimer = setTimeout(function() {
      row.classList.remove('tooltip-active');
      row.style.opacity = '1';
      _collapseLocked = true;
      clearTimeout(_lockTimer);
      _lockTimer = setTimeout(function() { _collapseLocked = false; }, 350);
    }, 180);
  });

  /* ── Normal state: text only (no image) ── */
  var normalWrap = document.createElement('div');
  normalWrap.className = 'axis-party-normal';

  var normalInner = document.createElement('div');
  normalInner.className = 'axis-party-normal-inner';

  var textEl = document.createElement('div');
  textEl.className = 'axis-party-text';

  var nameEl = document.createElement('span');
  nameEl.className = 'axis-party-name';
  nameEl.textContent = partyName(party);
  textEl.appendChild(nameEl);

  var descEl = document.createElement('span');
  descEl.className = 'axis-party-desc';
  descEl.textContent = _langData.parties.closestOnAxis;
  textEl.appendChild(descEl);

  var proxEl = document.createElement('span');
  proxEl.className = 'axis-party-prox';
  proxEl.textContent = proximityPct + '%';
  textEl.appendChild(proxEl);

  normalInner.appendChild(textEl);
  normalWrap.appendChild(normalInner);
  row.appendChild(normalWrap);

  /* ── Expanded state: two-column layout ── */
  var expandedWrap = document.createElement('div');
  expandedWrap.className = 'axis-party-expanded';

  var expandedInner = document.createElement('div');
  expandedInner.className = 'axis-party-expanded-inner';

  /* ── Main column (right 75%): avatar + tooltip text ── */
  var expandedMain = document.createElement('div');
  expandedMain.className = 'axis-party-expanded-main';

  /* Avatar with axis-colored image (letter as fallback) */
  var expandedAvatar = document.createElement('div');
  expandedAvatar.className = 'axis-party-expanded-avatar';
  expandedAvatar.style.background = party.color;

  var expandedLetter = document.createElement('span');
  expandedLetter.textContent = partyName(party).charAt(0);
  expandedAvatar.appendChild(expandedLetter);

  var imgSrc = party.images && party.images[axisKey];
  if (imgSrc) {
    var img = document.createElement('img');
    img.src = imgSrc;
    img.alt = partyName(party);
    img.className = 'party-avatar-img';
    img.onerror = function() { this.style.display = 'none'; };
    expandedAvatar.appendChild(img);
  }
  expandedMain.appendChild(expandedAvatar);

  /* Tooltip text */
  var tipText = document.createElement('p');
  tipText.className = 'axis-party-expanded-text';
  tipText.style.color = AXIS_EXPANDED_TEXT_COLORS[axisKey] || '#2d3748';
  tipText.textContent = partyTooltip(party, axisKey);
  expandedMain.appendChild(tipText);

  expandedInner.appendChild(expandedMain);

  /* ── Secondary column (left 25%): additional close parties ── */
  var expandedSecondary = document.createElement('div');
  expandedSecondary.className = 'axis-party-expanded-secondary';

  var secHeader = document.createElement('p');
  secHeader.className = 'axis-party-secondary-header';
  secHeader.textContent = _langData.parties.moreSimilar;
  expandedSecondary.appendChild(secHeader);

  secondaryParties.forEach(function(item) {
    var itemEl = document.createElement('div');
    itemEl.className = 'axis-party-secondary-item';

    var secNameEl = document.createElement('span');
    secNameEl.className = 'axis-party-secondary-name';
    secNameEl.textContent = partyName(item.party);
    itemEl.appendChild(secNameEl);

    var secProxEl = document.createElement('span');
    secProxEl.className = 'axis-party-secondary-prox';
    secProxEl.textContent = item.proximity + '%';
    itemEl.appendChild(secProxEl);

    expandedSecondary.appendChild(itemEl);
  });

  expandedInner.appendChild(expandedSecondary);
  expandedWrap.appendChild(expandedInner);
  row.appendChild(expandedWrap);

  return row;
}

/**
 * Renders the overall best-match party card into #results-parties.
 *
 * @param {{ party: object, dist: object }} topEntry – pre-computed top match
 */
function renderPartyRecommendations(topEntry) {
  var container = document.getElementById('results-parties');
  container.innerHTML = '';

  var section = document.createElement('div');
  section.className = 'party-section';

  var header = document.createElement('h2');
  header.className = 'party-section-title';
  header.textContent = _langData.parties.overallBest;
  section.appendChild(header);

  var topProximity = Math.round(100 - topEntry.dist.avg);
  var topWrap = document.createElement('div');
  topWrap.className = 'party-top-wrap';
  topWrap.appendChild(buildPartyCard(topEntry.party, topProximity, 'general', true, null));
  section.appendChild(topWrap);

  container.appendChild(section);
}

/* ============================================================
   GENDER / ANSWER LABELS
   ============================================================ */

var _ANSWER_KEY_MAP = {
  'strongly-agree':    'stronglyAgree',
  'agree':             'agree',
  'neutral':           'neutral',
  'disagree':          'disagree',
  'strongly-disagree': 'stronglyDisagree'
};

function updateAnswerLabels() {
  answerBtns.forEach(function(btn) {
    var key = _ANSWER_KEY_MAP[btn.dataset.value];
    if (key) btn.textContent = LG(_langData.answers[key]);
  });
  var shareLabelEl = document.getElementById('share-label');
  if (shareLabelEl) shareLabelEl.textContent = LG(_langData.results.share.label);
}

/* ============================================================
   EVENT LISTENERS
   ============================================================ */

// Gender start buttons on landing page
btnStartMale.addEventListener('click', function() {
  _gender = 'male';
  updateAnswerLabels();
  navForwardToQuestion(0);
});
btnStartFemale.addEventListener('click', function() {
  _gender = 'female';
  updateAnswerLabels();
  navForwardToQuestion(0);
});

// "דלג על השאלון" – fill random answers and jump straight to results (testing only)
var ANSWER_KEYS = ['strongly-agree', 'agree', 'neutral', 'disagree', 'strongly-disagree'];

function _doSkipAll() {
  state.answers = state.answers.map(function() {
    return ANSWER_KEYS[Math.floor(Math.random() * ANSWER_KEYS.length)];
  });
  navToResults('landing');
}
document.getElementById('btn-skip-male').addEventListener('click', function() {
  _gender = 'male'; updateAnswerLabels(); _doSkipAll();
});
document.getElementById('btn-skip-female').addEventListener('click', function() {
  _gender = 'female'; updateAnswerLabels(); _doSkipAll();
});

// "דלג לשאלה האחרונה" – fill random answers for all but the last question, then go to it (testing only)
function _doSkipToLast() {
  var lastIndex = state.answers.length - 1;
  for (var i = 0; i < lastIndex; i++) {
    state.answers[i] = ANSWER_KEYS[Math.floor(Math.random() * ANSWER_KEYS.length)];
  }
  state.answers[lastIndex] = null;
  state.currentQuestionIndex = lastIndex;
  navForwardToQuestion(lastIndex);
}
document.getElementById('btn-skip-to-last-male').addEventListener('click', function() {
  _gender = 'male'; updateAnswerLabels(); _doSkipToLast();
});
document.getElementById('btn-skip-to-last-female').addEventListener('click', function() {
  _gender = 'female'; updateAnswerLabels(); _doSkipToLast();
});

// "שאלה קודמת" – previous question button
btnPrev.addEventListener('click', function() {
  if (state.currentQuestionIndex > 0) {
    navBackwardToQuestion(state.currentQuestionIndex - 1);
  }
});

// Answer buttons
answerBtns.forEach(function(btn) {
  btn.addEventListener('click', function() {
    handleAnswerSelect(btn.dataset.value);
  });
});

// "בחזרה להתחלה" – reset all answers and return to landing page
document.getElementById('btn-restart').addEventListener('click', function() {
  state.answers = new Array(52).fill(null);
  state.currentQuestionIndex = 0;
  navToLanding();
});

// ============================================================
// SHARE FEATURE – Image generation + platform sharing
// ============================================================

function getShareText() {
  return LG(_langData.results.share.text);
}
var SHARE_URL  = window.location.href;

var _AXIS_COLORS = {
  first:  '#3182ce',
  second: '#2f855a',
  third:  '#c05621',
  fourth: '#6b46c1'
};

var _SHARE_SIZES = {
  whatsapp:  { w: 1080, h: 1080 },
  instagram: { w: 1080, h: 1920 },
  x:         { w: 1600, h: 900  },
  facebook:  { w: 1200, h: 1200 }
};

/* Build an off-screen share card element sized exactly width×height px.
   Uses inline styles throughout for reliable html2canvas rendering. */
function buildShareCard(width, height, scores) {
  var scale = width / 1080;

  var card = document.createElement('div');
  card.style.cssText = [
    'position:fixed',
    'top:-99999px',
    'left:-99999px',
    'width:' + width + 'px',
    'height:' + height + 'px',
    'background:#1a202c',
    'display:flex',
    'flex-direction:column',
    'align-items:stretch',
    'justify-content:space-between',
    'direction:rtl',
    'font-family:Heebo,Arial,sans-serif',
    'overflow:hidden',
    'box-sizing:border-box'
  ].join(';');

  /* ---- Header ---- */
  var header = document.createElement('div');
  header.style.cssText = [
    'padding:' + Math.round(64 * scale) + 'px ' + Math.round(72 * scale) + 'px ' + Math.round(32 * scale) + 'px',
    'text-align:center'
  ].join(';');

  var siteTitle = document.createElement('div');
  siteTitle.textContent = _langData.results.share.cardTitle;
  siteTitle.style.cssText = [
    'color:#e2e8f0',
    'font-size:' + Math.round(52 * scale) + 'px',
    'font-weight:800',
    'letter-spacing:0.01em',
    'line-height:1.2',
    'text-align:center'
  ].join(';');
  header.appendChild(siteTitle);

  var subtitle = document.createElement('div');
  subtitle.textContent = _langData.results.share.cardSubtitle;
  subtitle.style.cssText = [
    'color:#718096',
    'font-size:' + Math.round(30 * scale) + 'px',
    'font-weight:500',
    'margin-top:' + Math.round(10 * scale) + 'px',
    'text-align:center'
  ].join(';');
  header.appendChild(subtitle);
  card.appendChild(header);

  /* ---- Axes section ---- */
  var axesWrap = document.createElement('div');
  axesWrap.style.cssText = [
    'flex:1',
    'display:flex',
    'flex-direction:column',
    'justify-content:center',
    'gap:' + Math.round(36 * scale) + 'px',
    'padding:0 ' + Math.round(72 * scale) + 'px'
  ].join(';');

  AXES_ORDER.forEach(function(axisKey) {
    var ax    = axisText(axisKey);
    var score = scores[axisKey];
    var color = _AXIS_COLORS[axisKey];
    var pct   = Math.round(score);

    var axisBlock = document.createElement('div');

    /* Label row: leftLabel | axis title | rightLabel (forced LTR for physical positioning) */
    var labelRow = document.createElement('div');
    labelRow.style.cssText = [
      'display:flex',
      'justify-content:space-between',
      'align-items:center',
      'direction:ltr',
      'margin-bottom:' + Math.round(10 * scale) + 'px'
    ].join(';');

    var leftLabelEl = document.createElement('span');
    leftLabelEl.textContent = ax.left.label;
    leftLabelEl.style.cssText = 'color:' + color + ';font-size:' + Math.round(26 * scale) + 'px;font-weight:700;direction:rtl;';

    var axisTitleEl = document.createElement('span');
    axisTitleEl.textContent = ax.title;
    axisTitleEl.style.cssText = 'color:#a0aec0;font-size:' + Math.round(22 * scale) + 'px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;direction:rtl;';

    var rightLabelEl = document.createElement('span');
    rightLabelEl.textContent = ax.right.label;
    rightLabelEl.style.cssText = 'color:' + color + ';font-size:' + Math.round(26 * scale) + 'px;font-weight:700;direction:rtl;';

    labelRow.appendChild(leftLabelEl);
    labelRow.appendChild(axisTitleEl);
    labelRow.appendChild(rightLabelEl);

    /* Bar track with colored fill and score overlay */
    var barH = Math.round(52 * scale);
    var barTrack = document.createElement('div');
    barTrack.style.cssText = [
      'position:relative',
      'width:100%',
      'height:' + barH + 'px',
      'background:#2d3748',
      'border-radius:' + Math.round(10 * scale) + 'px',
      'overflow:hidden'
    ].join(';');

    var barFill = document.createElement('div');
    barFill.style.cssText = [
      'position:absolute',
      'left:0',
      'top:0',
      'height:100%',
      'width:' + pct + '%',
      'background:' + color,
      'border-radius:' + Math.round(10 * scale) + 'px'
    ].join(';');

    var scoreLabel = document.createElement('div');
    scoreLabel.textContent = pct;
    scoreLabel.style.cssText = [
      'position:absolute',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'color:#fff',
      'font-size:' + Math.round(28 * scale) + 'px',
      'font-weight:700',
      'font-style:italic',
      'text-shadow:0 1px 4px rgba(0,0,0,0.5)',
      'white-space:nowrap',
      'pointer-events:none'
    ].join(';');

    barTrack.appendChild(barFill);
    barTrack.appendChild(scoreLabel);

    axisBlock.appendChild(labelRow);
    axisBlock.appendChild(barTrack);
    axesWrap.appendChild(axisBlock);
  });

  card.appendChild(axesWrap);

  /* ---- Footer ---- */
  var footer = document.createElement('div');
  footer.style.cssText = [
    'padding:' + Math.round(32 * scale) + 'px ' + Math.round(72 * scale) + 'px ' + Math.round(48 * scale) + 'px',
    'text-align:center',
    'border-top:1px solid #2d3748'
  ].join(';');

  var footerText = document.createElement('div');
  footerText.textContent = getShareText();
  footerText.style.cssText = [
    'color:#718096',
    'font-size:' + Math.round(24 * scale) + 'px',
    'font-weight:500',
    'line-height:1.5',
    'margin-bottom:' + Math.round(8 * scale) + 'px'
  ].join(';');

  var footerUrl = document.createElement('div');
  footerUrl.textContent = SHARE_URL;
  footerUrl.style.cssText = [
    'color:#4299e1',
    'font-size:' + Math.round(22 * scale) + 'px',
    'font-weight:600',
    'direction:ltr',
    'text-align:center'
  ].join(';');

  footer.appendChild(footerText);
  footer.appendChild(footerUrl);
  card.appendChild(footer);

  return card;
}

/* Show a brief toast notification at the bottom of the screen. */
function _showShareToast(message) {
  var existing = document.getElementById('_share-toast');
  if (existing) existing.remove();

  var toast = document.createElement('div');
  toast.id = '_share-toast';
  toast.className = 'share-toast';
  toast.textContent = message;
  document.body.appendChild(toast);

  void toast.offsetWidth; // force reflow to enable transition
  toast.classList.add('share-toast-visible');

  setTimeout(function() {
    toast.classList.remove('share-toast-visible');
    setTimeout(function() { toast.remove(); }, 350);
  }, 4000);
}

function _restoreShareBtn(btn) {
  if (btn) {
    btn.disabled = false;
    btn.style.opacity = '';
  }
}

/* Trigger a file download from a blob. */
function _downloadBlob(blob, filename) {
  var blobUrl = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = blobUrl;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(function() { document.body.removeChild(a); URL.revokeObjectURL(blobUrl); }, 100);
}

/* Fallback/desktop: copy image to clipboard (desktop) OR download image (mobile),
   open platform with the right URL, show toast.
   isMobile: true → use mobile deep links + download; false → use clipboard + desktop URLs. */
function _desktopShare(platform, blob, btn, isMobile) {
  var desktopUrls = {
    whatsapp:  'https://web.whatsapp.com/',
    x:         'https://twitter.com/intent/tweet?text=' + encodeURIComponent(getShareText()) + '&url=' + encodeURIComponent(SHARE_URL),
    facebook:  'https://www.facebook.com/',
    instagram: 'https://www.instagram.com/'
  };

  var mobileUrls = {
    whatsapp:  'https://wa.me/?text=' + encodeURIComponent(getShareText() + ' ' + SHARE_URL),
    x:         'https://twitter.com/intent/tweet?text=' + encodeURIComponent(getShareText()) + '&url=' + encodeURIComponent(SHARE_URL),
    facebook:  'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(SHARE_URL),
    instagram: 'https://www.instagram.com/'
  };

  var url = isMobile ? mobileUrls[platform] : desktopUrls[platform];

  function openAndToast(clipOk) {
    if (url) window.open(url, '_blank');
    _restoreShareBtn(btn);
    if (clipOk) {
      _showShareToast(_langData.toast.clipboard);
    } else {
      _downloadBlob(blob, 'תוצאות-פוליטיות.png');
      _showShareToast(_langData.toast.download);
    }
  }

  /* Desktop only: try clipboard first */
  if (!isMobile && window.ClipboardItem && navigator.clipboard && navigator.clipboard.write) {
    var item = new ClipboardItem({ 'image/png': blob });
    navigator.clipboard.write([item]).then(function() {
      openAndToast(true);
    }).catch(function() {
      openAndToast(false);
    });
  } else {
    openAndToast(false);
  }
}

/* Generate the share card image and share it. */
function _captureAndShare(platform, width, height) {
  if (!_lastScores) return;

  var btn = document.getElementById('share-' + platform);
  if (btn) {
    btn.disabled = true;
    btn.style.opacity = '0.5';
  }

  var card = buildShareCard(width, height, _lastScores);
  document.body.appendChild(card);

  var isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  html2canvas(card, {
    width:           width,
    height:          height,
    scale:           1,
    useCORS:         true,
    allowTaint:      true,
    backgroundColor: '#1a202c',
    logging:         false
  }).then(function(canvas) {
    card.remove();
    canvas.toBlob(function(blob) {
      if (!blob) { _restoreShareBtn(btn); return; }

      var file = new File([blob], 'תוצאות-פוליטיות.png', { type: 'image/png' });

      /* Mobile: try Web Share API with file */
      if (isMobile && navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator.share({
          files: [file],
          text:  getShareText(),
          url:   SHARE_URL
        }).then(function() {
          _restoreShareBtn(btn);
        }).catch(function() {
          /* User cancelled or file-share unsupported — fall through to desktop flow */
          _desktopShare(platform, blob, btn, isMobile);
        });
        return;
      }

      /* Desktop (or mobile without file-share support) */
      _desktopShare(platform, blob, btn, isMobile);
    }, 'image/png');
  }).catch(function() {
    if (card.parentNode) card.remove();
    _restoreShareBtn(btn);
    _showShareToast(_langData.toast.error);
  });
}

/* Wire up share buttons */
(function() {
  ['whatsapp', 'instagram', 'x', 'facebook'].forEach(function(platform) {
    var el = document.getElementById('share-' + platform);
    if (!el) return;
    el.addEventListener('click', function() {
      var size = _SHARE_SIZES[platform];
      _captureAndShare(platform, size.w, size.h);
    });
  });
}());

// Tap-to-toggle tooltips (works alongside CSS :hover for desktop)
document.addEventListener('click', function(e) {
  var trigger = e.target.closest('.has-tooltip, .party-card, .axis-party-row');

  document.querySelectorAll('.tooltip-active').forEach(function(el) {
    if (el !== trigger) el.classList.remove('tooltip-active');
  });

  if (trigger) {
    trigger.classList.toggle('tooltip-active');
  }
});

/* ============================================================
   ANONYMOUS SURVEY SUBMISSION
   ============================================================ */

var ANSWER_TO_INDEX = {
  'strongly-agree':    0,
  'agree':             1,
  'neutral':           2,
  'disagree':          3,
  'strongly-disagree': 4
};

/**
 * POST the completed survey anonymously to /api/submit.
 * No identifying information is sent — only answers, scores, and parties.
 *
 * @param {function} onSuccess - called with no arguments on 201
 * @param {function} onError   - called with an error message string
 */
function submitSurvey(onSuccess, onError) {
  if (!_lastScores || !_lastRecommendedParties) {
    onError('Results not ready');
    return;
  }

  var answers = state.answers.map(function(a) {
    return (a === null || a === undefined) ? -1 : (ANSWER_TO_INDEX[a] !== undefined ? ANSWER_TO_INDEX[a] : -1);
  });

  var axisScores = AXES_ORDER.map(function(axis) {
    return Math.round(_lastScores[axis] * 100) / 100;
  });

  var payload = {
    surveyVersion:      SURVEY_VERSION,
    answers:            answers,
    axisScores:         axisScores,
    recommendedParties: _lastRecommendedParties,
    isFemale:           _gender === 'female',
    language:           _language
  };

  fetch('/api/submit', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload)
  }).then(function(res) {
    if (res.ok) {
      onSuccess();
    } else {
      onError(_langData.error.submit.generic);
    }
  }).catch(function() {
    onError(_langData.error.submit.network);
  });
}

// Wire up the consent checkbox — submits once on first check
document.getElementById('consent-checkbox').addEventListener('change', function() {
  if (!this.checked) return; // unchecking after failure is fine; only act on check

  var checkbox = this;
  var status   = document.getElementById('consent-status');

  checkbox.disabled    = true;
  status.textContent   = _langData.status.saving;
  status.className     = 'consent-status consent-status--saving';

  submitSurvey(
    function() {
      status.textContent = _langData.status.saved;
      status.className   = 'consent-status consent-status--ok';
    },
    function(errMsg) {
      status.textContent = errMsg;
      status.className   = 'consent-status consent-status--error';
      checkbox.disabled  = false;
      checkbox.checked   = false;
    }
  );
});

/* ============================================================
   INIT – language toggle, static text, show landing page
   ============================================================ */

/* Wire up language toggle buttons */
document.querySelectorAll('.lang-toggle-btn').forEach(function(btn) {
  btn.addEventListener('click', function() {
    if (btn.dataset.lang !== _language) {
      switchLanguage(btn.dataset.lang);
    }
  });
});

/* Apply initial language text, then show the landing page */
switchLanguage(DEFAULT_LANGUAGE);
showPage('landing');
