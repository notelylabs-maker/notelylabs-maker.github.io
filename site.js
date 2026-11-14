// Notely AI website motion: drifting symbols, scroll reveals and the Tutor demo.
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement;

  // Drifting study symbols, like the app's home tabs.
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

  // Intro sequence on load.
  requestAnimationFrame(function () { requestAnimationFrame(function () { root.classList.add('ready'); }); });

  // Typing in the Tutor ask box.
  var typed = document.getElementById('typed');
  var ph = document.getElementById('ph');
  var typeTimer = null;
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
  function play() {
    if (!demo) return;
    demo.classList.remove('play');
    void demo.offsetWidth; // restart the CSS animations
    demo.classList.add('play');
    typeText();
  }
  var replay = document.getElementById('replay');
  if (replay) replay.addEventListener('click', play);

  // Reveal on scroll.
  var items = document.querySelectorAll('.rv');
  if (!('IntersectionObserver' in window)) {
    items.forEach(function (el) { el.classList.add('in'); });
    play();
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      io.unobserve(e.target);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  items.forEach(function (el) { io.observe(el); });

  if (demo) {
    var dio = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { play(); dio.disconnect(); }
    }, { threshold: 0.35 });
    dio.observe(demo);
  }
})();
