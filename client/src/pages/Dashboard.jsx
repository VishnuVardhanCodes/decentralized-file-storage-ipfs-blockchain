import React, { useState, useEffect } from "react";
import { Container, Row, Col, Button, Table, Badge } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { useWallet } from "../context/WalletContext";
import { useNotification } from "../context/NotificationContext";
import StatCard from "../components/StatCard";
import LoadingSpinner from "../components/LoadingSpinner";
import { getMyFiles, getTotalFileCount } from "../services/blockchainService";
import { formatBytes, formatDate, truncateAddress, truncateCid } from "../utils/formatters";

export default function Dashboard() {
  const { account, signer, balance, isConnected, connectWallet } = useWallet();
  const { showError } = useNotification();
  const navigate = useNavigate();

  const [files, setFiles] = useState([]);
  const [totalNetworkFiles, setTotalNetworkFiles] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      if (!isConnected || !signer) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const [userFiles, totalCount] = await Promise.all([
          getMyFiles(signer),
          getTotalFileCount(signer),
        ]);
        setFiles(userFiles);
        setTotalNetworkFiles(totalCount);
      } catch (err) {
        console.error("Dashboard data load error:", err);
        showError(err.message || "Could not fetch on-chain files.");
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [isConnected, signer, showError]);

  const activeFilesCount = files.filter((f) => f.active).length;
  const recentFiles = [...files].reverse().slice(0, 5);

  return (
    <Container className="fade-in py-4">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4 pb-2 border-bottom border-secondary border-opacity-25">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <span className="dot-pulse-green" />
            <span className="text-secondary small font-mono">DASHBOARD OVERVIEW</span>
          </div>
          <h2 className="text-white fw-bold mb-0">System Dashboard</h2>
        </div>

        <div className="d-flex align-items-center gap-2">
          <Button as={Link} to="/upload" className="btn-gradient-primary">
            <i className="bi bi-cloud-arrow-up" /> Upload File
          </Button>
          <Button as={Link} to="/my-files" className="btn-outline-web3">
            <i className="bi bi-folder2-open" /> View All Files
          </Button>
        </div>
      </div>

      {!isConnected ? (
        <div className="glass-panel p-5 text-center my-4">
          <div className="mb-3 text-info fs-1">
            <i className="bi bi-wallet2" />
          </div>
          <h4 className="text-white fw-bold mb-2">Wallet Disconnected</h4>
          <p className="text-secondary mx-auto mb-4" style={{ maxWidth: "480px" }}>
            Please connect your MetaMask wallet to view your registered decentralized files, storage metrics, and on-chain ownership records.
          </p>
          <Button onClick={connectWallet} className="btn-gradient-primary px-4 py-2">
            Connect MetaMask Wallet
          </Button>
        </div>
      ) : loading ? (
        <LoadingSpinner label="Querying smart contract for user records..." />
      ) : (
        <>
          {/* Stat Cards Grid */}
          <Row className="g-4 mb-4">
            <Col sm={6} lg={3}>
              <StatCard
                title="My Total Files"
                value={files.length}
                icon="bi-files"
                badge="Personal"
                subtitle="Registered on blockchain"
                accentColor="#3b82f6"
              />
            </Col>

            <Col sm={6} lg={3}>
              <StatCard
                title="Active Files"
                value={activeFilesCount}
                icon="bi-check-circle"
                badge="Active"
                subtitle="Available for retrieval"
                accentColor="#10b981"
              />
            </Col>

            <Col sm={6} lg={3}>
              <StatCard
                title="Network Total"
                value={totalNetworkFiles}
                icon="bi-globe"
                badge="Global"
                subtitle="Across all users on chain"
                accentColor="#8b5cf6"
              />
            </Col>

            <Col sm={6} lg={3}>
              <StatCard
                title="Connected Wallet"
                value={truncateAddress(account, 5, 4)}
                icon="bi-wallet2"
                badge={`${balance} ETH`}
                subtitle="Signer balance on Hardhat"
                accentColor="#06b6d4"
              />
            </Col>
          </Row>

          {/* Quick Actions & Recent Activity */}
          <Row className="g-4 mb-4">
            <Col lg={8}>
              <div className="glass-panel p-4 h-100">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="text-white fw-bold mb-0">Recent File Registrations</h5>
                  <Link to="/my-files" className="small text-info text-decoration-none">
                    View all ({files.length}) <i className="bi bi-chevron-right" />
                  </Link>
                </div>

                {recentFiles.length === 0 ? (
                  <div className="text-center py-5">
                    <i className="bi bi-inbox text-secondary fs-1 d-block mb-2" />
                    <p className="text-secondary small mb-3">No files registered yet with this wallet.</p>
                    <Button as={Link} to="/upload" size="sm" className="btn-gradient-primary">
                      Upload Your First File
                    </Button>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <Table className="table-web3">
                      <thead>
                        <tr>
                          <th>File Name</th>
                          <th>CID</th>
                          <th>Size</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentFiles.map((file) => (
                          <tr key={file.id}>
                            <td>
                              <div className="d-flex align-items-center gap-2">
                                <i className="bi bi-file-earmark-text text-info fs-5" />
                                <div>
                                  <span className="text-white fw-medium d-block text-truncate" style={{ maxWidth: "200px" }}>
                                    {file.fileName}
                                  </span>
                                  <small className="text-muted font-mono" style={{ fontSize: "0.75rem" }}>
                                    ID #{file.id} &bull; {formatDate(file.timestamp)}
                                  </small>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className="cid-chip font-mono">
                                {truncateCid(file.cid)}
                              </span>
                            </td>
                            <td className="small text-secondary font-mono">
                              {formatBytes(file.fileSize)}
                            </td>
                            <td>
                              {file.active ? (
                                <span className="badge-web3-success">Active</span>
                              ) : (
                                <span className="badge-web3-danger">Inactive</span>
                              )}
                            </td>
                            <td>
                              <Button
                                size="sm"
                                variant="link"
                                className="text-info p-0 text-decoration-none fw-semibold small"
                                onClick={() => navigate(`/file/${file.id}`)}
                              >
                                Details <i className="bi bi-arrow-right" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}
              </div>
            </Col>

            {/* Quick Actions & Protocol Status */}
            <Col lg={4}>
              <div className="glass-panel p-4 mb-4">
                <h5 className="text-white fw-bold mb-3">Quick Actions</h5>
                <div className="d-flex flex-column gap-2">
                  <Button
                    as={Link}
                    to="/upload"
                    className="btn-gradient-primary w-100 justify-content-start py-2 px-3"
                  >
                    <i className="bi bi-cloud-arrow-up" /> Upload & Pin File
                  </Button>
                  <Button
                    as={Link}
                    to="/my-files"
                    className="btn-outline-web3 w-100 justify-content-start py-2 px-3"
                  >
                    <i className="bi bi-folder2-open" /> Manage Registered Files
                  </Button>
                  <Button
                    as={Link}
                    to="/verify"
                    className="btn-outline-web3 w-100 justify-content-start py-2 px-3"
                  >
                    <i className="bi bi-patch-check" /> Verify File Cryptography
                  </Button>
                </div>
              </div>

              <div className="glass-panel p-4">
                <h6 className="text-secondary small fw-bold text-uppercase mb-3" style={{ letterSpacing: "0.05em" }}>
                  Storage Status
                </h6>
                <div className="d-flex flex-column gap-3 small">
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="text-secondary">IPFS Protocol:</span>
                    <Badge bg="dark" className="border border-secondary text-info">
                      Online &bull; Pinata / Local
                    </Badge>
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="text-secondary">Smart Contract:</span>
                    <Badge bg="dark" className="border border-secondary text-success">
                      FileRegistry v1.0
                    </Badge>
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="text-secondary">Authentication:</span>
                    <Badge bg="dark" className="border border-secondary text-white">
                      MetaMask Web3
                    </Badge>
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </>
      )}
    </Container>
  );
}
