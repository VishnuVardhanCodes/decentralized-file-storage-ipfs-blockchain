const express = require("express");
const router = express.Router();
const { upload, validateUploadPayload } = require("../middleware/fileValidation");
const fileController = require("../controllers/fileController");

// POST /api/files/upload - Validates and uploads file to IPFS
router.post(
  "/upload",
  upload.single("file"),
  validateUploadPayload,
  fileController.uploadFile
);

// POST /api/files/metadata - Returns file/CID metadata
router.post(
  "/metadata",
  upload.single("file"),
  fileController.getFileMetadata
);

// POST /api/files/verify - Verifies file content against given CID
router.post(
  "/verify",
  upload.single("file"),
  fileController.verifyFileIntegrity
);

// GET /api/files/:cid - Retrieves file content from IPFS
router.get("/:cid", fileController.retrieveFile);

module.exports = router;
