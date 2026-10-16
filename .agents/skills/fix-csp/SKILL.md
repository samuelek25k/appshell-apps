---
name: fix-csp
description: Make an app run under the Appshell content security policy: no inline scripts or handlers, no remote assets.
---

# Fix a blocked app

The host allows only the app's own files. Blocked: inline `<script>` and `on*=` attributes, CDN scripts, Google Fonts and other remote styles or images.

- **Scripts.** Move inline code to `ui/main.js` and load it with `<script type="module" src="main.js">`. Replace `onclick="f(id)"` with `data-` attributes and one delegated `addEventListener`.
- **Tailwind.** `scripts/build-tailwind.sh <id>` writes `<id>/ui/tailwind.css`; link it and commit the file. Rebuild after changing classes.
- **Fonts.** Use system font stacks, or ship the font file inside the app.
- **Widgets.** Use `widgets.update(id, { blocks })` from `/__appshell/sdk.js`, with the shapes in the platform's `widget.schema.json`.
- **Check.** `node scripts/check-apps.mjs` finds these; then run the app in the host (the `store-screenshots` skill in `appshell` opens it) and look at it, because the checker cannot see runtime errors.
