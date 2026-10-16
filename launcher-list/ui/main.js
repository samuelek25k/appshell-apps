import { launcher, shell, storage } from '/__appshell/sdk.js';

const ACCENTS = ['#b4552d', '#2f6fed', '#0e8f9e', '#2f9e5f', '#c4457a', '#7a5af8'];
const query = document.getElementById('query');
const results = document.getElementById('results');
const empty = document.getElementById('empty');
const widgetsEl = document.getElementById('widgets');
const accentsEl = document.getElementById('accents');
let apps = [];
let selected = 0;
let accent = ACCENTS[0];

const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};

const visible = () => {
  const q = query.value.trim().toLowerCase();
  return apps
    .filter((a) => !q || a.title.toLowerCase().includes(q) || a.publisher.toLowerCase().includes(q) || a.id.includes(q))
    .sort((a, b) => Number(b.running) - Number(a.running) || a.title.localeCompare(b.title));
};

function paintResults() {
  const list = visible();
  selected = Math.min(selected, Math.max(0, list.length - 1));
  results.replaceChildren(...list.map((app, index) => {
    const item = el('li');
    const row = el('button', 'result');
    row.type = 'button';
    row.setAttribute('role', 'option');
    row.setAttribute('aria-selected', String(index === selected));
    const dot = el('span', 'dot');
    dot.dataset.running = String(app.running);
    row.append(dot, el('span', 'title', app.title), el('span', 'quiet', app.publisher));
    row.addEventListener('click', () => launcher.open(app.id));
    item.append(row);
    return item;
  }));
  empty.hidden = list.length > 0 || apps.length === 0;
}

function summary(widget) {
  const row = el('button', 'summary');
  row.type = 'button';
  const first = widget.descriptor.blocks.find((b) => ['metric', 'text', 'list'].includes(b.type));
  const item = first?.items?.[0];
  const text = first?.type === 'metric' ? `${first.value}${first.unit ? ` ${first.unit}` : ''}` : first?.type === 'list' ? [item?.label, item?.value].filter(Boolean).join(' ') : (first?.text ?? '');
  row.append(el('span', '', widget.title), el('span', 'quiet', text));
  row.addEventListener('click', () => launcher.open(widget.appId));
  return row;
}

async function refresh() {
  const [list, widgets] = await Promise.all([launcher.apps(), launcher.widgets()]);
  apps = list;
  paintResults();
  widgetsEl.replaceChildren(...widgets.map(summary));
}

function paintAccent() {
  document.documentElement.style.setProperty('--accent', accent);
  for (const swatch of accentsEl.children) swatch.setAttribute('aria-pressed', String(swatch.dataset.color === accent));
}

query.addEventListener('input', () => { selected = 0; paintResults(); });
query.addEventListener('keydown', (event) => {
  const list = visible();
  if (event.key === 'ArrowDown') selected = Math.min(selected + 1, list.length - 1);
  else if (event.key === 'ArrowUp') selected = Math.max(selected - 1, 0);
  else if (event.key === 'Enter' && list[selected]) { launcher.open(list[selected].id); return; }
  else return;
  event.preventDefault();
  paintResults();
});

for (const color of ACCENTS) {
  const swatch = el('button', 'swatch');
  swatch.type = 'button';
  swatch.dataset.color = color;
  swatch.title = color;
  swatch.style.background = color;
  swatch.addEventListener('click', async () => {
    accent = color;
    paintAccent();
    await storage.set('accent', color);
    await launcher.setTheme({ colors: { brand: color } });
  });
  accentsEl.append(swatch);
}

const paintMode = (theme) => { document.documentElement.dataset.mode = theme.dark ? 'dark' : 'light'; };
accent = (await storage.get('accent')) ?? accent;
paintAccent();
paintMode(await shell.getTheme());
shell.onThemeChanged(paintMode);
await launcher.setTheme({ colors: { brand: accent } });
launcher.onChange(refresh);
await refresh();
query.focus();
