from fastapi import FastAPI, UploadFile, File, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
import os, httpx, hashlib, json, time, logging, random
from pathlib import Path
from dotenv import load_dotenv
from jose import JWTError, jwt
from datetime import datetime, timedelta
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.primitives import hashes

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# -------------------------------------------------------------------------
# Load environment variables FIRST
# -------------------------------------------------------------------------
# Get the directory where this app.py file is located
current_dir = Path(__file__).parent
env_path = current_dir / ".env"
load_dotenv(env_path)
print(f"Loading .env from: {env_path}")


# Load deployer address from blockchain/deployments/sepolia.json
DEPLOY_PATH = current_dir.parent / "blockchain" / "deployments" / "sepolia.json"
with open(DEPLOY_PATH) as f:
    deploy_info = json.load(f)
    SYSTEM_ADDRESS = deploy_info.get("deployerAddress")

# Import blockchain API client AFTER environment variables are loaded
from blockchain_api_client import blockchain_integrator

app = FastAPI(title="TrustShare Backend")

# -------------------------------------------------------------------------
# CORS Configuration - Allow frontend to connect
# -------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],  # Frontend URLs
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers including custom user_id header
)

# Load essential configuration
CRYPTO_URL = os.getenv("CRYPTO_URL", "http://localhost:8101")
BLOCKCHAIN_URL = os.getenv("BLOCKCHAIN_API_URL", "http://localhost:8545")
STORAGE_PATH = Path(os.getenv("STORAGE_PATH", "./data"))
SECRET_KEY = os.getenv("SECRET_KEY", "change_me")
MOCK_BLOCKCHAIN = os.getenv("MOCK_BLOCKCHAIN", "false").lower() == "true"
STORAGE_PATH.mkdir(parents=True, exist_ok=True)

# Load test recipient public key for prototype
TEST_RECIPIENT_PUBKEY = os.getenv("TEST_RECIPIENT_PUBKEY")
if not TEST_RECIPIENT_PUBKEY:
    raise RuntimeError("TEST_RECIPIENT_PUBKEY must be set in .env for prototype mode.")

# Mock blockchain functions for frontend development
def generate_mock_tx_hash():
    """Generate a realistic-looking mock transaction hash"""
    import random
    return "0x" + "".join([random.choice("0123456789abcdef") for _ in range(64)])

async def mock_blockchain_record(operation: str, file_id: str, user_id: str, metadata: dict = None):
    """Mock blockchain recording for frontend development"""
    logger.info(f"🎭 MOCK MODE: {operation} for file {file_id} by {user_id}")
    return {
        "tx_hash": generate_mock_tx_hash(),
        "status": "success",
        "block_number": random.randint(1000000, 2000000),
        "gas_used": random.randint(50000, 200000),
        "mock": True
    }
# -------------------------------------------------------------------------
# M2.1 - File Upload API
# -------------------------------------------------------------------------
@app.post("/api/file/upload")
async def upload_file(user_id: str = Header(..., alias="User-ID"), file: UploadFile = File(...)):
    data = await file.read()
    payload = await encrypt_and_sign(file.filename, data)
    ciphertext_b64 = payload["enc"]["ciphertextB64"]
    fid = hashlib.sha256(ciphertext_b64.encode()).hexdigest()[:16]

    # Store the real user_id in metadata for audit/UI
    metadata = {
        "user_id": user_id,
        "hash": payload["hash"],
        "signature": payload["signature"],
        "timestamp": time.time(),
        "file_name": file.filename,
    }
    save_encrypted_file(fid, ciphertext_b64, metadata)

    # Blockchain operations always use SYSTEM_ADDRESS
    blockchain_metadata = {
        "transaction_type": "upload_file",
        "user_id": user_id,
        "file_id" : fid,
        "file_name": file.filename,
        "hash": payload["hash"],
        "signature": payload["signature"],
        "timestamp": metadata["timestamp"],      
    }
    digital_signature = payload["signature"]["signatureB64"]

    if MOCK_BLOCKCHAIN:
        blockchain_res = await mock_blockchain_record("file_upload", fid, SYSTEM_ADDRESS, blockchain_metadata)
        logger.info(f"🎭 MOCK: File upload simulated for {fid} by {SYSTEM_ADDRESS} (user_id={user_id})")
    else:
        blockchain_res = await blockchain_integrator.record_file_upload(fid, SYSTEM_ADDRESS, blockchain_metadata, digital_signature)
        logger.info(f"✅ File upload recorded on blockchain: {fid} by {SYSTEM_ADDRESS} (user_id={user_id})")

    tx_hash = blockchain_res.get("tx_hash")
    return {
        "file_id": fid,
        "tx_hash": tx_hash,
        "status": "success",
        "user_id": user_id,
        "file_name": file.filename,
        "blockchain_metadata": blockchain_metadata
    }

