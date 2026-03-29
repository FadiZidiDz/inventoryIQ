#!/bin/sh
set -e
cd /usr/src/app

# Ensure we use the correct port
export PORT="${PORT:-8000}"

# Clear old configuration and cache (Fixes 500 errors from old settings)
php artisan config:clear
php artisan cache:clear

# Create the storage symlink (MANDATORY for adding products with images)
php artisan storage:link --force

# Run database migrations
php artisan migrate --force

echo "Running database seeders..."
php artisan db:seed --force || echo "[WARNING] db:seed had errors. Continuing."

# Passport / OAuth Logic
if [ -n "$PASSPORT_PRIVATE_KEY" ] && [ -n "$PASSPORT_PUBLIC_KEY" ]; then
    echo "Passport: using OAuth keys from environment variables."
    php artisan passport:client --personal --name="InventoryIQ" --no-interaction > /dev/null 2>&1 || true
else
    echo "No PASSPORT_PRIVATE_KEY set. Generating new OAuth keys..."
    php artisan passport:install --force
    
    echo "----------------------------------------------------------------"
    echo "Key: PASSPORT_PRIVATE_KEY"
    cat storage/oauth-private.key
    echo "----------------------------------------------------------------"
fi

echo "Starting Laravel server on port $PORT..."
exec php artisan serve --host=0.0.0.0 --port="$PORT"
