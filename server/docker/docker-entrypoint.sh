#!/bin/sh

# Exit immediately if a command exits with a non-zero status
set -e

# Run migrations and seed the UserSeeder
echo "Running migrations..."
php artisan migrate --force

echo "Seeding database..."
php artisan db:seed --class=UserSeeder --force

# Start the Laravel server
echo "Starting Laravel server..."
exec php artisan serve --host=0.0.0.0 --port=8000
