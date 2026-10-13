// Static app store over a catalog index.json. All catalog text is set with textContent,
// never parsed as HTML, so a listing cannot inject markup into the page.

/**
 * How an Install button reaches a product. One per `install.type` in config.json.
 * Add a type here (for example, "web": open the app in a web shell) to serve a web store
 * from the same catalog.
 * @type {Record<string, (app: any, config: any) => void>}
 */
const installers = {
  // The desktop app asks the user to confirm and installs from its own catalog by id.
  'desktop-link'(app, { protocol, productName, downloadUrl }) {
    window.location.href = `${protocol}://_/install/${encodeURIComponent(app.id)}`;
    toast(`Opening ${productName}…`);
    setTimeout(() => {
      if (document.hasFocus()) toast(`Nothing happened? Install ${productName} first.`, downloadUrl);
    }, 2000);
  },
};

const $ = (/** @type {string} */ id) => /** @type {HTMLElement} */ (document.getElementById(id));

/** @param {string} tag @param {Record<string, string>} [attrs] @param {(Node | string)[]} [children] */
function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  node.append(...children);
  return node;
}

/** @param {string} message @param {string} [link] */
function toast(message, link) {
  const box = $('toast');
  box.replaceChildren(message, ...(link ? [' ', el('a', { href: link, rel: 'noopener' }, ['Download'])] : []));
  box.hidden = false;
  clearTimeout(/** @type {any} */ (toast).timer);
  /** @type {any} */ (toast).timer = setTimeout(() => { box.hidden = true; }, 6000);
}

/** Newest release by semver; prereleases sort before their release. */
function latest(app, channel = 'stable') {
  const parse = (/** @type {string} */ v) => { const [core, pre = ''] = v.split('-', 2); return [...core.split('.').map(Number), pre]; };
  const cmp = (a, b) => {
    const [x, y] = [parse(a.version), parse(b.version)];
    for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] - y[i];
    return x[3] === y[3] ? 0 : !x[3] ? 1 : !y[3] ? -1 : x[3] < y[3] ? -1 : 1;
  };
  return app.releases.filter((r) => channel === 'beta' || r.channel === 'stable').sort(cmp).at(-1);
}

const state = { config: /** @type {any} */ (null), apps: /** @type {any[]} */ ([]), base: '', category: '' };
const asset = (/** @type {string | undefined} */ path) => (path ? new URL(path, state.base).href : '');
const icon = (app, large = false) => el('img', { class: large ? 'icon large' : 'icon', src: asset(app.icon), alt: '' });

function installButton(app) {
  const release = latest(app);
  const button = el('button', { class: 'install' }, [release ? 'Install' : 'Not released']);
  if (!release) button.setAttribute('disabled', '');
  button.addEventListener('click', (event) => {
    event.preventDefault();
    installers[state.config.install.type](app, state.config.install);
  });
  return button;
}

function renderList() {
  const query = /** @type {HTMLInputElement} */ ($('search')).value.trim().toLowerCase();
  const categories = [...new Set(state.apps.flatMap((a) => a.categories ?? []))].sort();
  const shown = state.apps.filter((a) =>
    (!state.category || (a.categories ?? []).includes(state.category)) &&
    (!query || [a.title, a.publisher, a.description ?? ''].some((t) => t.toLowerCase().includes(query))));

  const chip = (/** @type {string} */ label, value) => {
    const button = el('button', { class: 'chip', 'aria-pressed': String(state.category === value) }, [label]);
    button.addEventListener('click', () => { state.category = value; renderList(); });
    return button;
  };
  $('view').replaceChildren(
    el('section', { class: 'hero' }, [el('h1', {}, [state.config.name]), el('p', {}, [state.config.tagline])]),
    categories.length ? el('div', { class: 'chips' }, [chip('All', ''), ...categories.map((c) => chip(c, c))]) : '',
    shown.length
      ? el('div', { class: 'grid' }, shown.map((app) => el('a', { class: 'card', href: `#/app/${encodeURIComponent(app.id)}` }, [
        icon(app),
        el('div', {}, [el('h2', {}, [app.title]), el('div', { class: 'meta' }, [`${app.publisher} · ${latest(app)?.version ?? 'unreleased'}`])]),
        el('p', {}, [app.description ?? '']),
      ])))
      : el('p', { class: 'empty' }, [state.apps.length ? 'No apps match.' : 'No apps released yet.']),
  );
}

function renderApp(id) {
  const app = state.apps.find((a) => a.id === id);
  if (!app) { $('view').replaceChildren(el('p', { class: 'empty' }, ['App not found.'])); return; }
  const release = latest(app);
  document.title = `${app.title} · ${state.config.name}`;
  $('view').replaceChildren(
    el('a', { class: 'back', href: '#/' }, ['← All apps']),
    el('div', { class: 'detail-head' }, [
      icon(app, true),
      el('div', { class: 'grow' }, [el('h1', {}, [app.title]), el('div', { class: 'meta' }, [[app.publisher, ...(app.categories ?? [])].join(' · ')])]),
      el('div', {}, [installButton(app), el('p', { class: 'hint' }, [`Opens ${state.config.install.productName}, which asks before installing.`])]),
    ]),
    (app.screenshots ?? []).length
      ? el('div', { class: 'shots' }, app.screenshots.map((s, i) => el('img', { src: asset(s), alt: `${app.title} screenshot ${i + 1}`, loading: 'lazy' })))
      : '',
    el('div', { class: 'cols' }, [
      el('section', {}, [el('h2', {}, ['About']), el('p', {}, [app.description ?? 'No description.'])]),
      el('section', {}, [el('h2', {}, ['Release']), el('dl', {}, release ? [
        el('dt', {}, ['Version']), el('dd', {}, [release.version]),
        el('dt', {}, ['Channel']), el('dd', {}, [release.channel]),
        el('dt', {}, ['Source']), el('dd', {}, [el('a', { href: app.repository, rel: 'noopener' }, [app.repository.replace('https://', '')])]),
        el('dt', {}, ['Commit']), el('dd', {}, [el('code', {}, [release.commit.slice(0, 12)])]),
        el('dt', {}, ['SHA-256']), el('dd', {}, [el('code', {}, [release.sha256])]),
      ] : [el('dt', {}, ['Status']), el('dd', {}, ['Not released yet'])])]),
    ]),
  );
}

function route() {
  const match = /^#\/app\/(.+)$/.exec(location.hash);
  if (match) renderApp(decodeURIComponent(match[1]));
  else { document.title = state.config.name; renderList(); }
  window.scrollTo(0, 0);
}

async function start() {
  state.config = await (await fetch('config.json')).json();
  state.base = new URL(state.config.catalog, location.href).href;
  $('store-name').textContent = state.config.name;
  try {
    const catalog = await (await fetch(state.base, { cache: 'no-cache' })).json();
    state.apps = catalog.apps ?? [];
  } catch {
    $('view').replaceChildren(el('p', { class: 'empty' }, ['The catalog could not be loaded.']));
    return;
  }
  $('search').addEventListener('input', () => { if (location.hash.startsWith('#/app/')) location.hash = '#/'; else renderList(); });
  window.addEventListener('hashchange', route);
  route();
}

start();
