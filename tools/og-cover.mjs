// Share preview (plan §8.3): renders the settled hero at 1200×630 into images/og/og-cover.png.
// LINE and Facebook do not render SVG previews, so this must be a PNG. Re-run whenever the hero changes.
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { launch, sleep } from './lib/chrome.mjs';

const OUT = resolve('images/og/og-cover.png');
const chrome = await launch();
try {
  const tab = await chrome.newPage();
  await tab.open(pathToFileURL(resolve('index.html')).href, { width: 1200, height: 630, reducedMotion: true });
  await tab.eval(`document.querySelector('.scroll-cue')?.remove()`);
  await sleep(2500); // web fonts and the static petal layer
  mkdirSync(resolve('images/og'), { recursive: true });
  writeFileSync(OUT, await tab.screenshot());
  console.log('saved', OUT);
} finally {
  await chrome.close();
}
