---
name: check-apps
description: Check every app and the catalog, and fix what the checker reports.
---

# Check apps

Run `node scripts/check-apps.mjs --online`. Group the problems by app and fix those in scope; blocked assets follow the `fix-csp` skill. Never edit `index.json`: only the release workflow writes it, and a URL that does not download means that release has to be published, not the entry deleted by hand.
