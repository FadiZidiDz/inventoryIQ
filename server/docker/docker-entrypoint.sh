#!/bin/sh
set -e
cd /usr/src/app

export PORT="${PORT:-8000}"

php artisan migrate --force

echo "Running database seeders..."
php artisan db:seed --force || echo "[WARNING] db:seed had errors. Continuing."
echo "Seeders complete."

# Render's filesystem is EPHEMERAL — oauth keys are lost on every redeploy.
# FIX: Set PASSPORT_PRIVATE_KEY and PASSPORT_PUBLIC_KEY as Render env vars.
# Laravel Passport 10+ reads these automatically.
if [ -n "$PASSPORT_PRIVATE_KEY" ] && [ -n "$PASSPORT_PUBLIC_KEY" ]; then
    echo "Passport: using OAuth keys from environment variables."
    php artisan passport:client --personal --name="InventoryIQ" --no-interaction > /dev/null 2>&1 || true
else
    echo "No PASSPORT_PRIVATE_KEY set. Generating new OAuth keys..."
    php artisan passport:install --force

    echo ""
    echo "╔══════════════════════════════════════════════════════════════════════╗"
    echo "║  ACTION REQUIRED: Copy these to Render > Web Service > Environment  ║"
    echo "╚══════════════════════════════════════════════════════════════════════╝"
    echo ""
    echo "Key: PASSPORT_PRIVATE_KEY"
    echo "Value:"
    cat storage/oauth-private.key
    echo ""
    echo "Key: PASSPORT_PUBLIC_KEY"
    echo "Value:"
    cat storage/oauth-public.key
    echo "════════════════════════════════════════════════════════════════════"
fi

exec php artisan serve --host=0.0.0.0 --port="$PORT"
