
# =========================================================================
# TRUSTSHARE BLOCKCHAIN API SERVICE (Updated for Enhanced FileRegistry.sol)
# =========================================================================
# Handles Ethereum/Sepolia blockchain interactions with extended support for:
#  - digitalSignature in upload()
#  - publicKey in requestAccess()
#  - encryptedKeyRef in approveAccess()
#  - full getFileInfo() return (owner, meta, encryptedKeyRef, signature, exists)
# =========================================================================

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, Optional
import os
import json
import logging
from pathlib import Path
from web3 import Web3
from web3.contract import Contract
from dotenv import load_dotenv
import hashlib
import time

# -------------------------------------------------------------------------
# Setup
# -------------------------------------------------------------------------
load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("blockchain_api")


from pending_requests_router import router as pending_requests_router

app = FastAPI(
    title="TrustShare Blockchain API",
    description="Ethereum/Sepolia blockchain integration service",
    version="2.0.0"
)


allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:8000,http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register the pending requests router
app.include_router(pending_requests_router)

# -------------------------------------------------------------------------
# Models
# -------------------------------------------------------------------------
class FileUploadRequest(BaseModel):
    file_id: str
    user_id: str
    metadata: Dict[str, Any]
    digital_signature: str

class AccessRequestModel(BaseModel):
    file_id: str
    requester: str
    public_key: str
    metadata: Dict[str, Any]

class AccessApprovalModel(BaseModel):
    file_id: str
    requester: str
    key_ref: str
    metadata: Dict[str, Any]

class BlockchainResponse(BaseModel):
    tx_hash: Optional[str] = None
    block_number: Optional[int] = None
    gas_used: Optional[int] = None
    status: str
    contract_address: Optional[str] = None
    error: Optional[str] = None

# -------------------------------------------------------------------------
# Blockchain Connector
# -------------------------------------------------------------------------
class BlockchainConnector:
    def __init__(self):
        self.w3: Optional[Web3] = None
        self.contract: Optional[Contract] = None
        self.account = None
        self.setup_connection = self._setup_connection

    def _setup_connection(self):
        try:
            rpc_url = os.getenv("BLOCKCHAIN_URL")
            private_key = os.getenv("BLOCKCHAIN_PRIVATE_KEY")
            contract_address = os.getenv("CONTRACT_ADDRESS")

            logger.info(f"🔗 Connecting to blockchain: {rpc_url}")

            if not rpc_url:
                logger.error("❌ BLOCKCHAIN_URL not found in .env")
                return False

            self.w3 = Web3(Web3.HTTPProvider(rpc_url))
            if not self.w3.is_connected():
                logger.error("❌ Blockchain connection failed")
                return False

            chain_id = self.w3.eth.chain_id
            logger.info(f"📊 Chain ID: {chain_id}")

            if not private_key or private_key.strip() == "":
                logger.error("❌ BLOCKCHAIN_PRIVATE_KEY not found or empty in .env")
                return False

            self.account = None
            try:
                self.account = self.w3.eth.account.from_key(private_key)
            except Exception as acc_err:
                logger.error(f"❌ Failed to create account from private key: {acc_err}")
                return False

            if not self.account:
                logger.error("❌ Failed to create account from private key (account is None)")
                return False

            logger.info(f"✅ Connected as {self.account.address}")

            if contract_address:
                self.load_contract(contract_address)
            return True

        except Exception as e:
            logger.error(f"❌ setup_connection error: {e}")
            return False

    def load_contract(self, address: str):
        try:
            abi = self.get_contract_abi()
            if not abi:
                raise Exception("ABI not found")

            self.contract = self.w3.eth.contract(
                address=Web3.to_checksum_address(address),
                abi=abi
            )
            logger.info(f"✅ Contract loaded at {address}")
        except Exception as e:
            logger.error(f"❌ Contract loading failed: {e}")

    def get_contract_abi(self):
        possible_paths = [
            Path(__file__).parent / "artifacts" / "contracts" / "FileRegistry.sol" / "FileRegistry.json",
            Path(__file__).parent / "deployments" / "sepolia.json"
        ]
        for path in possible_paths:
            if path.exists():
                with open(path) as f:
                    data = json.load(f)
                    if "abi" in data:
                        return data["abi"]
                    elif isinstance(data, list):
                        return data
        return None

