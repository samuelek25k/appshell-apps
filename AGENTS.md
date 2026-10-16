# AGENTS.md

Apps, the catalog and the store for Appshell. Platform rules live in the appshell repository's `AGENTS.md`.

## Rules

1. **Apps run inside Appshell.** No inline scripts or event handlers, no remote assets; check in the host, not a browser.
2. **Only CI writes `index.json`.** Every release URL must download.
3. **Neutral content.** No wording from requests or design inspirations in code, listings or commits; sample data is fictional and generic. Comment style inside an app is its author's choice.
4. **Protected rules.** Files in `.github/protected-paths` change only in commits signed by the owner; `rules-guard` blocks anything else. Agents propose such changes; they do not make them.
5. **Shared script.** `scripts/rules-guard.mjs` is a copy from appshell; CI fails if it differs.

`scripts/check-apps.mjs` enforces 1 and 2 and rejects AI attribution trailers in commit messages.

## Setup

Run `git config core.hooksPath .githooks` once per clone.
