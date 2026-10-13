// Records one release in index.json. Inputs come from the environment (see release-app.yml).
// The host validates the catalog and every package again, so this stays minimal.
import { readFileSync, writeFileSync } from 'node:fs';

const { ID, VERSION, SHA256, COMMIT, URL, REPOSITORY } = process.env;
const manifest = JSON.parse(readFileSync(`${ID}/manifest.json`, 'utf8'));
const catalog = JSON.parse(readFileSync('index.json', 'utf8'));
let entry = catalog.apps.find((a) => a.id === ID);
if (!entry) catalog.apps.push(entry = { id: ID, title: '', publisher: '', repository: '', releases: [] });
Object.assign(entry, { title: manifest.title, publisher: manifest.publisher, repository: REPOSITORY });
entry.releases = entry.releases.filter((r) => r.version !== VERSION);
entry.releases.push({ version: VERSION, channel: VERSION.includes('-') ? 'beta' : 'stable', url: URL, sha256: SHA256, commit: COMMIT });
writeFileSync('index.json', JSON.stringify(catalog, null, 2) + '\n');
console.log(`index.json: ${ID}@${VERSION}`);
