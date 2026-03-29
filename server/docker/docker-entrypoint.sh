#!/bin/sh
set -e
cd /usr/src/app

export PORT="${PORT:-8000}"

php artisan migrate --force

# All seeders are idempotent — safe to run on every deploy
echo "Running database seeders..."
php artisan db:seed --force || echo "[WARNING] db:seed finished with errors — check logs above. Continuing startup."
echo "Seeders complete."

# ── Passport key management ────────────────────────────────────────────────────
# Render's ephemeral filesystem resets storage/ on every deploy.
# We persist the RSA keys via env vars so Bearer tokens stay valid across redeploys.
#
#  FIRST DEPLOY  : PASSPORT_PRIVATE_KEY is not set → passport:install runs once,
#                  keys are printed to deploy logs → you copy them to Render env vars.
#  EVERY LATER DEPLOY : keys are restored from env vars → no new clients, no token invalidation.
# ─────────────────────────────────────────────────────────────────────────────
if [ -n "$PASSPORT_PRIVATE_KEY" ] && [ -n "$PASSPORT_PUBLIC_KEY" ]; then
    echo "Restoring Passport keys from PASSPORT_PRIVATE_KEY / PASSPORT_PUBLIC_KEY..."
    printf '%s' "$PASSPORT_PRIVATE_KEY" > storage/oauth-private.key
    printf '%s' "$PASSPORT_PUBLIC_KEY"  > storage/oauth-public.key
    chmod 600 storage/oauth-private.key storage/oauth-public.key
    echo "Passport keys restored — existing tokens remain valid."
else
    echo "PASSPORT_PRIVATE_KEY env var not set — running passport:install (first-time setup)."
    php artisan passport:install --force
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "ACTION REQUIRED: Copy these values into Render → Web Service → Environment:"
    echo ""
    echo "Key: PASSPORT_PRIVATE_KEY"
    echo "Value:"
    cat storage/oauth-private.key
    echo ""
    echo "Key: PASSPORT_PUBLIC_KEY"
    echo "Value:"
    cat storage/oauth-public.key
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
fi

exec php artisan serve --host=0.0.0.0 --port="$PORT"
