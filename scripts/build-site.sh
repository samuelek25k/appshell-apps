#!/usr/bin/env bash
# Assembles the store site: pages, catalog, and each app's store/ assets.
# Usage: scripts/build-site.sh [out-dir]   (default _site)
set -euo pipefail
out="${1:-_site}"
rm -rf "$out" && mkdir -p "$out"
cp site/* "$out/"
cp index.json "$out/"
for listing in */store; do
  [ -d "$listing" ] && mkdir -p "$out/$listing" && cp "$listing"/*.png "$listing"/*.svg "$listing"/*.jpg "$listing"/*.webp "$out/$listing/" 2>/dev/null || true
done
echo "site assembled in $out"
