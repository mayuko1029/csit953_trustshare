// =========================================================================
// HARDHAT CONFIGURATION - Ethereum Development Environment Setup
// =========================================================================

// Import Hardhat toolbox (includes testing, deployment, verification tools)
require("@nomicfoundation/hardhat-toolbox");

// Load environment variables from .env file (API keys, private keys, etc.)
require("dotenv").config(); 

// Import File sharing tasks
require("./tasks/request");
require("./tasks/approve");


// =========================================================================
// NETWORK CONFIGURATION - Multiple Testnet Setup
// =========================================================================
const networks = {};

// Sepolia Testnet (Recommended - most stable)
if (process.env.INFURA_API_KEY && process.env.BLOCKCHAIN_PRIVATE_KEY) {
  networks.sepolia = {
    url: `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`,
    accounts: [process.env.BLOCKCHAIN_PRIVATE_KEY],
    chainId: 11155111,
    gasPrice: 20000000000, // 20 gwei
    gas: 5000000,
    timeout: 60000
  };
}

// // Goerli Testnet (Alternative)
// if (process.env.INFURA_API_KEY && process.env.BLOCKCHAIN_PRIVATE_KEY) {
//   networks.goerli = {
//     url: `https://goerli.infura.io/v3/${process.env.INFURA_API_KEY}`,
//     accounts: [process.env.PRIVATE_KEY],
//     chainId: 5,
//     gasPrice: 20000000000,
//     gas: 5000000
//   };
// }

// // Polygon Mumbai Testnet (Faster & Cheaper)
// if (process.env.INFURA_API_KEY && process.env.BLOCKCHAIN_PRIVATE_KEY) {
//   networks.mumbai = {
//     url: `https://polygon-mumbai.infura.io/v3/${process.env.INFURA_API_KEY}`,
//     accounts: [process.env.PRIVATE_KEY],
//     chainId: 80001,
//     gasPrice: 30000000000, // 30 gwei
//     gas: 5000000
//   };
// }

// =========================================================================
// MAIN HARDHAT CONFIGURATION
// =========================================================================
module.exports = {
  // Solidity compiler version (matches contract pragma)
  solidity: "0.8.24",
  
  // Default network for deployment and testing
  defaultNetwork: "sepolia",
  
  // Available blockchain networks for deployment
  networks: {
    // Built-in Hardhat network (in-memory, fastest for testing)
    hardhat: {
      chainId: 31337,
      gas: 12000000,
      gasPrice: 20000000000,
      accounts: {
        mnemonic: "test test test test test test test test test test test junk",
        count: 20,
        initialIndex: 0,
        accountsBalance: "10000000000000000000000"
      }
    },
    
    // External localhost network
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
      timeout: 60000
    },
    
    // Add all configured testnets
    ...networks
  },
  
  // Directory structure for smart contract development
  paths: {
    sources: "./contracts",     // Solidity source files (.sol)
    artifacts: "./artifacts",   // Compiled contract bytecode and ABI
    cache: "./cache",          // Hardhat compilation cache
    tests: "./test"            // Smart contract test files
  },
  
  // Gas optimization settings
  gasReporter: {
    enabled: true,
    currency: 'USD',
    gasPrice: 21
  },
  
  // Contract verification settings (for Etherscan)
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
  }
};
