# Use a php8.2 image
FROM php:8.2-fpm

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
        git \
        curl \
        zip \
        unzip \
        libpq-dev \
        libpng-dev \
        libzip-dev \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install PHP extensions
RUN docker-php-ext-install pdo pdo_pgsql

# BETTER WAY TO INSTALL COMPOSER: Copy it from the official image
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set the working directory
WORKDIR /usr/src/app

# Copy application files
COPY . .

# Install Laravel dependencies
# Use --ignore-platform-reqs if you have extensions in composer.json not in this dockerfile
RUN composer install --no-dev --optimize-autoloader --no-interaction

# Setup the entrypoint script
COPY docker/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
