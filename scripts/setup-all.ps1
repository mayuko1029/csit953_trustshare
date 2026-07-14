Write-Host "[1/5] Backend venv & deps" -ForegroundColor Cyan
python -m venv backend\.venv
& "backend/.venv/Scripts/Activate.ps1"
python -m pip install --upgrade pip
pip install -r backend/requirements.txt -r backend/requirements-dev.txt
deactivate

Write-Host "[2/5] Crypto venv & deps" -ForegroundColor Cyan
python -m venv crypto\.venv
& "crypto/.venv/Scripts/Activate.ps1"
python -m pip install --upgrade pip
pip install -r crypto/requirements.txt -r crypto/requirements-dev.txt
deactivate

Write-Host "[3/5] Blockchain deps" -ForegroundColor Yellow
Push-Location blockchain
if (Test-Path package-lock.json) {
  npm ci
} else {
  npm install
}
Pop-Location

Write-Host "[4/5] Frontend deps" -ForegroundColor Yellow
Push-Location frontend
if (Test-Path package-lock.json) {
  npm ci
} else {
  npm install
}
Pop-Location

Write-Host "[5/5] Setup complete!" -ForegroundColor Green
Write-Host "Now copy .env.example to .env in each folder:"
Write-Host "cp backend/.env.example backend/.env"
Write-Host "cp crypto/.env.example crypto/.env"
