import React, { useState, useEffect, useCallback } from "react";
import { Container, Row, Col, Table, Button, Form, InputGroup, Modal, Alert } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { useWallet } from "../context/WalletContext";
import { useNotification } from "../context/NotificationContext";
import LoadingSpinner from "../components/LoadingSpinner";
import { getMyFiles, deactivateFile } from "../services/blockchainService";
import { getFileUrl } from "../services/apiService";
import { formatBytes, formatDate, truncateCid, copyToClipboard } from "../utils/formatters";

export default function MyFiles() {
  const { isConnected, signer, connectWallet } = useWallet();
  const { showSuccess, showError, showInfo } = useNotification();
  const navigate = useNavigate();

  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // 'all' | 'active' | 'inactive'

  // Deactivate modal state
  const [selectedFileForDeactivate, setSelectedFileForDeactivate] = useState(null);
  const [deactivating, setDeactivating] = useState(false);

  // File Preview Modal
  const [previewFile, setPreviewFile] = useState(null);

  // Load user files from smart contract
  const fetchFiles = useCallback(async () => {
    if (!isConnected || !signer) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const userFiles = await getMyFiles(signer);
      setFiles(userFiles);
    } catch (err) {
      console.error("Error loading files from blockchain:", err);
      showError(err.message || "Failed to load files from smart contract.");
    } finally {
      setLoading(false);
    }
  }, [isConnected, signer, showError]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  // Handle Deactivation
  const handleConfirmDeactivate = async () => {
    if (!selectedFileForDeactivate || !signer) return;

    setDeactivating(true);
    try {
      await deactivateFile(signer, selectedFileForDeactivate.id);
      showSuccess(`File #${selectedFileForDeactivate.id} deactivated successfully!`);
      setSelectedFileForDeactivate(null);
      await fetchFiles();
    } catch (err) {
      console.error("Deactivation error:", err);
      let msg = err.message || "Failed to deactivate file.";
      if (err.code === "ACTION_REJECTED" || err.info?.error?.code === 4001) {
        msg = "Deactivation transaction was rejected in MetaMask.";
      }
      showError(msg);
    } finally {
      setDeactivating(false);
    }
  };

  const handleCopy = async (text, label) => {
    await copyToClipboard(text);
    showInfo(`${label} copied to clipboard!`);
  };

  // Filter & Search Logic
  const filteredFiles = files.filter((f) => {
    const matchesSearch =
      f.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.cid.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (filterStatus === "active") return f.active;
    if (filterStatus === "inactive") return !f.active;
    return true;
  });

  return (
    <Container className="fade-in py-4">
      {/* Page Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4 pb-2 border-bottom border-secondary border-opacity-25">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <span className="dot-pulse-green" />
            <span className="text-secondary small font-mono">ON-CHAIN REGISTRY</span>
          </div>
          <h2 className="text-white fw-bold mb-0">My Decentralized Files</h2>
        </div>

        <div className="d-flex align-items-center gap-2">
          <Button onClick={fetchFiles} variant="outline-secondary" className="btn-outline-web3" title="Refresh records">
            <i className="bi bi-arrow-clockwise" /> Refresh
          </Button>
          <Button as={Link} to="/upload" className="btn-gradient-primary">
            <i className="bi bi-cloud-arrow-up" /> Upload File
          </Button>
        </div>
      </div>

      {!isConnected ? (
        <div className="glass-panel p-5 text-center my-4">
          <div className="mb-3 text-info fs-1">
            <i className="bi bi-wallet2" />
          </div>
          <h4 className="text-white fw-bold mb-2">Connect Wallet to View Files</h4>
          <p className="text-secondary mx-auto mb-4" style={{ maxWidth: "480px" }}>
            Your file registry is cryptographically mapped to your wallet address on Ethereum. Connect MetaMask to view your records.
          </p>
          <Button onClick={connectWallet} className="btn-gradient-primary px-4 py-2">
            Connect MetaMask Wallet
          </Button>
        </div>
      ) : loading ? (
        <LoadingSpinner label="Querying FileRegistry smart contract for files..." />
      ) : (
        <>
          {/* Controls: Search and Filter */}
          <div className="glass-panel p-3 mb-4">
            <Row className="g-3 align-items-center">
              <Col md={7} lg={8}>
                <InputGroup>
                  <InputGroup.Text style={{ background: "rgba(15, 23, 42, 0.8)", borderColor: "rgba(255, 255, 255, 0.1)", color: "#94a3b8" }}>
                    <i className="bi bi-search" />
                  </InputGroup.Text>
                  <Form.Control
                    placeholder="Search by file name or IPFS CID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      background: "rgba(15, 23, 42, 0.8)",
                      borderColor: "rgba(255, 255, 255, 0.1)",
                      color: "#ffffff",
                    }}
                  />
                  {searchTerm && (
                    <Button
                      variant="outline-secondary"
                      style={{ borderColor: "rgba(255, 255, 255, 0.1)", color: "#94a3b8" }}
                      onClick={() => setSearchTerm("")}
                    >
                      Clear
                    </Button>
                  )}
                </InputGroup>
              </Col>

              <Col md={5} lg={4}>
                <div className="d-flex align-items-center justify-content-md-end gap-2">
                  <span className="small text-secondary text-nowrap">Filter:</span>
                  <div className="btn-group" role="group">
                    <button
                      type="button"
                      className={`btn btn-sm ${filterStatus === "all" ? "btn-primary" : "btn-outline-secondary"}`}
                      onClick={() => setFilterStatus("all")}
                    >
                      All ({files.length})
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm ${filterStatus === "active" ? "btn-success" : "btn-outline-secondary"}`}
                      onClick={() => setFilterStatus("active")}
                    >
                      Active ({files.filter((f) => f.active).length})
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm ${filterStatus === "inactive" ? "btn-danger" : "btn-outline-secondary"}`}
                      onClick={() => setFilterStatus("inactive")}
                    >
                      Inactive ({files.filter((f) => !f.active).length})
                    </button>
                  </div>
                </div>
              </Col>
            </Row>
          </div>

          {/* Files Table Card */}
          <div className="glass-panel overflow-hidden">
            {filteredFiles.length === 0 ? (
              <div className="text-center py-5">
                <i className="bi bi-folder-x text-secondary fs-1 d-block mb-3" />
                <h5 className="text-white fw-bold mb-1">No Files Found</h5>
                <p className="text-secondary small mb-3">
                  {searchTerm
                    ? "No files match your search criteria."
                    : "You haven't registered any files on the blockchain yet."}
                </p>
                <Button as={Link} to="/upload" size="sm" className="btn-gradient-primary">
                  Upload a File
                </Button>
              </div>
            ) : (
              <div className="table-responsive">
                <Table className="table-web3 mb-0">
                  <thead>
                    <tr>
                      <th>File Name</th>
                      <th>Type</th>
                      <th>Size</th>
                      <th>IPFS CID</th>
                      <th>Upload Date</th>
                      <th>Status</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFiles.map((file) => (
                      <tr key={file.id}>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <i className="bi bi-file-earmark-code text-info fs-5" />
                            <div>
                              <Link
                                to={`/file/${file.id}`}
                                className="text-white fw-semibold text-decoration-none d-block text-truncate"
                                style={{ maxWidth: "220px" }}
                              >
                                {file.fileName}
                              </Link>
                              <small className="text-muted font-mono" style={{ fontSize: "0.75rem" }}>
                                ID #{file.id}
                              </small>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span className="badge bg-dark border border-secondary text-secondary small">
                            {file.fileType.split("/").pop()}
                          </span>
                        </td>

                        <td className="small text-secondary font-mono">
                          {formatBytes(file.fileSize)}
                        </td>

                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <span className="cid-chip font-mono">
                              {truncateCid(file.cid)}
                            </span>
                            <button
                              className="btn btn-sm btn-link p-0 text-secondary"
                              title="Copy CID"
                              onClick={() => handleCopy(file.cid, "CID")}
                            >
                              <i className="bi bi-clipboard" />
                            </button>
                          </div>
                        </td>

                        <td className="small text-secondary font-mono">
                          {formatDate(file.timestamp)}
                        </td>

                        <td>
                          {file.active ? (
                            <span className="badge-web3-success">Active</span>
                          ) : (
                            <span className="badge-web3-danger">Inactive</span>
                          )}
                        </td>

                        <td className="text-end">
                          <div className="d-inline-flex gap-1">
                            {/* View / Preview */}
                            <Button
                              size="sm"
                              variant="outline-info"
                              className="py-1 px-2"
                              title="View / Stream"
                              onClick={() => setPreviewFile(file)}
                            >
                              <i className="bi bi-eye" />
                            </Button>

                            {/* Download */}
                            <a
                              href={getFileUrl(file.cid, true)}
                              download={file.fileName}
                              className="btn btn-sm btn-outline-secondary py-1 px-2"
                              title="Download"
                            >
                              <i className="bi bi-download" />
                            </a>

                            {/* Details Page */}
                            <Button
                              size="sm"
                              variant="outline-secondary"
                              className="py-1 px-2"
                              title="File Details"
                              onClick={() => navigate(`/file/${file.id}`)}
                            >
                              <i className="bi bi-info-circle" />
                            </Button>

                            {/* Verify Page */}
                            <Button
                              size="sm"
                              variant="outline-success"
                              className="py-1 px-2"
                              title="Verify Integrity"
                              onClick={() => navigate(`/verify?id=${file.id}&cid=${file.cid}`)}
                            >
                              <i className="bi bi-shield-check" />
                            </Button>

                            {/* Deactivate Button (if active) */}
                            {file.active && (
                              <Button
                                size="sm"
                                variant="outline-danger"
                                className="py-1 px-2"
                                title="Deactivate File"
                                onClick={() => setSelectedFileForDeactivate(file)}
                              >
                                <i className="bi bi-x-circle" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
          </div>
        </>
      )}

      {/* File Preview Modal */}
      {previewFile && (
        <Modal
          show={Boolean(previewFile)}
          onHide={() => setPreviewFile(null)}
          size="lg"
          centered
          contentClassName="web3-modal"
        >
          <Modal.Header closeButton closeVariant="white" className="web3-modal-header">
            <Modal.Title className="text-white fs-5 fw-bold d-flex align-items-center gap-2">
              <i className="bi bi-file-earmark-play text-info" />
              <span>{previewFile.fileName}</span>
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-4 text-center">
            {previewFile.fileType.startsWith("image/") ? (
              <img
                src={getFileUrl(previewFile.cid)}
                alt={previewFile.fileName}
                className="img-fluid rounded border border-secondary shadow-lg mb-3"
                style={{ maxHeight: "400px" }}
              />
            ) : previewFile.fileType.includes("pdf") ? (
              <iframe
                src={getFileUrl(previewFile.cid)}
                title={previewFile.fileName}
                width="100%"
                height="450px"
                className="rounded border border-secondary"
              />
            ) : (
              <div className="p-5 text-center">
                <i className="bi bi-file-earmark-text text-secondary fs-1 d-block mb-3" />
                <h6 className="text-white mb-2">Binary / Document File</h6>
                <p className="text-secondary small mb-3">
                  This file format ({previewFile.fileType}) can be downloaded or inspected via raw gateway.
                </p>
                <div className="d-flex justify-content-center gap-2">
                  <a
                    href={getFileUrl(previewFile.cid, true)}
                    className="btn btn-gradient-primary btn-sm"
                  >
                    <i className="bi bi-download" /> Download File
                  </a>
                  <a
                    href={`https://gateway.pinata.cloud/ipfs/${previewFile.cid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline-web3 btn-sm"
                  >
                    Open Gateway <i className="bi bi-box-arrow-up-right" />
                  </a>
                </div>
              </div>
            )}
            <div className="p-2 rounded font-mono small d-flex justify-content-between mt-3" style={{ background: "rgba(0,0,0,0.4)" }}>
              <span className="text-secondary">CID: {previewFile.cid}</span>
              <span className="text-secondary">Size: {formatBytes(previewFile.fileSize)}</span>
            </div>
          </Modal.Body>
        </Modal>
      )}

      {/* Deactivation Confirmation Modal */}
      {selectedFileForDeactivate && (
        <Modal
          show={Boolean(selectedFileForDeactivate)}
          onHide={() => setSelectedFileForDeactivate(null)}
          centered
          contentClassName="web3-modal"
        >
          <Modal.Header closeButton closeVariant="white" className="web3-modal-header">
            <Modal.Title className="text-white fs-5 fw-bold d-flex align-items-center gap-2">
              <i className="bi bi-exclamation-triangle-fill text-danger" />
              <span>Deactivate File #{selectedFileForDeactivate.id}</span>
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-4">
            <p className="text-secondary small mb-3">
              Are you sure you want to deactivate <strong className="text-white">{selectedFileForDeactivate.fileName}</strong>?
            </p>
            <Alert variant="danger" className="small p-3" style={{ background: "rgba(69, 10, 10, 0.6)", border: "1px solid rgba(239, 68, 68, 0.4)", color: "#fca5a5" }}>
              <i className="bi bi-info-circle me-1" />
              This will trigger a blockchain transaction from your wallet. The record will be permanently marked as inactive on the Ethereum smart contract.
            </Alert>
          </Modal.Body>
          <Modal.Footer className="web3-modal-footer">
            <Button
              variant="outline-secondary"
              className="btn-outline-web3"
              disabled={deactivating}
              onClick={() => setSelectedFileForDeactivate(null)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={deactivating}
              onClick={handleConfirmDeactivate}
            >
              {deactivating ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" />
                  Confirming in Wallet...
                </>
              ) : (
                "Deactivate On-Chain"
              )}
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </Container>
  );
}
