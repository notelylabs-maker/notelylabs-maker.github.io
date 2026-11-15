// Notely AI website motion. Everything is transform/opacity only, and it all switches off with Reduce Motion.
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var root = document.documentElement;
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };

  // ---------- smooth scrolling ----------
  var lenis = null;
  // Mouse and trackpad only: phones already scroll smoothly, and Lenis fights touch scrolling there.
  if (!reduce && fine && window.Lenis) {
    try {
      lenis = new window.Lenis({ duration: 1.15, easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); }, smoothWheel: true });
      var raf = function (time) { lenis.raf(time); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
      window.notelyLenis = lenis;
    } catch (e) { lenis = null; }
  }
  // In-page links glide to their section (under the sticky bar).
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      var target = id.length > 1 && document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { offset: -64 });
      else target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
      history.replaceState(null, '', id);
    });
  });

  // ---------- drifting study symbols ----------
  var amb = document.getElementById('ambient');
  if (amb && !reduce) {
    var glyphs = ['π', '∑', 'x²', '✎', '√', '∫', 'Δ', '≈', '∞', 'θ', '✦', 'a²+b²', '÷', '%'];
    var count = window.innerWidth < 640 ? 12 : 22;
    for (var i = 0; i < count; i++) {
      var s = document.createElement('span');
      s.textContent = glyphs[i % glyphs.length];
      var dur = 22 + Math.random() * 22;
      s.style.left = (Math.random() * 96) + '%';
      s.style.fontSize = (16 + Math.random() * 18) + 'px';
      s.style.animationDuration = dur + 's';
      s.style.animationDelay = (-Math.random() * dur) + 's';
      s.style.setProperty('--o', (0.07 + Math.random() * 0.1).toFixed(2));
      s.style.setProperty('--r', ((Math.random() < 0.5 ? -1 : 1) * (40 + Math.random() * 120)).toFixed(0) + 'deg');
      amb.appendChild(s);
    }
  }

  // ---------- headings reveal word by word ----------
  $$('h2.rv').forEach(function (h) {
    var w = 0;
    var parts = [];
    Array.prototype.slice.call(h.childNodes).forEach(function (node) {
      if (node.nodeType === 3) {
        node.textContent.split(/(\s+)/).forEach(function (t) {
          if (!t) return;
          if (/^\s+$/.test(t)) { parts.push(document.createTextNode(' ')); return; }
          var span = document.createElement('span');
          span.className = 'wd'; span.style.setProperty('--w', w++);
          var inner = document.createElement('span');
          inner.className = 'wi'; inner.textContent = t;
          span.appendChild(inner);
          parts.push(span);
        });
      } else {
        var wrap = document.createElement('span');
        wrap.className = 'wd'; wrap.style.setProperty('--w', w++);
        var innerWrap = document.createElement('span');
        innerWrap.className = 'wi';
        innerWrap.appendChild(node.cloneNode(true));
        wrap.appendChild(innerWrap);
        parts.push(wrap);
      }
    });
    h.textContent = '';
    parts.forEach(function (p) { h.appendChild(p); });
    h.classList.remove('rv');
    h.classList.add('split');
  });
  $$('.group, .tier').forEach(function (g) { $$('li', g).forEach(function (li, i) { li.style.setProperty('--i', i); }); });

  // ---------- intro on load ----------
  var ready = function () { root.classList.add('ready'); };
  requestAnimationFrame(function () { requestAnimationFrame(ready); });
  setTimeout(ready, 120); // in case animation frames are paused

  // ---------- scroll: progress bar, nav, hero drift ----------
  var bar = document.getElementById('progress');
  var nav = $('nav');
  var heroInner = $('.hero-inner');
  var hint = $('.scroll-hint');
  // Measured once: on iPhone the address bar changes innerHeight while you scroll, which made the hero jump.
  var heroHeight = window.innerHeight;
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      var y = window.scrollY || window.pageYOffset;
      var max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      if (bar) bar.style.transform = 'scaleX(' + Math.min(1, y / max).toFixed(4) + ')';
      if (nav) nav.classList.toggle('scrolled', y > 12);
      if (hint) hint.classList.toggle('gone', y > 24);
      if (heroInner && !reduce) {
        // A gentle drift that is fully faded before it can reach the next section.
        var p = Math.min(1, y / (heroHeight * 0.55));
        heroInner.style.transform = 'translate3d(0,' + (Math.min(y, heroHeight) * 0.12).toFixed(1) + 'px,0) scale(' + (1 - p * 0.05).toFixed(4) + ')';
        heroInner.style.opacity = (1 - p).toFixed(3);
        heroInner.style.visibility = p >= 1 ? 'hidden' : 'visible';
      }
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ---------- pointer: card spotlight, icon lean, magnetic buttons ----------
  if (fine && !reduce) {
    $$('.spot').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        el.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
    var mark = $('.hero .mark');
    if (mark) {
      var halo = $('.halo', mark), icon = $('img', mark);
      window.addEventListener('pointermove', function (e) {
        var dx = (e.clientX / window.innerWidth - 0.5), dy = (e.clientY / window.innerHeight - 0.5);
        if (icon) icon.style.translate = (dx * 18).toFixed(1) + 'px ' + (dy * 14).toFixed(1) + 'px';
        if (halo) halo.style.translate = (dx * -26).toFixed(1) + 'px ' + (dy * -20).toFixed(1) + 'px';
      }, { passive: true });
    }
    $$('.cta, .ghost').forEach(function (b) {
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) * 0.18, y = (e.clientY - r.top - r.height / 2) * 0.3;
        b.style.translate = x.toFixed(1) + 'px ' + y.toFixed(1) + 'px';
      });
      b.addEventListener('pointerleave', function () { b.style.translate = '0px 0px'; });
    });
  }

  // ---------- Tutor demo (types, thinks, answers; replays while on screen) ----------
  var typed = document.getElementById('typed');
  var ph = document.getElementById('ph');
  var typeTimer = null, loopTimer = null, demoVisible = false, idle = false;
  function typeText() {
    if (!typed) return;
    var text = typed.getAttribute('data-text');
    clearInterval(typeTimer);
    typed.textContent = '';
    if (ph) ph.style.display = 'none';
    if (reduce) { typed.textContent = text; return; }
    var n = 0;
    setTimeout(function () {
      typeTimer = setInterval(function () {
        n++;
        typed.textContent = text.slice(0, n);
        if (n >= text.length) clearInterval(typeTimer);
      }, 32);
    }, 650);
  }
  var demo = document.getElementById('demo');
  var startTimer = null;
  function play() {
    if (!demo) return;
    clearTimeout(loopTimer);
    clearTimeout(startTimer);
    var wasPlaying = demo.classList.contains('play');
    demo.classList.remove('play'); // the last answer fades away first
    clearInterval(typeTimer);
    if (typed && wasPlaying) typed.textContent = '';
    startTimer = setTimeout(function () {
      void demo.offsetWidth; // restart the CSS animations
      demo.classList.add('play');
      typeText();
      if (!reduce) loopTimer = setTimeout(function () { if (demoVisible) play(); else idle = true; }, 11000);
    }, wasPlaying ? 700 : 0);
  }
  var replay = document.getElementById('replay');
  if (replay) replay.addEventListener('click', play);

  // ---------- count up ----------
  function countUp(el) {
    var to = +el.getAttribute('data-count'), suffix = el.getAttribute('data-suffix') || '';
    if (reduce) return;
    var start = null;
    var step = function (t) {
      if (start === null) start = t;
      var p = Math.min(1, (t - start) / 1400);
      var eased = 1 - Math.pow(1 - p, 4);
      el.textContent = Math.round(to * eased) + suffix;
      if (p < 1) requestAnimationFrame(step);
    };
    el.textContent = '0' + suffix;
    requestAnimationFrame(step);
  }

  // ---------- reveal on scroll ----------
  var items = $$('.rv, .split');
  function settle(el) {
    // After it has appeared, drop the reveal class so hover motion feels instant.
    var d = parseFloat(getComputedStyle(el).getPropertyValue('--d')) || 0;
    if (!el.classList.contains('rv')) return;
    setTimeout(function () { el.classList.remove('rv'); }, 1100 + d * 1000);
  }
  if (!('IntersectionObserver' in window)) {
    items.forEach(function (el) { el.classList.add('in'); });
    play();
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      var el = e.target;
      el.classList.add('in');
      $$('[data-count]', el).forEach(countUp);
      settle(el);
      io.unobserve(el);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  items.forEach(function (el) { io.observe(el); });

  if (demo) {
    var started = false;
    var dio = new IntersectionObserver(function (entries) {
      demoVisible = entries[0].isIntersecting;
      if (demoVisible && (!started || idle)) { started = true; idle = false; play(); }
    }, { threshold: 0.3 });
    dio.observe(demo);
  }

  // ---------- opening animation: remove when finished; any click or key skips it ----------
  var intro = document.getElementById('intro');
  if (intro && !root.classList.contains('no-intro')) {
    var done = function () { if (intro.parentNode) intro.parentNode.removeChild(intro); };
    var skip = function () { intro.classList.add('skip'); setTimeout(done, 500); };
    intro.addEventListener('click', skip);
    window.addEventListener('keydown', skip, { once: true });
    setTimeout(done, 2900);
  } else if (intro && intro.parentNode) { intro.parentNode.removeChild(intro); }
})();
