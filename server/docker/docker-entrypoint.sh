#!/bin/sh
set -e
cd /usr/src/app

export PORT="${PORT:-8000}"

php artisan migrate --force

# ── Seeders (all idempotent — safe on every deploy) ───────────────────────────
echo "Running database seeders..."
php artisan db:seed --force || echo "[WARNING] db:seed had errors — check above. Continuing."
echo "Seeders complete."

# ── Passport OAuth Keys ───────────────────────────────────────────────────────
# ROOT CAUSE OF 401 ERRORS:
#   Render's filesystem is EPHEMERAL. On every redeploy, a new container starts
#   with no files. "oauth-private.key" is lost → passport:install runs → new RSA
#   keys generated → ALL existing user tokens become invalid → 401 on everything.
#
# FIX:
#   Set PASSPORT_PRIVATE_KEY and PASSPORT_PUBLIC_KEY as Render environment vars.
#   Laravel Passport 10+ reads these env vars automatically (no file writing needed).
#   Keys stay consistent across all redeploys → tokens stay valid.
#
# HOW TO GET YOUR KEYS THE FIRST TIME:
#   1. Deploy once WITHOUT the env vars set.
#   2. In Render → Web Service → Logs, find the block printed below.
#   3. Copy the key values to Render → Web Service → Environment.
#   4. Redeploy. All future deploys will use the same persistent keys.
# ─────────────────────────────────────────────────────────────────────────────

if [ -n "$PASSPORT_PRIVATE_KEY" ] && [ -n "$PASSPORT_PUBLIC_KEY" ]; then
    # Keys are persisted as env vars — Passport reads them automatically.
    # Just ensure at least one personal access client exists in the database.
    echo "Passport: using OAuth keys from environment variables."

    # Create personal access client only if none exists (DB persists across deploys)
    php artisan passport:client \
        --personal \
        --name="InventoryIQ" \
        --no-interaction > /dev/null 2>&1 || true

else
    echo ""
    echo "╔══════════════════════════════════════════════════════════════════════╗"
    echo "║  FIRST DEPLOY: No PASSPORT_PRIVATE_KEY found in environment.        ║"
    echo "║  Generating new OAuth keys + personal access client...               ║"
    echo "╚══════════════════════════════════════════════════════════════════════╝"
    echo ""

    php artisan passport:install --force

    echo ""
    echo "╔══════════════════════════════════════════════════════════════════════╗"
    echo "║  ACTION REQUIRED — copy these to Render → Web Service → Environment ║"
    echo "║  to keep tokens valid across future redeploys.                       ║"
    echo "╚══════════════════════════════════════════════════════════════════════╝"
    echo ""
    echo "Key: PASSPORT_PRIVATE_KEY"
    echo "Value:"
    cat storage/oauth-private.key
    echo ""
    echo "Key: PASSPORT_PUBLIC_KEY"
    echo "Value:"
    cat storage/oauth-public.key
    echo ""
    echo "══════════════════════════════════════════════════════════════════════"
fi

exec php artisan serve --host=0.0.0.0 --port="$PORT"
