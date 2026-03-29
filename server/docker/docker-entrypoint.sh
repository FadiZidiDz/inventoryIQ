#!/bin/sh
set -e
cd /usr/src/app

export PORT="${PORT:-8000}"

php artisan migrate --force

# Seed only when the navigations table is empty (safe re-deploy guard)
NAV_COUNT=$(php artisan tinker --execute="echo \App\Models\Navigation::count();" 2>/dev/null | tail -1)
if [ "$NAV_COUNT" = "0" ]; then
  echo "Seeding database..."
  php artisan db:seed --force
  echo "Database seeded."
else
  echo "Database already seeded (navigations: $NAV_COUNT). Skipping."
fi

if [ ! -f storage/oauth-private.key ]; then
  php artisan passport:install --force
fi

exec php artisan serve --host=0.0.0.0 --port="$PORT"
