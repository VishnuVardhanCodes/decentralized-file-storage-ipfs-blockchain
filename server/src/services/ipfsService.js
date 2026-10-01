const fs = require("fs");
const path = require("path");
const axios = require("axios");
const FormData = require("form-data");
const config = require("../config/environment");
const { calculateSha256, generateIpfsCidV0 } = require("../utils/hashUtil");

// Directory for local content-addressed IPFS storage fallback
const IPFS_LOCAL_STORE = path.resolve(__dirname, "../../uploads/ipfs_store");
if (!fs.existsSync(IPFS_LOCAL_STORE)) {
  fs.mkdirSync(IPFS_LOCAL_STORE, { recursive: true });
}

/**
 * Uploads file buffer to IPFS (via Pinata if configured, or local content-addressed store)
 * @param {Object} fileData
 * @param {Buffer} fileData.buffer
 * @param {string} fileData.originalname
 * @param {string} fileData.mimetype
 * @param {number} fileData.size
 * @returns {Promise<Object>}
 */
async function uploadToIpfs({ buffer, originalname, mimetype, size }) {
  const sha256Hash = calculateSha256(buffer);
  const localCid = generateIpfsCidV0(buffer);

  let finalCid = localCid;
  let providerUsed = "local_content_addressed";

  // Check if Pinata JWT or API keys are available
  const hasPinataJwt = Boolean(config.PINATA_JWT && config.PINATA_JWT.trim() !== "");
  const hasPinataKeys = Boolean(
    config.PINATA_API_KEY &&
      config.PINATA_API_KEY.trim() !== "" &&
      config.PINATA_API_SECRET &&
      config.PINATA_API_SECRET.trim() !== ""
  );

  if (hasPinataJwt || hasPinataKeys) {
    try {
      console.log(`[IPFS Service] Pinning ${originalname} (${size} bytes) to Pinata...`);
      const formData = new FormData();
      formData.append("file", buffer, {
        filename: originalname,
        contentType: mimetype,
      });

      const pinataMetadata = JSON.stringify({
        name: originalname,
        keyvalues: {
          mimeType: mimetype,
          fileSize: size.toString(),
          sha256: sha256Hash,
          project: "DeFileChain",
        },
      });
      formData.append("pinataMetadata", pinataMetadata);

      const headers = {
        ...formData.getHeaders(),
      };

      if (hasPinataJwt) {
        headers.Authorization = `Bearer ${config.PINATA_JWT}`;
      } else {
        headers.pinata_api_key = config.PINATA_API_KEY;
        headers.pinata_secret_api_key = config.PINATA_API_SECRET;
      }

      const response = await axios.post(
        "https://api.pinata.cloud/pinning/pinFileToIPFS",
        formData,
        {
          headers,
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
          timeout: 45000,
        }
      );

      if (response.data && response.data.IpfsHash) {
        finalCid = response.data.IpfsHash;
        providerUsed = "pinata_cloud";
        console.log(`[IPFS Service] Pinata pinning success. CID: ${finalCid}`);
      }
    } catch (pinataErr) {
      console.warn(
        `[IPFS Service] Pinata upload warning: ${pinataErr.message}. Falling back to content-addressed store.`
      );
    }
  }

  // Always store in local content-addressed repository for instant zero-latency retrieval
  try {
    const fileStorePath = path.join(IPFS_LOCAL_STORE, finalCid);
    const metaStorePath = path.join(IPFS_LOCAL_STORE, `${finalCid}.meta.json`);

    fs.writeFileSync(fileStorePath, buffer);
    fs.writeFileSync(
      metaStorePath,
      JSON.stringify(
        {
          fileName: originalname,
          mimeType: mimetype,
          fileSize: size,
          sha256Hash,
          cid: finalCid,
          storedAt: new Date().toISOString(),
          providerUsed,
        },
        null,
        2
      )
    );
  } catch (storeErr) {
    console.error(`[IPFS Service] Failed to write local cache:`, storeErr.message);
  }

  const gatewayUrl = `${config.PINATA_GATEWAY}${finalCid}`;

  return {
    success: true,
    fileName: originalname,
    cid: finalCid,
    fileSize: size,
    mimeType: mimetype,
    sha256Hash,
    gatewayUrl,
    provider: providerUsed,
    uploadedAt: new Date().toISOString(),
  };
}

/**
 * Fetches file content and metadata from local store or IPFS gateways
 * @param {string} cid
 * @returns {Promise<Object>}
 */
async function fetchFromIpfs(cid) {
  if (!cid || typeof cid !== "string") {
    throw new Error("Invalid IPFS CID provided");
  }

  const sanitizedCid = cid.trim();
  const fileStorePath = path.join(IPFS_LOCAL_STORE, sanitizedCid);
  const metaStorePath = path.join(IPFS_LOCAL_STORE, `${sanitizedCid}.meta.json`);

  // Check local store first
  if (fs.existsSync(fileStorePath)) {
    const buffer = fs.readFileSync(fileStorePath);
    let meta = {
      fileName: `ipfs_${sanitizedCid}`,
      mimeType: "application/octet-stream",
      fileSize: buffer.length,
      sha256Hash: calculateSha256(buffer),
    };

    if (fs.existsSync(metaStorePath)) {
      try {
        meta = { ...meta, ...JSON.parse(fs.readFileSync(metaStorePath, "utf8")) };
      } catch (e) {
        // Fallback to computed meta
      }
    }

    return {
      buffer,
      ...meta,
      source: "local_cache",
    };
  }

  // Attempt to fetch from public gateways
  const gateways = config.IPFS_PUBLIC_GATEWAYS;
  for (const gateway of gateways) {
    try {
      const url = `${gateway.endsWith("/") ? gateway : gateway + "/"}${sanitizedCid}`;
      console.log(`[IPFS Service] Fetching from gateway: ${url}`);
      const timeout = process.env.NODE_ENV === "test" ? 1000 : 5000;
      const response = await axios.get(url, {
        responseType: "arraybuffer",
        timeout,
      });

      const buffer = Buffer.from(response.data);
      const mimeType = response.headers["content-type"] || "application/octet-stream";
      const sha256Hash = calculateSha256(buffer);

      // Cache locally
      fs.writeFileSync(fileStorePath, buffer);

      return {
        buffer,
        fileName: `ipfs_${sanitizedCid}`,
        mimeType,
        fileSize: buffer.length,
        sha256Hash,
        source: "ipfs_gateway",
      };
    } catch (gwErr) {
      console.warn(`[IPFS Service] Gateway ${gateway} failed: ${gwErr.message}`);
    }
  }

  throw new Error(`File with CID "${sanitizedCid}" could not be retrieved from IPFS`);
}

/**
 * Validates integrity of content against a CID
 * @param {string} cid
 * @param {Buffer} buffer
 * @returns {Object}
 */
function verifyContentIntegrity(cid, buffer) {
  const calculatedCid = generateIpfsCidV0(buffer);
  const calculatedSha256 = calculateSha256(buffer);
  const isValid = calculatedCid === cid;

  return {
    isValid,
    cid,
    calculatedCid,
    calculatedSha256,
  };
}

module.exports = {
  uploadToIpfs,
  fetchFromIpfs,
  verifyContentIntegrity,
  IPFS_LOCAL_STORE,
};
