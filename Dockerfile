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

# Create uploads directories if they don't exist FIRST
RUN mkdir -p /var/www/html/uploads/completed /var/www/html/uploads/orders

# Set proper permissions
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html \
    && chmod -R 777 /var/www/html/uploads \
    && chmod -R 777 /var/www/html/uploads/completed \
    && chmod -R 777 /var/www/html/uploads/orders

# Create uploads directories if they don't exist
RUN mkdir -p /var/www/html/uploads/completed /var/www/html/uploads/orders \
    && chown -R www-data:www-data /var/www/html/uploads \
    && chmod -R 775 /var/www/html/uploads

# Copy entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Expose port 80
EXPOSE 80

# Set entrypoint
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]