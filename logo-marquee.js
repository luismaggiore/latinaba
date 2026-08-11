// Client Portfolio (Logos by Category): builds one category-ordered
// sequence of placeholder tiles, duplicates it for a seamless loop, and
// auto-scrolls it via translateX. A label row scrolls in lockstep above the
// tiles, one caption anchored at the exact x where each category begins.
// The category selector reflects whichever category sits at the center of
// the marquee on every frame, and clicking a selector tweens the marquee so
// that category's start lands centered too (narrower categories are
// shorter than half the viewport, so landing them at the left edge instead
// would put the center-detector into the next category right after the
// jump). Swap renderLogoTile() for a real <img> once logos are ready,
// everything else keeps working as-is.

// Tracks the currently running rAF loop across repeated swup page visits,
// so re-entering the experience page never stacks up multiple loops.
let stopLogoMarquee = null;

function initLogoMarquee() {
  if (stopLogoMarquee) {
    stopLogoMarquee();
    stopLogoMarquee = null;
  }

  var categories = [
    { key: 'cro', label: 'CRO', count: 34 },
    { key: 'pharma', label: 'Pharma', count: 22 },
    { key: 'biotech', label: 'Biotech', count: 5 },
    { key: 'device', label: 'Medical Device', count: 5 },
    { key: 'academic', label: 'Academic / NGO / Gov.', count: 5 }
  ];

  var marquee = document.getElementById('logo-marquee');
  var track = document.getElementById('logo-marquee-track');
  var tilesEl = document.getElementById('logo-marquee-tiles');
  var labelsEl = document.getElementById('logo-marquee-labels');
  var selector = document.getElementById('logo-category-selector');
  if (!marquee || !track || !tilesEl || !labelsEl || !selector) return;

  function renderLogoTile(cat) {
    return '<div class="logo-tile" data-cat="' + cat + '"><i class="bi bi-building"></i></div>';
  }

  var sequenceHtml = categories
    .map(function (cat) {
      var html = '';
      for (var i = 0; i < cat.count; i++) html += renderLogoTile(cat.key);
      return html;
    })
    .join('');

  // Duplicated once so the second copy is ready to take over the instant
  // the first one scrolls fully past, no visible seam.
  tilesEl.innerHTML = sequenceHtml + sequenceHtml;

  var allTiles = tilesEl.querySelectorAll('.logo-tile');
  var sequenceLength = allTiles.length / 2;
  var tilesRect = tilesEl.getBoundingClientRect();

  var categoryStartX = {};
  categories.forEach(function (cat) {
    for (var i = 0; i < sequenceLength; i++) {
      if (allTiles[i].dataset.cat === cat.key) {
        categoryStartX[cat.key] = allTiles[i].getBoundingClientRect().left - tilesRect.left;
        break;
      }
    }
  });
  var sequenceWidth = allTiles[sequenceLength].getBoundingClientRect().left - tilesRect.left;

  // Labels live in their own absolutely-positioned row so they scroll in
  // sync with the tiles (same transformed parent) without being part of
  // the tiles' own flex flow. One set per sequence copy.
  labelsEl.style.width = sequenceWidth * 2 + 'px';
  var labelsHtml = '';
  [0, sequenceWidth].forEach(function (base) {
    categories.forEach(function (cat) {
      labelsHtml +=
        '<div class="logo-marquee-label" style="left:' + (base + categoryStartX[cat.key]) + 'px">' +
        cat.label +
        '</div>';
    });
  });
  labelsEl.innerHTML = labelsHtml;

  var categoryOrder = categories.map(function (c) { return c.key; });

  var offset = 0;
  var lastTime = null;
  var manualAnimating = false;
  var currentActiveCat = null;
  var speed = 40; // px/second
  var rafId = null;
  var stopped = false;

  function setActive(cat) {
    if (cat === currentActiveCat) return;
    currentActiveCat = cat;
    selector.querySelectorAll('.tab-btn-custom').forEach(function (b) {
      b.classList.toggle('active', b.dataset.cat === cat);
    });
  }

  function updateActiveFromCenter() {
    var containerWidth = marquee.getBoundingClientRect().width;
    var centerX = (-offset + containerWidth / 2) % sequenceWidth;
    if (centerX < 0) centerX += sequenceWidth;

    var active = categoryOrder[categoryOrder.length - 1];
    for (var i = 0; i < categoryOrder.length; i++) {
      var startX = categoryStartX[categoryOrder[i]];
      var nextStartX = i + 1 < categoryOrder.length ? categoryStartX[categoryOrder[i + 1]] : sequenceWidth;
      if (centerX >= startX && centerX < nextStartX) {
        active = categoryOrder[i];
        break;
      }
    }
    setActive(active);
  }

  function frame(now) {
    if (stopped) return;
    if (lastTime === null) lastTime = now;
    var dt = now - lastTime;
    lastTime = now;

    if (!manualAnimating) {
      offset -= (speed * dt) / 1000;
      if (offset <= -sequenceWidth) offset += sequenceWidth;
      track.style.transform = 'translateX(' + offset + 'px)';
    }

    updateActiveFromCenter();
    rafId = requestAnimationFrame(frame);
  }
  rafId = requestAnimationFrame(frame);

  function animateTo(target) {
    manualAnimating = true;
    var start = offset;
    var duration = 700;
    var startTime = null;

    function step(now) {
      if (stopped) return;
      if (startTime === null) startTime = now;
      var t = Math.min(1, (now - startTime) / duration);
      var eased = 1 - Math.pow(1 - t, 3);
      offset = start + (target - start) * eased;
      track.style.transform = 'translateX(' + offset + 'px)';
      if (t < 1) {
        rafId = requestAnimationFrame(step);
      } else {
        manualAnimating = false;
        lastTime = null;
      }
    }
    rafId = requestAnimationFrame(step);
  }

  selector.querySelectorAll('.tab-btn-custom').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var cat = btn.dataset.cat;
      var containerWidth = marquee.getBoundingClientRect().width;
      var target = containerWidth / 2 - categoryStartX[cat];
      // Land on the nearest congruent position behind the current offset,
      // so the jump always scrolls the same direction the marquee already
      // moves instead of snapping backwards.
      while (target > offset) target -= sequenceWidth;
      while (target < offset - sequenceWidth) target += sequenceWidth;
      animateTo(target);
    });
  });

  stopLogoMarquee = function () {
    stopped = true;
    if (rafId !== null) cancelAnimationFrame(rafId);
  };
}

document.addEventListener('DOMContentLoaded', initLogoMarquee);
