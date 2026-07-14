/* =========================================================================
 * TRUSTSHARE HARDHAT TASK: ACCESS APPROVAL (4.4)
 * =========================================================================
 * @dev Owner approves a pending access request and publishes the
 *      per-requester encrypted key reference on-chain.
 * @notice This implements the 4.4 requirement:
 *        1) Owner encrypts the file key with the requester’s public key (off-chain)
 *        2) Owner publishes the resulting ciphertext via:
 *           - approveAccess(bytes32 fileHash, address requester, string encryptedKeyRef)
 *           - approveAccessEx(bytes32, address, string, string fileId, string message)
 *      The extended (Ex) function emits a human-readable message that is visible
 *      on Etherscan transaction logs.
 * ========================================================================= */

const { task } = require("hardhat/config");
const { keccak256, toUtf8Bytes } = require("ethers");

task("approve", "Approve access and publish encrypted key (per requester)")
  .addParam("file", "file_id string (plain identifier used by the backend)")
  .addParam("to", "requester wallet address (0x...)")
  .addParam("key", "encrypted key reference (base64 ciphertext or IPFS URL)")
  .addParam("addr", "FileRegistry contract address on Sepolia")
  .addOptionalParam(
    "msg",
    "Optional human-readable message for Etherscan logs (default: 'Access approved')",
    "Access approved"
  )
  .setAction(async (args, hre) => {
    // =====================================================================
    // INPUT PREPARATION
    // =====================================================================
    const fileId = args.file;
    const fileHash = keccak256(toUtf8Bytes(fileId));
    const requester = args.to;
    const encryptedKeyRef = args.key;

    // =====================================================================
    // VALIDATION (BASIC)
    // =====================================================================
    if (!/^0x[0-9a-fA-F]{40}$/.test(requester)) {
      throw new Error("Invalid requester address format (expected 0x + 40 hex)");
    }
    if (!encryptedKeyRef || typeof encryptedKeyRef !== "string") {
      throw new Error("Invalid encrypted key reference (must be non-empty string)");
    }

    // =====================================================================
    // CONTRACT BINDING
    // =====================================================================
    const registryAddress = args.addr;
    const reg = await hre.ethers.getContractAt("FileRegistry", registryAddress);

    // =====================================================================
    // EXECUTION
    // =====================================================================
    /** @dev Prefer extended function to emit user-visible logs */
    const canUseEx = typeof reg.approveAccessEx === "function";
    const params = canUseEx
      ? [fileHash, requester, encryptedKeyRef, fileId, args.msg]
      : [fileHash, requester, encryptedKeyRef];

    const tx = await (canUseEx ? reg.approveAccessEx(...params) : reg.approveAccess(...params));

    console.log("→ approve tx:", tx.hash);

    /** @notice Wait for 1 confirmation for determinism in CLI output */
    const rc = await tx.wait(1);
    console.log("✅ confirmed in block:", rc.blockNumber);
  });

module.exports = {};
