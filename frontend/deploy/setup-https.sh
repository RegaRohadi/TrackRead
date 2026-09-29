#!/usr/bin/env bash
set -euo pipefail

DOMAIN="trackread.regazgaz.online"
EXPECTED_IP="45.8.133.90"
NGINX_SITE="/etc/nginx/sites-available/${DOMAIN}"

if [ ! -f "$NGINX_SITE" ]; then
  echo "Config nginx $NGINX_SITE tidak ditemukan." >&2
  exit 1
fi

resolved="$(dig +short @"${DNS_RESOLVER:-1.1.1.1}" "$DOMAIN" A | head -1)"
if [ "$resolved" != "$EXPECTED_IP" ]; then
  echo "DNS $DOMAIN belum mengarah ke $EXPECTED_IP (sekarang: ${resolved:-kosong})."
  echo "Tambahkan A record $DOMAIN -> $EXPECTED_IP lalu tunggu propagasi, baru jalankan skrip ini."
  exit 1
fi

echo "DNS OK ($DOMAIN -> $resolved). Meminta sertifikat Let's Encrypt..."
sudo certbot --nginx -d "$DOMAIN" --redirect --non-interactive --agree-tos

echo "Selesai. Cek: https://$DOMAIN"
