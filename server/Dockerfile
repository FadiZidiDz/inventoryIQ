# Use a php8.2 image
FROM php:8.2

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
        git curl zip unzip libpq-dev libpng-dev libzip-dev \
        && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install PHP extensions (including PostgreSQL for Render)
RUN docker-php-ext-install pdo pdo_pgsql

# Install Composer
RUN curl -sS https://getcomposer.org | php -- --install-dir=/usr/local/bin --filename=composer

# Set the working directory
WORKDIR /usr/src/app

# Copy application files
COPY . .

# Install Laravel dependencies
RUN composer install --no-dev --optimize-autoloader

# Setup the entrypoint script
COPY docker/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
