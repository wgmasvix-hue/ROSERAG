#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
#  RoseRAG — Deploy to rag.chengetai.co.zw
#  Run this from YOUR local machine:
#    chmod +x deploy.sh && ./deploy.sh
# ─────────────────────────────────────────────────────────────

set -e

SERVER="34.68.70.25"
DOMAIN="rag.chengetai.co.zw"
SSH_USER="${SSH_USER:-wgmasvix}"
SSH_PASS="${SSH_PASS:-Cheryl13..}"
WEB_ROOT="/var/www/${DOMAIN}/html"   # adjust if different

echo ""
echo "┌─────────────────────────────────────┐"
echo "│  RoseRAG Deployer → ${DOMAIN}  │"
echo "└─────────────────────────────────────┘"
echo ""

# ── Require sshpass ──────────────────────────────────────────
if ! command -v sshpass &>/dev/null; then
  echo "Installing sshpass..."
  if command -v apt-get &>/dev/null; then
    sudo apt-get install -y sshpass
  elif command -v brew &>/dev/null; then
    brew install hudochenkov/sshpass/sshpass
  else
    echo "ERROR: install sshpass first: https://sourceforge.net/projects/sshpass/"
    exit 1
  fi
fi

SSH="sshpass -p '${SSH_PASS}' ssh -o StrictHostKeyChecking=no -o ConnectTimeout=15"
SCP="sshpass -p '${SSH_PASS}' scp -o StrictHostKeyChecking=no"

echo "1/4  Probing server..."
$SSH ${SSH_USER}@${SERVER} "echo '  ✓ SSH connected as $(whoami)'"

echo "2/4  Detecting web root..."
WEB_ROOT=$($SSH ${SSH_USER}@${SERVER} "
  for dir in \
    /var/www/${DOMAIN}/html \
    /var/www/${DOMAIN} \
    /home/${SSH_USER}/public_html/rag \
    /home/${SSH_USER}/rag.chengetai.co.zw \
    /var/www/html \
    /public_html/rag; do
    if [ -d \"\$dir\" ]; then echo \"\$dir\"; break; fi
  done
" 2>/dev/null || echo "NOT_FOUND")

if [ "$WEB_ROOT" = "NOT_FOUND" ] || [ -z "$WEB_ROOT" ]; then
  echo "  Web root not found — creating /var/www/${DOMAIN}/html"
  $SSH ${SSH_USER}@${SERVER} "sudo mkdir -p /var/www/${DOMAIN}/html && sudo chown -R ${SSH_USER}:${SSH_USER} /var/www/${DOMAIN}"
  WEB_ROOT="/var/www/${DOMAIN}/html"
fi
echo "  ✓ Web root: ${WEB_ROOT}"

echo "3/4  Uploading frontend..."
$SCP roserag-frontend.zip ${SSH_USER}@${SERVER}:/tmp/roserag-frontend.zip
$SSH ${SSH_USER}@${SERVER} "
  cd /tmp
  unzip -o roserag-frontend.zip > /dev/null
  sudo cp -r platform/out/. ${WEB_ROOT}/
  sudo chown -R www-data:www-data ${WEB_ROOT}/ 2>/dev/null || true
  sudo chmod -R 755 ${WEB_ROOT}/
  rm -rf /tmp/platform /tmp/roserag-frontend.zip
  echo '  ✓ Frontend files deployed'
"

echo "4/4  Configuring web server..."
$SSH ${SSH_USER}@${SERVER} "
# ── Detect web server ─────────────────────────────
if command -v nginx &>/dev/null; then
  echo '  Detected: Nginx'
  sudo tee /etc/nginx/sites-available/${DOMAIN} > /dev/null <<'NGINX'
server {
    listen 80;
    server_name ${DOMAIN};
    root ${WEB_ROOT};
    index index.html;

    # Proxy /api/ to FastAPI backend
    location /api/ {
        proxy_pass http://127.0.0.1:8000/api/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_read_timeout 120s;
    }

    # SPA routing
    location / {
        try_files \$uri \$uri/ \$uri.html \$uri/index.html =404;
    }

    # Cache assets
    location /_next/static/ {
        expires 1y;
        add_header Cache-Control \"public, immutable\";
    }

    gzip on;
    gzip_types text/plain text/css application/javascript application/json;
}
NGINX
  sudo ln -sf /etc/nginx/sites-available/${DOMAIN} /etc/nginx/sites-enabled/
  sudo nginx -t && sudo systemctl reload nginx
  echo '  ✓ Nginx configured and reloaded'

elif command -v apache2 &>/dev/null || command -v httpd &>/dev/null; then
  echo '  Detected: Apache — .htaccess already in web root'
  WS=apache2
  command -v apache2 &>/dev/null || WS=httpd
  sudo a2enmod rewrite proxy proxy_http headers 2>/dev/null || true
  sudo \$WS -t && sudo systemctl reload \$WS 2>/dev/null || true
  echo '  ✓ Apache configured'

elif command -v caddy &>/dev/null; then
  echo '  Detected: Caddy'
  sudo tee -a /etc/caddy/Caddyfile > /dev/null <<CADDY

${DOMAIN} {
    root * ${WEB_ROOT}
    file_server
    reverse_proxy /api/* localhost:8000
    try_files {path} {path}/index.html
}
CADDY
  sudo systemctl reload caddy
  echo '  ✓ Caddy configured'
fi
"

echo ""
echo "────────────────────────────────────────────"
echo "  ✅  RoseRAG deployed!"
echo "      → https://${DOMAIN}"
echo ""
echo "  Next: deploy the backend (FastAPI):"
echo "    ./deploy-backend.sh"
echo "────────────────────────────────────────────"
