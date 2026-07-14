"""
test_crypto.py
Unit and integration tests for TrustShare Crypto Service (app.py)
Suitable for CI/GitHub Actions.
"""
import os
import base64
import tempfile
import pytest
from fastapi.testclient import TestClient
from app import app

client = TestClient(app)

def test_encrypt_sign_basic():
    # Test: /cryptography/encrypt-sign (file encryption & signing)
    # Test: /cryptography/verify-signature (signature verification)
    # Create a temporary file with sample data
    with tempfile.NamedTemporaryFile(delete=False) as tmp:
        tmp.write(b"Hello TrustShare!")
        tmp.flush()
        tmp.seek(0)
        with open(tmp.name, "rb") as f:
            response = client.post(
                "/cryptography/encrypt-sign",
                files={"file": ("test.txt", f, "application/octet-stream")}
            )
    os.unlink(tmp.name)
    assert response.status_code == 200
    data = response.json()
    assert "enc" in data
    assert data["enc"]["alg"] == "AES-256-GCM"
    assert "ciphertextB64" in data["enc"]
    assert "hash" in data
    assert data["hash"]["alg"] == "SHA-256"
    assert "signature" in data
    assert data["signature"]["alg"] == "ECDSA-secp256k1"
    assert "pubkeyPem" in data

    # Verify signature endpoint
    verify_payload = {
        "hashB64": data["hash"]["valueB64"],
        "signatureB64": data["signature"]["signatureB64"],
        "pubkeyPem": data["pubkeyPem"]
    }
    verify_resp = client.post("/cryptography/verify-signature", json=verify_payload)
    assert verify_resp.status_code == 200
    verify_data = verify_resp.json()
    assert verify_data["valid"] is True


def test_generate_aes_key():
    # Test: /cryptography/generate-aes-key (AES key generation)
    resp = client.get("/cryptography/generate-aes-key")
    assert resp.status_code == 200
    key_b64 = resp.json()["keyB64"]
    key = base64.b64decode(key_b64)
    assert len(key) == 32


def test_wrap_unwrap_key():
    # Test: /cryptography/wrap-key (AES key wrapping)
    # Test: /cryptography/unwrap-key (AES key unwrapping)
    # Generate AES key
    key_resp = client.get("/cryptography/generate-aes-key")
    key_b64 = key_resp.json()["keyB64"]
    # Generate EC keypair for recipient
    from cryptography.hazmat.primitives.asymmetric import ec
    from cryptography.hazmat.primitives import serialization
    priv = ec.generate_private_key(ec.SECP256K1())
    pub = priv.public_key()
    priv_pem = priv.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()
    ).decode()
    pub_pem = pub.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    ).decode()
    # Wrap key
    wrap_payload = {"keyB64": key_b64, "recipientPubkeyPem": pub_pem}
    wrap_resp = client.post("/cryptography/wrap-key", json=wrap_payload)
    assert wrap_resp.status_code == 200
    wrap_data = wrap_resp.json()
    # Unwrap key
    unwrap_payload = {
        "recipientPrivkeyPem": priv_pem,
        "ephPubkeyPem": wrap_data["ephPubkeyPem"],
        "ivB64": wrap_data["ivB64"],
        "wrappedKeyB64": wrap_data["wrappedKeyB64"],
        "tagB64": wrap_data["tagB64"]
    }
    unwrap_resp = client.post("/cryptography/unwrap-key", json=unwrap_payload)
    assert unwrap_resp.status_code == 200
    unwrap_data = unwrap_resp.json()
    # The unwrapped key should match the original
    assert unwrap_data["keyB64"] == key_b64
