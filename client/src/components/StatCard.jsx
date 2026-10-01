import React from "react";

export default function StatCard({ title, value, icon, badge, subtitle, accentColor = "#3b82f6" }) {
  return (
    <div className="glass-panel p-4 h-100 position-relative overflow-hidden glass-panel-hover">
      {/* Decorative background glow */}
      <div
        style={{
          position: "absolute",
          top: "-30px",
          right: "-30px",
          width: "110px",
          height: "110px",
          background: accentColor,
          opacity: 0.12,
          filter: "blur(28px)",
          borderRadius: "50%",
          pointerEvents: "none",
        }}
      />

      <div className="d-flex justify-content-between align-items-start mb-3">
        <span className="text-secondary small fw-medium text-uppercase" style={{ letterSpacing: "0.05em" }}>
          {title}
        </span>
        <div
          style={{
            width: "42px",
            height: "42px",
            borderRadius: "12px",
            background: `rgba(${
              accentColor.startsWith("#") ? "59, 130, 246" : accentColor
            }, 0.15)`,
            border: `1px solid rgba(255, 255, 255, 0.1)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: accentColor,
            fontSize: "1.25rem",
          }}
        >
          <i className={`bi ${icon}`} />
        </div>
      </div>

      <div className="d-flex align-items-baseline gap-2 mb-1">
        <h3 className="text-white mb-0 fw-bold fs-2" style={{ fontFamily: "var(--font-heading)" }}>
          {value}
        </h3>
        {badge && (
          <span className="badge-web3" style={{ fontSize: "0.72rem", padding: "2px 8px" }}>
            {badge}
          </span>
        )}
      </div>

      {subtitle && <p className="text-secondary small mb-0 mt-2">{subtitle}</p>}
    </div>
  );
}
