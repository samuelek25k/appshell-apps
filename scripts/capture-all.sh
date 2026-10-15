#!/usr/bin/env bash
set -euo pipefail

APPS=(
  "resume-builder"
  "pomodoro"
  "json-tools"
  "markdown-preview"
  "color-picker"
  "outlook-calendar"
)

ROOT="$(pwd)"

for app in "${APPS[@]}"; do
  html="$ROOT/$app/ui/index.html"
  out="$ROOT/$app/store/screenshot-1.png"
  if [ -f "$html" ]; then
    echo "Capturing $app..."
    mkdir -p "$ROOT/$app/store"
    swift scripts/capture-screenshots.swift "$html" "$out.tmp.png"
    if [ -f "$out.tmp.png" ]; then
      sips -z 800 1200 "$out.tmp.png" --out "$out" >/dev/null
      rm -f "$out.tmp.png"
      echo "✓ Generated $out"
    fi
  else
    echo "Skipping $app (no ui/index.html)"
  fi
done
