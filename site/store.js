// Static app store over a catalog (index.json) and repository listings (apps.json).
// All listing text is set with textContent, never parsed as HTML, so a listing cannot inject markup.

/**
 * How an Install button reaches a product. One per `install.type` in config.json.
 * Add a type here (for example, "web": open the app in a web shell) to serve a web store
 * from the same catalog.
 * @type {Record<string, (app: any, config: any) => void>}
 */
const installers = {
  // The desktop app asks the user to confirm and installs from its own catalog by id.
  'desktop-link'(app, { protocol }) {
    window.location.href = `${protocol}://_/install/${encodeURIComponent(app.id)}`;
  },
};

const $ = (/** @type {string} */ id) => /** @type {any} */ (document.getElementById(id));

/** @param {string} tag @param {Record<string, string>} [attrs] @param {(Node | string)[]} [children] */
function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  node.append(...children.filter((c) => c !== ''));
  return node;
}

/** Newest release by semver; prereleases sort before their release. */
function latest(app, channel = 'stable') {
  const parse = (/** @type {string} */ v) => { const [core, pre = ''] = v.split('-', 2); return [...core.split('.').map(Number), pre]; };
  const cmp = (a, b) => {
    const [x, y] = [parse(a.version), parse(b.version)];
    for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] - y[i];
    return x[3] === y[3] ? 0 : !x[3] ? 1 : !y[3] ? -1 : x[3] < y[3] ? -1 : 1;
  };
  return [...app.releases].filter((r) => channel === 'beta' || r.channel === 'stable').sort(cmp).at(-1);
}

const state = { config: /** @type {any} */ (null), apps: /** @type {any[]} */ ([]), query: '' };
const released = (app) => Boolean(latest(app));
const HEX = /^#[0-9a-f]{6}$/i;

/** @param {any} app @param {HTMLElement} node */
function accent(app, node) {
  if (HEX.test(app.accent ?? '')) node.style.setProperty('--accent', app.accent);
  return node;
}
const icon = (app, size = '') => app.icon
  ? el('img', { class: `icon ${size}`, src: app.icon, alt: '' })
  : accent(app, el('span', { class: `icon blank ${size}`, 'aria-hidden': 'true' }, [app.title.slice(0, 1)]));
const category = (app) => (app.categories ?? [])[0] ?? 'Apps';
const appLink = (app) => `#/app/${encodeURIComponent(app.id)}`;
const status = (app) => (released(app) ? `Version ${latest(app).version}` : app.included ? 'Included' : 'Coming soon');
/** Short state for tiles: Get, Included or Soon. */
const badge = (app) => el('span', { class: released(app) ? 'tile-state' : 'tile-state soon' }, [released(app) ? 'Get' : app.included ? 'Included' : 'Soon']);

/** Merges catalog releases with repository listings; paths become absolute URLs. */
function merge(catalog, catalogBase, listings) {
  const abs = (/** @type {string} */ base) => (/** @type {string | undefined} */ p) => (p ? new URL(p, base).href : undefined);
  const fromCatalog = abs(catalogBase);
  const fromPage = abs(location.href);
  const byId = new Map();
  for (const c of catalog.apps ?? []) {
    byId.set(c.id, { ...c, icon: fromCatalog(c.icon), screenshots: (c.screenshots ?? []).map(fromCatalog) });
  }
  for (const l of listings.apps ?? []) {
    const c = byId.get(l.id) ?? { releases: [] };
    byId.set(l.id, {
      ...l, ...Object.fromEntries(Object.entries(c).filter(([, v]) => v !== undefined)),
      // Presentation comes from the repository listing when there is one.
      ...Object.fromEntries(['description', 'categories', 'tagline', 'accent', 'highlights', 'whatsNew']
        .filter((k) => l[k] !== undefined).map((k) => [k, l[k]])),
      icon: fromPage(l.icon) ?? c.icon,
      screenshots: l.screenshots?.length ? l.screenshots.map(fromPage) : (c.screenshots ?? []),
      repository: c.repository ?? l.source,
      releases: c.releases ?? [],
    });
  }
  return [...byId.values()].sort((a, b) => Number(released(b)) - Number(released(a)) || a.title.localeCompare(b.title));
}

