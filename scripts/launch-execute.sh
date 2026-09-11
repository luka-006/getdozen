#!/usr/bin/env bash
# Run every launch step that can be automated locally. Prints manual steps at the end.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "=== Dozen launch execute ==="
echo ""

echo "1. Tests"
npm test
echo ""

echo "2. Prod audit"
npm run audit:prod || AUDIT_FAIL=1
echo ""

echo "3. Assets"
for f in \
  public/marketing/dozen-launch-preview.mp4 \
  public/marketing/dozen-launch-horizontal.mp4 \
  marketing/launch/LAUNCH-NOW.md
do
  test -f "$f" && echo "  ✓ $f" || echo "  ✗ missing $f"
done
echo ""

if [[ -f .env.local ]]; then
  echo "4. Waitlist dry-run"
  npx tsx scripts/send-waitlist-launch.ts --dry-run || true
  echo ""
  if [[ -n "${CRON_SECRET:-}" ]] || grep -q '^CRON_SECRET=' .env.local 2>/dev/null; then
    echo "5. Cron verify"
    npx tsx scripts/verify-cron.ts https://getdozen.dev || true
    echo ""
  fi
  if grep -q '^PREVIEW_LOGIN_EMAIL=' .env.local 2>/dev/null; then
    echo "6. Prod smoke"
    npm run qa:smoke || true
    echo ""
  fi
else
  echo "4–6. Skipped (no .env.local — copy .env.example and fill secrets)"
  echo ""
fi

echo "=== Manual (see marketing/launch/LAUNCH-NOW.md) ==="
echo "  • ./scripts/set-legal-vercel.sh   # if audit legal check failed"
echo "  • Post X thread + LinkedIn (video URLs in LAUNCH-NOW.md)"
echo "  • npx tsx scripts/send-waitlist-launch.ts --to you@example.com"
echo "  • Search Console: https://getdozen.dev/sitemap.xml"
echo ""

[[ -z "${AUDIT_FAIL:-}" ]] && echo "Audit passed — ready to post." || echo "Fix audit failures before posting."
