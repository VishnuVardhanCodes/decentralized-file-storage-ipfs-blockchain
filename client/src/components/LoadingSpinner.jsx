import React from "react";

export default function LoadingSpinner({ label = "Loading on-chain data..." }) {
  return (
    <div className="d-flex flex-column align-items-center justify-content-center py-5 fade-in">
      <div
        className="spinner-border text-info mb-3"
        role="status"
        style={{ width: "3rem", height: "3rem", borderWidth: "0.25em" }}
      >
        <span className="visually-hidden">Loading...</span>
      </div>
      <p className="text-secondary small fw-medium" style={{ letterSpacing: "0.02em" }}>
        {label}
      </p>
    </div>
  );
}