// ---- Home ----------------------------------------------------------------

/** A screenshot in a desktop window frame, so app shots read as an app rather than a blank page. */
const framed = (src, alt = '') => el('div', { class: 'window' }, [
  el('div', { class: 'window-bar', 'aria-hidden': 'true' }, [el('span'), el('span'), el('span')]),
  el('img', { src, alt, loading: 'lazy' }),
]);

/** Featured banner: one app at a time, with tabs to switch. No auto-rotation. */
function spotlight(apps) {
  const order = state.config.featured ?? [];
  const rank = (a) => (order.includes(a.id) ? order.indexOf(a.id) : order.length);
  const featured = apps.filter((a) => a.screenshots.length).sort((a, b) => rank(a) - rank(b)).slice(0, 4);
  if (!featured.length) return '';
  const stage = el('div', { class: 'feature-stage', id: 'feature-stage' });
  const tabs = featured.map((app, i) => {
    const t = el('button', { type: 'button', class: 'feature-tab', role: 'tab', 'aria-controls': 'feature-stage' }, [
      icon(app), el('span', {}, [el('strong', {}, [app.title]), el('span', {}, [app.tagline ?? category(app)])]),
    ]);
    t.addEventListener('click', () => show(i));
    return t;
  });
  const show = (i) => {
    const app = featured[i];
    tabs.forEach((t, j) => t.setAttribute('aria-selected', String(i === j)));
    accent(app, stage);
    stage.replaceChildren(el('a', { class: 'feature', href: appLink(app) }, [
      el('div', { class: 'feature-text' }, [
        el('p', { class: 'feature-kind' }, [released(app) ? category(app) : status(app)]),
        el('h2', {}, [app.title]),
        el('p', { class: 'feature-tagline' }, [app.tagline ?? '']),
        el('p', { class: 'feature-desc' }, [app.description ?? '']),
        el('span', { class: 'feature-cta' }, [released(app) ? 'View and install' : 'See what it does']),
      ]),
      framed(app.screenshots[0]),
    ]));
  };
  show(0);
  return el('section', { class: 'featured', 'aria-label': 'Featured apps' }, [
    stage,
    featured.length > 1 ? el('div', { class: 'feature-tabs', role: 'tablist', 'aria-label': 'Featured apps' }, tabs) : '',
  ]);
}

const tile = (app) => el('a', { class: 'tile', href: appLink(app) }, [
  icon(app),
  el('span', { class: 'tile-text' }, [
    el('span', { class: 'tile-title' }, [app.title]),
    el('span', { class: 'tile-sub' }, [app.tagline ?? category(app)]),
    el('span', { class: 'row-meta' }, [category(app)]),
  ]),
  badge(app),
]);

function shelf(title, apps, href, limit = 6) {
  if (!apps.length) return '';
  const more = apps.length > limit;
  return el('section', { class: 'shelf' }, [
    el('div', { class: 'shelf-head' }, [el('h2', {}, [title]), href && more ? el('a', { href }, [`See all ${apps.length}`]) : '']),
    el('div', { class: 'cards' }, apps.slice(0, limit).map(tile)),
  ]);
}

function categories() {
  return [...new Set(state.apps.flatMap((a) => a.categories ?? []))].sort();
}

function chips(current = '') {
  const all = categories();
  if (!all.length) return '';
  const chip = (label, href, on) => el('a', { class: 'chip', href, 'aria-current': on ? 'page' : 'false' }, [label]);
  return el('nav', { class: 'chips', 'aria-label': 'Categories' }, [
    chip('All apps', '#/', !current),
    ...all.map((c) => chip(c, `#/category/${encodeURIComponent(c)}`, c === current)),
  ]);
}

function renderHome() {
  const apps = state.apps;
  if (!apps.length) return [el('p', { class: 'empty' }, ['No apps yet. Add an app folder to the repository to list it here.'])];
  const out = [
    el('section', { class: 'hero' }, [el('h1', {}, [state.config.name]), el('p', {}, [state.config.tagline])]),
    spotlight(apps),
    chips(),
    shelf('Available now', apps.filter(released)),
  ];
  for (const c of categories()) {
    const inCat = apps.filter((a) => (a.categories ?? []).includes(c));
    if (inCat.length > 3) out.push(shelf(c, inCat, `#/category/${encodeURIComponent(c)}`));
  }
  out.push(shelf(`Included with ${state.config.install.productName}`, apps.filter((a) => !released(a) && a.included)));
  out.push(shelf('Coming soon', apps.filter((a) => !released(a) && !a.included)));
  return out;
}

