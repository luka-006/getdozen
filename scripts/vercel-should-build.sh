#!/usr/bin/env bash
# Vercel ignoreCommand helper — exit 0 to SKIP build, 1 to BUILD.
# See vercel.json and marketing/launch/DEPLOYMENTS.md.
set -euo pipefail

if ! git rev-parse HEAD^ >/dev/null 2>&1; then
  exit 1
fi

mapfile -t changed < <(git diff --name-only HEAD^ HEAD)
if ((${#changed[@]} == 0)); then
  exit 1
fi

# Paths that do not affect the running Next.js app (docs / launch copy only).
skip_prefixes=(
  "marketing/launch/"
  "marketing/clips/"
)
skip_exact=(
  "README.md"
  "AGENTS.md"
  "CLAUDE.md"
)

for file in "${changed[@]}"; do
  skip=false
  for prefix in "${skip_prefixes[@]}"; do
    if [[ "$file" == "$prefix"* ]]; then
      skip=true
      break
    fi
  done
  for exact in "${skip_exact[@]}"; do
    if [[ "$file" == "$exact" ]]; then
      skip=true
      break
    fi
  done
  if [[ "$skip" == false ]]; then
    exit 1
  fi
done

echo "vercel-should-build: skipping — docs-only change (${#changed[@]} file(s))"
exit 0
