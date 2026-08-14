import React, { createContext, useContext, useState, useRef, useEffect } from "react";
import "../styles/ConfirmModal.css";

const ConfirmModalContext = createContext(null);

export function ConfirmModalProvider({ children }) {
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: "Confirm Action",
    message: "Are you sure you want to proceed?",
    confirmText: "Confirm",
    cancelText: "Cancel",
    isDanger: true,
  });

  const resolverRef = useRef(null);
  const confirmButtonRef = useRef(null);

  const confirm = ({
    title = "Confirm Action",
    message = "Are you sure you want to proceed?",
    confirmText = "Confirm",
    cancelText = "Cancel",
    isDanger = true,
  }) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setModalState({
        isOpen: true,
        title,
        message,
        confirmText,
        cancelText,
        isDanger,
      });
    });
  };

  const handleConfirm = () => {
    if (resolverRef.current) resolverRef.current(true);
    setModalState((prev) => ({ ...prev, isOpen: false }));
  };

  const handleCancel = () => {
    if (resolverRef.current) resolverRef.current(false);
    setModalState((prev) => ({ ...prev, isOpen: false }));
  };

  // Keyboard support: Esc to cancel, Enter to confirm, focus trapping
  useEffect(() => {
    if (!modalState.isOpen) return;

    confirmButtonRef.current?.focus();

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleCancel();
      } else if (e.key === "Enter" && document.activeElement === confirmButtonRef.current) {
        e.preventDefault();
        handleConfirm();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [modalState.isOpen]);

  return (
    <ConfirmModalContext.Provider value={confirm}>
      {children}
      {modalState.isOpen && (
        <div
          className="confirm-modal-overlay"
          onClick={handleCancel}
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-modal-title"
          aria-describedby="confirm-modal-desc"
        >
          <div
            className="confirm-modal-box"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="confirm-modal-header">
              <div
                className={`confirm-modal-icon ${
                  modalState.isDanger ? "confirm-modal-icon--danger" : "confirm-modal-icon--info"
                }`}
              >
                {modalState.isDanger ? "⚠" : "ℹ"}
              </div>
              <h3 id="confirm-modal-title" className="confirm-modal-title">
                {modalState.title}
              </h3>
            </div>

            <p id="confirm-modal-desc" className="confirm-modal-message">
              {modalState.message}
            </p>

            <div className="confirm-modal-actions">
              <button
                className="confirm-modal-btn confirm-modal-btn--cancel"
                onClick={handleCancel}
                type="button"
              >
                {modalState.cancelText}
              </button>
              <button
                ref={confirmButtonRef}
                className={`confirm-modal-btn ${
                  modalState.isDanger
                    ? "confirm-modal-btn--danger"
                    : "confirm-modal-btn--confirm"
                }`}
                onClick={handleConfirm}
                type="button"
              >
                {modalState.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmModalContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmModalContext);
  if (!context) {
    throw new Error("useConfirm must be used within a ConfirmModalProvider");
  }
  return context;
}
