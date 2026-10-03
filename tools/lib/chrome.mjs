// Minimal headless-Chrome driver over the DevTools protocol (Node ≥ 22: built-in WebSocket, no dependencies).
// Device metrics are emulated through CDP, so widths below headless Chrome's 500px window minimum are real.
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const DEFAULT_CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

export async function launch() {
  const profile = mkdtempSync(join(tmpdir(), 'bab-chrome-'));
  const proc = spawn(process.env.CHROME_PATH || DEFAULT_CHROME, [
    '--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`,
    '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', 'about:blank',
  ], { stdio: ['ignore', 'ignore', 'pipe'] });

  const wsUrl = await new Promise((resolve, reject) => {
    let buf = '';
    const timer = setTimeout(() => reject(new Error('Chrome did not expose a DevTools endpoint within 15s')), 15000);
    proc.stderr.on('data', (chunk) => {
      buf += chunk;
      const m = buf.match(/DevTools listening on (ws:\/\/\S+)/);
      if (m) { clearTimeout(timer); resolve(m[1]); }
    });
    proc.on('exit', (code) => reject(new Error(`Chrome exited early with code ${code}`)));
  });

  const ws = new WebSocket(wsUrl);
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });

  let nextId = 1;
  const pending = new Map();
  const listeners = new Set();
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(`${msg.error.message} (${msg.error.code})`));
      else resolve(msg.result);
    } else if (msg.method) {
      listeners.forEach((fn) => fn(msg));
    }
  };
  const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params, sessionId }));
  });

  async function newPage() {
    const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
    const call = (method, params) => send(method, params, sessionId);
    const errors = [];
    listeners.add((msg) => {
      if (msg.sessionId !== sessionId) return;
      if (msg.method === 'Runtime.exceptionThrown') errors.push(msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text);
      if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') errors.push(msg.params.args.map((a) => a.value ?? a.description).join(' '));
    });
    await call('Page.enable');
    await call('Runtime.enable');

    return {
      errors,
      async open(url, { width, height, mobile = false, scale = 1, reducedMotion = false }) {
        await call('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: scale, mobile });
        await call('Emulation.setEmulatedMedia', {
          features: [{ name: 'prefers-reduced-motion', value: reducedMotion ? 'reduce' : 'no-preference' }],
        });
        const loaded = new Promise((resolve) => {
          const fn = (msg) => {
            if (msg.sessionId === sessionId && msg.method === 'Page.loadEventFired') { listeners.delete(fn); resolve(); }
          };
          listeners.add(fn);
        });
        await call('Page.navigate', { url });
        await loaded;
      },
      async eval(expression) {
        const { result, exceptionDetails } = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
        if (exceptionDetails) throw new Error(exceptionDetails.exception?.description || exceptionDetails.text);
        return result.value;
      },
      async screenshot({ fullPage = false } = {}) {
        const params = { format: 'png' };
        if (fullPage) {
          const { cssContentSize } = await call('Page.getLayoutMetrics');
          params.captureBeyondViewport = true;
          params.clip = { x: 0, y: 0, width: cssContentSize.width, height: cssContentSize.height, scale: 1 };
        }
        const { data } = await call('Page.captureScreenshot', params);
        return Buffer.from(data, 'base64');
      },
    };
  }

  async function close() {
    const exited = new Promise((resolve) => {
      if (proc.exitCode !== null) resolve();
      else proc.once('exit', resolve);
    });
    try { await send('Browser.close'); } catch { /* the browser may already be gone */ }
    ws.close();
    // Chrome keeps writing to its profile until it has fully exited.
    await Promise.race([exited, sleep(5000).then(() => proc.kill('SIGKILL'))]);
    rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  }

  return { newPage, close };
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