# -------------------------------------------------------------------------
# M2.2 - Cryptography Orchestrator
# -------------------------------------------------------------------------
async def encrypt_and_sign(file_name: str, data: bytes):
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.post(f"{CRYPTO_URL}/cryptography/encrypt-sign", files={"file": (file_name, data)})
    if r.status_code != 200:
        raise HTTPException(500, "Crypto service error")
    return r.json()

# -------------------------------------------------------------------------
# M2.X - Retrieve Metadata by File Name (returns up to 5 latest uploads)
# -------------------------------------------------------------------------
from typing import Optional

@app.get("/api/file/meta-by-name")
async def get_file_metadata_by_name(file_name: str):
    """
    Retrieve up to 5 latest file metadata records for a given file_name.
    Searches local metadata files, sorts by timestamp descending, returns top 5.
    Returns: { files: [ { file_id, user_id, file_name, timestamp, ... } ] }
    """
    try:
        meta_dir = STORAGE_PATH
        meta_files = list(meta_dir.glob("*.meta.json"))
        matches = []
        for meta_path in meta_files:
            try:
                with open(meta_path, "r", encoding="utf-8") as f:
                    meta = json.load(f)
                if meta.get("file_name") == file_name:
                    # Extract file_id from filename
                    file_id = meta_path.stem.replace(".meta", "")
                    meta["file_id"] = file_id
                    matches.append(meta)
            except Exception as e:
                logger.warning(f"Failed to read or parse {meta_path}: {e}")
        # Sort by timestamp descending
        matches.sort(key=lambda m: m.get("timestamp", 0), reverse=True)
        # Return up to 5 latest
        latest = matches[:5]
        return {"files": latest}
    except Exception as e:
        logger.error(f"Error searching metadata by file name: {e}")
        raise HTTPException(status_code=500, detail=f"File search failed: {str(e)}")
    
# -------------------------------------------------------------------------
# M2.3 - Access Workflow Service (Blockchain-Backed per Spec 2.3)
# -------------------------------------------------------------------------


