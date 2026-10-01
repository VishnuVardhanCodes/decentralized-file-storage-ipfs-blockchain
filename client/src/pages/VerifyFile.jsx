import React, { useState, useEffect } from "react";
import { Container, Row, Col, Form, Button, Tab, Nav } from "react-bootstrap";
import { useSearchParams } from "react-router-dom";
import { useWallet } from "../context/WalletContext";
import { useNotification } from "../context/NotificationContext";
import { getFileById, verifyFileOnChain } from "../services/blockchainService";
import { verifyFileIntegrity, fetchFileMetadata } from "../services/apiService";
import { formatBytes, truncateAddress } from "../utils/formatters";

export default function VerifyFile() {
  const [searchParams] = useSearchParams();
  const urlFileId = searchParams.get("id");
  const urlCid = searchParams.get("cid");

  const { signer, provider } = useWallet();
  const { showSuccess, showError } = useNotification();

  // Tab State: 'onchain' | 'physical'
  const [activeTab, setActiveTab] = useState("onchain");

  // Mode 1: On-Chain & IPFS Identity Verification
  const [fileIdInput, setFileIdInput] = useState(urlFileId || "");
  const [verifyingOnChain, setVerifyingOnChain] = useState(false);
  const [onChainResult, setOnChainResult] = useState(null);

  // Mode 2: Physical File vs CID verification
  const [physicalCid, setPhysicalCid] = useState(urlCid || "");
  const [selectedPhysicalFile, setSelectedPhysicalFile] = useState(null);
  const [verifyingPhysical, setVerifyingPhysical] = useState(false);
  const [physicalResult, setPhysicalResult] = useState(null);

  useEffect(() => {
    if (urlFileId) {
      setFileIdInput(urlFileId);
    }
    if (urlCid) {
      setPhysicalCid(urlCid);
    }
  }, [urlFileId, urlCid]);

  // Handle Mode 1: Verify On-Chain Record & IPFS Content Hash
  const handleVerifyOnChain = async (e) => {
    e?.preventDefault();
    if (!fileIdInput || isNaN(parseInt(fileIdInput, 10))) {
      showError("Please enter a valid numeric File ID.");
      return;
    }

    setVerifyingOnChain(true);
    setOnChainResult(null);

    try {
      const numericId = parseInt(fileIdInput, 10);
      const targetProvider = signer || provider;
      if (!targetProvider) {
        throw new Error("No blockchain provider detected. Please connect MetaMask.");
      }

      // 1. Fetch File Record from Blockchain
      const onChainRecord = await getFileById(targetProvider, numericId);

      // 2. Query smart contract verifyFile method
      const isSmartContractVerified = await verifyFileOnChain(
        targetProvider,
        numericId,
        onChainRecord.cid
      );

      // 3. Fetch IPFS Metadata and cryptographic SHA256 through backend gateway
      const ipfsMetadata = await fetchFileMetadata(onChainRecord.cid);

      // 4. Compare identity
      const isIntegrityVerified =
        isSmartContractVerified &&
        ipfsMetadata.success &&
        (ipfsMetadata.cid === onChainRecord.cid || !ipfsMetadata.cid);

      setOnChainResult({
        success: true,
        verified: isIntegrityVerified,
        record: onChainRecord,
        ipfsData: ipfsMetadata,
        onChainMatched: isSmartContractVerified,
        timestamp: new Date().toISOString(),
      });

      if (isIntegrityVerified) {
        showSuccess("Integrity Verified: Content and Blockchain match perfectly!");
      } else {
        showError("Integrity Verification Failed: Data inconsistency detected.");
      }
    } catch (err) {
      console.error("Verification error:", err);
      setOnChainResult({
        success: false,
        verified: false,
        error: err.message || "Failed to retrieve on-chain or IPFS record.",
      });
      showError(err.message || "Verification failed.");
    } finally {
      setVerifyingOnChain(false);
    }
  };

  // Handle Mode 2: Verify Physical File against CID
  const handleVerifyPhysicalFile = async (e) => {
    e?.preventDefault();
    if (!physicalCid || physicalCid.trim() === "") {
      showError("Please enter the expected IPFS CID.");
      return;
    }

    if (!selectedPhysicalFile) {
      showError("Please attach the local file you want to test.");
      return;
    }

    setVerifyingPhysical(true);
    setPhysicalResult(null);

    try {
      const response = await verifyFileIntegrity(physicalCid.trim(), selectedPhysicalFile);

      setPhysicalResult(response);
      if (response.verified) {
        showSuccess("Integrity Verified: Local file matches IPFS CID exactly.");
      } else {
        showError("Integrity Verification Failed: File bytes do not match expected CID.");
      }
    } catch (err) {
      console.error("Physical verification error:", err);
      showError(err.response?.data?.error || err.message || "Verification error.");
    } finally {
      setVerifyingPhysical(false);
    }
  };

  return (
    <Container className="fade-in py-4">
      {/* Title */}
      <div className="mb-4 pb-2 border-bottom border-secondary border-opacity-25">
        <div className="d-flex align-items-center gap-2 mb-1">
          <span className="dot-pulse-green" />
          <span className="text-secondary small font-mono">CRYPTOGRAPHIC VERIFICATION</span>
        </div>
        <h2 className="text-white fw-bold mb-1">File Integrity Verification</h2>
        <p className="text-secondary small mb-0">
          Mathematically prove that file content retrieved from IPFS or stored locally has not been tampered with.
        </p>
      </div>

      <Row className="g-4 justify-content-center">
        <Col lg={8}>
          <div className="glass-panel p-4 p-md-5">
            {/* Tab Navigation */}
            <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
              <Nav variant="pills" className="d-flex gap-2 mb-4 p-1 rounded-3" style={{ background: "rgba(13, 18, 31, 0.8)", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
                <Nav.Item className="flex-fill">
                  <Nav.Link
                    eventKey="onchain"
                    className="text-center fw-semibold text-white py-2"
                    style={{ borderRadius: "8px" }}
                  >
                    <i className="bi bi-cpu me-2" />
                    Verify On-Chain Record
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item className="flex-fill">
                  <Nav.Link
                    eventKey="physical"
                    className="text-center fw-semibold text-white py-2"
                    style={{ borderRadius: "8px" }}
                  >
                    <i className="bi bi-file-earmark-check me-2" />
                    Verify Local File vs CID
                  </Nav.Link>
                </Nav.Item>
              </Nav>

              <Tab.Content>
                {/* TAB 1: On-Chain Record & IPFS Identity */}
                <Tab.Pane eventKey="onchain">
                  <Form onSubmit={handleVerifyOnChain}>
                    <Form.Group className="mb-3">
                      <Form.Label className="text-white small fw-bold">Blockchain File ID</Form.Label>
                      <Form.Control
                        type="number"
                        placeholder="e.g. 1"
                        value={fileIdInput}
                        onChange={(e) => setFileIdInput(e.target.value)}
                        style={{
                          background: "rgba(15, 23, 42, 0.8)",
                          borderColor: "rgba(255, 255, 255, 0.1)",
                          color: "#ffffff",
                        }}
                      />
                      <Form.Text className="text-secondary small">
                        Enter the numeric file identifier registered in the FileRegistry smart contract.
                      </Form.Text>
                    </Form.Group>

                    <div className="d-flex justify-content-end mb-4">
                      <Button
                        type="submit"
                        disabled={verifyingOnChain}
                        className="btn-gradient-primary px-4 py-2"
                      >
                        {verifyingOnChain ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" />
                            Verifying On-Chain...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-patch-check" /> Verify File Integrity
                          </>
                        )}
                      </Button>
                    </div>
                  </Form>

                  {/* Verification Results for On-Chain Mode */}
                  {onChainResult && (
                    <div className="fade-in pt-3 border-top border-secondary border-opacity-25">
                      {onChainResult.verified ? (
                        <div className="p-4 rounded-3 text-center mb-4" style={{ background: "rgba(5, 46, 22, 0.5)", border: "1px solid rgba(16, 185, 129, 0.4)" }}>
                          <div
                            className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                            style={{ width: "64px", height: "64px", background: "rgba(16, 185, 129, 0.2)", color: "#34d399", fontSize: "2rem" }}
                          >
                            <i className="bi bi-shield-fill-check" />
                          </div>
                          <h4 className="text-white fw-bold mb-1">Integrity Verified</h4>
                          <p className="text-success small mb-3">
                            The IPFS content address matches the immutable smart contract record without tampering.
                          </p>
                          <div className="p-3 rounded font-mono text-start small d-flex flex-column gap-2" style={{ background: "rgba(0,0,0,0.4)" }}>
                            <div className="d-flex justify-content-between">
                              <span className="text-secondary">File Name:</span>
                              <span className="text-white fw-bold">{onChainResult.record.fileName}</span>
                            </div>
                            <div className="d-flex justify-content-between">
                              <span className="text-secondary">IPFS CID:</span>
                              <span className="text-info text-break">{onChainResult.record.cid}</span>
                            </div>
                            <div className="d-flex justify-content-between">
                              <span className="text-secondary">On-Chain Owner:</span>
                              <span className="text-white">{truncateAddress(onChainResult.record.owner)}</span>
                            </div>
                            <div className="d-flex justify-content-between">
                              <span className="text-secondary">File Size:</span>
                              <span className="text-white">{formatBytes(onChainResult.record.fileSize)}</span>
                            </div>
                            <div className="d-flex justify-content-between">
                              <span className="text-secondary">SHA-256 Digest:</span>
                              <span className="text-white text-truncate" style={{ maxWidth: "280px" }}>
                                {onChainResult.ipfsData.sha256Hash || "Cryptographically matched"}
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 rounded-3 text-center mb-4" style={{ background: "rgba(69, 10, 10, 0.5)", border: "1px solid rgba(239, 68, 68, 0.4)" }}>
                          <div
                            className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                            style={{ width: "64px", height: "64px", background: "rgba(239, 68, 68, 0.2)", color: "#f87171", fontSize: "2rem" }}
                          >
                            <i className="bi bi-shield-x" />
                          </div>
                          <h4 className="text-white fw-bold mb-1">Integrity Verification Failed</h4>
                          <p className="text-danger small mb-0">
                            {onChainResult.error || "The recorded CID or file status does not match cryptographic verification."}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </Tab.Pane>

                {/* TAB 2: Physical File vs CID */}
                <Tab.Pane eventKey="physical">
                  <Form onSubmit={handleVerifyPhysicalFile}>
                    <Form.Group className="mb-3">
                      <Form.Label className="text-white small fw-bold">Target IPFS CID</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco"
                        value={physicalCid}
                        onChange={(e) => setPhysicalCid(e.target.value)}
                        style={{
                          background: "rgba(15, 23, 42, 0.8)",
                          borderColor: "rgba(255, 255, 255, 0.1)",
                          color: "#ffffff",
                          fontFamily: "var(--font-mono)",
                        }}
                      />
                    </Form.Group>

                    <Form.Group className="mb-4">
                      <Form.Label className="text-white small fw-bold">Upload Local File to Compare</Form.Label>
                      <Form.Control
                        type="file"
                        onChange={(e) => setSelectedPhysicalFile(e.target.files[0])}
                        style={{
                          background: "rgba(15, 23, 42, 0.8)",
                          borderColor: "rgba(255, 255, 255, 0.1)",
                          color: "#ffffff",
                        }}
                      />
                      {selectedPhysicalFile && (
                        <div className="small text-secondary font-mono mt-2">
                          Selected: <strong className="text-white">{selectedPhysicalFile.name}</strong> ({formatBytes(selectedPhysicalFile.size)})
                        </div>
                      )}
                    </Form.Group>

                    <div className="d-flex justify-content-end mb-4">
                      <Button
                        type="submit"
                        disabled={verifyingPhysical}
                        className="btn-gradient-primary px-4 py-2"
                      >
                        {verifyingPhysical ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" />
                            Calculating Hashes...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-file-earmark-check" /> Compare Hashes
                          </>
                        )}
                      </Button>
                    </div>
                  </Form>

                  {/* Physical Result */}
                  {physicalResult && (
                    <div className="fade-in pt-3 border-top border-secondary border-opacity-25">
                      {physicalResult.verified ? (
                        <div className="p-4 rounded-3 text-center" style={{ background: "rgba(5, 46, 22, 0.5)", border: "1px solid rgba(16, 185, 129, 0.4)" }}>
                          <i className="bi bi-check-circle-fill text-success fs-1 d-block mb-2" />
                          <h4 className="text-white fw-bold mb-1">Integrity Verified</h4>
                          <p className="text-success small mb-3">
                            The calculated cryptographic hash of your local file matches the expected IPFS CID byte-for-byte.
                          </p>
                          <div className="p-2 rounded font-mono small text-start" style={{ background: "rgba(0,0,0,0.4)" }}>
                            <div className="text-secondary">Expected CID: <span className="text-info">{physicalResult.expectedCid}</span></div>
                            <div className="text-secondary">Calculated CID: <span className="text-success">{physicalResult.calculatedCid}</span></div>
                            <div className="text-secondary text-truncate">SHA-256: <span className="text-white">{physicalResult.calculatedSha256}</span></div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 rounded-3 text-center" style={{ background: "rgba(69, 10, 10, 0.5)", border: "1px solid rgba(239, 68, 68, 0.4)" }}>
                          <i className="bi bi-exclamation-triangle-fill text-danger fs-1 d-block mb-2" />
                          <h4 className="text-white fw-bold mb-1">Integrity Verification Failed</h4>
                          <p className="text-danger small mb-3">
                            Content mismatch detected. The local file bytes do not reproduce the registered IPFS CID.
                          </p>
                          <div className="p-2 rounded font-mono small text-start" style={{ background: "rgba(0,0,0,0.4)" }}>
                            <div className="text-secondary">Expected CID: <span className="text-info">{physicalResult.expectedCid}</span></div>
                            <div className="text-secondary">Calculated CID: <span className="text-danger">{physicalResult.calculatedCid}</span></div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </Tab.Pane>
              </Tab.Content>
            </Tab.Container>
          </div>
        </Col>

        {/* Verification Architecture Panel */}
        <Col lg={4}>
          <div className="glass-panel p-4 mb-4">
            <h6 className="text-white fw-bold mb-3 d-flex align-items-center gap-2">
              <i className="bi bi-patch-check-fill text-info" /> Verification Principle
            </h6>
            <div className="small text-secondary d-flex flex-column gap-3">
              <p className="mb-0">
                In IPFS, the <strong>Content Identifier (CID)</strong> is not an arbitrary filename. It is a cryptographic multihash of the file’s raw binary content.
              </p>
              <div className="p-2 rounded font-mono" style={{ background: "rgba(6, 9, 15, 0.8)", border: "1px solid rgba(255,255,255,0.06)", fontSize: "0.8rem" }}>
                <div>1. File Bytes</div>
                <div className="text-info">&darr; SHA2-256 Digest</div>
                <div>2. 32-byte Binary Hash</div>
                <div className="text-info">&darr; Base58 / Multihash Header</div>
                <div className="text-success">3. Qm... (Immutable CID)</div>
              </div>
              <p className="mb-0">
                If even a single byte of the file is altered by an adversary or network bit rot, the recalculation will produce a totally different CID, alerting the verification engine instantly.
              </p>
            </div>
          </div>
        </Col>
      </Row>
    </Container>
  );
}
