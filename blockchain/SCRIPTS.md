# 📋 Blockchain Module Scripts Documentation

## 🎯 **OVERVIEW**
This document explains every script, file, and command in the TrustShare blockchain module.

## 📦 **NPM SCRIPTS (package.json)**

### **🏗️ LOCAL DEVELOPMENT**

#### `npm run node`
```bash
hardhat node
```
**PURPOSE**: Start local Ethereum blockchain for development
- **Port**: 8545 (same as your backend BLOCKCHAIN_URL)
- **Accounts**: Creates 20 test accounts with 10,000 ETH each
- **Chain ID**: 31337 (Hardhat default)
- **Usage**: Backend connects to this during development
- **When to use**: Always run this before testing your system locally

#### `npm run compile`
```bash
hardhat compile
```
**PURPOSE**: Compile Solidity smart contracts to bytecode + ABI
- **Input**: `contracts/*.sol` files
- **Output**: `artifacts/` directory with compiled contracts
- **Required**: Must run before deployment or testing
- **When to use**: After modifying contract code

#### `npm run test`
```bash
hardhat test
```
**PURPOSE**: Run comprehensive smart contract test suite
- **Test files**: `test/*.js` files
- **Framework**: Mocha + Chai for assertions
- **Network**: Automatically starts local Hardhat network
- **Coverage**: Tests all contract functions and edge cases
- **When to use**: Before deployment to ensure contract correctness

### **🔍 CODE QUALITY**

#### `npm run lint`
```bash
npx solhint 'contracts/**/*.sol'
```
**PURPOSE**: Analyze Solidity code for best practices and security
- **Checks**: Security vulnerabilities, gas optimization, style
- **Rules**: Industry-standard Solidity coding practices
- **Output**: Warnings and errors with suggestions
- **When to use**: Before deployment to ensure code quality

#### `npm run ci`
```bash
npm run compile && npm test
```
**PURPOSE**: Continuous Integration pipeline
- **Steps**: Compile → Test in sequence
- **Usage**: Automated testing in CI/CD systems
- **When to use**: Before merging code changes

### **🚀 DEPLOYMENT SCRIPTS**

#### `npm run deploy:local`
```bash
hardhat run scripts/deploy.js --network localhost
```
**PURPOSE**: Deploy contract to local Hardhat network
- **Network**: localhost (port 8545)
- **Cost**: Free (test ETH)
- **When to use**: Testing deployment process locally

#### `npm run deploy:sepolia`
```bash
hardhat run scripts/deploy.js --network sepolia
```
**PURPOSE**: Deploy contract to Sepolia Ethereum testnet
- **Network**: Sepolia testnet (most stable)
- **Cost**: Test ETH (free from faucets)
- **Requirements**: INFURA_API_KEY + PRIVATE_KEY in .env
- **When to use**: Public testing before mainnet

#### `npm run deploy:goerli`
```bash
hardhat run scripts/deploy.js --network goerli
```
**PURPOSE**: Deploy contract to Goerli Ethereum testnet
- **Network**: Goerli testnet (alternative to Sepolia)
- **Cost**: Test ETH (free from faucets)
- **When to use**: Alternative testnet if Sepolia has issues

### **🔍 CONTRACT VERIFICATION**

#### `npm run verify:sepolia`
```bash
hardhat verify --network sepolia <CONTRACT_ADDRESS>
```
**PURPOSE**: Verify deployed contract source code on Etherscan
- **Network**: Sepolia Etherscan
- **Requirements**: ETHERSCAN_API_KEY in .env
- **Benefit**: Makes contract source code publicly viewable
- **When to use**: After successful testnet deployment

#### `npm run verify:goerli`
```bash
hardhat verify --network goerli <CONTRACT_ADDRESS>
```
**PURPOSE**: Verify contract on Goerli Etherscan
- **Same as above but for Goerli network**

## 📁 **DIRECTORY STRUCTURE EXPLAINED**

### **📜 `contracts/`**
```
contracts/
└── FileRegistry.sol    # Main smart contract
```
**PURPOSE**: Solidity source code files
- **FileRegistry.sol**: Core contract for file ownership and access control
- **Functions**: upload(), requestAccess(), approveAccess()
- **Features**: Immutable file registry, decentralized access control

### **🧪 `test/`**
```
test/
└── FileRegistry.t.js   # Comprehensive test suite  
```
**PURPOSE**: Smart contract automated tests
- **Framework**: Hardhat + Mocha + Chai
- **Coverage**: All contract functions and edge cases
- **Scenarios**: Upload, access request, approval workflows

### **🚀 `scripts/`**
```
scripts/
└── deploy.js          # Contract deployment script
```
**PURPOSE**: Deployment automation and configuration
- **Features**: Multi-network support, gas estimation, verification
- **Output**: Contract address, transaction hash, deployment info
- **Logging**: Detailed deployment progress and results

