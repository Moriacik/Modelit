# Use official PHP image with Apache
FROM php:8.2-apache

# Enable Apache mod_rewrite and headers
RUN a2enmod rewrite headers

# Install PHP extensions needed for your app
RUN docker-php-ext-install mysqli pdo pdo_mysql

# Configure Apache to allow .htaccess
RUN echo '<Directory /var/www/html>\n\
    AllowOverride All\n\
    Require all granted\n\
</Directory>' > /etc/apache2/conf-available/override.conf && \
    a2enconf override

# Add CORS headers for API
RUN echo 'Header always set Access-Control-Allow-Origin "*"\n\
Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"\n\
Header always set Access-Control-Allow-Headers "Content-Type, Authorization"' > /etc/apache2/conf-available/cors.conf && \
    a2enconf cors

# Set working directory
WORKDIR /var/www/html

# Set proper permissions
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html

# Expose port 80
EXPOSE 80