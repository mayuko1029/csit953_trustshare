// =========================================================================
// FILEREGISTRY SMART CONTRACT TESTS
// =========================================================================
// This test suite verifies the FileRegistry contract functionality:
// 1. File upload and registration
// 2. Access request workflow
// 3. Access approval and key sharing
// 4. Security and validation checks
// =========================================================================

const { expect } = require("chai");         // Assertion library for testing
const { ethers } = require("hardhat");      // Ethereum testing framework

// =========================================================================
// UTILITY FUNCTIONS
// =========================================================================

/**
 * Helper to produce a stable bytes32 identifier from a string
 * @param {string} s - Input string to hash
 * @returns {string} - 32-byte hash (0x prefixed)
 * @notice This simulates how backend generates file hashes
 */
const toBytes32 = (s) => ethers.keccak256(ethers.toUtf8Bytes(s));

// =========================================================================
// MAIN TEST SUITE
// =========================================================================
describe("FileRegistry - uploads, access requests, approvals", function () {
  
  // Test accounts (Hardhat provides 20 accounts with 10,000 ETH each)
  let owner, requester, other;
  
  // Contract factory and instance
  let Reg, reg;
  
  // Test data constants
  const fileHash = toBytes32("my-file-1");              // Simulated file hash
  const meta = "UPLOAD";                                 // File metadata
  const encKeyRef = "ipfs://bafy...encryptedKey";        // IPFS reference to encrypted key

  // =====================================================================
  // TEST SETUP - Runs before each test
  // =====================================================================
  beforeEach(async () => {
    // Get test accounts from Hardhat network
    [owner, requester, other] = await ethers.getSigners();
    
    // Deploy a fresh contract instance for each test
    Reg = await ethers.getContractFactory("FileRegistry");
    reg = await Reg.deploy();
    await reg.waitForDeployment();
    
    console.log(`📋 Test setup: Contract deployed at ${await reg.getAddress()}`);
    console.log(`👤 Owner: ${owner.address}`);
    console.log(`🔍 Requester: ${requester.address}`);
  });

  // =====================================================================
  // FILE UPLOAD TESTS
  // =====================================================================
  
  /**
   * TEST: Successful file upload and storage verification
   * WORKFLOW: Backend → Smart Contract → Blockchain Storage
   * SIMULATES: User uploads file through TrustShare system
   */
  it("owner can upload a file and it is stored", async () => {
    console.log(`📁 Testing file upload with hash: ${fileHash}`);
    
    // Execute upload transaction and verify event emission
    await expect(reg.connect(owner).upload(fileHash, meta))
      .to.emit(reg, "FileUploaded")                    // Event should be emitted
      .withArgs(fileHash, owner.address, meta);        // With correct parameters
    
    console.log(`✅ FileUploaded event emitted successfully`);

    // Verify file record was stored correctly on blockchain
    const fileRecord = await reg.files(fileHash);
    expect(fileRecord.owner).to.equal(owner.address);     // Owner address matches
    expect(fileRecord.meta).to.equal(meta);               // Metadata preserved
    expect(fileRecord.encryptedKeyRef).to.equal("");      // No shared key initially
    expect(fileRecord.exists).to.equal(true);             // File marked as existing
    
    console.log(`✅ File record stored correctly on blockchain`);
  });

  it("rejects duplicate file uploads", async () => {
    await reg.connect(owner).upload(fileHash, meta);
    await expect(reg.connect(owner).upload(fileHash, meta))
      .to.be.revertedWith("File already registered");
  });

  it("requester can request access to an existing file", async () => {
    await reg.connect(owner).upload(fileHash, meta);

    await expect(reg.connect(requester).requestAccess(fileHash))
      .to.emit(reg, "AccessRequested")
      .withArgs(fileHash, requester.address);

    const req = await reg.requests(fileHash, requester.address);
    expect(req.requester).to.equal(requester.address);
    expect(req.approved).to.equal(false);
    expect(req.exists).to.equal(true);
  });

  it("rejects access request for a non-existent file", async () => {
    await expect(reg.connect(requester).requestAccess(fileHash))
      .to.be.revertedWith("File not found");
  });

  it("rejects duplicate access requests", async () => {
    await reg.connect(owner).upload(fileHash, meta);
    await reg.connect(requester).requestAccess(fileHash);

    await expect(reg.connect(requester).requestAccess(fileHash))
      .to.be.revertedWith("Request already exists");
  });

  it("only owner can approve an access request", async () => {
    await reg.connect(owner).upload(fileHash, meta);
    await reg.connect(requester).requestAccess(fileHash);

    // Non-owner tries to approve
    await expect(
      reg.connect(other).approveAccess(fileHash, requester.address, encKeyRef)
    ).to.be.revertedWith("Only owner can approve");

    // Owner approves
    await expect(
      reg.connect(owner).approveAccess(fileHash, requester.address, encKeyRef)
    )
      .to.emit(reg, "AccessApproved")
      .withArgs(fileHash, requester.address, encKeyRef);

    // Check request state
    const req = await reg.requests(fileHash, requester.address);
    expect(req.approved).to.equal(true);

    // Check encrypted key reference saved on file
    const fileRecord = await reg.files(fileHash);
    expect(fileRecord.encryptedKeyRef).to.equal(encKeyRef);
  });

  it("rejects approval when file does not exist", async () => {
    await expect(
      reg.connect(owner).approveAccess(fileHash, requester.address, encKeyRef)
    ).to.be.revertedWith("File not found");
  });

  it("rejects approval when there is no request", async () => {
    await reg.connect(owner).upload(fileHash, meta);
    await expect(
      reg.connect(owner).approveAccess(fileHash, requester.address, encKeyRef)
    ).to.be.revertedWith("Request not found");
  });

  // Encoder-level negative test: wrong hash length is rejected by ABI encoder
  it("rejects non-bytes32 hash at the encoder level", async () => {
    const invalidHash = "0x1234"; // not 32 bytes
    await expect(reg.upload(invalidHash, "INVALID"))
      .to.be.rejectedWith(/incorrect data length|INVALID_ARGUMENT/i);
  });

  // On-chain validation negative test: require non-zero bytes32
  it("reverts with 'invalid hash' when zero hash is given (if you add the require)", async () => {
    // Only enable this if you add `require(hash != bytes32(0), "invalid hash");`
    // in the upload() function. Otherwise, skip/remove this test.
    const zeroHash = "0x" + "00".repeat(32);
    // Uncomment this if you add that check in the contract:
    // await expect(reg.upload(zeroHash, meta)).to.be.revertedWith("invalid hash");
  });
});
