const request = require("supertest");
const path = require("path");
const fs = require("fs");
const app = require("../src/app");

describe("DeFileChain Server API Endpoints", () => {
  let uploadedCid = "";
  const testBuffer = Buffer.from("DeFileChain Academic Decentralized Storage System Test Content 2026");

  describe("1. GET /api/health", () => {
    it("should return healthy status and system metadata", async () => {
      const res = await request(app).get("/api/health");
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("healthy");
      expect(res.body.service).toContain("DeFileChain");
      expect(res.body.environment).toBeDefined();
    });
  });

  describe("2. POST /api/files/upload validation", () => {
    it("should return 400 when no file is attached", async () => {
      const res = await request(app).post("/api/files/upload");
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain("No file was uploaded");
    });

    it("should return 400 when an empty file (0 bytes) is attached", async () => {
      const res = await request(app)
        .post("/api/files/upload")
        .attach("file", Buffer.from(""), "empty.txt");
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain("empty");
    });

    it("should successfully upload a valid file and return CID and metadata", async () => {
      const res = await request(app)
        .post("/api/files/upload")
        .attach("file", testBuffer, "test_document.txt");

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.fileName).toBe("test_document.txt");
      expect(res.body.cid).toBeDefined();
      expect(res.body.cid.length).toBeGreaterThan(10);
      expect(res.body.fileSize).toBe(testBuffer.length);
      expect(res.body.sha256Hash).toBeDefined();

      uploadedCid = res.body.cid;
    });
  });

  describe("3. GET /api/files/:cid", () => {
    it("should retrieve the uploaded file content by its CID", async () => {
      expect(uploadedCid).toBeTruthy();
      const res = await request(app).get(`/api/files/${uploadedCid}`);
      expect(res.status).toBe(200);
      expect(res.text).toBe(testBuffer.toString("utf8"));
      expect(res.headers["x-ipfs-cid"]).toBe(uploadedCid);
    });

    it("should return 404 for an unknown CID that cannot be retrieved", async () => {
      const res = await request(app).get("/api/files/QmNonExistentCid1111111111111111111111111111111");
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    }, 10000);
  });

  describe("4. POST /api/files/verify", () => {
    it("should confirm file integrity when the exact same content is provided", async () => {
      const res = await request(app)
        .post("/api/files/verify")
        .field("cid", uploadedCid)
        .attach("file", testBuffer, "test_document.txt");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.verified).toBe(true);
      expect(res.body.message).toContain("Verified");
    });

    it("should flag integrity failure when tampered content is provided for the same CID", async () => {
      const tamperedBuffer = Buffer.from("Tampered content with altered bytes");
      const res = await request(app)
        .post("/api/files/verify")
        .field("cid", uploadedCid)
        .attach("file", tamperedBuffer, "test_document.txt");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.verified).toBe(false);
      expect(res.body.message).toContain("Failed");
    });
  });
});
