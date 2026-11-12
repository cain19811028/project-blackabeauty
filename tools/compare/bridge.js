/* Compare bridge (plan_20261113 §7). tools/build-compare.mjs injects this into both exported versions.
   Position travels as "section + fraction" because the two versions differ in length, and over postMessage
   because pages opened from file:// are cross-origin to each other. It never touches the page's look. */
(function () {
  'use strict';

  if (window.parent === window) return;

  const post = (msg) => window.parent.postMessage({ bab: 'compare', ...msg }, '*');
  const sections = [...document.querySelectorAll('main > section[id]')];
  if (!sections.length) return;

  const docTop = (el) => el.getBoundingClientRect().top + window.scrollY;
  const maxScroll = () => document.documentElement.scrollHeight - window.innerHeight;
  // 'instant' overrides the site's scroll-behavior: smooth, so the follower keeps pace instead of easing behind.
  const jump = (y) => window.scrollTo({ top: Math.max(0, y), behavior: 'instant' });
  // The section being read is the last one whose top has passed this line.
  const probeY = () => window.scrollY + window.innerHeight * 0.3;

  function label(section) {
    const head = document.getElementById(section.getAttribute('aria-labelledby'));
    return (head ? head.textContent : section.id).replace(/\s+/g, '');
  }

  function where() {
    if (window.scrollY >= maxScroll() - 2) return { id: sections[sections.length - 1].id, bottom: true };
    const probe = probeY();
    let current = sections[0];
    sections.forEach((s) => { if (docTop(s) <= probe) current = s; });
    const frac = (probe - docTop(current)) / current.offsetHeight;
    return { id: current.id, frac: Math.min(1, Math.max(0, frac)) };
  }

  function follow({ id, frac, bottom }) {
    if (bottom) return jump(maxScroll());
    const s = document.getElementById(id);
    if (s) jump(docTop(s) + frac * s.offsetHeight - window.innerHeight * 0.3);
  }

  let queued = false;
  window.addEventListener('scroll', () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      post({ type: 'scroll', ...where() });
    });
  }, { passive: true });

  // Whichever version the visitor last touched leads; the other one follows.
  ['wheel', 'touchstart', 'pointerdown', 'keydown'].forEach((type) => {
    window.addEventListener(type, () => post({ type: 'interact' }), { passive: true, capture: true });
  });

  // Once the visitor clicks into a frame, keys land here, not on the compare page; pass the A/B switch keys up.
  window.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey || !/^[ab]$/i.test(e.key)) return;
    if (e.target.closest && e.target.closest('input, textarea, select, [contenteditable]')) return;
    post({ type: 'key', key: e.key.toLowerCase() });
  });

  window.addEventListener('message', (e) => {
    const d = e.data;
    if (e.source !== window.parent || !d || d.bab !== 'compare') return;
    if (d.type === 'follow') follow(d);
    else if (d.type === 'goto') {
      const s = document.getElementById(d.id);
      if (s) s.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  post({ type: 'ready', sections: sections.map((s) => ({ id: s.id, label: label(s) })) });
  post({ type: 'scroll', ...where() });
})();
