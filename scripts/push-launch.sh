#!/usr/bin/env bash
# Push launch commits to GitHub (triggers Vercel deploy on getdozen.dev).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

AHEAD="$(git rev-list --count origin/master..HEAD 2>/dev/null || echo 0)"
if [[ "$AHEAD" == "0" ]]; then
  echo "✓ Already synced with origin/master"
  npm run launch:prep
  exit 0
fi

echo "→ $AHEAD commit(s) ahead of origin/master"
git log --oneline origin/master..HEAD

if git push origin master; then
  echo ""
  echo "✓ Pushed. Vercel will deploy getdozen.dev in ~1–2 min."
  echo "  Then: npm run audit:prod"
  exit 0
fi

echo ""
echo "Push failed. If you have getdozen-launch.bundle from the cloud agent:"
echo "  ./scripts/apply-launch-bundle.sh /path/to/getdozen-launch.bundle"
echo "  git push origin master"
exit 1
