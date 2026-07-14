// =========================================================================
// SMART CONTRACT DEPLOYMENT SCRIPT
// =========================================================================
// This script deploys the FileRegistry contract to any Ethereum network
// Usage: npx hardhat run scripts/deploy.js --network sepolia
// =========================================================================

const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Starting FileRegistry contract deployment...\n");

  // Get network information
  const network = await ethers.provider.getNetwork();
  console.log(`📡 Network: ${network.name} (Chain ID: ${network.chainId})`);

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log(`👤 Deployer: ${deployer.address}`);
  
  // Check deployer balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH\n`);

  // Minimum balance check for testnet deployment
  const minBalance = ethers.parseEther("0.05"); // 0.05 ETH minimum (lowered for current balance)
  if (balance < minBalance) {
    console.error("❌ Insufficient balance for deployment!");
    console.error("💡 Get testnet ETH from: https://sepoliafaucet.net/");
    process.exit(1);
  }

  // Deploy contract
  console.log("📦 Deploying FileRegistry contract...");
  const FileRegistry = await ethers.getContractFactory("FileRegistry");
  
  // Estimate gas for deployment
  const deploymentData = FileRegistry.interface.encodeDeploy([]);
  const estimatedGas = await ethers.provider.estimateGas({
    data: deploymentData
  });
  console.log(`⛽ Estimated gas: ${estimatedGas.toString()}`);

  // Use simple deployment approach that works reliably
  console.log(`📋 Deploying with estimated gas: ${estimatedGas}`);
  
  // Deploy contract (no constructor parameters needed)
  const fileRegistry = await FileRegistry.deploy();

  // Wait for deployment with timeout handling
  console.log("⏳ Waiting for deployment confirmation...");
  
  try {
    await fileRegistry.waitForDeployment();
  } catch (error) {
    console.error("⚠️ Deployment confirmation failed, but checking if contract exists...");
    
    // Sometimes deployment succeeds but confirmation fails
    const deploymentTx = fileRegistry.deploymentTransaction();
    if (deploymentTx && deploymentTx.hash) {
      console.log(`🔍 Checking transaction: ${deploymentTx.hash}`);
      
      try {
        const receipt = await ethers.provider.getTransactionReceipt(deploymentTx.hash);
        if (receipt && receipt.status === 1) {
          console.log("✅ Contract deployed successfully despite confirmation error!");
        } else {
          throw new Error("Transaction failed on-chain");
        }
      } catch (receiptError) {
        throw error; // Re-throw original error if we can't verify
      }
    } else {
      throw error;
    }
  }

  const contractAddress = await fileRegistry.getAddress();
  const deploymentTx = fileRegistry.deploymentTransaction();
  
  console.log("\n✅ Deployment successful!");
  console.log(`📍 Contract Address: ${contractAddress}`);
  console.log(`🔗 Transaction Hash: ${deploymentTx.hash}`);
  console.log(`⛽ Gas Used: ${deploymentTx.gasLimit.toString()}`);

  // Get block confirmation
  console.log("\n⏳ Waiting for block confirmations...");
  const receipt = await deploymentTx.wait(3); // Wait for 3 confirmations
  console.log(`✅ Confirmed in block: ${receipt.blockNumber}`);

  // Save deployment information
  const deploymentInfo = {
    network: network.name,
    chainId: network.chainId.toString(),
    contractAddress: contractAddress,
    deployerAddress: deployer.address,
    transactionHash: deploymentTx.hash,
    blockNumber: receipt.blockNumber,
    gasUsed: receipt.gasUsed.toString(),
    deploymentTime: new Date().toISOString(),
    contractABI: JSON.parse(FileRegistry.interface.formatJson())
  };

  // Save to file
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }

  const deploymentFile = path.join(deploymentsDir, `${network.name}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  
  console.log(`📄 Deployment info saved to: ${deploymentFile}`);

  // Display network-specific explorer links
  const explorerUrls = {
    "sepolia": `https://sepolia.etherscan.io/address/${contractAddress}`,
    "goerli": `https://goerli.etherscan.io/address/${contractAddress}`,
    "mumbai": `https://mumbai.polygonscan.com/address/${contractAddress}`
  };

  if (explorerUrls[network.name]) {
    console.log(`🌍 View on Explorer: ${explorerUrls[network.name]}`);
  }

  // Display next steps
  console.log("\n🎯 Next Steps:");
  console.log("1. Update backend/.env with CONTRACT_ADDRESS");
  console.log("2. Install web3.py: pip install web3");
  console.log("3. Update backend to use real contract");
  console.log("4. Test file upload with real blockchain transactions");

  return { contractAddress, deploymentInfo };
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });