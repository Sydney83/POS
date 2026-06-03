#!/bin/bash
# ============================================================
#  POS System — Hetzner Server Setup Script
#  Run this as root on a fresh Ubuntu 24.04 server
#  Usage: bash setup-server.sh yourdomain.com
# ============================================================
set -e

DOMAIN="${1:-}"
APP_DIR="/var/www/pos-system"
APP_USER="posapp"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
ok()   { echo -e "${GREEN}✅ $1${NC}"; }
info() { echo -e "${YELLOW}▶  $1${NC}"; }
err()  { echo -e "${RED}❌ $1${NC}"; exit 1; }

echo ""
echo "=================================================="
echo "  POS System — Hetzner Server Setup"
echo "=================================================="

[ "$(id -u)" -eq 0 ] || err "Run as root"
[ -n "$DOMAIN" ]      || err "Usage: bash setup-server.sh yourdomain.com"

# 1. System update
info "Updating system packages..."
apt-get update -qq && apt-get upgrade -y -qq
ok "System updated"

# 2. Node.js 22
info "Installing Node.js 22..."
curl -fsSL https://deb.nodesource.com/setup_22.x | bash - > /dev/null 2>&1
apt-get install -y nodejs > /dev/null 2>&1
ok "Node.js $(node -v) installed"

# 3. Tools
info "Installing PM2, Nginx, Certbot..."
npm install -g pm2 > /dev/null 2>&1
apt-get install -y nginx certbot python3-certbot-nginx ufw > /dev/null 2>&1
ok "PM2, Nginx, Certbot installed"

# 4. App user
info "Creating app user '$APP_USER'..."
id "$APP_USER" &>/dev/null || useradd -m -s /bin/bash "$APP_USER"
ok "User ready"

# 5. App directory
mkdir -p "$APP_DIR"
chown "$APP_USER:$APP_USER" "$APP_DIR"
ok "App directory: $APP_DIR"

# 6. Firewall
info "Configuring firewall..."
ufw --force reset > /dev/null 2>&1
ufw default deny incoming > /dev/null 2>&1
ufw default allow outgoing > /dev/null 2>&1
ufw allow OpenSSH > /dev/null 2>&1
ufw allow 'Nginx Full' > /dev/null 2>&1
ufw --force enable > /dev/null 2>&1
ok "Firewall configured"

# 7. Nginx
info "Configuring Nginx for $DOMAIN..."
cat > /etc/nginx/sites-available/pos-system << NGINX
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    location / {
        proxy_pass         http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade \$http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host \$host;
        proxy_set_header   X-Real-IP \$remote_addr;
        proxy_set_header   X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        client_max_body_size 10M;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/pos-system /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
ok "Nginx configured"

# 8. PM2 startup
info "Configuring PM2 auto-start on reboot..."
pm2 startup systemd -u "$APP_USER" --hp "/home/$APP_USER" 2>/dev/null || true
ok "PM2 startup configured"

# 9. .env file
info "Creating app .env..."
JWT_SECRET=$(openssl rand -hex 32)
cat > "$APP_DIR/.env.template" << ENV
PORT=5000
NODE_ENV=production
JWT_SECRET=$JWT_SECRET
ENV
ok ".env template created"

# 10. Deploy helper
cat > /usr/local/bin/pos-deploy << 'DEPLOY'
#!/bin/bash
set -e
APP_DIR="/var/www/pos-system"
APP_USER="posapp"
echo "🚀 Deploying POS System..."

echo "📦 Backend dependencies..."
cd "$APP_DIR/backend"
npm install --omit=dev

echo "🔨 Building frontend..."
cd "$APP_DIR/frontend"
npm install
npm run build

# Copy .env if needed
[ -f "$APP_DIR/backend/.env" ] || cp "$APP_DIR/.env.template" "$APP_DIR/backend/.env"

echo "▶️  Starting app with PM2..."
cd "$APP_DIR/backend"
if sudo -u posapp pm2 describe pos-system > /dev/null 2>&1; then
  sudo -u posapp pm2 restart pos-system
else
  sudo -u posapp pm2 start server.js \
    --name pos-system \
    --env production \
    --max-memory-restart 300M
fi
sudo -u posapp pm2 save
echo "✅ Deployed! App is running."
DEPLOY
chmod +x /usr/local/bin/pos-deploy

echo ""
echo "=================================================="
echo "  ✅ SERVER SETUP COMPLETE!"
echo ""
echo "  NEXT — upload your app files then run:"
echo "    pos-deploy"
echo ""
echo "  Then get free SSL:"
echo "    certbot --nginx -d $DOMAIN -d www.$DOMAIN"
echo "=================================================="
