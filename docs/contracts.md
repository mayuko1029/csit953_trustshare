# Smart Contracts (Draft)

## FileRegistry.sol
Minimal event emitter for file uploads.

```solidity
event FileUploaded(bytes32 indexed hash, address indexed owner, string meta);
function upload(bytes32 hash, string calldata meta) external;
```

## Development
```bash
cd blockchain
npm run node       # local Hardhat node on :8545
npm run compile
npm test           # when tests are present
```

## Deployment Targets
- **Local**: Hardhat node (default)
- **Testnet**: Sepolia (add RPC + PRIVATE_KEY in Hardhat config)
- **Addresses & ABIs**: Keep a `deployments/` folder per network.
