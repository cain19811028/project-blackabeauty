// No horizontal scrolling at any breakpoint (plan §9.2): node tools/check-overflow.mjs [page]
// Exits 1 and names the widest offending elements when document width exceeds the viewport.
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { launch, sleep } from './lib/chrome.mjs';

const WIDTHS = [320, 375, 390, 414, 768, 1024, 1440];
const page = process.argv[2] || 'index.html';
const url = page.startsWith('http') ? page : pathToFileURL(resolve(page)).href;

const PROBE = `(() => {
  const vw = document.documentElement.clientWidth;
  const offenders = [...document.querySelectorAll('body *')]
    .filter((el) => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.right <= vw + 1) return false;
      // content clipped by an overflow:hidden ancestor cannot widen the page
      for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
        const o = getComputedStyle(p);
        if (o.overflowX !== 'visible' || o.position === 'fixed') return false;
      }
      return getComputedStyle(el).position !== 'fixed';
    })
    .map((el) => ({ el: el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\\s+/).join('.') : ''), right: Math.round(el.getBoundingClientRect().right) }))
    .sort((a, b) => b.right - a.right)
    .slice(0, 5);
  return { scrollWidth: document.documentElement.scrollWidth, vw, offenders };
})()`;

const chrome = await launch();
let failures = 0;
try {
  const tab = await chrome.newPage();
  for (const width of WIDTHS) {
    await tab.open(url, { width, height: 800, mobile: width < 768, scale: width < 768 ? 2 : 1 });
    await sleep(1200);
    const { scrollWidth, vw, offenders } = await tab.eval(PROBE);
    const ok = scrollWidth <= vw;
    if (!ok) failures++;
    console.log(`${ok ? 'PASS' : 'FAIL'} ${String(width).padStart(4)}px  scrollWidth=${scrollWidth}${ok ? '' : '  ' + offenders.map((o) => `${o.el}→${o.right}`).join(', ')}`);
  }
} finally {
  await chrome.close();
}
process.exitCode = failures ? 1 : 0;
