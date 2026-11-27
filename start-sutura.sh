#!/usr/bin/env bash
# Opens SUTURA on macOS with one command: MySQL, the backend (port 8000)
# and the frontend (port 3000), all in this terminal.
# Needs sutura-server and sutura-client side by side in the same folder.
# Press Ctrl+C to stop both.

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SERVER="$ROOT/sutura-server"
CLIENT="$ROOT/sutura-client"
PORT=8000

if [ ! -d "$SERVER" ] || [ ! -d "$CLIENT" ]; then
  echo "Can't find sutura-server and sutura-client inside: $ROOT"
  echo "Put both folders side by side, then run this again."
  exit 1
fi
if [ ! -d "$SERVER/vendor" ]; then
  echo "The backend isn't set up yet. Do the one-time setup in HowToOpen.md first."
  exit 1
fi
if [ ! -d "$CLIENT/node_modules" ]; then
  echo "Installing frontend packages (first time only)..."
  (cd "$CLIENT" && npm install) || exit 1
fi

# 1. MySQL (Homebrew). Does nothing if it's already running.
if command -v brew >/dev/null 2>&1; then
  brew services start mysql@8.4 >/dev/null 2>&1
fi

# 2. Stop early if the ports are taken (SUTURA may already be open).
for p in "$PORT" 3000; do
  if lsof -iTCP:"$p" -sTCP:LISTEN >/dev/null 2>&1; then
    echo "Port $p is already in use. SUTURA may already be running."
    echo "Close the other terminal first, or open http://localhost:3000"
    exit 1
  fi
done

# Stops the backend (and the PHP server it starts) when this script ends.
kill_tree() {
  local child
  for child in $(pgrep -P "$1"); do kill_tree "$child"; done
  kill "$1" 2>/dev/null
}

# 3. Backend in the background.
cd "$SERVER" || exit 1
php artisan serve --host=127.0.0.1 --port="$PORT" &
BACKEND_PID=$!
cleanup() {
  trap - EXIT INT TERM
  echo
  echo "Stopping SUTURA..."
  kill_tree "$BACKEND_PID"
}
trap cleanup EXIT INT TERM

# 4. Open the browser once the frontend has had time to start.
(sleep 8; open "http://localhost:3000") &

# 5. Frontend in this terminal. Ctrl+C stops it and the backend.
cd "$CLIENT" || exit 1
NEXT_PUBLIC_API_URL="http://127.0.0.1:$PORT/api/v1" npm run dev
