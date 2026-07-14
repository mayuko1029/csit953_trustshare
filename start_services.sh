#!/bin/bash

# ==============================================================================
# TrustShare System Startup Script (Cross-Platform)
# ==============================================================================
# This script helps launch all TrustShare services for testing
# 
# Usage:
#   On Windows: ./start_services.sh (in Git Bash)
#   On macOS/Linux: ./start_services.sh
# 
# Requirements:
#   - Python 3.12+ with pip
#   - Node.js 18+ with npm
#   - All dependencies installed
# ==============================================================================

echo "🚀 TrustShare System Launcher"
echo "============================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if port is available
check_port() {
    local port=$1
    local service=$2
    
    if command -v netstat >/dev/null 2>&1; then
        if netstat -an | grep ":$port " | grep -q "LISTEN"; then
            echo -e "${RED}❌ Port $port is already in use (needed for $service)${NC}"
            echo "   Please stop the service using port $port and try again."
            return 1
        fi
    fi
    return 0
}

# Function to check if command exists
check_command() {
    local cmd=$1
    local name=$2
    
    if ! command -v "$cmd" >/dev/null 2>&1; then
        echo -e "${RED}❌ $name is not installed or not in PATH${NC}"
        echo "   Please install $name and try again."
        return 1
    fi
    return 0
}

echo "🔍 Checking prerequisites..."

# Check required commands
check_command "python" "Python 3.12+"
python_ok=$?

check_command "node" "Node.js 18+"
node_ok=$?

check_command "npm" "npm"
npm_ok=$?

if [ $python_ok -ne 0 ] || [ $node_ok -ne 0 ] || [ $npm_ok -ne 0 ]; then
    echo ""
    echo -e "${RED}❌ Missing prerequisites. Please install the required software.${NC}"
    exit 1
fi

# Check Python version
python_version=$(python --version 2>&1 | awk '{print $2}')
echo -e "${GREEN}✅ Python $python_version detected${NC}"

# Check Node version  
node_version=$(node --version)
echo -e "${GREEN}✅ Node.js $node_version detected${NC}"

echo ""
echo "🔍 Checking port availability..."

# Check if required ports are available
check_port 8101 "Crypto Service"
crypto_port_ok=$?

check_port 8545 "Blockchain API"  
blockchain_port_ok=$?

check_port 8000 "Backend API"
backend_port_ok=$?

check_port 3000 "Frontend"
frontend_port_ok=$?

if [ $crypto_port_ok -ne 0 ] || [ $blockchain_port_ok -ne 0 ] || [ $backend_port_ok -ne 0 ] || [ $frontend_port_ok -ne 0 ]; then
    echo ""
    echo -e "${RED}❌ Some required ports are not available.${NC}"
    echo "   Stop the conflicting services and try again."
    exit 1
fi

echo -e "${GREEN}✅ All required ports (8000, 8101, 8545, 3000) are available${NC}"
echo ""

echo "🏗️  TrustShare requires 4 separate terminal windows to run all services."
echo "   This script will show you the exact commands to run in each terminal."
echo ""

echo -e "${YELLOW}📋 TERMINAL SETUP INSTRUCTIONS${NC}"
echo "================================="
echo ""

echo -e "${BLUE}Terminal 1 - Crypto Service (Port 8101):${NC}"
echo "----------------------------------------"
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    echo "cd crypto"
    echo ".venv\\Scripts\\python.exe -m uvicorn app:app --host 0.0.0.0 --port 8101 --reload"
else
    echo "cd crypto"
    echo "source .venv/bin/activate"
    echo "python -m uvicorn app:app --host 0.0.0.0 --port 8101 --reload"
fi
echo ""

echo -e "${BLUE}Terminal 2 - Blockchain API (Port 8545):${NC}"
echo "----------------------------------------"
echo "cd blockchain"
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    echo "C:\\GitHub\\CSIT953_trustshare\\backend\\.venv\\Scripts\\python.exe -m uvicorn blockchain_api:app --host 0.0.0.0 --port 8545 --reload"
else
    echo "../backend/.venv/bin/python -m uvicorn blockchain_api:app --host 0.0.0.0 --port 8545 --reload"
fi
echo ""

echo -e "${BLUE}Terminal 3 - Backend API (Port 8000):${NC}"
echo "--------------------------------------"
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    echo "cd backend"
    echo ".venv\\Scripts\\python.exe -m uvicorn app:app --host 0.0.0.0 --port 8000 --reload"
else
    echo "cd backend"
    echo "source .venv/bin/activate"  
    echo "python -m uvicorn app:app --host 0.0.0.0 --port 8000 --reload"
fi
echo ""

echo -e "${BLUE}Terminal 4 - Frontend (Port 3000):${NC}"
echo "----------------------------------"
echo "cd frontend"
echo "npm run dev"
echo ""

echo -e "${YELLOW}🧪 TESTING COMMANDS (after all services are running):${NC}"
echo "======================================================"
echo ""

if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    echo "# Windows PowerShell testing commands:"
    echo 'Invoke-WebRequest -UseBasicParsing http://localhost:8101/docs'
    echo 'Invoke-WebRequest -UseBasicParsing http://localhost:8545/health'  
    echo 'Invoke-WebRequest -UseBasicParsing http://localhost:8000/health'
    echo "# Open browser: http://localhost:3000"
else
    echo "# macOS/Linux testing commands:"
    echo "curl http://localhost:8101/docs"
    echo "curl http://localhost:8545/health"
    echo "curl http://localhost:8000/health"
    echo "# Open browser: http://localhost:3000"
fi
echo ""

echo -e "${GREEN}📖 For detailed instructions, see: LAUNCH_GUIDE.md${NC}"
echo ""
echo -e "${YELLOW}💡 TIP: Copy and paste the commands above into 4 separate terminal windows${NC}"
echo -e "${YELLOW}💡 TIP: Keep all terminal windows open while testing${NC}"
echo ""

# Ask user if they want to see directory structure
echo "🗂️  Would you like to see the project structure? (y/n)"
read -r show_structure

if [[ $show_structure =~ ^[Yy]$ ]]; then
    echo ""
    echo -e "${BLUE}📁 TrustShare Project Structure:${NC}"
    echo "==============================="
    echo "CSIT953_trustshare/"
    echo "├── crypto/          # AES-256-GCM encryption service"
    echo "├── blockchain/      # Sepolia testnet integration"  
    echo "├── backend/         # Main FastAPI server"
    echo "├── frontend/        # Next.js React interface"
    echo "├── LAUNCH_GUIDE.md  # Detailed setup instructions"
    echo "└── README.md        # Project overview"
    echo ""
fi

echo -e "${GREEN}🎉 Ready to launch TrustShare!${NC}"
echo -e "${GREEN}   Follow the terminal commands above to start all services.${NC}"