/* =========================================================================
 * TRUSTSHARE HARDHAT TASK: ACCESS REQUEST
 * =========================================================================
 * @dev Submits an access request for a file on the FileRegistry contract.
 * @notice This task maps to the on-chain function:
 *         - requestAccess(bytes32 fileHash)
 *         - requestAccessEx(bytes32 fileHash, string fileId, string message)
 *       If the contract exposes the extended (Ex) function, this task will
 *       emit a human-readable message that is visible on Etherscan logs.
 * ========================================================================= */

const { task } = require("hardhat/config");
const { keccak256, toUtf8Bytes } = require("ethers");

task("request", "Submit an access request for a file")
  .addParam("file", "file_id string (plain identifier used by the backend)")
  .addParam("addr", "FileRegistry contract address on Sepolia")
  .addOptionalParam(
    "msg",
    "Optional human-readable message for Etherscan logs (default: 'Access requested')",
    "Access requested"
  )
  .setAction(async (args, hre) => {
    // =====================================================================
    // INPUT PREPARATION
    // =====================================================================
    /** @dev Convert plain file_id into bytes32 (Keccak-256 of UTF-8 string) */
    const fileId = args.file;
    const fileHash = keccak256(toUtf8Bytes(fileId));

    // =====================================================================
    // CONTRACT BINDING
    // =====================================================================
    const registryAddress = args.addr;
    const reg = await hre.ethers.getContractAt("FileRegistry", registryAddress);

    // =====================================================================
    // EXECUTION
    // =====================================================================
    /** @dev Prefer extended function if available to emit detailed logs */
    const canUseEx = typeof reg.requestAccessEx === "function";
    const params = canUseEx ? [fileHash, fileId, args.msg] : [fileHash];
    const tx = await (canUseEx ? reg.requestAccessEx(...params) : reg.requestAccess(...params));

    console.log("→ request tx:", tx.hash);

    /** @notice Wait for 1 confirmation for determinism in CLI output */
    const rc = await tx.wait(1);
    console.log("✅ confirmed in block:", rc.blockNumber);
  });

module.exports = {};
