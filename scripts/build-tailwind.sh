#!/bin/sh
set -eu
app="${1:?usage: scripts/build-tailwind.sh <app-id>}"
npx --yes tailwindcss@3.4.17 --content "$app/ui/**/*.{html,js}" --output "$app/ui/tailwind.css" --minify
