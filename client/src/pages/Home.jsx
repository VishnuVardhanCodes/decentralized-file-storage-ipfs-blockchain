import React from "react";
import { Container, Row, Col, Button, Card } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { useWallet } from "../context/WalletContext";
import { useNotification } from "../context/NotificationContext";

export default function Home() {
  const { isConnected, connectWallet } = useWallet();
  const { showSuccess, showError } = useNotification();
  const navigate = useNavigate();

  const handleWalletAction = async () => {
    if (!isConnected) {
      const res = await connectWallet();
      if (res.success) {
        showSuccess("MetaMask connected successfully!");
        navigate("/dashboard");
      } else if (res.error) {
        showError(res.error);
      }
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <div className="fade-in">
      {/* Hero Section */}
      <section className="hero-wrapper position-relative overflow-hidden">
        <div className="hero-glow-blob" />
        <Container className="position-relative" style={{ zIndex: 1 }}>
          <div className="d-inline-flex align-items-center gap-2 badge-web3 mb-4">
            <span className="dot-pulse-green" />
            <span>Academic Web3 Decentralized Architecture</span>
          </div>

          <h1 className="hero-title">
            Decentralized <span className="gradient-text">File Storage</span>
          </h1>

          <p className="hero-subtitle">
            Store files on IPFS. Register ownership on blockchain. Verify file integrity anytime.
          </p>

          <div className="d-flex flex-wrap justify-content-center gap-3">
            <Button
              onClick={handleWalletAction}
              className="btn-gradient-primary px-4 py-3 fs-6"
            >
              <i className="bi bi-wallet2" />
              {isConnected ? "Go to Dashboard" : "Connect Wallet"}
            </Button>
            <Button
              as={Link}
              to="/upload"
              className="btn-outline-web3 px-4 py-3 fs-6"
            >
              <i className="bi bi-cloud-arrow-up" />
              Get Started
            </Button>
          </div>

          {/* Quick Stats Banner */}
          <div className="mt-5 pt-3">
            <Row className="g-3 justify-content-center">
              <Col xs={6} md={3}>
                <div className="glass-panel p-3 text-center">
                  <div className="text-secondary small">Architecture</div>
                  <div className="fw-bold text-white fs-5 font-mono">IPFS + EVM</div>
                </div>
              </Col>
              <Col xs={6} md={3}>
                <div className="glass-panel p-3 text-center">
                  <div className="text-secondary small">Access Control</div>
                  <div className="fw-bold text-white fs-5 font-mono">Cryptographic</div>
                </div>
              </Col>
              <Col xs={6} md={3}>
                <div className="glass-panel p-3 text-center">
                  <div className="text-secondary small">Storage Engine</div>
                  <div className="fw-bold text-white fs-5 font-mono">Content-Addressed</div>
                </div>
              </Col>
              <Col xs={6} md={3}>
                <div className="glass-panel p-3 text-center">
                  <div className="text-secondary small">Integrity Check</div>
                  <div className="fw-bold text-white fs-5 font-mono">SHA-256 / CID</div>
                </div>
              </Col>
            </Row>
          </div>
        </Container>
      </section>

      {/* How It Works Section */}
      <section className="py-5">
        <Container>
          <div className="text-center mb-5">
            <h6 className="text-info text-uppercase fw-bold small" style={{ letterSpacing: "0.1em" }}>
              End-to-End Workflow
            </h6>
            <h2 className="text-white fw-bold">How DeFileChain Works</h2>
            <p className="text-secondary mx-auto" style={{ maxWidth: "600px" }}>
              Separating high-cost on-chain file storage from immutable decentralized content addressing.
            </p>
          </div>

          <Row className="g-4">
            <Col md={3}>
              <div className="step-card">
                <div className="step-number">01</div>
                <h5 className="text-white fw-semibold mb-2">Connect Wallet</h5>
                <p className="text-secondary small mb-0">
                  Authenticate securely using MetaMask. Your public key serves as your decentralized identity.
                </p>
              </div>
            </Col>

            <Col md={3}>
              <div className="step-card">
                <div className="step-number">02</div>
                <h5 className="text-white fw-semibold mb-2">Pin to IPFS</h5>
                <p className="text-secondary small mb-0">
                  Files are validated and pinned across the peer-to-peer IPFS network, generating an immutable CID.
                </p>
              </div>
            </Col>

            <Col md={3}>
              <div className="step-card">
                <div className="step-number">03</div>
                <h5 className="text-white fw-semibold mb-2">Register On-Chain</h5>
                <p className="text-secondary small mb-0">
                  Execute a smart contract call to anchor the CID, metadata, timestamp, and ownership record on Ethereum.
                </p>
              </div>
            </Col>

            <Col md={3}>
              <div className="step-card">
                <div className="step-number">04</div>
                <h5 className="text-white fw-semibold mb-2">Verify Integrity</h5>
                <p className="text-secondary small mb-0">
                  Retrieve and verify content cryptographic consistency against on-chain records to detect tampering.
                </p>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Deep Dives: IPFS Storage & Blockchain Ownership */}
      <section className="py-5" style={{ background: "rgba(13, 18, 31, 0.4)" }}>
        <Container>
          <Row className="g-5 align-items-center">
            <Col lg={6}>
              <div className="badge-web3 mb-3">
                <i className="bi bi-hdd-network text-info" />
                <span>Decentralized Storage Layer</span>
              </div>
              <h2 className="text-white fw-bold mb-3">
                IPFS Content Addressing
              </h2>
              <p className="text-secondary mb-3">
                Traditional cloud systems reference files by physical URL paths which can change, suffer outages, or be censored. 
                IPFS addresses files cryptographically by their hash contents (CID). If even a single byte changes, the address changes.
              </p>
              <ul className="text-secondary small list-unstyled d-flex flex-column gap-2 mb-4">
                <li className="d-flex align-items-center gap-2">
                  <i className="bi bi-check2-circle text-success" />
                  P2P peer swarm distribution prevents single points of failure.
                </li>
                <li className="d-flex align-items-center gap-2">
                  <i className="bi bi-check2-circle text-success" />
                  Deterministic CIDv0 / CIDv1 hashing prevents duplicate storage.
                </li>
                <li className="d-flex align-items-center gap-2">
                  <i className="bi bi-check2-circle text-success" />
                  No file payload overhead on the EVM blockchain.
                </li>
              </ul>
              <Button as={Link} to="/upload" className="btn-outline-web3">
                Try Uploading a File <i className="bi bi-arrow-right ms-1" />
              </Button>
            </Col>

            <Col lg={6}>
              <div className="glass-panel p-4 p-md-5">
                <div className="badge-web3 mb-3">
                  <i className="bi bi-cpu text-primary" />
                  <span>Trustless Registry Layer</span>
                </div>
                <h3 className="text-white fw-bold mb-3">
                  Blockchain Ownership
                </h3>
                <p className="text-secondary small mb-4">
                  The <code className="text-info font-mono">FileRegistry.sol</code> smart contract maintains a tamper-proof registry of all files, their owners, timestamps, and active status.
                </p>
                <div className="p-3 rounded-3 font-mono small mb-3" style={{ background: "rgba(6, 9, 15, 0.8)", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
                  <div className="text-muted mb-1">{"// Solidity File Record Representation"}</div>
                  <span className="text-primary">struct</span> <span className="text-warning">FileRecord</span> &#123;<br />
                  &nbsp;&nbsp;<span className="text-info">uint256</span> id;<br />
                  &nbsp;&nbsp;<span className="text-info">string</span> fileName;<br />
                  &nbsp;&nbsp;<span className="text-info">string</span> cid; <span className="text-muted">{"// IPFS Pointer"}</span><br />
                  &nbsp;&nbsp;<span className="text-info">address</span> owner; <span className="text-muted">{"// Wallet Address"}</span><br />
                  &nbsp;&nbsp;<span className="text-info">bool</span> active;<br />
                  &#125;
                </div>
                <div className="d-flex align-items-center gap-2 small text-secondary">
                  <i className="bi bi-shield-check text-success fs-5" />
                  <span>Only the file owner can deactivate or manage their file record.</span>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Features Grid */}
      <section className="py-5">
        <Container>
          <div className="text-center mb-5">
            <h6 className="text-info text-uppercase fw-bold small" style={{ letterSpacing: "0.1em" }}>
              Core Capabilities
            </h6>
            <h2 className="text-white fw-bold">Platform Features</h2>
          </div>

          <Row className="g-4">
            <Col md={4}>
              <Card className="glass-panel glass-panel-hover p-4 h-100 border-0">
                <div className="mb-3 text-primary fs-3">
                  <i className="bi bi-fingerprint" />
                </div>
                <h5 className="text-white fw-semibold mb-2">Cryptographic Ownership</h5>
                <p className="text-secondary small mb-0">
                  Every uploaded file is digitally tied to your EVM wallet address via smart contract consensus.
                </p>
              </Card>
            </Col>

            <Col md={4}>
              <Card className="glass-panel glass-panel-hover p-4 h-100 border-0">
                <div className="mb-3 text-info fs-3">
                  <i className="bi bi-shield-check" />
                </div>
                <h5 className="text-white fw-semibold mb-2">Integrity Verification</h5>
                <p className="text-secondary small mb-0">
                  Live verification algorithm hashes retrieved content to prove zero byte alteration or corruption.
                </p>
              </Card>
            </Col>

            <Col md={4}>
              <Card className="glass-panel glass-panel-hover p-4 h-100 border-0">
                <div className="mb-3 text-warning fs-3">
                  <i className="bi bi-key-fill" />
                </div>
                <h5 className="text-white fw-semibold mb-2">Zero Private Key Leakage</h5>
                <p className="text-secondary small mb-0">
                  Frontend signs transactions via MetaMask. IPFS provider tokens are isolated strictly within backend environment.
                </p>
              </Card>
            </Col>

            <Col md={4}>
              <Card className="glass-panel glass-panel-hover p-4 h-100 border-0">
                <div className="mb-3 text-success fs-3">
                  <i className="bi bi-download" />
                </div>
                <h5 className="text-white fw-semibold mb-2">Multi-Gateway Retrieval</h5>
                <p className="text-secondary small mb-0">
                  Retrieve and stream files seamlessly via Pinata, IPFS.io, Cloudflare, or local content cache.
                </p>
              </Card>
            </Col>

            <Col md={4}>
              <Card className="glass-panel glass-panel-hover p-4 h-100 border-0">
                <div className="mb-3 text-purple fs-3" style={{ color: "#a855f7" }}>
                  <i className="bi bi-sliders2" />
                </div>
                <h5 className="text-white fw-semibold mb-2">Access Control & Deactivation</h5>
                <p className="text-secondary small mb-0">
                  Owners can soft-deactivate registered records with immutable events emitted on the blockchain.
                </p>
              </Card>
            </Col>

            <Col md={4}>
              <Card className="glass-panel glass-panel-hover p-4 h-100 border-0">
                <div className="mb-3 text-danger fs-3">
                  <i className="bi bi-file-earmark-lock2" />
                </div>
                <h5 className="text-white fw-semibold mb-2">Format & Size Validation</h5>
                <p className="text-secondary small mb-0">
                  Strict server-side validation against corrupted payloads, path traversal, empty files, and size limits.
                </p>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>
    </div>
  );
}
