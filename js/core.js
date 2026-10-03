/* Shared runtime: namespace, one frame ticker, and the wind that petals, tassels and the branch all obey.
   Plain defer scripts (no ES modules) so the site also works when index.html is opened from disk. */
(function () {
  'use strict';

  const BAB = (window.BAB = window.BAB || {});
  BAB.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const smooth = (x) => x * x * (3 - 2 * x);

  // Gusts swell for ~1.2 s and fade over ~2.4 s; the next one comes 10–16 s later.
  const gustListeners = [];
  const wind = {
    t: 0,
    gust: 0,
    strength: 1,
    gustStart: -100,
    nextGust: null,
    update(t) {
      this.t = t;
      if (this.nextGust === null) this.nextGust = t + 12;
      if (t >= this.nextGust) this.trigger(1);
      const g = t - this.gustStart;
      this.gust = g < 0 ? 0 : g < 1.2 ? smooth(g / 1.2) : g < 3.6 ? 1 - smooth((g - 1.2) / 2.4) : 0;
    },
    trigger(strength) {
      this.strength = strength;
      this.gustStart = this.t;
      this.nextGust = this.t + 10 + Math.random() * 6;
      gustListeners.forEach((fn) => fn(strength));
    },
    onGust(fn) { gustListeners.push(fn); },
    // ~0.3 in a calm breeze, ~1.6 at a gust peak; y lets the field vary with height.
    at(y) {
      const t = this.t;
      return 0.32 + 0.16 * Math.sin(t * 0.21) + 0.1 * Math.sin(t * 0.57 + y * 0.004) + this.gust * 1.3 * this.strength;
    },
  };
  BAB.wind = wind;

  const subscribers = new Set();
  let last = 0;
  let rafId = 0;
  let running = false;

  function frame(now) {
    const t = now / 1000;
    const dt = last ? Math.min(0.05, t - last) : 1 / 60;
    last = t;
    wind.update(t);
    subscribers.forEach((fn) => fn(t, dt));
    rafId = requestAnimationFrame(frame);
  }
  function start() {
    if (running || document.hidden) return;
    running = true;
    last = 0;
    rafId = requestAnimationFrame(frame);
  }
  function stop() {
    running = false;
    cancelAnimationFrame(rafId);
  }

  BAB.ticker = {
    add(fn) { subscribers.add(fn); start(); },
    remove(fn) { subscribers.delete(fn); if (!subscribers.size) stop(); },
  };
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else if (subscribers.size) start();
  });
})();
