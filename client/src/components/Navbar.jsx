import React, { useState } from "react";
import { Navbar, Nav, Container, Button, Dropdown } from "react-bootstrap";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useWallet } from "../context/WalletContext";
import { useNotification } from "../context/NotificationContext";
import { truncateAddress, copyToClipboard } from "../utils/formatters";
import { DEFAULT_CHAIN_ID } from "../config/chains";

export default function NavigationBar() {
  const {
    account,
    chainName,
    balance,
    refreshBalance,
    isConnected,
    isConnecting,
    isSupported,
    connectWallet,
    disconnectWallet,
    switchNetwork,
  } = useWallet();
  const { showSuccess, showError, showInfo } = useNotification();
  const navigate = useNavigate();
  const [copySuccess, setCopySuccess] = useState(false);

  const handleConnect = async () => {
    const res = await connectWallet();
    if (res.success) {
      showSuccess(`Connected account: ${truncateAddress(res.account)}`);
    } else if (res.error) {
      showError(res.error);
    }
  };

  const handleCopyAddress = async () => {
    if (account) {
      await copyToClipboard(account);
      setCopySuccess(true);
      showInfo("Wallet address copied to clipboard!");
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const handleSwitchNetwork = async () => {
    const success = await switchNetwork(DEFAULT_CHAIN_ID);
    if (success) {
      showSuccess("Switched to supported network.");
    }
  };

  return (
    <Navbar expand="lg" className="web3-navbar" variant="dark">
      <Container>
        <Navbar.Brand as={Link} to="/" className="navbar-brand-logo">
          <div className="brand-icon-box">
            <i className="bi bi-shield-lock-fill" />
          </div>
          <span>
            DeFile<span className="gradient-text">Chain</span>
          </span>
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="defilechain-navbar-nav" className="border-0 shadow-none">
          <i className="bi bi-list text-white fs-3" />
        </Navbar.Toggle>

        <Navbar.Collapse id="defilechain-navbar-nav">
          <Nav className="me-auto ms-lg-4 gap-1">
            <Nav.Link as={NavLink} to="/" end className="nav-link-custom">
              <i className="bi bi-house-door" /> Home
            </Nav.Link>
            <Nav.Link as={NavLink} to="/dashboard" className="nav-link-custom">
              <i className="bi bi-speedometer2" /> Dashboard
            </Nav.Link>
            <Nav.Link as={NavLink} to="/upload" className="nav-link-custom">
              <i className="bi bi-cloud-arrow-up" /> Upload
            </Nav.Link>
            <Nav.Link as={NavLink} to="/my-files" className="nav-link-custom">
              <i className="bi bi-folder2-open" /> My Files
            </Nav.Link>
            <Nav.Link as={NavLink} to="/verify" className="nav-link-custom">
              <i className="bi bi-patch-check" /> Verify
            </Nav.Link>
          </Nav>

          <div className="d-flex align-items-center gap-3 mt-3 mt-lg-0">
            {/* Blockchain Network Indicator */}
            {isConnected && (
              <div
                className={`badge-web3 ${
                  isSupported ? "badge-web3-success" : "badge-web3-danger"
                }`}
                title={isSupported ? "Supported Network" : "Unsupported Network"}
              >
                <span
                  className={
                    isSupported ? "dot-pulse-green" : "dot-pulse-red"
                  }
                />
                <span>{chainName}</span>
                {!isSupported && (
                  <Button
                    size="sm"
                    variant="link"
                    className="p-0 ms-1 text-danger text-decoration-underline"
                    onClick={handleSwitchNetwork}
                  >
                    Switch
                  </Button>
                )}
              </div>
            )}

            {/* Wallet Action Button / Dropdown */}
            {isConnected ? (
              <Dropdown align="end">
                <Dropdown.Toggle
                  id="wallet-dropdown"
                  className="btn-outline-web3 font-mono py-2 px-3 d-flex align-items-center gap-2"
                  style={{ borderRadius: "12px", border: "1px solid rgba(59, 130, 246, 0.4)" }}
                >
                  <span className="badge bg-dark border border-secondary text-warning" style={{ fontSize: "0.75rem" }}>
                    {balance} ETH
                  </span>
                  <span>{truncateAddress(account)}</span>
                </Dropdown.Toggle>

                <Dropdown.Menu
                  className="glass-panel p-2 shadow-lg"
                  style={{
                    backgroundColor: "#0d121f",
                    border: "1px solid rgba(59, 130, 246, 0.3)",
                    minWidth: "240px",
                  }}
                >
                  <div className="px-3 py-2 border-bottom border-secondary mb-2">
                    <small className="text-secondary d-block">Connected Wallet</small>
                    <span className="font-mono text-white fw-bold d-block text-truncate" style={{ fontSize: "0.85rem" }}>
                      {account}
                    </span>
                    <div className="d-flex justify-content-between align-items-center mt-2 pt-1 border-top border-secondary border-opacity-25">
                      <small className="text-secondary">Balance:</small>
                      <span className="text-warning font-mono fw-bold small">{balance} ETH</span>
                    </div>
                  </div>

                  <Dropdown.Item
                    onClick={handleCopyAddress}
                    className="text-light d-flex align-items-center gap-2 rounded py-2 px-3"
                  >
                    <i className={`bi ${copySuccess ? "bi-check2 text-success" : "bi-clipboard"}`} />
                    {copySuccess ? "Copied!" : "Copy Address"}
                  </Dropdown.Item>

                  <Dropdown.Item
                    onClick={() => navigate("/dashboard")}
                    className="text-light d-flex align-items-center gap-2 rounded py-2 px-3"
                  >
                    <i className="bi bi-speedometer2" /> View Dashboard
                  </Dropdown.Item>

                  <Dropdown.Item
                    onClick={async () => {
                      if (refreshBalance) await refreshBalance();
                      showInfo("Balance updated.");
                    }}
                    className="text-light d-flex align-items-center gap-2 rounded py-2 px-3"
                  >
                    <i className="bi bi-arrow-repeat text-info" /> Refresh Balance
                  </Dropdown.Item>

                  <Dropdown.Divider className="border-secondary opacity-25" />

                  <Dropdown.Item
                    onClick={disconnectWallet}
                    className="text-danger d-flex align-items-center gap-2 rounded py-2 px-3"
                  >
                    <i className="bi bi-box-arrow-right" /> Disconnect
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            ) : (
              <Button
                onClick={handleConnect}
                disabled={isConnecting}
                className="btn-gradient-primary"
              >
                {isConnecting ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <i className="bi bi-wallet2" />
                    Connect Wallet
                  </>
                )}
              </Button>
            )}
          </div>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