const row = (app) => el('a', { class: 'row', href: appLink(app) }, [
  icon(app),
  el('span', { class: 'row-text' }, [
    el('span', { class: 'tile-title' }, [app.title]),
    el('span', { class: 'tile-sub' }, [app.tagline ?? app.description ?? '']),
    el('span', { class: 'row-meta' }, [`${category(app)}, ${status(app).toLowerCase()}`]),
  ]),
  badge(app),
]);

function renderList(title, apps, current) {
  return [
    el('section', { class: 'hero small' }, [el('h1', {}, [title])]),
    chips(current),
    apps.length
      ? el('div', { class: 'rows' }, apps.map(row))
      : el('p', { class: 'empty' }, [state.query ? `No apps match "${state.query}". Try a shorter word or browse a category.` : 'No apps here yet.']),
  ];
}

function matches(app, q) {
  return [app.title, app.publisher, app.tagline ?? '', app.description ?? '', ...(app.categories ?? [])]
    .some((t) => t.toLowerCase().includes(q));
}

// ---- App page ------------------------------------------------------------

function facts(app) {
  const release = latest(app);
  const net = app.capabilities?.network ?? [];
  const items = [
    ['Version', release?.version ?? app.version ?? '—'],
    ['Category', category(app)],
    ['Network', net.length ? `${net.length} host${net.length > 1 ? 's' : ''}` : 'None'],
    ['Widgets', String(app.widgets?.length ?? 0)],
  ];
  return el('dl', { class: 'facts' }, items.map(([k, v]) => el('div', {}, [el('dt', {}, [k]), el('dd', {}, [v])])));
}

/** What the app can reach, from its manifest. Every app is sandboxed with its own storage. */
function permissions(app) {
  const caps = app.capabilities ?? {};
  const list = [['Its own private storage on this computer', 'Other apps cannot read it.']];
  list.push(caps.network?.length
    ? ['Internet access to named servers', caps.network.join(', ')]
    : ['No internet access', 'The app can only load its own files.']);
  if (app.backend) list.push(['A background process', 'Runs sandboxed, with no access to your files.']);
  if (caps.notifications) list.push(['Notifications', 'Can show desktop notifications.']);
  if (caps.identity) list.push(['Your identity', 'Can ask the desktop app to confirm who you are to its own server.']);
  if (caps.secrets?.length) list.push(['Saved secrets', `Can store: ${caps.secrets.join(', ')}.`]);
  if (app.widgets?.length) list.push(['Dashboard widgets', app.widgets.join(', ')]);
  return el('ul', { class: 'perms' }, list.map(([t, d]) => el('li', {}, [el('strong', {}, [t]), el('span', {}, [d])])));
}

