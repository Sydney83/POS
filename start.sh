#!/bin/bash
DIR="$(cd "$(dirname "$0")" && pwd)"

echo "🚀 POS System Startup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Kill anything on port 5000
if fuser 5000/tcp > /dev/null 2>&1; then
  echo "⚠️  Port 5000 in use — killing existing process..."
  fuser -k 5000/tcp 2>/dev/null
  sleep 1
fi

# Install backend deps if needed
if [ ! -d "$DIR/backend/node_modules" ]; then
  echo "📦 Installing backend dependencies..."
  cd "$DIR/backend" && npm install
fi

# Install frontend deps if needed
if [ ! -d "$DIR/frontend/node_modules" ]; then
  echo "📦 Installing frontend dependencies..."
  cd "$DIR/frontend" && npm install
fi

# Build the frontend
echo "🔨 Building frontend..."
cd "$DIR/frontend" && npm run build
if [ $? -ne 0 ]; then
  echo "❌ Frontend build failed!"
  exit 1
fi
echo "✅ Frontend built"

# Start backend (serves both API and built frontend)
echo "▶️  Starting server..."
cd "$DIR/backend"
node server.js &
SERVER_PID=$!

sleep 2

# Verify it's running
if kill -0 $SERVER_PID 2>/dev/null; then
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "✅ POS System is running!"
  echo ""
  echo "   🌐 Open → http://localhost:5000"
  echo ""
  echo "   Demo logins (password: Password123!)"
  echo "   👑 supervisor@pos.com  (all stores)"
  echo "   🏪 manager1@pos.com    (store 1)"
  echo "   🖥️  cashier1@pos.com    (store 1)"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "   Press Ctrl+C to stop"
  echo ""
else
  echo "❌ Server failed to start. Check errors above."
  exit 1
fi

trap "echo ''; echo '🛑 Stopping POS System...'; kill $SERVER_PID 2>/dev/null; exit 0" INT TERM
wait $SERVER_PID
