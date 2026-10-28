#!/usr/bin/env bash
set -euo pipefail
out="${1:-_site}"
repo="${GITHUB_SERVER_URL:-https://github.com}/${GITHUB_REPOSITORY:-samuelek25k/appshell-apps}"
rm -rf "$out" && mkdir -p "$out"
cp site/* "$out/"
cp index.json "$out/"
if [ -n "${GITHUB_SHA:-}" ]; then
  node -e 'const f=process.argv[1],c=JSON.parse(require("fs").readFileSync(f,"utf8"));if(c.cdn)c.cdn.branch=process.argv[2];require("fs").writeFileSync(f,JSON.stringify(c,null,2)+"\n")' "$out/config.json" "$GITHUB_SHA"
fi
node scripts/build-listings.mjs "$out/apps.json" "$repo"
for listing in */store; do
  [ -d "$listing" ] && mkdir -p "$out/$listing" && cp "$listing"/*.png "$listing"/*.svg "$listing"/*.jpg "$listing"/*.webp "$out/$listing/" 2>/dev/null || true
done
echo "site assembled in $out"
