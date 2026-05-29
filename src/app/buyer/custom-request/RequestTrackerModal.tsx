// RequestTrackerModal.tsx — Full-screen modal wrapper for the Request Tracker.
// Opens when buyer clicks the FAB button. Closes on overlay click or Escape key.
// Renders RequestTracker content inside a scrollable dark modal panel.

"use client";

import { useEffect } from "react";
import RequestTracker from "./RequestTracker";
import "./request-tracker-modal.css";

interface Props {
  onClose: () => void;
}

export default function RequestTrackerModal({ onClose }: Props) {
  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div className="rtModalOverlay" onClick={onClose}>
      <div className="rtModalPanel" onClick={e => e.stopPropagation()}>

        {/* Modal header */}
        <div className="rtModalHeader">
          <div className="rtModalHeaderLeft">
            <p className="rtModalEyebrow">Your Submissions</p>
            <h2 className="rtModalTitle">Request Tracker</h2>
          </div>
          <button className="rtModalClose" onClick={onClose} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Request Tracker content — rendered inside modal body */}
        <div className="rtModalBody">
          <RequestTracker isModal />
        </div>

      </div>
    </div>
  );
}
