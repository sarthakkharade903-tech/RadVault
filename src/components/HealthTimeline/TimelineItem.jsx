import React, { useState } from "react";

export default function TimelineItem({ event, onViewRecord }) {
  const [expanded, setExpanded] = useState(false);

  const getNodeIcon = (category) => {
    switch (category) {
      case "radiology":
        return "🩻";
      case "labs":
        return "🧪";
      case "consultation":
        return "🩺";
      default:
        return "📌";
    }
  };

  const getCategoryClass = (category) => {
    switch (category) {
      case "radiology":
        return "radiology";
      case "labs":
        return "labs";
      case "consultation":
        return "consultation";
      default:
        return "";
    }
  };

  return (
    <div className="rv-timeline-item">
      <div className={`rv-timeline-node ${getCategoryClass(event.category)}`}>
        {getNodeIcon(event.category)}
      </div>

      <div className="rv-timeline-card">
        <div className="rv-timeline-header">
          <div className="rv-timeline-date">
            <span>📅 {event.date}</span>
            <span>•</span>
            <span>⏰ {event.time}</span>
          </div>

          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <span className="rv-chip rv-chip-highlight" style={{ fontSize: "0.75rem" }}>
              {event.categoryLabel}
            </span>
            <span className="rv-status-badge rv-status-normal" style={{ fontSize: "0.75rem" }}>
              ● {event.status}
            </span>
          </div>
        </div>

        <h4 className="rv-timeline-title">{event.title}</h4>

        <div className="rv-timeline-doctor">
          🏥 {event.facility} &nbsp;•&nbsp; 👨‍⚕️ {event.doctor}
        </div>

        <p className="rv-timeline-summary">{event.summary}</p>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.75rem" }}>
          <button
            className="rv-btn-link"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? "▲ Hide Clinical Details" : "▼ Show Full Details & Notes"}
          </button>

          {event.recordId && (
            <button
              className="rv-btn rv-btn-secondary"
              style={{ padding: "0.35rem 0.75rem", fontSize: "0.8rem", flex: "initial" }}
              onClick={() => onViewRecord && onViewRecord(event.recordId)}
            >
              📄 Open Vault Record &rarr;
            </button>
          )}
        </div>

        {expanded && (
          <div className="rv-timeline-drawer">
            <div style={{ fontWeight: 600, color: "var(--rv-text-main)", marginBottom: "0.35rem" }}>
              Detailed Clinical Assessment:
            </div>
            <div>{event.details}</div>
          </div>
        )}
      </div>
    </div>
  );
}
