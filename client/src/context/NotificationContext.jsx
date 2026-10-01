import React, { createContext, useContext, useState, useCallback } from "react";
import { Toast, ToastContainer } from "react-bootstrap";

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addNotification = useCallback((message, type = "info", title = "", duration = 6000) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [
      ...prev,
      {
        id,
        message,
        type, // 'success' | 'danger' | 'warning' | 'info'
        title: title || (type === "danger" ? "Error" : type === "success" ? "Success" : "Notification"),
      },
    ]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeNotification = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showSuccess = useCallback(
    (msg, title = "Operation Successful") => addNotification(msg, "success", title),
    [addNotification]
  );

  const showError = useCallback(
    (msg, title = "Action Failed") => addNotification(msg, "danger", title, 8000),
    [addNotification]
  );

  const showWarning = useCallback(
    (msg, title = "Attention") => addNotification(msg, "warning", title),
    [addNotification]
  );

  const showInfo = useCallback(
    (msg, title = "Information") => addNotification(msg, "info", title),
    [addNotification]
  );

  const getVariantStyles = (type) => {
    switch (type) {
      case "success":
        return {
          bg: "#052e16",
          border: "rgba(16, 185, 129, 0.4)",
          color: "#34d399",
          icon: "bi-check-circle-fill",
        };
      case "danger":
        return {
          bg: "#450a0a",
          border: "rgba(239, 68, 68, 0.4)",
          color: "#f87171",
          icon: "bi-exclamation-triangle-fill",
        };
      case "warning":
        return {
          bg: "#451a03",
          border: "rgba(245, 158, 11, 0.4)",
          color: "#fbbf24",
          icon: "bi-exclamation-circle-fill",
        };
      default:
        return {
          bg: "#0c1b33",
          border: "rgba(59, 130, 246, 0.4)",
          color: "#60a5fa",
          icon: "bi-info-circle-fill",
        };
    }
  };

  return (
    <NotificationContext.Provider
      value={{ showSuccess, showError, showWarning, showInfo, addNotification }}
    >
      {children}
      <ToastContainer
        position="top-end"
        className="p-3"
        style={{ zIndex: 9999, position: "fixed", top: "70px", right: "20px" }}
      >
        {toasts.map((toast) => {
          const style = getVariantStyles(toast.type);
          return (
            <Toast
              key={toast.id}
              onClose={() => removeNotification(toast.id)}
              className="fade-in mb-3 shadow-lg"
              style={{
                backgroundColor: style.bg,
                border: `1px solid ${style.border}`,
                borderRadius: "14px",
                color: "#ffffff",
                minWidth: "320px",
                maxWidth: "420px",
                backdropFilter: "blur(12px)",
              }}
            >
              <Toast.Header
                style={{
                  backgroundColor: "transparent",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                  color: style.color,
                }}
                closeButton={true}
                closeVariant="white"
              >
                <i className={`bi ${style.icon} me-2 fs-6`} />
                <strong className="me-auto" style={{ fontFamily: "var(--font-heading)" }}>
                  {toast.title}
                </strong>
                <small style={{ color: "rgba(255,255,255,0.5)" }}>just now</small>
              </Toast.Header>
              <Toast.Body style={{ color: "#e2e8f0", fontSize: "0.92rem", lineHeight: "1.4" }}>
                {toast.message}
              </Toast.Body>
            </Toast>
          );
        })}
      </ToastContainer>
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification must be used within a NotificationProvider");
  }
  return context;
}
