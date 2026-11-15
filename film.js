// Notely AI: the opening "film". One pinned stage you scroll through, in four scenes:
//   1. A giant NOTELY and a field of floating note cards (math, Tutor, flashcard, sticky…).
//   2. "84": Live Math. You fly forward through the cards as you scroll.
//   3. "Ask what you wrote": construction lines draw in.
//   4. The NOTELY AI logotype, built from lines (like a studio ident).
// Everything is transform / opacity / clip-path, eased toward the scroll position every frame,
// so it stays smooth even with fast scrolling. Reduce Motion shows the finished frame.
(function () {
  var film = document.getElementById('film');
  if (!film) return;
  var root = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  if (reduce) { root.classList.add('film-still'); return; }
  root.classList.add('film-on');

  var $ = function (s) { return film.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(film.querySelectorAll(s)); };
  var giant = $('.giant'), glowA = $('.glow-a'), glowB = $('.glow-b');
  var scenes = $$('.scene'), cards = $$('.fcard');
  var grid = $$('.grid-line'), sparks = $$('.spark'), logo = $('.logotype');
  cards.forEach(function (c, i) { c.firstElementChild.style.setProperty('--i', i); });
  var logoLines = $$('.logo-line'), bigNum = $('.big-num');

  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function ease(t) { t = clamp(t); return 1 - Math.pow(1 - t, 3); }
  function inOut(t) { t = clamp(t); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function seg(p, a, b) { return ease((p - a) / (b - a)); }
  function band(p, a, b, fade) { // 0 → 1 → 0 across a scene, with soft edges
    return Math.min(seg(p, a, a + fade), 1 - seg(p, b - fade, b));
  }

  var target = 0, p = 0, mx = 0, my = 0, sx = 0, sy = 0, running = false, fitTop = 0;
  var top0 = 0, total = 1;
  function measure() {
    var r = film.getBoundingClientRect();
    top0 = r.top + window.scrollY;
    // Use the large viewport height so the address bar sliding away doesn't make it jump.
    total = Math.max(1, film.offsetHeight - Math.max(window.innerHeight, document.documentElement.clientHeight));
  }
  function read() {
    target = clamp((window.scrollY - top0) / total);
    kick();
  }
  var lastW = window.innerWidth;
  window.addEventListener('scroll', read, { passive: true });
  window.addEventListener('resize', function () {
    if (window.innerWidth !== lastW) { lastW = window.innerWidth; measure(); }
    read();
  });
  measure();
  window.addEventListener('pointermove', function (e) {
    mx = e.clientX / window.innerWidth - .5; my = e.clientY / window.innerHeight - .5; kick();
  }, { passive: true });

  function kick() { if (!running) { running = true; requestAnimationFrame(frame); } }

  // Grid lines: each draws with stroke-dashoffset (lengths measured once).
  grid.concat(logoLines).forEach(function (l) {
    var len = l.getTotalLength ? l.getTotalLength() : 1000;
    l.style.strokeDasharray = len; l.style.strokeDashoffset = len; l._len = len;
  });

  function frame() {
    p += (target - p) * 0.085;
    sx += (mx - sx) * 0.06; sy += (my - sy) * 0.06;
    var still = Math.abs(target - p) < 0.0004 && Math.abs(mx - sx) < 0.001 && Math.abs(my - sy) < 0.001;

    // --- the note cards: you fly forward through them as you scroll
    var wide = window.innerWidth > 1000;
    var W = window.innerWidth, H = window.innerHeight;
    var toLeft = seg(p, .22, .32) * (1 - seg(p, .46, .56));
    var away = seg(p, .76, .9);
    var x = 0;
    var travel = 1500 * seg(p, 0, .8);      // how far the camera has flown (px)
    var dim = 1 - .55 * seg(p, .22, .34);   // quieter behind the Tutor text
    // The text block on screen right now (cards must never pass over it).
    var textBoxes = [];
    for (var si = 0; si < scenes.length - 1; si++) {
      if (+scenes[si].style.opacity > .05) textBoxes.push(scenes[si].getBoundingClientRect());
    }
    cards.forEach(function (c) {
      var d = c.dataset;
      var bx = +(wide ? d.x : (d.px || d.x)), by = +(wide ? d.y : (d.py || d.y)), bz = +(wide ? d.z : (d.pz || d.z));
      var z = bz + travel;
      // Closer cards lean more with the mouse (depth parallax).
      var depth = (z + 700) / 1000;
      var cx = bx / 100 * W + sx * 60 * depth, cy = by / 100 * H + sy * 40 * depth - p * 0.12 * H;
      var near = clamp((z - 420) / 380);        // fades as it passes the camera
      var farIn = clamp((z + 900) / 400);       // fades in from the distance
      var o = farIn * (1 - near) * dim * (1 - away);
      c.style.transform = 'translate3d(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px,' + Math.min(z, 860).toFixed(1) + 'px)';
      if (o > 0 && textBoxes.length) {
        // Fade out as it comes within 40px of the text, gone before it touches it.
        var r = c.firstElementChild.getBoundingClientRect();
        for (var ti = 0; ti < textBoxes.length; ti++) {
          var tb = textBoxes[ti];
          var gapX = Math.max(tb.left - r.right, r.left - tb.right);
          var gapY = Math.max(tb.top - r.bottom, r.top - tb.bottom);
          var gap = Math.max(gapX, gapY);
          if (gap < 40) o *= clamp(gap / 40);
        }
      }
      c.style.opacity = o.toFixed(3);
      c.style.visibility = o < .01 ? 'hidden' : 'visible';
    });

    // --- giant word behind: drifts, then makes room for the logotype
    var gx = -8 * p + sx * -2;
    giant.style.transform = 'translate3d(' + gx.toFixed(2) + 'vw,' + (sy * -1.5).toFixed(2) + 'vh,0) scale(' + (1 + .06 * seg(p, 0, .5)).toFixed(4) + ')';
    giant.style.opacity = (1 - seg(p, .66, .76)).toFixed(3);

    // --- glow colours per scene (violet → blue → pink-violet)
    glowA.style.transform = 'translate3d(' + (x * .8).toFixed(2) + 'vw,0,0) scale(' + (1 + .25 * toLeft).toFixed(3) + ')';
    glowA.style.opacity = (0.85 - .4 * away).toFixed(3);
    glowB.style.opacity = (.6 * seg(p, .3, .5)).toFixed(3);

    // --- scenes (text)
    var spans = [[0, .3], [.3, .7], [.7, 1.01]];
    scenes.forEach(function (el, i) {
      var v = band(p, spans[i][0], spans[i][1], i === 0 ? .001 : .05);
      if (i === 0) v = 1 - seg(p, .2, .3);
      el.style.opacity = v.toFixed(3);
      el.style.transform = 'translate3d(0,' + ((1 - v) * (i % 2 ? -24 : 24)).toFixed(1) + 'px,0)';
      el.style.visibility = v < .01 ? 'hidden' : 'visible';
    });
    if (bigNum) {
      var n = seg(p, .26, .36);
      bigNum.style.transform = 'translate3d(' + ((1 - n) * 8).toFixed(2) + 'vw,0,0)';
    }

    // --- construction lines (scene 3 and the logotype) and sparkles
    grid.forEach(function (l, i) {
      var d = seg(p, .34 + i * .012, .52 + i * .012) * (1 - seg(p, .96, 1));
      l.style.strokeDashoffset = (l._len * (1 - d)).toFixed(1);
    });
    logoLines.forEach(function (l, i) {
      var d = seg(p, .78 + i * .01, .92 + i * .01);
      l.style.strokeDashoffset = (l._len * (1 - d)).toFixed(1);
    });
    var lg = seg(p, .84, .95);
    logo.style.opacity = lg.toFixed(3);
    logo.style.transform = 'translate3d(0,' + ((1 - lg) * 30).toFixed(1) + 'px,0) scale(' + (0.94 + .06 * lg).toFixed(4) + ')';
    var lc = 'inset(0 ' + ((1 - seg(p, .82, .96)) * 100).toFixed(2) + '% 0 0)';
    logo.style.clipPath = lc; logo.style.webkitClipPath = lc;
    sparks.forEach(function (sp, i) {
      var on = seg(p, .36 + i * .03, .42 + i * .03);
      sp.style.opacity = (on * (.4 + .6 * Math.abs(Math.sin((p * 40) + i)))).toFixed(3);
    });

    if (still) { running = false; return; }
    requestAnimationFrame(frame);
  }

  read();
  p = target;
  kick();
  // For the site check: draw the current scroll position at once.
  window.notelyFilmSettle = function () { read(); p = target; sx = mx; sy = my; frame(); };
})();
