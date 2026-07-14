# 🚀 **Blockchain API Integration Guide**

You've now successfully separated the blockchain module from the backend using API calls! Here's how to use the new architecture:

## 🏗️ **New Architecture**

```
Backend (FastAPI :8000)
    ↓ HTTP API calls
Blockchain Service (FastAPI :8545)
    ↓ Web3.py calls
Sepolia Testnet
```

## 📋 **Setup Instructions**

### **1. Configure Blockchain Service**

```bash
# Navigate to blockchain directory
cd blockchain

# Copy environment template
cp .env.example .env

# Edit .env with your Sepolia configuration
# Add your Infura URL, contract address, and private key
```

### **2. Install Blockchain Service Dependencies**

```bash
# Install blockchain service requirements
pip install -r requirements.txt
```

### **3. Configure Backend to Use API**

Your backend is now configured to call the blockchain API instead of direct integration.

## 🚀 **Starting the Services**

### **Option A: Start Services Individually**

**Terminal 1 - Blockchain API Service:**
```bash
cd blockchain
python start_blockchain_api.py
```

**Terminal 2 - Backend Service:**
```bash
cd backend
python -m uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 3 - Crypto Service:**
```bash
cd crypto
C:\GitHub\CSIT953_trustshare\backend\.venv\Scripts\python.exe -m uvicorn app:app --host 0.0.0.0 --port 8101
```

**Terminal 4 - Frontend:**
```bash
cd frontend
npm run dev
```

## 🔍 **Testing the API Integration**

### **1. Test Blockchain Service Health**
```bash
curl http://localhost:8545/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "service": "TrustShare Blockchain API",
  "blockchain_connected": true,
  "chain_id": 11155111,
  "contract_loaded": true,
  "account_configured": true
}
```

### **2. Test Backend to Blockchain API Communication**

```bash
# Test file upload (this will call blockchain API internally)
cd backend
curl -X POST -H "User-ID: test_user_api" -F "file=@test.txt" http://localhost:8000/files
```

**Expected Response:**
```json
{
  "file_id": "abc123def456",
  "tx_hash": "0x1234567890abcdef...",
  "status": "success"
}
```

### **3. Test Direct Blockchain API**

```bash
# Test blockchain API directly
curl -X POST http://localhost:8545/api/blockchain/upload \
  -H "Content-Type: application/json" \
  -d '{
    "file_id": "test_file_123",
    "user_id": "test_user",
    "metadata": {"filename": "test.txt", "size": 100}
  }'
```

## 📊 **Service Status Check**

| Service | URL | Expected Response |
|---------|-----|------------------|
| **Frontend** | http://localhost:3000 | Web interface |
| **Backend API** | http://localhost:8000/health | `{"status": "ok"}` |
| **Crypto Service** | http://localhost:8101/ | `{"detail": "Not Found"}` (normal) |
| **Blockchain API** | http://localhost:8545/health | Blockchain status |

## 🔧 **API Documentation**

### **Blockchain API Endpoints:**

- **GET** `/health` - Service health check
- **POST** `/api/blockchain/upload` - Record file upload
- **POST** `/api/blockchain/request-access` - Request file access
- **POST** `/api/blockchain/approve-access` - Approve access request
- **GET** `/api/blockchain/file/{file_id}` - Get file info
- **GET** `/api/blockchain/access/{file_id}/{user_address}` - Check access

### **Interactive API Docs:**
Visit http://localhost:8545/docs for full API documentation and testing interface.

## 🛠️ **Development Benefits**

### **Team Development:**
- **Blockchain Developer**: Works in `/blockchain` directory independently
- **Backend Developer**: Works in `/backend` directory, calls blockchain API
- **Frontend Developer**: No changes needed, backend handles blockchain integration

### **Testing Benefits:**
- Test blockchain service independently
- Mock blockchain responses for backend testing
- Clear API contracts between services

### **Deployment Benefits:**
- Services can be scaled independently
- Blockchain service can be shared across multiple backends
- Easier debugging with separate logs

## 🔄 **Migration Summary**

### **What Changed:**
- ✅ **Backend**: Now uses `blockchain_api_client.py` instead of `blockchain_integration.py`
- ✅ **New Service**: Blockchain API service on port 8545
- ✅ **Same Interface**: Backend code mostly unchanged (backward compatible)
- ✅ **Real Sepolia**: Still supports full blockchain integration

### **What Stayed the Same:**
- ✅ **Frontend**: No changes needed
- ✅ **Crypto Service**: No changes needed
- ✅ **File Upload Flow**: Same user experience
- ✅ **Blockchain Features**: Same Sepolia integration

## 🚨 **Troubleshooting**

### **Blockchain Service Won't Start:**
- Check `.env` configuration in blockchain directory
- Verify dependencies installed: `pip install -r requirements.txt`
- Check port 8545 is available

### **Backend Can't Connect to Blockchain API:**
- Verify blockchain service is running on port 8545
- Check `BLOCKCHAIN_API_URL` in backend `.env`
- Test blockchain health: `curl http://localhost:8545/health`

### **Real Transactions Failing:**
- Verify Sepolia configuration in blockchain `.env`
- Check account has sufficient ETH
- Verify contract address is correct

## 🎯 **Success Indicators**

✅ **Blockchain service starts**: `python start_blockchain_api.py`  
✅ **Health check passes**: `curl http://localhost:8545/health`  
✅ **Backend connects**: File upload creates real Sepolia transaction  
✅ **API docs work**: http://localhost:8545/docs  
✅ **End-to-end flow**: Frontend → Backend → Blockchain API → Sepolia  

**Congratulations! You now have a proper microservices architecture with API-based blockchain integration! 🎉**