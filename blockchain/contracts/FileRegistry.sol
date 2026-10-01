// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title FileRegistry
 * @dev Decentralized File Storage Registry smart contract for DeFileChain.
 * Stores and manages metadata and IPFS Content Identifiers (CIDs) on the blockchain
 * with cryptographic ownership verification and strict access control.
 * Actual file payloads remain stored exclusively on IPFS.
 */
contract FileRegistry {
    /// @dev Structure representing metadata and ownership of an IPFS-stored file
    struct FileRecord {
        uint256 id;
        string fileName;
        string cid;
        string fileType;
        uint256 fileSize;
        address owner;
        uint256 timestamp;
        bool active;
    }

    /// @dev Total number of registered files (serves as monotonic ID generator)
    uint256 private totalFiles;

    /// @dev Mapping from file ID to FileRecord
    mapping(uint256 => FileRecord) private files;

    /// @dev Mapping from owner address to list of file IDs registered by that owner
    mapping(address => uint256[]) private ownerFiles;

    // ==========================================
    // EVENTS
    // ==========================================

    /// @notice Emitted when a new file metadata record is registered on-chain
    event FileRegistered(
        uint256 indexed id,
        string fileName,
        string cid,
        address indexed owner,
        uint256 timestamp
    );

    /// @notice Emitted when a file is marked inactive by its owner
    event FileDeactivated(
        uint256 indexed id,
        address indexed owner,
        uint256 timestamp
    );

    // ==========================================
    // MODIFIERS
    // ==========================================

    /// @dev Ensures the given file ID exists in registry
    modifier fileExists(uint256 _id) {
        require(_id > 0 && _id <= totalFiles, "FileRegistry: File ID does not exist");
        _;
    }

    /// @dev Ensures only the designated owner of the file can execute the function
    modifier onlyFileOwner(uint256 _id) {
        require(files[_id].owner == msg.sender, "FileRegistry: Caller is not the file owner");
        _;
    }

    // ==========================================
    // WRITE FUNCTIONS
    // ==========================================

    /**
     * @notice Registers a new file's IPFS CID and metadata on-chain
     * @param _fileName Display name of the file
     * @param _cid IPFS Content Identifier (v0 or v1)
     * @param _fileType MIME type or extension
     * @param _fileSize Size in bytes
     * @return id The unique identifier assigned to this file record
     */
    function registerFile(
        string memory _fileName,
        string memory _cid,
        string memory _fileType,
        uint256 _fileSize
    ) external returns (uint256) {
        require(bytes(_fileName).length > 0, "FileRegistry: File name cannot be empty");
        require(bytes(_cid).length > 0, "FileRegistry: IPFS CID cannot be empty");
        require(bytes(_fileType).length > 0, "FileRegistry: File type cannot be empty");
        require(_fileSize > 0, "FileRegistry: File size must be greater than zero");

        totalFiles += 1;
        uint256 newId = totalFiles;

        files[newId] = FileRecord({
            id: newId,
            fileName: _fileName,
            cid: _cid,
            fileType: _fileType,
            fileSize: _fileSize,
            owner: msg.sender,
            timestamp: block.timestamp,
            active: true
        });

        ownerFiles[msg.sender].push(newId);

        emit FileRegistered(newId, _fileName, _cid, msg.sender, block.timestamp);

        return newId;
    }

    /**
     * @notice Deactivates an existing file. Only the file owner can deactivate their file.
     * @param _id Unique identifier of the file to deactivate
     */
    function deactivateFile(uint256 _id) external fileExists(_id) onlyFileOwner(_id) {
        require(files[_id].active, "FileRegistry: File is already inactive");

        files[_id].active = false;

        emit FileDeactivated(_id, msg.sender, block.timestamp);
    }

    // ==========================================
    // READ FUNCTIONS
    // ==========================================

    /**
     * @notice Retrieves the full record of a file by its ID
     * @param _id Unique identifier of the file
     * @return FileRecord The file metadata and ownership record
     */
    function getFile(uint256 _id) external view fileExists(_id) returns (FileRecord memory) {
        return files[_id];
    }

    /**
     * @notice Returns all file records registered by the calling wallet address
     * @return FileRecord[] Array of FileRecord structs belonging to msg.sender
     */
    function getMyFiles() external view returns (FileRecord[] memory) {
        uint256[] storage ids = ownerFiles[msg.sender];
        FileRecord[] memory myRecords = new FileRecord[](ids.length);

        for (uint256 i = 0; i < ids.length; i++) {
            myRecords[i] = files[ids[i]];
        }

        return myRecords;
    }

    /**
     * @notice Returns all file records registered by a specific wallet address
     * @param _user The address of the owner
     * @return FileRecord[] Array of FileRecord structs belonging to the specified user
     */
    function getUserFiles(address _user) external view returns (FileRecord[] memory) {
        uint256[] storage ids = ownerFiles[_user];
        FileRecord[] memory records = new FileRecord[](ids.length);

        for (uint256 i = 0; i < ids.length; i++) {
            records[i] = files[ids[i]];
        }

        return records;
    }

    /**
     * @notice Returns the total count of registered files on the network
     * @return uint256 Total count
     */
    function getFileCount() external view returns (uint256) {
        return totalFiles;
    }

    /**
     * @notice Verifies whether a given CID matches the on-chain record for a given file ID
     * @param _id The ID of the file record
     * @param _cid The IPFS CID to test against the registered record
     * @return isValid True if the file exists, is active, and matches the supplied CID
     */
    function verifyFile(uint256 _id, string memory _cid) external view returns (bool) {
        if (_id == 0 || _id > totalFiles) {
            return false;
        }

        FileRecord memory file = files[_id];
        if (!file.active) {
            return false;
        }

        return keccak256(bytes(file.cid)) == keccak256(bytes(_cid));
    }
}
