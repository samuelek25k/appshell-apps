# Appshell Apps

Apps for [Appshell](https://github.com/samuelek25k/appshell), the catalog that lists their releases, and the store where people find them.

**Store:** https://samuelek25k.github.io/appshell-apps/

| App | What it does | Status |
| --- | --- | --- |
| [Welcome](welcome) | Verifies your Appshell setup and records visit history via a sandboxed backend. | Released |
| [Profile](profile) | Displays your local profile (name, email, role) on your dashboard. | Included with Appshell |
| [Clipboard History](clipboard-manager) | Local clipboard history and quick snippets with fuzzy search. | Ready to package |
| [Color Studio](color-picker) | OKLCH, HEX, and HSL converter with WCAG contrast audit score. | Ready to package |
| [JSON Formatter](json-tools) | Private offline JSON formatting, validation, and linting. | Ready to package |
| [Markdown Studio](markdown-preview) | Distraction-free Markdown editor with live preview and Mermaid diagrams. | Ready to package |
| [Outlook Calendar](outlook-calendar) | Calendar agenda view and meeting schedule tracking. | Ready to package |
| [Pomodoro Timer](pomodoro) | Focus intervals, break alarms, and daily streak tracking. | Ready to package |
| [Quick Notes](quick-notes) | Lightweight personal scratchpad with newest notes on your dashboard. | Ready to package |
| [World Clock](world-clock) | Multi-timezone clocks for your team's cities with a live widget. | Ready to package |

## How it fits together

```
<app-id>/            one folder per app: manifest.json, ui/, optional backend/
<app-id>/store/      store listing and images; never packaged
index.json           the catalog: released versions, pinned by SHA-256 and commit
site/                the static store (GitHub Pages)
scripts/             catalog and site builders used by the workflows
```

The desktop app reads `index.json`. It installs a release only if the source is on the product's allowlist, the download matches the pinned SHA-256, and the package's manifest matches the catalog entry. The store adds nothing to that check; it only hands off to the desktop app.

## Add an app

1. From an `appshell` checkout next to this one: `pnpm appshell create ../appshell-apps/<app-id> --id <app-id>`.
2. Run it: `pnpm appshell dev ../appshell-apps/<app-id>`.
3. Add a store listing (below). The app shows in the store as **Coming soon** once it merges.

## Store listing

`<app-id>/store/listing.json`, with paths relative to the app folder:

| Field | Used by | Notes |
| --- | --- | --- |
| `description`, `categories`, `icon`, `screenshots` | catalog and store | Copied into `index.json` on release. |
| `tagline`, `accent`, `highlights`, `whatsNew` | store only | `accent` is a `#rrggbb` colour for the app's page and spotlight. |
| `included` | store only | `true` for apps that ship inside the product instead of the catalog. |

Capture screenshots with the `store-screenshots` skill in `appshell`. An optional `store/prepare.js` fills the app with realistic content first.

## Release an app

1. Bump `version` in `<app-id>/manifest.json` and merge.
2. Push a tag `<app-id>-v<version>`, for example `quick-notes-v0.1.0`.

`release-app.yml` packages the folder (without `store/`), publishes a GitHub release and records it in `index.json`. A prerelease version such as `1.2.0-beta.1` goes to the beta channel.

## The store

`pages.yml` builds the site on every push to `main` (Settings > Pages > Source: GitHub Actions). `scripts/build-site.sh` copies `site/`, the catalog and each app's `store/` images, and writes `apps.json` from every app folder so unreleased apps can be listed. Releases always come from `index.json`.

- `site/config.json` sets the store name, featured apps and how Install works.
- Install opens `<protocol>://_/install/<app-id>`; the desktop app asks before installing.
- To serve a web store from the same catalog, add an installer type in `site/store.js`.

Preview locally:

```
scripts/build-site.sh && python3 -m http.server -d _site
```
