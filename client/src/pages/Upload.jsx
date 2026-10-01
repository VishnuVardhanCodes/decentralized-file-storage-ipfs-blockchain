import React, { useState, useRef } from "react";
import { Container, Row, Col, Button, ProgressBar, Alert } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useWallet } from "../context/WalletContext";
import { useNotification } from "../context/NotificationContext";
import { uploadFileToIpfs } from "../services/apiService";
import { registerFileOnChain } from "../services/blockchainService";
import { validateSelectedFile } from "../utils/validation";
import { formatBytes, formatDate, truncateAddress, copyToClipboard } from "../utils/formatters";
import { getExplorerTxUrl } from "../config/chains";

export default function Upload() {
  const { account, signer, isConnected, chainId, connectWallet } = useWallet();
  const { showSuccess, showError, showInfo } = useNotification();
  const navigate = useNavigate();

  // File state
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // Workflow states: 'idle' | 'uploading_ipfs' | 'ipfs_success' | 'wallet_confirming' | 'tx_pending' | 'registered_success'
  const [uploadState, setUploadState] = useState("idle");
  const [uploadProgress, setUploadProgress] = useState(0);

  // IPFS & Blockchain Results
  const [ipfsResult, setIpfsResult] = useState(null);
  const [blockchainResult, setBlockchainResult] = useState(null);

  // Copy status indicators
  const [copiedCid, setCopiedCid] = useState(false);
  const [copiedTx, setCopiedTx] = useState(false);

  // Handle Drag events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const handleFileSelection = (file) => {
    const validation = validateSelectedFile(file);
    if (!validation.valid) {
      showError(validation.error);
      return;
    }

    setSelectedFile(file);
    setUploadState("idle");
    setUploadProgress(0);
    setIpfsResult(null);
    setBlockchainResult(null);
  };

  // STEP 1: Upload to IPFS via Backend
  const handleIpfsUpload = async () => {
    if (!selectedFile) {
      showError("Please select a file first.");
      return;
    }

    setUploadState("uploading_ipfs");
    setUploadProgress(15);

    try {
      const response = await uploadFileToIpfs(selectedFile, (progress) => {
        setUploadProgress(progress);
      });

      if (response.success && response.cid) {
        setIpfsResult(response);
        setUploadState("ipfs_success");
        showSuccess(`Uploaded to IPFS! CID: ${response.cid}`);
      } else {
        throw new Error(response.error || "Failed to receive IPFS CID from storage gateway.");
      }
    } catch (err) {
      console.error("IPFS upload error:", err);
      setUploadState("idle");
      showError(err.response?.data?.error || err.message || "Failed to upload file to IPFS.");
    }
  };

  // STEP 2: Register on Blockchain via MetaMask
  const handleBlockchainRegistration = async () => {
    if (!isConnected || !signer) {
      showError("Please connect your MetaMask wallet to register this file on-chain.");
      await connectWallet();
      return;
    }

    if (!ipfsResult) {
      showError("Please upload the file to IPFS first.");
      return;
    }

    try {
      setUploadState("wallet_confirming");

      const fileExtension = selectedFile.name.includes(".")
        ? selectedFile.name.split(".").pop().toLowerCase()
        : "bin";
      const fileType = selectedFile.type || `application/${fileExtension}`;

      // Trigger MetaMask transaction
      const result = await registerFileOnChain(signer, {
        fileName: ipfsResult.fileName || selectedFile.name,
        cid: ipfsResult.cid,
        fileType,
        fileSize: ipfsResult.fileSize || selectedFile.size,
      });

      setUploadState("registered_success");
      setBlockchainResult(result);
      showSuccess("File registered on blockchain successfully!");
    } catch (err) {
      console.error("Blockchain registration error:", err);
      setUploadState("ipfs_success"); // Revert back to ipfs_success so user can retry

      let userMsg = err.message || "Blockchain transaction failed.";
      if (err.code === "ACTION_REJECTED" || err.info?.error?.code === 4001) {
        userMsg = "Transaction was rejected in MetaMask.";
      } else if (err.message && err.message.includes("user rejected")) {
        userMsg = "Transaction signature was cancelled.";
      }
      showError(userMsg);
    }
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setUploadState("idle");
    setUploadProgress(0);
    setIpfsResult(null);
    setBlockchainResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCopyCid = async () => {
    if (ipfsResult?.cid) {
      await copyToClipboard(ipfsResult.cid);
      setCopiedCid(true);
      showInfo("CID copied to clipboard!");
      setTimeout(() => setCopiedCid(false), 2000);
    }
  };

  const handleCopyTx = async () => {
    if (blockchainResult?.txHash) {
      await copyToClipboard(blockchainResult.txHash);
      setCopiedTx(true);
      showInfo("Transaction hash copied!");
      setTimeout(() => setCopiedTx(false), 2000);
    }
  };

  const explorerUrl =
    blockchainResult?.txHash && chainId
      ? getExplorerTxUrl(chainId, blockchainResult.txHash)
      : null;

  return (
    <Container className="fade-in py-4">
      {/* Title */}
      <div className="mb-4 pb-2 border-bottom border-secondary border-opacity-25">
        <div className="d-flex align-items-center gap-2 mb-1">
          <span className="dot-pulse-green" />
          <span className="text-secondary small font-mono">FILE REGISTRATION WORKFLOW</span>
        </div>
        <h2 className="text-white fw-bold mb-1">Upload & Register File</h2>
        <p className="text-secondary small mb-0">
          Upload file payload to IPFS, obtain deterministic CID, and anchor immutable ownership onto Ethereum.
        </p>
      </div>

      <Row className="g-4 justify-content-center">
        <Col lg={8}>
          {/* Main Upload / Registration Card */}
          <div className="glass-panel p-4 p-md-5">
            {/* Step Indicators */}
            <div className="d-flex justify-content-between mb-4 pb-3 border-bottom border-secondary border-opacity-25">
              <div className="d-flex align-items-center gap-2">
                <span
                  className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                  style={{
                    width: "28px",
                    height: "28px",
                    background: selectedFile ? "#10b981" : "#3b82f6",
                    fontSize: "0.85rem",
                  }}
                >
                  {selectedFile ? "✓" : "1"}
                </span>
                <span className={`small fw-semibold ${selectedFile ? "text-success" : "text-white"}`}>
                  1. Select & Validate
                </span>
              </div>

              <div className="d-flex align-items-center gap-2">
                <span
                  className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                  style={{
                    width: "28px",
                    height: "28px",
                    background: ipfsResult ? "#10b981" : uploadState === "uploading_ipfs" ? "#3b82f6" : "#475569",
                    fontSize: "0.85rem",
                  }}
                >
                  {ipfsResult ? "✓" : "2"}
                </span>
                <span
                  className={`small fw-semibold ${
                    ipfsResult ? "text-success" : uploadState === "uploading_ipfs" ? "text-info" : "text-secondary"
                  }`}
                >
                  2. Pin to IPFS
                </span>
              </div>

              <div className="d-flex align-items-center gap-2">
                <span
                  className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                  style={{
                    width: "28px",
                    height: "28px",
                    background: blockchainResult ? "#10b981" : "#475569",
                    fontSize: "0.85rem",
                  }}
                >
                  {blockchainResult ? "✓" : "3"}
                </span>
                <span
                  className={`small fw-semibold ${
                    blockchainResult ? "text-success" : "text-secondary"
                  }`}
                >
                  3. Register On-Chain
                </span>
              </div>
            </div>

            {/* Drag & Drop Upload Zone */}
            {uploadState === "idle" && !selectedFile && (
              <div
                className={`dropzone-container ${dragActive ? "active" : ""}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />
                <div className="mb-3 text-info fs-1">
                  <i className="bi bi-cloud-arrow-up" />
                </div>
                <h5 className="text-white fw-bold mb-2">Drag and drop your file here</h5>
                <p className="text-secondary small mb-3">
                  or <span className="text-info text-decoration-underline">browse from device</span>
                </p>
                <div className="d-inline-flex align-items-center gap-2 text-muted small font-mono">
                  <span>Max file size: 50 MB &bull; All formats supported</span>
                </div>
              </div>
            )}

            {/* Selected File Details Box */}
            {selectedFile && uploadState !== "registered_success" && (
              <div className="p-3 mb-4 rounded-3" style={{ background: "rgba(15, 23, 42, 0.8)", border: "1px solid rgba(255, 255, 255, 0.1)" }}>
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div className="d-flex align-items-center gap-3">
                    <div
                      className="p-3 rounded-3 d-flex align-items-center justify-content-center"
                      style={{ background: "rgba(59, 130, 246, 0.15)", color: "#60a5fa", fontSize: "1.5rem" }}
                    >
                      <i className="bi bi-file-earmark-check" />
                    </div>
                    <div>
                      <h6 className="text-white fw-bold mb-1 text-truncate" style={{ maxWidth: "340px" }}>
                        {selectedFile.name}
                      </h6>
                      <div className="text-secondary small d-flex flex-wrap gap-3 font-mono">
                        <span>Size: <strong className="text-white">{formatBytes(selectedFile.size)}</strong></span>
                        <span>MIME: <strong className="text-white">{selectedFile.type || "application/octet-stream"}</strong></span>
                        <span>Ext: <strong className="text-white">{selectedFile.name.split(".").pop().toUpperCase()}</strong></span>
                      </div>
                    </div>
                  </div>

                  {uploadState === "idle" && (
                    <Button
                      variant="link"
                      className="text-danger p-0 text-decoration-none small"
                      onClick={resetUpload}
                    >
                      <i className="bi bi-trash3" /> Change
                    </Button>
                  )}
                </div>

                {/* Progress bar during IPFS upload */}
                {uploadState === "uploading_ipfs" && (
                  <div className="mt-3">
                    <div className="d-flex justify-content-between text-secondary small mb-1">
                      <span>Uploading to IPFS...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <ProgressBar
                      now={uploadProgress}
                      animated
                      variant="info"
                      style={{ height: "8px", borderRadius: "4px" }}
                    />
                  </div>
                )}

                {/* IPFS Uploaded Info */}
                {ipfsResult && (
                  <div className="mt-3 pt-3 border-top border-secondary border-opacity-25">
                    <div className="d-flex align-items-center gap-2 mb-2 text-success small fw-semibold">
                      <i className="bi bi-check-circle-fill" /> IPFS Upload Successful
                    </div>
                    <div className="p-2 rounded font-mono small d-flex align-items-center justify-content-between" style={{ background: "rgba(6, 9, 15, 0.9)" }}>
                      <div className="text-truncate me-2">
                        <span className="text-secondary">CID: </span>
                        <span className="text-info">{ipfsResult.cid}</span>
                      </div>
                      <div className="d-flex gap-2">
                        <Button
                          size="sm"
                          variant="outline-secondary"
                          className="py-0 px-2"
                          onClick={handleCopyCid}
                        >
                          <i className={`bi ${copiedCid ? "bi-check2 text-success" : "bi-clipboard"}`} />
                        </Button>
                        <a
                          href={ipfsResult.gatewayUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-sm btn-outline-info py-0 px-2 text-decoration-none"
                        >
                          <i className="bi bi-box-arrow-up-right" />
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Status Messages for Blockchain Transaction */}
            {uploadState === "wallet_confirming" && (
              <Alert variant="info" className="d-flex align-items-center gap-3 glass-panel border-info mb-4">
                <span className="spinner-border spinner-border-sm text-info" role="status" />
                <div>
                  <strong>Waiting for wallet confirmation...</strong>
                  <div className="small text-secondary">
                    Please approve the transaction prompt in your MetaMask extension.
                  </div>
                </div>
              </Alert>
            )}

            {/* Final Registration Success Card */}
            {uploadState === "registered_success" && blockchainResult && (
              <div className="p-4 rounded-3 mb-4 fade-in" style={{ background: "rgba(5, 46, 22, 0.4)", border: "1px solid rgba(16, 185, 129, 0.4)" }}>
                <div className="d-flex align-items-center gap-3 mb-4">
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center"
                    style={{ width: "48px", height: "48px", background: "rgba(16, 185, 129, 0.2)", color: "#34d399", fontSize: "1.5rem" }}
                  >
                    <i className="bi bi-check-lg" />
                  </div>
                  <div>
                    <h5 className="text-white fw-bold mb-0">File Registered Successfully</h5>
                    <span className="text-success small font-mono">Consensus confirmed on blockchain</span>
                  </div>
                </div>

                <div className="d-flex flex-column gap-2 small font-mono">
                  <div className="p-2 rounded d-flex justify-content-between align-items-center" style={{ background: "rgba(0, 0, 0, 0.3)" }}>
                    <span className="text-secondary">Assigned File ID:</span>
                    <span className="text-white fw-bold">#{blockchainResult.fileId || "Recorded"}</span>
                  </div>

                  <div className="p-2 rounded d-flex justify-content-between align-items-center" style={{ background: "rgba(0, 0, 0, 0.3)" }}>
                    <span className="text-secondary">IPFS CID:</span>
                    <div className="d-flex align-items-center gap-2">
                      <span className="text-info text-truncate" style={{ maxWidth: "260px" }}>
                        {ipfsResult?.cid}
                      </span>
                      <button className="btn btn-sm btn-link p-0 text-secondary" onClick={handleCopyCid}>
                        <i className={`bi ${copiedCid ? "bi-check text-success" : "bi-clipboard"}`} />
                      </button>
                    </div>
                  </div>

                  <div className="p-2 rounded d-flex justify-content-between align-items-center" style={{ background: "rgba(0, 0, 0, 0.3)" }}>
                    <span className="text-secondary">Owner Address:</span>
                    <span className="text-white">{truncateAddress(account)}</span>
                  </div>

                  <div className="p-2 rounded d-flex justify-content-between align-items-center" style={{ background: "rgba(0, 0, 0, 0.3)" }}>
                    <span className="text-secondary">Timestamp:</span>
                    <span className="text-white">{formatDate(Date.now())}</span>
                  </div>

                  <div className="p-2 rounded d-flex justify-content-between align-items-center" style={{ background: "rgba(0, 0, 0, 0.3)" }}>
                    <span className="text-secondary">Transaction Hash:</span>
                    <div className="d-flex align-items-center gap-2">
                      <span className="text-white text-truncate" style={{ maxWidth: "240px" }}>
                        {blockchainResult.txHash}
                      </span>
                      <button className="btn btn-sm btn-link p-0 text-secondary" onClick={handleCopyTx}>
                        <i className={`bi ${copiedTx ? "bi-check text-success" : "bi-clipboard"}`} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="d-flex flex-wrap gap-2 mt-4 pt-2 border-top border-secondary border-opacity-25">
                  <Button
                    onClick={() => navigate("/my-files")}
                    className="btn-gradient-success"
                  >
                    <i className="bi bi-folder2-open" /> View in My Files
                  </Button>
                  {explorerUrl && (
                    <a
                      href={explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline-web3 text-decoration-none"
                    >
                      <i className="bi bi-box-arrow-up-right" /> Explorer
                    </a>
                  )}
                  <Button
                    variant="outline-secondary"
                    className="btn-outline-web3 ms-auto"
                    onClick={resetUpload}
                  >
                    Upload Another
                  </Button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {uploadState === "idle" && selectedFile && (
              <div className="d-flex justify-content-end gap-2">
                <Button variant="outline-secondary" className="btn-outline-web3" onClick={resetUpload}>
                  Cancel
                </Button>
                <Button onClick={handleIpfsUpload} className="btn-gradient-primary">
                  <i className="bi bi-cloud-arrow-up" /> Upload to IPFS
                </Button>
              </div>
            )}

            {uploadState === "ipfs_success" && (
              <div className="d-flex justify-content-end gap-2">
                <Button variant="outline-secondary" className="btn-outline-web3" onClick={resetUpload}>
                  Reset
                </Button>
                <Button
                  onClick={handleBlockchainRegistration}
                  className="btn-gradient-primary"
                >
                  <i className="bi bi-cpu" /> Register on Blockchain
                </Button>
              </div>
            )}
          </div>
        </Col>

        {/* Informational Sidebar */}
        <Col lg={4}>
          <div className="glass-panel p-4 mb-4">
            <h6 className="text-white fw-bold mb-3 d-flex align-items-center gap-2">
              <i className="bi bi-info-circle text-info" /> Upload Security Policy
            </h6>
            <ul className="text-secondary small list-unstyled d-flex flex-column gap-3 mb-0">
              <li className="d-flex align-items-start gap-2">
                <i className="bi bi-check2 text-success mt-1" />
                <span>Files are never stored as raw payload bytes on the Ethereum chain.</span>
              </li>
              <li className="d-flex align-items-start gap-2">
                <i className="bi bi-check2 text-success mt-1" />
                <span>The IPFS CID represents the cryptographic multihash identity of the content.</span>
              </li>
              <li className="d-flex align-items-start gap-2">
                <i className="bi bi-check2 text-success mt-1" />
                <span>Only you (owner wallet) can deactivate your registered on-chain records.</span>
              </li>
            </ul>
          </div>

          <div className="glass-panel p-4">
            <h6 className="text-white fw-bold mb-2">Connected Signer</h6>
            <div className="small font-mono text-secondary mb-3">
              {isConnected ? account : "No wallet connected"}
            </div>
            {!isConnected && (
              <Button size="sm" onClick={connectWallet} className="btn-gradient-primary w-100">
                Connect MetaMask
              </Button>
            )}
          </div>
        </Col>
      </Row>
    </Container>
  );
}