# Initialize
blockchain = BlockchainConnector()
blockchain.setup_connection()
# -------------------------------------------------------------------------
# Helper Functions
# -------------------------------------------------------------------------
def send_transaction(function):
    """Build, sign, and send transaction to the blockchain"""
    try:
        gas_estimate = function.estimate_gas({"from": blockchain.account.address})
        nonce = blockchain.w3.eth.get_transaction_count(blockchain.account.address)
        gas_price = blockchain.w3.eth.gas_price

        tx = function.build_transaction({
            "from": blockchain.account.address,
            "gas": int(gas_estimate * 1.2),
            "gasPrice": gas_price,
            "nonce": nonce,
        })

        signed = blockchain.w3.eth.account.sign_transaction(tx, blockchain.account.key)
        tx_hash = blockchain.w3.eth.send_raw_transaction(signed.raw_transaction)
        receipt = blockchain.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
        return BlockchainResponse(
            tx_hash=tx_hash.hex(),
            block_number=receipt.blockNumber,
            gas_used=receipt.gasUsed,
            status="success",
            contract_address=blockchain.contract.address,
        )
    except Exception as e:
        logger.error(f"❌ Transaction failed: {e}")
        return BlockchainResponse(status="error", error=str(e))

# -------------------------------------------------------------------------
# API Endpoints
# -------------------------------------------------------------------------

@app.get("/health")
def health_check():
    connected = blockchain.w3.is_connected() if blockchain.w3 else False
    return {
        "status": "ok",
        "connected": connected,
        "contract_loaded": blockchain.contract is not None,
        "account": blockchain.account.address if blockchain.account else None,
    }

@app.post("/api/blockchain/upload", response_model=BlockchainResponse)
async def upload_file(req: FileUploadRequest):
    """Upload file to blockchain with metadata and signature"""
    try:
        if not blockchain.contract:
            raise Exception("Contract not loaded")

        file_hash = blockchain.w3.keccak(text=req.file_id)
        metadata = dict(req.metadata)
        meta_json = json.dumps(metadata)
        sig = req.digital_signature

        func = blockchain.contract.functions.upload(file_hash, meta_json, sig)
        result = send_transaction(func)
        return result
    except Exception as e:
        logger.error(f"❌ Upload failed: {e}")
        return BlockchainResponse(status="error", error=str(e))

@app.post("/api/blockchain/request-access", response_model=BlockchainResponse)
async def request_access(req: AccessRequestModel):
    """Request access to file with public key"""
    try:
        if not blockchain.contract:
            raise Exception("Contract not loaded")

        file_hash = blockchain.w3.keccak(text=req.file_id)
        metadata = dict(req.metadata)
        meta_json = json.dumps(metadata)
        func = blockchain.contract.functions.requestAccess(file_hash, req.public_key, meta_json)
        result = send_transaction(func)
        return result
    except Exception as e:
        logger.error(f"❌ Request access failed: {e}")
        return BlockchainResponse(status="error", error=str(e))
    
