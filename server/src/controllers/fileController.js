const ipfsService = require("../services/ipfsService");
const { calculateSha256 } = require("../utils/hashUtil");

/**
 * Controller handling file upload to IPFS
 * POST /api/files/upload
 */
async function uploadFile(req, res, next) {
  try {
    const file = req.file;

    const result = await ipfsService.uploadToIpfs({
      buffer: file.buffer,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    });

    return res.status(201).json({
      success: true,
      fileName: result.fileName,
      cid: result.cid,
      fileSize: result.fileSize,
      mimeType: result.mimeType,
      sha256Hash: result.sha256Hash,
      gatewayUrl: result.gatewayUrl,
      provider: result.provider,
      uploadedAt: result.uploadedAt,
    });
  } catch (error) {
    console.error("[fileController:uploadFile] Error:", error);
    next(error);
  }
}

/**
 * Controller returning metadata or verifying file metadata
 * POST /api/files/metadata
 */
async function getFileMetadata(req, res, next) {
  try {
    // If a file was uploaded with request
    if (req.file) {
      const sha256 = calculateSha256(req.file.buffer);
      const computedCid = require("../utils/hashUtil").generateIpfsCidV0(req.file.buffer);
      return res.json({
        success: true,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        sha256Hash: sha256,
        computedCid,
        timestamp: Date.now(),
      });
    }

    // If query by CID
    const { cid } = req.body;
    if (!cid) {
      return res.status(400).json({
        success: false,
        error: "Either attach a file or provide a 'cid' in request body.",
      });
    }

    const fetched = await ipfsService.fetchFromIpfs(cid);
    return res.json({
      success: true,
      cid,
      fileName: fetched.fileName,
      fileSize: fetched.fileSize,
      mimeType: fetched.mimeType,
      sha256Hash: fetched.sha256Hash,
      source: fetched.source,
      gatewayUrl: `${require("../config/environment").PINATA_GATEWAY}${cid}`,
    });
  } catch (error) {
    console.error("[fileController:getFileMetadata] Error:", error);
    next(error);
  }
}

/**
 * Controller retrieving file content from IPFS by CID
 * GET /api/files/:cid
 */
async function retrieveFile(req, res, next) {
  try {
    const { cid } = req.params;
    const download = req.query.download === "true";

    if (!cid || cid.trim() === "") {
      return res.status(400).json({
        success: false,
        error: "Missing CID parameter in URL path",
      });
    }

    const fileData = await ipfsService.fetchFromIpfs(cid);

    res.setHeader("Content-Type", fileData.mimeType || "application/octet-stream");
    res.setHeader("Content-Length", fileData.fileSize);
    res.setHeader("X-IPFS-CID", cid);
    res.setHeader("X-SHA256-Checksum", fileData.sha256Hash);

    const disposition = download ? "attachment" : "inline";
    res.setHeader(
      "Content-Disposition",
      `${disposition}; filename="${encodeURIComponent(fileData.fileName)}"`
    );

    return res.status(200).send(fileData.buffer);
  } catch (error) {
    console.error(`[fileController:retrieveFile] Failed for CID ${req.params.cid}:`, error.message);
    return res.status(404).json({
      success: false,
      error: `File retrieval failed: ${error.message}`,
      cid: req.params.cid,
    });
  }
}

/**
 * Verifies file buffer against expected CID
 * POST /api/files/verify
 */
async function verifyFileIntegrity(req, res, next) {
  try {
    const { cid } = req.body;
    if (!cid) {
      return res.status(400).json({
        success: false,
        error: "Expected 'cid' parameter in request body",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "Please upload the physical file to verify its cryptographic integrity",
      });
    }

    const verification = ipfsService.verifyContentIntegrity(cid, req.file.buffer);

    return res.json({
      success: true,
      verified: verification.isValid,
      expectedCid: cid,
      calculatedCid: verification.calculatedCid,
      calculatedSha256: verification.calculatedSha256,
      message: verification.isValid
        ? "Cryptographic Integrity Verified: Content matches IPFS CID exactly."
        : "Integrity Verification Failed: Content does not match registered CID.",
    });
  } catch (error) {
    console.error("[fileController:verifyFileIntegrity] Error:", error);
    next(error);
  }
}

module.exports = {
  uploadFile,
  getFileMetadata,
  retrieveFile,
  verifyFileIntegrity,
};
