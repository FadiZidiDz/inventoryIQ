#!/bin/sh
set -e
cd /usr/src/app

export PORT="${PORT:-8000}"

php artisan migrate --force

if [ ! -f storage/oauth-private.key ]; then
  php artisan passport:install --force
fi

exec php artisan serve --host=0.0.0.0 --port="$PORT"
