const crypto = require("crypto");

// Base58 Bitcoin alphabet used by IPFS CIDv0
const BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

/**
 * Encodes a Buffer to Base58 string
 * @param {Buffer} buffer
 * @returns {string}
 */
function encodeBase58(buffer) {
  const digits = [0];

  for (let i = 0; i < buffer.length; i++) {
    for (let j = 0; j < digits.length; j++) {
      digits[j] <<= 8;
    }
    digits[0] += buffer[i];

    let carry = 0;
    for (let j = 0; j < digits.length; j++) {
      digits[j] += carry;
      carry = (digits[j] / 58) | 0;
      digits[j] %= 58;
    }

    while (carry) {
      digits.push(carry % 58);
      carry = (carry / 58) | 0;
    }
  }

  // Deal with leading zeros
  for (let i = 0; i < buffer.length && buffer[i] === 0; i++) {
    digits.push(0);
  }

  return digits
    .reverse()
    .map((digit) => BASE58_ALPHABET[digit])
    .join("");
}

/**
 * Computes standard SHA-256 hex digest of a buffer
 * @param {Buffer} buffer
 * @returns {string} Hex string (64 characters)
 */
function calculateSha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

/**
 * Computes IPFS CIDv0 (Multihash: 0x12 = sha2-256, 0x20 = 32 length, + sha256 bytes)
 * Results in standard 'Qm...' base58 IPFS identifier
 * @param {Buffer} buffer
 * @returns {string} IPFS CIDv0
 */
function generateIpfsCidV0(buffer) {
  const sha256Digest = crypto.createHash("sha256").update(buffer).digest();
  // Multihash prefix: 0x12 (sha2-256), 0x20 (32 bytes)
  const multihashHeader = Buffer.from([0x12, 0x20]);
  const multihash = Buffer.concat([multihashHeader, sha256Digest]);
  return encodeBase58(multihash);
}

module.exports = {
  calculateSha256,
  generateIpfsCidV0,
  encodeBase58,
};
