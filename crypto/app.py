# app.py
# -----------------------------------------------------------------------------
# TrustShare Crypto Service – Final Sprint (Integrated Version)
#
# Endpoints:
#   POST /cryptography/encrypt-sign       (multipart/form-data: file)
#   POST /cryptography/verify-signature   (verify authenticity & integrity)
#   POST /cryptography/decrypt            (AES-256-GCM decryption)
#   GET  /cryptography/generate-aes-key   (helper for testing)
#   POST /cryptography/wrap-key           (ECIES wrap file key)
#   POST /cryptography/unwrap-key         (ECIES unwrap file key)
#
# Description:
#   Core cryptographic microservice for TrustShare. It provides:
#     • AES-256-GCM encryption (confidentiality + integrity tag)
#     • SHA-256 hashing of ciphertext (stable integrity reference)
#     • ECDSA(secp256k1) signing & verification (authenticity / non-repudiation)
#     • AES-256-GCM decryption endpoint for file download path
#     • ECIES(secp256k1+AES-GCM) key wrap/unwrap for secure key sharing
#
# Notes:
#   • All binary payloads are Base64 in JSON.
#   • A fresh AES-256 key is generated per request unless AES_KEY is set (dev only).
#   • Public keys are PEM (SubjectPublicKeyInfo). Curve is fixed to secp256k1.
#
# Run locally:
#   uvicorn app:app --reload --port 8101
# -----------------------------------------------------------------------------


from fastapi import FastAPI, UploadFile, File, HTTPException
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from cryptography.exceptions import InvalidTag
import os
import base64
import hashlib

app = FastAPI(title="TrustShare Crypto")

# -----------------------------------------------------------------------------
# Key material for ECDSA (demo only):
# In production you would load from a KMS/HSM or a secure keystore.
# We use the secp256k1 curve (common in Bitcoin/Ethereum ecosystems).
# -----------------------------------------------------------------------------
CURVE_NAME = os.getenv("ECDSA_CURVE", "secp256k1").lower()
if CURVE_NAME not in {"secp256k1"}:
    # Keep strict for team consistency — adjust only if your team decides otherwise.
    raise RuntimeError("ECDSA_CURVE must be secp256k1")

_priv = ec.generate_private_key(ec.SECP256K1())
_pub = _priv.public_key()

# -----------------------------------------------------------------------------
# Helper: get AES-256 key
# DEV ONLY: If AES_KEY env is set, use it (either raw 32-byte string or base64-32).
# Otherwise generate a fresh random key per request (recommended).
# -----------------------------------------------------------------------------
def get_aes256_key() -> bytes:
    override = os.getenv("AES_KEY", "")
    if not override:
        return AESGCM.generate_key(bit_length=256)  # 32 random bytes

    # If an override is present, accept either:
    #  - 32 raw bytes (len==32)
    #  - base64 string that decodes to 32 bytes
    try:
        if len(override) == 32:
            return override.encode("utf-8")
        decoded = base64.b64decode(override)
        if len(decoded) != 32:
            raise ValueError("Decoded AES_KEY is not 32 bytes")
        return decoded
    except Exception as e:
        raise RuntimeError(f"Invalid AES_KEY override: {e}")

# -----------------------------------------------------------------------------
# Endpoint: /cryptography/encrypt-sign
# Input  : multipart/form-data with a 'file' field
# Output : JSON with { enc:{alg, ivB64, ciphertextB64, tagB64}, hash:{...},
#                      signature:{alg, encoding, signatureB64}, pubkeyPem }
# -----------------------------------------------------------------------------
@app.post("/cryptography/encrypt-sign")
async def encrypt_sign(file: UploadFile = File(...)):
    try:
        # 1) Read uploaded file bytes
        data = await file.read()
        if data is None or len(data) == 0:
            raise HTTPException(status_code=400, detail="Empty file")

        # 2) Symmetric encryption with AES-256-GCM (Week 5 concept)
        #    - 12-byte IV is recommended for GCM
        key = get_aes256_key()
        aes = AESGCM(key)
        iv = os.urandom(12)
        ct_with_tag = aes.encrypt(iv, data, None)  # returns ciphertext || tag
        tag = ct_with_tag[-16:]                    # last 16 bytes are the tag
        ciphertext = ct_with_tag[:-16]

        # 3) Hash the ciphertext with SHA-256 (stable reference for storage/chain)
        #    This aligns with "integrity check values" from lecture (hash/MAC). [Week 5]
        digest = hashlib.sha256(ciphertext).digest()

        # 4) ECDSA signature over the hash (authenticity / non-repudiation) [Week 3]
        signature_der = _priv.sign(digest, ec.ECDSA(hashes.SHA256()))

        # 5) Return base64-encoded fields for safe JSON transport
        return {
            "enc": {
                "alg": "AES-256-GCM",
                "ivB64": base64.b64encode(iv).decode(),
                "ciphertextB64": base64.b64encode(ciphertext).decode(),
                "tagB64": base64.b64encode(tag).decode(),
            },
            "ciphertext": base64.b64encode(ciphertext).decode(),
            "hash": {
                "alg": "SHA-256",
                "valueB64": base64.b64encode(digest).decode(),
            },
            "signature": {
                "alg": "ECDSA-secp256k1",
                "encoding": "DER",
                "signatureB64": base64.b64encode(signature_der).decode(),
            },
            "pubkeyPem": _pub.public_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PublicFormat.SubjectPublicKeyInfo,
            ).decode(),
        }

    except HTTPException:
        # rethrow known input errors
        raise
    except Exception as e:
        # predictable error schema makes backend/FE easier to handle
        raise HTTPException(
            status_code=500,
            detail={"code": "CRYPTO_ERROR", "message": str(e)},
        )
        
