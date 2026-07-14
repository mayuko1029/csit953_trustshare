@echo off
rem ==============================================================================
rem TrustShare System Startup Script (Windows)
rem ==============================================================================
rem This script helps launch all TrustShare services for testing on Windows
rem 
rem Usage: Double-click this file or run: start_services.bat
rem 
rem Requirements:
rem   - Python 3.12+ with pip
rem   - Node.js 18+ with npm
rem   - All dependencies installed
rem ==============================================================================

color 07
title TrustShare System Launcher

echo.
echo ========================================
echo   🚀 TrustShare System Launcher
echo ========================================
echo.

echo 🔍 Checking prerequisites...
echo.

rem Check Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python is not installed or not in PATH
    echo    Please install Python 3.12+ and try again.
    pause
    exit /b 1
)

for /f "tokens=2" %%i in ('python --version 2^>^&1') do set python_version=%%i
echo ✅ Python %python_version% detected

rem Check Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed or not in PATH
    echo    Please install Node.js 18+ and try again.
    pause
    exit /b 1
)

for /f %%i in ('node --version') do set node_version=%%i
echo ✅ Node.js %node_version% detected

rem Check npm
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed or not in PATH
    echo    Please install npm and try again.
    pause
    exit /b 1
)

echo.
echo 🔍 Checking port availability...

rem Check if ports are in use (simplified check for Windows)
netstat -an | findstr ":8101 " | findstr "LISTENING" >nul
if %errorlevel% equ 0 (
    echo ❌ Port 8101 is already in use (needed for Crypto Service)
    echo    Please stop the service and try again.
)

netstat -an | findstr ":8545 " | findstr "LISTENING" >nul
if %errorlevel% equ 0 (
    echo ❌ Port 8545 is already in use (needed for Blockchain API)
    echo    Please stop the service and try again.
)

netstat -an | findstr ":8000 " | findstr "LISTENING" >nul
if %errorlevel% equ 0 (
    echo ❌ Port 8000 is already in use (needed for Backend API)
    echo    Please stop the service and try again.
)

netstat -an | findstr ":3000 " | findstr "LISTENING" >nul
if %errorlevel% equ 0 (
    echo ❌ Port 3000 is already in use (needed for Frontend)
    echo    Please stop the service and try again.
)

echo ✅ Required ports appear to be available
echo.

color 0E
echo =========================================================
echo   📋 TERMINAL SETUP INSTRUCTIONS
echo =========================================================
color 07
echo.

echo 🏗️  TrustShare requires 4 separate terminal windows to run all services.
echo    This script will show you the exact commands for each terminal.
echo.

color 0B
echo Terminal 1 - Crypto Service (Port 8101):
color 07
echo ----------------------------------------
echo cd crypto
echo .\.venv\Scripts\python.exe -m uvicorn app:app --host 0.0.0.0 --port 8101 --reload
echo.

color 0B  
echo Terminal 2 - Blockchain API (Port 8545):
color 07
echo ----------------------------------------
echo cd blockchain
echo C:\GitHub\CSIT953_trustshare\backend\.venv\Scripts\python.exe -m uvicorn blockchain_api:app --host 0.0.0.0 --port 8545 --reload
echo.

color 0B
echo Terminal 3 - Backend API (Port 8000):
color 07
echo --------------------------------------
echo cd backend
echo .\.venv\Scripts\python.exe -m uvicorn app:app --host 0.0.0.0 --port 8000 --reload
echo.

color 0B
echo Terminal 4 - Frontend (Port 3000):
color 07
echo ----------------------------------
echo cd frontend
echo npm run dev
echo.

color 0E
echo =====================================================
echo   🧪 TESTING COMMANDS (after services are running)
echo =====================================================
color 07
echo.

echo Windows PowerShell testing commands:
echo Invoke-WebRequest -UseBasicParsing http://localhost:8101/docs
echo Invoke-WebRequest -UseBasicParsing http://localhost:8545/health
echo Invoke-WebRequest -UseBasicParsing http://localhost:8000/health
echo Open browser: http://localhost:3000
echo.

echo Windows Command Prompt testing commands:
echo curl http://localhost:8101/docs
echo curl http://localhost:8545/health  
echo curl http://localhost:8000/health
echo Open browser: http://localhost:3000
echo.

color 0A
echo 📖 For detailed instructions, see: LAUNCH_GUIDE.md
echo.
echo 💡 TIP: Open 4 separate PowerShell or Command Prompt windows
echo 💡 TIP: Copy and paste the commands above into each window
echo 💡 TIP: Keep all windows open while testing
echo.

set /p show_structure="🗂️  Would you like to see the project structure? (y/n): "

if /i "%show_structure%"=="y" (
    echo.
    color 0B
    echo 📁 TrustShare Project Structure:
    color 07
    echo ===============================
    echo CSIT953_trustshare/
    echo ├── crypto/          # AES-256-GCM encryption service
    echo ├── blockchain/      # Sepolia testnet integration
    echo ├── backend/         # Main FastAPI server  
    echo ├── frontend/        # Next.js React interface
    echo ├── LAUNCH_GUIDE.md  # Detailed setup instructions
    echo └── README.md        # Project overview
    echo.
)

color 0A
echo 🎉 Ready to launch TrustShare!
echo    Follow the terminal commands above to start all services.
color 07
echo.

pause