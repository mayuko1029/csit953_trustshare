#!/usr/bin/env python3
# =========================================================================
# BLOCKCHAIN SERVICE STARTUP SCRIPT
# =========================================================================
# Start the blockchain API service with proper configuration
# =========================================================================

import os
import sys
from pathlib import Path

def main():
    print("🚀 Starting TrustShare Blockchain API Service...")
    print("")
    
    # Ensure we're in the blockchain directory
    blockchain_dir = Path(__file__).parent
    os.chdir(blockchain_dir)
    
    # Check for environment file
    if not Path(".env").exists():
        print("❌ .env file not found in blockchain directory")
        print("📝 Please copy .env.example to .env and configure your values:")
        print("   cp .env.example .env")
        print("")
        print("🔧 Required configuration:")
        print("   - BLOCKCHAIN_URL (your Infura Sepolia endpoint)")
        print("   - CONTRACT_ADDRESS (your deployed contract)")
        print("   - BLOCKCHAIN_PRIVATE_KEY (your test account key)")
        print("")
        sys.exit(1)
    
    # Check if requirements are installed
    try:
        import fastapi
        import web3
        import pydantic
    except ImportError:
        print("❌ Dependencies not installed")
        print("📦 Please install requirements:")
        print("   pip install -r requirements.txt")
        print("")
        sys.exit(1)
    
    print("✅ Environment and dependencies OK")
    print("🔗 Service will be available at: http://localhost:8545")
    print("📋 Health check: http://localhost:8545/health")
    print("📖 API docs: http://localhost:8545/docs")
    print("")
    print("🔧 To test the service:")
    print("   curl http://localhost:8545/health")
    print("")
    
    # Start the service
    try:
        import uvicorn
        from blockchain_api import app
        
        port = int(os.getenv("BLOCKCHAIN_API_PORT", 8545))
        
        uvicorn.run(
            app,
            host="0.0.0.0", 
            port=port,
            reload=True,
            log_level=os.getenv("LOG_LEVEL", "info").lower()
        )
    except Exception as e:
        print(f"❌ Startup failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()