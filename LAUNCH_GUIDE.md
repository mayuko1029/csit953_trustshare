 # ---
# Key Management & Configuration (2025-10-27)

## 🔑 Key Setup and Security

### 1. Environment Variables

Set the following in your `.env` files for each service:

#### Backend (`backend/.env`)
- `CRYPTO_URL=http://localhost:8101`
- `BLOCKCHAIN_API_URL=http://localhost:8545`
- `STORAGE_PATH=./data`
- `SECRET_KEY=your_jwt_secret`
- `TEST_RECIPIENT_PUBKEY=-----BEGIN PUBLIC KEY-----...` (PEM format, used for access requests)

#### Crypto Service (`crypto/.env`)
- `AES_KEY=base64_or_32byte_string` (must be exactly 32 bytes or base64-encoded 32 bytes)
- `ECDSA_CURVE=secp256k1`
- `RECIPIENT_PRIVKEY_PEM=-----BEGIN PRIVATE KEY-----...` (PEM format, used for unwrapping keys)

#### Blockchain API (`blockchain/.env`)
- `BLOCKCHAIN_URL=https://sepolia.infura.io/v3/your_project_id`
- `BLOCKCHAIN_PRIVATE_KEY=your_private_key`
- `CONTRACT_ADDRESS=0x...` (deployed contract address)

### 2. Key Generation

- Use the provided script to generate EC key pairs:
   ```
   cd scripts
   python generate_ec_keys.py
   ```
- Copy the generated public/private keys to the appropriate `.env` files as shown above.

### 3. Symmetric Key

- The symmetric AES key (`AES_KEY`) must be the same for both encryption and decryption.
- For testing, use a fixed value; for production, use a secure random key and store it safely.

### 4. Workflow Notes

- **Private keys** are never sent over the network. The crypto service loads the recipient’s private key from its environment.
- **Public keys** are used for access requests and key wrapping.
- **Unwrap payload**: The backend parses the `encrypted_key_ref` from the blockchain and sends only the required fields to the crypto service.
- **All cryptographic operations** (signing, encryption, key wrapping/unwrapping) are handled by the crypto service.

### 5. Troubleshooting

- If you see “Unwrap key failed”, check that the private key in the crypto service matches the public key used for wrapping.
- Use the debug logs in the crypto service for parameter inspection.

# ---
# Implementation Notes (2025-10-27)

- Backend now parses `encrypted_key_ref` and sends correct unwrap fields to crypto service.
- Integration test passes end-to-end (file upload, access request, approval, unwrap, signature verification).
- All key material is managed via environment variables and never transmitted insecurely.

# 🚀 TrustShare System Launch Guide

This comprehensive guide will help you launch all four TrustShare modules for testing. Follow these instructions step by step.

## 📋 Prerequisites

### Required Software
- **Python 3.12+** installed
- **Node.js 18+** installed
- **Git** installed
- **Terminal/Command Prompt** access

### Environment Setup
1. Clone the repository if you haven't already:
   ```bash
   git clone https://github.com/Karigarimutyo/CSIT953_trustshare.git
   cd CSIT953_trustshare
   ```

## 🏗️ System Architecture

TrustShare consists of 4 microservices that must be launched in order:

1. **Crypto Service** (Port 8101) - Handles AES-256-GCM encryption and ECDSA signing
2. **Blockchain API** (Port 8545) - Manages Sepolia testnet interactions
3. **Backend API** (Port 8000) - Main FastAPI server with file upload logic
4. **Frontend** (Port 3000) - Next.js React interface

