/* Opening choreography, cap flight, tassel springs, parallax and scroll reveals (plan §4.1, §4.3). */
(function () {
  'use strict';

  const BAB = window.BAB;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const easeOutCubic = (u) => 1 - (1 - u) ** 3;

  function splitTitle(el) {
    let i = 0;
    const walk = (node) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          const frag = document.createDocumentFragment();
          for (const ch of child.textContent) {
            const span = document.createElement('span');
            span.className = 'ch';
            span.style.setProperty('--i', i++);
            span.textContent = ch;
            frag.appendChild(span);
          }
          child.replaceWith(frag);
        } else if (child.nodeType === Node.ELEMENT_NODE && child.tagName !== 'BR') {
          walk(child);
        }
      });
    };
    walk(el);
  }

  // Damped spring for one tassel, in degrees. Target comes from flight drag or from the wind.
  function makeTassel(cap, seed) {
    return { cap, seed, angle: 0, vel: 0 };
  }
  function stepTassel(ts, target, dt) {
    const acc = -70 * (ts.angle - target) - 5.5 * ts.vel;
    ts.vel += acc * dt;
    ts.angle = clamp(ts.angle + ts.vel * dt, -55, 55);
    ts.cap.style.setProperty('--swing', ts.angle.toFixed(2) + 'deg');
  }

  // Three caps are tossed from below the hero, tumble through the sky and land back on their gowns.
  function initCaps(hero) {
    const svg = hero.querySelector('.hero__caps');
    if (!svg) return;
    const caps = [...svg.querySelectorAll('.cap')];
    const tassels = caps.map((cap, i) => makeTassel(cap, i * 1.7));
    const windSway = (ts, t) => (BAB.wind.at(0) - 0.32) * 9 + Math.sin(t * 1.6 + ts.seed) * 1.4;

    if (BAB.reducedMotion) return;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    svg.classList.add('is-driven');

    const inv = ctm.inverse();
    const toUser = (x, y) => new DOMPoint(x, y).matrixTransform(inv);
    const rect = hero.getBoundingClientRect();
    const launchY = Math.min(rect.bottom, window.innerHeight) + 40;
    const apexScreenY = Math.max(rect.top, 0) + window.innerHeight * 0.05;

    const flights = caps.map((cap, i) => {
      const box = cap.getBBox();
      const cx = box.x + box.width / 2;
      const cy = box.y + box.height / 2;
      const start = toUser(rect.left + rect.width * (0.2 + i * 0.24), launchY);
      const apex = toUser(0, apexScreenY);
      const p0y = start.y - cy;
      return {
        cap,
        p0x: start.x - cx,
        p0y,
        ctrlY: 2 * (apex.y - cy) - p0y / 2, // puts the apex of the quadratic at u = 0.5
        delay: 0.6 + i * 0.16,
        dur: 1.3 + i * 0.08,
        spins: (i % 2 ? -1 : 1) * (1.2 + i * 0.25),
        state: 'waiting',
        settle: 0,
        lastX: start.x - cx,
      };
    });
    flights.forEach((f) => { f.cap.style.transform = `translate(${f.p0x}px, ${f.p0y}px)`; });

    const t0 = performance.now() / 1000;
    BAB.ticker.add((t, dt) => {
      const el = t - t0;
      flights.forEach((f, i) => {
        const ts = tassels[i];
        if (f.state === 'waiting') {
          if (el < f.delay) return;
          f.state = 'flying';
          f.cap.style.opacity = 1;
        }
        if (f.state === 'flying') {
          const u = clamp((el - f.delay) / f.dur, 0, 1);
          const x = f.p0x * (1 - u);
          const y = (1 - u) ** 2 * f.p0y + 2 * u * (1 - u) * f.ctrlY;
          const left = 1 - easeOutCubic(u);
          const rot = f.spins * 360 * left;
          const tumble = Math.cos(left * Math.PI * 3);
          f.cap.style.transform = `translate(${x}px, ${y}px) rotate(${rot}deg) scale(1, ${tumble})`;
          const vx = (x - f.lastX) / Math.max(dt, 1e-3);
          f.lastX = x;
          stepTassel(ts, clamp(-vx * 0.05, -45, 45), dt);
          if (u >= 1) {
            f.state = 'settling';
            ts.vel += i % 2 ? -260 : 260;
          }
          return;
        }
        if (f.state === 'settling') {
          f.settle += dt;
          const k = clamp(f.settle / 0.45, 0, 1);
          const squash = 0.11 * Math.sin(k * Math.PI) * (1 - k);
          f.cap.style.transform = `translateY(${squash * 40}px) scale(1, ${1 - squash})`;
          if (k >= 1) {
            f.state = 'resting';
            f.cap.style.transform = '';
          }
        }
        stepTassel(ts, windSway(ts, t), dt);
      });
    });
  }

  // Pointer and scroll parallax over the sky layers; smoothed so it never jitters.
  function initParallax(hero) {
    if (BAB.reducedMotion) return;
    const layers = [
      { el: hero.querySelector('.clouds'), px: -14, py: -8, scroll: 0.32 },
      { el: hero.querySelector('.campus'), px: -7, py: -2, scroll: 0.18 },
      { el: hero.querySelector('.hero__stage'), px: 10, py: 6, scroll: -0.06 },
      { el: hero.querySelector('.hero__branch'), px: 16, py: 10, scroll: 0.12 },
    ].filter((l) => l.el);
    const aim = { x: 0, y: 0 };
    const cur = { x: 0, y: 0 };
    hero.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      aim.x = (e.clientX / window.innerWidth) * 2 - 1;
      aim.y = (e.clientY / window.innerHeight) * 2 - 1;
    }, { passive: true });
    hero.addEventListener('pointerleave', () => { aim.x = 0; aim.y = 0; });

    let lastKey = '';
    BAB.ticker.add((t, dt) => {
      const k = 1 - Math.exp(-dt * 4);
      cur.x += (aim.x - cur.x) * k;
      cur.y += (aim.y - cur.y) * k;
      const sy = Math.min(window.scrollY, hero.offsetHeight);
      const key = `${cur.x.toFixed(3)},${cur.y.toFixed(3)},${sy}`;
      if (key === lastKey) return;
      lastKey = key;
      layers.forEach((l) => {
        l.el.style.transform = `translate3d(${(cur.x * l.px).toFixed(2)}px, ${(cur.y * l.py + sy * l.scroll).toFixed(2)}px, 0)`;
      });
    });
  }

  function initReveal() {
    const items = document.querySelectorAll('[data-reveal]');
    if (!('IntersectionObserver' in window)) {
      items.forEach((el) => el.classList.add('is-in'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.15 });
    items.forEach((el) => io.observe(el));
  }

  function initHeader() {
    const header = document.querySelector('.site-header');
    if (!header) return;
    const update = () => header.classList.toggle('is-scrolled', window.scrollY > 24);
    update();
    window.addEventListener('scroll', update, { passive: true });
  }

  function initMenu() {
    const header = document.querySelector('.site-header');
    const button = header && header.querySelector('.menu-toggle');
    if (!button) return;
    const setOpen = (open) => {
      header.classList.toggle('is-open', open);
      button.setAttribute('aria-expanded', String(open));
      button.setAttribute('aria-label', open ? '關閉選單' : '開啟選單');
      button.querySelector('use').setAttribute('href', open ? '#i-close' : '#i-menu');
    };
    button.addEventListener('click', () => setOpen(!header.classList.contains('is-open')));
    header.querySelectorAll('.site-nav a').forEach((a) => a.addEventListener('click', () => setOpen(false)));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
    document.addEventListener('pointerdown', (e) => { if (!header.contains(e.target)) setOpen(false); });
  }

  // Tassels on the illustrated graduates sway with the same wind as the petals.
  function initSceneTassels() {
    if (BAB.reducedMotion) return;
    const els = [...document.querySelectorAll('.about__svg .pair-tassel')];
    if (!els.length) return;
    const tassels = els.map((el, i) => makeTassel(el, i * 2.3));
    BAB.ticker.add((t, dt) => {
      tassels.forEach((ts) => stepTassel(ts, (BAB.wind.at(0) - 0.32) * 12 + Math.sin(t * 1.3 + ts.seed) * 2.5, dt));
    });
  }

  function init() {
    initHeader();
    initSceneTassels();
    initMenu();
    initReveal();
    const hero = document.querySelector('.hero');
    if (!hero) return;
    const title = hero.querySelector('.hero__title');
    if (title) splitTitle(title);
    initCaps(hero);
    initParallax(hero);
    hero.addEventListener('pointerdown', (e) => {
      if (e.target.closest('a, button')) return;
      BAB.Sakura.burst(e.clientX, e.clientY, 16);
    });
  }

  BAB.Motion = { init };
})();
