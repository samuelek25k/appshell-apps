// Static app store over a catalog (index.json) and repository listings (apps.json).
// Modernized with Tailwind CSS, light/dark theming, and an authentic developer UX.

/**
 * How an Install button reaches a product. One per `install.type` in config.json.
 * @type {Record<string, (app: any, config: any) => void>}
 */
const installers = {
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

const icon = (app, size = '') => {
  const sizeClass = size === 'large'
    ? 'w-24 h-24 sm:w-28 sm:h-28 shadow-lg border border-slate-200/80 dark:border-slate-800'
    : 'w-14 h-14 shadow-sm border border-slate-200/80 dark:border-slate-800 flex-shrink-0';
  return app.icon
    ? el('img', { class: `object-cover ${sizeClass}`, src: app.icon, alt: '' })
    : accent(app, el('div', { class: `${sizeClass} flex items-center justify-center font-bold text-xl text-white bg-indigo-600` }, [app.title.slice(0, 1)]));
};

const category = (app) => (app.categories ?? [])[0] ?? 'Utilities';
const appLink = (app) => `#/app/${encodeURIComponent(app.id)}`;
const status = (app) => (released(app) ? `v${latest(app).version}` : app.included ? 'Included' : 'Coming soon');

/** Short state badge for tiles with sharp edges */
const badge = (app) => {
  if (released(app)) {
    return el('span', { class: 'inline-flex items-center px-2 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30' }, ['Get']);
  }
  if (app.included) {
    return el('span', { class: 'inline-flex items-center px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700' }, ['Built-in']);
  }
  return el('span', { class: 'inline-flex items-center px-2 py-0.5 text-xs font-medium bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30' }, ['Soon']);
};

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

// ---- Home Components --------------------------------------------------------

/** A screenshot in a desktop window frame */
const framed = (src, alt = '') => el('div', { class: 'window shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden' }, [
  el('div', { class: 'window-bar', 'aria-hidden': 'true' }, [el('span'), el('span'), el('span')]),
  el('img', { src, alt, loading: 'lazy' }),
]);

function scroller(track, label) {
  track.classList.add('track');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const arrow = (dir) => {
    const b = el('button', { type: 'button', class: 'arrow', 'aria-label': `${dir < 0 ? 'Previous' : 'Next'} ${label}` }, [
      el('span', { 'aria-hidden': 'true' }, [dir < 0 ? '‹' : '›']),
    ]);
    b.addEventListener('click', () => track.scrollBy({ left: dir * track.clientWidth * 0.85, behavior: reduce ? 'auto' : 'smooth' }));
    return b;
  };
  const [prev, next] = [arrow(-1), arrow(1)];
  const controls = el('div', { class: 'arrows flex items-center gap-2' }, [prev, next]);
  const update = () => {
    const max = track.scrollWidth - track.clientWidth;
    controls.hidden = max <= 2;
    prev.disabled = track.scrollLeft <= 2;
    next.disabled = track.scrollLeft >= max - 2;
    track.classList.toggle('more-left', !prev.disabled);
    track.classList.toggle('more-right', !next.disabled && max > 2);
    track.dispatchEvent(new Event('track-update'));
  };
  track.addEventListener('scroll', update, { passive: true });
  new ResizeObserver(update).observe(track);
  return { track, controls };
}

/** Featured apps: spotlight carousel with sharp styling */
function spotlight(apps) {
  const order = state.config.featured ?? [];
  const rank = (a) => (order.includes(a.id) ? order.indexOf(a.id) : order.length);
  const featured = apps.filter((a) => a.screenshots.length).sort((a, b) => rank(a) - rank(b)).slice(0, 5);
  if (!featured.length) return '';
  const slides = featured.map((app) => accent(app, el('a', { class: 'group relative grid grid-cols-1 lg:grid-cols-12 gap-8 items-center p-8 sm:p-10 overflow-hidden text-white no-underline bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 shadow-2xl transition-all duration-300 hover:border-slate-700', href: appLink(app) }, [
    el('div', { class: 'lg:col-span-5 flex flex-col items-start z-10' }, [
      el('span', { class: 'inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold bg-white/10 text-indigo-200 border border-white/20 backdrop-blur-md mb-4' }, [category(app)]),
      el('h2', { class: 'text-2xl sm:text-4xl font-extrabold tracking-tight text-white mb-2' }, [app.title]),
      el('p', { class: 'text-base sm:text-lg font-medium text-slate-200 mb-3' }, [app.tagline ?? '']),
      el('p', { class: 'text-sm text-slate-400 line-clamp-3 mb-6 max-w-prose leading-relaxed' }, [app.description ?? '']),
      el('span', { class: 'inline-flex items-center gap-2 px-5 py-2.5 bg-white text-slate-900 font-semibold text-sm shadow-md transition-all group-hover:bg-slate-100 group-hover:gap-3' }, [
        released(app) ? 'View & Install' : 'Inspect App',
        el('span', {}, ['→'])
      ]),
    ]),
    el('div', { class: 'lg:col-span-7 w-full' }, [
      framed(app.screenshots[0]),
    ]),
  ])));
  const { track, controls } = scroller(el('div', { class: 'grid grid-flow-col auto-cols-[100%] gap-4 overflow-x-auto pb-4 scroll-smooth' }, slides), 'featured app');
  const offset = (/** @type {HTMLElement} */ s) => s.offsetLeft - track.offsetLeft;
  const dots = slides.map((slide, i) => {
    const d = el('button', { type: 'button', class: 'dot', 'aria-label': `Show ${featured[i].title}` });
    d.addEventListener('click', () => track.scrollTo({ left: offset(slide), behavior: 'smooth' }));
    return d;
  });
  track.addEventListener('track-update', () => {
    const at = slides.reduce((best, s, i) => (Math.abs(offset(s) - track.scrollLeft) < Math.abs(offset(slides[best]) - track.scrollLeft) ? i : best), 0);
    dots.forEach((d, i) => d.setAttribute('aria-current', String(i === at)));
  });
  return el('section', { class: 'mb-10 space-y-4', 'aria-label': 'Featured spotlight' }, [
    track,
    slides.length > 1 ? el('div', { class: 'flex items-center justify-between pt-1' }, [el('div', { class: 'flex items-center gap-2' }, dots), controls]) : '',
  ]);
}

/** Marketplace Card (IndustryApps inspired sharp card) */
const tile = (app) => el('a', {
  class: 'group flex flex-col justify-between p-5 bg-white dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800/80 hover:border-slate-400 dark:hover:border-slate-600 shadow-sm hover:shadow-md transition-all no-underline text-inherit',
  href: appLink(app)
}, [
  el('div', {}, [
    el('div', { class: 'flex items-start justify-between gap-3 mb-4' }, [
      icon(app),
      badge(app),
    ]),
    el('h3', { class: 'font-bold text-base text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors' }, [app.title]),
    el('p', { class: 'mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed' }, [app.tagline ?? app.description ?? '']),
  ]),
  el('div', { class: 'mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400' }, [
    el('span', { class: 'font-medium' }, [category(app)]),
    el('span', { class: 'font-mono text-[11px]' }, [status(app)]),
  ]),
]);

function shelf(title, apps, href) {
  if (!apps.length) return '';
  return el('section', { class: 'mb-12' }, [
    el('div', { class: 'flex items-center justify-between mb-4 pb-2 border-b border-slate-200/80 dark:border-slate-800/80' }, [
      el('div', { class: 'flex items-baseline gap-3' }, [
        el('h2', { class: 'text-xl font-bold tracking-tight text-slate-900 dark:text-white' }, [title]),
        el('span', { class: 'text-xs text-slate-500 font-mono' }, [`${apps.length} app${apps.length > 1 ? 's' : ''}`]),
      ]),
      href ? el('a', { href, class: 'text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline' }, ['Browse all →']) : '',
    ]),
    el('div', { class: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' }, apps.map(tile)),
  ]);
}

function categories() {
  return [...new Set(state.apps.flatMap((a) => a.categories ?? []))].sort();
}

function chips(current = '') {
  const all = categories();
  if (!all.length) return '';
  const chip = (label, href, on) => el('a', {
    class: `px-4 py-2 text-xs font-semibold transition-all no-underline ${
      on
        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
        : 'bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700/80 hover:bg-slate-50 dark:hover:bg-slate-800'
    }`,
    href,
    'aria-current': on ? 'page' : 'false'
  }, [label]);
  return el('nav', { class: 'flex items-center gap-2 overflow-x-auto py-2 mb-8 scrollbar-none', 'aria-label': 'Categories' }, [
    chip('All apps', '#/', !current),
    ...all.map((c) => chip(c, `#/category/${encodeURIComponent(c)}`, c === current)),
  ]);
}

function renderHome() {
  const apps = state.apps;
  if (!apps.length) return [el('p', { class: 'text-center py-20 text-slate-500' }, ['No apps in catalog yet.'])];
  
  const hero = el('div', { class: 'py-8 sm:py-12 flex flex-col md:flex-row items-start md:items-end justify-between gap-6' }, [
    el('div', { class: 'max-w-2xl' }, [
      el('div', { class: 'inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400 border border-brand-200/50 dark:border-brand-500/20 mb-4' }, [
        el('span', { class: 'w-2 h-2 bg-emerald-500 animate-pulse' }),
        'Live Static Catalog'
      ]),
      el('h1', { class: 'text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1]' }, [state.config.name]),
      el('p', { class: 'mt-3 text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-xl leading-relaxed' }, [state.config.tagline]),
    ]),
    el('div', { class: 'w-full md:w-auto min-w-[280px]' }, [
      el('div', { class: 'relative' }, [
        el('input', {
          id: 'search-input',
          type: 'search',
          placeholder: 'Search apps or categories...',
          value: state.query,
          class: 'w-full px-4 py-2.5 pl-10 text-sm bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand-500 dark:focus:border-brand-400 transition-all shadow-sm'
        }),
        el('span', { class: 'absolute left-3.5 top-3 text-slate-400' }, ['🔍']),
      ])
    ])
  ]);

  const out = [
    hero,
    spotlight(apps),
    chips(),
    shelf('Available Now', apps.filter(released)),
  ];

  for (const c of categories()) {
    const inCat = apps.filter((a) => (a.categories ?? []).includes(c));
    if (inCat.length > 1) out.push(shelf(c, inCat, `#/category/${encodeURIComponent(c)}`));
  }
  out.push(shelf(`Shipped with ${state.config.install.productName}`, apps.filter((a) => !released(a) && a.included)));
  out.push(shelf('Coming Soon', apps.filter((a) => !released(a) && !a.included)));
  return out;
}

const row = (app) => el('a', {
  class: 'group flex items-center justify-between p-4 bg-white dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm transition-all no-underline text-inherit',
  href: appLink(app)
}, [
  el('div', { class: 'flex items-center gap-4 min-w-0' }, [
    icon(app),
    el('div', { class: 'min-w-0' }, [
      el('h3', { class: 'font-bold text-sm text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 truncate' }, [app.title]),
      el('p', { class: 'text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5' }, [app.tagline ?? app.description ?? '']),
      el('span', { class: 'text-[11px] text-slate-400 dark:text-slate-500' }, [`${category(app)} • ${status(app)}`]),
    ]),
  ]),
  el('div', { class: 'ml-4 flex-shrink-0' }, [badge(app)]),
]);

function renderList(title, apps, current) {
  return [
    el('div', { class: 'py-6 flex items-center justify-between' }, [
      el('div', {}, [
        el('h1', { class: 'text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white' }, [title]),
        el('p', { class: 'text-sm text-slate-500 mt-1' }, [`Showing ${apps.length} application${apps.length === 1 ? '' : 's'}`]),
      ]),
      el('a', { href: '#/', class: 'text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline' }, ['← Back to store']),
    ]),
    chips(current),
    apps.length
      ? el('div', { class: 'grid grid-cols-1 md:grid-cols-2 gap-4' }, apps.map(row))
      : el('div', { class: 'text-center py-16' }, [
          el('p', { class: 'text-slate-500 text-sm' }, [state.query ? `No apps matching "${state.query}".` : 'No apps here yet.']),
          el('button', { type: 'button', class: 'mt-3 text-xs font-semibold text-brand-600 hover:underline', onclick: () => { clearSearch(); route(); } }, ['Clear search']),
        ]),
  ];
}

function matches(app, q) {
  return [app.title, app.publisher, app.tagline ?? '', app.description ?? '', ...(app.categories ?? [])]
    .some((t) => t.toLowerCase().includes(q));
}

// ---- App Page Details -------------------------------------------------------

function facts(app) {
  const release = latest(app);
  const net = app.capabilities?.network ?? [];
  const items = [
    ['Version', release?.version ?? app.version ?? '—'],
    ['Category', category(app)],
    ['Network Access', net.length ? `${net.length} host${net.length > 1 ? 's' : ''}` : 'Fully Offline'],
    ['Widgets', String(app.widgets?.length ?? 0)],
  ];
  return el('div', { class: 'grid grid-cols-2 sm:grid-cols-4 gap-3 my-8' }, items.map(([k, v]) => el('div', { class: 'p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center' }, [
    el('div', { class: 'text-xs text-slate-500 dark:text-slate-400 font-medium' }, [k]),
    el('div', { class: 'mt-1 text-sm sm:text-base font-bold text-slate-900 dark:text-white' }, [v]),
  ])));
}

function permissions(app) {
  const caps = app.capabilities ?? {};
  const list = [['Private App Sandbox', 'Completely isolated local disk storage partition.']];
  list.push(caps.network?.length
    ? ['Network Egress', `Allowlisted hosts: ${caps.network.join(', ')}.`]
    : ['Zero Network Access', 'Cannot make any external HTTP or WebSocket requests.']);
  if (app.backend) list.push(['Background Process', 'Runs sandboxed with no host system privilege.']);
  if (caps.notifications) list.push(['Desktop Alerts', 'Can post native OS notification toasts.']);
  if (caps.identity) list.push(['Local Identity', 'Can ask desktop app to attest user identity.']);
  if (caps.secrets?.length) list.push(['Encrypted Vault', `Secure key storage: ${caps.secrets.join(', ')}.`]);
  if (app.widgets?.length) list.push(['Workspace Widget', `Provides widget: ${app.widgets.join(', ')}.`]);

  return el('div', { class: 'border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800/80 overflow-hidden bg-white dark:bg-slate-900' },
    list.map(([title, desc]) => el('div', { class: 'p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs' }, [
      el('span', { class: 'font-semibold text-slate-900 dark:text-white' }, [title]),
      el('span', { class: 'text-slate-500 dark:text-slate-400 sm:text-right' }, [desc]),
    ]))
  );
}

function provenance(app) {
  const release = latest(app);
  const repo = app.repository ?? '';
  const repoText = repo.replace(/^https:\/\/(www\.)?github\.com\//, '');
  if (!release) {
    return el('div', { class: 'p-6 bg-slate-900 text-slate-300 border border-slate-800' }, [
      el('h3', { class: 'text-sm font-bold text-white mb-2' }, [app.included ? 'Integrated System Component' : 'Release Pipeline']),
      el('p', { class: 'text-xs text-slate-400 leading-relaxed' }, [
        app.included
          ? `This application is packaged directly with ${state.config.install.productName} and maintained in source.`
          : 'When this app is published, automated CI compiles the release bundle and locks its SHA-256 digest in the catalog.'
      ]),
      repo ? el('a', { href: repo, target: '_blank', rel: 'noopener', class: 'mt-4 inline-flex items-center text-xs font-semibold text-brand-400 hover:underline' }, ['Source Repository →']) : '',
    ]);
  }
  return el('div', { class: 'p-6 bg-slate-900 text-slate-300 border border-slate-800 space-y-4' }, [
    el('div', { class: 'flex items-center justify-between pb-3 border-b border-slate-800' }, [
      el('h3', { class: 'text-sm font-bold text-white' }, ['Cryptographic Provenance']),
      el('span', { class: 'text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 border border-emerald-800' }, ['CI Verified']),
    ]),
    el('div', { class: 'space-y-3 text-xs' }, [
      el('div', { class: 'flex justify-between' }, [
        el('span', { class: 'text-slate-500' }, ['Source Commit']),
        el('code', { class: 'font-mono text-slate-200' }, [release.commit.slice(0, 10)]),
      ]),
      el('div', { class: 'flex flex-col gap-1' }, [
        el('span', { class: 'text-slate-500' }, ['SHA-256 Digest']),
        el('code', { class: 'font-mono text-[10px] break-all p-2 bg-slate-950 border border-slate-800 text-slate-300' }, [release.sha256]),
      ]),
    ]),
  ]);
}

function gallery(app) {
  if (!app.screenshots?.length) return '';
  const { track, controls } = scroller(el('div', { class: 'grid grid-flow-col auto-cols-[85%] sm:auto-cols-[45%] gap-4 overflow-x-auto pb-4' }, app.screenshots.map((src, i) => {
    const b = el('button', { class: 'group text-left border-0 bg-transparent p-0 cursor-zoom-in', type: 'button', 'aria-label': `Enlarge screenshot ${i + 1}` }, [
      framed(src, `${app.title} screenshot ${i + 1}`),
    ]);
    b.addEventListener('click', () => openLightbox(app, i));
    return b;
  })), 'screenshot');
  return el('section', { class: 'my-8' }, [
    el('div', { class: 'flex items-center justify-between mb-3' }, [
      el('h2', { class: 'text-lg font-bold text-slate-900 dark:text-white' }, ['Screenshots']),
      controls,
    ]),
    track,
  ]);
}

function installButton(app, big = false) {
  const release = latest(app);
  const btnClass = big
    ? 'px-8 py-3 text-sm font-bold shadow-lg'
    : 'px-4 py-2 text-xs font-semibold';
  
  if (!release) {
    return el('button', {
      type: 'button',
      disabled: '',
      class: `${btnClass} bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-300 dark:border-slate-700 cursor-not-allowed`
    }, [status(app)]);
  }

  const button = el('button', {
    type: 'button',
    class: `${btnClass} bg-brand-600 hover:bg-brand-500 text-white shadow-brand-500/20 hover:shadow-brand-500/30 transition-all`
  }, ['Install App']);
  button.addEventListener('click', () => openInstall(app, release));
  return button;
}

function renderApp(id) {
  const app = state.apps.find((a) => a.id === id);
  if (!app) {
    return [
      el('a', { class: 'inline-flex items-center text-xs font-semibold text-brand-600 dark:text-brand-400 my-4', href: '#/' }, ['← Back to apps']),
      el('div', { class: 'text-center py-20 text-slate-500' }, ['Application not found.']),
    ];
  }
  document.title = `${app.title} – ${state.config.name}`;
  const similar = state.apps.filter((a) => a !== app && (a.categories ?? []).some((c) => (app.categories ?? []).includes(c)));

  return [
    el('a', { class: 'inline-flex items-center text-xs font-semibold text-brand-600 dark:text-brand-400 my-4 hover:underline', href: '#/' }, ['← Back to store']),
    
    // App Header Bar with sharp edges
    accent(app, el('div', { class: 'p-6 sm:p-8 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6' }, [
      el('div', { class: 'flex items-center gap-5' }, [
        icon(app, 'large'),
        el('div', {}, [
          el('h1', { class: 'text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white' }, [app.title]),
          el('p', { class: 'text-xs sm:text-sm font-semibold text-brand-600 dark:text-brand-400 mt-1' }, [app.publisher ?? 'Verified Publisher']),
          app.tagline ? el('p', { class: 'text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xl' }, [app.tagline]) : '',
        ]),
      ]),
      el('div', { class: 'flex flex-col sm:flex-row md:flex-col items-start md:items-end gap-2' }, [
        installButton(app, true),
        el('span', { class: 'text-[11px] text-slate-400 dark:text-slate-500' }, [
          released(app) ? `Launches ${state.config.install.productName} installer` : status(app)
        ]),
      ]),
    ])),

    facts(app),
    gallery(app),

    // Content Grid: About + Technical Provenance
    el('div', { class: 'grid grid-cols-1 lg:grid-cols-12 gap-8 my-8' }, [
      el('div', { class: 'lg:col-span-8 space-y-8' }, [
        el('section', {}, [
          el('h2', { class: 'text-lg font-bold text-slate-900 dark:text-white mb-3' }, ['About this app']),
          el('p', { class: 'text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-prose' }, [app.description ?? 'No description provided.']),
          app.highlights?.length ? el('div', { class: 'mt-4 flex flex-wrap gap-2' }, app.highlights.map((h) =>
            el('span', { class: 'px-3 py-1 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700' }, [h])
          )) : '',
        ]),
        el('section', {}, [
          el('h2', { class: 'text-lg font-bold text-slate-900 dark:text-white mb-3' }, ['Sandbox Permissions']),
          permissions(app),
        ]),
      ]),
      el('div', { class: 'lg:col-span-4 space-y-6' }, [
        provenance(app),
        el('div', { class: 'p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3 text-xs' }, [
          el('h3', { class: 'font-bold text-slate-900 dark:text-white' }, ['Distribution Details']),
          el('div', { class: 'flex justify-between text-slate-500' }, ['Distribution', 'Open Source CI']),
          app.repository ? el('a', { href: app.repository, target: '_blank', rel: 'noopener', class: 'block text-brand-600 dark:text-brand-400 font-semibold hover:underline' }, ['View Repository on GitHub →']) : '',
        ]),
      ]),
    ]),

    similar.length ? shelf('Similar Applications', similar) : '',
  ];
}

// ---- Dialogs & Lightbox -----------------------------------------------------

let pending = 0;
function openInstall(app, release) {
  const { productName, downloadUrl } = state.config.install;
  const dialog = $('install');
  accent(app, dialog);
  $('install-icon').src = app.icon ?? '';
  $('install-title').textContent = `Install ${app.title}`;
  $('install-step-1').textContent = `${productName} validates signature against index.json.`;
  $('install-step-2').textContent = `Downloads v${release.version} and checks SHA-256 checksum.`;
  $('install-status').replaceChildren();
  const go = $('install-go');
  go.textContent = `Launch ${productName}`;
  go.onclick = () => {
    installers[state.config.install.type](app, state.config.install);
    $('install-status').textContent = `Handing off to ${productName}…`;
    clearTimeout(pending);
    pending = setTimeout(() => {
      if (!dialog.open || !document.hasFocus()) return;
      $('install-status').replaceChildren(
        `Desktop app didn't open? `,
        el('a', { href: downloadUrl, target: '_blank', rel: 'noopener', class: 'font-semibold text-brand-600 underline' }, [`Download ${productName}`])
      );
    }, 2500);
  };
  dialog.showModal();
}

const lightbox = { app: /** @type {any} */ (null), index: 0 };
function showShot() {
  const { app, index } = lightbox;
  $('lightbox-img').src = app.screenshots[index];
  $('lightbox-img').alt = `${app.title} screenshot ${index + 1}`;
  $('lightbox-count').textContent = `${index + 1} / ${app.screenshots.length}`;
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
  if (lightbox.app && next >= 0 && next < lightbox.app.screenshots.length) {
    lightbox.index = next;
    showShot();
  }
}

// ---- Theme Switcher (Dark/Light) -------------------------------------------

function setupTheme() {
  const themeToggle = $('theme-toggle');
  const lightIcon = $('theme-toggle-light-icon');
  const darkIcon = $('theme-toggle-dark-icon');

  const currentTheme = localStorage.getItem('appshell-theme') ||
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

  function applyTheme(theme) {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      lightIcon.classList.remove('hidden');
      darkIcon.classList.add('hidden');
    } else {
      document.documentElement.classList.remove('dark');
      lightIcon.classList.add('hidden');
      darkIcon.classList.remove('hidden');
    }
    localStorage.setItem('appshell-theme', theme);
  }

  applyTheme(currentTheme);

  themeToggle?.addEventListener('click', () => {
    const isDark = document.documentElement.classList.contains('dark');
    applyTheme(isDark ? 'light' : 'dark');
  });
}

// ---- Routing & Initialization ----------------------------------------------

function route() {
  const [, kind, arg] = /^#\/(app|category)\/(.+)$/.exec(location.hash) ?? [];
  const q = state.query.toLowerCase();
  document.title = state.config?.name ?? 'Appshell Store';
  let view;
  if (kind === 'app') view = renderApp(decodeURIComponent(arg));
  else if (q) view = renderList(`Results for "${state.query}"`, state.apps.filter((a) => matches(a, q)));
  else if (kind === 'category') {
    const c = decodeURIComponent(arg);
    view = renderList(c, state.apps.filter((a) => (a.categories ?? []).includes(c)), c);
  } else view = renderHome();
  
  $('view').replaceChildren(...view.filter((n) => n !== ''));
  
  // Wire up hero search bar if rendered
  const searchInput = $('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.query = e.target.value.trim();
      route();
    });
  }

  if (!q) window.scrollTo(0, 0);
}

function clearSearch() {
  state.query = '';
}

async function start() {
  setupTheme();

  state.config = await (await fetch('config.json')).json();
  const base = new URL(state.config.catalog, location.href).href;
  
  const getProduct = $('get-product');
  if (getProduct) {
    getProduct.href = state.config.install.downloadUrl;
    getProduct.textContent = `Get ${state.config.install.productName}`;
  }

  const load = (url) => fetch(url, { cache: 'no-cache' }).then((r) => (r.ok ? r.json() : {})).catch(() => ({}));
  const [catalog, listings] = await Promise.all([load(base), load('apps.json')]);
  state.apps = merge(catalog, base, listings);

  $('lightbox-prev').addEventListener('click', () => stepShot(-1));
  $('lightbox-next').addEventListener('click', () => stepShot(1));
  $('lightbox-close').addEventListener('click', () => $('lightbox').close());
  $('lightbox').addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') stepShot(-1);
    if (e.key === 'ArrowRight') stepShot(1);
  });

  for (const id of ['lightbox', 'install']) {
    $(id).addEventListener('click', (e) => {
      if (e.target === e.currentTarget) $(id).close();
    });
  }

  window.addEventListener('hashchange', () => {
    if (!location.hash.startsWith('#/app/')) state.query && clearSearch();
    route();
  });

  route();
}

start();

