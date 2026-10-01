# DeFileChain Backend REST API Documentation

This document describes the REST API endpoints provided by the DeFileChain backend service. The server acts as a secure gateway for file validation, cryptographic hashing, and IPFS pinning without exposing private keys or API secrets to client-side code.

Base URL: `http://localhost:5000`

---

## 1. System Health Check

### `GET /api/health`

Verifies the operational status of the server and returns active configuration details.

#### Request
- **Method:** `GET`
- **Headers:** None required
- **Body:** None

#### Response (`200 OK`)
```json
{
  "status": "healthy",
  "service": "DeFileChain Backend API",
  "version": "1.0.0",
  "uptimeSeconds": 142,
  "timestamp": "2026-10-01T06:20:00.000Z",
  "environment": {
    "port": 5000,
    "ipfsProvider": "local_content_addressed",
    "maxUploadBytes": 52428800,
    "maxUploadMB": 50
  }
}
```

---

## 2. File Upload & IPFS Pinning

### `POST /api/files/upload`

Receives a single file through `multipart/form-data`, validates its presence, size, and integrity, pins the file to IPFS (via Pinata Cloud or local content-addressed storage fallback), calculates its SHA-256 digest, and returns the generated IPFS Content Identifier (CID).

#### Request
- **Method:** `POST`
- **Content-Type:** `multipart/form-data`
- **Body Fields:**
  - `file` *(Required, File Binary)*: The file to be uploaded.

#### Validation Rules
1. `file` field must be present.
2. File size must be greater than 0 bytes (non-empty).
3. File size must not exceed `MAX_FILE_SIZE_BYTES` (default: 50MB).
4. Filename must not contain path traversal characters.

#### Response (`201 Created`)
```json
{
  "success": true,
  "fileName": "academic_report.pdf",
  "cid": "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
  "fileSize": 1048576,
  "mimeType": "application/pdf",
  "sha256Hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "gatewayUrl": "https://gateway.pinata.cloud/ipfs/QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
  "provider": "pinata_cloud",
  "uploadedAt": "2026-10-01T06:21:00.000Z"
}
```

#### Error Responses
- `400 Bad Request`: File missing or empty.
```json
{
  "success": false,
  "error": "No file was uploaded. Please attach a file in the 'file' field."
}
```
- `413 Payload Too Large`: File exceeds size threshold.
```json
{
  "success": false,
  "error": "File size exceeds maximum allowed threshold of 50 MB"
}
```

---

## 3. File Metadata Retrieval

### `POST /api/files/metadata`

Retrieves or computes metadata, cryptographic hash, and gateway link for an existing CID or an uploaded file buffer.

#### Request (Option A: Query by CID)
- **Method:** `POST`
- **Content-Type:** `application/json`
- **Body:**
```json
{
  "cid": "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco"
}
```

#### Request (Option B: Query by File)
- **Method:** `POST`
- **Content-Type:** `multipart/form-data`
- **Body Fields:**
  - `file` *(File Binary)*

#### Response (`200 OK`)
```json
{
  "success": true,
  "cid": "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
  "fileName": "academic_report.pdf",
  "fileSize": 1048576,
  "mimeType": "application/pdf",
  "sha256Hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "source": "local_cache",
  "gatewayUrl": "https://gateway.pinata.cloud/ipfs/QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco"
}
```

---

## 4. File Retrieval by CID

### `GET /api/files/:cid`

Fetches the raw file payload corresponding to the given IPFS CID. Streams content with proper MIME type headers and allows direct in-browser rendering or downloading.

#### Request
- **Method:** `GET`
- **Parameters:**
  - `cid` *(Path, Required)*: IPFS Content Identifier.
- **Query Parameters:**
  - `download` *(Optional, boolean)*: Set `download=true` to force browser attachment download (`Content-Disposition: attachment`). Defaults to `inline`.

#### Response (`200 OK`)
- **Headers:**
  - `Content-Type`: MIME type of file (e.g., `application/pdf`, `image/png`)
  - `Content-Length`: Size in bytes
  - `Content-Disposition`: `inline; filename="academic_report.pdf"`
  - `X-IPFS-CID`: The requested CID
  - `X-SHA256-Checksum`: Hex digest of file content
- **Body:** Binary stream of file contents.

#### Error Responses
- `404 Not Found`: File not found in local store or reachable IPFS gateways.
```json
{
  "success": false,
  "error": "File with CID \"QmInvalid...\" could not be retrieved from IPFS",
  "cid": "QmInvalid..."
}
```

---

## 5. File Integrity Verification

### `POST /api/files/verify`

Compares a user-provided file buffer against an expected on-chain IPFS CID. Recalculates the cryptographic multihash / SHA-256 and determines if the file content matches without tampering.

#### Request
- **Method:** `POST`
- **Content-Type:** `multipart/form-data`
- **Body Fields:**
  - `cid` *(Text, Required)*: Expected IPFS CID registered on blockchain.
  - `file` *(File Binary, Required)*: Physical file to verify.

#### Response (`200 OK`)
```json
{
  "success": true,
  "verified": true,
  "expectedCid": "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
  "calculatedCid": "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
  "calculatedSha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "message": "Cryptographic Integrity Verified: Content matches IPFS CID exactly."
}
```

When tampered:
```json
{
  "success": true,
  "verified": false,
  "expectedCid": "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
  "calculatedCid": "QmDifferentTamperedCID...",
  "calculatedSha256": "4a1b...",
  "message": "Integrity Verification Failed: Content does not match registered CID."
}
```
