const express = require("express");
const router = express.Router();
const config = require("../config/environment");

const startTime = Date.now();

// GET /api/health - Returns health check status and configuration info
router.get("/health", (req, res) => {
  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);

  const ipfsMode = config.PINATA_JWT || (config.PINATA_API_KEY && config.PINATA_API_SECRET)
    ? "pinata_cloud"
    : "local_content_addressed";

  res.status(200).json({
    status: "healthy",
    service: "DeFileChain Backend API",
    version: "1.0.0",
    uptimeSeconds,
    timestamp: new Date().toISOString(),
    environment: {
      port: config.PORT,
      ipfsProvider: ipfsMode,
      maxUploadBytes: config.MAX_FILE_SIZE_BYTES,
      maxUploadMB: Math.round(config.MAX_FILE_SIZE_BYTES / (1024 * 1024)),
    },
  });
});

module.exports = router;
