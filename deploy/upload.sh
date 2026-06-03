#!/bin/bash
# ============================================================
#  Upload POS System to Hetzner server
#  Run this from your LOCAL machine (not the server)
#  Usage: bash upload.sh YOUR_SERVER_IP yourdomain.com
# ============================================================

SERVER_IP="${1:-}"
DOMAIN="${2:-}"
APP_DIR="/var/www/pos-system"
LOCAL_DIR="$(cd "$(dirname "$0")/.." && pwd)"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
ok()   { echo -e "${GREEN}✅ $1${NC}"; }
info() { echo -e "${YELLOW}▶  $1${NC}"; }
err()  { echo -e "${RED}❌ $1${NC}"; exit 1; }

[ -n "$SERVER_IP" ] || err "Usage: bash upload.sh SERVER_IP yourdomain.com"
[ -n "$DOMAIN" ]    || err "Usage: bash upload.sh SERVER_IP yourdomain.com"

echo ""
echo "=================================================="
echo "  POS System — Upload to Hetzner"
echo "  Server : $SERVER_IP"
echo "  Domain : $DOMAIN"
echo "  Source : $LOCAL_DIR"
echo "=================================================="
echo ""

# Step 1: Run server setup
info "Running server setup script on $SERVER_IP..."
ssh root@"$SERVER_IP" "bash -s" < "$LOCAL_DIR/deploy/setup-server.sh" "$DOMAIN"
ok "Server configured"

# Step 2: Upload app files (exclude node_modules, dist, db)
info "Uploading app files (this may take a minute)..."
rsync -avz --progress \
  --exclude='node_modules' \
  --exclude='dist' \
  --exclude='*.db' \
  --exclude='*.db-shm' \
  --exclude='*.db-wal' \
  --exclude='.env' \
  --exclude='deploy' \
  "$LOCAL_DIR/" root@"$SERVER_IP":"$APP_DIR/"
ok "Files uploaded to $APP_DIR"

# Step 3: Set ownership
ssh root@"$SERVER_IP" "chown -R posapp:posapp $APP_DIR"
ok "Ownership set"

# Step 4: Deploy (install deps, build, start)
info "Running deployment on server..."
ssh root@"$SERVER_IP" "pos-deploy"
ok "App deployed"

echo ""
echo "=================================================="
echo "  🎉 UPLOAD COMPLETE!"
echo ""
echo "  Your POS is live at: http://$SERVER_IP"
echo ""
echo "  Next: point your domain DNS then run:"
echo "    ssh root@$SERVER_IP"
echo "    certbot --nginx -d $DOMAIN -d www.$DOMAIN"
echo ""
echo "  To update the app later, just run:"
echo "    bash upload.sh $SERVER_IP $DOMAIN"
echo "=================================================="
