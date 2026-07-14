import requests
import time
import uuid
import os
import json

BASE_URL = "http://localhost:8545/api/blockchain"

file_id = f"test_file_{uuid.uuid4().hex[:8]}"
# Load owner address from deployments/sepolia.json
deploy_path = os.path.join(os.path.dirname(__file__), "..", "blockchain", "deployments", "sepolia.json")
with open(deploy_path) as f:
    deploy_info = json.load(f)
    owner_address = deploy_info.get("deployerAddress")


# 1. Upload File Metadata
def test_blockchain_upload():
    url = f"{BASE_URL}/upload"
    payload = {
        "file_id": file_id,
        "user_id": owner_address,  # Use owner_address for all
        "metadata": {"filename": "example.pdf", "timestamp": "2025-10-24T21:00:00Z"},
        "digital_signature": "test_signature_123"
    }
    response = requests.post(url, json=payload)
    assert response.status_code == 200
    data = response.json()
    print(data)
    assert data["status"] == "success"
    assert "tx_hash" in data

# 2. Request Access
def test_blockchain_request_access():
    url = f"{BASE_URL}/request-access"
    payload = {
        "file_id": file_id,
        "requester": owner_address,  # Use owner_address for all
        "public_key": "test_public_key_abc"
    }
    response = requests.post(url, json=payload)
    assert response.status_code == 200
    data = response.json()
    print(data)
    assert data["status"] == "success"
    assert "tx_hash" in data

# 3. Approve Access
def test_blockchain_approve_access():
    # Wait for the access request to be recorded
    wait_for_access_request(file_id, owner_address)
    url = f"{BASE_URL}/approve-access"
    payload = {
        "file_id": file_id,
        "requester": owner_address,  # Use owner_address for all
        "key_ref": "encrypted_key_ref_abc"
    }
    response = requests.post(url, json=payload)
    assert response.status_code == 200
    data = response.json()
    print(data)
    assert data["status"] == "success"
    assert "tx_hash" in data

def wait_for_file_info(file_id, timeout=90, interval=2):
    url = f"{BASE_URL}/file/{file_id}?user_address={owner_address}"
    start = time.time()
    while time.time() - start < timeout:
        response = requests.get(url)
        if response.status_code == 200:
            return True
        time.sleep(interval)
    raise TimeoutError("File info not found within timeout period.")

# 4. Get File Info
def test_blockchain_get_file_info():
    wait_for_file_info(file_id, timeout=30, interval=2)
    url = f"{BASE_URL}/file/{file_id}?user_address={owner_address}"
    response = requests.get(url)
    assert response.status_code == 200
    data = response.json()
    print(data)
    assert "owner" in data
    assert "metadata" in data
    assert "encrypted_key_ref" in data
    assert "digital_signature" in data
    assert "exists" in data

# 5. Check Access
def test_blockchain_check_access():
    # Use the new file info endpoint to check access (200 means access granted, 403 means denied)
    url = f"{BASE_URL}/file/{file_id}?user_address={owner_address}"
    response = requests.get(url)
    assert response.status_code == 200
    data = response.json()
    print(data)
    # If we get here, access is granted and file info is returned
    assert "owner" in data

def wait_for_access_request(file_id, owner_address, timeout=60, interval=2):
    # Poll the new file info endpoint: 200 means access granted, 403 means not yet approved
    url = f"{BASE_URL}/file/{file_id}?user_address={owner_address}"
    start = time.time()
    while time.time() - start < timeout:
        response = requests.get(url)
        if response.status_code == 200:
            return True
        elif response.status_code == 403:
            pass  # Not yet approved, keep polling
        elif response.status_code == 500:
            raise RuntimeError("Backend returned 500 error during access polling.")
        time.sleep(interval)
    raise TimeoutError("Access approval not found within timeout period.")



if __name__ == "__main__":
    test_blockchain_upload()
    test_blockchain_request_access()
    test_blockchain_approve_access()
    test_blockchain_get_file_info()
    test_blockchain_check_access()
