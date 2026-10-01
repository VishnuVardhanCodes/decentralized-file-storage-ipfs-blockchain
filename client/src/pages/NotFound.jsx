import React from "react";
import { Container, Button } from "react-bootstrap";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <Container className="py-5 text-center fade-in">
      <div className="glass-panel p-5 mx-auto" style={{ maxWidth: "560px" }}>
        <div className="text-info fs-1 mb-2 font-mono fw-bold">404</div>
        <h3 className="text-white fw-bold mb-2">Block or Route Not Found</h3>
        <p className="text-secondary small mb-4">
          The requested page or resource could not be found on the DeFileChain network.
        </p>
        <div className="d-flex justify-content-center gap-2">
          <Button as={Link} to="/" className="btn-gradient-primary">
            <i className="bi bi-house-door" /> Return Home
          </Button>
          <Button as={Link} to="/dashboard" className="btn-outline-web3">
            <i className="bi bi-speedometer2" /> Dashboard
          </Button>
        </div>
      </div>
    </Container>
  );
}
