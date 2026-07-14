# Architecture Overview

This project follows a modular mono-repo layout that mirrors the Function Points (M1–M5).

```mermaid
flowchart LR
  A[Frontend (M1)] --> B[Backend API (M2)]
  B --> C[Crypto Service (M3)]
  B --> D[(Storage Adapters) (M5)]
  B --> E[[Blockchain: FileRegistry]] (M4)
  E -->|events/receipts| B
```

## Modules

- **M1 Frontend**: Upload wizard, file list, access workflow UI.
- **M2 Backend**: Orchestrates encryption/signature, storage I/O, and blockchain logging.
- **M3 Crypto**: AES-GCM encryption and ECDSA signatures (demo service).
- **M4 Blockchain**: Solidity contracts and client-side tools (Hardhat).
- **M5 Storage**: Abstractions for local/Drive/OneDrive (planned).

## Data Flow (Happy Path)
1. Client uploads file to Backend.
2. Backend calls Crypto to encrypt & sign.
3. Backend persists encrypted blob via Storage adapter.
4. Backend logs upload event to Blockchain (optional in demo).
5. Backend returns `{id, hash, sig, tx?}` to client.
