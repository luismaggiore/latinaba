// Client Portfolio (Logos by Category): builds one category-ordered
// sequence of real client logos (logos/webp/<category>/*.webp), duplicates
// it for a seamless loop, and auto-scrolls it via translateX. A label row
// scrolls in lockstep above the tiles, one caption anchored at the exact x
// where each category begins. The category selector reflects whichever
// category sits at the center of the marquee on every frame, and clicking a
// selector tweens the marquee so that category's start lands centered too
// (narrower categories are shorter than half the viewport, so landing them
// at the left edge instead would put the center-detector into the next
// category right after the jump).

// Tracks the currently running rAF loop across repeated swup page visits,
// so re-entering the experience page never stacks up multiple loops.
let stopLogoMarquee = null;

function initLogoMarquee() {
  if (stopLogoMarquee) {
    stopLogoMarquee();
    stopLogoMarquee = null;
  }

  // Every entry below has a real file in logos/webp/<key>/. Client-list
  // rows without a matching logo file (e.g. NXTHERA's sibling VERVE, or
  // KOWA RESEARCH INSTITUTE alongside plain KOWA) are intentionally left
  // out rather than shown as a placeholder.
  var categories = [
    {
      key: 'cro', label: 'CRO', logos: [
        ['advanced.webp', 'Advanced Clinical'],
        ['aptiv.webp', 'Aptiv'],
        ['barnettt.webp', 'Barnett International'],
        ['biomapas.webp', 'Biomapas'],
        ['buenosairesskin.webp', 'Buenos Aires Skin'],
        ['caidya.webp', 'Caidya'],
        ['confidence.webp', 'Confidence Pharmaceutical Research'],
        ['cssi.webp', 'CSSi Life Sciences'],
        ['ergomed.webp', 'Ergomed'],
        ['ethicacro.webp', 'Ethica Clinical Research'],
        ['fhiclinical.webp', 'FHI Clinical'],
        ['gcp-service.webp', 'GCP Service'],
        ['georgeclinical.webp', 'George Clinical'],
        ['medtrials.webp', 'MedTrials'],
        ['namsa.webp', 'NAMSA'],
        ['nordicbioscience.webp', 'Nordic Bioscience'],
        ['ora.webp', 'ORA'],
        ['qed.webp', 'QED Pharmaceutical Services'],
        ['qmed.webp', 'Qmed'],
        ['rti.webp', 'RTI'],
        ['trialrunners.webp', 'Trial Runners'],
        ['unensayoparami.webp', 'DAMIC SRL'],
        ['worldwideclinical.webp', 'Worldwide Clinical Trials']
      ]
    },
    {
      key: 'pharma', label: 'Pharma', logos: [
        ['abscience.webp', 'AB Science'],
        ['ascend.webp', 'Ascend Therapeutics'],
        ['avadel.webp', 'Avadel'],
        ['besins-healthcare.webp', 'Besins Healthcare'],
        ['bridgebio.webp', 'BridgeBio'],
        ['grunenthal.webp', 'Grunenthal'],
        ['hdtbio.webp', 'HDT Bio'],
        ['intercept.webp', 'Intercept Pharmaceuticals'],
        ['kowa.webp', 'Kowa'],
        ['larocheposay.webp', 'La Roche-Posay'],
        ['norgreen.webp', 'Norgreen'],
        ['octapharma.webp', 'Octapharma'],
        ['oncotelic.webp', 'Oncotelic'],
        ['pantheryx.webp', 'PanTheryx'],
        ['raffo.webp', 'Laboratorios Raffo'],
        ['reigjofre.webp', 'Reig Jofre'],
        ['takeda.webp', 'Takeda Vaccines']
      ]
    },
    {
      key: 'biotech', label: 'Biotech', logos: [
        ['atara.webp', 'Atara Biotherapeutics'],
        ['bluebirdbio.webp', 'Bluebird Bio'],
        ['elea.webp', 'Laboratorio Elea'],
        ['opko.webp', 'OPKO'],
        ['vertex.webp', 'Vertex']
      ]
    },
    {
      key: 'device', folder: 'medical-device', label: 'Medical Device', logos: [
        ['abionic.webp', 'Abionic'],
        ['boston-scientific.webp', 'Boston Scientific'],
        ['sensimed.webp', 'Sensimed'],
        ['trivascular.webp', 'TriVascular']
      ]
    },
    {
      key: 'academic', folder: 'ngo', label: 'Academic / NGO / Gov.', logos: [
        ['infant.webp', 'Fundación INFANT'],
        ['micyrn.webp', 'MICYRN'],
        ['nih.webp', 'NIH'],
        ['ottawa-hospital.webp', 'Ottawa Hospital Research Institute'],
        ['uhn.webp', 'University Health Network']
      ]
    }
  ];
  categories.forEach(function (cat) { if (!cat.folder) cat.folder = cat.key; });
  categories.forEach(function (cat) { cat.count = cat.logos.length; });

  var marquee = document.getElementById('logo-marquee');
  var track = document.getElementById('logo-marquee-track');
  var tilesEl = document.getElementById('logo-marquee-tiles');
  var labelsEl = document.getElementById('logo-marquee-labels');
  var selector = document.getElementById('logo-category-selector');
  if (!marquee || !track || !tilesEl || !labelsEl || !selector) return;

  function renderLogoTile(catKey, folder, file, alt) {
    return (
      '<div class="logo-tile" data-cat="' + catKey + '">' +
      '<img src="logos/webp/' + folder + '/' + file + '" alt="' + alt + '" loading="lazy" />' +
      '</div>'
    );
  }

  var sequenceHtml = categories
    .map(function (cat) {
      return cat.logos.map(function (entry) { return renderLogoTile(cat.key, cat.folder, entry[0], entry[1]); }).join('');
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
