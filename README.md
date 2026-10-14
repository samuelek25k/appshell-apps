# appshell-apps

Apps for [Appshell](https://github.com/samuelek25k/appshell) and the catalog (`index.json`) that lists their releases.

- One folder per app, with a `manifest.json`. Pre-installed core apps (such as `profile`) ship inside the product and are not in the catalog.
- Release an app: bump `version` in its manifest, merge, then push a tag `<app-id>-v<version>`. `release-app.yml` packages the folder, publishes a GitHub release and records it in `index.json`. Versions with a prerelease (`1.2.0-beta.1`) go to the beta channel.
- New app: `pnpm appshell create <app-id> --id <app-id>` from an `appshell` checkout.
