#!/usr/bin/env bash
# Assert waitlist lockdown status codes.
# Usage: scripts/check-waitlist-lock.sh BASE_URL
# Optional: INVITE_CODE=dozen-early (expects LAUNCH_OPEN=false on the server)
set -u

BASE="${1:-}"
if [[ -z "$BASE" ]]; then
  echo "usage: $0 BASE_URL" >&2
  exit 2
fi
BASE="${BASE%/}"

fail=0

check() {
  local expect="$1"
  local method="$2"
  local path="$3"
  shift 3
  local code
  code="$(curl -sS -m 20 -o /dev/null -w "%{http_code}" -X "$method" "$@" "$BASE$path" || echo "000")"
  if [[ "$code" == "$expect" ]]; then
    printf "ok   %s %s %s\n" "$code" "$method" "$path"
  else
    printf "FAIL %s (wanted %s) %s %s\n" "$code" "$expect" "$method" "$path" >&2
    fail=1
  fi
}

echo "Waitlist lock against $BASE"

check 200 GET /
check 200 HEAD /
check 200 GET /privacy
check 200 GET /terms
check 200 GET /cookies
check 200 GET /robots.txt
check 200 GET /sitemap.xml
check 200 GET /favicon.ico

check 404 GET /board
check 404 GET /Board/
check 404 GET /BOARD
check 404 GET /login/
# Next.js collapses duplicate slashes with a 308 before middleware (base-server).
# The redirect target must still be a lock 404.
dup_headers="$(curl -sS -D - -o /dev/null "$BASE//login///")"
dup_code="$(printf "%s\n" "$dup_headers" | awk 'BEGIN{c=""} /^HTTP/{c=$2} END{print c}')"
dup_loc="$(printf "%s\n" "$dup_headers" | awk 'tolower($1)=="location:" {print $2}' | tr -d '\r')"
if [[ "$dup_code" != "308" ]]; then
  echo "FAIL //login/// status $dup_code (Next 308 expected before the lock)" >&2
  fail=1
else
  echo "ok   308 GET //login/// -> ${dup_loc}"
fi
check 404 GET "${dup_loc:-/login/}"
check 404 GET /login
check 404 GET /login/forgot
check 404 GET /signup
check 404 GET /requests/new
check 404 GET /reviews
check 404 GET /profile/someone
check 404 GET /wall
check 404 GET /blog
check 404 GET /guides
check 404 GET /pricing
check 404 GET /wallet
check 404 GET /contact
check 404 GET /legal
check 404 GET /terms/payment
check 404 GET /setup
check 404 GET /admin
check 404 GET /api/cron
check 404 POST /api/cron
check 404 POST /api/stripe/webhook
check 404 GET /api/resend/inbound
check 404 GET /_next/data/build/board.json
check 404 GET /llms.txt
check 404 HEAD /board
check 404 OPTIONS /board
check 404 OPTIONS /login
check 404 POST /board
check 404 GET "/board?_rsc=1"
check 404 GET /invite
check 404 GET /invite/not-a-real-code

check 404 GET /board \
  -H "rsc: 1" \
  -H "next-router-prefetch: 1"
check 404 POST /requests/new \
  -H "next-action: deadbeef" \
  -H "content-type: text/plain"
check 404 GET /board \
  -H "cookie: sb-example-auth-token=not-a-session"
check 404 GET /board \
  -H "x-middleware-subrequest: middleware:middleware:middleware:middleware:middleware"
check 200 GET / \
  -H "x-middleware-subrequest: middleware:middleware:middleware:middleware:middleware"
# A fake action id is Next's own 404 (x-nextjs-action-not-found), not the lock page.
home_headers="$(curl -sS -D - -o /dev/null -X POST \
  -H "next-action: deadbeef" -H "content-type: text/plain" "$BASE/")"
if printf "%s\n" "$home_headers" | grep -q "x-nextjs-action-not-found"; then
  echo "ok   POST / reached the server action handler (unknown action id)"
elif printf "%s\n" "$home_headers" | grep -q "text/html"; then
  echo "FAIL POST / was the waitlist lock page" >&2
  fail=1
else
  echo "ok   POST / was not the lock page"
  printf "%s\n" "$home_headers" | head -5
fi

robots="$(curl -fsS "$BASE/robots.txt" || true)"
printf "%s\n" "$robots" | grep -q "Disallow: /" || { echo "FAIL robots missing Disallow" >&2; fail=1; }
printf "%s\n" "$robots" | grep -F -q 'Allow: /$' || { echo "FAIL robots missing Allow: /\$" >&2; fail=1; }
if printf "%s\n" "$robots" | grep -q "/blog"; then
  echo "FAIL robots lists /blog" >&2
  fail=1
else
  echo "ok   robots exposes only the home allow rule"
fi

sitemap="$(curl -fsS "$BASE/sitemap.xml" || true)"
if printf "%s\n" "$sitemap" | grep -Eq "/blog|/wall|/guides|/pricing"; then
  echo "FAIL sitemap lists a locked path" >&2
  fail=1
else
  echo "ok   sitemap has no locked paths"
fi
printf "%s\n" "$sitemap" | grep -q "https://getdozen.dev" || echo "note sitemap host may be the request host"

if [[ -n "${INVITE_CODE:-}" ]]; then
  jar="$(mktemp)"
  code="$(curl -sS -o /dev/null -w "%{http_code}" -c "$jar" "$BASE/invite/$INVITE_CODE")"
  if [[ "$code" != "307" && "$code" != "302" ]]; then
    echo "FAIL invite link status $code" >&2
    fail=1
  else
    echo "ok   $code GET /invite/<code>"
  fi
  board="$(curl -sS -o /dev/null -w "%{http_code}" -b "$jar" "$BASE/board")"
  if [[ "$board" == "404" ]]; then
    echo "FAIL invite cookie did not unlock /board" >&2
    fail=1
  else
    echo "ok   $board GET /board with invite cookie"
  fi
  rm -f "$jar"
fi

if [[ "$fail" -ne 0 ]]; then
  echo "waitlist lock check failed" >&2
  exit 1
fi
echo "waitlist lock check passed"
