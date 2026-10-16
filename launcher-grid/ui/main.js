import { launcher, shell, storage } from '/__appshell/sdk.js';

const ACCENTS = ['#2f6fed', '#0e8f9e', '#2f9e5f', '#d9822b', '#c4457a', '#7a5af8'];
const grid = document.getElementById('grid');
const widgetsEl = document.getElementById('widgets');
const empty = document.getElementById('empty');
const accentsEl = document.getElementById('accents');
const modes = document.getElementById('modes');
let accent = ACCENTS[0];
let mode = 'system';

const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};

const hueOf = (id) => [...id].reduce((sum, c) => (sum * 31 + c.charCodeAt(0)) % 360, 7);

function renderBlock(block) {
  if (block.type === 'text') return el('p', '', block.text);
  if (block.type === 'metric') {
    const row = el('div', 'metric');
    row.append(el('strong', '', String(block.value)), el('span', 'quiet', [block.unit, block.label].filter(Boolean).join(' ')));
    return row;
  }
  if (block.type === 'list') {
    const box = el('div');
    for (const item of block.items) {
      const row = el('div', 'row');
      row.append(el('span', '', item.label), el('span', 'quiet', item.value ?? ''));
      box.append(row);
    }
    return box;
  }
  return null;
}

async function render() {
  const [apps, widgets] = await Promise.all([launcher.apps(), launcher.widgets()]);
  const sorted = [...apps].sort((a, b) => a.title.localeCompare(b.title));
  grid.replaceChildren(...sorted.map((app) => {
    const item = el('li');
    const tile = el('button', 'tile');
    tile.type = 'button';
    const icon = el('span', 'icon', app.title.slice(0, 1).toUpperCase());
    icon.style.background = `hsl(${hueOf(app.id)} 55% 46%)`;
    icon.dataset.running = String(app.running);
    tile.append(icon, el('span', 'name', app.title));
    tile.title = app.publisher;
    tile.addEventListener('click', () => launcher.open(app.id));
    item.append(tile);
    return item;
  }));
  empty.hidden = sorted.length > 0;
  widgetsEl.replaceChildren(...widgets.map((w) => {
    const card = el('button', 'widget');
    card.type = 'button';
    card.append(el('h2', '', w.title), ...w.descriptor.blocks.map(renderBlock).filter(Boolean));
    card.addEventListener('click', () => launcher.open(w.appId));
    return card;
  }));
}

function paintControls() {
  document.documentElement.style.setProperty('--accent', accent);
  for (const swatch of accentsEl.children) swatch.setAttribute('aria-pressed', String(swatch.dataset.color === accent));
  for (const button of modes.children) button.setAttribute('aria-pressed', String(button.dataset.mode === mode));
}

function paintTheme(theme) {
  document.documentElement.dataset.mode = theme.dark ? 'dark' : 'light';
  mode = theme.source;
  paintControls();
}

for (const color of ACCENTS) {
  const swatch = el('button', 'swatch');
  swatch.type = 'button';
  swatch.dataset.color = color;
  swatch.title = color;
  swatch.style.background = color;
  swatch.addEventListener('click', async () => {
    accent = color;
    paintControls();
    await storage.set('accent', color);
    await launcher.setTheme({ colors: { brand: color } });
  });
  accentsEl.append(swatch);
}

for (const button of modes.children) {
  button.addEventListener('click', () => launcher.setTheme({ source: button.dataset.mode }));
}

accent = (await storage.get('accent')) ?? accent;
paintTheme(await shell.getTheme());
shell.onThemeChanged(paintTheme);
await launcher.setTheme({ colors: { brand: accent } });
launcher.onChange(render);
await render();
