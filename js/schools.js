/* 承製院校: search over the original 75 names, and the count-up of "75". */
(function () {
  'use strict';

  const BAB = window.BAB;

  // People type 臺 or 台 interchangeably; the shop's list is written with 台.
  const normalize = (s) => s.replace(/臺/g, '台').replace(/\s+/g, '');

  // Subsequence match lets common abbreviations work: 成大 → 成功大學, 高師大 → 高雄師大, 屏科大 → 屏東科大.
  function matches(query, name) {
    let i = 0;
    for (const ch of name) {
      if (ch === query[i]) i++;
      if (i === query.length) return true;
    }
    return false;
  }

  function initSearch(section) {
    const input = section.querySelector('#school-q');
    const status = section.querySelector('.schools__status');
    if (!input || !status) return;
    const items = [...section.querySelectorAll('.schools__wall li')].map((el) => ({ el, name: normalize(el.textContent) }));

    input.addEventListener('input', () => {
      const query = [...normalize(input.value)];
      let hits = 0;
      items.forEach(({ el, name }) => {
        const hit = query.length > 0 && matches(query, name);
        if (hit) hits++;
        el.classList.toggle('is-hit', hit);
        el.classList.toggle('is-dim', query.length > 0 && !hit);
      });
      if (!query.length) status.textContent = '';
      else if (hits) status.textContent = `找到 ${hits} 所`;
      else status.textContent = '名單中沒有符合的學校，歡迎來電詢問';
    });
  }

  function initCount(section) {
    const num = section.querySelector('.schools__num');
    if (!num || BAB.reducedMotion || !('IntersectionObserver' in window)) return;
    const target = Number(num.dataset.count);
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      const start = performance.now();
      const tick = (now) => {
        const u = Math.min(1, (now - start) / 1400);
        num.textContent = String(Math.round(target * (1 - (1 - u) ** 3)));
        if (u < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.6 });
    io.observe(num);
  }

  function init() {
    const section = document.querySelector('.schools');
    if (!section) return;
    initSearch(section);
    initCount(section);
  }

  BAB.Schools = { init };
})();
