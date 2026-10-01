import React from "react";
import { Alert, Button, Container } from "react-bootstrap";
import { useWallet } from "../context/WalletContext";
import { DEFAULT_CHAIN_ID } from "../config/chains";

export default function NetworkWarning() {
  const { isConnected, isSupported, chainName, switchNetwork } = useWallet();

  if (!isConnected || isSupported) {
    return null;
  }

  return (
    <Container className="pt-3">
      <Alert
        variant="warning"
        className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 shadow-lg"
        style={{
          backgroundColor: "rgba(69, 26, 3, 0.9)",
          border: "1px solid rgba(245, 158, 11, 0.5)",
          color: "#fef3c7",
          borderRadius: "14px",
        }}
      >
        <div className="d-flex align-items-center gap-3">
          <i className="bi bi-exclamation-triangle-fill fs-4 text-warning" />
          <div>
            <strong>Unsupported Blockchain Network ({chainName || "Unknown"})</strong>
            <div className="small opacity-90">
              Please switch your MetaMask network to Hardhat Localhost (Chain ID 31337) or Sepolia to register files.
            </div>
          </div>
        </div>
        <Button
          variant="warning"
          size="sm"
          className="fw-bold px-3 py-2 text-dark text-nowrap align-self-start align-self-md-center"
          onClick={() => switchNetwork(DEFAULT_CHAIN_ID)}
        >
          Switch to Hardhat Localhost
        </Button>
      </Alert>
    </Container>
  );
}
