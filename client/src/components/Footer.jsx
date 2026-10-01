import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import { Link } from "react-router-dom";
import { CONTRACT_ADDRESS } from "../services/blockchainService";
import { truncateAddress } from "../utils/formatters";

export default function Footer() {
  return (
    <footer className="web3-footer mt-auto">
      <Container>
        <Row className="gy-4 align-items-center">
          <Col md={6}>
            <div className="d-flex align-items-center gap-2 mb-2">
              <i className="bi bi-shield-lock-fill text-primary fs-5" />
              <span className="fw-bold text-white fs-5" style={{ fontFamily: "var(--font-heading)" }}>
                DeFile<span className="gradient-text">Chain</span>
              </span>
            </div>
            <p className="text-secondary small mb-2" style={{ maxWidth: "450px" }}>
              Decentralized File Storage System using InterPlanetary File System (IPFS) and
              Ethereum smart contracts. Built for academic research and production-grade decentralized integrity.
            </p>
            <div className="d-flex align-items-center gap-2 font-mono small text-secondary">
              <span>Contract:</span>
              <span className="badge bg-dark border border-secondary text-info">
                {truncateAddress(CONTRACT_ADDRESS, 8, 6)}
              </span>
            </div>
          </Col>

          <Col md={3}>
            <h6 className="text-white text-uppercase fw-semibold mb-3 small" style={{ letterSpacing: "0.05em" }}>
              Quick Navigation
            </h6>
            <ul className="list-unstyled small mb-0 d-flex flex-column gap-2">
              <li>
                <Link to="/" className="text-secondary text-decoration-none text-hover-white">
                  Home Landing
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-secondary text-decoration-none">
                  Overview Dashboard
                </Link>
              </li>
              <li>
                <Link to="/upload" className="text-secondary text-decoration-none">
                  Upload & Register
                </Link>
              </li>
              <li>
                <Link to="/my-files" className="text-secondary text-decoration-none">
                  File Records
                </Link>
              </li>
              <li>
                <Link to="/verify" className="text-secondary text-decoration-none">
                  Integrity Verifier
                </Link>
              </li>
            </ul>
          </Col>

          <Col md={3}>
            <h6 className="text-white text-uppercase fw-semibold mb-3 small" style={{ letterSpacing: "0.05em" }}>
              Architecture
            </h6>
            <div className="d-flex flex-column gap-2 small text-secondary">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-hdd-network text-info" />
                <span>IPFS Content Addressing</span>
              </div>
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-cpu text-primary" />
                <span>Solidity Registry Contract</span>
              </div>
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-wallet2 text-warning" />
                <span>MetaMask Auth & Signatures</span>
              </div>
            </div>
          </Col>
        </Row>

        <hr className="my-4 border-secondary opacity-25" />

        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-2 small text-secondary">
          <span>&copy; {new Date().getFullYear()} DeFileChain Academic Project. Open Source MIT License.</span>
          <span>Verified on EVM Blockchain &bull; Zero Backend Key Exposure</span>
        </div>
      </Container>
    </footer>
  );
}
