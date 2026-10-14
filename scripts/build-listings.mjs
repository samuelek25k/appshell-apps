// Writes apps.json: a store listing for every app folder in the repository, released or not.
// The store merges it with index.json, which stays the source of truth for releases.
// Usage: node scripts/build-listings.mjs <out-file> <repository-url>
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';

const [out = 'apps.json', repository = ''] = process.argv.slice(2);
const read = (/** @type {string} */ f) => JSON.parse(readFileSync(f, 'utf8'));
const apps = readdirSync('.', { withFileTypes: true })
  .filter((d) => d.isDirectory() && existsSync(`${d.name}/manifest.json`))
  .map(({ name }) => {
    const m = read(`${name}/manifest.json`);
    const l = existsSync(`${name}/store/listing.json`) ? read(`${name}/store/listing.json`) : {};
    const local = (/** @type {string} */ p) => (p.startsWith('https://') ? p : `${name}/${p}`);
    return {
      id: m.id, title: m.title, publisher: m.publisher, version: m.version,
      source: repository && `${repository}/tree/main/${name}`,
      backend: Boolean(m.entry.backend), capabilities: m.capabilities ?? {},
      widgets: (m.widgets ?? []).map((/** @type {any} */ w) => w.title),
      ...l, icon: l.icon && local(l.icon), screenshots: (l.screenshots ?? []).map(local),
    };
  });
writeFileSync(out, JSON.stringify({ apps }, null, 2) + '\n');
console.log(`${out}: ${apps.map((a) => a.id).join(', ')}`);