@app.post("/api/access/request")
async def request_access(request: dict):
    """
    Request access to a file - records on blockchain per specification 2.3
    For prototype: always uses stored TEST_RECIPIENT_PUBKEY for public_key.
    Also creates and saves a human-friendly metadata record for UI/audit.
    """
    file_id = request["file_id"]
    requester = request.get("requester", "")
    public_key = TEST_RECIPIENT_PUBKEY  # Always use stored key for prototype
    timestamp = time.time()
    approval_status = "pending"

    # Try to get file_name from local metadata if available
    file_name = None
    meta_path = STORAGE_PATH / f"{file_id}.meta.json"
    if meta_path.exists():
        try:
            with open(meta_path, "r", encoding="utf-8") as f:
                meta = json.load(f)
                file_name = meta.get("file_name")
        except Exception as e:
            logger.warning(f"Failed to load local metadata for {file_id}: {e}")

    # Compose access request metadata
    access_meta = {
        "transaction_type": "file_access_request",
        "user_id": requester,
        "file_id": file_id,
        "file_name": file_name,
        "timestamp": timestamp,
        "public_key": public_key,
        "approval_status": approval_status
    }

    # Save metadata to local file for UI/audit
    access_meta_path = STORAGE_PATH / f"{file_id}_access_{requester}.meta.json"
    try:
        with open(access_meta_path, "w", encoding="utf-8") as f:
            json.dump(access_meta, f, indent=2)
    except Exception as e:
        logger.warning(f"Failed to save access request metadata for {file_id}: {e}")

    try:
        if MOCK_BLOCKCHAIN:
            result = await mock_blockchain_record("access_request", file_id, SYSTEM_ADDRESS)
            logger.info(f"🎭 MOCK: Access request simulated for {file_id} by {SYSTEM_ADDRESS} (requester={requester})")
        else:
            result = await blockchain_integrator.request_file_access(file_id, SYSTEM_ADDRESS, public_key, access_meta)

        return {
            "message": "Access request recorded on blockchain",
            "status": "pending",
            "tx_hash": result.get("tx_hash"),
            "file_id": file_id,
            "requester": requester
        }
    except Exception as e:
        logger.error(f"Failed to record access request on blockchain: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to record access request: {str(e)}")
# -------------------------------------------------------------------------
# M2.6 - List Pending Access Requests (for Approvals Dashboard)
# -------------------------------------------------------------------------
from typing import List
@app.get("/api/access/pending")
async def get_pending_access_requests():
    """
    List all pending access requests by scanning local metadata files.
    Returns: { requests: [ { file_id, requester, request_id, ... } ] }
    """
    """
    Now fetches the latest 5 pending access requests from the blockchain API.
    Assumes the blockchain API provides an endpoint /api/blockchain/access-requests/pending
    that returns a list of pending requests with file_id, requester, and timestamp fields.
    """
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            res = await client.get(f"{BLOCKCHAIN_URL}/api/blockchain/access-requests/pending?limit=5")
        if res.status_code != 200:
            logger.error(f"Blockchain API error: {res.status_code} {res.text}")
            raise HTTPException(status_code=502, detail="Failed to fetch pending requests from blockchain API")
        data = res.json()
        # Blockchain API now returns a list, not a dict
        requests = []
        for r in data:
            file_id = r.get("file_id") or r.get("fileHash") or r.get("file_hash")
            requester = r.get("requester")
            if file_id and requester:
                request_id = f"{file_id}_{requester}"
                requests.append({"file_id": file_id, "requester": requester, "request_id": request_id})
        return {"requests": requests}
    except Exception as e:
        logger.error(f"Failed to fetch pending requests from blockchain API: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch pending requests from blockchain API")