### **⚙️ `artifacts/`**
```
artifacts/
├── contracts/
│   └── FileRegistry.sol/
│       ├── FileRegistry.json     # Contract ABI + bytecode
│       └── FileRegistry.dbg.json # Debug information
└── build-info/                  # Compilation metadata
```
**PURPOSE**: Compiled contract outputs (auto-generated)
- **ABI**: Application Binary Interface for backend integration
- **Bytecode**: Compiled contract for deployment
- **Debug Info**: Source maps for debugging

### **💾 `cache/`**
```
cache/
└── solidity-files-cache.json   # Compilation cache
```
**PURPOSE**: Speed up recompilation (auto-generated)
- **Content**: File hashes and compilation metadata
- **Benefit**: Only recompiles changed files

### **📦 `node_modules/`**
**PURPOSE**: NPM dependencies (installed via `npm install`)
- **Hardhat**: Ethereum development environment
- **Toolbox**: Testing, deployment, verification tools
- **Solhint**: Solidity code linter

### **🔗 `deployments/` (Created after deployment)**
```
deployments/
├── sepolia.json       # Sepolia deployment info
├── goerli.json        # Goerli deployment info  
└── localhost.json     # Local deployment info
```
**PURPOSE**: Track deployed contract addresses and metadata
- **Content**: Contract address, ABI, deployment transaction
- **Usage**: Backend loads contract info from these files

## ⚙️ **CONFIGURATION FILES EXPLAINED**

### **🔧 `hardhat.config.js`**
**PURPOSE**: Hardhat framework configuration
- **Networks**: localhost, sepolia, goerli, mumbai
- **Compiler**: Solidity 0.8.24 settings
- **Paths**: Source, artifacts, cache directories
- **Gas**: Optimization and reporting settings

### **🌍 `.env`**
**PURPOSE**: Environment variables for network access
- **INFURA_API_KEY**: Access to Ethereum nodes
- **PRIVATE_KEY**: Wallet for deployment transactions
- **ETHERSCAN_API_KEY**: Contract verification

### **📋 `package.json`**
**PURPOSE**: NPM project configuration
- **Dependencies**: Hardhat toolchain and plugins
- **Scripts**: Development workflow commands
- **Metadata**: Project name and configuration

## 🔄 **TYPICAL WORKFLOW**

### **🏠 Local Development**
```bash
# 1. Start local blockchain
npm run node

# 2. Compile contracts (in another terminal)
npm run compile

# 3. Run tests  
npm run test

# 4. Deploy to local network
npm run deploy:local
```

### **🌍 Testnet Deployment**
```bash
# 1. Setup environment variables (.env)
# 2. Get testnet ETH from faucet
# 3. Compile contracts
npm run compile

# 4. Deploy to testnet
npm run deploy:sepolia

# 5. Verify contract (optional)
npm run verify:sepolia <CONTRACT_ADDRESS>
```

### **🔧 Development Cycle**
```bash
# 1. Modify contract code
# 2. Check code quality
npm run lint

# 3. Run tests
npm run test

# 4. Compile and test together
npm run ci

# 5. Deploy when ready
npm run deploy:local
```

## 📊 **COMMAND OUTPUTS EXPLAINED**

### **Successful Deployment Output**
```
🚀 Starting FileRegistry contract deployment...
📡 Network: sepolia (Chain ID: 11155111)
👤 Deployer: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
💰 Balance: 0.5 ETH

📦 Deploying FileRegistry contract...
⛽ Estimated gas: 1234567
⏳ Waiting for deployment confirmation...

✅ Deployment successful!
📍 Contract Address: 0x742d35Cc6634C0532925a3b8D(...)
🔗 Transaction Hash: 0xa1b2c3d4e5f6789...
⛽ Gas Used: 1234567
✅ Confirmed in block: 1234567
📄 Deployment info saved to: deployments/sepolia.json
🌍 View on Explorer: https://sepolia.etherscan.io/address/0x742d35(...)
```

### **Test Output**
```
📋 Test setup: Contract deployed at 0x5FbDB2315678afecb367f032d93F642f64180aa3
👤 Owner: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266  
🔍 Requester: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8

✓ owner can upload a file and it is stored (127ms)
✓ rejects duplicate file uploads (89ms)  
✓ requester can request access to an existing file (156ms)
✓ only owner can approve an access request (201ms)

  4 passing (2s)
```

## 🎯 **INTEGRATION WITH BACKEND**

The blockchain module integrates with your backend through:

1. **Local Development**: Backend connects to `localhost:8545` 
2. **Contract ABI**: Backend loads from `artifacts/` or `deployments/`
3. **Web3 Integration**: `blockchain_integration.py` handles transactions
4. **Environment**: Backend `.env` contains contract address and network settings

## 🔐 **SECURITY NOTES**

- **Private Keys**: Never commit real private keys to git
- **Testnet Only**: Current setup is for testnets, not mainnet
- **Gas Limits**: Scripts include safety buffers for gas estimation
- **Verification**: Always verify contracts for transparency

Each script serves a specific purpose in the smart contract development and deployment lifecycle! 🚀