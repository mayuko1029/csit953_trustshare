python3 -m ensurepip --upgrade
#!/bin/bash
set -e

echo "[1/5] Backend venv & deps"
python3 -m venv backend/.venv
source backend/.venv/bin/activate
pip install --upgrade pip
pip install -r backend/requirements.txt -r backend/requirements-dev.txt
deactivate

echo "[2/5] Crypto venv & deps"
python3 -m venv crypto/.venv
source crypto/.venv/bin/activate
pip install --upgrade pip
pip install -r crypto/requirements.txt -r crypto/requirements-dev.txt
deactivate

echo "[3/5] Blockchain deps"
cd blockchain
if [ -f "package-lock.json" ]; then
  npm ci
else
  npm install
fi
cd ..

echo "[4/5] Frontend deps"
cd frontend
if [ -f "package-lock.json" ]; then
  npm ci
else
  npm install
fi
cd ..

echo "[5/5] Setup complete!"
echo "Now copy .env.example to .env in each folder:"
echo "cp backend/.env.example backend/.env"
echo "cp crypto/.env.example crypto/.env"