# -------------------------------------------------------------------------
@app.post("/api/access/approve")
async def approve_access(request: dict):
    """
    Approve access request - records on blockchain per specification 2.3
    Preserves requester for records, but uses SYSTEM_ADDRESS for blockchain.
    Now fetches the requester's public key from the blockchain record (authoritative), not from the request body.
    Includes metadata for detailed event logging.
    """
    # 1. Extract request data
    file_id = request["file_id"]
    requester = request.get("requester", "")
    if not requester:
        logger.error("Missing requester in approval request")
        raise HTTPException(status_code=422, detail="Missing required field: requester")

    # Fetch the requester's public key from the blockchain record (authoritative)
    async with httpx.AsyncClient(timeout=30.0) as client:
        access_req_res = await client.get(f"{BLOCKCHAIN_URL}/api/blockchain/access-request/{file_id}/{requester}")
    if access_req_res.status_code != 200:
        logger.error(f"Access request not found on blockchain for file_id={file_id}, requester={requester}")
        raise HTTPException(status_code=404, detail="Access request not found on blockchain")

    access_req_json = access_req_res.json()
    logger.info(f"[DEBUG] Blockchain access-request response for file_id={file_id}, requester={requester}: {access_req_json}")
    requester_public_key = access_req_json.get("public_key")
    if not requester_public_key:
        logger.error(f"No public key found in blockchain access request record for file_id={file_id}, requester={requester}. Response: {access_req_json}")
        raise HTTPException(status_code=422, detail="No public key found in blockchain access request record")

    try:
        # 2. Retrieve the file encryption key (for demo, use a fixed key; in production, fetch the real key)
        file_encryption_key = b"example_AES_file_key_1234" # 32 bytes for AES-256

        # 3. Call the cryptography module to wrap the file key with the requester's public key from blockchain
        wrap_payload = {
            "keyB64": file_encryption_key.hex(),
            "recipientPubkeyPem": requester_public_key
        }
        async with httpx.AsyncClient(timeout=30.0) as client:
            wrap_res = await client.post(f"{CRYPTO_URL}/cryptography/wrap-key", json=wrap_payload)
        if wrap_res.status_code != 200:
            logger.error(f"Failed to wrap file key with public key for file_id={file_id}, requester={requester}")
            raise HTTPException(status_code=500, detail="Failed to wrap file key with public key")
        wrap_json = wrap_res.json()
        key_ref = json.dumps(wrap_json)

        # 4. Compose approval metadata
        approval_meta = {
            "transaction_type": "file_access_approval",
            "user_id": requester,
            "file_id": file_id,
            "timestamp": time.time(),
            "public_key": requester_public_key,
            "key_reference": key_ref
        }

        # 5. Record the approval on the blockchain (calls the blockchain API)
        if MOCK_BLOCKCHAIN:
            # If in mock mode, simulate the blockchain approval
            result = await mock_blockchain_record("access_approval", file_id, SYSTEM_ADDRESS, approval_meta)
            logger.info(f"🎭 MOCK: Access approval simulated for {file_id} -> {SYSTEM_ADDRESS} (requester={requester})")
        else:
            # Actually record the approval on the blockchain
            result = await blockchain_integrator.approve_file_access(file_id, SYSTEM_ADDRESS, key_ref, approval_meta)

        # 6. Return the result to the client
        return {
            "message": "Access approval recorded on blockchain",
            "status": "approved",
            "tx_hash": result.get("tx_hash"),
            "file_id": file_id,
            "requester": requester,
            "key_reference": key_ref
        }
    except Exception as e:
        # 7. Handle and log any errors
        logger.error(f"Failed to record access approval on blockchain: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to record access approval: {str(e)}")

# # -------------------------------------------------------------------------
# # M2.4 - Key-Sharing Service (Secure File Sharing, Blockchain-Integrated)
# # -------------------------------------------------------------------------
# @app.post("/api/key/share")
# async def share_key(request: dict):
#     """
#     Securely share the encryption key for an approved file access request.
#     Preserves requester for records, but uses SYSTEM_ADDRESS for blockchain.
#     """

#     file_id = request["file_id"]
#     requester = request.get("requester", "")

#     try:
#         has_access = await blockchain_integrator.get_client().has_access(file_id, SYSTEM_ADDRESS)
#         if not has_access:
#             raise HTTPException(
#                 status_code=403,
#                 detail="Access not approved. Request must be approved via blockchain first."
#             )

#         file_encryption_key = b"example_AES_file_key_1234"

#         pubkey_path = Path(f"./keys/{SYSTEM_ADDRESS}_pub.pem")
#         if not pubkey_path.exists():
#             raise HTTPException(status_code=404, detail=f"Public key for {SYSTEM_ADDRESS} not found")

#         with open(pubkey_path, "rb") as key_file:
#             public_key = serialization.load_pem_public_key(key_file.read())

