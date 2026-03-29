#!/bin/sh
set -e
cd /usr/src/app

export PORT="${PORT:-8000}"

php artisan migrate --force

# All seeders are idempotent (guard inside each seeder) — safe to run on every deploy
echo "Running database seeders..."
php artisan db:seed --force || echo "[WARNING] db:seed finished with errors — check logs above. Continuing startup."
echo "Seeders complete."

if [ ! -f storage/oauth-private.key ]; then
  php artisan passport:install --force
fi

exec php artisan serve --host=0.0.0.0 --port="$PORT"
