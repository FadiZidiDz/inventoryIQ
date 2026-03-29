# 1. Use PHP 8.2 FPM
FROM php:8.2-fpm

# 2. Install system dependencies for PostgreSQL and Laravel
RUN apt-get update && apt-get install -y --no-install-recommends \
        git \
        curl \
        zip \
        unzip \
        libpq-dev \
        libpng-dev \
        libzip-dev \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# 3. Install PHP extensions (PDO Postgres is required for Render)
RUN docker-php-ext-install pdo pdo_pgsql

# 4. Install Composer from official image
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# 5. Set working directory
WORKDIR /usr/src/app

# 6. Copy code
COPY . .

# 7. Install dependencies
RUN composer install --no-dev --optimize-autoloader --no-interaction

# 8. FIX PERMISSIONS (Crucial for Image Uploads and 500 Errors)
RUN chown -R www-data:www-data /usr/src/app/storage /usr/src/app/bootstrap/cache /usr/src/app/public
RUN chmod -R 775 /usr/src/app/storage /usr/src/app/bootstrap/cache /usr/src/app/public

# 9. Setup the entrypoint script
COPY docker/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 8000

# 10. Run entrypoint
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
