// Screenshot QA (plan §9.3): node tools/shoot.mjs <page> <outDir> [--at=ms,ms] [--full] [--reduced]
// Captures desktop (1440×900) and phone (375×812 @2x) at each moment, in real time, and prints page errors.
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { launch, sleep } from './lib/chrome.mjs';

const [page = 'index.html', outDir = 'shots'] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const flag = (name) => process.argv.find((a) => a.startsWith(`--${name}`));
const moments = (flag('at')?.split('=')[1] || '5500').split(',').map(Number);
const fullPage = Boolean(flag('full'));
const reducedMotion = Boolean(flag('reduced'));

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'phone', width: 375, height: 812, mobile: true, scale: 2 },
];

mkdirSync(outDir, { recursive: true });
const url = page.startsWith('http') ? page : pathToFileURL(resolve(page)).href;
const chrome = await launch();
let failed = false;
try {
  for (const vp of VIEWPORTS) {
    const tab = await chrome.newPage();
    await tab.open(url, { ...vp, reducedMotion });
    let elapsed = 0;
    for (const at of moments) {
      await sleep(Math.max(0, at - elapsed));
      elapsed = at;
      // Scroll like a visitor first, so scroll-triggered reveals have fired before a full-page capture.
      if (fullPage) {
        await tab.eval(`(async () => {
          const wait = (ms) => new Promise((r) => setTimeout(r, ms));
          for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight * 0.6) {
            scrollTo({ top: y, behavior: 'instant' });
            await wait(250);
          }
          await wait(1500);
          scrollTo({ top: 0, behavior: 'instant' });
          await wait(300);
        })()`);
      }
      const file = join(outDir, `${vp.name}_${at}${reducedMotion ? '_reduced' : ''}.png`);
      writeFileSync(file, await tab.screenshot({ fullPage }));
      console.log('saved', file);
    }
    if (tab.errors.length) {
      failed = true;
      console.error(`page errors on ${vp.name}:\n  ${tab.errors.join('\n  ')}`);
    }
  }
} finally {
  await chrome.close();
}
process.exitCode = failed ? 1 : 0;
