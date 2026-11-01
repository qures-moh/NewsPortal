import React, { useEffect } from "react";
import { AlertTriangle, Trash2, Info, X } from "lucide-react";
import "./ConfirmModal.css";

const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed with this action?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger", // 'danger' | 'warning' | 'primary'
  isLoading = false,
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen || isLoading) return;
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const renderIcon = () => {
    switch (variant) {
      case "danger":
        return <Trash2 size={20} />;
      case "warning":
        return <AlertTriangle size={20} />;
      case "primary":
      default:
        return <Info size={20} />;
    }
  };

  return (
    <div
      className="confirm-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div className="confirm-modal-box">
        <div className="confirm-modal-header">
          <div className={`confirm-modal-icon-badge ${variant}`}>
            {renderIcon()}
          </div>

          <div className="confirm-modal-title-wrap">
            <h3 id="confirm-modal-title">{title}</h3>
          </div>

          <button
            type="button"
            className="confirm-modal-close-btn"
            onClick={onClose}
            disabled={isLoading}
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        <div className="confirm-modal-body">
          {typeof message === "string" ? <p>{message}</p> : message}
        </div>

        <div className="confirm-modal-actions">
          <button
            type="button"
            className="confirm-btn-cancel"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </button>

          <button
            type="button"
            className={`confirm-btn-action ${variant}`}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading && <span className="confirm-spinner" />}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
