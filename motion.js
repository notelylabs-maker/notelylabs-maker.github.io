// Notely AI website: motion for the whole page (after the opening film).
//  - giant word bands that slide sideways with scroll and skew with scroll speed
//  - a mirrored, reflected NOTELY band
//  - big section numbers with a line that draws across
//  - the background glow changes colour section by section
//  - cards tilt toward the pointer and rise in a stagger as their section scrolls in
//  - a smooth cursor ring (mouse only)
// Transform / opacity only, one requestAnimationFrame loop, off with Reduce Motion.
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };
  if (reduce) { document.documentElement.classList.add('still'); return; }
  document.documentElement.classList.add('moving');

  var bands = $$('.band'), mirrors = $$('.mirror'), numbers = $$('.secnum');
  var glowSections = $$('[data-glow]');
  var glow = document.getElementById('glow');
  var stagger = $$('.modes, .bento, .groups, .bignums, .plans, .facts');

  // Cards inside a stagger group get an index for their delay.
  stagger.forEach(function (g) {
    Array.prototype.slice.call(g.children).forEach(function (c, i) { c.style.setProperty('--k', i); c.classList.add('lift'); });
  });
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add('lifted'); io.unobserve(e.target);
      $$('[data-to]', e.target).forEach(countUp);
    });
  }, { rootMargin: '0px 0px -12% 0px' });
  stagger.concat(numbers).forEach(function (g) { io.observe(g); });

  // Big numbers count up from zero (0 stays 0, with a little flicker of digits first).
  function countUp(el) {
    var to = +el.getAttribute('data-to'), suffix = el.getAttribute('data-suffix') || '';
    var start = performance.now(), dur = to ? 1600 : 700;
    (function step(now) {
      var t = Math.min(1, (now - start) / dur), e = 1 - Math.pow(1 - t, 3);
      var v = to ? Math.round(to * e) : (t < 1 ? Math.floor(Math.random() * 10) : 0);
      el.textContent = v + suffix;
      if (t < 1) requestAnimationFrame(step);
    })(start);
  }

  var y = window.scrollY, lastY = y, velocity = 0, skew = 0;
  window.addEventListener('scroll', function () { y = window.scrollY; }, { passive: true });

  // Pointer: cursor ring and card tilt.
  var ring = null, rx = -100, ry = -100, tx = -100, ty = -100;
  if (fine) {
    // The ring IS the pointer: the system arrow is hidden, and a small dot sits exactly
    // where you point, so clicking stays precise.
    ring = document.createElement('div');
    ring.className = 'cursor-ring';
    ring.setAttribute('aria-hidden', 'true');
    document.body.appendChild(ring);
    var dot = document.createElement('div');
    dot.className = 'cursor-dot';
    dot.setAttribute('aria-hidden', 'true');
    document.body.appendChild(dot);
    document.documentElement.classList.add('own-cursor');
    window.addEventListener('pointermove', function (e) {
      tx = e.clientX; ty = e.clientY;
      if (rx < -50) { rx = tx; ry = ty; } // first move: start where the mouse is
      dot.style.transform = 'translate3d(' + tx + 'px,' + ty + 'px,0)';
      ring.classList.remove('away'); dot.classList.remove('away');
    }, { passive: true });
    // Leaving the window: hide them (the system pointer takes over outside).
    document.addEventListener('pointerleave', function () { ring.classList.add('away'); dot.classList.add('away'); });
    document.documentElement.addEventListener('mouseleave', function () { ring.classList.add('away'); dot.classList.add('away'); });
    window.addEventListener('pointerdown', function () { ring.classList.add('press'); });
    window.addEventListener('pointerup', function () { ring.classList.remove('press'); });
    document.addEventListener('pointerover', function (e) {
      var hot = e.target.closest && e.target.closest('a, button, .cta, .ghost, .tile, .mode, .plan, .fact-row');
      ring.classList.toggle('hot', !!hot);
    });
    $$('.tile, .mode, .plan, .group').forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
        card.style.setProperty('--tx', (px * 8).toFixed(2) + 'deg');
        card.style.setProperty('--ty', (py * -8).toFixed(2) + 'deg');
      });
      card.addEventListener('pointerleave', function () {
        card.style.setProperty('--tx', '0deg'); card.style.setProperty('--ty', '0deg');
      });
    });
  }

  var colors = { violet: '123,92,255', blue: '47,139,255', pink: '214,64,159', green: '95,208,143' };
  var current = 'violet';

  function frame() {
    // Scroll speed → a gentle skew on the bands (eases back when you stop).
    velocity = y - lastY; lastY = y;
    skew += ((fine ? Math.max(-12, Math.min(12, velocity * 0.25)) : 0) - skew) * 0.12;

    var vh = window.innerHeight;
    bands.forEach(function (b, i) {
      var r = b.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      var t = (r.top + r.height / 2 - vh / 2) / vh; // -1 … 1 across the screen
      var dir = b.classList.contains('rev') ? -1 : 1;
      b.firstElementChild.style.transform = 'translate3d(' + (dir * t * 28 - 10).toFixed(2) + 'vw,0,0) skewX(' + (-skew * dir).toFixed(2) + 'deg)';
    });
    mirrors.forEach(function (m) {
      var r = m.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      var t = (r.top + r.height / 2 - vh / 2) / vh;
      m.style.setProperty('--m', t.toFixed(3));
    });

    // The glow takes the colour of the section in the middle of the screen.
    for (var i = 0; i < glowSections.length; i++) {
      var r2 = glowSections[i].getBoundingClientRect();
      if (r2.top < vh * .55 && r2.bottom > vh * .45) {
        var c = glowSections[i].getAttribute('data-glow');
        if (c !== current && glow) { current = c; glow.style.setProperty('--glow', colors[c] || colors.violet); }
        break;
      }
    }

    if (ring) {
      rx += (tx - rx) * 0.38; ry += (ty - ry) * 0.38; // snappy, so it feels like the pointer
      ring.style.transform = 'translate3d(' + rx.toFixed(1) + 'px,' + ry.toFixed(1) + 'px,0)';
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