# --- helpers for key wrapping ---
def _b64e(b: bytes) -> str:
    return base64.b64encode(b).decode()

def _b64d(s: str) -> bytes:
    return base64.b64decode(s)

def _derive_ecdh_key(priv: ec.EllipticCurvePrivateKey, pub: ec.EllipticCurvePublicKey) -> bytes:
    # ECDH shared secret -> HKDF-SHA256 derive 32B content-encryption key
    shared = priv.exchange(ec.ECDH(), pub)
    hkdf = HKDF(algorithm=hashes.SHA256(), length=32, salt=None, info=b"trustshare-ecies")
    return hkdf.derive(shared)

@app.get("/cryptography/generate-aes-key")
def generate_aes_key():
    """Return a fresh 32-byte AES key (base64) for file encryption."""
    key = AESGCM.generate_key(bit_length=256)
    return {"keyB64": _b64e(key)}

@app.post("/cryptography/wrap-key")
async def wrap_key(payload: dict):
    """
    Owner-side: encrypt (wrap) a 32-byte file AES key using recipient's EC public key (secp256k1).
    JSON in:  { "keyB64": "...", "recipientPubkeyPem": "-----BEGIN PUBLIC KEY-----..."}
    JSON out: { "alg":"ECIES-secp256k1+AES-256-GCM", "ephPubkeyPem": "...", "ivB64": "...",
                "wrappedKeyB64": "...", "tagB64": "..." }
    """
    try:
        key_b64 = payload.get("keyB64")
        recip_pem = payload.get("recipientPubkeyPem")
        if not key_b64 or not recip_pem:
            raise HTTPException(400, "keyB64 and recipientPubkeyPem are required")

        file_key = _b64d(key_b64)
        if len(file_key) != 32:
            raise HTTPException(400, "keyB64 must decode to 32 bytes (AES-256 key)")

        recipient_pub = serialization.load_pem_public_key(recip_pem.encode())
        if not isinstance(recipient_pub, ec.EllipticCurvePublicKey):
            raise HTTPException(400, "recipientPubkeyPem must be an EC public key (secp256k1)")

        # ephemeral sender keypair for ECDH
        eph_priv = ec.generate_private_key(ec.SECP256K1())
        eph_pub = eph_priv.public_key()
        cek = _derive_ecdh_key(eph_priv, recipient_pub)

        aes = AESGCM(cek)
        iv = os.urandom(12)
        ct = aes.encrypt(iv, file_key, None)  # ciphertext||tag
        tag, wrapped = ct[-16:], ct[:-16]

        return {
            "alg": "ECIES-secp256k1+AES-256-GCM",
            "ephPubkeyPem": eph_pub.public_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PublicFormat.SubjectPublicKeyInfo,
            ).decode(),
            "ivB64": _b64e(iv),
            "wrappedKeyB64": _b64e(wrapped),
            "tagB64": _b64e(tag),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, {"code": "WRAP_ERROR", "message": str(e)})

