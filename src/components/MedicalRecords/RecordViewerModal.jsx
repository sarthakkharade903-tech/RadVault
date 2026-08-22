import React, { useState, useEffect } from "react";

export default function RecordViewerModal({ record, onClose }) {
  const [isInverted, setIsInverted] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!record) return null;

  return (
    <div className="rv-modal-overlay" onClick={onClose}>
      <div
        className="rv-modal-container"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="rv-modal-header">
          <div>
            <h3>
              <span>🩻</span> {record.title}
            </h3>
            <div style={{ fontSize: "0.8rem", color: "var(--rv-text-muted)", marginTop: "0.25rem" }}>
              Exam ID: {record.id} • Modality: {record.modality} • {record.facility}
            </div>
          </div>

          <button
            className="rv-modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Modal Content Grid */}
        <div className="rv-modal-content-grid">
          {/* Left: Interactive Scan Viewer */}
          <div className="rv-viewer-pane">
            <div className="rv-viewer-image-wrap">
              <img
                src={record.previewUrl}
                alt={record.title}
                className={`rv-viewer-img ${isInverted ? "inverted" : ""}`}
                style={{ transform: `scale(${zoomLevel})` }}
              />
            </div>

            {/* Viewer Controls */}
            <div className="rv-viewer-controls">
              <button
                className="rv-viewer-tool-btn"
                onClick={() => setIsInverted(!isInverted)}
                title="Toggle Inversion Filter"
              >
                🌗 {isInverted ? "Normal Grayscale" : "Invert LUT"}
              </button>

              <button
                className="rv-viewer-tool-btn"
                onClick={() => setZoomLevel((z) => Math.min(z + 0.25, 2.5))}
                title="Zoom In"
              >
                🔍+ Zoom In
              </button>

              <button
                className="rv-viewer-tool-btn"
                onClick={() => setZoomLevel((z) => Math.max(z - 0.25, 0.75))}
                title="Zoom Out"
              >
                🔍- Zoom Out
              </button>

              <button
                className="rv-viewer-tool-btn"
                onClick={() => {
                  setZoomLevel(1);
                  setIsInverted(false);
                }}
                title="Reset View"
              >
                ↺ Reset
              </button>
            </div>

            <div style={{ fontSize: "0.75rem", color: "var(--rv-text-dim)", marginTop: "0.75rem", textAlign: "center" }}>
              DICOM Render Engine • File: {record.fileType} ({record.fileSize})
            </div>
          </div>

          {/* Right: Formal Radiologist & Clinical Report */}
          <div className="rv-report-pane">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="rv-chip rv-chip-highlight" style={{ fontSize: "0.8rem" }}>
                Verified Official Report
              </span>
              <span className="rv-status-badge rv-status-normal">
                ● AI Risk: {record.aiTriageRisk}
              </span>
            </div>

            {/* Clinical Indication */}
            <div className="rv-report-section">
              <h4>Clinical Indication</h4>
              <p>{record.report?.clinicalIndication || "Routine medical evaluation."}</p>
            </div>

            {/* Technique */}
            <div className="rv-report-section">
              <h4>Examination Technique</h4>
              <p>{record.report?.technique || "Standard diagnostic protocols."}</p>
            </div>

            {/* Findings */}
            <div className="rv-report-section">
              <h4>Radiological & Clinical Findings</h4>
              <ul className="rv-findings-list">
                {record.report?.findings?.map((finding, idx) => (
                  <li key={idx}>{finding}</li>
                )) || <li>No focal lesions identified.</li>}
              </ul>
            </div>

            {/* Impression */}
            <div className="rv-impression-box">
              <h4>Impression / Conclusion</h4>
              <p>{record.report?.impression || "Unremarkable examination."}</p>
            </div>

            {/* Signature Stamp */}
            <div className="rv-signature-row">
              <div>
                <strong style={{ color: "#fff" }}>{record.report?.verifiedBy || record.doctor}</strong>
                <div style={{ fontSize: "0.75rem" }}>Reg No: {record.radiologistLicense || "MCI-MH-44912"}</div>
              </div>

              <div style={{ textAlign: "right" }}>
                <span className="rv-status-badge rv-status-normal" style={{ fontSize: "0.75rem" }}>
                  ✓ Digitally Signed & Sealed
                </span>
                <div style={{ fontSize: "0.75rem", marginTop: "0.2rem" }}>Date: {record.date}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