### 🐍 Python Virtual Environment Usage:
- **Crypto Service**: Uses `crypto/.venv/` (own virtual environment)
- **Blockchain API**: Uses `backend/.venv/` (shares backend's virtual environment)
- **Backend API**: Uses `backend/.venv/` (own virtual environment)

## 📝 Step-by-Step Launch Instructions

### Step 1: Launch Crypto Service (Port 8101)

**For Windows PowerShell:**
```powershell
# Navigate to crypto directory
cd C:\GitHub\CSIT953_trustshare\crypto

# Activate virtual environment (if it exists)
.\.venv\Scripts\Activate.ps1

# Start the crypto service
.\.venv\Scripts\python.exe -m uvicorn app:app --host 0.0.0.0 --port 8101 --reload
```

**For Windows Command Prompt:**
```cmd
cd C:\GitHub\CSIT953_trustshare\crypto
.venv\Scripts\activate.bat
.venv\Scripts\python.exe -m uvicorn app:app --host 0.0.0.0 --port 8101 --reload
```

**For macOS/Linux:**
```bash
cd /path/to/CSIT953_trustshare/crypto
source .venv/bin/activate
python -m uvicorn app:app --host 0.0.0.0 --port 8101 --reload
```

**Expected Output:**
```
INFO:     Will watch for changes in these directories: ['/path/to/crypto']
INFO:     Uvicorn running on http://0.0.0.0:8101 (Press CTRL+C to quit)
INFO:     Started server process [XXXXX]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

**Test Crypto Service:**
- Open browser: http://localhost:8101/docs
- You should see the FastAPI Swagger documentation

---

### Step 2: Launch Blockchain API (Port 8545)

**Open a NEW terminal window/tab**

**For Windows PowerShell:**
```powershell
# Navigate to blockchain directory
cd C:\GitHub\CSIT953_trustshare\blockchain

# Start blockchain service (uses backend's virtual environment)
C:\GitHub\CSIT953_trustshare\backend\.venv\Scripts\python.exe -m uvicorn blockchain_api:app --host 0.0.0.0 --port 8545 --reload
```

**For Windows Command Prompt:**
```cmd
cd C:\GitHub\CSIT953_trustshare\blockchain
C:\GitHub\CSIT953_trustshare\backend\.venv\Scripts\python.exe -m uvicorn blockchain_api:app --host 0.0.0.0 --port 8545 --reload
```

**For macOS/Linux:**
```bash
cd /path/to/CSIT953_trustshare/blockchain
../backend/.venv/bin/python -m uvicorn blockchain_api:app --host 0.0.0.0 --port 8545 --reload
```

**Expected Output:**
```
INFO:     Uvicorn running on http://0.0.0.0:8545 (Press CTRL+C to quit)
INFO:blockchain_api:🔗 Connecting to blockchain: https://sepolia.infura.io/v3/...
INFO:blockchain_api:✅ Connected to blockchain
INFO:blockchain_api:📊 Chain ID: 11155111
INFO:blockchain_api:👤 Account: 0x0e0DAd1513Dc98df2b595eF9B0C7496575bCc140
INFO:blockchain_api:💰 Balance: 0.098 ETH
INFO:blockchain_api:✅ Contract loaded: 0xBeF263D7CFbe67249230F65045180Ef3Cd52E8cf
INFO:     Application startup complete.
```

**Test Blockchain Service:**
- Open browser: http://localhost:8545/health
- You should see: `{"status":"ok","service":"TrustShare Blockchain API","blockchain_connected":true,...}`

---

### Step 3: Launch Backend API (Port 8000)

**Open a NEW terminal window/tab**

**For Windows PowerShell:**
```powershell
# Navigate to backend directory
cd C:\GitHub\CSIT953_trustshare\backend

# Activate virtual environment
.\.venv\Scripts\Activate.ps1

# Start backend service
.\.venv\Scripts\python.exe -m uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

**For Windows Command Prompt:**
```cmd
cd C:\GitHub\CSIT953_trustshare\backend
.venv\Scripts\activate.bat
.venv\Scripts\python.exe -m uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

**For macOS/Linux:**
```bash
cd /path/to/CSIT953_trustshare/backend
source .venv/bin/activate
python -m uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

**Expected Output:**
```
INFO:     Will watch for changes in these directories: ['/path/to/backend']
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
Loading .env from: /path/to/backend/.env
INFO:     Started server process [XXXXX]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

**Test Backend Service:**
- Open browser: http://localhost:8000/health
- You should see: `{"status":"ok"}`
- API docs: http://localhost:8000/docs

---

### Step 4: Launch Frontend (Port 3000)

**Open a NEW terminal window/tab**

**For Windows PowerShell:**
```powershell
# Navigate to frontend directory
cd C:\GitHub\CSIT953_trustshare\frontend

# Install dependencies (first time only)
npm install

# Start development server
npm run dev
```

**For Windows Command Prompt:**
```cmd
cd C:\GitHub\CSIT953_trustshare\frontend
npm install
npm run dev
```

**For macOS/Linux:**
```bash
cd /path/to/CSIT953_trustshare/frontend
npm install
npm run dev
```

**Expected Output:**
```
> frontend@0.1.0 dev
> next dev

  ▲ Next.js 15.0.3
  - Local:        http://localhost:3000
  - Environments: .env

 ✓ Starting...
 ✓ Ready in 2.3s
```

**Test Frontend:**
- Open browser: http://localhost:3000
- You should see the TrustShare interface

---

## 🧪 System Health Check

Once all services are running, test the complete system:

### Quick Health Check Commands

**Windows PowerShell:**
```powershell
# Test all services
Write-Output "Testing Crypto Service:"
Invoke-WebRequest -UseBasicParsing http://localhost:8101/docs | Select-Object StatusCode

Write-Output "Testing Blockchain API:"
Invoke-WebRequest -UseBasicParsing http://localhost:8545/health | Select-Object StatusCode

Write-Output "Testing Backend API:"
Invoke-WebRequest -UseBasicParsing http://localhost:8000/health | Select-Object StatusCode

Write-Output "Testing Frontend:"
Invoke-WebRequest -UseBasicParsing http://localhost:3000 | Select-Object StatusCode
```

**macOS/Linux:**
```bash
echo "Testing Crypto Service:"
curl -s -o /dev/null -w "%{http_code}" http://localhost:8101/docs

echo "Testing Blockchain API:"
curl -s -o /dev/null -w "%{http_code}" http://localhost:8545/health

echo "Testing Backend API:"
curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health

echo "Testing Frontend:"
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
```

**All responses should return: 200**

---

## 🔧 Troubleshooting

### Common Issues and Solutions

#### Issue 1: Port Already in Use
**Error:** `OSError: [Errno 48] Address already in use`

**Solution:**
```bash
# Windows
netstat -ano | findstr :8101
taskkill /PID <process_id> /F

# macOS/Linux
lsof -ti:8101 | xargs kill -9
```

#### Issue 2: Module Not Found
**Error:** `ModuleNotFoundError: No module named 'app'`

**Solution:**
- Ensure you are in the correct directory for each service
- Check that virtual environments are activated properly

#### Issue 3: Virtual Environment Issues
**Error:** `cannot be loaded because running scripts is disabled`

**Windows Solution:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

#### Issue 4: Crypto Service Not Responding
**Solution:**
1. Stop the service (Ctrl+C)
2. Navigate to crypto directory
3. Restart with correct virtual environment

#### Issue 5: Blockchain Connection Failed
**Check:**
- Internet connection
- .env file configuration in blockchain directory
- Infura endpoint validity

#### Issue 6: Frontend Build Errors
**Solution:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

---

## 📊 Service Status Dashboard

### Expected Running Services:
| Service | Port | Status Check URL | Purpose |
|---------|------|-----------------|---------|
| Crypto | 8101 | http://localhost:8101/docs | Encryption & Signing |
| Blockchain | 8545 | http://localhost:8545/health | Sepolia Integration |
| Backend | 8000 | http://localhost:8000/health | Main API |
| Frontend | 3000 | http://localhost:3000 | User Interface |

### Process Management:
- **Keep all terminal windows open** while testing
- **Stop services:** Use Ctrl+C in each terminal
- **Restart services:** Re-run the launch commands above

---

## 🎯 End-to-End Testing

### File Upload Test:
1. Open http://localhost:3000
2. Enter a User ID (e.g., "test_user")
3. Select a file to upload
4. Click "Upload File"
5. Verify you receive:
   - File ID
   - Transaction hash
   - Success message

### Metadata Retrieval Test:
1. Copy the File ID from upload result
2. Paste it in "Retrieve Metadata" section
3. Click "Get Metadata"
4. Verify metadata appears with user info and timestamps

---

## 📝 Important Notes

### For Team Collaboration:
- **All team members** need the same repository version
- **Environment files (.env)** are already configured
- **No additional setup** required for blockchain connectivity
- **Ports 8000, 8101, 8545, 3000** must be available

### Development Workflow:
1. Always start services in the order listed above
2. Keep all services running during testing
3. Use Ctrl+C to stop services when done
4. Frontend has hot-reload enabled for development

### Security Notes:
- This setup uses **Sepolia testnet** (safe for testing)
- **Private keys** are for development only
- **Do not use** these keys on mainnet

---

## 🆘 Getting Help

If you encounter issues:
1. **Check all services are running** using the health check commands
2. **Verify correct directories** for each service
3. **Restart problematic services** using the launch commands
4. **Check terminal output** for specific error messages

### Contact Information:
- Create an issue in the GitHub repository
- Include terminal output and error messages
- Specify your operating system and Node.js/Python versions

---

## 🎨 **Frontend-Only Development Mode**

### For Frontend Developers (No Blockchain Setup Required)

If you're a frontend developer who just wants to test the UI and file upload without blockchain complexity:

#### **Quick Frontend Testing (3 Steps Only):**

**Step 1: Start Crypto Service (Required for file encryption)**
```powershell
cd C:\GitHub\CSIT953_trustshare\crypto
.\.venv\Scripts\python.exe -m uvicorn app:app --host 0.0.0.0 --port 8101 --reload
```

**Step 2: Start Backend in Mock Mode**
```powershell
cd C:\GitHub\CSIT953_trustshare\backend
# Set mock mode environment variable
$env:MOCK_BLOCKCHAIN="true"
.\.venv\Scripts\python.exe -m uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

**Step 3: Start Frontend**
```powershell
cd C:\GitHub\CSIT953_trustshare\frontend
npm run dev
```

#### **What Works in Frontend-Only Mode:**
- ✅ **File Upload UI** - Complete file selection and upload interface
- ✅ **File Encryption** - Real AES-256-GCM encryption via crypto service
- ✅ **Mock Blockchain** - Simulated transaction responses (no real blockchain)
- ✅ **File Metadata** - Local storage and retrieval functionality
- ✅ **UI Components** - All React components, animations, and styling
- ✅ **Error Handling** - Frontend error states and user feedback

#### **What's Simulated:**
- 🔄 **Blockchain Transactions** - Mock transaction hashes generated
- 🔄 **Sepolia Network** - No real network calls or testnet ETH needed
- 🔄 **Smart Contract** - Simulated responses for development

#### **Benefits for Frontend Development:**
- ⚡ **Fast Setup** - Only 3 commands, no blockchain configuration
- 🔧 **UI Focus** - Test components, styling, and user interactions
- 🚀 **Quick Iteration** - Immediate feedback on frontend changes
- 💡 **No ETH Required** - No testnet tokens or wallet setup needed

#### **When to Use Full Blockchain Mode:**
- 🔗 **Integration Testing** - When testing complete end-to-end workflow
- 🧪 **Final Validation** - Before deployment or production testing
- 👥 **Team Demo** - When demonstrating complete system functionality

---

**🎉 You're ready to test the complete TrustShare system!**