@app.post("/cryptography/unwrap-key")
async def unwrap_key(payload: dict):
    """
    Requester-side: decrypt (unwrap) the wrapped AES key using recipient private key.
    JSON in:  { "recipientPrivkeyPem": "...",
                "ephPubkeyPem": "...",
                "ivB64": "...", "wrappedKeyB64": "...", "tagB64": "..." }
    JSON out: { "keyB64": "..." }
    NOTE: for prototype/testing only — real systems should unwrap on client.
    """
    try:
        priv_pem = payload.get("recipientPrivkeyPem")
        eph_pem = payload.get("ephPubkeyPem")
        iv = _b64d(payload.get("ivB64", ""))
        wrapped = _b64d(payload.get("wrappedKeyB64", ""))
        tag = _b64d(payload.get("tagB64", ""))

        if not all([priv_pem, eph_pem]) or len(iv) != 12 or len(tag) != 16:
            raise HTTPException(400, "invalid input fields")

        recip_priv = serialization.load_pem_private_key(priv_pem.encode(), password=None)
        eph_pub = serialization.load_pem_public_key(eph_pem.encode())
        if not (isinstance(recip_priv, ec.EllipticCurvePrivateKey) and isinstance(eph_pub, ec.EllipticCurvePublicKey)):
            raise HTTPException(400, "PEM keys must be EC (secp256k1)")

        cek = _derive_ecdh_key(recip_priv, eph_pub)
        aes = AESGCM(cek)
        file_key = aes.decrypt(iv, wrapped + tag, None)
        return {"keyB64": _b64e(file_key)}
    except InvalidTag:
        raise HTTPException(400, "unwrap failed: invalid tag or wrong keys")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, {"code": "UNWRAP_ERROR", "message": str(e)})
    
# ----------------------------------------------------------------------------- 
# Digital Signature Verification Endpoint
# -----------------------------------------------------------------------------
from cryptography.exceptions import InvalidSignature

@app.post("/cryptography/verify-signature")
def verify_signature(payload: dict):
    """
    Verify a digital signature given public key, hash and signature.

    JSON Input:
      {
        "pubkeyPem": "-----BEGIN PUBLIC KEY-----...",
        "hashB64": "<base64 encoded SHA256 digest>",
        "signatureB64": "<base64 encoded DER signature>"
      }

    Output:
      { "valid": true } or { "valid": false, "error": "..." }
    """
    try:
        pubkey_pem = payload.get("pubkeyPem")
        hash_b64 = payload.get("hashB64")
        signature_b64 = payload.get("signatureB64")

        if not all([pubkey_pem, hash_b64, signature_b64]):
            raise HTTPException(status_code=400, detail="Missing required fields")

        # Load public key
        pubkey = serialization.load_pem_public_key(pubkey_pem.encode())
        if not isinstance(pubkey, ec.EllipticCurvePublicKey):
            raise HTTPException(status_code=400, detail="Invalid public key format")

        # Decode and verify
        digest = base64.b64decode(hash_b64)
        signature = base64.b64decode(signature_b64)
        pubkey.verify(signature, digest, ec.ECDSA(hashes.SHA256()))

        return {"valid": True}

    except InvalidSignature:
        return {"valid": False, "error": "Invalid signature"}
    except Exception as e:
        raise HTTPException(status_code=500, detail={"code": "VERIFY_ERROR", "message": str(e)})
# ----------------------------------------------------------------------------- 
# AES-256-GCM Decryption Endpoint (for download path)
# -----------------------------------------------------------------------------
@app.post("/cryptography/decrypt")
def decrypt(payload: dict):
    """
    Decrypt a ciphertext produced by AES-256-GCM.

    JSON Input:
      {
        "keyB64": "<base64 AES-256 key (32 bytes)>",
        "ivB64": "<base64 IV (12 bytes)>",
        "ciphertextB64": "<base64 ciphertext (no tag)>",
        "tagB64": "<base64 GCM tag (16 bytes)>"
      }

    Output:
      {
        "plaintextB64": "<base64 plaintext bytes>"
      }
    """
    try:
        key_b64 = payload.get("keyB64")
        iv_b64 = payload.get("ivB64")
        ct_b64 = payload.get("ciphertextB64")
        tag_b64 = payload.get("tagB64")

        if not all([key_b64, iv_b64, ct_b64, tag_b64]):
            raise HTTPException(status_code=400, detail="Missing required fields")

        key = _b64d(key_b64)
        iv = _b64d(iv_b64)
        ct = _b64d(ct_b64)
        tag = _b64d(tag_b64)

        if len(key) != 32:
            raise HTTPException(status_code=400, detail="key must be 32 bytes (AES-256)")
        if len(iv) != 12:
            raise HTTPException(status_code=400, detail="iv must be 12 bytes for GCM")
        if len(tag) != 16:
            raise HTTPException(status_code=400, detail="tag must be 16 bytes for GCM")

        aes = AESGCM(key)
        # AESGCM.decrypt expects ciphertext||tag
        plaintext = aes.decrypt(iv, ct + tag, None)

        return {"plaintextB64": _b64e(plaintext)}

    except InvalidTag:
        # Wrong key/iv/tag/ciphertext → authentication failed
        raise HTTPException(status_code=400, detail="Decryption failed: invalid tag or wrong key/iv")
    except Exception as e:
        raise HTTPException(status_code=500, detail={"code": "DECRYPT_ERROR", "message": str(e)})
