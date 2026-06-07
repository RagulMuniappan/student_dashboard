#!/bin/bash
# ── Student Performance Analytics Dashboard ────────────────────────────────

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║   Student Performance Analytics Dashboard                ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# ── Backend ────────────────────────────────────────────────────────────────
echo "[1/3] Installing Python dependencies..."
pip install fastapi uvicorn pandas numpy --break-system-packages -q

echo "[2/3] Starting FastAPI backend on http://localhost:8000 ..."
cd "$(dirname "$0")/backend"
uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
echo "      Backend PID: $BACKEND_PID"

# ── Frontend ───────────────────────────────────────────────────────────────
echo "[3/3] Installing Node dependencies & starting React frontend..."
cd "$(dirname "$0")/frontend"
npm install --silent
echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  Backend  → http://localhost:8000                        ║"
echo "║  Frontend → http://localhost:3000                        ║"
echo "║  API Docs → http://localhost:8000/docs                   ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
npm run dev

# Cleanup on exit
trap "kill $BACKEND_PID 2>/dev/null" EXIT