function provenance(app) {
  const release = latest(app);
  const repo = app.repository ?? '';
  const repoText = repo.replace(/^https:\/\/(www\.)?github\.com\//, '');
  if (!release) {
    return el('section', { class: 'prov pending' }, [
      el('h2', {}, [app.included ? 'Ships inside the desktop app' : 'How it will ship']),
      el('p', {}, [app.included ? `This app comes installed with ${state.config.install.productName}, built from the source below.` : 'When this app is released, CI builds it from its source folder and pins the package by its SHA-256. The desktop app checks that digest before installing.']),
      repo ? el('a', { href: repo, rel: 'noopener' }, [`Read the source on GitHub`]) : '',
    ]);
  }
  const step = (name, value, detail) => el('li', {}, [el('span', { class: 'prov-name' }, [name]), value, el('span', { class: 'prov-detail' }, [detail])]);
  return el('section', { class: 'prov' }, [
    el('h2', {}, ['Built from source, checked on install']),
    el('ol', {}, [
      step('Source', el('a', { href: repo, rel: 'noopener' }, [repoText]), 'Public repository'),
      step('Build', el('code', {}, [release.commit.slice(0, 12)]), 'Commit CI built from'),
      step('Verify', el('code', { class: 'digest', title: release.sha256 }, [release.sha256]), 'SHA-256 the desktop app checks'),
    ]),
  ]);
}

function versionHistory(app) {
  const releases = [...app.releases].reverse();
  if (!releases.length) return '';
  return el('section', {}, [
    el('h2', {}, ['Version history']),
    el('ul', { class: 'history' }, releases.map((r) => el('li', {}, [
      el('span', {}, [r.version]), el('span', { class: r.channel === 'beta' ? 'badge beta' : 'badge' }, [r.channel === 'beta' ? 'Beta' : 'Stable']),
    ]))),
  ]);
}

function gallery(app) {
  if (!app.screenshots.length) return '';
  return el('div', { class: 'gallery' }, app.screenshots.slice(0, 4).map((src, i) => {
    const b = el('button', { class: 'shot', type: 'button', 'aria-label': `Enlarge screenshot ${i + 1}` }, [framed(src, `${app.title} screenshot ${i + 1}`)]);
    b.addEventListener('click', () => openLightbox(app, i));
    return b;
  }));
}

function installButton(app, big = false) {
  const release = latest(app);
  const button = el('button', { type: 'button', class: `button primary${big ? ' big' : ''}` }, [release ? 'Install' : status(app)]);
  if (!release) button.setAttribute('disabled', '');
  else button.addEventListener('click', () => openInstall(app, release));
  return button;
}

function renderApp(id) {
  const app = state.apps.find((a) => a.id === id);
  if (!app) return [el('a', { class: 'back', href: '#/' }, ['All apps']), el('p', { class: 'empty' }, ['This app is not in the store. It may have been renamed or removed.'])];
  document.title = `${app.title} – ${state.config.name}`;
  const similar = state.apps.filter((a) => a !== app && (a.categories ?? []).some((c) => (app.categories ?? []).includes(c)));
  const others = similar.length ? similar : state.apps.filter((a) => a !== app);
  return [
    el('a', { class: 'back', href: '#/' }, ['All apps']),
    accent(app, el('section', { class: 'app-head' }, [
      icon(app, 'large'),
      el('div', { class: 'app-title' }, [
        el('h1', {}, [app.title]),
        el('p', { class: 'publisher' }, [app.publisher]),
        app.tagline ? el('p', { class: 'tagline' }, [app.tagline]) : '',
      ]),
      el('div', { class: 'app-cta' }, [
        installButton(app, true),
        el('p', { class: 'hint' }, [released(app) ? `Opens ${state.config.install.productName}, which asks before installing.` : app.included ? `Comes with ${state.config.install.productName}.` : 'Not released yet.']),
      ]),
    ])),
    facts(app),
    gallery(app),
    el('div', { class: 'cols' }, [
      el('div', { class: 'main-col' }, [
        el('section', {}, [
          el('h2', {}, ['About this app']),
          el('p', { class: 'about' }, [app.description ?? 'No description yet.']),
          app.highlights?.length ? el('ul', { class: 'highlights' }, app.highlights.map((h) => el('li', {}, [h]))) : '',
        ]),
        app.whatsNew ? el('section', {}, [
          el('h2', {}, ["What's new"]),
          el('p', { class: 'muted' }, [released(app) ? status(app) : `Version ${app.version}`]),
          el('p', {}, [app.whatsNew]),
        ]) : '',
        el('section', {}, [el('h2', {}, ['What it can access']), permissions(app)]),
      ]),
      el('aside', { class: 'side-col' }, [
        provenance(app),
        versionHistory(app),
        el('section', {}, [
          el('h2', {}, ['Publisher']),
          el('p', {}, [app.publisher]),
          app.repository ? el('a', { href: app.repository, rel: 'noopener' }, ['Source code']) : '',
        ]),
      ]),
    ]),
    shelf(similar.length ? 'More like this' : 'More apps', others),
  ];
}

// ---- Dialogs -------------------------------------------------------------

let pending = 0;
function openInstall(app, release) {
  const { productName, downloadUrl } = state.config.install;
  const dialog = $('install');
  accent(app, dialog);
  $('install-icon').src = app.icon ?? '';
  $('install-title').textContent = `Install ${app.title}`;
  $('install-step-1').textContent = `${productName} opens and asks you to confirm.`;
  $('install-step-2').textContent = `It downloads version ${release.version} and checks it matches the published SHA-256.`;
  $('install-status').replaceChildren();
  const go = $('install-go');
  go.textContent = `Open ${productName}`;
  go.onclick = () => {
    installers[state.config.install.type](app, state.config.install);
    $('install-status').textContent = `Waiting for ${productName}…`;
    clearTimeout(pending);
    pending = setTimeout(() => {
      if (!dialog.open || !document.hasFocus()) return;
      $('install-status').replaceChildren(`Nothing happened? Install ${productName} first. `,
        el('a', { href: downloadUrl, rel: 'noopener' }, [`Download ${productName}`]));
    }, 2000);
  };
  dialog.showModal();
}

const lightbox = { app: /** @type {any} */ (null), index: 0 };
function showShot() {
  const { app, index } = lightbox;
  $('lightbox-img').src = app.screenshots[index];
  $('lightbox-img').alt = `${app.title} screenshot ${index + 1}`;
  $('lightbox-count').textContent = `${index + 1} of ${app.screenshots.length}`;
  $('lightbox-prev').disabled = index === 0;
  $('lightbox-next').disabled = index === app.screenshots.length - 1;
}
function openLightbox(app, index) {
  Object.assign(lightbox, { app, index });
  showShot();
  $('lightbox').showModal();
}
function stepShot(delta) {
  const next = lightbox.index + delta;
  if (lightbox.app && next >= 0 && next < lightbox.app.screenshots.length) { lightbox.index = next; showShot(); }
}

// ---- Routing -------------------------------------------------------------

function route() {
  const [, kind, arg] = /^#\/(app|category)\/(.+)$/.exec(location.hash) ?? [];
  const q = state.query.toLowerCase();
  document.title = state.config.name;
  let view;
  if (kind === 'app') view = renderApp(decodeURIComponent(arg));
  else if (q) view = renderList(`Results for "${state.query}"`, state.apps.filter((a) => matches(a, q)));
  else if (kind === 'category') {
    const c = decodeURIComponent(arg);
    view = renderList(c, state.apps.filter((a) => (a.categories ?? []).includes(c)), c);
  } else view = renderHome();
  $('view').replaceChildren(...view.filter((n) => n !== ''));
  if (!q) window.scrollTo(0, 0);
}

async function start() {
  state.config = await (await fetch('config.json')).json();
  const base = new URL(state.config.catalog, location.href).href;
  $('store-name').textContent = state.config.name;
  $('get-product').href = state.config.install.downloadUrl;
  $('get-product').textContent = `Get ${state.config.install.productName}`;
  const load = (url) => fetch(url, { cache: 'no-cache' }).then((r) => (r.ok ? r.json() : {})).catch(() => ({}));
  const [catalog, listings] = await Promise.all([load(base), load('apps.json')]);
  state.apps = merge(catalog, base, listings);

  $('search').addEventListener('input', (/** @type {any} */ e) => {
    state.query = e.target.value.trim();
    if (location.hash.startsWith('#/app/')) history.replaceState(null, '', '#/');
    route();
  });
  $('lightbox-prev').addEventListener('click', () => stepShot(-1));
  $('lightbox-next').addEventListener('click', () => stepShot(1));
  $('lightbox-close').addEventListener('click', () => $('lightbox').close());
  $('lightbox').addEventListener('keydown', (/** @type {KeyboardEvent} */ e) => {
    if (e.key === 'ArrowLeft') stepShot(-1);
    if (e.key === 'ArrowRight') stepShot(1);
  });
  // A click on the backdrop (the dialog itself, outside its content) closes it.
  for (const id of ['lightbox', 'install']) {
    $(id).addEventListener('click', (/** @type {MouseEvent} */ e) => { if (e.target === e.currentTarget) $(id).close(); });
  }
  window.addEventListener('hashchange', () => { if (!location.hash.startsWith('#/app/')) state.query && clearSearch(); route(); });
  route();
}

function clearSearch() {
  state.query = '';
  $('search').value = '';
}

start();
