# appshell-apps

Apps for [Appshell](https://github.com/samuelek25k/appshell) and the catalog that lists them.

- `index.json`: the catalog. Format 0 lists app folders in this repository; Phase 1 adds release digests (decision D10).
- One folder per app with a `manifest.json` that validates against Appshell's `manifest.schema.json`.

Run an app locally from a sibling `appshell` checkout:

```
pnpm start   # in appshell; loads apps from ../appshell-apps
```