#         encrypted_key = public_key.encrypt(
#             file_encryption_key,
#             padding.OAEP(
#                 mgf=padding.MGF1(algorithm=hashes.SHA256()),
#                 algorithm=hashes.SHA256(),
#                 label=None
#             )
#         )

#         blockchain_payload = {
#             "action": "KEY_SHARE",
#             "file_id": file_id,
#             "requester": SYSTEM_ADDRESS,
#             "timestamp": time.time(),
#         }
#         blockchain_res = await blockchain_integrator.record_key_share(file_id, SYSTEM_ADDRESS, blockchain_payload)

#         logger.info(f"Secure key shared for file: {file_id} -> {SYSTEM_ADDRESS} (requester={requester})")

#         return {
#             "file_id": file_id,
#             "requester": requester,
#             "encrypted_key": encrypted_key.hex(),
#             "tx_hash": blockchain_res.get("tx_hash"),
#             "status": "key_shared_securely"
#         }

#     except HTTPException:
#         raise
#     except Exception as e:
#         logger.error(f"Secure key sharing failed: {e}")
#         raise HTTPException(status_code=500, detail=f"Key sharing failed: {str(e)}")


# -------------------------------------------------------------------------
# Retrieve File Info (Real Blockchain Integration)
# -------------------------------------------------------------------------
@app.get("/api/blockchain/file/{file_id}")
async def get_file_info(file_id: str):
    """
    Retrieve file information from blockchain and verify its digital signature using Crypto service.
    If the signature is valid and access is approved, unwrap (decrypt) the AES key using recipient's private key.
    Uses SYSTEM_ADDRESS as user_address for blockchain access check.
    """
    try:
        # -----------------------------------------------------------
        # Retrieve file info from Blockchain microservice (real mode)
        # -----------------------------------------------------------
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(f"{BLOCKCHAIN_URL}/api/blockchain/file/{file_id}?user_address={SYSTEM_ADDRESS}")

        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail="Blockchain query failed")

        file_info = response.json()

        if not file_info.get("exists", False):
            raise HTTPException(status_code=404, detail="File not found on blockchain")


        # -----------------------------------------------------------
        # Access approved → unwrap AES key using Crypto microservice
        # -----------------------------------------------------------
        # Parse encrypted_key_ref JSON string to extract unwrap fields
        try:
            unwrap_fields = json.loads(file_info.get("encrypted_key_ref", "{}"))
        except Exception as e:
            logger.error(f"Failed to parse encrypted_key_ref: {e}")
            unwrap_fields = {}

        unwrap_payload = {
            "ephPubkeyPem": unwrap_fields.get("ephPubkeyPem", ""),
            "ivB64": unwrap_fields.get("ivB64", ""),
            "wrappedKeyB64": unwrap_fields.get("wrappedKeyB64", ""),
            "tagB64": unwrap_fields.get("tagB64", "")
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            unwrap_res = await client.post(f"{CRYPTO_URL}/cryptography/unwrap-key", json=unwrap_payload)

        if unwrap_res.status_code != 200:
            raise HTTPException(status_code=500, detail="Unwrap key failed")

        unwrap_data = unwrap_res.json()
        decrypted_key = unwrap_data.get("keyB64")

        logger.info(f"AES key successfully unwrapped for {file_id}")

        # -----------------------------------------------------------
        # Verify digital signature authenticity (Crypto microservice)
        # -----------------------------------------------------------
        verify_payload = {
            "hashB64": file_info.get("hashB64", ""),
            "signatureB64": file_info.get("digital_signature", ""),
            "pubkeyPem": file_info.get("owner_pubkey", "")
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            verify_res = await client.post(f"{CRYPTO_URL}/cryptography/verify-signature", json=verify_payload)

        if verify_res.status_code != 200:
            raise HTTPException(status_code=500, detail="Crypto verification failed")

        verify_json = verify_res.json()
        signature_valid = verify_json.get("valid", False)

        # -----------------------------------------------------------
        # If signature valid → return decrypted key, else warn
        # -----------------------------------------------------------
        if not signature_valid:
            logger.warning(f"Invalid signature for file {file_id}")
            return {
                "file_info": file_info,
                "verification_result": "invalid",
                "decrypted_file_key": decrypted_key,
                "message": "Signature invalid; file key unwrapped but not trusted"
            }

        logger.info(f"Signature verified for file {file_id}")

        return {
            "file_info": file_info,
            "verification_result": "valid",
            "decrypted_file_key": decrypted_key,
            "message": "Signature valid and AES key successfully unwrapped"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving file info for {file_id}: {e}")
        raise HTTPException(status_code=500, detail=f"File retrieval failed: {str(e)}")

# # -------------------------------------------------------------------------
# # M2.7 - File Retrieval with AES-GCM Decryption (Save to /data/decrypted)
# # -------------------------------------------------------------------------
# from cryptography.hazmat.primitives.ciphers.aead import AESGCM
# import base64

# @app.get("/api/blockchain/file/decrypt/{file_id}")
# async def decrypt_and_save_file(file_id: str):
#     """
#     Retrieve file info from blockchain, verify signature, unwrap AES key using Crypto,
#     decrypt the .enc file locally, and save the decrypted file to ./data/decrypted/.
#     """
#     try:
#         # -----------------------------
#         # Step 1: Retrieve file info from blockchain
#         # -----------------------------
#         async with httpx.AsyncClient(timeout=30.0) as client:
#             res = await client.get(f"{BLOCKCHAIN_URL}/api/blockchain/file/{file_id}")
#         if res.status_code != 200:
#             raise HTTPException(status_code=res.status_code, detail="Blockchain query failed")

#         file_info = res.json()
#         if not file_info.get("exists", False):
#             raise HTTPException(status_code=404, detail="File not found on blockchain")

#         # -----------------------------
#         # Step 2: Verify signature with Crypto service
#         # -----------------------------
#         verify_payload = {
#             "hashB64": file_info.get("hashB64", ""),
#             "signatureB64": file_info.get("digital_signature", ""),
#             "pubkeyPem": file_info.get("owner_pubkey", "")
#         }
#         async with httpx.AsyncClient(timeout=30.0) as client:
#             verify_res = await client.post(f"{CRYPTO_URL}/cryptography/verify-signature", json=verify_payload)

#         if verify_res.status_code != 200 or not verify_res.json().get("valid", False):
#             raise HTTPException(status_code=400, detail="Invalid digital signature")

#         # -----------------------------
#         # Step 3: Check blockchain access approval
#         # -----------------------------
#         async with httpx.AsyncClient(timeout=30.0) as client:
#             access_res = await client.get(f"{BLOCKCHAIN_URL}/api/blockchain/access-status/{file_id}")
#         if access_res.status_code != 200 or not access_res.json().get("approved", False):
#             raise HTTPException(status_code=403, detail="Access not approved for this file")

        

#         # -----------------------------
#         # Step 4: Unwrap AES key using Crypto microservice
#         # -----------------------------
#         unwrap_payload = {
#             "recipientPrivkeyPem": os.getenv("TEST_RECIPIENT_PRIVKEY", ""),
#             "ephPubkeyPem": file_info.get("eph_pubkey_pem", ""),
#             "ivB64": file_info.get("ivB64", ""),
#             "wrappedKeyB64": file_info.get("wrappedKeyB64", ""),
#             "tagB64": file_info.get("tagB64", "")
#         }
#         async with httpx.AsyncClient(timeout=30.0) as client:
#             unwrap_res = await client.post(f"{CRYPTO_URL}/cryptography/unwrap-key", json=unwrap_payload)

#         if unwrap_res.status_code != 200:
#             raise HTTPException(status_code=500, detail="Failed to unwrap AES key")

#         decrypted_key = base64.b64decode(unwrap_res.json().get("keyB64", ""))

#         # -----------------------------
#         # Step 5: Load encrypted file from local storage
#         # -----------------------------
#         enc_path = STORAGE_PATH / f"{file_id}.enc"
#         if not enc_path.exists():
#             raise HTTPException(status_code=404, detail="Encrypted file not found in storage")

#         with open(enc_path, "rb") as f:
#             ciphertext_b64 = f.read()
#         ciphertext = base64.b64decode(ciphertext_b64)

#         # -----------------------------
#         # Step 6: Decrypt file using AES-GCM
#         # -----------------------------
#         iv = base64.b64decode(file_info.get("ivB64", ""))
#         tag = base64.b64decode(file_info.get("tagB64", ""))
#         aesgcm = AESGCM(decrypted_key)
#         plaintext = aesgcm.decrypt(iv, ciphertext + tag, None)

#         # -----------------------------
#         # Step 7: Save decrypted file to /data/decrypted/
#         # -----------------------------
#         decrypted_dir = STORAGE_PATH / "decrypted"
#         decrypted_dir.mkdir(parents=True, exist_ok=True)

#         decrypted_path = decrypted_dir / f"{file_id}_decrypted.txt"
#         with open(decrypted_path, "wb") as f:
#             f.write(plaintext)

#         logger.info(f"Decrypted file saved to {decrypted_path}")

#         return {
#             "file_id": file_id,
#             "status": "success",
#             "message": f"Decrypted file saved to {decrypted_path}"
#         }

#     except HTTPException:
#         raise
#     except Exception as e:
#         logger.error(f"Decryption failed for {file_id}: {e}")
#         raise HTTPException(status_code=500, detail=f"Decryption failed: {str(e)}")

# -------------------------------------------------------------------------
# M2.5 - Local File Storage
# -------------------------------------------------------------------------
def save_encrypted_file(file_id: str, ciphertext: str, metadata: dict):
    enc_path = STORAGE_PATH / f"{file_id}.enc"
    meta_path = STORAGE_PATH / f"{file_id}.meta.json"
    with open(enc_path, "wb") as f:
        f.write(ciphertext.encode("utf-8"))
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

def verify_integrity(file_id: str, ciphertext: str):
    return hashlib.sha256(ciphertext.encode()).hexdigest()[:16] == file_id

# -------------------------------------------------------------------------

# -------------------------------------------------------------------------
# Minimal File Info Endpoint for Integration Test Polling
# -------------------------------------------------------------------------
@app.get("/api/file-info/{file_id}")
async def get_file_info_minimal_backend(file_id: str):
    """
    Retrieve minimal file info for a given file_id from the blockchain API (for integration test polling).
    Calls /api/blockchain/file-info/{file_id} on the blockchain API.
    """
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(f"{BLOCKCHAIN_URL}/api/blockchain/file-info/{file_id}")
        logger.info(f"[backend-file-info] file_id={file_id} status={response.status_code} response={response.text}")
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail="Blockchain query failed")
        file_info = response.json()
        if not file_info.get("exists", False):
            raise HTTPException(status_code=404, detail="File not found on blockchain")
        return file_info
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving minimal file info for {file_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Minimal file info retrieval failed: {str(e)}")
    
# -------------------------------------------------------------------------
# Health Check
# -------------------------------------------------------------------------
@app.get("/health")
def health():
    return {"status": "ok"}

# -------------------------------------------------------------------------
# M5.1 - Authentication and Authorization (JWT)
# -------------------------------------------------------------------------
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

@app.post("/api/auth/login")
def login(credentials: dict):
    """Demo login (username: alice, password: 1234)"""
    username = credentials.get("username")
    password = credentials.get("password")
    if username == "alice" and password == "1234":
        token = create_access_token({"sub": username})
        return {"access_token": token, "token_type": "bearer"}
    raise HTTPException(status_code=401, detail="Invalid credentials")

# -------------------------------------------------------------------------
# M2.X - File Metadata Retrieval Endpoint for Frontend
# -------------------------------------------------------------------------
@app.get("/api/file/meta/{file_id}")
async def get_file_metadata(file_name: str):
    """
    Retrieve file metadata for a given file_id from the blockchain API, normalizing the response for frontend consumption.
    Returns user_id, file_name, and completed transaction status (upload, access approval).
    """
    try:
        # Query blockchain API for file info
        async with httpx.AsyncClient(timeout=30.0) as client:
            # response = await client.get(f"{BLOCKCHAIN_URL}/api/blockchain/file-info/{file_id}")
            response = await client.get(f"{BLOCKCHAIN_URL}/api/blockchain/file-info-by-name/{file_name}")
        logger.info(f"[backend-file-meta] file_id={file_name} status={response.status_code} response={response.text}")
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail="Blockchain query failed")
        file_info = response.json()
        if not file_info.get("exists", False):
            raise HTTPException(status_code=404, detail="File not found on blockchain")

        # Try to load local metadata for user_id and file_name
        user_id = None
        file_name = None
        meta_path = STORAGE_PATH / f"{file_name}.meta.json"
        if meta_path.exists():
            try:
                with open(meta_path, "r", encoding="utf-8") as f:
                    meta = json.load(f)
                    user_id = meta.get("user_id")
                    file_name = meta.get("file_name")
            except Exception as e:
                logger.warning(f"Failed to load local metadata for {file_name}: {e}")

        # Completed transaction status
        completed_transactions = {
            "upload": file_info.get("exists", False),
            "access_approval": bool(file_info.get("encrypted_key_ref")),
        }

        # Return only essential fields for frontend
        return {
            "file_id": file_info.get("file_id", file_id),
            "user_id": user_id,
            "file_name": file_name,
            "completed_transactions": completed_transactions,
            "exists": file_info.get("exists", False)
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving file metadata for {file_id}: {e}")
        raise HTTPException(status_code=500, detail=f"File metadata retrieval failed: {str(e)}")

# Simple file upload endpoint for testing (no auth required)
@app.post("/files")
async def upload_file_simple(file: UploadFile = File(...)):
    """Simple file upload endpoint for testing"""
    try:
        data = await file.read()
        payload = await encrypt_and_sign(file.filename, data)
        ciphertext = payload["ciphertext"]
        fid = hashlib.sha256(ciphertext.encode()).hexdigest()[:16]

        if not verify_integrity(fid, ciphertext):
            raise HTTPException(status_code=400, detail="Integrity check failed")

        metadata = {
            "user_id": "demo_user",
            "hash": payload["hash"],
            "sig": payload["signature"],
            "timestamp": time.time(),
        }
        save_encrypted_file(fid, ciphertext, metadata)

        # Record file upload on blockchain (Spec 2.3 requirement)
        blockchain_metadata = {
            "transaction_type": "upload_file",
            "file_name": file.filename,
            "hash": payload["hash"],
            "timestamp": metadata["timestamp"],    
        }
        digital_signature = payload["signature"]["signatureB64"]
        blockchain_res = await blockchain_integrator.record_file_upload(fid, "demo_user", blockchain_metadata, digital_signature)
        tx_hash = blockchain_res.get("tx_hash")

        return {"file_id": fid, "tx_hash": tx_hash, "status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

    
# -------------------------------------------------------------------------
# M5.2 - Secrets Handling (Environment-based with simple TTL cache)
# -------------------------------------------------------------------------
TTL = 300  # cache in seconds
_cache, _expiry = {}, {}

def get_secret(key: str):
    now = time.time()
    if key in _cache and now < _expiry.get(key, 0):
        return _cache[key]
    value = os.getenv(key)
    if not value:
        raise KeyError(f"Missing secret: {key}")
    _cache[key] = value
    _expiry[key] = now + TTL
    return value