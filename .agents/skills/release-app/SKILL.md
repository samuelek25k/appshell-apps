---
name: release-app
description: Release an app from this repository to the catalog, and verify the published package.
---

# Release an app

1. **Bump.** Raise `version` in `<id>/manifest.json` in a PR and merge it. A published version is never replaced: a fix is a new version.
2. **Check.** `node scripts/check-apps.mjs` passes. A package that fails the host's manifest checks installs nowhere.
3. **Publish.** `gh workflow run release-app --ref main -f tag=<id>-v<version>`, one app at a time (a push of more than three tags starts no workflow). The workflow packages the folder without `store/`, creates the release and writes `index.json`; never edit `index.json` by hand.
4. **Verify.** Download the release URL from `index.json`, compare its SHA-256 with the catalog, extract it, and run `checkAppDir` from `@appshell/distribution` in an `appshell` checkout against it. Then Refresh and Install in the shell.
5. **Wait.** `raw.githubusercontent.com` can serve the previous catalog for a few minutes.
