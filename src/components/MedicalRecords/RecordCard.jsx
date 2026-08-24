import React from "react";

// ─── Modality metadata: icon, readable type label, light background colour ────
function getModalityInfo(modality) {
  switch (modality) {
    case "MRI":
      return { icon: "🧠", label: "MRI Scan", bg: "#EFF6FF", labelColor: "#1d4ed8" };
    case "CT Scan":
      return { icon: "🔄", label: "CT Scan", bg: "#F5F3FF", labelColor: "#7c3aed" };
    case "X-Ray":
      return { icon: "🩻", label: "X-Ray", bg: "#F0FDF4", labelColor: "#15803d" };
    case "Ultrasound":
      return { icon: "🌊", label: "Ultrasound", bg: "#ECFEFF", labelColor: "#0e7490" };
    case "Lab Report":
      return { icon: "🧪", label: "Lab Report", bg: "#FFFBEB", labelColor: "#b45309" };
    case "Cardiology":
      return { icon: "❤️", label: "Cardiology", bg: "#FFF1F2", labelColor: "#be123c" };
    case "Prescription":
      return { icon: "💊", label: "Prescription", bg: "#F0FDF4", labelColor: "#15803d" };
    default:
      return { icon: "📄", label: "Document", bg: "#F8FAFC", labelColor: "#475569" };
  }
}

// ─── Context-aware primary action label ──────────────────────────────────────
function getViewLabel(modality) {
  switch (modality) {
    case "MRI":
    case "CT Scan":
    case "X-Ray":
    case "Ultrasound":
    case "Cardiology":
      return "View Scan & Report";
    case "Lab Report":
      return "View Report";
    case "Prescription":
      return "View Prescription";
    default:
      return "View Record";
  }
}

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

// ─── RecordCard ───────────────────────────────────────────────────────────────
export default function RecordCard({ record, onSelect }) {
  const { icon, label, bg, labelColor } = getModalityInfo(record.modality);
  const formattedDate = formatDate(record.date);

  return (
    <div
      className="rv-record-card"
      onClick={() => onSelect(record)}
      style={{ cursor: "pointer" }}
      role="button"
      tabIndex={0}
      aria-label={`${record.title} — ${label}, ${formattedDate || ""}`}
      onKeyDown={(e) => e.key === "Enter" && onSelect(record)}
    >
      {/* ── Icon Header (replaces stock-photo thumbnail) ── */}
      <div
        className="rv-record-icon-header"
        style={{ background: bg }}
        aria-hidden="true"
      >
        <span className="rv-record-icon-symbol">{icon}</span>
        <span
          className="rv-record-type-label"
          style={{ color: labelColor, borderColor: `${labelColor}30` }}
        >
          {label}
        </span>
      </div>

      {/* ── Card Body ── */}
      <div className="rv-record-body">

        {/* Priority 1: Title */}
        <h4 className="rv-record-title">{record.title}</h4>

        {/* Priority 2: Body region (teal, compact) — only if available */}
        {record.bodyRegion && (
          <p className="rv-record-region">{record.bodyRegion}</p>
        )}

        {/* Priority 3–5: Compact metadata list */}
        <div className="rv-record-meta-list">

          {/* Date — always shown if available */}
          {formattedDate && (
            <div className="rv-record-meta-row rv-meta-date">
              <span className="rv-meta-icon" aria-hidden="true">📅</span>
              <span className="rv-meta-text">{formattedDate}</span>
            </div>
          )}

          {/* Facility — conditional, never shows "undefined" */}
          {record.facility && (
            <div className="rv-record-meta-row">
              <span className="rv-meta-icon" aria-hidden="true">🏥</span>
              <span className="rv-meta-text" title={record.facility}>
                {record.facility}
              </span>
            </div>
          )}

          {/* Doctor — conditional, never shows "undefined" */}
          {record.doctor && (
            <div className="rv-record-meta-row">
              <span className="rv-meta-icon" aria-hidden="true">👨‍⚕️</span>
              <span className="rv-meta-text" title={record.doctor}>
                {record.doctor}
              </span>
            </div>
          )}

        </div>

        {/* Priority 6: Single context-aware primary action */}
        <div className="rv-record-actions">
          <button
            className="rv-btn"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(record);
            }}
            aria-label={`${getViewLabel(record.modality)}: ${record.title}`}
          >
            {getViewLabel(record.modality)}
          </button>
        </div>

      </div>
    </div>
  );
}
