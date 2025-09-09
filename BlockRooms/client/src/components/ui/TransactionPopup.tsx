import React from "react";

interface TransactionPopupProps {
  isVisible: boolean;
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
}

export const TransactionPopup: React.FC<TransactionPopupProps> = ({
  isVisible,
  isLoading,
  error,
  onClose,
}) => {
  if (!isVisible) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 20,                 // top-right as per new UI
        right: 20,
        zIndex: 3000,
        backgroundColor: "rgba(0, 0, 0, 0.9)",
        border: "2px solid #444",
        borderRadius: 8,
        padding: 20,
        color: "white",
        fontFamily: "monospace",
        minWidth: 300,
        textAlign: "center",
      }}
    >
      {isLoading && (
        <>
          <div style={{ marginBottom: 10, color: "#E1CF48" }}>
            🔄 Processing Movement Transaction.
          </div>
          <div style={{ fontSize: 12, color: "#ccc" }}>
            Updating blockchain position
          </div>
        </>
      )}

      {error && (
        <>
          <div style={{ marginBottom: 10, color: "#ff6666" }}>
            ❌ Transaction Failed
          </div>
          <div style={{ fontSize: 12, color: "#ccc", marginBottom: 15 }}>
            {error}
          </div>
          <div style={{ fontSize: 12, color: "#ffaa00" }}>
            Position reverted to last verified location
          </div>
          <button
            onClick={onClose}
            style={{
              marginTop: 15,
              backgroundColor: "#444",
              color: "white",
              border: "none",
              padding: "8px 16px",
              borderRadius: 4,
              cursor: "pointer",
            }}
          >
            Close
          </button>
        </>
      )}
    </div>
  );
};
