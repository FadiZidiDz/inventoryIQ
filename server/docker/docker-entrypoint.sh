#!/bin/sh
set -e

# Clear everything to start fresh
php artisan config:clear
php artisan cache:clear
php artisan view:clear

# Run migrations and seed the user
php artisan migrate --force
php artisan db:seed --class=UserSeeder --force

# IMPORTANT: Ensure Passport/Sanctum keys exist
php artisan passport:keys --force || true

echo "Starting server..."
php artisan serve --host=0.0.0.0 --port=8000

