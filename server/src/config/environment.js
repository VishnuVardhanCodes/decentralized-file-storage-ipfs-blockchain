const dotenv = require("dotenv");
const path = require("path");

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

module.exports = {
  PORT: process.env.PORT || 5000,
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:3000",
  MAX_FILE_SIZE_BYTES: parseInt(process.env.MAX_FILE_SIZE_BYTES || "52428800", 10), // 50MB default
  ALLOWED_FILE_TYPES: process.env.ALLOWED_FILE_TYPES
    ? process.env.ALLOWED_FILE_TYPES.split(",").map((t) => t.trim().toLowerCase())
    : [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "image/svg+xml",
        "application/pdf",
        "text/plain",
        "text/csv",
        "text/markdown",
        "application/json",
        "application/zip",
        "application/x-zip-compressed",
        "application/octet-stream",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ],
  IPFS_PROVIDER: process.env.IPFS_PROVIDER || "auto",
  PINATA_JWT: process.env.PINATA_JWT || "",
  PINATA_API_KEY: process.env.PINATA_API_KEY || "",
  PINATA_API_SECRET: process.env.PINATA_API_SECRET || "",
  PINATA_GATEWAY: process.env.PINATA_GATEWAY || "https://gateway.pinata.cloud/ipfs/",
  IPFS_PUBLIC_GATEWAYS: (
    process.env.IPFS_PUBLIC_GATEWAYS ||
    "https://gateway.pinata.cloud/ipfs/,https://ipfs.io/ipfs/,https://cloudflare-ipfs.com/ipfs/"
  )
    .split(",")
    .map((g) => g.trim()),
  IPFS_API_URL: process.env.IPFS_API_URL || "http://127.0.0.1:5001",
};
