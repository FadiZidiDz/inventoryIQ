#!/bin/sh
set -e

# Clear caches so new Env variables are seen
php artisan config:clear
php artisan cache:clear

echo "Running migrations..."
php artisan migrate --force

echo "Seeding database..."
php artisan db:seed --class=UserSeeder --force

echo "Starting Laravel server..."
# We use 0.0.0.0 so Render can reach the container
php artisan serve --host=0.0.0.0 --port=8000