@app.get("/api/blockchain/access-request/{file_id}/{requester}")
async def get_access_request(file_id: str, requester: str):
    """
    Get the access request record for a file and requester address.
    Returns: {"requester": ..., "public_key": ..., "approved": ..., "exists": ...}
    """
    try:
        if not blockchain.contract:
            raise HTTPException(status_code=503, detail="Contract not loaded")
        file_hash = blockchain.w3.keccak(text=file_id)
        requester_addr = Web3.to_checksum_address(requester)
        access_req = blockchain.contract.functions.requests(file_hash, requester_addr).call()
        # access_req: (requester, publicKey, approved, exists)
        return {
            "requester": access_req[0],
            "public_key": access_req[1],
            "approved": access_req[2],
            "exists": access_req[3]
        }
    except Exception as e:
        logger.error(f"❌ get_access_request failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/blockchain/approve-access", response_model=BlockchainResponse)
async def approve_access(req: AccessApprovalModel):
    """Approve access with encrypted key reference"""
    try:
        if not blockchain.contract:
            raise Exception("Contract not loaded")

        file_hash = blockchain.w3.keccak(text=req.file_id)
        metadata = dict(req.metadata)
        meta_json = json.dumps(metadata)
        requester_addr = Web3.to_checksum_address(req.requester)
        func = blockchain.contract.functions.approveAccess(file_hash, requester_addr, req.key_ref, meta_json)
        result = send_transaction(func)
        return result
    except Exception as e:
        logger.error(f"❌ Approve access failed: {e}")
        return BlockchainResponse(status="error", error=str(e))

from fastapi import Query

