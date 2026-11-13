/* Falling kapok (木棉) petals, and now and then a whole flower (plan_20261113 decision 6).
   Two fixed canvases: far/mid petals behind the content, a few near ones in front.
   Petals are pre-rendered sprites; each frame only transforms and blits them. */
(function () {
  'use strict';

  const BAB = window.BAB;
  const TAU = Math.PI * 2;
  const SPRITE = 64;
  const NEAR = 0.82; // depth above which a petal is drawn on the front canvas
  const PUSH_RADIUS = 110;
  const FLOWER_ODDS = 0.08; // kapok drops whole flowers as well as petals

  const TINTS = [
    { base: '#B93220', mid: '#E2492C', tip: '#FF8A57', baseBack: '#A42A1A', midBack: '#C93D25' },
    { base: '#C83A22', mid: '#EE5C34', tip: '#FFA06E', baseBack: '#AE3020', midBack: '#D24A2C' },
  ];
  const WIDTHS = [0.86, 1, 1.14];
  const PETAL_KINDS = WIDTHS.length * TINTS.length;

  // A kapok petal is thick and rounded, widest near the tip, with no notch: the opposite of a sakura petal.
  function petalPath(ctx, w) {
    ctx.beginPath();
    ctx.moveTo(0, 26);
    ctx.bezierCurveTo(-12 * w, 20, -20 * w, -2, -17 * w, -16);
    ctx.bezierCurveTo(-15 * w, -26, -6 * w, -28, 0, -27);
    ctx.bezierCurveTo(6 * w, -28, 15 * w, -26, 17 * w, -16);
    ctx.bezierCurveTo(20 * w, -2, 12 * w, 20, 0, 26);
    ctx.closePath();
  }

  function petalFill(ctx, tint, back) {
    const g = ctx.createLinearGradient(0, 26, 0, -26);
    g.addColorStop(0, back ? tint.baseBack : tint.base);
    g.addColorStop(0.5, back ? tint.midBack : tint.mid);
    g.addColorStop(1, tint.tip);
    return g;
  }

  function makePetal(width, tint, back, blur) {
    const c = document.createElement('canvas');
    c.width = c.height = SPRITE;
    const ctx = c.getContext('2d');
    ctx.translate(SPRITE / 2, SPRITE / 2);
    if (blur) ctx.filter = `blur(${blur}px)`;
    petalPath(ctx, width);
    ctx.fillStyle = petalFill(ctx, tint, back);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 176, 130, .5)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, 20);
    ctx.quadraticCurveTo(1.5, 0, 0, -20);
    ctx.stroke();
    return c;
  }

  // A fallen flower seen from above: five petals around a crown of stamens.
  function makeFlower(tint, back, blur) {
    const c = document.createElement('canvas');
    c.width = c.height = SPRITE;
    const ctx = c.getContext('2d');
    ctx.translate(SPRITE / 2, SPRITE / 2);
    if (blur) ctx.filter = `blur(${blur}px)`;
    for (let i = 0; i < 5; i++) {
      ctx.save();
      ctx.rotate((i * 72 - 6) * Math.PI / 180);
      ctx.translate(0, -13);
      ctx.scale(0.52, 0.52);
      petalPath(ctx, 1);
      ctx.fillStyle = petalFill(ctx, tint, back);
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = '#6E1A0E';
    ctx.beginPath();
    ctx.arc(0, 0, 4.5, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#F3C04F';
    for (let i = 0; i < 10; i++) {
      const a = (i * 36) * Math.PI / 180;
      ctx.beginPath();
      ctx.arc(Math.sin(a) * 6.5, -Math.cos(a) * 6.5, 1.3, 0, TAU);
      ctx.fill();
    }
    return c;
  }

  // kinds 0…PETAL_KINDS-1 are petals; the rest are whole flowers
  function buildSprites() {
    const set = { far: { front: [], back: [] }, near: { front: [], back: [] } };
    WIDTHS.forEach((w) => TINTS.forEach((tint) => {
      set.far.front.push(makePetal(w, tint, false, 0));
      set.far.back.push(makePetal(w, tint, true, 0));
      set.near.front.push(makePetal(w, tint, false, 1.6));
      set.near.back.push(makePetal(w, tint, true, 1.6));
    }));
    TINTS.forEach((tint) => {
      set.far.front.push(makeFlower(tint, false, 0));
      set.far.back.push(makeFlower(tint, true, 0));
      set.near.front.push(makeFlower(tint, false, 1.6));
      set.near.back.push(makeFlower(tint, true, 1.6));
    });
    return set;
  }

  let backCtx, frontCtx, hero, sprites;
  let W = 0, H = 0, dpr = 1;
  let baseCount = 60;
  let frameEma = 1 / 60;
  let slowFor = 0;
  const petals = [];
  const pointer = { x: 0, y: 0, active: false };

  function place(p, where) {
    p.z = Math.random() ** 1.5;
    p.flower = Math.random() < FLOWER_ODDS;
    p.size = (10 + p.z * p.z * 24) * (p.flower ? 1.5 : 1);
    if (where === 'left') {
      p.x = -30 - Math.random() * 220;
      p.y = Math.random() * H * 0.75;
    } else if (where === 'top') {
      p.x = Math.random() * W * 1.25 - W * 0.25;
      p.y = -30 - Math.random() * 80;
    } else {
      p.x = Math.random() * W;
      p.y = Math.random() * H;
    }
    p.rot = Math.random() * TAU;
    p.vr = (Math.random() - 0.5) * 2.4;
    p.flip = Math.random() * TAU;
    // thick petals flutter less than sakura; whole flowers barely flip, they tumble
    p.vf = p.flower ? 0.3 + Math.random() * 0.6 : 1 + Math.random() * 1.6;
    p.phase = Math.random() * TAU;
    p.swayF = 0.6 + Math.random() * 0.9;
    p.ex = 0;
    p.ey = 0;
    p.kind = p.flower ? PETAL_KINDS + ((Math.random() * TINTS.length) | 0) : (Math.random() * PETAL_KINDS) | 0;
    return p;
  }

  function targetCount() {
    const heroH = hero ? hero.offsetHeight : H;
    const heroVisible = Math.max(0, Math.min(1, 1 - window.scrollY / heroH));
    return Math.round(baseCount * (0.4 + 0.6 * heroVisible));
  }

  function resize() {
    const w = document.documentElement.clientWidth;
    const h = window.innerHeight;
    // Mobile URL bars change innerHeight while scrolling; only re-allocate for real size changes.
    if (Math.abs(w - W) < 1 && Math.abs(h - H) < 80) return;
    W = w;
    H = h;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    [backCtx, frontCtx].forEach((ctx) => {
      if (!ctx) return;
      ctx.canvas.width = Math.round(W * dpr);
      ctx.canvas.height = Math.round(H * dpr);
    });
    // kapok petals are big and heavy, so fewer of them read as a fall rather than a blizzard
    baseCount = Math.max(20, Math.min(70, Math.round((W * H) / 19000)));
    if (BAB.reducedMotion) drawStill();
  }

  function draw(ctx, near) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    for (const p of petals) {
      if ((p.z > NEAR) !== near) continue;
      const c = Math.cos(p.flip);
      const sy = Math.max(0.12, Math.abs(c));
      const sprite = sprites[near ? 'near' : 'far'][c >= 0 ? 'front' : 'back'][p.kind];
      const k = (dpr * p.size) / SPRITE;
      const cos = Math.cos(p.rot);
      const sin = Math.sin(p.rot);
      ctx.globalAlpha = near ? 0.9 : 0.5 + p.z * 0.45;
      ctx.setTransform(cos * k, sin * k, -sin * sy * k, cos * sy * k, p.x * dpr, p.y * dpr);
      ctx.drawImage(sprite, -SPRITE / 2, -SPRITE / 2);
    }
  }

  function step(t, dt) {
    frameEma += (dt - frameEma) * 0.05;
    slowFor = frameEma > 0.024 ? slowFor + dt : 0;
    if (slowFor > 1) {
      baseCount = Math.max(20, Math.round(baseCount * 0.85));
      slowFor = 0;
    }

    const target = targetCount();
    while (petals.length < target && Math.random() < 0.25) petals.push(place({}, 'top'));

    const wind = BAB.wind;
    for (let i = petals.length - 1; i >= 0; i--) {
      const p = petals[i];
      const w = wind.at(p.y);
      const depth = 0.45 + p.z * 0.9;
      const sway = p.flower ? 3 + p.z * 5 : 7 + p.z * 12;
      const fall = p.flower ? 48 + p.z * 70 : 32 + p.z * 52;
      p.x += (w * 70 * depth * (p.flower ? 0.5 : 1) + Math.sin(t * p.swayF + p.phase) * sway + p.ex) * dt;
      p.y += (fall * (1 - wind.gust * 0.3) + Math.cos(t * p.swayF * 1.3 + p.phase) * 6 + p.ey) * dt;
      p.rot += (p.vr + w * 0.4) * dt;
      p.flip += p.vf * (1 + wind.gust) * dt;
      const decay = Math.exp(-dt * 1.8);
      p.ex *= decay;
      p.ey *= decay;

      if (pointer.active && p.z > 0.3) {
        const dx = p.x - pointer.x;
        const dy = p.y - pointer.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < PUSH_RADIUS * PUSH_RADIUS && d2 > 1) {
          const d = Math.sqrt(d2);
          const f = (1 - d / PUSH_RADIUS) * 900 * dt;
          p.ex += (dx / d) * f;
          p.ey += (dy / d) * f;
        }
      }

      if (p.y > H + 40 || p.x > W + 60 || p.x < -280 || p.y < -260) {
        if (petals.length > target) petals.splice(i, 1);
        else place(p, w > 0.9 && Math.random() < 0.6 ? 'left' : 'top');
      }
    }

    draw(backCtx, false);
    if (frontCtx) draw(frontCtx, true);
  }

  function sweep(n) {
    for (let i = 0; i < n; i++) {
      const p = place({}, 'left');
      p.ex = 40 + Math.random() * 80;
      petals.push(p);
    }
  }

  function burst(x, y, n) {
    if (BAB.reducedMotion) return;
    for (let i = 0; i < n; i++) {
      const p = place({}, 'scatter');
      p.z = 0.45 + Math.random() * 0.55;
      p.size = (10 + p.z * p.z * 24) * (p.flower ? 1.5 : 1);
      p.x = x;
      p.y = y;
      const a = Math.random() * TAU;
      const v = 90 + Math.random() * 180;
      p.ex = Math.cos(a) * v;
      p.ey = Math.sin(a) * v - 90;
      petals.push(p);
    }
  }

  // Reduced motion: a dozen petals resting in place, no animation loop at all.
  function drawStill() {
    petals.length = 0;
    for (let i = 0; i < 12; i++) petals.push(place({}, 'scatter'));
    draw(backCtx, false);
    if (frontCtx) draw(frontCtx, true);
  }

  function init(backCanvas, frontCanvas, heroEl) {
    if (!backCanvas || !backCanvas.getContext) return;
    backCtx = backCanvas.getContext('2d');
    frontCtx = frontCanvas ? frontCanvas.getContext('2d') : null;
    hero = heroEl;
    sprites = buildSprites();
    resize();
    window.addEventListener('resize', resize);
    if (BAB.reducedMotion) return;

    for (let i = 0; i < Math.round(baseCount * 0.35); i++) petals.push(place({}, 'scatter'));
    window.addEventListener('pointermove', (e) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.active = e.pointerType === 'mouse';
    }, { passive: true });
    document.documentElement.addEventListener('pointerleave', () => { pointer.active = false; });
    BAB.wind.onGust((strength) => sweep(Math.round(baseCount * 0.15 * strength)));
    BAB.ticker.add(step);
  }

  // The opening gust (plan §4.1, t ≈ 1.0 s): a wide sweep of petals from the left.
  function openingGust() {
    if (BAB.reducedMotion || !backCtx) return;
    sweep(Math.round(baseCount * 0.4));
    BAB.wind.trigger(1.25);
  }

  BAB.Petals = { init, burst, openingGust };
})();
