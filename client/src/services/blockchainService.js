/* global BigInt */
import { ethers } from "ethers";
import contractConfig from "../config/contractConfig.json";

// Default contract address from synced deployment or environment
export const CONTRACT_ADDRESS =
  process.env.REACT_APP_CONTRACT_ADDRESS ||
  contractConfig.address ||
  "0x5FbDB2315678afecb367f032d93F642f64180aa3";

export const CONTRACT_ABI = contractConfig.abi;

/**
 * Returns an instance of the FileRegistry ethers Contract
 * @param {ethers.Signer|ethers.Provider} signerOrProvider
 * @returns {ethers.Contract}
 */
export function getFileRegistryContract(signerOrProvider) {
  if (!signerOrProvider) {
    throw new Error("A valid ethers signer or provider is required to initialize contract.");
  }
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signerOrProvider);
}

/**
 * Registers a file on-chain via MetaMask transaction
 * @param {ethers.Signer} signer
 * @param {Object} fileParams
 * @param {string} fileParams.fileName
 * @param {string} fileParams.cid
 * @param {string} fileParams.fileType
 * @param {number} fileParams.fileSize
 * @returns {Promise<Object>}
 */
export async function registerFileOnChain(signer, { fileName, cid, fileType, fileSize }) {
  if (!signer) {
    throw new Error("Wallet not connected. Signer is required to submit transaction.");
  }

  const contract = getFileRegistryContract(signer);

  console.log(`[Blockchain] Registering file on-chain: ${fileName} (${cid})...`);
  const tx = await contract.registerFile(fileName, cid, fileType, BigInt(fileSize));
  console.log(`[Blockchain] Transaction submitted. Hash: ${tx.hash}`);

  // Wait for 1 block confirmation
  const receipt = await tx.wait(1);
  console.log(`[Blockchain] Transaction confirmed in block ${receipt.blockNumber}`);

  // Extract FileRegistered event to get assigned file ID
  let assignedId = null;
  if (receipt.logs) {
    for (const log of receipt.logs) {
      try {
        const parsed = contract.interface.parseLog(log);
        if (parsed && parsed.name === "FileRegistered") {
          assignedId = Number(parsed.args[0]);
          break;
        }
      } catch (e) {
        // Not a matching event from this contract
      }
    }
  }

  return {
    success: true,
    txHash: tx.hash,
    blockNumber: receipt.blockNumber,
    fileId: assignedId,
    receipt,
  };
}

/**
 * Formats a raw Solidity FileRecord struct into a clean JavaScript object
 */
export function formatFileRecord(record) {
  return {
    id: Number(record.id),
    fileName: record.fileName,
    cid: record.cid,
    fileType: record.fileType,
    fileSize: Number(record.fileSize),
    owner: record.owner,
    timestamp: Number(record.timestamp),
    active: Boolean(record.active),
  };
}

/**
 * Fetches all file records owned by the connected wallet
 * @param {ethers.Signer} signer
 * @returns {Promise<Array>}
 */
export async function getMyFiles(signer) {
  if (!signer) return [];
  const contract = getFileRegistryContract(signer);
  const rawRecords = await contract.getMyFiles();
  return rawRecords.map(formatFileRecord);
}

/**
 * Fetches a single file record by ID
 * @param {ethers.Signer|ethers.Provider} providerOrSigner
 * @param {number} fileId
 */
export async function getFileById(providerOrSigner, fileId) {
  const contract = getFileRegistryContract(providerOrSigner);
  const raw = await contract.getFile(BigInt(fileId));
  return formatFileRecord(raw);
}

/**
 * Deactivates a file record (owner only)
 * @param {ethers.Signer} signer
 * @param {number} fileId
 */
export async function deactivateFile(signer, fileId) {
  if (!signer) {
    throw new Error("Wallet not connected. Signer required.");
  }
  const contract = getFileRegistryContract(signer);
  const tx = await contract.deactivateFile(BigInt(fileId));
  const receipt = await tx.wait(1);
  return {
    success: true,
    txHash: tx.hash,
    receipt,
  };
}

/**
 * Verifies on-chain if a CID matches the recorded file ID
 * @param {ethers.Signer|ethers.Provider} providerOrSigner
 * @param {number} fileId
 * @param {string} cid
 */
export async function verifyFileOnChain(providerOrSigner, fileId, cid) {
  const contract = getFileRegistryContract(providerOrSigner);
  return await contract.verifyFile(BigInt(fileId), cid);
}

/**
 * Gets total registered files count across the entire network
 * @param {ethers.Signer|ethers.Provider} providerOrSigner
 */
export async function getTotalFileCount(providerOrSigner) {
  try {
    const contract = getFileRegistryContract(providerOrSigner);
    const count = await contract.getFileCount();
    return Number(count);
  } catch (err) {
    console.warn("Failed to fetch total file count:", err.message);
    return 0;
  }
}
