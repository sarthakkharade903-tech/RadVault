import React, { useState, useEffect } from "react";
import { generateMedicalRecordPdf } from "../../utils/generateMedicalRecordPdf";
import ShareModal from "./ShareModal";

// ─── Format "2026-07-22" → "22 Jul 2026" ─────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return null;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  const [year, month, day] = parts;
  return `${parseInt(day, 10)} ${months[parseInt(month, 10) - 1]} ${year}`;
}

// ─── Human-readable modality label ───────────────────────────────────────────
function getModalityLabel(modality) {
  const labels = {
    "MRI": "MRI Scan",
    "CT Scan": "CT Scan",
    "X-Ray": "X-Ray",
    "Ultrasound": "Ultrasound",
    "Lab Report": "Lab Report",
    "Cardiology": "Cardiology",
    "Prescription": "Prescription",
  };
  return labels[modality] || modality || "Document";
}

// ─── Neutral, honest image preview caption ───────────────────────────────────
function getPreviewCaption(modality) {
  const captions = {
    "MRI": "MRI image preview",
    "CT Scan": "CT image preview",
    "X-Ray": "X-ray image preview",
    "Ultrasound": "Ultrasound image preview",
    "Cardiology": "Cardiology image preview",
    "Lab Report": "Lab report document",
    "Prescription": "Prescription document",
  };
  return captions[modality] || "Medical image preview";
}

// ─── Section heading adapts to modality ──────────────────────────────────────
function getFindingsHeading(modality) {
  if (modality === "Lab Report") return "Test Results";
  if (modality === "Prescription") return "Prescription Details";
  if (modality === "Cardiology") return "Cardiology Findings";
  return "Findings";
}

// ─── Plain-language section heading adapts to modality ───────────────────────
function getPlainHeading(modality) {
  if (modality === "Lab Report") return "What your results mean";
  if (modality === "Prescription") return "About this prescription";
  if (modality === "Cardiology") return "In simple words";
  return "In simple words";
}

// ─── Whether the record type has an image to show ────────────────────────────
function isImagingRecord(modality) {
  return ["MRI", "CT Scan", "X-Ray", "Ultrasound", "Cardiology"].includes(modality);
}

