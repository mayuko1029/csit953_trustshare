"""
test_backend_api.py
Integration tests for TrustShare Backend API (app.py)
Covers: /api/file/upload, /api/access/request, /api/access/approve, /api/key/share, /api/file/meta/{file_id}, /health, /api/auth/login
Suitable for CI/GitHub Actions.
"""
import os
import tempfile
import base64
import pytest
from fastapi.testclient import TestClient
from app import app

client = TestClient(app)

# Test /health endpoint

def test_health():
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"

# Test /api/auth/login

def test_login():
    resp = client.post("/api/auth/login", json={"username": "alice", "password": "1234"})
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

# Test /api/file/upload

def test_file_upload():
    with tempfile.NamedTemporaryFile(delete=False) as tmp:
        tmp.write(b"TrustShare backend test file!")
        tmp.flush()
        tmp.seek(0)
        with open(tmp.name, "rb") as f:
            resp = client.post(
                "/api/file/upload",
                headers={"User-ID": "testuser"},
                files={"file": ("test.txt", f, "application/octet-stream")}
            )
    os.unlink(tmp.name)
    assert resp.status_code == 200
    data = resp.json()
    assert "file_id" in data
    assert "tx_hash" in data
    assert data["status"] == "success"
    return data["file_id"]

# Test /api/file/meta/{file_id}

def test_file_meta():
    file_id = test_file_upload()
    resp = client.get(f"/api/file/meta/{file_id}")
    assert resp.status_code == 200
    meta = resp.json()
    assert meta["user_id"] == "testuser"
    assert "hash" in meta
    assert "sig" in meta

# Test /api/access/request

def test_access_request():
    file_id = test_file_upload()
    payload = {"file_id": file_id, "requester": "requester1", "user_id": "requester1"}
    resp = client.post("/api/access/request", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "pending"
    assert data["file_id"] == file_id
    assert data["requester"] == "requester1"
    assert "tx_hash" in data

# Test /api/access/approve

def test_access_approve():
    file_id = test_file_upload()
    # Step 1: Request access first
    payload_request = {"file_id": file_id, "requester": "requester1", "public_key": os.getenv("TEST_RECIPIENT_PUBKEY") or "dummy"}
    resp_request = client.post("/api/access/request", json=payload_request)
    assert resp_request.status_code == 200

    # Step 2: Now approve access
    payload_approve = {"file_id": file_id, "requester": "requester1"}
    resp_approve = client.post("/api/access/approve", json=payload_approve)
    assert resp_approve.status_code == 200
    data = resp_approve.json()
    assert data["status"] == "approved"
    assert data["file_id"] == file_id
    assert data["requester"] == "requester1"
    assert "key_reference" in data
    assert "tx_hash" in data

# Test /files simple upload endpoint

def test_simple_file_upload():
    with tempfile.NamedTemporaryFile(delete=False) as tmp:
        tmp.write(b"Simple upload test!")
        tmp.flush()
        tmp.seek(0)
        with open(tmp.name, "rb") as f:
            resp = client.post(
                "/files",
                files={"file": ("simple.txt", f, "application/octet-stream")}
            )
    os.unlink(tmp.name)
    assert resp.status_code == 200
    data = resp.json()
    assert "file_id" in data
    assert "tx_hash" in data
    assert data["status"] == "success"

# Helper to get a bearer token
def get_auth_token():
    resp = client.post("/api/auth/login", json={"username": "alice", "password": "1234"})
    assert resp.status_code == 200
    return resp.json()["access_token"]

# Test /api/blockchain/file/{file_id}
def test_blockchain_file_info():
    file_id = test_file_upload()
    resp = client.get(f"/api/blockchain/file/{file_id}")
    assert resp.status_code == 200
    data = resp.json()
    # Check for new response structure: file_info, verification_result, decrypted_file_key, message
    assert "file_info" in data
    assert "verification_result" in data
    assert "message" in data
    assert "decrypted_file_key" in data
