# 1. Use PHP 8.2 FPM (Fast Process Manager)
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

# 3. Install PHP extensions
RUN docker-php-ext-install pdo pdo_pgsql

# 4. Install Composer by copying from the official image
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# 5. Set the working directory
WORKDIR /usr/src/app

# 6. Copy the code into the container
COPY . .

# 7. Install Laravel dependencies
# Using --no-dev and --optimize-autoloader for production speed
RUN composer install --no-dev --optimize-autoloader --no-interaction

# 8. FIX PERMISSIONS (This solves the 500 Internal Server Error)
# Laravel must be able to write to these folders
RUN chown -R www-data:www-data /usr/src/app/storage /usr/src/app/bootstrap/cache
RUN chmod -R 775 /usr/src/app/storage /usr/src/app/bootstrap/cache

# 9. Setup the entrypoint script
COPY docker/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# 10. Expose the port Render expects
EXPOSE 8000

# 11. Run the entrypoint
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
