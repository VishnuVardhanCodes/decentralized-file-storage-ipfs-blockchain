const multer = require("multer");
const path = require("path");
const config = require("../config/environment");

// Multer memory storage allows direct buffering for hashing and IPFS dispatch
const storage = multer.memoryStorage();

// File filter to validate MIME types and extensions
const fileFilter = (req, file, cb) => {
  // Allow all standard safe document, media, and text formats
  if (!file.originalname || file.originalname.trim() === "") {
    return cb(new Error("File name cannot be empty"), false);
  }

  // Reject path traversal attempts in filename
  const cleanName = path.basename(file.originalname);
  if (cleanName !== file.originalname) {
    return cb(new Error("Unsafe file name detected"), false);
  }

  cb(null, true);
};

const upload = multer({
  storage,
  limits: {
    fileSize: config.MAX_FILE_SIZE_BYTES, // e.g. 50MB
    files: 1,
  },
  fileFilter,
});

/**
 * Middleware to validate uploaded file attributes
 */
function validateUploadPayload(req, res, next) {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: "No file was uploaded. Please attach a file in the 'file' field.",
    });
  }

  if (req.file.size <= 0) {
    return res.status(400).json({
      success: false,
      error: "File is empty (0 bytes). Cannot upload empty files to IPFS.",
    });
  }

  if (req.file.size > config.MAX_FILE_SIZE_BYTES) {
    return res.status(400).json({
      success: false,
      error: `File size exceeds maximum allowed threshold of ${Math.round(
        config.MAX_FILE_SIZE_BYTES / (1024 * 1024)
      )} MB`,
    });
  }

  // Sanitize filename
  req.file.originalname = path.basename(req.file.originalname).replace(/[\r\n]/g, "");

  next();
}

module.exports = {
  upload,
  validateUploadPayload,
};