// ─── RecordViewerModal ────────────────────────────────────────────────────────
export default function RecordViewerModal({ record, onClose, patient = {}, onOpenWhoHasAccess }) {
  const [isInverted, setIsInverted] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);

  // Reset controls when a different record opens
  useEffect(() => {
    setIsInverted(false);
    setZoomLevel(1);
    setDownloadError(null);
    setShowShareModal(false);
  }, [record?.id]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // ── Download handler ──────────────────────────────────────────────────────
  const handleDownload = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    setDownloadError(null);
    try {
      await generateMedicalRecordPdf(record, {
        name: patient.fullName || patient.name || "Patient",
        id:   patient.id       || patient.abhaId || "",
      });
    } catch (err) {
      console.error("PDF generation failed:", err);
      setDownloadError("Unable to prepare the PDF. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  if (!record) return null;

  const modalityLabel  = getModalityLabel(record.modality);
  const previewCaption = getPreviewCaption(record.modality);
  const plainHeading   = getPlainHeading(record.modality);
  const formattedDate  = formatDate(record.date);
  const showImagePane  = isImagingRecord(record.modality);
  const findingsHead   = getFindingsHeading(record.modality);
  const doctorName     = record.report?.verifiedBy || record.doctor;

  return (
    <div
      className="rv-modal-overlay"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="rv-modal-container"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`${record.title} — ${modalityLabel}`}
      >

        {/* ── Modal Header ── */}
        <div className="rv-modal-header">
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3>{record.title}</h3>
            <div className="rv-modal-header-meta">
              <span className="rv-modal-type-chip">{modalityLabel}</span>
              {formattedDate && (
                <span className="rv-modal-header-detail">{formattedDate}</span>
              )}
              {record.facility && (
                <>
                  <span className="rv-modal-header-detail" aria-hidden="true">·</span>
                  <span className="rv-modal-header-detail">{record.facility}</span>
                </>
              )}
            </div>
          </div>
          <button
            className="rv-modal-close-btn"
            onClick={onClose}
            aria-label="Close record viewer"
          >
            ✕
          </button>
        </div>

        {/* ── Modal Content ── */}
        <div className="rv-modal-content-grid">

          {/* ── Left: Image preview pane (imaging only) ── */}
          {showImagePane && (
            <div className="rv-viewer-pane">
              <div className="rv-viewer-image-wrap">
                <img
                  src={record.previewUrl}
                  alt={`${record.title} preview image`}
                  className={`rv-viewer-img${isInverted ? " inverted" : ""}`}
                  style={{ transform: `scale(${zoomLevel})` }}
                />
              </div>

              <div className="rv-viewer-controls">
                <button
                  className="rv-viewer-tool-btn"
                  onClick={() => setIsInverted((v) => !v)}
                  aria-label={isInverted ? "Show normal colours" : "Invert image colours"}
                >
                  {isInverted ? "Normal View" : "Invert Colours"}
                </button>
                <button
                  className="rv-viewer-tool-btn"
                  onClick={() => setZoomLevel((z) => Math.min(z + 0.25, 2.5))}
                  aria-label="Zoom in"
                  disabled={zoomLevel >= 2.5}
                >
                  + Zoom In
                </button>
                <button
                  className="rv-viewer-tool-btn"
                  onClick={() => setZoomLevel((z) => Math.max(z - 0.25, 0.75))}
                  aria-label="Zoom out"
                  disabled={zoomLevel <= 0.75}
                >
                  − Zoom Out
                </button>
                <button
                  className="rv-viewer-tool-btn"
                  onClick={() => { setZoomLevel(1); setIsInverted(false); }}
                  aria-label="Reset image to original view"
                >
                  Reset
                </button>
              </div>

              <p className="rv-viewer-caption">{previewCaption}</p>
            </div>
          )}

          {/* ── Right: Report pane ── */}
          <div
            className="rv-report-pane"
            style={!showImagePane ? { gridColumn: "1 / -1" } : undefined}
          >

            {/* ── STEP 3: Patient-friendly explanation ── */}
            <div className="rv-plain-summary">
              <p className="rv-plain-summary-heading">{plainHeading}</p>
              <p className="rv-plain-summary-sub">
                A simpler explanation based on the official report below.
              </p>

              {record.patientFriendlySummary ? (
                <p className="rv-plain-summary-text">
                  {record.patientFriendlySummary}
                </p>
              ) : (
                <p className="rv-plain-summary-empty">
                  Patient-friendly explanation is not available for this record yet.
                  Please refer to the official report below or speak with your
                  healthcare provider.
                </p>
              )}

              <p className="rv-plain-summary-disclaimer">
                This explanation is based on the official report. It is not a medical
                diagnosis or medical advice.
              </p>
            </div>

            {/* ── Divider between explanation and official report ── */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              margin: "0.25rem 0",
            }}>
              <div style={{ flex: 1, height: "1px", background: "#E2E8F0" }} />
              <span style={{
                fontSize: "0.7rem",
                fontWeight: 800,
                letterSpacing: "0.07em",
                textTransform: "uppercase",
                color: "var(--rv-text-dim)",
                whiteSpace: "nowrap",
              }}>
                Official Report
              </span>
              <div style={{ flex: 1, height: "1px", background: "#E2E8F0" }} />
            </div>

            {/* ── Official report — unchanged, always shown ── */}
            <span className="rv-report-label">Official Report</span>

            {record.report?.clinicalIndication && (
              <div className="rv-report-section">
                <h4>Clinical Indication</h4>
                <p>{record.report.clinicalIndication}</p>
              </div>
            )}

            {record.report?.technique && (
              <div className="rv-report-section">
                <h4>Examination Technique</h4>
                <p>{record.report.technique}</p>
              </div>
            )}

            {record.report?.findings?.length > 0 && (
              <div className="rv-report-section">
                <h4>{findingsHead}</h4>
                <ul className="rv-findings-list">
                  {record.report.findings.map((finding, idx) => (
                    <li key={idx}>{finding}</li>
                  ))}
                </ul>
              </div>
            )}

            {record.report?.impression && (
              <div className="rv-impression-box">
                <h4>Impression / Conclusion</h4>
                <p>{record.report.impression}</p>
              </div>
            )}

            {(doctorName || record.radiologistLicense || formattedDate) && (
              <div className="rv-signature-row">
                <div>
                  {doctorName && (
                    <div className="rv-signature-name">{doctorName}</div>
                  )}
                  {record.radiologistLicense && (
                    <div className="rv-signature-reg">
                      Reg. No: {record.radiologistLicense}
                    </div>
                  )}
                </div>
                {formattedDate && (
                  <div className="rv-signature-date">Date: {formattedDate}</div>
                )}
              </div>
            )}

            {/* ── Actions: Share with Doctor & Download Record ── */}
            <div className="rv-viewer-actions-group">
              <button
                type="button"
                className="rv-btn rv-btn-share"
                onClick={() => setShowShareModal(true)}
                aria-label={`Share ${record.title} with a doctor`}
              >
                🔗 Share with Doctor
              </button>

              <button
                type="button"
                className="rv-btn rv-btn-secondary"
                onClick={handleDownload}
                disabled={isDownloading}
                aria-label={isDownloading ? "Preparing PDF download" : "Download this record as a PDF"}
                style={{
                  opacity: isDownloading ? 0.75 : 1,
                  cursor: isDownloading ? "wait" : "pointer",
                }}
              >
                {isDownloading ? "Preparing PDF…" : "📥 Download Record"}
              </button>

              {downloadError && (
                <p style={{
                  marginTop: "0.5rem",
                  fontSize: "0.8rem",
                  color: "var(--rv-error, #D32F2F)",
                  textAlign: "center",
                  width: "100%",
                }}>
                  {downloadError}
                </p>
              )}
            </div>

          </div>
        </div>

        {/* ── Step 5: Patient-Controlled Sharing Modal ── */}
        {showShareModal && (
          <ShareModal
            isOpen={showShareModal}
            onClose={() => setShowShareModal(false)}
            initialRecord={record}
            patient={patient}
            onViewAccess={() => {
              setShowShareModal(false);
              onClose();
              if (onOpenWhoHasAccess) {
                onOpenWhoHasAccess();
              }
            }}
          />
        )}
      </div>
    </div>
  );
}
