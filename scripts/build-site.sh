#!/usr/bin/env bash
# Assembles the store site: pages, catalog, listings for every app folder, and their store/ assets.
# Usage: scripts/build-site.sh [out-dir]   (default _site)
set -euo pipefail
out="${1:-_site}"
repo="${GITHUB_SERVER_URL:-https://github.com}/${GITHUB_REPOSITORY:-samuelek25k/appshell-apps}"
rm -rf "$out" && mkdir -p "$out"
cp site/* "$out/"
cp index.json "$out/"
node scripts/build-listings.mjs "$out/apps.json" "$repo"
for listing in */store; do
  [ -d "$listing" ] && mkdir -p "$out/$listing" && cp "$listing"/*.png "$listing"/*.svg "$listing"/*.jpg "$listing"/*.webp "$out/$listing/" 2>/dev/null || true
done
echo "site assembled in $out"
