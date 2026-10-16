import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const SEMVER = /^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/;
const ID = /^[a-z0-9][a-z0-9-]*$/;
const REQUIRED = ['id', 'version', 'title', 'publisher', 'engines', 'entry'];
const AI_TRAILERS = [/co-authored-by:.*(claude|anthropic)/i, /claude-session:/i, /generated with \[?claude/i, /noreply@anthropic\.com/i];

/** @type {string[]} */
const problems = [];
const fail = (/** @type {string} */ where, /** @type {string} */ what) => problems.push(`${where}: ${what}`);

const readJson = (/** @type {string} */ file) => {
  try { return JSON.parse(readFileSync(file, 'utf8')); } catch (error) { fail(file, `invalid JSON (${error instanceof Error ? error.message : error})`); return null; }
};

/** @param {string} dir @returns {string[]} */
const filesUnder = (dir) => readdirSync(dir).flatMap((name) => {
  const path = join(dir, name);
  if (name === 'store' || name === 'node_modules' || name.startsWith('.')) return [];
  return statSync(path).isDirectory() ? filesUnder(path) : [path];
});

/** @param {string} file @param {string} html */
function checkHtml(file, html) {
  for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (!/\bsrc\s*=/.test(m[1]) && m[2].trim()) fail(file, 'inline <script> is blocked by the host CSP; move it to a .js file');
  }
  for (const m of html.matchAll(/\b(?:src|href)\s*=\s*["'](https?:)?\/\/[^"']+["']/gi)) {
    if (!/<a\b[^>]*$/i.test(html.slice(Math.max(0, m.index - 300), m.index))) fail(file, `remote asset ${m[0]} is blocked; ship it inside the app`);
  }
  if (/\son[a-z]+\s*=\s*["']/i.test(html)) fail(file, 'inline event handler attributes are blocked by the host CSP');
}

/** @param {string} dir */
function checkApp(dir) {
  const manifest = readJson(join(dir, 'manifest.json'));
  if (!manifest) return;
  for (const key of REQUIRED) if (manifest[key] === undefined) fail(`${dir}/manifest.json`, `missing "${key}"`);
  if (manifest.id !== dir) fail(`${dir}/manifest.json`, `id "${manifest.id}" must match the folder name`);
  if (!ID.test(String(manifest.id))) fail(`${dir}/manifest.json`, 'id must be lowercase letters, digits and dashes');
  if (!SEMVER.test(String(manifest.version))) fail(`${dir}/manifest.json`, `version "${manifest.version}" is not semver`);
  for (const [kind, path] of Object.entries(manifest.entry ?? {})) {
    if (!existsSync(join(dir, String(path)))) fail(`${dir}/manifest.json`, `entry.${kind} "${path}" does not exist`);
  }
  for (const file of filesUnder(dir)) {
    if (file.endsWith('.html')) checkHtml(file, readFileSync(file, 'utf8'));
  }
  const listingFile = join(dir, 'store', 'listing.json');
  if (!existsSync(listingFile)) { fail(dir, 'missing store/listing.json'); return; }
  const listing = readJson(listingFile);
  if (!listing) return;
  if (!listing.description) fail(listingFile, 'missing "description"');
  for (const path of [listing.icon, ...(listing.screenshots ?? [])].filter(Boolean)) {
    if (!String(path).startsWith('https://') && !existsSync(join(dir, String(path)))) fail(listingFile, `"${path}" does not exist`);
  }
}

/** @param {string} repository */
function checkCatalog(repository) {
  const catalog = readJson('index.json');
  if (!catalog) return [];
  if (catalog.format !== 1) fail('index.json', 'format must be 1');
  /** @type {string[]} */
  const urls = [];
  for (const app of catalog.apps ?? []) {
    if (!existsSync(join(app.id, 'manifest.json'))) fail('index.json', `"${app.id}" has no app folder`);
    for (const r of app.releases ?? []) {
      const where = `index.json ${app.id}@${r.version}`;
      if (!SEMVER.test(r.version)) fail(where, 'version is not semver');
      if (!/^[0-9a-f]{64}$/.test(r.sha256)) fail(where, 'sha256 must be 64 hex characters');
      if (!/^[0-9a-f]{40}$/.test(r.commit)) fail(where, 'commit must be a full 40-character SHA');
      if (!String(r.url).startsWith(`https://github.com/${repository}/releases/download/${app.id}-v${r.version}/`)) fail(where, 'url must point at this repository\'s release for that tag');
      urls.push(r.url);
    }
  }
  return urls;
}

/** @param {string[]} urls */
async function checkOnline(urls) {
  for (const url of urls) {
    const res = await fetch(url, { method: 'HEAD', redirect: 'manual' }).catch(() => null);
    if (!res || (res.status !== 200 && res.status !== 302)) fail('index.json', `${url} is not downloadable (${res?.status ?? 'no response'})`);
  }
}

const args = process.argv.slice(2);
if (args[0] === '--commit-msg') {
  const message = readFileSync(args[1], 'utf8');
  for (const re of AI_TRAILERS) if (re.test(message)) fail('commit message', `matches ${re}`);
} else {
  const repository = process.env.GITHUB_REPOSITORY ?? 'samuelek25k/appshell-apps';
  const paths = args.filter((a) => !a.startsWith('--'));
  const touched = (/** @type {string} */ dir) => !paths.length || paths.some((p) => p.startsWith(`${dir}/`));
  for (const dir of readdirSync('.')) {
    if (existsSync(join(dir, 'manifest.json')) && touched(dir)) checkApp(dir);
  }
  if (!paths.length || paths.includes('index.json')) {
    const urls = checkCatalog(repository);
    if (args.includes('--online')) await checkOnline(urls);
  }
}

for (const p of problems) console.error(p);
if (problems.length) console.error(`\n${problems.length} problem(s).`);
process.exit(problems.length ? 1 : 0);
