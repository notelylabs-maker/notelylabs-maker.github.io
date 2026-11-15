// Notely AI: the 3D opening. A real-time iPad and Apple Pencil in the Notely glow.
// As you scroll through the pinned stage, the iPad turns, the Pencil writes on the page,
// Live Math answers by itself, and Notely Tutor's reply slides in.
// Falls back to the flat logo hero when WebGL or motion isn't available.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const stage = document.getElementById('stage');
const canvas = document.getElementById('ipad3d');
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function fallback() { document.documentElement.classList.add('no3d'); }

function start() {
  if (!stage || !canvas || reduce) return fallback();
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (e) { return fallback(); }
  document.documentElement.classList.add('has3d');
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 0, 11);

  // ---------- light: soft key, violet and blue rims (the Notely glow) ----------
  scene.add(new THREE.AmbientLight(0x8a7dff, 0.35));
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(3, 5, 8);
  scene.add(key);
  const violet = new THREE.PointLight(0x7b5cff, 60, 30);
  violet.position.set(-4, 2, -3);
  scene.add(violet);
  const blue = new THREE.PointLight(0x2f8bff, 45, 30);
  blue.position.set(4, -3, -2);
  scene.add(blue);

  // ---------- the page on the screen (drawn live, like ink) ----------
  const W = 1024, H = 1400;
  const page = document.createElement('canvas');
  page.width = W; page.height = H;
  const ctx = page.getContext('2d');
  const screenTex = new THREE.CanvasTexture(page);
  screenTex.colorSpace = THREE.SRGBColorSpace;
  screenTex.anisotropy = renderer.capabilities.getMaxAnisotropy();

  const lines = [
    { text: 'Biology · Ch. 4', x: 120, y: 200, size: 104, color: '#3b2a9e', from: 0.10, to: 0.18 },
    { text: 'Photosynthesis', x: 120, y: 370, size: 92, color: '#1c1c1e', from: 0.18, to: 0.27 },
    { text: 'makes glucose + O₂', x: 120, y: 460, size: 92, color: '#1c1c1e', from: 0.27, to: 0.36 },
    { text: '12 × 7 =', x: 120, y: 640, size: 100, color: '#1c1c1e', from: 0.40, to: 0.47 },
    { text: 'where does it happen?', x: 120, y: 820, size: 88, color: '#5b3bd6', from: 0.58, to: 0.68 }
  ];

  function ease(t) { return t < 0 ? 0 : t > 1 ? 1 : 1 - Math.pow(1 - t, 3); }
  function seg(p, a, b) { return ease((p - a) / (b - a)); }

  let lastDrawn = -1;
  function drawPage(p) {
    const q = Math.round(p * 400) / 400;
    if (q === lastDrawn) return;
    lastDrawn = q;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);
    // College-ruled paper.
    ctx.strokeStyle = 'rgba(84,120,190,0.28)';
    ctx.lineWidth = 2;
    for (let y = 300; y < H; y += 90) { ctx.beginPath(); ctx.moveTo(0, y + 12); ctx.lineTo(W, y + 12); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(220,70,90,0.35)';
    ctx.beginPath(); ctx.moveTo(92, 0); ctx.lineTo(92, H); ctx.stroke();

    // Handwriting, revealed left to right as the Pencil moves.
    lines.forEach(l => {
      const r = seg(q, l.from, l.to);
      if (r <= 0) return;
      ctx.font = `600 ${l.size}px Caveat, "Segoe Print", cursive`;
      const w = ctx.measureText(l.text).width;
      ctx.save();
      ctx.beginPath(); ctx.rect(l.x - 10, l.y - l.size, (w + 20) * r, l.size * 1.4); ctx.clip();
      ctx.fillStyle = l.color;
      ctx.fillText(l.text, l.x, l.y);
      ctx.restore();
    });

    // Live Math: the answer appears by itself, in the same handwriting.
    const m = seg(q, 0.49, 0.55);
    if (m > 0) {
      ctx.globalAlpha = m;
      ctx.font = '600 100px Caveat, cursive';
      ctx.fillStyle = '#5b3bd6';
      ctx.fillText('84', 120 + ctx.measureText('12 × 7 = ').width, 640);
      ctx.globalAlpha = 1;
    }

    // Notely Tutor's answer card slides up from the bottom of the screen.
    const t = seg(q, 0.74, 0.86);
    if (t > 0) {
      const cy = H - 40 - 360 * t;
      ctx.globalAlpha = Math.min(1, t * 1.4);
      const g = ctx.createLinearGradient(0, cy, 0, cy + 340);
      g.addColorStop(0, '#17133a'); g.addColorStop(1, '#07070d');
      roundRect(64, cy, W - 128, 320, 40, g);
      ctx.fillStyle = '#ffffff';
      ctx.font = '600 38px Inter, sans-serif';
      ctx.fillText('✦ Notely Tutor', 112, cy + 74);
      ctx.fillStyle = '#c9c4ff';
      ctx.font = '500 40px Inter, sans-serif';
      ctx.fillText('In the chloroplasts of', 112, cy + 150);
      ctx.fillText('plant cells, using sunlight. ✓', 112, cy + 205);
      const b = ctx.createLinearGradient(112, 0, 520, 0);
      b.addColorStop(0, '#6a4dff'); b.addColorStop(1, '#3d7bff');
      roundRect(112, cy + 240, 380, 56, 28, b);
      ctx.fillStyle = '#fff';
      ctx.font = '600 28px Inter, sans-serif';
      ctx.fillText('＋ Put it on my page', 140, cy + 277);
      ctx.globalAlpha = 1;
    }
    screenTex.needsUpdate = true;
  }

  function roundRect(x, y, w, h, r, fill) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
    ctx.fillStyle = fill; ctx.fill();
  }

  // Where the Pencil tip is on the page (0..1 of the page), following the writing.
  function tipOnPage(p) {
    for (const l of lines) {
      if (p >= l.from && p <= l.to) {
        ctx.font = `600 ${l.size}px Caveat, cursive`;
        const w = ctx.measureText(l.text).width;
        const r = (p - l.from) / (l.to - l.from);
        const wobble = Math.sin(p * 900) * 10;
        return { x: (l.x + w * r) / W, y: (l.y - l.size * 0.3 + wobble) / H, writing: true };
      }
    }
    return null;
  }

  // ---------- the iPad ----------
  const ipad = new THREE.Group();
  scene.add(ipad);
  const bodyW = 3.0, bodyH = 4.1, depth = 0.09;
  const shell = new THREE.Mesh(
    new RoundedBoxGeometry(bodyW, bodyH, depth, 8, 0.22),
    new THREE.MeshPhysicalMaterial({ color: 0x1b1a24, metalness: 0.85, roughness: 0.32, clearcoat: 0.6, clearcoatRoughness: 0.25 })
  );
  ipad.add(shell);
  const bezel = new THREE.Mesh(
    new RoundedBoxGeometry(bodyW - 0.06, bodyH - 0.06, 0.012, 6, 0.2),
    new THREE.MeshStandardMaterial({ color: 0x050507, roughness: 0.4 })
  );
  bezel.position.z = depth / 2;
  ipad.add(bezel);
  const screenW = bodyW - 0.26, screenH = bodyH - 0.26;
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(screenW, screenH),
    new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false })
  );
  screen.position.z = depth / 2 + 0.008;
  ipad.add(screen);
  // A faint glass reflection sweeping over the screen.
  const glare = new THREE.Mesh(
    new THREE.PlaneGeometry(screenW, screenH),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.05, depthWrite: false })
  );
  glare.position.z = depth / 2 + 0.012;
  ipad.add(glare);
  // Camera bump on the back.
  const cam = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.03, 32), new THREE.MeshStandardMaterial({ color: 0x0c0c12, metalness: 0.6, roughness: 0.2 }));
  cam.rotation.x = Math.PI / 2;
  cam.position.set(-bodyW / 2 + 0.32, bodyH / 2 - 0.32, -depth / 2 - 0.012);
  ipad.add(cam);

  // ---------- the Apple Pencil ----------
  const pencil = new THREE.Group();
  const white = new THREE.MeshPhysicalMaterial({ color: 0xf4f4f8, roughness: 0.35, clearcoat: 0.4 });
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 2.6, 6, 1), white);
  barrel.position.y = 1.45;
  pencil.add(barrel);
  const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.016, 0.26, 24), white);
  cone.position.y = 0.02;
  pencil.add(cone);
  const nib = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.006, 0.06, 16), new THREE.MeshStandardMaterial({ color: 0xd8d8de, roughness: 0.5 }));
  nib.position.y = -0.13;
  pencil.add(nib);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.055, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), white);
  cap.position.y = 2.75;
  pencil.add(cap);
  // The tip is at the group's origin (y = -0.16), so moving the group moves the tip.
  pencil.children.forEach(c => { c.position.y += 0.16; });
  scene.add(pencil);

  // ---------- sizing ----------
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Fit the iPad comfortably on any screen (phones are tall and narrow).
    camera.position.z = camera.aspect < 0.8 ? 15.5 : 11;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  // ---------- scroll + pointer ----------
  let progress = 0, smooth = 0, mx = 0, my = 0, sx = 0, sy = 0;
  const steps = Array.from(document.querySelectorAll('[data-step]'));
  const words = Array.from(document.querySelectorAll('.k'));
  window.addEventListener('pointermove', e => {
    mx = e.clientX / window.innerWidth - 0.5;
    my = e.clientY / window.innerHeight - 0.5;
  }, { passive: true });

  function readScroll() {
    const r = stage.getBoundingClientRect();
    const total = r.height - window.innerHeight;
    progress = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 0;
  }
  window.addEventListener('scroll', readScroll, { passive: true });
  readScroll();

  let visible = true;
  new IntersectionObserver(es => { visible = es[0].isIntersecting; }, { rootMargin: '200px' }).observe(stage);

  const tmp = new THREE.Vector3();
  const clock = new THREE.Clock();
  function frame() {
    requestAnimationFrame(frame);
    if (!visible) return;
    const time = clock.getElapsedTime();
    smooth += (progress - smooth) * 0.09;
    sx += (mx - sx) * 0.06; sy += (my - sy) * 0.06;
    const p = smooth;

    // The iPad: arrives turned away, faces you while you write, then leans back to show Tutor.
    const intro = seg(p, 0, 0.12);
    ipad.rotation.y = -0.9 * (1 - intro) + 0.22 * seg(p, 0.7, 1) + sx * 0.35 + Math.sin(time * 0.5) * 0.03;
    ipad.rotation.x = -0.28 * (1 - intro) - 0.08 + sy * 0.25 + Math.cos(time * 0.4) * 0.02;
    ipad.rotation.z = 0.08 * (1 - intro);
    ipad.position.y = Math.sin(time * 0.8) * 0.05 + (1 - intro) * -0.25 + (camera.aspect < 0.8 ? 1.2 : 0);
    ipad.position.x = camera.aspect < 0.8 ? 0 : 1.45;
    const s = 0.85 + 0.15 * intro;
    ipad.scale.setScalar(s);

    drawPage(p);

    // The Pencil: floats beside the iPad, glides onto the page and writes, then lifts away.
    ipad.updateMatrixWorld();
    const tip = tipOnPage(p);
    const onPage = seg(p, 0.06, 0.12) * (1 - seg(p, 0.68, 0.76));
    let target;
    if (tip) {
      tmp.set((tip.x - 0.5) * screenW, (0.5 - tip.y) * screenH, depth / 2 + 0.02);
      target = ipad.localToWorld(tmp.clone());
    } else {
      tmp.set(screenW * 0.25, -screenH * 0.1, depth / 2 + 0.02);
      target = ipad.localToWorld(tmp.clone());
    }
    const rest = new THREE.Vector3(ipad.position.x + 2.1, -0.4 + Math.sin(time * 0.9) * 0.08, 1.2);
    pencil.position.lerpVectors(rest, target.add(new THREE.Vector3(0, 0, 0.05 + (tip ? 0 : 0.5))), onPage);
    pencil.rotation.z = -0.55 + onPage * 0.15 + Math.sin(time * 0.7) * 0.02;
    pencil.rotation.x = 0.5 - onPage * 0.2 + ipad.rotation.x;
    pencil.rotation.y = ipad.rotation.y * 0.6;
    pencil.visible = p > 0.02 && p < 0.97;

    // Glare drifts with the tilt; the rim lights breathe.
    glare.material.opacity = 0.03 + Math.max(0, Math.sin(ipad.rotation.y * 2 + 0.6)) * 0.07;
    violet.intensity = 55 + Math.sin(time * 0.6) * 10;
    blue.intensity = 40 + Math.cos(time * 0.5) * 8;

    renderer.render(scene, camera);

    // Big words and captions (outside WebGL, for crisp type).
    words.forEach((w, i) => {
      const a = [0.0, 0.38, 0.56][i], b = [0.38, 0.56, 1.01][i];
      const local = (p - a) / (b - a);
      const on = local >= 0 && local <= 1;
      const x = on ? (0.5 - local) * 30 : (local < 0 ? 40 : -40);
      w.style.transform = `translate3d(${x.toFixed(2)}vw,0,0)`;
      w.style.opacity = on ? Math.min(1, Math.min(local, 1 - local) * 6).toFixed(3) : '0';
    });
    steps.forEach((el, i) => {
      const a = [0.02, 0.38, 0.56][i], b = [0.38, 0.56, 1.01][i];
      const on = p >= a && p < b;
      el.classList.toggle('on', on);
    });
    const copy = document.querySelector('.stage-copy');
    if (copy) {
      const fade = 1 - seg(p, 0.03, 0.12);
      copy.style.opacity = fade.toFixed(3);
      copy.style.transform = `translate3d(0,${(-40 * (1 - fade)).toFixed(1)}px,0)`;
      copy.style.pointerEvents = fade < 0.2 ? 'none' : '';
    }
  }

  const go = () => { lastDrawn = -1; drawPage(0); frame(); };
  if (document.fonts && document.fonts.load) {
    Promise.all([document.fonts.load('600 64px Caveat'), document.fonts.load('600 38px Inter')]).then(go, go);
  } else { go(); }
}

try { start(); } catch (e) { fallback(); }
