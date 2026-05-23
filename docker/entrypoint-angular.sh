#!/bin/bash

# Custom entrypoint to set up Angular SPA routing with Firefly III

# Run the original Firefly III initialization in the background to set up config files
# But we'll skip the server start
bash /entrypoint.sh &
CHILD_PID=$!

# Wait for the http.conf to be created
echo "Waiting for Firefly III configuration files to be created..."
for i in {1..60}; do
    if [ -f /etc/nginx/site-opts.d/http.conf ]; then
        echo "Found http.conf after $i seconds"
        sleep 2  # Give it a moment to finish writing
        break
    fi
    sleep 1
done

# Terminate the child process to prevent service startup (we'll do that manually after modifying config)
if ps -p $CHILD_PID > /dev/null; then
    kill $CHILD_PID 2>/dev/null || true
    wait $CHILD_PID 2>/dev/null || true
fi

# Check if the file exists now
if [ ! -f /etc/nginx/site-opts.d/http.conf ]; then
    echo "ERROR: http.conf was not created"
    exit 1
fi

# Backup the original
cp /etc/nginx/site-opts.d/http.conf /etc/nginx/site-opts.d/http.conf.bak

# Create a new http.conf with Angular-aware routing
cat > /etc/nginx/site-opts.d/http.conf << 'NGINX_CONFIG'
listen 8080 default_server;
listen [::]:8080 default_server;
root /var/www/html/public;

# Set allowed "index" files
index index.html index.htm index.php;
server_name _;
charset utf-8;
absolute_redirect off;

# Serve Angular static assets directly with caching
location ~ \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|txt|webmanifest|map)$ {
    try_files /dist$uri =404;
    expires 1y;
    add_header Cache-Control "public, immutable";
    access_log off;
}

# API endpoints and Laravel routes - pass to PHP/Firefly III
location ~ ^/(api|login|logout|register|dashboard|accounts|transactions|budgets|rules|reports|admin|sanctum|search) {
    try_files $uri /index.php?$query_string;
}

# Healthcheck endpoint
location = /healthcheck {
    access_log off;
    fastcgi_read_timeout 5s;
    include        fastcgi_params;
    fastcgi_param  SCRIPT_NAME     /healthcheck;
    fastcgi_param  SCRIPT_FILENAME /healthcheck;
    fastcgi_pass   127.0.0.1:9000;
}

# SPA Routes - serve Angular index.html for frontend routes
location / {
    # Check if file/directory exists, serve it
    try_files $uri $uri/ @angular;
}

# Fallback to Angular index.html for SPA routing
location @angular {
    rewrite ^.*$ /dist/index.html last;
}

# Block PHP execution in storage directory
location ~* ^/storage/.*\.php$ {
    deny all;
}

# Pass "*.php" files to PHP-FPM
location ~ \.php$ {
    fastcgi_pass   127.0.0.1:9000;
    fastcgi_index  index.php;
    fastcgi_param  SCRIPT_FILENAME  $document_root$fastcgi_script_name;
    include        fastcgi_params;
    fastcgi_buffers 8 8k;
    fastcgi_buffer_size 8k;
    fastcgi_read_timeout 300;
}

# additional config
include /etc/nginx/server-opts.d/*.conf;
NGINX_CONFIG

# Verify the Nginx syntax
echo "Verifying Nginx configuration..."
nginx -t || exit 1

# Now start the required services manually
echo "Starting services..."

# Start PHP-FPM
php-fpm &
PHP_FPM_PID=$!

# Start Nginx
nginx &
NGINX_PID=$!

# Wait for services to be ready
sleep 3

# Keep the container running
wait