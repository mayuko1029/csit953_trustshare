# 🎨 Frontend Developer Quick Start

**For frontend developers who want to test UI without blockchain setup complexity.**

## 🚀 Quick 3-Step Setup

### Step 1: Start Crypto Service
```bash
# Navigate to crypto directory
cd crypto

# Start encryption service (required for file uploads)
.venv/Scripts/python -m uvicorn app:app --host 0.0.0.0 --port 8101 --reload
```

### Step 2: Start Backend in Mock Mode
```bash
# Navigate to backend directory  
cd backend

# Windows PowerShell - Enable mock blockchain mode
$env:MOCK_BLOCKCHAIN="true"
.venv/Scripts/python -m uvicorn app:app --host 0.0.0.0 --port 8000 --reload

# macOS/Linux - Enable mock blockchain mode
MOCK_BLOCKCHAIN=true python -m uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

### Step 3: Start Frontend
```bash
cd frontend
npm install  # First time only
npm run dev
```

## ✅ What Works (No Blockchain Required)

- **File Upload Interface** ✅
- **File Encryption** ✅ (Real AES-256-GCM)
- **Mock Transaction Responses** ✅ 
- **File Metadata Display** ✅
- **UI Components & Styling** ✅
- **Error Handling** ✅
- **Loading States** ✅

## 🎭 Mock Mode Features

- **Simulated Transaction Hashes**: Realistic-looking mock blockchain responses
- **No ETH Required**: No testnet tokens or wallet setup needed
- **Fast Development**: Immediate feedback without blockchain delays
- **UI Focus**: Test all frontend functionality without backend complexity

## 🧪 Testing Checklist

### File Upload Test:
1. Open http://localhost:3000
2. Enter any User ID (e.g., "frontend_dev")
3. Select a file to upload
4. Click "Upload File"
5. ✅ Should see: File ID + Mock Transaction Hash

### Metadata Test:
1. Copy the File ID from upload result
2. Paste in "Retrieve Metadata" section
3. Click "Get Metadata"
4. ✅ Should see: File metadata with timestamps

### UI/UX Test:
- ✅ Responsive design on different screen sizes
- ✅ Loading spinners during uploads
- ✅ Error messages for invalid inputs
- ✅ Success animations and feedback
- ✅ Copy-to-clipboard functionality

## 🔄 When to Switch to Full Mode

Switch to full blockchain mode when:
- Testing complete integration
- Preparing for production
- Demonstrating to stakeholders
- Validating real blockchain transactions

## 🆘 Troubleshooting

### Issue: Crypto Service Not Starting
**Solution**: Ensure Python virtual environment is activated in crypto directory

### Issue: Backend CORS Errors
**Solution**: Check that backend is running on port 8000 and frontend on 3000

### Issue: File Upload Fails
**Check**: 
1. Crypto service running (port 8101)
2. Backend running (port 8000)
3. Backend shows "MOCK MODE" in logs

### Issue: Frontend Won't Start
**Solution**:
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

## 💡 Development Tips

- **Use Browser DevTools**: Monitor network requests and responses
- **Check Console Logs**: Backend shows "🎭 MOCK:" prefixes in mock mode
- **Hot Reload**: Frontend automatically refreshes on code changes
- **API Testing**: Use http://localhost:8000/docs for backend API testing

## 📱 Responsive Testing

Test the interface on different devices:
- **Desktop**: Full feature set with sidebar layouts
- **Tablet**: Responsive grid and touch interactions
- **Mobile**: Optimized upload flow and mobile-friendly UI

---

**🎨 Happy Frontend Development!**