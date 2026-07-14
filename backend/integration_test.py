

import os
import time
import pytest
import requests
from dotenv import load_dotenv

load_dotenv()
BACKEND_URL = "http://localhost:8000"
USER_ID = os.getenv("DEPLOYER_ADDRESS") or os.getenv("SYSTEM_ADDRESS")
assert USER_ID, "DEPLOYER_ADDRESS or SYSTEM_ADDRESS must be set in .env"
TEST_RECIPIENT_PUBKEY = os.getenv("TEST_RECIPIENT_PUBKEY")
assert TEST_RECIPIENT_PUBKEY, "TEST_RECIPIENT_PUBKEY must be set in .env (PEM format)"
TEST_FILE_NAME = "integration_test_file.txt"
TEST_FILE_CONTENT = b"This is a test file for integration testing."

# def wait_for_service(url, timeout=30):
#     start = time.time()
#     while time.time() - start < timeout:
#         try:
#             r = requests.get(url)
#             if r.status_code == 200:
#                 return True
#         except Exception:
#             pass
#         time.sleep(1)
#     raise RuntimeError(f"Service at {url} did not become ready in {timeout} seconds.")

# def wait_for_file_info(file_id, timeout=60, interval=2):
#     start = time.time()
#     while time.time() - start < timeout:
#         # Poll the backend's /api/file/info/{file_id} endpoint (GET) to check if file info is available
#         r = requests.get(f"{BACKEND_URL}/api/file-info/{file_id}")
#         if r.status_code == 200:
#             data = r.json()
#             # Accept the new minimal file info format: must have file_id and exists==True
#             if data.get("file_id") == file_id and data.get("exists"):
#                 return r
#         time.sleep(interval)
#     raise TimeoutError(f"File info for {file_id} not available after {timeout} seconds")

# def wait_for_access_request(file_id, timeout=30, interval=2):
#     start = time.time()
#     while time.time() - start < timeout:
#         # Poll the backend's /api/access/request endpoint (POST with same payload as original request)
#         files = {"file": (TEST_FILE_NAME, TEST_FILE_CONTENT)}
#         headers = {"User-ID": USER_ID}
#         r = requests.post(f"{BACKEND_URL}/api/file/upload", files=files, headers=headers)
#         if r.status_code == 200:
#             data = r.json()
#             if data.get("status") == "pending":
#                 return r
#         time.sleep(interval)
#     raise TimeoutError(f"Access request for {file_id} not available after {timeout} seconds")

# def wait_for_access_approval(file_id, timeout=30, interval=2):
#     start = time.time()
#     while time.time() - start < timeout:
#         # Poll the backend's /api/file/info endpoint (assuming this exists)
#         payload = {"file_id": file_id, "requester": USER_ID, "public_key": TEST_RECIPIENT_PUBKEY}
#         r = requests.post(f"{BACKEND_URL}/api/access/request", json=payload)
#         if r.status_code == 200:
#             data = r.json()
#             info = data.get("file_info") or data.get("verification_result")
#             if info and info.get("status") == "approved":
#                 return r
#         time.sleep(interval)
#     raise TimeoutError(f"Access approval for {file_id} not visible after {timeout} seconds")

def test_full_integration_workflow():
    # 1. Upload file
    files = {"file": (TEST_FILE_NAME, TEST_FILE_CONTENT)}
    headers = {"User-ID": USER_ID}
    r = requests.post(f"{BACKEND_URL}/api/file/upload", files=files, headers=headers)
    assert r.status_code == 200, f"Upload failed: {r.text}"
    data = r.json()
    assert "file_id" in data and "tx_hash" in data, f"Missing file_id or tx_hash: {data}"
    file_id = data["file_id"]
    print(f"File uploaded: {data}")
    time.sleep(2)

    # # 2. Get file info immediately after upload (before access request)
    # r = requests.get(f"{BACKEND_URL}/api/file-info/{file_id}")
    # assert r.status_code == 200, f"File info failed: {r.text}"
    # data = r.json()
    # assert data.get("file_id") == file_id and data.get("exists"), f"Unexpected response: {data}"
    # print(f"File info after upload (before access request): {data}")
    # time.sleep(2)

    # 3. Request access
    payload = {"file_id": file_id, "requester": USER_ID, "public_key": TEST_RECIPIENT_PUBKEY}
    r = requests.post(f"{BACKEND_URL}/api/access/request", json=payload)
    assert r.status_code == 200, f"Access request failed: {r.text}"
    data = r.json()
    assert data.get("status") == "pending", f"Unexpected status: {data}"
    print(f"Access requested: {data}")
    time.sleep(2)

    # 4. Approve access
    payload = {"file_id": file_id, "requester": USER_ID}
    r = requests.post(f"{BACKEND_URL}/api/access/approve", json=payload)
    assert r.status_code == 200, f"Access approve failed: {r.text}"
    data = r.json()
    assert data.get("status") == "approved", f"Unexpected status: {data}"
    print(f"Access approved: {data}")
    time.sleep(10)

    # 5. Get file info after approval (with key unwrap and signature verification)
    r = requests.get(f"{BACKEND_URL}/api/blockchain/file/{file_id}")
    assert r.status_code == 200, f"File info after approve failed: {r.text}"
    data = r.json()
    assert "file_info" in data and "verification_result" in data, f"Unexpected response: {data}"
    print(f"File info after approve: {data}")

    
