# TrustShare: Blockchain-Based Secure File Sharing System

A production-quality, secure cloud-based file storage and sharing ecosystem utilizing **AES-256-GCM** encryption, **ECDSA** digital signatures, and **Sepolia Ethereum Blockchain** transaction logging. 

Developed as an advanced cybersecurity and systems implementation project at the University of Wollongong, achieving a **29/30 evaluation** for implementation and security architecture.

### 🎯 Project Status: FULLY OPERATIONAL ✅
* **Blockchain Network:** Sepolia Testnet (Real transaction confirmation)
* **Integration Status:** Complete end-to-end operational flow verified (File upload -> Access request -> Approval -> Safe key-unwrap -> Verification)

---

## 🛠️ My Role & Core Contributions
As the **Backend & Security Architecture Developer**, I engineered the core operational pipelines ensuring absolute data integrity and secure multi-party marketplace logic:
* **Security Implementation:** Designed and deployed the cross-service data encryption pipeline using AES-GCM and ECDSA digital signatures, ensuring zero plaintext exposure over the network.
* **API Development:** Built scalable REST endpoints using FastAPI for the backend application and cryptographic microservice layers.
* **Blockchain Log Integration:** Developed the Web3 connection to parse transaction payloads (`encrypted_key_ref`) directly from Sepolia Smart Contracts.
* **Documentation & Governance:** Authored extensive cross-platform launch sequences, troubleshooting guides, and API specifications.

---

## 🏗️ System Architecture & Tech Stack

The platform is structured into separate microservices to maintain strict isolation of cryptographic keys and data flows:

| Layer / Component | Technology Used | Description |
| :--- | :--- | :--- |
| **Frontend UI** | Next.js 15, Turbopack, Tailwind CSS | High-volume client interface using modern App Router design. |
| **Backend Core** | FastAPI (Python) | Orchestrates workflows, handles storage path logic, and processes Web3 logs. |
| **Crypto Service** | FastAPI, Cryptography (Python) | Isolated service running AES-256-GCM, SHA-256 hashing, and ECDSA-secp256k1 keys. |
| **Blockchain Logic** | Hardhat, Solidity, Web3.py | Smart Contract (`FileRegistry.sol`) tracking access governance on Sepolia. |

### Component Breakdown
* **`frontend/`** → Next.js 15 client layout with reusable UI components built using shadcn/ui.
* **`backend/`** → FastAPI core managing encrypted file storage (`*.enc` data paths) and metadata.
* **`crypto/`** → Dedicated microservice executing key-wrapping and signature generation.
* **`blockchain/`** → Smart contracts, compilation artifacts, and deployment scripts utilizing the Hardhat framework.

---

## 🔧 Core API Endpoints Reference

### 1. Backend Core API (Port 8000)
* `GET /health` — Service connectivity confirmation.
* `POST /api/file/upload` — Secure, authenticated file upload resulting in file path encryption and a Sepolia logging transaction.
* `GET /api/file/meta/{file_id}` — Resolves immutable file metadata, cryptographic hashes, and digital signatures.
* `POST /api/access/request` — Generates a multi-party data access ticket.
* `POST /api/access/approve` — Grants approval and initiates secure data transmission procedures.

### 2. Isolated Cryptographic Microservice (Port 8101)
* `POST /cryptography/encrypt-sign` — Accepts data payloads and executes combined AES-256-GCM encryption + ECDSA DER-encoded signing.

---

## 🔑 Key Management & Configuration Setup

All cryptographic parameters and environment details are governed by localized `.env` variables to completely prevent security leaks.

### Environment Variable Blueprints

#### Backend Configurations (`backend/.env`)
```ini
CRYPTO_URL=http://localhost:8101
BLOCKCHAIN_API_URL=http://localhost:8545
STORAGE_PATH=./data
SECRET_KEY=your_jwt_secret
TEST_RECIPIENT_PUBKEY=-----BEGIN PUBLIC KEY-----...
