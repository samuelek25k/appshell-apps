# appshell-apps

Apps for [Appshell](https://github.com/samuelek25k/appshell) and the catalog (`index.json`) that lists their releases.

- One folder per app, with a `manifest.json`. Pre-installed core apps (such as `profile`) ship inside the product and are not in the catalog.
- Release an app: bump `version` in its manifest, merge, then push a tag `<app-id>-v<version>`. `release-app.yml` packages the folder, publishes a GitHub release and records it in `index.json`. Versions with a prerelease (`1.2.0-beta.1`) go to the beta channel.
- New app: `pnpm appshell create <app-id> --id <app-id>` from an `appshell` checkout.
- Store listing: `<app-id>/store/listing.json` (description, categories, icon, screenshots, paths relative to the app folder) plus its images. Capture screenshots with the `store-screenshots` skill in `appshell`. The release copies the listing into the catalog; `store/` is left out of the package.

## Store

`site/` is a static app store over `index.json`, published to GitHub Pages by `pages.yml` (Settings > Pages > Source: GitHub Actions). Install hands off to the desktop app with `<protocol>://_/install/<app-id>`; the app asks before installing. `site/config.json` names the product and install type. To serve a web store from the same catalog, add an installer type in `site/store.js`.

Preview: `scripts/build-site.sh` then serve `_site/` (for example `python3 -m http.server -d _site`).
