const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("FileRegistry Smart Contract", function () {
  let FileRegistry;
  let fileRegistry;
  let owner;
  let addr1;
  let addr2;

  const mockFile1 = {
    name: "research_paper.pdf",
    cid: "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
    type: "application/pdf",
    size: 1048576, // 1MB
  };

  const mockFile2 = {
    name: "dataset_sample.csv",
    cid: "QmZ4tDuvesekSs4qM5ZBKpXiZGun7S2CYtEZRB3DYXkjGx",
    type: "text/csv",
    size: 524288, // 512KB
  };

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    FileRegistry = await ethers.getContractFactory("FileRegistry");
    fileRegistry = await FileRegistry.deploy();
    await fileRegistry.waitForDeployment();
  });

  describe("1. Deployment", function () {
    it("should deploy successfully and initialize with 0 files", async function () {
      const count = await fileRegistry.getFileCount();
      expect(count).to.equal(0n);
    });

    it("should return an empty list when calling getMyFiles for a new user", async function () {
      const myFiles = await fileRegistry.getMyFiles();
      expect(myFiles.length).to.equal(0);
    });
  });

  describe("2. File Registration", function () {
    it("should register a file and return new file ID 1", async function () {
      const tx = await fileRegistry.registerFile(
        mockFile1.name,
        mockFile1.cid,
        mockFile1.type,
        mockFile1.size
      );
      await tx.wait();

      const count = await fileRegistry.getFileCount();
      expect(count).to.equal(1n);

      const file = await fileRegistry.getFile(1);
      expect(file.id).to.equal(1n);
      expect(file.fileName).to.equal(mockFile1.name);
      expect(file.cid).to.equal(mockFile1.cid);
      expect(file.fileType).to.equal(mockFile1.type);
      expect(file.fileSize).to.equal(BigInt(mockFile1.size));
      expect(file.owner).to.equal(owner.address);
      expect(file.active).to.be.true;
      expect(file.timestamp).to.be.gt(0n);
    });

    it("should emit FileRegistered event with proper parameters", async function () {
      await expect(
        fileRegistry.registerFile(
          mockFile1.name,
          mockFile1.cid,
          mockFile1.type,
          mockFile1.size
        )
      )
        .to.emit(fileRegistry, "FileRegistered")
        .withArgs(1n, mockFile1.name, mockFile1.cid, owner.address, (val) => val > 0n);
    });
  });

  describe("3. Ownership and Multiple Files", function () {
    it("should isolate user files properly across different accounts", async function () {
      // Owner registers file 1
      await fileRegistry.connect(owner).registerFile(
        mockFile1.name,
        mockFile1.cid,
        mockFile1.type,
        mockFile1.size
      );

      // Addr1 registers file 2
      await fileRegistry.connect(addr1).registerFile(
        mockFile2.name,
        mockFile2.cid,
        mockFile2.type,
        mockFile2.size
      );

      const totalCount = await fileRegistry.getFileCount();
      expect(totalCount).to.equal(2n);

      // Check owner files
      const ownerFiles = await fileRegistry.connect(owner).getMyFiles();
      expect(ownerFiles.length).to.equal(1);
      expect(ownerFiles[0].id).to.equal(1n);
      expect(ownerFiles[0].owner).to.equal(owner.address);

      // Check addr1 files
      const addr1Files = await fileRegistry.connect(addr1).getMyFiles();
      expect(addr1Files.length).to.equal(1);
      expect(addr1Files[0].id).to.equal(2n);
      expect(addr1Files[0].owner).to.equal(addr1.address);

      // Check addr2 files (registered none)
      const addr2Files = await fileRegistry.connect(addr2).getMyFiles();
      expect(addr2Files.length).to.equal(0);
    });

    it("should accurately track multiple files for the same account", async function () {
      await fileRegistry.registerFile("file_a.txt", "QmA", "text/plain", 100);
      await fileRegistry.registerFile("file_b.txt", "QmB", "text/plain", 200);
      await fileRegistry.registerFile("file_c.txt", "QmC", "text/plain", 300);

      const myFiles = await fileRegistry.getMyFiles();
      expect(myFiles.length).to.equal(3);
      expect(myFiles[0].fileName).to.equal("file_a.txt");
      expect(myFiles[1].fileName).to.equal("file_b.txt");
      expect(myFiles[2].fileName).to.equal("file_c.txt");
    });
  });

  describe("4. File Retrieval and Verification", function () {
    beforeEach(async function () {
      await fileRegistry.registerFile(
        mockFile1.name,
        mockFile1.cid,
        mockFile1.type,
        mockFile1.size
      );
    });

    it("should retrieve existing file by ID", async function () {
      const file = await fileRegistry.getFile(1);
      expect(file.cid).to.equal(mockFile1.cid);
      expect(file.fileName).to.equal(mockFile1.name);
    });

    it("should verify correct CID matches the on-chain record", async function () {
      const isValid = await fileRegistry.verifyFile(1, mockFile1.cid);
      expect(isValid).to.be.true;
    });

    it("should return false when verifying with mismatched CID", async function () {
      const isValid = await fileRegistry.verifyFile(1, "QmTamperedCID999999999999999999999999999");
      expect(isValid).to.be.false;
    });

    it("should return false when verifying a non-existent file ID", async function () {
      const isValid = await fileRegistry.verifyFile(999, mockFile1.cid);
      expect(isValid).to.be.false;
    });
  });

  describe("5. Access Control & Unauthorized Modification", function () {
    beforeEach(async function () {
      await fileRegistry.connect(owner).registerFile(
        mockFile1.name,
        mockFile1.cid,
        mockFile1.type,
        mockFile1.size
      );
    });

    it("should prevent non-owner from deactivating another user's file", async function () {
      await expect(
        fileRegistry.connect(addr1).deactivateFile(1)
      ).to.be.revertedWith("FileRegistry: Caller is not the file owner");

      // Verify file is still active
      const file = await fileRegistry.getFile(1);
      expect(file.active).to.be.true;
    });

    it("should allow legitimate owner to deactivate their file and emit FileDeactivated", async function () {
      await expect(fileRegistry.connect(owner).deactivateFile(1))
        .to.emit(fileRegistry, "FileDeactivated")
        .withArgs(1n, owner.address, (val) => val > 0n);

      const file = await fileRegistry.getFile(1);
      expect(file.active).to.be.false;
    });

    it("should revert if owner attempts to deactivate an already deactivated file", async function () {
      await fileRegistry.connect(owner).deactivateFile(1);
      await expect(
        fileRegistry.connect(owner).deactivateFile(1)
      ).to.be.revertedWith("FileRegistry: File is already inactive");
    });

    it("should return false in verifyFile when file is deactivated", async function () {
      await fileRegistry.connect(owner).deactivateFile(1);
      const isValid = await fileRegistry.verifyFile(1, mockFile1.cid);
      expect(isValid).to.be.false;
    });
  });

  describe("6. Input Validation & Edge Cases", function () {
    it("should revert when registering with empty file name", async function () {
      await expect(
        fileRegistry.registerFile("", mockFile1.cid, mockFile1.type, mockFile1.size)
      ).to.be.revertedWith("FileRegistry: File name cannot be empty");
    });

    it("should revert when registering with empty CID", async function () {
      await expect(
        fileRegistry.registerFile(mockFile1.name, "", mockFile1.type, mockFile1.size)
      ).to.be.revertedWith("FileRegistry: IPFS CID cannot be empty");
    });

    it("should revert when registering with empty file type", async function () {
      await expect(
        fileRegistry.registerFile(mockFile1.name, mockFile1.cid, "", mockFile1.size)
      ).to.be.revertedWith("FileRegistry: File type cannot be empty");
    });

    it("should revert when registering with zero file size", async function () {
      await expect(
        fileRegistry.registerFile(mockFile1.name, mockFile1.cid, mockFile1.type, 0)
      ).to.be.revertedWith("FileRegistry: File size must be greater than zero");
    });

    it("should revert when fetching a file ID of zero", async function () {
      await expect(fileRegistry.getFile(0)).to.be.revertedWith(
        "FileRegistry: File ID does not exist"
      );
    });

    it("should revert when fetching an unrecorded future file ID", async function () {
      await expect(fileRegistry.getFile(99)).to.be.revertedWith(
        "FileRegistry: File ID does not exist"
      );
    });
  });
});
