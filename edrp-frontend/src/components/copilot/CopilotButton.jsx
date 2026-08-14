import React from "react";
import "./CopilotDrawer.css";

function CopilotButton({ isOpen = false, onClick }) {
  const handleClick = (e) => {
    e.stopPropagation();
    if (onClick) {
      onClick();
    } else {
      window.dispatchEvent(new CustomEvent("toggle-copilot-drawer"));
    }
  };

  return (
    <button
      className={`copilot-floating-btn ${isOpen ? "copilot-floating-btn--active" : ""}`}
      onClick={handleClick}
      title="Open EDRP Copilot Assistant"
      type="button"
      aria-label="Open Copilot Assistant"
    >
      <img
        src="/copilot-icon.png"
        alt="EDRP Copilot"
        className="copilot-floating-btn__icon"
      />
      <span className="copilot-floating-btn__badge" />
    </button>
  );
}

export default CopilotButton;


