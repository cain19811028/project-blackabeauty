// A/B comparison pack (plan_20261113 §7): node tools/build-compare.mjs [--a=<git ref>] [--out=dist/compare]
// A is exported straight from git objects (default: tag v1-sakura), so it can never drift from what was approved.
// B is the working tree as it is right now, uncommitted changes included.
// The pack opens by double-clicking dist/compare/index.html; no server needed.
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const TEMPLATE = join(ROOT, 'tools', 'compare');
const flag = (name, fallback) => process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3) ?? fallback;
const refA = flag('a', 'v1-sakura');
const out = resolve(ROOT, flag('out', 'dist/compare'));

// The pack is wiped on every build, so it must live in dist/ and nowhere else.
const rel = relative(join(ROOT, 'dist'), out);
if (!rel || rel.startsWith('..') || isAbsolute(rel)) {
  throw new Error(`--out must be a folder inside dist/, got ${out}`);
}

// Only what index.html loads. The old shop photos are reference material, never shown on the new site
// (plan_20261003 素材原則); jQuery and remove.js belong to the old HiNet pages.
const isSiteFile = (path) =>
  path === 'index.html' ||
  (/^(css|js|images)\//.test(path) &&
    !/^images\/[^/]+\.gif$/.test(path) &&
    !path.startsWith('images/new/') &&
    !['js/jquery.min.js', 'js/remove.js'].includes(path));

const git = (...args) => execFileSync('git', args, { cwd: ROOT, maxBuffer: 64 << 20 });
const gitText = (...args) => git(...args).toString().trim();
const zList = (buf) => buf.toString().split('\0').filter(Boolean);

function resolveRef(ref) {
  try {
    return gitText('rev-parse', '--verify', '--quiet', `${ref}^{commit}`);
  } catch {
    throw new Error(`git ref "${ref}" not found. The A baseline is created with: git tag -a v1-sakura 949e058`);
  }
}

function exportRef(ref, dest) {
  // ls-tree line: "<mode> <type> <sha>\t<path>"; -z keeps paths with spaces intact.
  for (const entry of zList(git('ls-tree', '-r', '-z', ref))) {
    const tab = entry.indexOf('\t');
    const [, type, sha] = entry.slice(0, tab).split(' ');
    const path = entry.slice(tab + 1);
    if (type !== 'blob' || !isSiteFile(path)) continue;
    const file = join(dest, path);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, git('cat-file', 'blob', sha));
  }
}

function exportWorkingTree(dest) {
  const paths = new Set(zList(git('ls-files', '-z', '--cached', '--others', '--exclude-standard')));
  for (const path of paths) {
    // A tracked file deleted in the working tree is still listed by --cached.
    if (!isSiteFile(path) || !existsSync(join(ROOT, path))) continue;
    mkdirSync(dirname(join(dest, path)), { recursive: true });
    copyFileSync(join(ROOT, path), join(dest, path));
  }
}

// A version with a missing stylesheet or script would look broken in front of the client, so fail the build instead.
function checkAssets(dir, name) {
  const html = readFileSync(join(dir, 'index.html'), 'utf8');
  const missing = [...html.matchAll(/\b(?:src|href)="([^"#?]+)/g)]
    .map((m) => m[1])
    .filter((url) => !/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(url))
    .filter((url) => !existsSync(join(dir, decodeURI(url))));
  if (missing.length) throw new Error(`${name} version is missing files it loads:\n  ${missing.join('\n  ')}`);
}

// The bridge only reports scroll position to the compare page; it draws nothing, so A still looks exactly as tagged.
function injectBridge(dir) {
  const file = join(dir, 'index.html');
  const html = readFileSync(file, 'utf8');
  const at = html.lastIndexOf('</body>');
  if (at < 0) throw new Error(`${file} has no </body> to attach the compare bridge to`);
  writeFileSync(file, `${html.slice(0, at)}  <script src="../bridge.js" defer></script>\n${html.slice(at)}`);
}

const shaA = resolveRef(refA);
const branch = gitText('rev-parse', '--abbrev-ref', 'HEAD');
const meta = {
  a: { ref: refA, commit: shaA.slice(0, 7) },
  b: {
    ref: branch,
    commit: gitText('rev-parse', '--short', 'HEAD'),
    dirty: gitText('status', '--porcelain').length > 0,
  },
  builtAt: new Date().toLocaleString('zh-TW', { hour12: false }),
};

rmSync(out, { recursive: true, force: true });
exportRef(shaA, join(out, 'a'));
exportWorkingTree(join(out, 'b'));
for (const v of ['a', 'b']) {
  checkAssets(join(out, v), v.toUpperCase());
  injectBridge(join(out, v));
}

copyFileSync(join(TEMPLATE, 'bridge.js'), join(out, 'bridge.js'));
copyFileSync(join(TEMPLATE, 'compare.js'), join(out, 'compare.js'));
const page = readFileSync(join(TEMPLATE, 'index.html'), 'utf8');
const metaJson = JSON.stringify(meta).replace(/</g, '\\u003c');
if (!page.includes('{"__meta__":true}')) throw new Error('tools/compare/index.html lost its meta placeholder');
writeFileSync(join(out, 'index.html'), page.replace('{"__meta__":true}', metaJson));

console.log(`A  ${refA} (${meta.a.commit})`);
console.log(`B  ${branch} (${meta.b.commit}${meta.b.dirty ? ' + uncommitted changes' : ''})`);
console.log(`open ${pathToFileURL(join(out, 'index.html')).href}`);
