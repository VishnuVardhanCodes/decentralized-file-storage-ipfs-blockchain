import React, { useState, useEffect } from "react";
import { Container, Row, Col, Button, Badge } from "react-bootstrap";
import { useParams, Link } from "react-router-dom";
import { useWallet } from "../context/WalletContext";
import { useNotification } from "../context/NotificationContext";
import LoadingSpinner from "../components/LoadingSpinner";
import { getFileById, deactivateFile } from "../services/blockchainService";
import { getFileUrl } from "../services/apiService";
import { formatBytes, formatDate, copyToClipboard } from "../utils/formatters";

export default function FileDetails() {
  const { id } = useParams();
  const { account, signer, provider } = useWallet();
  const { showSuccess, showError, showInfo } = useNotification();

  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deactivating, setDeactivating] = useState(false);
  const [copiedField, setCopiedField] = useState(null);

  useEffect(() => {
    async function loadFileRecord() {
      if (!id) return;
      setLoading(true);
      try {
        const fileRecord = await getFileById(signer || provider, parseInt(id, 10));
        setFile(fileRecord);
      } catch (err) {
        console.error("Error loading file details:", err);
        showError(err.message || "Failed to load file record from smart contract.");
      } finally {
        setLoading(false);
      }
    }

    loadFileRecord();
  }, [id, signer, provider, showError]);

  const handleCopy = async (text, fieldName) => {
    await copyToClipboard(text);
    setCopiedField(fieldName);
    showInfo(`${fieldName} copied to clipboard!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleDeactivate = async () => {
    if (!signer || !file) return;
    setDeactivating(true);
    try {
      await deactivateFile(signer, file.id);
      showSuccess(`File #${file.id} has been deactivated.`);
      setFile((prev) => ({ ...prev, active: false }));
    } catch (err) {
      console.error("Deactivate error:", err);
      showError(err.message || "Failed to deactivate file.");
    } finally {
      setDeactivating(false);
    }
  };

  const isOwner = account && file && file.owner.toLowerCase() === account.toLowerCase();

  if (loading) {
    return <LoadingSpinner label={`Fetching on-chain record for file ID #${id}...`} />;
  }

  if (!file) {
    return (
      <Container className="py-5 text-center">
        <div className="glass-panel p-5">
          <i className="bi bi-file-earmark-x text-danger fs-1 d-block mb-3" />
          <h4 className="text-white fw-bold mb-2">File Record Not Found</h4>
          <p className="text-secondary small mb-4">
            Could not find an on-chain record corresponding to File ID #{id}.
          </p>
          <Button as={Link} to="/my-files" className="btn-gradient-primary">
            Back to My Files
          </Button>
        </div>
      </Container>
    );
  }

  return (
    <Container className="fade-in py-4">
      {/* Breadcrumb Navigation */}
      <div className="d-flex align-items-center gap-2 mb-3 small text-secondary">
        <Link to="/my-files" className="text-secondary text-decoration-none">
          <i className="bi bi-arrow-left" /> Back to Files
        </Link>
        <span>/</span>
        <span className="text-info font-mono">Record #{file.id}</span>
      </div>

      {/* Main Details Panel */}
      <div className="glass-panel p-4 p-md-5 mb-4">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-start gap-3 mb-4 pb-4 border-bottom border-secondary border-opacity-25">
          <div className="d-flex align-items-center gap-3">
            <div
              className="rounded-3 d-flex align-items-center justify-content-center"
              style={{
                width: "56px",
                height: "56px",
                background: "rgba(59, 130, 246, 0.15)",
                color: "#60a5fa",
                fontSize: "1.75rem",
                border: "1px solid rgba(59, 130, 246, 0.3)",
              }}
            >
              <i className="bi bi-file-earmark-text" />
            </div>
            <div>
              <div className="d-flex align-items-center gap-2 mb-1">
                <h3 className="text-white fw-bold mb-0 text-truncate" style={{ maxWidth: "450px" }}>
                  {file.fileName}
                </h3>
                {file.active ? (
                  <span className="badge-web3-success">Active</span>
                ) : (
                  <span className="badge-web3-danger">Inactive</span>
                )}
              </div>
              <span className="text-secondary small font-mono">
                Smart Contract Record ID: #{file.id} &bull; Registered on {formatDate(file.timestamp)}
              </span>
            </div>
          </div>

          <div className="d-flex flex-wrap gap-2">
            <Button
              as="a"
              href={getFileUrl(file.cid)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline-web3"
            >
              <i className="bi bi-box-arrow-up-right" /> Open File
            </Button>
            <Button
              as="a"
              href={getFileUrl(file.cid, true)}
              download={file.fileName}
              className="btn-gradient-primary"
            >
              <i className="bi bi-download" /> Download
            </Button>
          </div>
        </div>

        {/* Detailed Metadata Grid */}
        <Row className="g-4">
          <Col md={6}>
            <div className="p-3 rounded-3 h-100" style={{ background: "rgba(13, 18, 31, 0.7)", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
              <h6 className="text-white fw-bold mb-3 d-flex align-items-center gap-2">
                <i className="bi bi-hdd-network text-info" /> Storage & Content Metadata
              </h6>

              <div className="d-flex flex-column gap-3 small font-mono">
                <div>
                  <span className="text-secondary d-block">IPFS Content Identifier (CID):</span>
                  <div className="d-flex align-items-center justify-content-between p-2 mt-1 rounded" style={{ background: "rgba(0,0,0,0.4)" }}>
                    <span className="text-info text-break">{file.cid}</span>
                    <button
                      className="btn btn-sm btn-link p-0 text-secondary ms-2"
                      onClick={() => handleCopy(file.cid, "CID")}
                    >
                      <i className={`bi ${copiedField === "CID" ? "bi-check text-success" : "bi-clipboard"}`} />
                    </button>
                  </div>
                </div>

                <div className="d-flex justify-content-between border-bottom border-secondary border-opacity-10 pb-2">
                  <span className="text-secondary">File Size:</span>
                  <span className="text-white">{formatBytes(file.fileSize)} ({file.fileSize} bytes)</span>
                </div>

                <div className="d-flex justify-content-between border-bottom border-secondary border-opacity-10 pb-2">
                  <span className="text-secondary">MIME / Content Type:</span>
                  <span className="text-white">{file.fileType}</span>
                </div>

                <div className="d-flex justify-content-between">
                  <span className="text-secondary">IPFS Gateway Link:</span>
                  <a
                    href={`https://gateway.pinata.cloud/ipfs/${file.cid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-info text-decoration-underline"
                  >
                    View on Pinata Gateway
                  </a>
                </div>
              </div>
            </div>
          </Col>

          <Col md={6}>
            <div className="p-3 rounded-3 h-100" style={{ background: "rgba(13, 18, 31, 0.7)", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
              <h6 className="text-white fw-bold mb-3 d-flex align-items-center gap-2">
                <i className="bi bi-shield-lock text-primary" /> Blockchain & Ownership
              </h6>

              <div className="d-flex flex-column gap-3 small font-mono">
                <div>
                  <span className="text-secondary d-block">Owner Wallet Address:</span>
                  <div className="d-flex align-items-center justify-content-between p-2 mt-1 rounded" style={{ background: "rgba(0,0,0,0.4)" }}>
                    <span className="text-white text-break">{file.owner}</span>
                    <button
                      className="btn btn-sm btn-link p-0 text-secondary ms-2"
                      onClick={() => handleCopy(file.owner, "Owner Address")}
                    >
                      <i className={`bi ${copiedField === "Owner Address" ? "bi-check text-success" : "bi-clipboard"}`} />
                    </button>
                  </div>
                </div>

                <div className="d-flex justify-content-between border-bottom border-secondary border-opacity-10 pb-2">
                  <span className="text-secondary">Ownership Verification:</span>
                  {isOwner ? (
                    <Badge bg="success">You own this file</Badge>
                  ) : (
                    <Badge bg="secondary">External Account</Badge>
                  )}
                </div>

                <div className="d-flex justify-content-between border-bottom border-secondary border-opacity-10 pb-2">
                  <span className="text-secondary">Registration Timestamp:</span>
                  <span className="text-white">{formatDate(file.timestamp)}</span>
                </div>

                <div className="d-flex justify-content-between">
                  <span className="text-secondary">Contract Status:</span>
                  <span className="text-white">{file.active ? "Active Record" : "Deactivated"}</span>
                </div>
              </div>
            </div>
          </Col>
        </Row>

        {/* Action Toolbar */}
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mt-4 pt-4 border-top border-secondary border-opacity-25">
          <Button
            as={Link}
            to={`/verify?id=${file.id}&cid=${file.cid}`}
            className="btn-gradient-success"
          >
            <i className="bi bi-patch-check" /> Verify Cryptographic Integrity
          </Button>

          {isOwner && file.active && (
            <Button
              variant="outline-danger"
              disabled={deactivating}
              onClick={handleDeactivate}
            >
              {deactivating ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" />
                  Deactivating in MetaMask...
                </>
              ) : (
                <>
                  <i className="bi bi-x-circle" /> Deactivate File Record
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </Container>
  );
}
