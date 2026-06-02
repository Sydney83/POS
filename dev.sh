#!/bin/bash
# Development mode: hot-reload on both frontend and backend
DIR="$(cd "$(dirname "$0")" && pwd)"

echo "🔧 Starting in DEV mode (hot reload)..."

fuser -k 5000/tcp 2>/dev/null
fuser -k 3000/tcp 2>/dev/null
sleep 1

# Backend with nodemon
cd "$DIR/backend"
npx nodemon server.js &
BACK_PID=$!
sleep 2

# Frontend with Vite dev server (proxy to backend)
cd "$DIR/frontend"
npm run dev &
FRONT_PID=$!

echo ""
echo "✅ Dev servers running:"
echo "   Frontend (Vite) → http://localhost:3000"
echo "   Backend  (API)  → http://localhost:5000"
echo "   Press Ctrl+C to stop"
echo ""

trap "kill $BACK_PID $FRONT_PID 2>/dev/null; exit 0" INT TERM
wait
