/* BukuUtang — motion.js
 * Lapisan gerak v4: A parallax 5 layer + zoom-out akhir · B 2 marquee melingkar ·
 * C outline-terisi + pintu zoom-through · D spotlight kursor · E clip-path lingkaran.
 * Narasi: "masuk ke dalam buku".
 */
'use strict';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const liteMode = () =>
  (navigator.hardwareConcurrency || 8) <= 4 ||
  (navigator.deviceMemory || 8) <= 4 ||
  (navigator.connection && navigator.connection.saveData);

let motionOn = !reduceMotion();

export function isMotionOn() {
  return motionOn && !reduceMotion();
}

export function setMotion(on) {
  motionOn = on;
  document.documentElement.classList.toggle('bu-no-motion', !isMotionOn());
  try {
    localStorage.setItem('bukuutang:motion', on ? '1' : '0');
  } catch { /* abaikan */ }
  ScrollTrigger.getAll().forEach((st) => (isMotionOn() ? st.enable() : st.disable()));
}

function loadMotionPref() {
  try {
    const v = localStorage.getItem('bukuutang:motion');
    if (v === '0') motionOn = false;
    if (v === '1' && !reduceMotion()) motionOn = true;
  } catch { /* abaikan */ }
}

export function initMotion() {
  loadMotionPref();
  document.documentElement.classList.toggle('bu-no-motion', !isMotionOn());

  const toggle = document.getElementById('motion-toggle');
  if (toggle) {
    toggle.setAttribute('aria-pressed', String(isMotionOn()));
    toggle.querySelector('.mt-state').textContent = isMotionOn() ? 'nyala' : 'mati';
    toggle.addEventListener('click', () => {
      setMotion(!motionOn);
      toggle.setAttribute('aria-pressed', String(isMotionOn()));
      toggle.querySelector('.mt-state').textContent = isMotionOn() ? 'nyala' : 'mati';
    });
  }

  if (!isMotionOn()) {
    document.documentElement.classList.add('bu-static');
    /* Pintu tetap berfungsi tanpa gerak */
    const door = document.getElementById('bon-door');
    const hero = document.getElementById('hero');
    if (door && hero) {
      const openBook = () => {
        hero.style.display = 'none';
        document.getElementById('buku').scrollIntoView();
      };
      door.addEventListener('click', openBook);
      door.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openBook(); }
      });
    }
    return;
  }
  gsap.registerPlugin(ScrollTrigger);
  const lite = liteMode();
  if (lite) document.documentElement.classList.add('bu-lite');

  /* --- C: pintu zoom-through "BON" --- */
  const door = document.getElementById('bon-door');
  const hero = document.getElementById('hero');
  if (door && hero) {
    const openBook = () => {
      if (door.dataset.open === '1') return;
      door.dataset.open = '1';
      const tl = gsap.timeline();
      /* tinta dituang dulu, baru pintu terbuka */
      tl.to('#bon-word .fill', { clipPath: 'inset(0 0% 0 0)', duration: 0.45, ease: 'power2.inOut' })
        .to('#bon-word', { scale: 9, duration: 0.9, ease: 'power3.in', transformOrigin: '50% 60%' }, '-=0.1')
        .to(hero, { autoAlpha: 0, duration: 0.3 }, '-=0.25')
        .add(() => {
          hero.style.display = 'none';
          document.getElementById('buku').scrollIntoView({ behavior: 'auto' });
          document.getElementById('buku').classList.add('open');
          gsap.fromTo('#buku .bu-book', { clipPath: 'circle(0% at 50% 0%)' }, { clipPath: 'circle(140% at 50% 0%)', duration: 0.8, ease: 'power2.out' });
          ScrollTrigger.refresh();
        });
    };
    door.addEventListener('click', openBook);
    door.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openBook();
      }
    });
  }

  /* --- A: parallax 5 layer di hero --- */
  if (!lite) {
    gsap.utils.toArray('[data-plx]').forEach((el) => {
      const sp = parseFloat(el.dataset.plx || '0.2');
      gsap.to(el, {
        y: () => (1 - sp) * -160,
        x: () => sp * 60,
        rotate: () => sp * 14,
        ease: 'none',
        scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: 1 },
      });
    });
  }

  /* --- B: marquee melingkar — rotasi dasar CSS, skew ikut velocity --- */
  const rings = gsap.utils.toArray('.bu-ring-rotate');
  if (rings.length && !lite) {
    let skewSetter = rings.map((r) => gsap.quickSetter(r, 'skewX', 'deg'));
    let proxy = { skew: 0 };
    ScrollTrigger.create({
      onUpdate: (self) => {
        const v = gsap.utils.clamp(-12, 12, self.getVelocity() / -350);
        if (Math.abs(v) > Math.abs(proxy.skew)) {
          proxy.skew = v;
          gsap.to(proxy, { skew: 0, duration: 0.7, ease: 'power3', overwrite: true,
            onUpdate: () => skewSetter.forEach((s) => s(proxy.skew)) });
        }
      },
    });
  }

  /* --- C: outline terisi saat scroll --- */
  gsap.utils.toArray('[data-fill]').forEach((el) => {
    const fill = el.querySelector('.fill');
    if (!fill) return;
    gsap.fromTo(fill, { clipPath: 'inset(0 100% 0 0)' }, {
      clipPath: 'inset(0 0% 0 0)',
      ease: 'none',
      scrollTrigger: { trigger: el, start: 'top 85%', end: 'top 35%', scrub: 1 },
    });
  });

  /* --- E: reveal lingkaran untuk kartu --- */
  if (!lite) {
    gsap.utils.toArray('#dunia-bon-list .bu-card, #dunia-lunas-list .bu-pay-row').forEach((el) => {
      gsap.fromTo(el, { clipPath: 'circle(0% at 50% 50%)', autoAlpha: 0 }, {
        clipPath: 'circle(75% at 50% 50%)', autoAlpha: 1, duration: 0.5, ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 92%', once: true },
      });
    });
  }

  /* --- A: zoom-out akhir --- */
  const finale = document.getElementById('finale');
  if (finale && !lite) {
    gsap.to('#finale .bu-book-wide', {
      scale: 0.86, ease: 'none',
      scrollTrigger: { trigger: finale, start: 'top bottom', end: 'bottom bottom', scrub: 1 },
    });
  }

  /* --- D: spotlight kursor (pointer:fine saja) --- */
  if (matchMedia('(pointer: fine)').matches && !lite) {
    const spot = document.getElementById('spotlight');
    if (spot) {
      const xTo = gsap.quickTo(spot, '--sx', { duration: 0.35, ease: 'power2.out' });
      const yTo = gsap.quickTo(spot, '--sy', { duration: 0.35, ease: 'power2.out' });
      addEventListener('pointermove', (e) => {
        xTo(e.clientX + 'px');
        yTo(e.clientY + 'px');
      }, { passive: true });
      spot.hidden = false;
    }
  }

  /* Pause marquee >5s (WCAG 2.2.2) — tombol jeda */
  const pauseBtn = document.getElementById('marquee-pause');
  if (pauseBtn) {
    pauseBtn.hidden = false;
    pauseBtn.addEventListener('click', () => {
      const paused = document.documentElement.classList.toggle('bu-ring-paused');
      pauseBtn.setAttribute('aria-pressed', String(paused));
      pauseBtn.textContent = paused ? 'Jalankan putaran' : 'Jeda putaran';
    });
  }
}
