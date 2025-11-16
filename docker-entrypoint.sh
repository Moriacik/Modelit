#!/bin/bash

# Fix permissions for uploads directories
chmod -R 777 /var/www/html/uploads/ 2>/dev/null || true

# Start Apache
exec apache2-foreground
