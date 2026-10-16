# AGENTS.md

Apps, the catalog and the store for Appshell. Platform rules live in the appshell repository's `AGENTS.md` and apply here too.

## Rules

1. **Apps run inside Appshell.** No inline scripts, no remote assets; `ui/main.js` and `ui/style.css` per app. Check in the host, not a browser.
2. **Only CI writes `index.json`.**
3. **No comments.** Names say what the code does. Only type tags are allowed in JSDoc. No change narration, design inspirations or wording from requests; sample data is fictional and generic.
4. **Protected rules.** Files in `.github/protected-paths` change only in commits signed by the owner; `rules-guard` blocks anything else. Agents propose such changes; they do not make them.
5. **Shared scripts.** `scripts/hygiene.mjs` and `scripts/rules-guard.mjs` are copies from appshell; CI fails if they differ.

## Setup

Run `git config core.hooksPath .githooks` once per clone; the hooks run the hygiene check and reject AI attribution trailers.
