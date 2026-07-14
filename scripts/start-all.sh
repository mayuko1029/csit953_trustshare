#!/bin/bash
# start-all.sh
# Launches all TrustShare services (macOS/Linux)
# Order: Blockchain → Crypto → Backend → Frontend

set -e

echo "Starting all TrustShare services..."

# Blockchain (Hardhat)
echo "[1/4] Starting Hardhat node (Blockchain)..."
(cd blockchain && npx hardhat node &) 
sleep 5

# Crypto service (FastAPI)
echo "[2/4] Starting Crypto service (FastAPI @8101)..."
(cd crypto && ./venv/bin/python3 -m uvicorn app:app --app-dir crypto --port 8101 --reload &) 
sleep 5

# Backend service (FastAPI)
echo "[3/4] Starting Backend service (FastAPI @8000)..."
(cd backend && ./venv/bin/python3 -m uvicorn app:app --app-dir backend --port 8000 --reload &) 
sleep 5

# Frontend (Vite or React)
echo "[4/4] Starting Frontend (Vite Dev Server @5173)..."
(cd frontend && npm run dev &) 

echo ""
echo "All services started successfully!"
echo "--------------------------------------"
echo "Hardhat  → http://localhost:8545"
echo "Crypto   → http://localhost:8101"
echo "Backend  → http://localhost:8000"
echo "Frontend → http://localhost:5173"
echo "--------------------------------------"
echo "Use 'pkill -f uvicorn' or 'pkill -f hardhat' to stop services."
