const DEFAULT_MAX_SIZE = 50 * 1024 * 1024; // 50MB

/**
 * Validates a user-selected File object
 * @param {File} file
 * @param {number} maxSizeBytes
 * @returns {{ valid: boolean, error: string | null }}
 */
export function validateSelectedFile(file, maxSizeBytes = DEFAULT_MAX_SIZE) {
  if (!file) {
    return { valid: false, error: "Please select a file to upload." };
  }

  if (file.size === 0) {
    return { valid: false, error: "Selected file is empty (0 bytes). Cannot upload empty files." };
  }

  if (file.size > maxSizeBytes) {
    const maxMb = Math.round(maxSizeBytes / (1024 * 1024));
    return {
      valid: false,
      error: `File size exceeds the maximum permitted limit of ${maxMb} MB.`,
    };
  }

  return { valid: true, error: null };
}

/**
 * Validates whether a string has a valid IPFS CID format (v0 or v1)
 * @param {string} cid
 * @returns {boolean}
 */
export function isValidCid(cid) {
  if (!cid || typeof cid !== "string") return false;
  const trimmed = cid.trim();
  // CIDv0: Base58 string starting with Qm, typically 46 chars
  const isCidV0 = /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/.test(trimmed);
  // CIDv1: Base32 string starting with bafy... or bafk...
  const isCidV1 = /^baf[a-z0-9]{50,100}$/i.test(trimmed);

  return isCidV0 || isCidV1 || trimmed.length >= 32;
}
