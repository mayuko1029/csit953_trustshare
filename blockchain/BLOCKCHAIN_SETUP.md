# Blockchain Module Setup and Configuration

This guide explains how to configure and run the TrustShare blockchain module (smart contract + blockchain API). Share this with your teammates so everyone can deploy, configure, and run the blockchain service reliably.

## 1. Overview
- The blockchain module contains:
  - Smart contracts in `contracts/` (main contract: `FileRegistry.sol`)
  - Hardhat config and tasks for deployment and manual actions
  - A standalone FastAPI-based blockchain API (`blockchain_api.py`) that wraps Web3 interactions
  - Deployment scripts in `scripts/` (e.g., `deploy.js`)

## 2. Required Tools
- Node.js 18+ and npm
- Hardhat (installed via npm devDependencies)
- Python 3.12+ (for the `blockchain_api.py` service)
- `web3.py` (for Python interaction)

## 3. Environment Variables (`.env`)
Copy `blockchain/.env.example` to `blockchain/.env` and update the values before running the blockchain service.

Example `.env` keys and purpose:

- `BLOCKCHAIN_URL` - RPC endpoint. Example: `https://sepolia.infura.io/v3/<INFURA_KEY>`
- `BLOCKCHAIN_NETWORK` - Network name (`sepolia`, `goerli`, `mumbai`, etc.)
- `CONTRACT_ADDRESS` - Deployed FileRegistry contract address
- `BLOCKCHAIN_PRIVATE_KEY` - Private key of the deployer/account used to sign transactions (use test keys only)
- `BLOCKCHAIN_API_PORT` - Port for the blockchain API (default 8545)
- `BLOCKCHAIN_API_URL` - Full URL for the API (default `http://localhost:8545`)
- `ALLOWED_ORIGINS` - CORS origins for backend and frontend (comma-separated)
- `GAS_LIMIT_MULTIPLIER` - Multiplier used to pad gas estimates (default `1.2`)
- `TRANSACTION_TIMEOUT` - Timeout (seconds) for transaction confirmation (default `120`)
- `ENABLE_SIMULATION` - When `true`, the service will simulate responses if the network or contract isn't available (useful for local dev)

## 4. Deploying the Contract (one-time)

1. Install dependencies and compile the contracts:

```bash
cd blockchain
npm install
npx hardhat compile
```

2. Deploy to a testnet (Sepolia example):

```bash
# Ensure blockchain/.env has INFURA_API_KEY and PRIVATE_KEY set
npx hardhat run scripts/deploy.js --network sepolia
```

3. After successful deployment, update `CONTRACT_ADDRESS` in `blockchain/.env` with the returned address.

## 5. Running the Blockchain API Service

The blockchain API provides REST endpoints that the backend uses to interact with the contract. It uses `web3.py` under the hood.

1. Create a Python virtual environment (if not already):

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
pip install web3
```

2. Start the blockchain API (uses backend `.venv` by convention):

```powershell
cd ..\blockchain
# ensure backend/.venv is created and activated or reference its python.exe
..\backend\.venv\Scripts\python.exe -m uvicorn blockchain_api:app --host 0.0.0.0 --port 8545 --reload
```

3. Health-check endpoint:

```
GET http://localhost:8545/health
```

## 6. Integration with Backend
- Update `backend/.env` to include the `CONTRACT_ADDRESS` and `BLOCKCHAIN_API_URL` if you're using the blockchain API service.
- The backend will call the blockchain API endpoints (or call web3 directly if configured) to perform actions like `upload`, `requestAccess`, `approveAccess`.

## 7. CI/CD Notes
- Keep `package-lock.json` in sync with `package.json` for reproducible builds.
- For GitHub Actions using `npm ci`, ensure `package-lock.json` matches any package updates (run `npm install` locally and commit `package-lock.json`).

## 8. Troubleshooting
- Parser/compilation errors in contracts: Open `contracts/FileRegistry.sol`, check for missing braces or mismatched Solidity version in `hardhat.config.js`.
- RPC/connectivity errors: Verify `BLOCKCHAIN_URL` and network reachability.
- Insufficient funds during deployment: Ensure the deployer account has testnet ETH.
- Private keys: Never commit real private keys. Use `.env` and add it to `.gitignore`.

## 9. Quick Checklist for Teammates
- [ ] Install Node.js and Python
- [ ] Copy `.env.example` → `.env` and fill values
- [ ] Compile contracts: `npx hardhat compile`
- [ ] Deploy contract (one-time): `npx hardhat run scripts/deploy.js --network sepolia`
- [ ] Start blockchain API: `..\backend\.venv\Scripts\python.exe -m uvicorn blockchain_api:app --host 0.0.0.0 --port 8545 --reload`
- [ ] Update `backend/.env` with `CONTRACT_ADDRESS` and `BLOCKCHAIN_API_URL`

---

If you'd like, I can also:
- Add a small script to `blockchain/` to automate `.env` creation from `.env.example` (safe defaults)
- Add a `post-deploy` script to automatically update `backend/.env` with the new contract address
- Run a local deployment (hardhat node) and deploy contract for you to test

What's next? Do you want the post-deploy automation and a helper script added now?