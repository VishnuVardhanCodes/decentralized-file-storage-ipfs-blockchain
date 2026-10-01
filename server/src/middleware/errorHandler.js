const multer = require("multer");

/**
 * 404 Not Found Middleware
 */
function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    error: `Endpoint not found: ${req.method} ${req.originalUrl}`,
  });
}

/**
 * Global Error Handler Middleware
 */
function globalErrorHandler(err, req, res, next) {
  console.error("[DeFileChain Server Error]:", err);

  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        success: false,
        error: "File upload size exceeded the maximum allowed limit.",
        code: err.code,
      });
    }
    return res.status(400).json({
      success: false,
      error: `Multer upload error: ${err.message}`,
      code: err.code,
    });
  }

  const statusCode = err.statusCode || 500;
  return res.status(statusCode).json({
    success: false,
    error: err.message || "An unexpected internal server error occurred",
  });
}

module.exports = {
  notFoundHandler,
  globalErrorHandler,
};
