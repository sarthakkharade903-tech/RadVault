import React from "react";

export default function RecordCard({ record, onSelect }) {
  const getModalityColor = (modality) => {
    switch (modality) {
      case "MRI":
        return "#38bdf8";
      case "CT Scan":
        return "#a855f7";
      case "X-Ray":
        return "#10b981";
      case "Ultrasound":
        return "#06b6d4";
      case "Lab Report":
        return "#f59e0b";
      default:
        return "var(--rv-primary)";
    }
  };

  const handleDownload = (e) => {
    e.stopPropagation();
    alert(`Downloading package for "${record.title}" (${record.fileType}, ${record.fileSize})`);
  };

  return (
    <div className="rv-record-card" onClick={() => onSelect(record)} style={{ cursor: "pointer" }}>
      <div className="rv-record-thumb-container">
        <img
          src={record.previewUrl}
          alt={record.title}
          className="rv-record-img"
          loading="lazy"
        />

        <span
          className="rv-modality-badge"
          style={{ borderColor: getModalityColor(record.modality), color: getModalityColor(record.modality) }}
        >
          {record.modality}
        </span>

        <span className="rv-risk-badge rv-status-normal">
          ● {record.aiTriageRisk}
        </span>
      </div>

      <div className="rv-record-body">
        <div>
          <h4 className="rv-record-title">{record.title}</h4>

          <div className="rv-record-meta-list">
            <div className="rv-record-meta-row">
              <span>📍 Region:</span>
              <strong style={{ color: "#e2e8f0" }}>{record.bodyRegion}</strong>
            </div>

            <div className="rv-record-meta-row">
              <span>📅 Date:</span>
              <span>{record.date} ({record.time})</span>
            </div>

            <div className="rv-record-meta-row">
              <span>👨‍⚕️ Ordering Dr:</span>
              <span>{record.doctor}</span>
            </div>

            <div className="rv-record-meta-row">
              <span>🏥 Facility:</span>
              <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {record.facility}
              </span>
            </div>

            <div className="rv-record-meta-row" style={{ marginTop: "0.2rem", fontSize: "0.75rem", color: "var(--rv-text-dim)" }}>
              <span>📦 {record.fileType} • {record.fileSize}</span>
            </div>
          </div>
        </div>

        <div className="rv-record-actions">
          <button
            className="rv-btn"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(record);
            }}
          >
            🔍 View Scan & Report
          </button>

          <button
            className="rv-btn rv-btn-secondary"
            style={{ flex: "initial", padding: "0.6rem 0.8rem" }}
            title="Download record"
            onClick={handleDownload}
          >
            ⬇
          </button>
        </div>
      </div>
    </div>
  );
}
