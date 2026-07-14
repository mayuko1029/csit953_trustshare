# start-all.ps1
# Launches all TrustShare services (Windows)
# Order: Blockchain → Crypto → Backend → Frontend

Write-Host "Starting all TrustShare services..." -ForegroundColor Cyan

# Blockchain (Hardhat)
Write-Host "[1/4] Starting Hardhat node (Blockchain)..." -ForegroundColor Yellow
$blockchain = Start-Process -FilePath "cmd" -ArgumentList "/c", "cd blockchain && npx hardhat node" -PassThru
Start-Sleep -Seconds 5

# Crypto service (FastAPI)
Write-Host "[2/4] Starting Crypto service (FastAPI @8101)..." -ForegroundColor Yellow
$crypto = Start-Process -FilePath "cmd" -ArgumentList "/c", "cd crypto && .venv\Scripts\python.exe -m uvicorn app:app --app-dir crypto --port 8101 --reload" -PassThru
Start-Sleep -Seconds 5

# Backend service (FastAPI)
Write-Host "[3/4] Starting Backend service (FastAPI @8000)..." -ForegroundColor Yellow
$backend = Start-Process -FilePath "cmd" -ArgumentList "/c", "cd backend && .venv\Scripts\python.exe -m uvicorn app:app --app-dir backend --port 8000 --reload" -PassThru
Start-Sleep -Seconds 5

# Frontend (Vite or React)
Write-Host "[4/4] Starting Frontend (Vite Dev Server @5173)..." -ForegroundColor Yellow
$frontend = Start-Process -FilePath "cmd" -ArgumentList "/c", "cd frontend && npm run dev" -PassThru

Write-Host ""
Write-Host "All services started successfully!" -ForegroundColor Green
Write-Host "--------------------------------------"
Write-Host "Hardhat  → http://localhost:8545"
Write-Host "Crypto   → http://localhost:8101"
Write-Host "Backend  → http://localhost:8000"
Write-Host "Frontend → http://localhost:5173"
Write-Host "--------------------------------------"
Write-Host "Press Ctrl+C in each window to stop services." -ForegroundColor DarkGray