@app.get("/api/blockchain/file/{file_id}")
async def get_file_info(file_id: str, user_address: str = Query(..., description="User's blockchain address")):
    """
    Get full file information if user_address has access.
    - file_id: The unique file identifier (string, hashed for blockchain lookup)
    - user_address: The blockchain address of the user requesting access (must be provided as a query parameter)
    This endpoint:
      1. Checks if the blockchain contract is loaded.
      2. Hashes the file_id to match the contract's storage format.
      3. Checks if the given user_address has access to the file using the contract's hasAccess function.
      4. If access is granted, fetches and returns the file info from the contract.
      5. If access is denied, returns 403 Forbidden.
    """
    try:
        # 1. Ensure the contract is loaded
        if not blockchain.contract:
            raise HTTPException(status_code=503, detail="Contract not loaded")

        # 2. Hash the file_id for blockchain lookup
        file_hash = blockchain.w3.keccak(text=file_id)

        # 3. Convert user_address to checksum format and check access
        user_addr = Web3.to_checksum_address(user_address)
        has_access = blockchain.contract.functions.hasAccess(file_hash, user_addr).call()
        if not has_access:
            # 5. If not approved, deny access
            raise HTTPException(status_code=403, detail="User does not have access to this file")

        # 4. If approved, fetch file info from the contract
        result = blockchain.contract.functions.getFileInfo(file_hash).call()
        logger.info(f"getFileInfo result for {file_id} (hash {file_hash.hex()}): {result}")

        # Parse metadata JSON string if possible
        raw_metadata = result[1]
        try:
            metadata = json.loads(raw_metadata) if raw_metadata else None
        except Exception as e:
            logger.warning(f"Failed to parse metadata JSON for file_id={file_id}: {e}")
            metadata = {"raw": raw_metadata, "parse_error": str(e)}

        # Return the file info as a dictionary
        return {
            "transaction_type": "download_file",
            "owner": result[0],
            "metadata": metadata,
            "encrypted_key_ref": result[2],
            "digital_signature": result[3],
            "exists": result[4],
        }
    except Exception as e:
        logger.error(f"❌ getFileInfo failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# @app.get("/api/blockchain/access/{file_id}/{user_address}")
# async def check_access(file_id: str, user_address: str):
#     """Check if user has access to the file"""
#     try:
#         if not blockchain.contract:
#             raise HTTPException(status_code=503, detail="Contract not loaded")

#         file_hash = blockchain.w3.keccak(text=file_id)
#         user_addr = Web3.to_checksum_address(user_address)
#         access = blockchain.contract.functions.hasAccess(file_hash, user_addr).call()
#         return {"file_id": file_id, "user_address": user_address, "has_access": access}
#     except Exception as e:
#         logger.error(f"❌ checkAccess failed: {e}")
#         raise HTTPException(status_code=500, detail=str(e))
# -------------------------------------------------------------------------
# Minimal File Info Endpoint for Polling/Status (No Access Check)
# -------------------------------------------------------------------------
@app.get("/api/blockchain/file-info/{file_id}")
async def get_file_info_minimal(file_id: str):
    """
    Return minimal file info for polling/status (does not check access or perform cryptographic operations).
    Returns: {
        "file_id": ..., "owner": ..., "user_id": ..., "file_name": ..., "completed_transactions": ..., "exists": ...
    }
    """
    try:
        if not blockchain.contract:
            raise HTTPException(status_code=503, detail="Contract not loaded")
        file_hash = blockchain.w3.keccak(text=file_id)
        result = blockchain.contract.functions.getFileInfo(file_hash).call()
        logger.info(f"[file-info] file_id={file_id} file_hash={file_hash.hex()} getFileInfo result={result}")
        # result: (owner, metadata, encrypted_key_ref, digital_signature, exists)
        raw_metadata = result[1]
        try:
            metadata = json.loads(raw_metadata) if raw_metadata else None
        except Exception as e:
            logger.warning(f"Failed to parse metadata JSON for file_id={file_id}: {e}")
            metadata = {"raw": raw_metadata, "parse_error": str(e)}

        # Extract user_id and file_name from metadata if present
        user_id = metadata.get("user_id") if isinstance(metadata, dict) else None
        file_name = metadata.get("file_name") if isinstance(metadata, dict) else None

        completed_transactions = {
            "upload": result[4],
            "access_approval": bool(result[2]),
        }

        return {
            "file_id": file_id,
            "owner": result[0],
            "user_id": user_id,
            "file_name": file_name,
            "completed_transactions": completed_transactions,
            "exists": result[4],
        }
    except Exception as e:
        logger.error(f"❌ get_file_info_minimal failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
# -------------------------------------------------------------------------
# Search file info by file name (using local metadata index)
# -------------------------------------------------------------------------
from glob import glob

@app.get("/api/blockchain/file-info-by-name/{file_name}")
async def get_file_info_by_name(file_name: str):
    """
    Search for file info by file name using local metadata index (data/*.meta.json).
    Returns the same structure as /api/blockchain/file-info/{file_id} for the first match.
    """
    try:
        # Search local metadata files for file_name
        data_dir = Path(__file__).parent / ".." / "backend" / "data"
        meta_files = list(data_dir.glob("*.meta.json"))
        for meta_path in meta_files:
            with open(meta_path, "r", encoding="utf-8") as f:
                meta = json.load(f)
                if meta.get("file_name") == file_name:
                    file_id = meta_path.stem.replace(".meta", "")
                    # Proxy to the file-info endpoint
                    from fastapi import Request
                    # Directly call the function to avoid HTTP overhead
                    return await get_file_info_minimal(file_id)
        raise HTTPException(status_code=404, detail="File name not found")
    except Exception as e:
        logger.error(f"Error searching file info by file name: {e}")
        raise HTTPException(status_code=500, detail=f"File search failed: {str(e)}")
# -------------------------------------------------------------------------
# Simulation (for local testing)
# -------------------------------------------------------------------------
@app.post("/api/blockchain/simulate/upload")
async def simulate_upload(req: FileUploadRequest):
    data = f"{req.file_id}_{req.user_id}_{time.time()}"
    mock_hash = "0x" + hashlib.sha256(data.encode()).hexdigest()[:40]
    return BlockchainResponse(
        tx_hash=mock_hash,
        block_number=9999,
        gas_used=123456,
        status="simulated",
        contract_address="0x0000000000000000000000000000000000000000"
    )

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("BLOCKCHAIN_API_PORT", 8545))
    uvicorn.run(app, host="0.0.0.0", port=port)
