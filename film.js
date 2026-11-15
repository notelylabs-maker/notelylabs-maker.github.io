// Notely AI: the opening "film". One pinned stage you scroll through, in four scenes:
//   1. A giant NOTELY behind the iPad, the page starts writing itself.
//   2. "84": Live Math answers the sum you wrote.
//   3. "Ask what you wrote": construction lines draw in, Tutor's answer slides up.
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
  var device = $('.device'), giant = $('.giant'), glowA = $('.glow-a'), glowB = $('.glow-b');
  var scenes = $$('.scene'), inkLines = $$('.ink-line'), answer = $('.live-answer');
  var tutor = $('.tutor-card'), grid = $$('.grid-line'), sparks = $$('.spark'), logo = $('.logotype');
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

    // --- the iPad: centre → left for "84" → centre for Tutor → away for the logotype
    var wide = window.innerWidth > 1000; // side-by-side only where there's room
    var flat = !wide || coarse; // phones: move and scale only (Safari mishandles 3D turns here)
    var toLeft = seg(p, .22, .32) * (1 - seg(p, .46, .56));
    var away = seg(p, .76, .9);
    // Scene 1: beside the headline. Scene 2: left of the big 84. Scene 3: centre.
    var x = wide ? 17 * (1 - seg(p, .16, .3)) - 24 * toLeft + 17 * seg(p, .48, .58) * (1 - away) : 0; // vw
    var ry = -16 * toLeft + 10 * seg(p, .5, .62) * (1 - away) + sx * 10;
    var rx = 4 + sy * -8 - 6 * away;
    var s = (0.92 + 0.08 * seg(p, 0, .12)) * (1 - 0.35 * away);
    var y = 4 * (1 - seg(p, 0, .12)) - 10 * away; // vh
    if (!wide) {
      // Phones: fit the iPad into the space between the top bar and the text that's showing,
      // so it can never cover the words, whatever the phone's size.
      var textTop = Infinity;
      for (var si = 0; si < 3; si++) {
        if (+scenes[si].style.opacity > 0.02) textTop = Math.min(textTop, scenes[si].offsetTop);
      }
      if (textTop === Infinity) textTop = window.innerHeight * 0.6;
      fitTop += ((textTop - fitTop) * (fitTop === 0 ? 1 : 0.15));
      var top = 70, bottom = fitTop - 18;
      var h = device.offsetHeight || 1;
      var fit = Math.max(0.35, Math.min(1, (bottom - top) / h));
      var dy = (top + (bottom - top) / 2) - (device.offsetTop + h / 2);
      var ps = fit * (1 - 0.35 * away);
      device.style.transform = 'translate3d(0,' + (dy - 80 * away).toFixed(1) + 'px,0) scale(' + ps.toFixed(4) + ')';
    } else device.style.transform = flat
      ? 'translate3d(' + x.toFixed(2) + 'vw,' + y.toFixed(2) + 'vh,0) scale(' + s.toFixed(4) + ')'
      : 'translate3d(' + x.toFixed(2) + 'vw,' + y.toFixed(2) + 'vh,0) perspective(1400px) rotateY(' + ry.toFixed(2) + 'deg) rotateX(' + rx.toFixed(2) + 'deg) scale(' + s.toFixed(4) + ')';
    device.style.opacity = (1 - seg(p, .8, .9)).toFixed(3);

    // --- giant word behind: drifts, then makes room for the logotype
    var gx = -8 * p + sx * -2;
    giant.style.transform = 'translate3d(' + gx.toFixed(2) + 'vw,' + (sy * -1.5).toFixed(2) + 'vh,0) scale(' + (1 + .06 * seg(p, 0, .5)).toFixed(4) + ')';
    giant.style.opacity = ((1 - .7 * toLeft) * (1 - seg(p, .7, .8))).toFixed(3);

    // --- glow colours per scene (violet → blue → pink-violet)
    glowA.style.transform = 'translate3d(' + (x * .8).toFixed(2) + 'vw,0,0) scale(' + (1 + .25 * toLeft).toFixed(3) + ')';
    glowA.style.opacity = (0.85 - .4 * away).toFixed(3);
    glowB.style.opacity = (seg(p, .22, .32) * (1 - seg(p, .5, .6)) + .5 * seg(p, .55, .7)).toFixed(3);

    // --- handwriting on the page
    inkLines.forEach(function (el) {
      var a = +el.dataset.a, b = +el.dataset.b;
      var r = seg(p, a, b);
      var cp = 'inset(-20% ' + ((1 - r) * 100).toFixed(2) + '% -20% -2%)';
      el.style.clipPath = cp; el.style.webkitClipPath = cp;
    });
    var live = seg(p, .33, .38);
    answer.style.opacity = live.toFixed(3);
    answer.style.transform = 'translateY(' + ((1 - live) * 8).toFixed(2) + 'px) scale(' + (0.8 + .2 * live).toFixed(3) + ')';
    var t = seg(p, .58, .68);
    tutor.style.transform = 'translate3d(0,' + ((1 - t) * 110).toFixed(2) + '%,0)';
    tutor.style.opacity = t.toFixed(3);

    // --- scenes (text)
    var spans = [[0, .22], [.22, .48], [.48, .74], [.74, 1.01]];
    scenes.forEach(function (el, i) {
      var v = band(p, spans[i][0], spans[i][1], i === 0 ? .001 : .05);
      if (i === 0) v = 1 - seg(p, .14, .22);
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
      var d = seg(p, .5 + i * .012, .66 + i * .012) * (1 - seg(p, .96, 1));
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
      var on = seg(p, .5 + i * .03, .56 + i * .03);
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
