#!/usr/bin/env bash
# Apply the 7+ launch commits from a git bundle (from cloud agent session).
set -euo pipefail

BUNDLE="${1:-getdozen-launch.bundle}"

if [[ ! -f "$BUNDLE" ]]; then
  echo "Usage: $0 <path-to-getdozen-launch.bundle>"
  echo "Download the bundle from your cloud agent artifacts, then run from repo root."
  exit 1
fi

git fetch "$BUNDLE" master:refs/heads/cursor-launch-bundle
git merge --ff-only cursor-launch-bundle || {
  echo "Fast-forward failed — resolve conflicts or cherry-pick from cursor-launch-bundle"
  exit 1
}
git branch -d cursor-launch-bundle

echo "Merged launch bundle. Run: npm run launch:prep && git push origin master"
