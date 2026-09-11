#!/usr/bin/env bash
# Set Croatian legal identity on Vercel production (fixes audit 11/12 → 12/12).
# Requires: vercel CLI logged in (`vercel login`) or VERCEL_TOKEN with project access.
set -euo pipefail
cd "$(dirname "$0")/.."

SCOPE="${VERCEL_SCOPE:-luka6}"
PROJECT="${VERCEL_PROJECT:-getdozen}"

echo "Linking $PROJECT @ $SCOPE (if needed)…"
vercel link --yes --project "$PROJECT" --scope "$SCOPE" 2>/dev/null || true

add_env() {
  local key="$1" value="$2"
  echo "→ $key"
  echo "$value" | vercel env add "$key" production 2>/dev/null \
    || echo "  (already set or run: vercel env rm $key production)"
}

add_env LEGAL_EMAIL "hello@getdozen.dev"
add_env LEGAL_OPERATOR_NAME "Kasalo Digital"
add_env LEGAL_BUSINESS_FORM "paušalni obrt"
add_env LEGAL_ADDRESS "Tvrtkova 1, Knin, Croatia"
add_env LEGAL_OIB "05372595966"

echo ""
echo "Done. Redeploy production, then:"
echo "  npm run audit:prod"
