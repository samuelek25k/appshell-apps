#!/usr/bin/env bash
# Packages an app folder into a tarball and computes its sha256 checksum,
# matching the exact packaging logic in .github/workflows/release-app.yml.
# Usage: ./scripts/package-app.sh <app-id> [out-dir]
set -euo pipefail

id="${1:-}"
out_dir="${2:-dist}"

if [ -z "$id" ] || [ ! -f "$id/manifest.json" ]; then
  echo "Usage: $0 <app-id> [out-dir]"
  echo "Error: valid app directory with manifest.json required."
  exit 1
fi

version=$(node -p "require('./$id/manifest.json').version")
mkdir -p "$out_dir"
file="$out_dir/$id-$version.tgz"

# Regular files only (exclude store directory, .git, and mac metadata)
COPYFILE_DISABLE=1 tar --exclude=.git --exclude=./store --exclude=.DS_Store -czf "$file" -C "$id" .

if command -v sha256sum >/dev/null 2>&1; then
  sha=$(sha256sum "$file" | cut -c1-64)
elif command -v shasum >/dev/null 2>&1; then
  sha=$(shasum -a 256 "$file" | cut -c1-64)
else
  sha=$(openssl dgst -sha256 "$file" | awk '{print $NF}')
fi

echo "Packaged: $file"
echo "Version:  $version"
echo "SHA-256:  $sha"
