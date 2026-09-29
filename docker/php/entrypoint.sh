#!/usr/bin/env sh
set -e

cd /var/www

if [ ! -d vendor ]; then
  echo "[entrypoint] Installing Composer dependencies..."
  composer install --no-interaction --prefer-dist --optimize-autoloader
fi

mkdir -p storage/logs storage/framework/cache/data storage/framework/sessions storage/framework/views bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache
chmod -R u+rwX,g+rwX storage bootstrap/cache

APP_KEY_VALUE=""
if [ -f /var/.env ]; then
  APP_KEY_VALUE=$(grep -E '^APP_KEY=' /var/.env | head -n1 | cut -d= -f2-)
fi

if [ -z "$APP_KEY_VALUE" ]; then
  echo "[entrypoint] Generating application key..."
  php artisan key:generate --force
fi

echo "[entrypoint] Running migrations..."
php artisan migrate --force

php artisan storage:link >/dev/null 2>&1 || true

echo "[entrypoint] Starting: $*"
exec "$@"
