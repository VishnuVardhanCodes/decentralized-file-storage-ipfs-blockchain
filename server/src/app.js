const express = require("express");
const cors = require("cors");
const path = require("path");
const config = require("./config/environment");
const healthRoutes = require("./routes/healthRoutes");
const fileRoutes = require("./routes/fileRoutes");
const { notFoundHandler, globalErrorHandler } = require("./middleware/errorHandler");

const app = express();

// Enable Cross-Origin Resource Sharing
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow local development and standard frontend origins
      callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

// Body parsing middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Static file hosting for temporary assets or local cache inspection
app.use("/uploads", express.static(path.resolve(__dirname, "../uploads")));

// Mount application API routes
app.use("/api", healthRoutes);
app.use("/api/files", fileRoutes);

// Error Handling
app.use(notFoundHandler);
app.use(globalErrorHandler);

// Start server when executed directly
if (process.env.NODE_ENV !== "test") {
  const server = app.listen(config.PORT, () => {
    console.log("=========================================");
    console.log(`DeFileChain Backend API running on port ${config.PORT}`);
    console.log(`Health Check: http://localhost:${config.PORT}/api/health`);
    console.log(`File Upload:  POST http://localhost:${config.PORT}/api/files/upload`);
    console.log("=========================================");
  });

  server.on("error", (err) => {
    console.error("Server startup error:", err);
  });
}

module.exports = app;
